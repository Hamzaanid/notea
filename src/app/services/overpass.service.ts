import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

/**
 * Élément retourné par l'API Overpass
 */
export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    shop?: string;
    brand?: string;
    opening_hours?: string;
    phone?: string;
    website?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:postcode'?: string;
    'addr:city'?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Réponse de l'API Overpass
 */
export interface OverpassResponse {
  version: number;
  generator: string;
  elements: OverpassElement[];
}

/**
 * Magasin de parfum formaté
 */
export interface PerfumeStore {
  id: number;
  name: string;
  brand: string;
  lat: number;
  lon: number;
  address: string;
  city: string;
  phone?: string;
  website?: string;
  openingHours?: string;
}

/**
 * Service d'interrogation de l'API Overpass (OpenStreetMap)
 * Permet de rechercher des parfumeries par ville ou coordonnées GPS
 */
@Injectable({
  providedIn: 'root'
})
export class OverpassService {
  private readonly apiUrl = 'https://overpass-api.de/api/interpreter';

  private readonly perfumeShopBrands = [
    'Sephora', 'Nocibé', 'Marionnaud', 'Douglas',
    'The Body Shop', 'Yves Rocher', "L'Occitane", 'Fragonard'
  ];

  constructor(private http: HttpClient) {}

  /**
   * Recherche les magasins de parfum dans une ville
   * @param city - Nom de la ville
   */
  getPerfumeStores(city = 'Paris'): Observable<PerfumeStore[]> {
    const query = this.buildQueryByCity(city);
    return this.executeQuery(query);
  }

  /**
   * Recherche les magasins de parfum autour d'une position GPS
   * @param lat - Latitude
   * @param lon - Longitude
   * @param radius - Rayon en mètres
   */
  getPerfumeStoresNearby(lat: number, lon: number, radius = 5000): Observable<PerfumeStore[]> {
    const query = this.buildQueryByCoords(lat, lon, radius);
    return this.executeQuery(query);
  }

  private executeQuery(query: string): Observable<PerfumeStore[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    const body = `data=${encodeURIComponent(query)}`;

    return this.http.post<OverpassResponse>(this.apiUrl, body, { headers }).pipe(
      map(response => this.transformResponse(response)),
      catchError(error => {
        console.error('Erreur Overpass API:', error);
        return of([]);
      })
    );
  }

  private buildQueryByCity(city: string): string {
    const brandFilters = this.perfumeShopBrands
      .map(brand => `["brand"~"${brand}",i]`)
      .join('');

    return `
[out:json][timeout:30];
area["name"="${city}"]->.searchArea;
(
  node["shop"="perfumery"](area.searchArea);
  node["shop"="cosmetics"](area.searchArea);
  node${brandFilters}(area.searchArea);
  way["shop"="perfumery"](area.searchArea);
  way["shop"="cosmetics"](area.searchArea);
  way${brandFilters}(area.searchArea);
);
out center;`.trim();
  }

  private buildQueryByCoords(lat: number, lon: number, radius: number): string {
    return `
[out:json][timeout:30];
(
  node["shop"="perfumery"](around:${radius},${lat},${lon});
  node["shop"="cosmetics"](around:${radius},${lat},${lon});
  node["brand"~"Sephora|Nocibé|Marionnaud|Douglas",i](around:${radius},${lat},${lon});
  way["shop"="perfumery"](around:${radius},${lat},${lon});
  way["shop"="cosmetics"](around:${radius},${lat},${lon});
  way["brand"~"Sephora|Nocibé|Marionnaud|Douglas",i](around:${radius},${lat},${lon});
);
out center;`.trim();
  }

  private transformResponse(response: OverpassResponse): PerfumeStore[] {
    if (!response.elements) return [];

    return response.elements
      .filter(el => el.tags?.name || el.tags?.brand)
      .map(el => {
        const lat = el.lat ?? el.center?.lat ?? 0;
        const lon = el.lon ?? el.center?.lon ?? 0;
        const tags = el.tags || {};

        const addressParts = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean);
        const address = addressParts.join(' ') || 'Adresse non disponible';
        const city = tags['addr:city'] || tags['addr:postcode'] || '';

        return {
          id: el.id,
          name: tags.name || tags.brand || 'Magasin',
          brand: tags.brand || this.detectBrand(tags.name || ''),
          lat,
          lon,
          address,
          city,
          phone: tags.phone,
          website: tags.website,
          openingHours: tags.opening_hours
        };
      })
      .filter(store => store.lat !== 0 && store.lon !== 0);
  }

  private detectBrand(name: string): string {
    const nameLower = name.toLowerCase();
    
    const brandMap: Record<string, string> = {
      'sephora': 'Sephora',
      'nocibé': 'Nocibé',
      'nocibe': 'Nocibé',
      'marionnaud': 'Marionnaud',
      'douglas': 'Douglas',
      'yves rocher': 'Yves Rocher',
      'occitane': "L'Occitane",
      'body shop': 'The Body Shop',
      'fragonard': 'Fragonard'
    };
    
    for (const [key, value] of Object.entries(brandMap)) {
      if (nameLower.includes(key)) return value;
    }
    
    return 'Parfumerie';
  }
}
