import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface CarouselSlide {
  image: string;
  title: string;
  subtitle: string;
}

interface PerfumeFamily {
  name: string;
  class: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  private autoSlideInterval: ReturnType<typeof setInterval> | null = null;
  
  slides: CarouselSlide[] = [
    {
      image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&q=80',
      title: 'Nouvelle Collection',
      subtitle: 'Découvrez nos fragrances exclusives de la saison'
    },
    {
      image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=1200&q=80',
      title: 'Offre Spéciale',
      subtitle: '-20% sur une sélection de parfums premium'
    },
    {
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80',
      title: 'Édition Limitée',
      subtitle: 'Des créations uniques pour les connaisseurs'
    },
    {
      image: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=1200&q=80',
      title: 'Coffrets Cadeaux',
      subtitle: "L'art d'offrir un parfum d'exception"
    }
  ];

  perfumeFamilies: PerfumeFamily[] = [
    { name: 'Ambré', class: 'amber' },
    { name: 'Floral', class: 'floral' },
    { name: 'Boisé', class: 'woody' },
    { name: 'Frais', class: 'fresh' },
    { name: 'Oriental', class: 'oriental' }
  ];

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  startAutoSlide(): void {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.stopAutoSlide();
    this.startAutoSlide();
  }
}
