import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.services/auth.service';

/**
 * Composant d'inscription
 * Gère la création de nouveaux comptes utilisateur
 */
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

  /**
   * Soumet le formulaire d'inscription
   */
  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.clearMessages();
    
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
        this.errorMessage = this.getErrorMessage(err.code);
      }
    });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'Un compte existe déjà avec cet email.',
      'auth/invalid-email': 'Email invalide.',
      'auth/weak-password': 'Mot de passe trop faible (min. 6 caractères).'
    };
    return messages[code] ?? 'Erreur lors de la création du compte.';
  }
}
