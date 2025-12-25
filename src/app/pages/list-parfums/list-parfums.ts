import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { ParfumService, PerfumeCard } from '../../services/parfum.service';

@Component({
  selector: 'app-list-parfums',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './list-parfums.html',
  styleUrl: './list-parfums.scss',
})
export class ListParfums {
  isLoggedIn = false;

  loading = false;
  errorMsg = '';

  perfumes: PerfumeCard[] = [];

  // Pagination
  page = 1;
  pageSize = 12;
  pageCount = 1;
  total = 0;

  constructor(private auth: Auth, private parfumService: ParfumService) {
    this.isLoggedIn = !!this.auth.currentUser;

    if (this.isLoggedIn) {
      this.loadPage(1);
    }
  }

  loadPage(page: number) {
    // garde-fous
    if (page < 1) return;
    if (page > this.pageCount) return;

    this.loading = true;
    this.errorMsg = '';

    this.parfumService
      .getPerfumes({ page, pageSize: this.pageSize, lang: 'fr', onlyWithImages: true })
      .subscribe({
        next: ({ meta, items }) => {
          this.page = meta.page;
          this.pageCount = Math.max(1, meta.pageCount);
          this.total = meta.count;
          this.perfumes = items;
          this.loading = false;
        },
        error: () => {
          this.errorMsg =
            "Impossible de charger les parfums pour le moment. Réessaie dans quelques secondes.";
          this.loading = false;
        },
      });
  }

  next() {
    this.loadPage(this.page + 1);
  }

  prev() {
    this.loadPage(this.page - 1);
  }

  trackById(_: number, p: PerfumeCard) {
    return p.id;
  }

  onImgError(event: Event) {
  const img = event.target as HTMLImageElement | null;
  if (img) img.src = 'assets/perfume-placeholder.png';
}
}
