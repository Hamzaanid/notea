import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { ParfumService } from '../../services/parfum.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  isLoggedIn = false;
  loading = false;
  bestSellers: any[] = [];

  constructor(private auth: Auth, private parfumService: ParfumService) {
    this.isLoggedIn = !!this.auth.currentUser;

    if (this.isLoggedIn) {
      this.loadPerfumes();
    }
  }

  loadPerfumes() {
    this.loading = true;

    this.parfumService.getBestSellers().subscribe({
      next: (data) => {
        this.bestSellers = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
