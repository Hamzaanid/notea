import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private auth: Auth, private router: Router) {}

  canActivate(): boolean | UrlTree {
    const user = this.auth.currentUser;

    // 🟢 connecté ET email vérifié
    if (user && user.emailVerified) {
      return true;
    }

    // 🔴 pas connecté ou email pas vérifié → retour login
    return this.router.parseUrl('/login');
  }
}
