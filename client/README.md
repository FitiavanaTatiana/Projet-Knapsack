# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


//voila

## Ce qu'on a construit

Le projet est un **outil d'aide à la décision** basé sur le problème du sac à dos. L'idée centrale : tu as un budget limité et plusieurs objets à choisir, chacun avec plusieurs critères d'évaluation. L'outil trouve automatiquement la meilleure combinaison selon tes priorités.---

## Les 3 fonctionnalités — ce qu'elles font concrètement---
Onglet 1 — Optimisation
Tu donnes des poids aux critères
avec des sliders (ex: importance
60%, urgence 40%).
L'algo DP calcule la meilleure
combinaison de produits
qui maximise le score total.
Résultat : 1 solution unique.
"Quelle est la meilleure
combinaison ?"

Onglet 2 — Pareto
L'algo fait varier les poids
automatiquement (0% → 100%)
et génère toutes les solutions.
Il filtre celles qu'aucune
autre ne surpasse sur TOUS
les critères.
Résultat : N solutions optimales.
"Quelles sont TOUTES les
bonnes options ?"

Onglet 3 — Sensibilité
Tu choisis UN critère.
L'algo montre comment la
solution change quand ce
critère passe de 0% à 100%.
Montre les "points de rupture"
où la combinaison change.
Résultat : courbe + tableau.
"Est-ce que ma décision
est robuste

## Comment utiliser l'application — étape par étape

**Étape 1 — Lancer les serveurs**

Tu ouvres deux terminaux :
```bash
# Terminal 1 — garde-le ouvert toute la session
cd backend
python app.py
# → "Running on http://127.0.0.1:5000"

# Terminal 2
cd frontend
npm install   # une seule fois
npm run dev
# → "Local: http://localhost:3000"
```
Tu ouvres `http://localhost:3000` dans ton navigateur.

**Étape 2 — Configurer dans la sidebar gauche**

Tu vois trois zones : le budget (saisis n'importe quel nombre), les critères (tu peux en ajouter, supprimer, renommer), et le tableau des produits (tu remplis nom, prix, et la valeur de chaque critère pour chaque produit). Quand tout est prêt, tu cliques **"Lancer l'optimisation"**.

**Étape 3 — Explorer les 3 onglets**

Dans l'onglet *Optimisation*, tu bouges les sliders de poids et la solution se recalcule en temps réel. Dans l'onglet *Pareto*, tu vois le nuage de points — les verts sont les meilleures solutions, tu cliques sur un point pour voir quels produits il contient. Dans l'onglet *Sensibilité*, tu sélectionnes un critère et tu vois à partir de quel seuil la combinaison optimale change.

---

## Comment l'expliquer à ton équipe en 2 minutes

Tu peux dire : *"On a un problème de sélection sous contrainte de budget. Au lieu de juste résoudre l'optimisation classique avec un seul score, on a ajouté trois niveaux d'analyse. Le premier donne une réponse directe selon les priorités qu'on choisit. Le deuxième montre l'ensemble complet des compromis possibles — la frontière de Pareto — pour que le décideur choisisse en connaissance de cause. Le troisième teste si notre choix tient la route même si on change d'avis sur les priorités. Et tout ça fonctionne avec autant de critères qu'on veut, qu'on configure directement dans l'interface."*

Tu veux qu'on prépare aussi des slides ou un document de présentation du projet ?