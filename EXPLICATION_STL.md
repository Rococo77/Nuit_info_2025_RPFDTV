# 🐧 Guide du Visualiseur STL NIRD

## Introduction

Le **Visualiseur STL NIRD** est un outil web qui permet de charger, visualiser et manipuler des fichiers 3D au format STL directement dans votre navigateur. Conçu dans l'esprit du projet NIRD (Numérique Inclusif, Responsable et Durable), il fonctionne **entièrement en local**, sans envoyer vos données à un serveur externe.

---

## 🎯 Qu'est-ce qu'un fichier STL ?

Le format **STL** (STereoLithography) est un format de fichier 3D très répandu, notamment dans le domaine de l'**impression 3D** et de la **fabrication numérique**. Un fichier STL décrit la surface d'un objet 3D à l'aide de triangles (appelés "facettes").

Caractéristiques du format :
- **Simple** : uniquement des triangles, pas de couleurs ni de textures
- **Universel** : compatible avec tous les logiciels de CAO et imprimantes 3D
- **Léger** : format binaire compact pour un stockage efficace

---

## 🚀 Comment utiliser le visualiseur ?

### Étape 1 : Charger un fichier

1. Accédez à la page du visualiseur via le lien "📐 Visualiseur STL" depuis l'accueil
2. Cliquez sur le bouton **"📁 Charger STL"**
3. Sélectionnez un fichier `.stl` depuis votre ordinateur
4. Le modèle s'affiche automatiquement dans la zone de visualisation 3D

### Étape 2 : Naviguer dans la vue 3D

Une fois le modèle chargé, vous pouvez interagir avec la vue 3D :

| Action | Commande |
|--------|----------|
| **Rotation** | Clic gauche + glisser la souris |
| **Zoom** | Molette de la souris (scroll) |
| **Déplacement** | Clic droit + glisser la souris |

La grille au sol vous aide à vous repérer dans l'espace et à évaluer l'échelle du modèle.

### Étape 3 : Changer le mode d'affichage

Deux modes de rendu sont disponibles :

- **◼ Solide** (par défaut) : affiche le modèle avec un matériau vert métallisé, éclairé par plusieurs sources lumineuses
- **◻ Fil de fer** (wireframe) : affiche uniquement les arêtes des triangles, utile pour analyser la structure du maillage

Cliquez sur le bouton correspondant pour basculer entre les deux modes.

---

## 📐 Informations affichées

Le visualiseur calcule et affiche automatiquement plusieurs propriétés du modèle :

### Dimensions (en mm)
- **X** : largeur du modèle
- **Y** : hauteur du modèle  
- **Z** : profondeur du modèle

Ces dimensions correspondent à la "boîte englobante" (bounding box) du modèle.

### Volume
Le volume est calculé en **mm³** et **cm³** à partir de la géométrie des triangles. Cette information est particulièrement utile pour :
- Estimer la quantité de matière nécessaire à l'impression 3D
- Calculer le poids approximatif de l'objet
- Vérifier la cohérence du modèle

### Nombre de triangles
Indique la complexité du maillage. Plus il y a de triangles, plus le modèle est détaillé, mais aussi plus lourd à manipuler.

---

## 📏 Mise à l'échelle

### Pourquoi redimensionner ?

Il arrive souvent qu'un modèle STL ne soit pas à la bonne taille :
- Un modèle trouvé en ligne peut être trop grand ou trop petit
- Vous souhaitez adapter un objet à vos besoins spécifiques
- L'unité de mesure utilisée par le créateur diffère de vos attentes

### Comment faire ?

1. Utilisez le **curseur d'échelle** (de 10% à 300%) pour un ajustement rapide
2. Ou saisissez une valeur précise dans le **champ numérique** (jusqu'à 1000%)
3. Les dimensions et le volume se mettent à jour **en temps réel**
4. Les valeurs originales restent affichées en dessous pour comparaison

**Exemple :** Un modèle de 50mm de large à l'échelle 2.0 (200%) fera 100mm de large.

---

## 💾 Export du modèle redimensionné

### Fonctionnalité clé

Une fois la mise à l'échelle effectuée, vous pouvez **exporter un nouveau fichier STL** avec les dimensions modifiées. C'est la vraie plus-value de cet outil !

### Comment exporter ?

1. Ajustez l'échelle selon vos besoins
2. Cliquez sur le bouton **"💾 Exporter STL"**
3. Un fichier sera téléchargé avec le nom : `[nom_original]_scaled_[pourcentage]pct.stl`

**Exemple :** `cube_scaled_150pct.stl` pour un cube agrandi à 150%.

### Format d'export

Le fichier exporté est au format **STL binaire** :
- Plus compact que le format ASCII
- Compatible avec tous les logiciels 3D et imprimantes
- Conserve toutes les normales recalculées pour un rendu correct

---

## ⚙️ Fonctionnement technique

### Technologies utilisées

Le visualiseur utilise des technologies web modernes :

- **React** : framework pour l'interface utilisateur
- **Three.js** : bibliothèque de rendu 3D WebGL
- **React Three Fiber** : intégration de Three.js avec React
- **STLLoader** : parser natif de Three.js pour les fichiers STL

### Processus de chargement

1. L'utilisateur sélectionne un fichier
2. Le fichier est lu localement via l'API `FileReader`
3. Le parser `STLLoader` convertit les données binaires en géométrie 3D
4. La bounding box est calculée pour centrer le modèle
5. Les normales des vertices sont recalculées pour l'éclairage
6. Le volume est calculé par intégration des triangles

### Calcul du volume

Le volume est calculé selon la méthode du **produit scalaire** :

```
Pour chaque triangle (v1, v2, v3) :
  volume += v1 · (v2 × v3) / 6
```

Cette formule fonctionne car chaque triangle forme un tétraèdre avec l'origine, et la somme de tous ces tétraèdres donne le volume total du maillage fermé.

### Export STL binaire

Le format STL binaire suit cette structure :
1. **En-tête** : 80 octets (généralement vide ou avec métadonnées)
2. **Nombre de triangles** : 4 octets (entier non signé)
3. **Pour chaque triangle** (50 octets) :
   - Normale : 3 × 4 octets (float32)
   - Sommet 1 : 3 × 4 octets (float32)
   - Sommet 2 : 3 × 4 octets (float32)
   - Sommet 3 : 3 × 4 octets (float32)
   - Attribut : 2 octets (généralement 0)

---

## 🌱 Conformité Green IT

Le visualiseur a été conçu dans le respect des principes du **Green IT** :

| Critère | Valeur |
|---------|--------|
| Éléments DOM | ~30 éléments |
| Requêtes externes | 0 (tout est local) |
| Polices | Polices système uniquement |
| Images externes | Aucune |
| Traitement serveur | Aucun (tout côté client) |

### Avantages écologiques

- **Zéro transfert de données** : vos fichiers ne quittent jamais votre ordinateur
- **Pas de serveur GPU** : le rendu utilise votre carte graphique locale
- **Léger** : interface minimaliste, chargement rapide
- **Réutilisable** : fonctionne hors-ligne une fois la page chargée

---

## 🔧 Réinitialisation

Le bouton **"🗑 Réinitialiser"** permet de :
- Fermer le modèle actuel
- Remettre l'échelle à 1.0 (100%)
- Revenir au mode solide
- Préparer le visualiseur pour un nouveau fichier

---

## 📋 Résumé des fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| ✅ Chargement local | Lecture de fichiers STL depuis votre ordinateur |
| ✅ Visualisation 3D | Rendu interactif avec rotation, zoom et déplacement |
| ✅ Mode fil de fer | Affichage du maillage en wireframe |
| ✅ Dimensions | Calcul automatique des dimensions X, Y, Z |
| ✅ Volume | Calcul précis du volume en mm³ et cm³ |
| ✅ Comptage triangles | Nombre de facettes du maillage |
| ✅ Mise à l'échelle | Redimensionnement de 10% à 1000% |
| ✅ Export STL | Téléchargement du modèle redimensionné |
| ✅ Green IT | Traitement 100% local, zéro serveur externe |

---

## 🐧 Dans l'esprit NIRD

Ce visualiseur illustre parfaitement la philosophie NIRD :

1. **Inclusif** : accessible à tous via un simple navigateur web
2. **Responsable** : respecte votre vie privée (aucune donnée envoyée)
3. **Durable** : léger, efficace, utilisant des technologies web standards

**Pas besoin de logiciel propriétaire** comme les solutions Adobe ou Autodesk. Pas besoin de **compte cloud** ni d'**abonnement**. Juste votre navigateur et votre fichier STL.

---

*Documentation créée dans le cadre de la Nuit de l'Info 2025 - Projet NIRD*
