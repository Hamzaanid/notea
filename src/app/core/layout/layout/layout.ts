import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './../header/header';
import { FooterComponent } from '../footer/footer'; // adapter le chemin si besoin

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent,FooterComponent],
  templateUrl: './layout.html'
})
export class LayoutComponent {}
