import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoutiquesService, Boutique } from '../../services/boutiques.service';

/**
 * Composant page des boutiques
 * Permet de rechercher des parfumeries par ville, marque ou géolocalisation
 */
@Component({
  selector: 'app-boutiques',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boutiques.html',
  styleUrl: './boutiques.scss',
})
export class Boutiques implements OnInit {
  boutiques: (Boutique & { distance?: number })[] = [];
  filteredBoutiques: (Boutique & { distance?: number })[] = [];
  loading = false;
  error = '';
  
  // Filtres
  selectedCity = '';
  selectedBrand = '';
  
  // Géolocalisation
  userLocation: { lat: number; lon: number } | null = null;
  locationLoading = false;
  searchMode: 'city' | 'nearby' = 'city';

  // Listes pour les filtres
  cities: string[] = [];
  brands: string[] = [];

  constructor(private boutiquesService: BoutiquesService) {}

  ngOnInit(): void {
    this.loadFilters();
    this.loadAllBoutiques();
  }

  private loadFilters(): void {
    this.cities = this.boutiquesService.getAvailableCities();
    this.brands = this.boutiquesService.getAvailableBrands();
  }

  /**
   * Charge toutes les boutiques
   */
  loadAllBoutiques(): void {
    this.loading = true;
    this.error = '';
    this.searchMode = 'city';
    
    this.boutiquesService.getAllBoutiques().subscribe({
      next: (data) => {
        this.boutiques = data;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Erreur lors du chargement des boutiques';
      }
    });
  }

  /**
   * Recherche par géolocalisation
   */
  searchNearby(): void {
    if (!navigator.geolocation) {
      this.error = "La géolocalisation n'est pas supportée";
      return;
    }

    this.locationLoading = true;
    this.error = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        
        this.locationLoading = false;
        this.loading = true;
        this.searchMode = 'nearby';
        this.selectedCity = '';
        
        this.boutiquesService.getBoutiquesNearby(
          this.userLocation.lat,
          this.userLocation.lon,
          100
        ).subscribe({
          next: (data) => {
            this.boutiques = data;
            this.applyFilters();
            this.loading = false;
            
            if (data.length === 0) {
              this.error = 'Aucune boutique trouvée à proximité';
            }
          },
          error: () => {
            this.loading = false;
            this.error = 'Erreur lors de la recherche';
          }
        });
      },
      (error) => {
        this.locationLoading = false;
        this.error = this.getGeolocationError(error);
      }
    );
  }

  private getGeolocationError(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Accès à la position refusé';
      case error.POSITION_UNAVAILABLE:
        return 'Position non disponible';
      default:
        return 'Erreur de géolocalisation';
    }
  }

  /**
   * Applique les filtres ville et marque
   */
  applyFilters(): void {
    let result = [...this.boutiques];
    
    if (this.selectedCity) {
      result = result.filter(b => b.city === this.selectedCity);
    }
    
    if (this.selectedBrand) {
      result = result.filter(b => b.brand === this.selectedBrand);
    }
    
    this.filteredBoutiques = result;
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.selectedCity = '';
    this.selectedBrand = '';
    this.searchMode = 'city';
    this.loadAllBoutiques();
  }

  /**
   * Ouvre Google Maps avec l'itinéraire
   */
  openMaps(boutique: Boutique): void {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${boutique.lat},${boutique.lon}`;
    window.open(url, '_blank');
  }

  /**
   * Ouvre le site web
   */
  openWebsite(url?: string): void {
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : 'https://' + url;
    window.open(fullUrl, '_blank');
  }

  /**
   * Appelle le numéro de téléphone
   */
  callPhone(phone?: string): void {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  }

  /**
   * Formate la distance pour l'affichage
   */
  formatDistance(distance?: number): string {
    if (!distance) return '';
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance.toFixed(1)} km`;
  }
}
