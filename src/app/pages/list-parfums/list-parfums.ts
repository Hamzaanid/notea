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
  filteredProducts: SephoraProduct[] = [];
  categories: FilterCategory[] = [];
  
  // État
  loading = false;
  error = '';
  
  // Filtres
  selectedCategory = 'cat160006';
  searchQuery = '';
  selectedBrand = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  minRating: number | null = null;
  filterNew = false;
  filterExclusive = false;
  filterLimited = false;
  sortBy: 'none' | 'price-asc' | 'price-desc' | 'rating-desc' | 'reviews-desc' = 'none';
  
  // Marques disponibles
  availableBrands: string[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 24; // Nombre de produits par page
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
            this.extractBrands();
            this.applyFilters();
            // Utiliser les données de pagination de l'API si disponibles
            if (response.totalProducts !== undefined) {
              this.totalProducts = response.totalProducts;
            } else {
              this.totalProducts = this.filteredProducts.length;
            }
            if (response.totalPages !== undefined) {
              this.totalPages = response.totalPages;
            } else {
              this.calculateTotalPages();
            }
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
            this.extractBrands();
            this.applyFilters();
            // Utiliser les données de pagination de l'API si disponibles
            if (response.totalProducts !== undefined) {
              this.totalProducts = response.totalProducts;
            } else {
              this.totalProducts = this.filteredProducts.length;
            }
            if (response.totalPages !== undefined) {
              this.totalPages = response.totalPages;
            } else {
              this.calculateTotalPages();
            }
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
    // Si on a le total de produits, calculer le nombre de pages
    if (this.totalProducts > 0) {
      this.totalPages = Math.ceil(this.totalProducts / this.pageSize);
    } else {
      // Sinon, utiliser les produits filtrés
      this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
    }
  }

  // ========== FILTRES AVANCÉS ==========

  /**
   * Extrait les marques uniques des produits
   */
  extractBrands() {
    const brands = new Set<string>();
    this.products.forEach(product => {
      if (product.brandName) {
        brands.add(product.brandName);
      }
    });
    this.availableBrands = Array.from(brands).sort();
  }

  /**
   * Parse le prix depuis une chaîne (ex: "$125.00" -> 125)
   */
  parsePrice(priceStr: string | undefined): number {
    if (!priceStr) return 0;
    const match = priceStr.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  /**
   * Applique tous les filtres et le tri
   */
  applyFilters() {
    let filtered = [...this.products];

    // Filtre par marque
    if (this.selectedBrand) {
      filtered = filtered.filter(p => p.brandName === this.selectedBrand);
    }

    // Filtre par prix
    if (this.minPrice !== null) {
      filtered = filtered.filter(p => {
        const price = this.parsePrice(p.currentSku?.listPrice);
        return price >= this.minPrice!;
      });
    }
    if (this.maxPrice !== null) {
      filtered = filtered.filter(p => {
        const price = this.parsePrice(p.currentSku?.listPrice);
        return price <= this.maxPrice!;
      });
    }

    // Filtre par note minimale
    if (this.minRating !== null) {
      filtered = filtered.filter(p => {
        const rating = parseFloat(p.rating) || 0;
        return rating >= this.minRating!;
      });
    }

    // Filtre par badges
    if (this.filterNew) {
      filtered = filtered.filter(p => p.currentSku?.isNew === true);
    }
    if (this.filterExclusive) {
      filtered = filtered.filter(p => p.currentSku?.isSephoraExclusive === true);
    }
    if (this.filterLimited) {
      filtered = filtered.filter(p => p.currentSku?.isLimitedEdition === true);
    }

    // Tri
    filtered = this.sortProducts(filtered);

    this.filteredProducts = filtered;
    // Recalculer le total de pages après filtrage
    this.calculateTotalPages();
  }

  /**
   * Trie les produits selon le critère sélectionné
   */
  sortProducts(products: SephoraProduct[]): SephoraProduct[] {
    const sorted = [...products];

    switch (this.sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => {
          const priceA = this.parsePrice(a.currentSku?.listPrice);
          const priceB = this.parsePrice(b.currentSku?.listPrice);
          return priceA - priceB;
        });

      case 'price-desc':
        return sorted.sort((a, b) => {
          const priceA = this.parsePrice(a.currentSku?.listPrice);
          const priceB = this.parsePrice(b.currentSku?.listPrice);
          return priceB - priceA;
        });

      case 'rating-desc':
        return sorted.sort((a, b) => {
          const ratingA = parseFloat(a.rating) || 0;
          const ratingB = parseFloat(b.rating) || 0;
          return ratingB - ratingA;
        });

      case 'reviews-desc':
        return sorted.sort((a, b) => {
          const reviewsA = parseInt(a.reviews) || 0;
          const reviewsB = parseInt(b.reviews) || 0;
          return reviewsB - reviewsA;
        });

      default:
        return sorted;
    }
  }

  /**
   * Réinitialise tous les filtres
   */
  resetFilters() {
    this.selectedBrand = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.minRating = null;
    this.filterNew = false;
    this.filterExclusive = false;
    this.filterLimited = false;
    this.sortBy = 'none';
    this.currentPage = 1; // Reset à la première page après réinitialisation
    this.applyFilters();
  }

  /**
   * Vérifie si des filtres sont actifs
   */
  hasActiveFilters(): boolean {
    return !!(
      this.selectedBrand ||
      this.minPrice !== null ||
      this.maxPrice !== null ||
      this.minRating !== null ||
      this.filterNew ||
      this.filterExclusive ||
      this.filterLimited ||
      this.sortBy !== 'none'
    );
  }

  /**
   * Retourne le nom d'affichage de la catégorie sélectionnée
   */
  getCategoryDisplayName(): string {
    const cat = this.categories.find(c => c.categoryId === this.selectedCategory);
    return cat ? cat.displayName : 'Tous';
  }

  /**
   * Retourne le nom d'affichage de la note sélectionnée
   */
  getRatingDisplayName(): string {
    if (this.minRating === null) return 'Note';
    return `${this.minRating}+ étoiles`;
  }

  /**
   * Retourne le nom d'affichage du prix sélectionné
   */
  getPriceDisplayName(): string {
    if (this.minPrice === null && this.maxPrice === null) return 'Prix';
    if (this.minPrice !== null && this.maxPrice !== null) {
      return `${this.minPrice}€ - ${this.maxPrice}€`;
    }
    if (this.minPrice !== null) return `À partir de ${this.minPrice}€`;
    if (this.maxPrice !== null) return `Jusqu'à ${this.maxPrice}€`;
    return 'Prix';
  }

  /**
   * Retourne le nom d'affichage du tri sélectionné
   */
  getSortDisplayName(): string {
    switch (this.sortBy) {
      case 'price-asc': return 'Prix croissant';
      case 'price-desc': return 'Prix décroissant';
      case 'rating-desc': return 'Meilleure note';
      case 'reviews-desc': return 'Plus de commentaires';
      default: return 'Trier';
    }
  }

  /**
   * Retourne le nombre de badges actifs
   */
  getActiveBadgesCount(): number {
    let count = 0;
    if (this.filterNew) count++;
    if (this.filterExclusive) count++;
    if (this.filterLimited) count++;
    return count;
  }

  onCategoryChange() {
    this.currentPage = 1;
    this.searchQuery = '';
    this.resetFilters();
    this.loadProducts();
  }

  onSortChange() {
    // Ne pas réinitialiser la page lors du tri, juste appliquer les filtres
    this.applyFilters();
  }

  onFilterChange() {
    // Réinitialiser à la première page lors des changements de filtres
    this.currentPage = 1;
    this.applyFilters();
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
    if (page >= 1 && page !== this.currentPage) {
      this.currentPage = page;
      // Recharger les produits pour la nouvelle page
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Récupère les produits paginés pour la page actuelle
   * Maintenant, les produits sont déjà paginés par le serveur
   */
  getPaginatedProducts(): SephoraProduct[] {
    // Les produits sont déjà paginés par le serveur, on retourne juste les produits filtrés
    return this.filteredProducts;
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
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
