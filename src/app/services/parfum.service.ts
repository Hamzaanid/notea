import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ObfProduct {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  image_front_url?: string;
  image_url?: string;
  image_small_url?: string;
  popularity_key?: number;
  quantity?: string;
}

export interface ObfSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: ObfProduct[];
}

export interface PerfumeCard {
  id: string;
  brand: string;
  name: string;
  image: string;
  quantity?: string;
  popularity?: number;
}

@Injectable({ providedIn: 'root' })
export class ParfumService {
  private baseUrl = 'https://world.openbeautyfacts.org/api/v2/search';

  constructor(private http: HttpClient) {}

  getPerfumes(params: {
    page: number;
    pageSize: number;
    lang?: 'fr' | 'en';
    onlyWithImages?: boolean;
  }): Observable<{
    meta: { count: number; page: number; pageCount: number; pageSize: number };
    items: PerfumeCard[];
  }> {
    const lang = params.lang ?? 'fr';

    let httpParams = new HttpParams()
      // Catégorie parfums
      .set('categories_tags', 'perfumes')
      // Pagination
      .set('page', String(params.page))
      .set('page_size', String(params.pageSize))
      // Langue
      .set('lc', lang)
      // Réduire la taille de réponse (très important)
      .set(
        'fields',
        [
          'code',
          'product_name',
          'product_name_fr',
          'brands',
          'image_front_url',
          'image_url',
          'image_small_url',
          'popularity_key',
          'quantity',
        ].join(',')
      );

    // Évite les produits sans images
    if (params.onlyWithImages !== false) {
      httpParams = httpParams.set('has_images', '1');
    }

    return this.http.get<ObfSearchResponse>(this.baseUrl, { params: httpParams }).pipe(
      map((res) => {
        // Petit tri “best sellers” approximatif avec popularity_key (quand présent)
        const sorted = [...(res.products ?? [])].sort(
          (a, b) => (b.popularity_key ?? 0) - (a.popularity_key ?? 0)
        );

        const items: PerfumeCard[] = sorted.map((p) => ({
          id: p.code || '',
          brand: (p.brands || 'Marque inconnue').split(',')[0].trim(),
          name: (p.product_name_fr || p.product_name || 'Parfum').trim(),
          image:
            p.image_front_url ||
            p.image_url ||
            p.image_small_url ||
            'assets/perfume-placeholder.png',
          quantity: p.quantity,
          popularity: p.popularity_key,
        }));

        return {
          meta: {
            count: res.count,
            page: res.page,
            pageCount: res.page_count,
            pageSize: res.page_size,
          },
          items,
        };
      })
    );
  }
}
