import { Injectable, inject, NgZone, OnDestroy } from '@angular/core';
import { 
  Firestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  collectionData,
  query,
  orderBy
} from '@angular/fire/firestore';
import { Auth, authState, User } from '@angular/fire/auth';
import { BehaviorSubject, Subscription } from 'rxjs';

/**
 * Interface représentant un produit favori stocké en base
 */
export interface FavoriteProduct {
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
  isNew: boolean;
  isLimitedEdition: boolean;
  isSephoraExclusive: boolean;
  addedAt: Date;
}

/**
 * Données nécessaires pour ajouter un produit aux favoris
 */
export interface FavoriteProductData {
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
}

/**
 * Service de gestion des favoris utilisateur
 * Synchronisé avec Firebase Firestore
 */
@Injectable({
  providedIn: 'root'
})
export class FavoritesService implements OnDestroy {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly ngZone = inject(NgZone);
  
  private readonly favoritesIdsSubject = new BehaviorSubject<string[]>([]);
  private readonly favoritesSubject = new BehaviorSubject<FavoriteProduct[]>([]);
  
  /** Observable des IDs de favoris (pour vérification rapide) */
  readonly favoritesIds$ = this.favoritesIdsSubject.asObservable();
  
  /** Observable des favoris complets */
  readonly favorites$ = this.favoritesSubject.asObservable();
  
  private authSubscription: Subscription | null = null;
  private favoritesSubscription: Subscription | null = null;
  private currentUserId: string | null = null;

  constructor() {
    this.initializeAuthListener();
  }

  /**
   * Initialise l'écoute des changements d'authentification
   */
  private initializeAuthListener(): void {
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
   * @param userId - ID de l'utilisateur
   */
  private loadFavorites(userId: string): void {
    this.cleanupFavoritesSubscription();
    
    const favoritesRef = collection(this.firestore, 'users', userId, 'favoris');
    const favoritesQuery = query(favoritesRef, orderBy('addedAt', 'desc'));
    
    this.favoritesSubscription = collectionData(favoritesQuery, { idField: 'id' })
      .subscribe((docs: any[]) => {
        this.ngZone.run(() => {
          const ids = docs.map(doc => doc.productId);
          this.favoritesIdsSubject.next(ids);
          
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
  
  private cleanupFavoritesSubscription(): void {
    if (this.favoritesSubscription) {
      this.favoritesSubscription.unsubscribe();
      this.favoritesSubscription = null;
    }
  }

  /**
   * Ajoute un produit aux favoris
   * @param product - Données du produit à ajouter
   */
  async addToFavorites(product: FavoriteProductData): Promise<void> {
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
   * Retire un produit des favoris
   * @param productId - ID du produit à retirer
   */
  async removeFromFavorites(productId: string): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Utilisateur non connecté');
    }

    const favoriteRef = doc(this.firestore, 'users', this.currentUserId, 'favoris', productId);
    await deleteDoc(favoriteRef);
  }

  /**
   * Ajoute ou retire un produit des favoris
   * @param product - Données du produit
   * @returns true si ajouté, false si retiré
   */
  async toggleFavorite(product: FavoriteProductData): Promise<boolean> {
    if (this.isFavorite(product.productId)) {
      await this.removeFromFavorites(product.productId);
      return false;
    } else {
      await this.addToFavorites(product);
      return true;
    }
  }

  /**
   * Vérifie si un produit est en favori
   * @param productId - ID du produit
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
  
  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.cleanupFavoritesSubscription();
  }
}
