/**
 * Types pour le test de personnalité
 */

export type FragranceTag = 
  | 'warmSweetGourmands'
  | 'freshCitrusFruits'
  | 'woodySpices'
  | 'earthyGreensHerbs'
  | 'floralSoft'
  | 'aquaticMarine';

export type FragranceFamily = 'warmspicy' | 'fresh' | 'floral';

export interface Answer {
  text: string;
  tags: { tag: FragranceTag; points: number }[];
}

export interface Question {
  id: number;
  text: string;
  answers: Answer[];
}

export interface TagScore {
  tag: FragranceTag;
  score: number;
}

export interface PersonalityProfile {
  primaryTag: FragranceTag;
  secondaryTag?: FragranceTag;
  fragranceFamily: FragranceFamily;
  fragranceType: FragranceTag;
  description: string;
}

export interface TestResult {
  profile: PersonalityProfile;
  scores: TagScore[];
  selectedGender: 'cat1230039' | 'cat1230040' | 'cat5000004'; // Femme, Homme, Unisexe
}


