import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Interface représentant un produit Sephora
 */
export interface SephoraProduct {
  productId: string;
  skuId?: string;
  brandName: string;
  displayName: string;
  heroImage: string;
  altImage?: string;
  rating: string;
  reviews: string;
  targetUrl: string;
  currentSku: {
    skuId?: string;
    listPrice: string;
    isNew: boolean;
    isLimitedEdition: boolean;
    isSephoraExclusive: boolean;
  };
}

/**
 * Interface pour les catégories de filtres
 */
export interface FilterCategory {
  categoryId: string;
  displayName: string;
  count: number;
}

/**
 * Service de communication avec l'API Sephora
 * Gère la récupération et la recherche de produits
 */
@Injectable({
  providedIn: 'root'
})
export class SephoraService {
  private readonly baseUrl = environment.sephora.baseUrl;
  private readonly headers = new HttpHeaders({
    'x-rapidapi-key': environment.sephora.apiKey,
    'x-rapidapi-host': environment.sephora.apiHost
  });

  /** Catégories disponibles pour le filtrage */
  readonly categories: FilterCategory[] = [
    { categoryId: 'cat160006', displayName: 'Tous', count: 1733 },
    { categoryId: 'cat1230039', displayName: 'Femme', count: 1289 },
    { categoryId: 'cat1230040', displayName: 'Homme', count: 374 },
    { categoryId: 'cat5000004', displayName: 'Unisexe', count: 420 },
    { categoryId: 'cat1870030', displayName: 'Mini', count: 486 },
    { categoryId: 'cat2900032', displayName: 'Vegan', count: 461 },
    { categoryId: 'cat1230041', displayName: 'Coffrets', count: 254 }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste des parfums par catégorie
   * @param categoryId - ID de la catégorie
   * @param page - Numéro de page
   * @param pageSize - Nombre de produits par page
   */
  getProducts(categoryId = 'cat160006', page = 1, pageSize = 24): Observable<any> {
    const url = `${this.baseUrl}/us/products/v2/list`;
    const params = {
      categoryId,
      currentPage: page.toString(),
      pageSize: pageSize.toString()
    };

    return this.http.get(url, { headers: this.headers, params }).pipe(
      catchError(error => {
        console.error('Erreur API Sephora:', error);
        return of({ products: [], currentPage: page, pageSize });
      })
    );
  }

  /**
   * Recherche de produits par mot-clé
   * @param query - Terme de recherche
   * @param page - Numéro de page
   * @param pageSize - Nombre de produits par page
   */
  searchProducts(query: string, page = 1, pageSize = 24): Observable<any> {
    const url = `${this.baseUrl}/us/products/v2/search`;
    const params = {
      q: query,
      currentPage: page.toString(),
      pageSize: pageSize.toString()
    };

    return this.http.get(url, { headers: this.headers, params }).pipe(
      catchError(error => {
        console.error('Erreur recherche Sephora:', error);
        return of({ products: [], currentPage: page, pageSize });
      })
    );
  }

  /**
   * Retourne le nombre total de produits pour une catégorie
   * @param categoryId - ID de la catégorie
   */
  getTotalForCategory(categoryId: string): number {
    const category = this.categories.find(c => c.categoryId === categoryId);
    return category?.count ?? 0;
  }
}
