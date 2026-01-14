import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.services/auth.service';
import { Subscription } from 'rxjs';

/**
 * Composant Header - Navigation principale de l'application
 * Gère l'affichage du menu, l'état de connexion et le comportement au scroll
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  menuOpen = false;
  isScrolled = false;
  
  private authSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscribeToAuth();
    this.checkScroll();
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  /**
   * S'abonne aux changements d'état de connexion
   */
  private subscribeToAuth(): void {
    this.authSubscription = this.authService.isLoggedIn$.subscribe(
      (loggedIn) => this.isLoggedIn = loggedIn
    );
  }

  /**
   * Vérifie la position du scroll pour modifier l'apparence du header
   */
  @HostListener('window:scroll')
  checkScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  /**
   * Ouvre/ferme le menu mobile
   */
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  /**
   * Ferme le menu mobile
   */
  closeMenu(): void {
    this.menuOpen = false;
  }

  /**
   * Déconnecte l'utilisateur
   */
  logout(): void {
    this.authService.logout().subscribe(() => {
      this.closeMenu();
      this.router.navigate(['/home']);
    });
  }

  /**
   * Vérifie si une route est active
   */
  isActive(route: string): boolean {
    return this.router.url === route;
  }
}
