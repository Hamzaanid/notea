import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Composant test de personnalité
 * Permet aux utilisateurs de découvrir leur profil olfactif
 */
@Component({
  selector: 'app-test-perso',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './test-perso.html',
  styleUrl: './test-perso.scss',
})
export class TestPerso {}
