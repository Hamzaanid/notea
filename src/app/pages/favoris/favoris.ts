import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService, FavoriteProduct } from '../../services/favorites.service';
import { AuthService } from '../../core/auth/services/auth.services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-favoris',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favoris.html',
  styleUrl: './favoris.scss',
})
export class Favoris implements OnInit, OnDestroy {
  favorites: FavoriteProduct[] = [];
  isLoggedIn = false;
  loading = true;
  
  private subscriptions: Subscription[] = [];

  // Toast notification
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  showToast = false;
  private toastTimeout: any;

  constructor(
    private favoritesService: FavoritesService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // S'abonner à l'état de connexion
    this.subscriptions.push(
      this.authService.isLoggedIn$.subscribe(isLogged => {
        this.isLoggedIn = isLogged;
        if (!isLogged) {
          this.loading = false;
        }
      })
    );

    // S'abonner aux favoris complets
    this.subscriptions.push(
      this.favoritesService.favorites$.subscribe(favs => {
        this.favorites = favs;
        this.loading = false;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  /**
   * Ouvre le produit sur Sephora
   */
  openProduct(product: FavoriteProduct) {
    const url = `https://www.sephora.com${product.targetUrl}`;
    window.open(url, '_blank');
  }

  /**
   * Retire un produit des favoris
   */
  async removeFavorite(event: Event, product: FavoriteProduct) {
    event.stopPropagation();
    
    try {
      await this.favoritesService.removeFromFavorites(product.productId);
      this.displayToast(`${product.brandName} retiré des favoris`, 'info');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      this.displayToast('Erreur lors de la suppression', 'error');
    }
  }

  /**
   * Formate le prix
   */
  formatPrice(price: string): string {
    return price || 'Prix non disponible';
  }

  /**
   * Formate le rating
   */
  formatRating(rating: string): string {
    const num = parseFloat(rating);
    return isNaN(num) ? '0.0' : num.toFixed(1);
  }

  /**
   * Génère les étoiles pour le rating
   */
  getStars(rating: string): string[] {
    const num = parseFloat(rating) || 0;
    const stars: string[] = [];
    
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(num)) {
        stars.push('full');
      } else if (i - 0.5 <= num) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    
    return stars;
  }

  /**
   * Formate la date d'ajout
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  // ========== TOAST NOTIFICATION ==========

  displayToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    this.toastTimeout = setTimeout(() => {
      this.hideToast();
    }, 3000);
  }

  hideToast() {
    this.showToast = false;
  }
}
