# 🎯 Exemple Concret : Comment les Recommandations sont Calculées

## 📊 Scénario : Utilisateur répond aux 4 questions

### Réponses sélectionnées :

1. **Question 1** : "Quand tu sors le soir, tu préfères..."
   - ✅ Réponse choisie : "Un restaurant cosy avec bougies"
   - Points attribués : `warmSweetGourmands` +1

2. **Question 2** : "Ton style de vie est plutôt..."
   - ✅ Réponse choisie : "Cocooning, moments douillets"
   - Points attribués : `warmSweetGourmands` +1, `floralSoft` +1

3. **Question 3** : "Quelle ambiance te détend vraiment ?"
   - ✅ Réponse choisie : "Un bain chaud avec bougies parfumées"
   - Points attribués : `warmSweetGourmands` +1

4. **Question 4** : "Quand tu choisis un parfum, tu veux..."
   - ✅ Réponse choisie : "Te sentir réconforté(e) et enveloppé(e)"
   - Points attribués : `warmSweetGourmands` +1

---

## 🔢 ÉTAPE 1 : Calcul des Scores

### Code exécuté :

```typescript
// Dans personality-test.service.ts → calculateScores()

// 1. Initialisation : tous les tags à 0
const scores = {
  warmSweetGourmands: 0,
  freshCitrusFruits: 0,
  woodySpices: 0,
  earthyGreensHerbs: 0,
  floralSoft: 0,
  aquaticMarine: 0
};

// 2. Parcours des réponses et addition des points
// Réponse 1 : "Un restaurant cosy"
scores['warmSweetGourmands'] += 1;  // = 1

// Réponse 2 : "Cocooning"
scores['warmSweetGourmands'] += 1;  // = 2
scores['floralSoft'] += 1;          // = 1

// Réponse 3 : "Bain chaud"
scores['warmSweetGourmands'] += 1;  // = 3

// Réponse 4 : "Réconforté(e)"
scores['warmSweetGourmands'] += 1;  // = 4

// 3. Résultat final (trié par score décroissant)
[
  { tag: 'warmSweetGourmands', score: 4 },  // ← GAGNANT !
  { tag: 'floralSoft', score: 1 },
  { tag: 'freshCitrusFruits', score: 0 },
  { tag: 'woodySpices', score: 0 },
  { tag: 'earthyGreensHerbs', score: 0 },
  { tag: 'aquaticMarine', score: 0 }
]
```

---

## 🎭 ÉTAPE 2 : Détermination du Profil

### Code exécuté :

```typescript
// Dans personality-test.service.ts → calculateProfile()

const scores = [
  { tag: 'warmSweetGourmands', score: 4 },
  { tag: 'floralSoft', score: 1 },
  // ...
];

// 1. Profil principal = tag avec le score le plus élevé
const primaryTag = scores[0].tag;  // = 'warmSweetGourmands'
const primaryScore = scores[0].score;  // = 4

// 2. Profil secondaire ?
const secondaryScore = scores[1].score;  // = 1
// Condition : secondaryScore >= primaryScore - 1
// 1 >= 4 - 1 ? → 1 >= 3 ? → NON
// Donc : secondaryTag = undefined

// 3. Mapping vers fragranceFamily
const fragranceFamily = tagToFamilyMap['warmSweetGourmands'];
// = 'warmspicy'

// 4. fragranceType = le tag lui-même
const fragranceType = 'warmSweetGourmands';

// 5. Résultat final
const profile = {
  primaryTag: 'warmSweetGourmands',
  secondaryTag: undefined,  // Pas de profil secondaire
  fragranceFamily: 'warmspicy',
  fragranceType: 'warmSweetGourmands',
  description: 'Tu aimes les parfums réconfortants et gourmands...'
};
```

---

## 🌐 ÉTAPE 3 : Appel API Sephora

### Code exécuté :

```typescript
// Dans test-perso.ts → loadRecommendations()

const profile = {
  primaryTag: 'warmSweetGourmands',
  fragranceFamily: 'warmspicy',
  fragranceType: 'warmSweetGourmands'
};

const selectedGender = 'cat1230039';  // Femme

// Appel à l'API
this.sephoraService.getProductsWithFragranceFilters(
  'cat1230039',              // Catégorie : Femme
  'warmspicy',              // Fragrance Family
  'warmSweetGourmands',      // Fragrance Type
  1,                         // Page 1
  8                          // 8 parfums
);
```

### Requête HTTP envoyée :

```
GET /us/products/v2/list?
  categoryId=cat1230039&
  currentPage=1&
  pageSize=8&
  filters[fragranceFamily]=warmspicy&
  filters[fragranceType]=warmSweetGourmands
```

### Réponse de l'API :

```json
{
  "products": [
    {
      "productId": "P123456",
      "brandName": "Tom Ford",
      "displayName": "Black Orchid",
      "heroImage": "https://...",
      "rating": "4.5",
      "reviews": "1234",
      "currentSku": {
        "listPrice": "$150.00"
      }
    },
    // ... 7 autres parfums
  ]
}
```

---

## 🎁 ÉTAPE 4 : Affichage des Recommandations

### Code exécuté :

```typescript
// Dans test-perso.ts → loadRecommendations()

.subscribe({
  next: (response: any) => {
    // Les 8 parfums sont stockés
    this.recommendedProducts = response.products;
    // = [
    //   { productId: "P123456", brandName: "Tom Ford", ... },
    //   { productId: "P789012", brandName: "Yves Saint Laurent", ... },
    //   ...
    // ]
    
    // Affichage de la page de résultats
    this.currentStep = 'results';
  }
});
```

### Affichage dans le template HTML :

```html
<!-- Dans test-perso.html -->
<div *ngIf="currentStep === 'results'">
  <h3>Ton profil : {{ getProfileName(testResult.profile.primaryTag) }}</h3>
  <!-- Affiche : "Ton profil : Gourmand & Sucré" -->
  
  <div class="row">
    <div *ngFor="let product of recommendedProducts">
      <!-- Affiche les 8 parfums recommandés -->
      <img [src]="product.heroImage">
      <h4>{{ product.displayName }}</h4>
      <p>{{ product.brandName }}</p>
      <p>{{ product.currentSku.listPrice }}</p>
    </div>
  </div>
</div>
```

---

## 🔄 Exemple avec Profil Mixte

### Scénario différent :

**Réponses sélectionnées :**
- Q1 : "Un bar branché" → `freshCitrusFruits` +1, `aquaticMarine` +1
- Q2 : "Actif" → `freshCitrusFruits` +1, `aquaticMarine` +1
- Q3 : "Douche fraîche" → `freshCitrusFruits` +1, `aquaticMarine` +1
- Q4 : "Frais(che)" → `freshCitrusFruits` +1, `aquaticMarine` +1

**Scores finaux :**
```typescript
[
  { tag: 'freshCitrusFruits', score: 4 },
  { tag: 'aquaticMarine', score: 4 },  // ← Égalité !
  { tag: 'warmSweetGourmands', score: 0 },
  // ...
]
```

**Profil déterminé :**
```typescript
const profile = {
  primaryTag: 'freshCitrusFruits',      // Premier dans la liste
  secondaryTag: 'aquaticMarine',        // Score égal → profil mixte !
  fragranceFamily: 'fresh',             // Mapping de freshCitrusFruits
  fragranceType: 'freshCitrusFruits'
};
```

**Appel API :**
```typescript
// On utilise le profil principal pour les filtres
getProductsWithFragranceFilters(
  'cat1230039',
  'fresh',                  // ← De freshCitrusFruits
  'freshCitrusFruits',      // ← Tag principal
  1,
  8
);
```

---

## 💡 Points Importants

1. **Le profil principal** détermine les filtres API
2. **Le profil secondaire** est juste informatif (affiché à l'utilisateur)
3. **Les filtres API** utilisent toujours le profil principal
4. **Si égalité de score**, le premier tag dans la liste devient principal

---

## 🛠️ Pour Modifier le Comportement

### Exemple : Utiliser aussi le profil secondaire dans les filtres

```typescript
// Dans sephora.service.ts → getProductsWithFragranceFilters()

// Si tu veux filtrer avec les 2 profils :
const params: any = {
  categoryId,
  currentPage: page.toString(),
  pageSize: pageSize.toString(),
  [`filters[fragranceFamily]`]: fragranceFamily,
  [`filters[fragranceType]`]: fragranceType,
  // Ajouter le profil secondaire si disponible
  ...(secondaryTag && {
    [`filters[fragranceTypeSecondary]`]: secondaryTag
  })
};
```

### Exemple : Changer la logique de profil secondaire

```typescript
// Dans personality-test.service.ts → calculateProfile()

calculateProfile(scores: TagScore[]): PersonalityProfile {
  const primaryTag = scores[0].tag;
  const primaryScore = scores[0].score;
  
  // Nouvelle logique : prendre profil secondaire si score >= 2
  const secondaryTag = scores[1] && scores[1].score >= 2
    ? scores[1].tag
    : undefined;
  
  // ... reste du code
}
```

---

**Voilà ! Tu comprends maintenant comment tout fonctionne ! 🎉**

