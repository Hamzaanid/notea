import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Composant Footer - Pied de page de l'application
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss'],
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
}
