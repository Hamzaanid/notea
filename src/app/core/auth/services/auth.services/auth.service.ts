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

/**
 * Service d'authentification Firebase
 * Gère l'inscription, la connexion, la déconnexion et la réinitialisation du mot de passe
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private readonly isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  
  /** Observable de l'état de connexion */
  readonly isLoggedIn$ = this.isLoggedInSubject.asObservable();
  
  /** Observable de l'utilisateur courant */
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private auth: Auth) {
    this.initializeAuthListener();
  }

  /**
   * Initialise l'écoute des changements d'état d'authentification
   */
  private initializeAuthListener(): void {
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

  /**
   * Inscrit un nouvel utilisateur et envoie un email de vérification
   * @param email - Adresse email
   * @param password - Mot de passe
   */
  register(email: string, password: string): Observable<any> {
    return from(
      createUserWithEmailAndPassword(this.auth, email, password).then((result) => {
        sendEmailVerification(result.user);
        return result;
      })
    );
  }

  /**
   * Connecte un utilisateur existant
   * @param email - Adresse email
   * @param password - Mot de passe
   */
  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  /**
   * Déconnecte l'utilisateur courant
   */
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  /**
   * Envoie un email de réinitialisation du mot de passe
   * @param email - Adresse email
   */
  resetPassword(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.auth, email));
  }

  /**
   * Récupère l'utilisateur actuellement connecté
   */
  get currentUser(): User | null {
    return this.auth.currentUser;
  }
  
  /**
   * Vérifie si un utilisateur est authentifié (connecté et email vérifié)
   */
  get isAuthenticated(): boolean {
    const user = this.auth.currentUser;
    return !!user && user.emailVerified;
  }
}
