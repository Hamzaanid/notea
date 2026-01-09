import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SephoraService, SephoraProduct, FilterCategory } from '../../services/sephora.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../core/auth/services/auth.services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list-parfums',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list-parfums.html',
  styleUrl: './list-parfums.scss',
})
export class ListParfums implements OnInit, OnDestroy {
  products: SephoraProduct[] = [];
  categories: FilterCategory[] = [];
  
  // État
  loading = false;
  error = '';
  
  // Filtres
  selectedCategory = 'cat160006';
  searchQuery = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 24;
  totalProducts = 0;
  totalPages = 0;

  // Favoris
  favorites: string[] = [];
  isLoggedIn = false;
  private subscriptions: Subscription[] = [];

  // Toast notification
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  showToast = false;
  private toastTimeout: any;

  constructor(
    private sephoraService: SephoraService,
    private favoritesService: FavoritesService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.categories = this.sephoraService.categories;
    this.loadProducts();
    
    // S'abonner aux IDs des favoris (pour vérification rapide)
    this.subscriptions.push(
      this.favoritesService.favoritesIds$.subscribe(ids => {
        this.favorites = ids;
      })
    );
    
    // S'abonner à l'état de connexion
    this.subscriptions.push(
      this.authService.isLoggedIn$.subscribe(isLogged => {
        this.isLoggedIn = isLogged;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadProducts() {
    this.loading = true;
    this.error = '';

    if (this.searchQuery.trim()) {
      this.sephoraService.searchProducts(this.searchQuery, this.currentPage, this.pageSize)
        .subscribe({
          next: (response: any) => {
            this.products = response.products || [];
            this.totalProducts = this.products.length > 0 ? 500 : 0; // Estimation
            this.calculateTotalPages();
            this.loading = false;
          },
          error: () => {
            this.error = 'Erreur lors de la recherche';
            this.loading = false;
          }
        });
    } else {
      this.sephoraService.getProducts(this.selectedCategory, this.currentPage, this.pageSize)
        .subscribe({
          next: (response: any) => {
            this.products = response.products || [];
            this.totalProducts = this.sephoraService.getTotalForCategory(this.selectedCategory);
            this.calculateTotalPages();
            this.loading = false;
          },
          error: () => {
            this.error = 'Erreur lors du chargement';
            this.loading = false;
          }
        });
    }
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.totalProducts / this.pageSize);
  }

  onCategoryChange() {
    this.currentPage = 1;
    this.searchQuery = '';
    this.loadProducts();
  }

  onSearch() {
    this.currentPage = 1;
    this.loadProducts();
  }

  clearSearch() {
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadProducts();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  formatPrice(price: string | undefined): string {
    return price || 'Prix non disponible';
  }

  formatRating(rating: string): string {
    const num = parseFloat(rating);
    return isNaN(num) ? '0.0' : num.toFixed(1);
  }

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

  openProduct(product: SephoraProduct) {
    const url = `https://www.sephora.com${product.targetUrl}`;
    window.open(url, '_blank');
  }

  // ========== FAVORIS ==========
  
  /**
   * Vérifie si un produit est en favori
   */
  isFavorite(productId: string): boolean {
    return this.favorites.includes(productId);
  }

  /**
   * Toggle le favori (ajouter/retirer)
   * Envoie TOUTES les infos du produit pour stockage complet
   */
  async toggleFavorite(event: Event, product: SephoraProduct) {
    event.stopPropagation(); // Empêche l'ouverture du produit
    
    if (!this.isLoggedIn) {
      this.displayToast('Veuillez vous connecter pour ajouter des favoris', 'info');
      return;
    }

    try {
      // Préparer toutes les infos du produit pour le stockage
      const productData = {
        productId: product.productId,
        skuId: product.skuId || product.currentSku?.skuId || product.productId,
        brandName: product.brandName,
        displayName: product.displayName,
        heroImage: product.heroImage,
        altImage: product.altImage || '',
        rating: product.rating || '0',
        reviews: product.reviews || '0',
        price: product.currentSku?.listPrice || 'Prix non disponible',
        targetUrl: product.targetUrl,
        isNew: product.currentSku?.isNew || false,
        isLimitedEdition: product.currentSku?.isLimitedEdition || false,
        isSephoraExclusive: product.currentSku?.isSephoraExclusive || false
      };
      
      const wasAdded = await this.favoritesService.toggleFavorite(productData);
      
      if (wasAdded) {
        this.displayToast(`${product.brandName} ajouté aux favoris ♥`, 'success');
      } else {
        this.displayToast(`${product.brandName} retiré des favoris`, 'info');
      }
    } catch (error) {
      console.error('Erreur lors de la modification du favori:', error);
      this.displayToast('Erreur lors de la modification du favori', 'error');
    }
  }

  // ========== TOAST NOTIFICATION ==========

  /**
   * Affiche un toast de notification
   */
  displayToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    // Clear any existing timeout
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    // Auto-hide after 3 seconds
    this.toastTimeout = setTimeout(() => {
      this.hideToast();
    }, 3000);
  }

  /**
   * Cache le toast
   */
  hideToast() {
    this.showToast = false;
  }
}
