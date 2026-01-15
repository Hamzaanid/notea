import { Routes } from '@angular/router';
import { LoginComponent } from './core/auth/login.component/login.component';
import { RegisterComponent } from './core/auth/register.component/register.component';
import { HomeComponent } from './pages/home/home.component';
import { ListParfums } from './pages/list-parfums/list-parfums';
import { TestPerso } from './pages/test-perso/test-perso';
import { Profile } from './pages/profile/profile';
import { Favoris } from './pages/favoris/favoris';
import { Boutiques } from './pages/boutiques/boutiques';
import { AuthGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './core/layout/layout/layout';

export const routes: Routes = [
  // Redirection racine → home
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  
  // Pages publiques (avec layout)
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'ListParfums', component: ListParfums },
      { path: 'boutiques', component: Boutiques },
    ]
  },
  
  // Pages protégées (après connexion)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'test-personnalite', component: TestPerso },
      { path: 'profile', component: Profile },
      { path: 'Favoris', component: Favoris },
    ]
  },

  // Route par défaut (404 → home)
  { path: '**', redirectTo: 'home' }
];
