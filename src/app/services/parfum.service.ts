import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ParfumService {

  private url = 'https://dummyjson.com/products/category/fragrances';

  constructor(private http: HttpClient) {}

  getBestSellers(): Observable<any[]> {
    return this.http.get<any>(this.url).pipe(
      map(res =>
        res.products.slice(0, 3).map((p: any) => ({
          brand: p.brand,
          name: p.title,
          price: p.price + '€',
          image: p.images[0]   // 💥 IMAGE GARANTIE
        }))
      )
    );
  }
}
