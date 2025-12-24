import { Routes } from '@angular/router';
import { LoginComponent } from './core/auth/login.component/login.component';
import { RegisterComponent } from './core/auth/register.component/register.component';
import { HomeComponent } from './pages/Nouveaute/home.component';
import { AuthGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './core/layout/layout/layout'; // ⬅️ ton layout

export const routes: Routes = [
  // ⬇️ Pages sans layout (pas de header/footer)
    {
    path: '',
    component: LayoutComponent,        // ⬅️ protège tout ce bloc
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
    ]
  },
  // ⬇️ Pages avec layout (header + footer)
  {
    path: '',
    component: LayoutComponent,      // ⬅️ ici on applique le layout
    canActivate: [AuthGuard],        // ⬅️ protège tout ce bloc
    children: [
      { path: 'Nouveaute', component: HomeComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },

  // ⬇️ Route par défaut si URL inconnue
  { path: '**', redirectTo: 'Nouveaute' }
];
