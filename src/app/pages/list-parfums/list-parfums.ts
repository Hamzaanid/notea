import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-list-parfums',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './list-parfums.html',
  styleUrl: './list-parfums.scss',
})
export class ListParfums {}
