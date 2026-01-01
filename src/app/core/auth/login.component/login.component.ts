import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.services/auth.service';

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

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
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
        console.error(err);
        
        switch (err.code) {
          case 'auth/user-not-found':
            this.errorMessage = 'Aucun compte trouvé avec cet email.';
            break;
          case 'auth/wrong-password':
            this.errorMessage = 'Mot de passe incorrect.';
            break;
          case 'auth/invalid-email':
            this.errorMessage = 'Email invalide.';
            break;
          case 'auth/invalid-credential':
            this.errorMessage = 'Identifiants incorrects.';
            break;
          case 'auth/too-many-requests':
            this.errorMessage = 'Trop de tentatives. Réessayez plus tard.';
            break;
          default:
            this.errorMessage = 'Erreur de connexion. Vérifiez vos identifiants.';
        }
      }
    });
  }

  openResetModal() {
    this.showResetModal = true;
    this.errorMessage = '';
    this.successMessage = '';
    // Pré-remplir avec l'email du formulaire de login si disponible
    if (this.form.get('email')?.value) {
      this.resetForm.patchValue({ email: this.form.get('email')?.value });
    }
  }

  closeResetModal() {
    this.showResetModal = false;
    this.resetForm.reset();
  }

  onResetPassword() {
    if (this.resetForm.invalid) {
      return;
    }

    this.resetLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.resetForm.get('email')?.value;

    this.authService.resetPassword(email).subscribe({
      next: () => {
        this.resetLoading = false;
        this.successMessage = 'Un email de réinitialisation a été envoyé. Vérifiez votre boîte mail.';
        this.showResetModal = false;
        this.resetForm.reset();
      },
      error: (err) => {
        this.resetLoading = false;
        console.error(err);
        
        switch (err.code) {
          case 'auth/user-not-found':
            this.errorMessage = 'Aucun compte trouvé avec cet email.';
            break;
          case 'auth/invalid-email':
            this.errorMessage = 'Email invalide.';
            break;
          default:
            this.errorMessage = 'Erreur lors de l\'envoi. Réessayez.';
        }
      }
    });
  }
}
