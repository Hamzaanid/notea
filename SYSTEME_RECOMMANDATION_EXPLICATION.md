# 🎯 Explication du Système de Recommandation de Parfums

Ce document explique comment fonctionne le système de recommandation basé sur les réponses du test de personnalité.

---

## 📋 Vue d'ensemble du processus

```
Questions → Réponses → Scores → Profil → Filtres API → Recommandations
```

---

## 1️⃣ ÉTAPE 1 : Les Questions et leurs Tags

### 📍 Fichier : `src/app/services/personality-test.service.ts`

Chaque question a **4 réponses possibles**. Chaque réponse attribue des **points** à des **tags** (types de parfums).

### Structure d'une Question :

```typescript
{
  id: 1,
  text: 'Quand tu sors le soir, tu préfères...',
  answers: [
    {
      text: 'Un restaurant cosy avec bougies',
      tags: [{ tag: 'warmSweetGourmands', points: 1 }]  // ← 1 point pour ce tag
    },
    {
      text: 'Un bar branché avec cocktails',
      tags: [
        { tag: 'freshCitrusFruits', points: 1 },    // ← 1 point pour ce tag
        { tag: 'aquaticMarine', points: 1 }         // ← 1 point pour ce tag aussi
      ]
    },
    // ... autres réponses
  ]
}
```

### 🏷️ Les 6 Tags disponibles :

| Tag ID | Nom affiché | Description |
|--------|-------------|-------------|
| `warmSweetGourmands` | Gourmand & Sucré | Vanille, caramel, notes sucrées |
| `freshCitrusFruits` | Frais & Agrumes | Citron, orange, pamplemousse |
| `woodySpices` | Boisé & Épicé | Cèdre, santal, épices |
| `earthyGreensHerbs` | Terreux & Verts | Herbes, mousse, terre |
| `floralSoft` | Floral & Doux | Rose, jasmin, violette |
| `aquaticMarine` | Aquatique & Marin | Océan, sel, fraîcheur marine |

### 💡 Comment modifier les questions :

**Pour changer les points attribués :**
```typescript
// Exemple : donner 2 points au lieu de 1
tags: [{ tag: 'warmSweetGourmands', points: 2 }]

// Exemple : donner des points à plusieurs tags
tags: [
  { tag: 'warmSweetGourmands', points: 2 },
  { tag: 'floralSoft', points: 1 }
]
```

**Pour ajouter une nouvelle question :**
```typescript
{
  id: 5,  // ← Nouveau numéro
  text: 'Ta question ici...',
  answers: [
    {
      text: 'Réponse 1',
      tags: [{ tag: 'warmSweetGourmands', points: 1 }]
    },
    // ... autres réponses
  ]
}
```

---

## 2️⃣ ÉTAPE 2 : Calcul des Scores

### 📍 Fichier : `src/app/services/personality-test.service.ts` → `calculateScores()`

### Comment ça marche :

1. **Initialisation** : On crée un objet avec tous les tags à 0 point
```typescript
const scores: Record<FragranceTag, number> = {
  warmSweetGourmands: 0,
  freshCitrusFruits: 0,
  woodySpices: 0,
  earthyGreensHerbs: 0,
  floralSoft: 0,
  aquaticMarine: 0
};
```

2. **Addition** : Pour chaque réponse sélectionnée, on additionne les points
```typescript
answers.forEach(answer => {
  answer.tags.forEach(({ tag, points }) => {
    scores[tag] += points;  // ← Addition des points
  });
});
```

3. **Tri** : On trie par score décroissant
```typescript
return Object.entries(scores)
  .map(([tag, score]) => ({ tag: tag as FragranceTag, score }))
  .sort((a, b) => b.score - a.score);  // ← Du plus grand au plus petit
```

### 📊 Exemple concret :

**Réponses sélectionnées :**
- Question 1 : "Un restaurant cosy" → `warmSweetGourmands` +1
- Question 2 : "Cocooning" → `warmSweetGourmands` +1, `floralSoft` +1
- Question 3 : "Bain chaud" → `warmSweetGourmands` +1
- Question 4 : "Réconforté(e)" → `warmSweetGourmands` +1

**Résultat des scores :**
```typescript
[
  { tag: 'warmSweetGourmands', score: 4 },  // ← PROFIL PRINCIPAL
  { tag: 'floralSoft', score: 1 },
  { tag: 'freshCitrusFruits', score: 0 },
  { tag: 'woodySpices', score: 0 },
  { tag: 'earthyGreensHerbs', score: 0 },
  { tag: 'aquaticMarine', score: 0 }
]
```

---

## 3️⃣ ÉTAPE 3 : Détermination du Profil

### 📍 Fichier : `src/app/services/personality-test.service.ts` → `calculateProfile()`

### Comment ça marche :

```typescript
calculateProfile(scores: TagScore[]): PersonalityProfile {
  // 1. Le tag avec le score le plus élevé = profil principal
  const primaryTag = scores[0].tag;
  const primaryScore = scores[0].score;
  
  // 2. Déterminer un profil secondaire (optionnel)
  const secondaryTag = scores[1] && scores[1].score === primaryScore 
    ? scores[1].tag  // Si égalité de score
    : (scores[1] && scores[1].score >= primaryScore - 1 
        ? scores[1].tag  // Si à 1 point de différence
        : undefined);    // Sinon pas de profil secondaire
  
  // 3. Mapper le tag vers fragranceFamily (pour l'API)
  const fragranceFamily = this.tagToFamilyMap[primaryTag];
  
  // 4. Le fragranceType = le tag lui-même
  const fragranceType = primaryTag;
  
  return {
    primaryTag,           // Ex: 'warmSweetGourmands'
    secondaryTag,          // Ex: 'floralSoft' ou undefined
    fragranceFamily,       // Ex: 'warmspicy'
    fragranceType,         // Ex: 'warmSweetGourmands'
    description: this.profileDescriptions[primaryTag]
  };
}
```

### 🗺️ Mapping Tag → FragranceFamily :

```typescript
private readonly tagToFamilyMap: Record<FragranceTag, FragranceFamily> = {
  warmSweetGourmands: 'warmspicy',    // ← Pour l'API Sephora
  freshCitrusFruits: 'fresh',
  woodySpices: 'warmspicy',
  earthyGreensHerbs: 'fresh',
  floralSoft: 'floral',
  aquaticMarine: 'fresh'
};
```

**💡 Pour modifier le mapping :**
- Change les valeurs `'warmspicy'`, `'fresh'`, `'floral'` selon ce que l'API Sephora accepte
- Tu peux aussi ajouter de nouveaux tags ici

---

## 4️⃣ ÉTAPE 4 : Appel API avec Filtres

### 📍 Fichier : `src/app/services/sephora.service.ts` → `getProductsWithFragranceFilters()`

### Comment ça marche :

```typescript
getProductsWithFragranceFilters(
  categoryId: string,        // Ex: 'cat1230039' (Femme)
  fragranceFamily: string,    // Ex: 'warmspicy'
  fragranceType: string,      // Ex: 'warmSweetGourmands'
  page: number = 1,
  pageSize: number = 24
): Observable<any> {
  const url = `${this.baseUrl}/us/products/v2/list`;
  const params: any = {
    categoryId,
    currentPage: page.toString(),
    pageSize: pageSize.toString(),
    [`filters[fragranceFamily]`]: fragranceFamily,  // ← Filtre famille
    [`filters[fragranceType]`]: fragranceType        // ← Filtre type
  };

  return this.http.get(url, { headers: this.headers, params });
}
```

### 📡 Exemple d'appel API :

**Si le profil est "Gourmand & Sucré" :**
```typescript
// Paramètres envoyés à l'API :
{
  categoryId: 'cat1230039',                    // Femme
  currentPage: '1',
  pageSize: '8',
  'filters[fragranceFamily]': 'warmspicy',    // ← Filtre principal
  'filters[fragranceType]': 'warmSweetGourmands'  // ← Filtre spécifique
}
```

**💡 Pour modifier les filtres :**
- Change les noms de paramètres si l'API Sephora utilise d'autres noms
- Ajoute d'autres filtres si nécessaire (ex: prix, rating, etc.)

---

## 5️⃣ ÉTAPE 5 : Utilisation dans le Composant

### 📍 Fichier : `src/app/pages/test-perso/test-perso.ts` → `completeTest()`

### Flux complet :

```typescript
completeTest() {
  // 1. Calculer les scores à partir des réponses
  const scores = this.personalityTestService.calculateScores(this.answers);
  // Résultat : [{ tag: 'warmSweetGourmands', score: 4 }, ...]
  
  // 2. Déterminer le profil
  const profile = this.personalityTestService.calculateProfile(scores);
  // Résultat : { primaryTag: 'warmSweetGourmands', fragranceFamily: 'warmspicy', ... }
  
  // 3. Créer le résultat
  this.testResult = {
    profile,
    scores,
    selectedGender: this.selectedGender  // Ex: 'cat1230039' (Femme)
  };
  
  // 4. Charger les recommandations
  this.loadRecommendations(profile);
}
```

### Chargement des recommandations :

```typescript
loadRecommendations(profile: PersonalityProfile) {
  this.sephoraService.getProductsWithFragranceFilters(
    this.selectedGender,           // Ex: 'cat1230039' (Femme)
    profile.fragranceFamily,        // Ex: 'warmspicy'
    profile.fragranceType,          // Ex: 'warmSweetGourmands'
    1,                              // Page 1
    8                               // 8 parfums recommandés
  ).subscribe({
    next: (response: any) => {
      this.recommendedProducts = response.products || [];
      // ← Les 8 parfums recommandés sont maintenant dans recommendedProducts
    }
  });
}
```

---

## 🔧 Comment Modifier le Système

### ✅ Pour changer les points d'une réponse :

**Fichier :** `src/app/services/personality-test.service.ts` → `getQuestions()`

```typescript
{
  text: 'Ta réponse',
  tags: [
    { tag: 'warmSweetGourmands', points: 2 }  // ← Change le nombre ici
  ]
}
```

### ✅ Pour ajouter/modifier une question :

**Fichier :** `src/app/services/personality-test.service.ts` → `getQuestions()`

```typescript
getQuestions(): Question[] {
  return [
    // ... questions existantes
    {
      id: 5,  // ← Nouveau numéro
      text: 'Ta nouvelle question ?',
      answers: [
        {
          text: 'Réponse A',
          tags: [{ tag: 'warmSweetGourmands', points: 1 }]
        },
        // ... autres réponses
      ]
    }
  ];
}
```

### ✅ Pour changer la logique de calcul du profil :

**Fichier :** `src/app/services/personality-test.service.ts` → `calculateProfile()`

```typescript
calculateProfile(scores: TagScore[]): PersonalityProfile {
  const primaryTag = scores[0].tag;
  
  // Exemple : Toujours prendre les 2 premiers tags comme profil mixte
  const secondaryTag = scores[1]?.tag;
  
  // Ou : Prendre un profil secondaire seulement si score >= 2
  // const secondaryTag = scores[1] && scores[1].score >= 2 
  //   ? scores[1].tag 
  //   : undefined;
  
  // ... reste du code
}
```

### ✅ Pour changer le nombre de parfums recommandés :

**Fichier :** `src/app/pages/test-perso/test-perso.ts` → `loadRecommendations()`

```typescript
this.sephoraService.getProductsWithFragranceFilters(
  this.selectedGender,
  profile.fragranceFamily,
  profile.fragranceType,
  1,
  12  // ← Change ici (au lieu de 8)
)
```

### ✅ Pour ajouter un nouveau tag :

1. **Ajouter le tag dans les types :**
   **Fichier :** `src/app/interfaces/personality.types.ts`
   ```typescript
   export type FragranceTag = 
     | 'warmSweetGourmands'
     | 'freshCitrusFruits'
     // ... autres tags
     | 'tonNouveauTag';  // ← Ajoute ici
   ```

2. **Ajouter le mapping :**
   **Fichier :** `src/app/services/personality-test.service.ts`
   ```typescript
   private readonly tagToFamilyMap: Record<FragranceTag, FragranceFamily> = {
     // ... mappings existants
     tonNouveauTag: 'fresh',  // ← Ajoute ici
   };
   ```

3. **Ajouter la description et le nom :**
   ```typescript
   private readonly profileNames: Record<FragranceTag, string> = {
     // ... noms existants
     tonNouveauTag: 'Ton Nouveau Profil',  // ← Ajoute ici
   };
   
   private readonly profileDescriptions: Record<FragranceTag, string> = {
     // ... descriptions existantes
     tonNouveauTag: 'Description de ton nouveau profil',  // ← Ajoute ici
   };
   ```

4. **Initialiser dans calculateScores() :**
   ```typescript
   const scores: Record<FragranceTag, number> = {
     // ... scores existants
     tonNouveauTag: 0,  // ← Ajoute ici
   };
   ```

---

## 📝 Résumé du Flux Complet

```
1. Utilisateur répond aux 4 questions
   ↓
2. Chaque réponse ajoute des points aux tags
   ↓
3. calculateScores() additionne tous les points
   ↓
4. calculateProfile() détermine le profil principal (et secondaire)
   ↓
5. Le profil est mappé vers fragranceFamily et fragranceType
   ↓
6. getProductsWithFragranceFilters() appelle l'API Sephora avec ces filtres
   ↓
7. Les parfums recommandés sont affichés à l'utilisateur
```

---

## 🎯 Points Clés à Retenir

- **Chaque réponse** peut donner des points à **1 ou plusieurs tags**
- Le **tag avec le score le plus élevé** devient le **profil principal**
- Le **profil secondaire** est optionnel (si score égal ou à 1 point de différence)
- Les **filtres API** sont construits à partir du profil déterminé
- Tu peux **modifier facilement** les questions, points, tags, et logique de calcul

---

**Besoin d'aide pour modifier quelque chose ? Dis-moi ce que tu veux changer !** 🚀

