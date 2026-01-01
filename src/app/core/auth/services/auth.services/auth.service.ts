import { Injectable } from '@angular/core';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { from, Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  // BehaviorSubject pour tracker l'état de connexion en temps réel
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  
  // BehaviorSubject pour l'utilisateur courant
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private auth: Auth) {
    // Écouter les changements d'état d'authentification Firebase
    onAuthStateChanged(this.auth, (user) => {
      if (user && user.emailVerified) {
        this.isLoggedInSubject.next(true);
        this.currentUserSubject.next(user);
      } else {
        this.isLoggedInSubject.next(false);
        this.currentUserSubject.next(null);
      }
    });
  }

  register(email: string, password: string): Observable<any> {
    return from(
      createUserWithEmailAndPassword(this.auth, email, password).then((result) => {
        sendEmailVerification(result.user);
        return result;
      })
    );
  }

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  // Réinitialisation du mot de passe
  resetPassword(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.auth, email));
  }

  get currentUser(): User | null {
    return this.auth.currentUser;
  }
  
  get isAuthenticated(): boolean {
    const user = this.auth.currentUser;
    return !!user && user.emailVerified;
  }
}
