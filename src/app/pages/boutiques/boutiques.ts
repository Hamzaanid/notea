import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SephoraService, SephoraStore, SephoraProduct } from '../../services/sephora.service';

interface USCity {
  name: string;
  state: string;
  lat: number;
  lon: number;
}

@Component({
  selector: 'app-boutiques',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './boutiques.html',
  styleUrl: './boutiques.scss',
})
export class Boutiques implements OnInit {
  stores: SephoraStore[] = [];
  filteredStores: SephoraStore[] = [];
  loading = false;
  error = '';
  
  // Mode: 'stores' = liste des magasins, 'availability' = disponibilité d'un produit
  mode: 'stores' | 'availability' = 'stores';
  
  // Produit sélectionné (pour le mode availability)
  selectedProduct: SephoraProduct | null = null;
  skuIdUsed: string = ''; // Pour debug
  
  // Liste des grandes villes US avec coordonnées
  usCities: USCity[] = [
    { name: 'Los Angeles', state: 'CA', lat: 33.9733, lon: -118.2487 },
    { name: 'New York', state: 'NY', lat: 40.7128, lon: -74.0060 },
    { name: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298 },
    { name: 'Houston', state: 'TX', lat: 29.7604, lon: -95.3698 },
    { name: 'Phoenix', state: 'AZ', lat: 33.4484, lon: -112.0740 },
    { name: 'San Francisco', state: 'CA', lat: 37.7749, lon: -122.4194 },
    { name: 'San Diego', state: 'CA', lat: 32.7157, lon: -117.1611 },
    { name: 'Dallas', state: 'TX', lat: 32.7767, lon: -96.7970 },
    { name: 'Miami', state: 'FL', lat: 25.7617, lon: -80.1918 },
    { name: 'Atlanta', state: 'GA', lat: 33.7490, lon: -84.3880 },
    { name: 'Boston', state: 'MA', lat: 42.3601, lon: -71.0589 },
    { name: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321 },
    { name: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903 },
    { name: 'Las Vegas', state: 'NV', lat: 36.1699, lon: -115.1398 },
    { name: 'Orlando', state: 'FL', lat: 28.5383, lon: -81.3792 },
    { name: 'Minneapolis', state: 'MN', lat: 44.9778, lon: -93.2650 },
    { name: 'Detroit', state: 'MI', lat: 42.3314, lon: -83.0458 },
    { name: 'Philadelphia', state: 'PA', lat: 39.9526, lon: -75.1652 },
    { name: 'Portland', state: 'OR', lat: 45.5152, lon: -122.6784 },
    { name: 'Charlotte', state: 'NC', lat: 35.2271, lon: -80.8431 },
  ];
  
  // Ville sélectionnée
  selectedUSCity: string = 'Los Angeles, CA';
  
  // Filtres
  selectedStoreCity = '';
  selectedStoreType = '';
  availableCities: string[] = [];
  
  // Rayon de recherche
  searchRadius = 25;

  constructor(
    private sephoraService: SephoraService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Vérifier si un produit est passé en paramètre (mode availability)
    this.route.queryParams.subscribe(params => {
      if (params['product']) {
        try {
          this.selectedProduct = JSON.parse(decodeURIComponent(params['product']));
          this.mode = 'availability';
          console.log('Produit reçu:', this.selectedProduct);
        } catch (e) {
          console.error('Erreur parsing produit:', e);
        }
      }
      
      // Charger les magasins avec la ville par défaut
      this.loadStoresForCity();
    });
  }

  /**
   * Charge les magasins pour la ville sélectionnée
   */
  loadStoresForCity() {
    const city = this.usCities.find(c => `${c.name}, ${c.state}` === this.selectedUSCity);
    if (city) {
      this.loadStores(city.lat, city.lon);
    }
  }

  /**
   * Change de ville
   */
  onCityChange() {
    this.loadStoresForCity();
  }

  /**
   * Charge les magasins selon le mode
   */
  loadStores(lat: number, lon: number) {
    this.loading = true;
    this.error = '';
    this.stores = [];
    this.skuIdUsed = '';

    if (this.mode === 'availability' && this.selectedProduct) {
      // Mode disponibilité: utiliser check-availability
      const skuId = this.getSkuId(this.selectedProduct);
      this.skuIdUsed = skuId; // Pour debug
      
      console.log('SKU ID utilisé:', skuId);
      console.log('Coordonnées:', lat, lon);
      
      if (!skuId) {
        this.error = 'SKU non disponible pour ce produit';
        this.loading = false;
        return;
      }

      this.sephoraService.checkAvailability(skuId, lat, lon, this.searchRadius).subscribe({
        next: (response) => {
          console.log('Réponse check-availability:', response);
          this.stores = response.stores || [];
          this.extractCities();
          this.applyFilters();
          this.loading = false;
          
          if (this.stores.length === 0) {
            this.error = `Aucun magasin trouvé avec ce produit (SKU: ${skuId})`;
          }
        },
        error: (err) => {
          console.error('Erreur check-availability:', err);
          this.loading = false;
          this.error = 'Erreur lors de la vérification de disponibilité';
        }
      });
    } else {
      // Mode liste: utiliser stores/list
      this.sephoraService.getStoresList(lat, lon, this.searchRadius).subscribe({
        next: (response) => {
          console.log('Réponse stores/list:', response);
          this.stores = response.stores || [];
          this.extractCities();
          this.applyFilters();
          this.loading = false;
          
          if (this.stores.length === 0) {
            this.error = 'Aucun magasin trouvé dans cette zone';
          }
        },
        error: (err) => {
          console.error('Erreur stores/list:', err);
          this.loading = false;
          this.error = 'Erreur lors du chargement des magasins';
        }
      });
    }
  }

  /**
   * Extrait le SKU ID d'un produit
   * L'API attend un ID numérique comme "2210607"
   */
  getSkuId(product: SephoraProduct): string {
    // Essayer différentes sources de SKU
    let skuId = '';
    
    // 1. skuId direct sur le produit
    if (product.skuId) {
      skuId = product.skuId;
    }
    // 2. skuId dans currentSku
    else if (product.currentSku?.skuId) {
      skuId = product.currentSku.skuId;
    }
    // 3. productId comme fallback
    else if (product.productId) {
      skuId = product.productId;
    }
    
    // Nettoyer le SKU (enlever les préfixes comme "P" si présent)
    if (skuId.startsWith('P')) {
      skuId = skuId.substring(1);
    }
    
    console.log('SKU extrait:', skuId, 'depuis:', {
      skuId: product.skuId,
      currentSkuId: product.currentSku?.skuId,
      productId: product.productId
    });
    
    return skuId;
  }

  /**
   * Extrait les villes uniques des magasins
   */
  extractCities() {
    const cities = new Set<string>();
    this.stores.forEach(store => {
      if (store.address?.city) {
        cities.add(store.address.city);
      }
    });
    this.availableCities = Array.from(cities).sort();
  }

  /**
   * Applique les filtres
   */
  applyFilters() {
    let result = [...this.stores];
    
    if (this.selectedStoreCity) {
      result = result.filter(s => s.address?.city === this.selectedStoreCity);
    }
    
    if (this.selectedStoreType) {
      result = result.filter(s => s.storeType === this.selectedStoreType);
    }
    
    this.filteredStores = result;
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters() {
    this.selectedStoreCity = '';
    this.selectedStoreType = '';
    this.applyFilters();
  }

  /**
   * Change le rayon de recherche et recharge
   */
  onRadiusChange() {
    this.loadStoresForCity();
  }

  /**
   * Retourne au catalogue
   */
  goToCatalogue() {
    this.router.navigate(['/ListParfums']);
  }

  /**
   * Ouvre Google Maps avec l'itinéraire
   */
  openMaps(store: SephoraStore) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
    window.open(url, '_blank');
  }

  /**
   * Appelle le numéro de téléphone
   */
  callPhone(phone?: string) {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  }

  /**
   * Formate le numéro de téléphone pour l'affichage
   */
  formatPhone(phone?: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  /**
   * Formate la distance
   */
  formatDistance(distance?: number): string {
    if (!distance) return '';
    return `${distance.toFixed(1)} mi`;
  }

  /**
   * Retourne l'adresse complète formatée
   */
  getFullAddress(store: SephoraStore): string {
    const addr = store.address;
    if (!addr) return '';
    
    const parts = [addr.address1];
    if (addr.address2) parts.push(addr.address2);
    parts.push(`${addr.city}, ${addr.state} ${addr.postalCode}`);
    
    return parts.join(', ');
  }

  /**
   * Retourne les horaires d'aujourd'hui
   */
  getTodayHours(store: SephoraStore): string {
    if (!store.storeHours) return 'Horaires non disponibles';
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const hoursKey = `${today}Hours` as keyof typeof store.storeHours;
    
    return store.storeHours[hoursKey] as string || 'Fermé';
  }

  /**
   * Retourne le type de magasin formaté
   */
  getStoreTypeLabel(storeType: string): string {
    if (storeType === 'SIKLS') return "Sephora chez Kohl's";
    return 'Sephora';
  }

  /**
   * Retourne la couleur du badge de disponibilité
   */
  getAvailabilityClass(store: SephoraStore): string {
    if (store.availabilityStatus === 'In Stock') return 'in-stock';
    if (store.availabilityStatus === 'Out of Stock') return 'out-of-stock';
    return '';
  }

  /**
   * Vérifie si le magasin a des services disponibles
   */
  hasServices(store: SephoraStore): boolean {
    return !!(store.isBopisable || store.isCurbsideEnabled || store.samedayDeliveryEnabled || store.isOnlineReservationEnabled);
  }
}