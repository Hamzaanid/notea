import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Auth } from '@angular/fire/auth';

/**
 * Guard de protection des routes authentifiées
 * Redirige vers la page de connexion si l'utilisateur n'est pas authentifié
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private auth: Auth, 
    private router: Router
  ) {}

  /**
   * Vérifie si l'utilisateur peut accéder à la route
   * @returns true si connecté et email vérifié, sinon redirige vers /login
   */
  canActivate(): boolean | UrlTree {
    const user = this.auth.currentUser;

    if (user && user.emailVerified) {
      return true;
    }

    return this.router.parseUrl('/login');
  }
}
