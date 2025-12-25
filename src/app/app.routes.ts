import { Routes } from '@angular/router';
import { LoginComponent } from './core/auth/login.component/login.component';
import { RegisterComponent } from './core/auth/register.component/register.component';
import { HomeComponent } from './pages/home/home.component';
import { ListParfums } from './pages/list-parfums/list-parfums';
import { TestPerso } from './pages/test-perso/test-perso';
import { Profile } from './pages/profile/profile';
import { Favoris } from './pages/favoris/favoris';
import { AuthGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './core/layout/layout/layout'; // ⬅️ ton layout

export const routes: Routes = [
  // ⬇️ Pages sans layout (pas de header/footer)
    {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'home', component: HomeComponent },
      { path: 'ListParfums', component: ListParfums },

    ]
  },
  // ⬇️ Pages avec layout (header + footer)
  {
    path: '',
    component: LayoutComponent,      // ⬅️ ici on applique le layout
    canActivate: [AuthGuard],        // ⬅️ protège tout ce bloc
    children: [
      { path: 'test-personnalite', component: TestPerso },
      { path: 'profile', component: Profile },
      { path: 'Favoris', component: Favoris },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },

  // ⬇️ Route par défaut si URL inconnue
  { path: '**', redirectTo: 'home' }
];
