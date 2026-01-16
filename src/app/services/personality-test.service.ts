import { Injectable } from '@angular/core';
import { 
  Question, 
  Answer, 
  TagScore, 
  PersonalityProfile, 
  FragranceTag,
  FragranceFamily 
} from '../interfaces/personality.types';

@Injectable({
  providedIn: 'root'
})
export class PersonalityTestService {
  
  // Mapping des tags vers les filtres API
  private readonly tagToFamilyMap: Record<FragranceTag, FragranceFamily> = {
    warmSweetGourmands: 'warmspicy',
    freshCitrusFruits: 'fresh',
    woodySpices: 'warmspicy',
    earthyGreensHerbs: 'fresh',
    floralSoft: 'floral',
    aquaticMarine: 'fresh'
  };

  // Descriptions des profils
  private readonly profileDescriptions: Record<FragranceTag, string> = {
    warmSweetGourmands: 'Tu aimes les parfums réconfortants et gourmands. Vanille, caramel et notes sucrées te font fondre.',
    freshCitrusFruits: 'Tu préfères les fragrances fraîches et énergisantes. Agrumes et notes fruitées te dynamisent.',
    woodySpices: 'Tu es attiré(e) par les parfums chauds et épicés. Notes boisées et épices t\'enveloppent de mystère.',
    earthyGreensHerbs: 'Tu recherches l\'authenticité et la nature. Notes vertes et terreuses te connectent à l\'essentiel.',
    floralSoft: 'Tu aimes l\'élégance et la douceur. Notes florales délicates te font sentir raffiné(e).',
    aquaticMarine: 'Tu préfères les parfums frais et aériens. Notes marines et aquatiques t\'apportent légèreté.'
  };

  // Noms d'affichage des profils
  private readonly profileNames: Record<FragranceTag, string> = {
    warmSweetGourmands: 'Gourmand & Sucré',
    freshCitrusFruits: 'Frais & Agrumes',
    woodySpices: 'Boisé & Épicé',
    earthyGreensHerbs: 'Terreux & Verts',
    floralSoft: 'Floral & Doux',
    aquaticMarine: 'Aquatique & Marin'
  };

  /**
   * Les 4 questions du test
   */
  getQuestions(): Question[] {
    return [
      {
        id: 1,
        text: 'Quand tu sors le soir, tu préfères...',
        answers: [
          {
            text: 'Un restaurant cosy avec bougies',
            tags: [{ tag: 'warmSweetGourmands', points: 1 }]
          },
          {
            text: 'Un bar branché avec cocktails',
            tags: [
              { tag: 'freshCitrusFruits', points: 1 },
              { tag: 'aquaticMarine', points: 1 }
            ]
          },
          {
            text: 'Un concert ou événement culturel',
            tags: [
              { tag: 'woodySpices', points: 1 },
              { tag: 'floralSoft', points: 1 }
            ]
          },
          {
            text: 'Une balade en nature',
            tags: [
              { tag: 'earthyGreensHerbs', points: 1 },
              { tag: 'woodySpices', points: 1 }
            ]
          }
        ]
      },
      {
        id: 2,
        text: 'Ton style de vie est plutôt...',
        answers: [
          {
            text: 'Cocooning, moments douillets',
            tags: [
              { tag: 'warmSweetGourmands', points: 1 },
              { tag: 'floralSoft', points: 1 }
            ]
          },
          {
            text: 'Actif, toujours en mouvement',
            tags: [
              { tag: 'freshCitrusFruits', points: 1 },
              { tag: 'aquaticMarine', points: 1 }
            ]
          },
          {
            text: 'Sophistiqué, recherche de qualité',
            tags: [
              { tag: 'floralSoft', points: 1 },
              { tag: 'woodySpices', points: 1 }
            ]
          },
          {
            text: 'Naturel, minimaliste',
            tags: [
              { tag: 'earthyGreensHerbs', points: 1 },
              { tag: 'woodySpices', points: 1 }
            ]
          }
        ]
      },
      {
        id: 3,
        text: 'Quelle ambiance te détend vraiment ?',
        answers: [
          {
            text: 'Un bain chaud avec bougies parfumées',
            tags: [{ tag: 'warmSweetGourmands', points: 1 }]
          },
          {
            text: 'Une douche fraîche après le sport',
            tags: [
              { tag: 'freshCitrusFruits', points: 1 },
              { tag: 'aquaticMarine', points: 1 }
            ]
          },
          {
            text: 'Un feu de cheminée, un bon livre',
            tags: [
              { tag: 'woodySpices', points: 1 },
              { tag: 'warmSweetGourmands', points: 1 }
            ]
          },
          {
            text: 'Un jardin, une promenade en forêt',
            tags: [
              { tag: 'earthyGreensHerbs', points: 1 },
              { tag: 'floralSoft', points: 1 }
            ]
          }
        ]
      },
      {
        id: 4,
        text: 'Quand tu choisis un parfum, tu veux...',
        answers: [
          {
            text: 'Te sentir réconforté(e) et enveloppé(e)',
            tags: [{ tag: 'warmSweetGourmands', points: 1 }]
          },
          {
            text: 'Te sentir frais(che) et énergique',
            tags: [
              { tag: 'freshCitrusFruits', points: 1 },
              { tag: 'aquaticMarine', points: 1 }
            ]
          },
          {
            text: 'Te sentir élégant(e) et distingué(e)',
            tags: [
              { tag: 'floralSoft', points: 1 },
              { tag: 'woodySpices', points: 1 }
            ]
          },
          {
            text: 'Te sentir authentique et connecté(e) à la nature',
            tags: [
              { tag: 'earthyGreensHerbs', points: 1 },
              { tag: 'woodySpices', points: 1 }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Calcule les scores à partir des réponses
   */
  calculateScores(answers: Answer[]): TagScore[] {
    const scores: Record<FragranceTag, number> = {
      warmSweetGourmands: 0,
      freshCitrusFruits: 0,
      woodySpices: 0,
      earthyGreensHerbs: 0,
      floralSoft: 0,
      aquaticMarine: 0
    };

    // Additionner les points pour chaque réponse
    answers.forEach(answer => {
      answer.tags.forEach(({ tag, points }) => {
        scores[tag] += points;
      });
    });

    // Convertir en tableau et trier par score décroissant
    return Object.entries(scores)
      .map(([tag, score]) => ({ tag: tag as FragranceTag, score }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Détermine le profil à partir des scores
   */
  calculateProfile(scores: TagScore[]): PersonalityProfile {
    const primaryTag = scores[0].tag;
    const primaryScore = scores[0].score;
    const secondaryTag = scores[1] && scores[1].score === primaryScore 
      ? scores[1].tag 
      : (scores[1] && scores[1].score >= primaryScore - 1 ? scores[1].tag : undefined);

    const fragranceFamily = this.tagToFamilyMap[primaryTag];
    const fragranceType = primaryTag;

    return {
      primaryTag,
      secondaryTag,
      fragranceFamily,
      fragranceType,
      description: this.profileDescriptions[primaryTag]
    };
  }

  /**
   * Retourne le nom d'affichage d'un profil
   */
  getProfileName(tag: FragranceTag): string {
    return this.profileNames[tag];
  }

  /**
   * Retourne la description d'un profil
   */
  getProfileDescription(tag: FragranceTag): string {
    return this.profileDescriptions[tag];
  }
}

