import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-test-perso',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './test-perso.html',
  styleUrl: './test-perso.scss',
})
export class TestPerso {}
