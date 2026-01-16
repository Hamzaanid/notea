import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.services/auth.service';

/**
 * Composant de connexion
 * Gère l'authentification et la réinitialisation du mot de passe
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  form: FormGroup;
  resetForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  loading = false;
  showResetModal = false;
  resetLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  /**
   * Soumet le formulaire de connexion
   */
  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.clearMessages();
    
    const { email, password } = this.form.value;

    this.authService.login(email, password).subscribe({
      next: (userCredential) => {
        this.loading = false;
        
        if (!userCredential.user.emailVerified) {
          this.errorMessage = "Veuillez vérifier votre email avant de vous connecter.";
          return;
        }
        
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.getLoginErrorMessage(err.code);
      }
    });
  }

  /**
   * Connexion avec Google
   */
  loginWithGoogle(): void {
    this.loading = true;
    this.clearMessages();

    this.authService.loginWithGoogle().subscribe({
      next: (userCredential) => {
        this.loading = false;
        // Les utilisateurs Google sont automatiquement vérifiés, pas besoin de vérifier emailVerified
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.getGoogleLoginErrorMessage(err.code);
      }
    });
  }

  /**
   * Ouvre le modal de réinitialisation du mot de passe
   */
  openResetModal(): void {
    this.showResetModal = true;
    this.clearMessages();
    
    const email = this.form.get('email')?.value;
    if (email) {
      this.resetForm.patchValue({ email });
    }
  }

  /**
   * Ferme le modal de réinitialisation
   */
  closeResetModal(): void {
    this.showResetModal = false;
    this.resetForm.reset();
  }

  /**
   * Soumet la demande de réinitialisation du mot de passe
   */
  onResetPassword(): void {
    if (this.resetForm.invalid) return;

    this.resetLoading = true;
    this.clearMessages();

    const email = this.resetForm.get('email')?.value;

    this.authService.resetPassword(email).subscribe({
      next: () => {
        this.resetLoading = false;
        this.successMessage = 'Un email de réinitialisation a été envoyé. Vérifiez votre boîte mail.';
        this.closeResetModal();
      },
      error: (err) => {
        this.resetLoading = false;
        this.errorMessage = this.getResetErrorMessage(err.code);
      }
    });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private getLoginErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
      'auth/wrong-password': 'Mot de passe incorrect.',
      'auth/invalid-email': 'Email invalide.',
      'auth/invalid-credential': 'Identifiants incorrects.',
      'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.'
    };
    return messages[code] ?? 'Erreur de connexion. Vérifiez vos identifiants.';
  }

  private getResetErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
      'auth/invalid-email': 'Email invalide.'
    };
    return messages[code] ?? "Erreur lors de l'envoi. Réessayez.";
  }

  private getGoogleLoginErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/popup-closed-by-user': 'Connexion annulée.',
      'auth/popup-blocked': 'Popup bloquée. Autorisez les popups pour ce site.',
      'auth/cancelled-popup-request': 'Connexion annulée.',
      'auth/account-exists-with-different-credential': 'Un compte existe déjà avec cet email.'
    };
    return messages[code] ?? 'Erreur lors de la connexion avec Google. Réessayez.';
  }
}
