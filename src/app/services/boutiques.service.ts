import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';

export interface Boutique {
  id: number;
  name: string;
  brand: string;
  address: string;
  city: string;
  postalCode: string;
  lat: number;
  lon: number;
  phone?: string;
  website?: string;
  openingHours?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BoutiquesService {
  
  // Base de données des parfumeries principales en France
  private boutiques: Boutique[] = [
    // PARIS
    { id: 1, name: 'Sephora Champs-Élysées', brand: 'Sephora', address: '70 Avenue des Champs-Élysées', city: 'Paris', postalCode: '75008', lat: 48.8714, lon: 2.3056, phone: '01 53 93 22 50', website: 'www.sephora.fr', openingHours: 'Lun-Sam 10h-23h, Dim 11h-23h' },
    { id: 2, name: 'Sephora Opéra', brand: 'Sephora', address: '23 Boulevard des Capucines', city: 'Paris', postalCode: '75002', lat: 48.8706, lon: 2.3312, phone: '01 42 68 17 17', website: 'www.sephora.fr', openingHours: 'Lun-Sam 10h-20h' },
    { id: 3, name: 'Sephora Rivoli', brand: 'Sephora', address: '70 Rue de Rivoli', city: 'Paris', postalCode: '75004', lat: 48.8575, lon: 2.3514, phone: '01 40 13 16 50', website: 'www.sephora.fr' },
    { id: 4, name: 'Nocibé Opéra', brand: 'Nocibé', address: '66 Rue de la Chaussée d\'Antin', city: 'Paris', postalCode: '75009', lat: 48.8751, lon: 2.3326, phone: '01 48 74 33 58', website: 'www.nocibe.fr', openingHours: 'Lun-Sam 10h-20h' },
    { id: 5, name: 'Nocibé Haussmann', brand: 'Nocibé', address: '52 Boulevard Haussmann', city: 'Paris', postalCode: '75009', lat: 48.8738, lon: 2.3299, website: 'www.nocibe.fr' },
    { id: 6, name: 'Marionnaud Champs-Élysées', brand: 'Marionnaud', address: '88 Avenue des Champs-Élysées', city: 'Paris', postalCode: '75008', lat: 48.8724, lon: 2.3028, phone: '01 45 62 42 40', website: 'www.marionnaud.fr' },
    { id: 7, name: 'Marionnaud Opéra', brand: 'Marionnaud', address: '17 Rue Tronchet', city: 'Paris', postalCode: '75008', lat: 48.8717, lon: 2.3245, website: 'www.marionnaud.fr' },
    { id: 8, name: 'Douglas Paris', brand: 'Douglas', address: '52 Avenue des Champs-Élysées', city: 'Paris', postalCode: '75008', lat: 48.8701, lon: 2.3075, website: 'www.douglas.fr' },
    { id: 9, name: 'Fragonard Opéra', brand: 'Fragonard', address: '9 Rue Scribe', city: 'Paris', postalCode: '75009', lat: 48.8711, lon: 2.3310, phone: '01 47 42 04 56', website: 'www.fragonard.com', openingHours: 'Lun-Sam 9h-18h' },
    { id: 10, name: 'L\'Occitane Saint-Germain', brand: "L'Occitane", address: '55 Rue Bonaparte', city: 'Paris', postalCode: '75006', lat: 48.8535, lon: 2.3337, website: 'www.loccitane.com' },
    
    // LYON
    { id: 11, name: 'Sephora Part-Dieu', brand: 'Sephora', address: 'Centre Commercial Part-Dieu', city: 'Lyon', postalCode: '69003', lat: 45.7607, lon: 4.8590, phone: '04 72 33 06 08', website: 'www.sephora.fr' },
    { id: 12, name: 'Sephora Bellecour', brand: 'Sephora', address: '37 Rue de la République', city: 'Lyon', postalCode: '69002', lat: 45.7580, lon: 4.8340, website: 'www.sephora.fr' },
    { id: 13, name: 'Nocibé Lyon', brand: 'Nocibé', address: '58 Rue de la République', city: 'Lyon', postalCode: '69002', lat: 45.7590, lon: 4.8350, website: 'www.nocibe.fr' },
    { id: 14, name: 'Marionnaud Lyon', brand: 'Marionnaud', address: '32 Rue de la République', city: 'Lyon', postalCode: '69002', lat: 45.7575, lon: 4.8335, website: 'www.marionnaud.fr' },
    
    // MARSEILLE
    { id: 15, name: 'Sephora Marseille', brand: 'Sephora', address: '24 Rue Saint-Ferréol', city: 'Marseille', postalCode: '13001', lat: 43.2950, lon: 5.3780, website: 'www.sephora.fr' },
    { id: 16, name: 'Nocibé Marseille', brand: 'Nocibé', address: 'Centre Bourse', city: 'Marseille', postalCode: '13001', lat: 43.2965, lon: 5.3755, website: 'www.nocibe.fr' },
    { id: 17, name: 'Marionnaud Marseille', brand: 'Marionnaud', address: '50 Rue Saint-Ferréol', city: 'Marseille', postalCode: '13001', lat: 43.2945, lon: 5.3785, website: 'www.marionnaud.fr' },
    
    // BORDEAUX
    { id: 18, name: 'Sephora Bordeaux', brand: 'Sephora', address: '15 Cours de l\'Intendance', city: 'Bordeaux', postalCode: '33000', lat: 44.8412, lon: -0.5750, website: 'www.sephora.fr' },
    { id: 19, name: 'Nocibé Bordeaux', brand: 'Nocibé', address: '72 Rue Sainte-Catherine', city: 'Bordeaux', postalCode: '33000', lat: 44.8380, lon: -0.5735, website: 'www.nocibe.fr' },
    { id: 20, name: 'Marionnaud Bordeaux', brand: 'Marionnaud', address: '44 Cours de l\'Intendance', city: 'Bordeaux', postalCode: '33000', lat: 44.8420, lon: -0.5760, website: 'www.marionnaud.fr' },
    
    // TOULOUSE
    { id: 21, name: 'Sephora Toulouse', brand: 'Sephora', address: '14 Rue d\'Alsace-Lorraine', city: 'Toulouse', postalCode: '31000', lat: 43.6045, lon: 1.4440, website: 'www.sephora.fr' },
    { id: 22, name: 'Nocibé Toulouse', brand: 'Nocibé', address: '30 Rue d\'Alsace-Lorraine', city: 'Toulouse', postalCode: '31000', lat: 43.6050, lon: 1.4445, website: 'www.nocibe.fr' },
    
    // NICE
    { id: 23, name: 'Sephora Nice', brand: 'Sephora', address: '8 Avenue Jean Médecin', city: 'Nice', postalCode: '06000', lat: 43.7010, lon: 7.2695, website: 'www.sephora.fr' },
    { id: 24, name: 'Marionnaud Nice', brand: 'Marionnaud', address: '20 Avenue Jean Médecin', city: 'Nice', postalCode: '06000', lat: 43.7015, lon: 7.2700, website: 'www.marionnaud.fr' },
    
    // NANTES
    { id: 25, name: 'Sephora Nantes', brand: 'Sephora', address: '3 Rue Crébillon', city: 'Nantes', postalCode: '44000', lat: 47.2135, lon: -1.5580, website: 'www.sephora.fr' },
    { id: 26, name: 'Nocibé Nantes', brand: 'Nocibé', address: '1 Rue de la Marne', city: 'Nantes', postalCode: '44000', lat: 47.2140, lon: -1.5570, website: 'www.nocibe.fr' },
    
    // STRASBOURG
    { id: 27, name: 'Sephora Strasbourg', brand: 'Sephora', address: '28 Rue des Grandes Arcades', city: 'Strasbourg', postalCode: '67000', lat: 48.5830, lon: 7.7455, website: 'www.sephora.fr' },
    { id: 28, name: 'Marionnaud Strasbourg', brand: 'Marionnaud', address: '15 Place Kléber', city: 'Strasbourg', postalCode: '67000', lat: 48.5835, lon: 7.7465, website: 'www.marionnaud.fr' },
    
    // LILLE
    { id: 29, name: 'Sephora Lille', brand: 'Sephora', address: '26 Rue Neuve', city: 'Lille', postalCode: '59000', lat: 50.6365, lon: 3.0635, website: 'www.sephora.fr' },
    { id: 30, name: 'Nocibé Lille', brand: 'Nocibé', address: '49 Rue de Béthune', city: 'Lille', postalCode: '59000', lat: 50.6350, lon: 3.0625, website: 'www.nocibe.fr' },
    
    // MONTPELLIER
    { id: 31, name: 'Sephora Montpellier', brand: 'Sephora', address: 'Centre Commercial Polygone', city: 'Montpellier', postalCode: '34000', lat: 43.6085, lon: 3.8810, website: 'www.sephora.fr' },
    { id: 32, name: 'Nocibé Montpellier', brand: 'Nocibé', address: '6 Rue de la Loge', city: 'Montpellier', postalCode: '34000', lat: 43.6100, lon: 3.8765, website: 'www.nocibe.fr' },
    
    // RENNES
    { id: 33, name: 'Sephora Rennes', brand: 'Sephora', address: '8 Quai Émile Zola', city: 'Rennes', postalCode: '35000', lat: 48.1105, lon: -1.6780, website: 'www.sephora.fr' },
    { id: 34, name: 'Marionnaud Rennes', brand: 'Marionnaud', address: 'Centre Commercial Colombia', city: 'Rennes', postalCode: '35000', lat: 48.1180, lon: -1.6350, website: 'www.marionnaud.fr' },
  ];

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les boutiques
   */
  getAllBoutiques(): Observable<Boutique[]> {
    return of(this.boutiques);
  }

  /**
   * Recherche les boutiques par ville
   */
  getBoutiquesByCity(city: string): Observable<Boutique[]> {
    const cityLower = city.toLowerCase().trim();
    const filtered = this.boutiques.filter(b => 
      b.city.toLowerCase().includes(cityLower)
    );
    return of(filtered);
  }

  /**
   * Recherche les boutiques par marque
   */
  getBoutiquesByBrand(brand: string): Observable<Boutique[]> {
    const filtered = this.boutiques.filter(b => 
      b.brand.toLowerCase() === brand.toLowerCase()
    );
    return of(filtered);
  }

  /**
   * Recherche les boutiques à proximité (par distance)
   */
  getBoutiquesNearby(lat: number, lon: number, radiusKm: number = 50): Observable<Boutique[]> {
    const filtered = this.boutiques
      .map(b => ({
        ...b,
        distance: this.calculateDistance(lat, lon, b.lat, b.lon)
      }))
      .filter(b => b.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
    
    return of(filtered);
  }

  /**
   * Calcule la distance entre deux points GPS (formule Haversine)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Liste des villes disponibles
   */
  getAvailableCities(): string[] {
    const cities = [...new Set(this.boutiques.map(b => b.city))];
    return cities.sort();
  }

  /**
   * Liste des marques disponibles
   */
  getAvailableBrands(): string[] {
    const brands = [...new Set(this.boutiques.map(b => b.brand))];
    return brands.sort();
  }
}




