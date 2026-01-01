import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

// Interfaces pour typer les données Overpass
export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    shop?: string;
    brand?: string;
    'brand:wikidata'?: string;
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

export interface OverpassResponse {
  version: number;
  generator: string;
  elements: OverpassElement[];
}

// Interface simplifiée pour l'affichage
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

@Injectable({
  providedIn: 'root'
})
export class OverpassService {
  private apiUrl = 'https://overpass-api.de/api/interpreter';

  // Marques de parfumerie à rechercher
  private perfumeShopBrands = [
    'Sephora',
    'Nocibé',
    'Marionnaud',
    'Douglas',
    'The Body Shop',
    'Yves Rocher',
    'L\'Occitane',
    'Fragonard',
    'perfumery',
    'cosmetics'
  ];

  constructor(private http: HttpClient) {}

  /**
   * Recherche les magasins de parfum dans une ville donnée
   */
  getPerfumeStores(city: string = 'Paris'): Observable<PerfumeStore[]> {
    const query = this.buildQuery(city);
    
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

  /**
   * Recherche les magasins de parfum autour d'une position GPS
   */
  getPerfumeStoresNearby(lat: number, lon: number, radius: number = 5000): Observable<PerfumeStore[]> {
    const query = this.buildQueryByCoords(lat, lon, radius);
    
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

  /**
   * Construit la requête Overpass pour une ville
   */
  private buildQuery(city: string): string {
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
out center;
    `.trim();
  }

  /**
   * Construit la requête Overpass pour des coordonnées GPS
   */
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
out center;
    `.trim();
  }

  /**
   * Transforme la réponse Overpass en liste de magasins
   */
  private transformResponse(response: OverpassResponse): PerfumeStore[] {
    if (!response.elements) return [];

    return response.elements
      .filter(el => el.tags?.name || el.tags?.brand)
      .map(el => {
        const lat = el.lat ?? el.center?.lat ?? 0;
        const lon = el.lon ?? el.center?.lon ?? 0;
        const tags = el.tags || {};

        // Construction de l'adresse
        const addressParts = [
          tags['addr:housenumber'],
          tags['addr:street']
        ].filter(Boolean);
        
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

  /**
   * Détecte la marque à partir du nom du magasin
   */
  private detectBrand(name: string): string {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('sephora')) return 'Sephora';
    if (nameLower.includes('nocibé') || nameLower.includes('nocibe')) return 'Nocibé';
    if (nameLower.includes('marionnaud')) return 'Marionnaud';
    if (nameLower.includes('douglas')) return 'Douglas';
    if (nameLower.includes('yves rocher')) return 'Yves Rocher';
    if (nameLower.includes('occitane')) return "L'Occitane";
    if (nameLower.includes('body shop')) return 'The Body Shop';
    if (nameLower.includes('fragonard')) return 'Fragonard';
    
    return 'Parfumerie';
  }
}


