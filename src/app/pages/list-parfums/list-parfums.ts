import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { SephoraService, SephoraProduct, FilterCategory } from '../../services/sephora.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../core/auth/services/auth.services/auth.service';

/**
 * Composant catalogue de parfums
 * Affiche la liste des produits avec filtrage, recherche et pagination
 */
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
  
  // Toast
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  showToast = false;
  
  private subscriptions: Subscription[] = [];
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private sephoraService: SephoraService,
    private favoritesService: FavoritesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.categories = this.sephoraService.categories;
    this.loadProducts();
    this.subscribeToFavorites();
    this.subscribeToAuth();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  private subscribeToFavorites(): void {
    this.subscriptions.push(
      this.favoritesService.favoritesIds$.subscribe(ids => this.favorites = ids)
    );
  }

  private subscribeToAuth(): void {
    this.subscriptions.push(
      this.authService.isLoggedIn$.subscribe(isLogged => this.isLoggedIn = isLogged)
    );
  }

  /**
   * Charge les produits selon la catégorie ou la recherche
   */
  loadProducts(): void {
    this.loading = true;
    this.error = '';

    const request = this.searchQuery.trim()
      ? this.sephoraService.searchProducts(this.searchQuery, this.currentPage, this.pageSize)
      : this.sephoraService.getProducts(this.selectedCategory, this.currentPage, this.pageSize);

    request.subscribe({
      next: (response: any) => {
        this.products = response.products || [];
        this.totalProducts = this.searchQuery.trim() 
          ? (this.products.length > 0 ? 500 : 0)
          : this.sephoraService.getTotalForCategory(this.selectedCategory);
        this.calculateTotalPages();
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }

  private calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalProducts / this.pageSize);
  }

  onCategoryChange(): void {
    this.currentPage = 1;
    this.searchQuery = '';
    this.loadProducts();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadProducts();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  getPageNumbers(): number[] {
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
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
    return [1, 2, 3, 4, 5].map(i => {
      if (i <= Math.floor(num)) return 'full';
      if (i - 0.5 <= num) return 'half';
      return 'empty';
    });
  }

  openProduct(product: SephoraProduct): void {
    window.open(`https://www.sephora.com${product.targetUrl}`, '_blank');
  }

  isFavorite(productId: string): boolean {
    return this.favorites.includes(productId);
  }

  async toggleFavorite(event: Event, product: SephoraProduct): Promise<void> {
    event.stopPropagation();
    
    if (!this.isLoggedIn) {
      this.displayToast('Veuillez vous connecter pour ajouter des favoris', 'info');
      return;
    }

    try {
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
      
      this.displayToast(
        wasAdded ? `${product.brandName} ajouté aux favoris ♥` : `${product.brandName} retiré des favoris`,
        wasAdded ? 'success' : 'info'
      );
    } catch (error) {
      this.displayToast('Erreur lors de la modification du favori', 'error');
    }
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
