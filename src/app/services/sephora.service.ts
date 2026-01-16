import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SephoraProduct {
  productId: string;
  skuId?: string;        // SKU ID (ex: "P518158")
  brandName: string;
  displayName: string;
  heroImage: string;
  altImage?: string;
  rating: string;
  reviews: string;
  targetUrl: string;
  currentSku: {
    skuId?: string;      // SKU ID dans currentSku
    listPrice: string;
    isNew: boolean;
    isLimitedEdition: boolean;
    isSephoraExclusive: boolean;
  };
}

export interface FilterCategory {
  categoryId: string;
  displayName: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class SephoraService {
  private baseUrl = environment.sephora.baseUrl;
  private headers = new HttpHeaders({
    'x-rapidapi-key': environment.sephora.apiKey,
    'x-rapidapi-host': environment.sephora.apiHost
  });

  // Catégories pour les filtres
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
   * Récupère la liste des parfums
   */
  getProducts(categoryId: string = 'cat160006', page: number = 1, pageSize: number = 24): Observable<any> {
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
   * Recherche de produits
   */
  searchProducts(query: string, page: number = 1, pageSize: number = 24): Observable<any> {
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
   * Retourne le nombre total pour une catégorie
   */
  getTotalForCategory(categoryId: string): number {
    const cat = this.categories.find(c => c.categoryId === categoryId);
    return cat ? cat.count : 0;
  }

  /**
   * Récupère les produits avec filtres de parfum (pour recommandations du test de personnalité)
   */
  getProductsWithFragranceFilters(
    categoryId: string,
    fragranceFamily: string,
    fragranceType: string,
    page: number = 1,
    pageSize: number = 24
  ): Observable<any> {
    const url = `${this.baseUrl}/us/products/v2/list`;
    const params: any = {
      categoryId,
      currentPage: page.toString(),
      pageSize: pageSize.toString(),
      [`filters[fragranceFamily]`]: fragranceFamily,
      [`filters[fragranceType]`]: fragranceType
    };

    return this.http.get(url, { headers: this.headers, params }).pipe(
      catchError(error => {
        console.error('Erreur API Sephora avec filtres:', error);
        // En cas d'erreur, essayer sans les filtres de parfum
        return this.getProducts(categoryId, page, pageSize);
      })
    );
  }
}
