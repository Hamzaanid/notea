import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  form: FormGroup;
  errorMessage = '';
  successMessage = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const { email, password } = this.form.value;

    this.authService.register(email, password).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = "Un email de vérification vous a été envoyé. Vérifiez votre boîte mail.";
        
        // Redirection après 3 secondes
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        
        switch (err.code) {
          case 'auth/email-already-in-use':
            this.errorMessage = 'Un compte existe déjà avec cet email.';
            break;
          case 'auth/invalid-email':
            this.errorMessage = 'Email invalide.';
            break;
          case 'auth/weak-password':
            this.errorMessage = 'Mot de passe trop faible (min. 6 caractères).';
            break;
          default:
            this.errorMessage = 'Erreur lors de la création du compte.';
        }
      }
    });
  }
}
