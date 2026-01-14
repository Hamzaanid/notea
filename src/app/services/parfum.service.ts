import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/**
 * Interface représentant une carte de parfum basique
 */
export interface PerfumeCard {
  id: string;
  brand: string;
  name: string;
  image: string;
}

/**
 * Service de gestion des parfums (implémentation locale)
 * Note: Service de base, l'API Sephora est utilisée pour les données réelles
 */
@Injectable({ providedIn: 'root' })
export class ParfumService {
  
  /**
   * Récupère la liste des parfums
   * @returns Observable d'un tableau de parfums
   */
  getPerfumes(): Observable<PerfumeCard[]> {
    return of([]);
  }
}
