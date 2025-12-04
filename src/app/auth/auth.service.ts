import { Injectable } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private auth: Auth) {}

  register(email: string, password: string): Observable<any> {
  return from(
    createUserWithEmailAndPassword(this.auth, email, password).then((result) => {
      // Envoyer email de vérification
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

  get currentUser(): User | null {
    return this.auth.currentUser;
  }
}
