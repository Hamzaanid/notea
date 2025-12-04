import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component/login.component';
import { RegisterComponent } from './auth/register.component/register.component';
import { HomeComponent } from './home.component/home.component';
import { AuthGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' }
];
