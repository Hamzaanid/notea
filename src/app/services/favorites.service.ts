import { Injectable, inject, NgZone } from '@angular/core';
import { 
  Firestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs,
  collectionData,
  query,
  orderBy
} from '@angular/fire/firestore';
import { Auth, authState, User } from '@angular/fire/auth';
import { BehaviorSubject, Subscription } from 'rxjs';

/**
 * Interface complète pour un favori stocké en base
 * Contient toutes les infos nécessaires pour l'affichage
 */
export interface FavoriteProduct {
  // Identifiants
  productId: string;
  skuId: string;
  
  // Infos produit pour l'affichage
  brandName: string;
  displayName: string;
  heroImage: string;
  altImage?: string;
  rating: string;
  reviews: string;
  price: string;
  targetUrl: string;
  
  // Badges
  isNew: boolean;
  isLimitedEdition: boolean;
  isSephoraExclusive: boolean;
  
  // Métadonnées
  addedAt: Date;
}

/**
 * Interface pour le document utilisateur (structure évolutive)
 * Préparé pour les futures fonctionnalités (profil, personnalité, etc.)
 */
export interface UserDocument {
  // Infos de base
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Futures fonctionnalités (personnalité pour recommandations)
  // personality?: {
  //   scentFamily?: string;
  //   intensity?: string;
  //   occasions?: string[];
  //   seasons?: string[];
  //   quizAnswers?: Record<string, string>;
  // };
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private ngZone = inject(NgZone);
  
  // Liste des IDs de favoris (pour vérification rapide)
  private favoritesIdsSubject = new BehaviorSubject<string[]>([]);
  public favoritesIds$ = this.favoritesIdsSubject.asObservable();
  
  // Liste complète des favoris avec toutes les infos
  private favoritesSubject = new BehaviorSubject<FavoriteProduct[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();
  
  private authSubscription: Subscription | null = null;
  private favoritesSubscription: Subscription | null = null;
  private currentUserId: string | null = null;

  constructor() {
    // Écouter les changements d'authentification
    this.authSubscription = authState(this.auth).subscribe((user: User | null) => {
      this.ngZone.run(() => {
        if (user) {
          this.currentUserId = user.uid;
          this.loadFavorites(user.uid);
        } else {
          this.currentUserId = null;
          this.favoritesIdsSubject.next([]);
          this.favoritesSubject.next([]);
          this.cleanupFavoritesSubscription();
        }
      });
    });
  }

  /**
   * Charge les favoris de l'utilisateur en temps réel
   * Triés par date d'ajout (plus récent en premier)
   */
  private loadFavorites(userId: string) {
    this.cleanupFavoritesSubscription();
    
    const favoritesRef = collection(this.firestore, 'users', userId, 'favoris');
    const favoritesQuery = query(favoritesRef, orderBy('addedAt', 'desc'));
    
    this.favoritesSubscription = collectionData(favoritesQuery, { idField: 'id' })
      .subscribe((docs: any[]) => {
        this.ngZone.run(() => {
          // Liste des IDs
          const ids = docs.map(doc => doc.productId);
          this.favoritesIdsSubject.next(ids);
          
          // Liste complète avec toutes les infos
          const favorites: FavoriteProduct[] = docs.map(doc => ({
            productId: doc.productId,
            skuId: doc.skuId,
            brandName: doc.brandName,
            displayName: doc.displayName,
            heroImage: doc.heroImage,
            altImage: doc.altImage || '',
            rating: doc.rating,
            reviews: doc.reviews,
            price: doc.price,
            targetUrl: doc.targetUrl,
            isNew: doc.isNew || false,
            isLimitedEdition: doc.isLimitedEdition || false,
            isSephoraExclusive: doc.isSephoraExclusive || false,
            addedAt: doc.addedAt?.toDate() || new Date()
          }));
          
          this.favoritesSubject.next(favorites);
        });
      });
  }
  
  private cleanupFavoritesSubscription() {
    if (this.favoritesSubscription) {
      this.favoritesSubscription.unsubscribe();
      this.favoritesSubscription = null;
    }
  }

  /**
   * Ajouter un produit aux favoris avec TOUTES ses infos
   */
  async addToFavorites(product: {
    productId: string;
    skuId: string;
    brandName: string;
    displayName: string;
    heroImage: string;
    altImage?: string;
    rating: string;
    reviews: string;
    price: string;
    targetUrl: string;
    isNew?: boolean;
    isLimitedEdition?: boolean;
    isSephoraExclusive?: boolean;
  }): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Utilisateur non connecté');
    }

    const favoriteRef = doc(this.firestore, 'users', this.currentUserId, 'favoris', product.productId);
    
    await setDoc(favoriteRef, {
      productId: product.productId,
      skuId: product.skuId,
      brandName: product.brandName,
      displayName: product.displayName,
      heroImage: product.heroImage,
      altImage: product.altImage || '',
      rating: product.rating,
      reviews: product.reviews,
      price: product.price,
      targetUrl: product.targetUrl,
      isNew: product.isNew || false,
      isLimitedEdition: product.isLimitedEdition || false,
      isSephoraExclusive: product.isSephoraExclusive || false,
      addedAt: new Date()
    });
  }

  /**
   * Retirer un produit des favoris
   */
  async removeFromFavorites(productId: string): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Utilisateur non connecté');
    }

    const favoriteRef = doc(this.firestore, 'users', this.currentUserId, 'favoris', productId);
    await deleteDoc(favoriteRef);
  }

  /**
   * Toggle favori (ajouter/retirer)
   * Retourne true si ajouté, false si retiré
   */
  async toggleFavorite(product: {
    productId: string;
    skuId: string;
    brandName: string;
    displayName: string;
    heroImage: string;
    altImage?: string;
    rating: string;
    reviews: string;
    price: string;
    targetUrl: string;
    isNew?: boolean;
    isLimitedEdition?: boolean;
    isSephoraExclusive?: boolean;
  }): Promise<boolean> {
    const isFav = this.isFavorite(product.productId);
    
    if (isFav) {
      await this.removeFromFavorites(product.productId);
      return false;
    } else {
      await this.addToFavorites(product);
      return true;
    }
  }

  /**
   * Vérifie si un produit est en favori
   */
  isFavorite(productId: string): boolean {
    return this.favoritesIdsSubject.value.includes(productId);
  }

  /**
   * Récupère la liste des IDs de favoris
   */
  getFavoritesIds(): string[] {
    return this.favoritesIdsSubject.value;
  }

  /**
   * Récupère tous les favoris avec leurs infos complètes
   */
  getFavorites(): FavoriteProduct[] {
    return this.favoritesSubject.value;
  }

  /**
   * Récupère le nombre de favoris
   */
  getFavoritesCount(): number {
    return this.favoritesSubject.value.length;
  }
  
  /**
   * Cleanup lors de la destruction du service
   */
  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    this.cleanupFavoritesSubscription();
  }
}
