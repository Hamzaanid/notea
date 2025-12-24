import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SephoraService {

  private apiUrl = 'https://fakestoreapi.com/products';

  constructor(private http: HttpClient) {}

  getBestSellers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(products =>
        products
          .filter(p => p.category.includes('beauty') || p.category.includes('fragrance'))
          .slice(0, 3)
          .map(p => ({
            brand: 'Nôtea Selection',
            name: p.title,
            price: p.price + '€',
            image: p.image
          }))
      )
    );
  }
}
