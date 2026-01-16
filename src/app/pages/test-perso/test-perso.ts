import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PersonalityTestService } from '../../services/personality-test.service';
import { SephoraService, SephoraProduct } from '../../services/sephora.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../core/auth/services/auth.services/auth.service';
import { 
  Question, 
  Answer, 
  TestResult, 
  PersonalityProfile,
  FragranceTag 
} from '../../interfaces/personality.types';

type TestStep = 'intro' | 'gender' | 'questions' | 'calculating' | 'results';

@Component({
  selector: 'app-test-perso',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './test-perso.html',
  styleUrl: './test-perso.scss',
})
export class TestPerso implements OnInit {
  // État du test
  currentStep: TestStep = 'intro';
  selectedGender: 'cat1230039' | 'cat1230040' | 'cat5000004' | null = null;
  currentQuestionIndex = 0;
  answers: Answer[] = [];
  
  // Données
  questions: Question[] = [];
  testResult: TestResult | null = null;
  recommendedProducts: SephoraProduct[] = [];
  
  // État UI
  loading = false;
  error = '';
  isLoggedIn = false;

  constructor(
    private personalityTestService: PersonalityTestService,
    private sephoraService: SephoraService,
    private favoritesService: FavoritesService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.questions = this.personalityTestService.getQuestions();
    this.authService.isLoggedIn$.subscribe(isLogged => {
      this.isLoggedIn = isLogged;
    });
  }

  /**
   * Démarre le test
   */
  startTest() {
    this.currentStep = 'gender';
    this.selectedGender = null;
    this.currentQuestionIndex = 0;
    this.answers = [];
  }

  /**
   * Sélectionne le genre et passe aux questions
   */
  selectGender(gender: 'cat1230039' | 'cat1230040' | 'cat5000004') {
    this.selectedGender = gender;
    this.currentStep = 'questions';
    this.currentQuestionIndex = 0;
  }

  /**
   * Sélectionne une réponse à la question actuelle
   */
  selectAnswer(answer: Answer) {
    this.answers.push(answer);
    
    // Passer à la question suivante ou terminer
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    } else {
      this.completeTest();
    }
  }

  /**
   * Retourne à la question précédente
   */
  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.answers.pop();
    } else if (this.currentStep === 'questions') {
      // Retourner à la sélection du genre
      this.currentStep = 'gender';
      this.answers = [];
    }
  }

  /**
   * Termine le test et calcule le profil
   */
  completeTest() {
    if (!this.selectedGender || this.answers.length !== this.questions.length) {
      this.error = 'Veuillez répondre à toutes les questions';
      return;
    }

    this.currentStep = 'calculating';
    this.loading = true;
    this.error = '';

    // Calculer les scores
    const scores = this.personalityTestService.calculateScores(this.answers);
    
    // Déterminer le profil
    const profile = this.personalityTestService.calculateProfile(scores);

    // Créer le résultat
    this.testResult = {
      profile,
      scores,
      selectedGender: this.selectedGender
    };

    // Charger les recommandations
    this.loadRecommendations(profile);
  }

  /**
   * Charge les parfums recommandés selon le profil
   */
  loadRecommendations(profile: PersonalityProfile) {
    if (!this.selectedGender) return;

    this.sephoraService.getProductsWithFragranceFilters(
      this.selectedGender,
      profile.fragranceFamily,
      profile.fragranceType,
      1,
      8 // Récupérer 8 parfums recommandés
    ).subscribe({
      next: (response: any) => {
        this.recommendedProducts = response.products || [];
        this.currentStep = 'results';
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des recommandations:', err);
        this.error = 'Erreur lors du chargement des recommandations';
        this.loading = false;
        // Afficher quand même les résultats même sans produits
        this.currentStep = 'results';
      }
    });
  }

  /**
   * Retourne la question actuelle
   */
  getCurrentQuestion(): Question | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  /**
   * Retourne le pourcentage de progression
   */
  getProgress(): number {
    if (this.currentStep === 'gender') return 0;
    if (this.currentStep === 'questions') {
      return ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
    }
    return 100;
  }

  /**
   * Retourne le nom du profil
   */
  getProfileName(tag: FragranceTag): string {
    return this.personalityTestService.getProfileName(tag);
  }

  /**
   * Retourne la description du profil
   */
  getProfileDescription(tag: FragranceTag): string {
    return this.personalityTestService.getProfileDescription(tag);
  }

  /**
   * Ouvre un produit dans Sephora
   */
  openProduct(product: SephoraProduct) {
    const url = `https://www.sephora.com${product.targetUrl}`;
    window.open(url, '_blank');
  }

  /**
   * Vérifie si un produit est en favori
   */
  isFavorite(productId: string): boolean {
    return this.favoritesService.isFavorite(productId);
  }

  /**
   * Toggle le favori
   */
  async toggleFavorite(event: Event, product: SephoraProduct) {
    event.stopPropagation();
    
    if (!this.isLoggedIn) {
      alert('Veuillez vous connecter pour ajouter des favoris');
      return;
    }

    try {
      const productData = {
        productId: product.productId,
        skuId: product.skuId || product.currentSku?.skuId || product.productId,
        brandName: product.brandName,
        displayName: product.displayName,
        heroImage: product.heroImage,
        altImage: product.altImage || '',
        rating: product.rating || '0',
        reviews: product.reviews || '0',
        price: product.currentSku?.listPrice || 'Prix non disponible',
        targetUrl: product.targetUrl,
        isNew: product.currentSku?.isNew || false,
        isLimitedEdition: product.currentSku?.isLimitedEdition || false,
        isSephoraExclusive: product.currentSku?.isSephoraExclusive || false
      };
      
      await this.favoritesService.toggleFavorite(productData);
    } catch (error) {
      console.error('Erreur lors de la modification du favori:', error);
    }
  }

  /**
   * Refaire le test
   */
  restartTest() {
    this.currentStep = 'intro';
    this.selectedGender = null;
    this.currentQuestionIndex = 0;
    this.answers = [];
    this.testResult = null;
    this.recommendedProducts = [];
    this.error = '';
  }

  /**
   * Formate le prix
   */
  formatPrice(price: string | undefined): string {
    return price || 'Prix non disponible';
  }

  /**
   * Formate la note
   */
  formatRating(rating: string): string {
    const num = parseFloat(rating);
    return isNaN(num) ? '0.0' : num.toFixed(1);
  }
}
