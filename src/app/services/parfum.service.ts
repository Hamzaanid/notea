import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface PerfumeCard {
  id: string;
  brand: string;
  name: string;
  image: string;
}

@Injectable({ providedIn: 'root' })
export class ParfumService {
  constructor(private http: HttpClient) {}

  // TODO: Implémenter la récupération des parfums
  getPerfumes(): Observable<PerfumeCard[]> {
    return of([]);
  }
}
