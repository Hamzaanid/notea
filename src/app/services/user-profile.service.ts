import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string; // Format: YYYY-MM-DD
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  /**
   * Récupère le profil de l'utilisateur connecté
   */
  getProfile(): Observable<UserProfile | null> {
    const user = this.auth.currentUser;
    if (!user) {
      return of(null);
    }

    const docRef = doc(this.firestore, 'users', user.uid);
    return from(getDoc(docRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            uid: user.uid,
            email: user.email || '',
            firstName: data['firstName'] || '',
            lastName: data['lastName'] || '',
            dateOfBirth: data['dateOfBirth'] || '',
            address: {
              street: data['address']?.['street'] || '',
              city: data['address']?.['city'] || '',
              postalCode: data['address']?.['postalCode'] || '',
              country: data['address']?.['country'] || 'France'
            },
            createdAt: data['createdAt']?.toDate?.() || new Date(),
            updatedAt: data['updatedAt']?.toDate?.() || new Date()
          } as UserProfile;
        }
        return null;
      }),
      catchError(error => {
        console.error('Erreur récupération profil:', error);
        return of(null);
      })
    );
  }

  /**
   * Sauvegarde ou met à jour le profil utilisateur
   */
  saveProfile(profile: Partial<UserProfile>): Observable<boolean> {
    const user = this.auth.currentUser;
    if (!user) {
      return of(false);
    }

    const docRef = doc(this.firestore, 'users', user.uid);
    const now = new Date();
    
    const profileData: any = {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      dateOfBirth: profile.dateOfBirth || '',
      address: {
        street: profile.address?.street || '',
        city: profile.address?.city || '',
        postalCode: profile.address?.postalCode || '',
        country: profile.address?.country || 'France'
      },
      updatedAt: now
    };

    return from(getDoc(docRef)).pipe(
      map(async (docSnap) => {
        try {
          if (!docSnap.exists()) {
            // Création
            profileData.createdAt = now;
            await setDoc(docRef, profileData);
          } else {
            // Mise à jour
            await updateDoc(docRef, profileData);
          }
          return true;
        } catch (error) {
          console.error('Erreur sauvegarde profil:', error);
          return false;
        }
      }),
      map(() => true),
      catchError(error => {
        console.error('Erreur sauvegarde profil:', error);
        return of(false);
      })
    );
  }
}




