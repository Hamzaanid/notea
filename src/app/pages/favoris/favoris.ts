import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { FavoritesService, FavoriteProduct } from '../../services/favorites.service';
import { AuthService } from '../../core/auth/services/auth.services/auth.service';

/**
 * Composant page des favoris
 * Affiche la liste des parfums sauvegardés par l'utilisateur
 */
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
  
  // Toast
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  showToast = false;
  
  private subscriptions: Subscription[] = [];
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private favoritesService: FavoritesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.subscribeToAuth();
    this.subscribeToFavorites();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  private subscribeToAuth(): void {
    this.subscriptions.push(
      this.authService.isLoggedIn$.subscribe(isLogged => {
        this.isLoggedIn = isLogged;
        if (!isLogged) this.loading = false;
      })
    );
  }

  private subscribeToFavorites(): void {
    this.subscriptions.push(
      this.favoritesService.favorites$.subscribe(favs => {
        this.favorites = favs;
        this.loading = false;
      })
    );
  }

  /**
   * Ouvre le produit sur Sephora
   */
  openProduct(product: FavoriteProduct): void {
    window.open(`https://www.sephora.com${product.targetUrl}`, '_blank');
  }

  /**
   * Retire un produit des favoris
   */
  async removeFavorite(event: Event, product: FavoriteProduct): Promise<void> {
    event.stopPropagation();
    
    try {
      await this.favoritesService.removeFromFavorites(product.productId);
      this.displayToast(`${product.brandName} retiré des favoris`, 'info');
    } catch (error) {
      this.displayToast('Erreur lors de la suppression', 'error');
    }
  }

  formatPrice(price: string): string {
    return price || 'Prix non disponible';
  }

  formatRating(rating: string): string {
    const num = parseFloat(rating);
    return isNaN(num) ? '0.0' : num.toFixed(1);
  }

  getStars(rating: string): string[] {
    const num = parseFloat(rating) || 0;
    return [1, 2, 3, 4, 5].map(i => {
      if (i <= Math.floor(num)) return 'full';
      if (i - 0.5 <= num) return 'half';
      return 'empty';
    });
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  displayToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    this.toastTimeout = setTimeout(() => this.hideToast(), 3000);
  }

  hideToast(): void {
    this.showToast = false;
  }
}
