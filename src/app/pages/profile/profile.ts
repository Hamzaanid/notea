import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserProfileService, UserProfile } from '../../services/user-profile.service';
import { AuthService } from '../../core/auth/services/auth.services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  loading = true;
  saving = false;
  isEditing = false;
  
  successMessage = '';
  errorMessage = '';
  
  userEmail = '';
  profile: UserProfile = {
    uid: '',
    email: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'France'
    }
  };

  originalProfile: UserProfile | null = null;

  countries = [
    'France', 'Belgique', 'Suisse', 'Luxembourg', 'Canada', 
    'États-Unis', 'Maroc', 'Algérie', 'Tunisie', 'Sénégal'
  ];

  constructor(
    private userProfileService: UserProfileService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.errorMessage = '';

    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userEmail = user.email || '';
        this.profile.email = this.userEmail;
      }
    });

    this.userProfileService.getProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.profile = { ...this.profile, ...profile };
          if (!this.profile.address) {
            this.profile.address = { street: '', city: '', postalCode: '', country: 'France' };
          }
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement du profil';
        this.loading = false;
      }
    });
  }

  startEditing() {
    this.originalProfile = JSON.parse(JSON.stringify(this.profile));
    this.isEditing = true;
    this.clearMessages();
  }

  cancelEditing() {
    if (this.originalProfile) {
      this.profile = JSON.parse(JSON.stringify(this.originalProfile));
    }
    this.isEditing = false;
    this.clearMessages();
  }

  saveProfile() {
    if (!this.validateForm()) return;

    this.saving = true;
    this.clearMessages();

    this.userProfileService.saveProfile(this.profile).subscribe({
      next: (success) => {
        this.saving = false;
        if (success) {
          this.successMessage = 'Profil enregistré avec succès';
          this.isEditing = false;
          this.originalProfile = null;
          setTimeout(() => this.successMessage = '', 4000);
        } else {
          this.errorMessage = 'Erreur lors de la sauvegarde';
        }
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Erreur lors de la sauvegarde';
      }
    });
  }

  validateForm(): boolean {
    if (!this.profile.firstName?.trim()) {
      this.errorMessage = 'Le prénom est requis';
      return false;
    }
    if (!this.profile.lastName?.trim()) {
      this.errorMessage = 'Le nom est requis';
      return false;
    }
    if (!this.profile.address?.city?.trim()) {
      this.errorMessage = 'La ville est requise';
      return false;
    }
    if (!this.profile.address?.postalCode?.trim()) {
      this.errorMessage = 'Le code postal est requis';
      return false;
    }
    return true;
  }

  clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
