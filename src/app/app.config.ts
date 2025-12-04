import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// 🔹 Firebase
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    //tes providers Angular existants
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    //ajout Firebase App (initialisation avec ta config)
    provideFirebaseApp(() => initializeApp(environment.firebase)),

    //ajout Firebase Auth (service d'authentification)
    provideAuth(() => getAuth()),
  ],
};
