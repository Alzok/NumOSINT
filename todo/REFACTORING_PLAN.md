# Audit et Plan de Refactoring Final de NumOSINT

## Résumé de l'Audit

Le projet NumOSINT est construit sur une base technologique solide (Next.js, Node.js, Prisma, Docker) avec une architecture de microservices claire. Cependant, l'audit révèle une dette technique significative qui impacte la maintenabilité, la sécurité et la performance.

Les axes d'amélioration critiques sont :
1.  **L'architecture des microservices d'outils**, qui entraîne une duplication massive de code.
2.  **L'absence de validation systématique des données et de gestion d'erreurs**, ce qui fragilise le backend.
3.  **Le manque de pagination** pour les données critiques, qui pose un risque de performance à court terme.
4.  **Des failles de sécurité** dans la gestion des tokens et des dépendances.

Ce plan de refactoring hiérarchisé vise à adresser ces points pour transformer le projet en une application robuste, sécurisée et scalable.

## Plan de Refactoring Détaillé

---
### **BLOC 1 : FONDATIONS & ROBUSTESSE DE L'API**
---

### 1. Centralisation des Microservices d'Outils
**Priorité : [Élevée]**

**Problème :** Chaque service dans `/tools` (buster, maigret, etc.) réimplémente un serveur web et un Dockerfile, causant une duplication massive de code et de configuration.

**Localisation :**
- L'intégralité des sous-dossiers de `tools/`.
- `docker-compose.yml` : Multiples définitions de services d'outils.

**Suggestion de Refactoring :**
Créer un **service générique unique "Tool Runner"**.
1.  Centraliser l'exécution des outils dans le backend ou un service unique qui prend le nom de l'outil en paramètre.
2.  Supprimer tous les `Dockerfile` et serveurs web individuels des dossiers `tools/*`.
3.  Simplifier `docker-compose.yml` en ne gardant que les services principaux.

### 2. Orchestrateur Backend Rigide
**Priorité : [Élevée]**

**Problème :** Le service `orchestrator` utilise une logique `switch` pour gérer les grandes phases, ce qui le couple fortement aux étapes du workflow. Pour ajouter une nouvelle phase, il faut modifier le code de l'orchestrateur.

**Localisation :**
- `src/services/orchestrator.js` : Le `switch` à la ligne 86.

**Suggestion de Refactoring :**
Appliquer le **pattern de Registre** (déjà utilisé pour la phase d'enrichissement) au flux de haut niveau.
1.  Externaliser la définition des phases (`ENRICHMENT`, `SCANNING`, etc.) et leurs transitions dans un fichier de configuration (ex: `workflow_phases.json`).
2.  L'orchestrateur lirait ce fichier pour construire dynamiquement sa machine à états, devenant ainsi agnostique des phases elles-mêmes.

### 3. Validation des Données et Gestion des Erreurs
**Priorité : [Élevée]**

**Problème :** Absence quasi-totale de validation des données d'entrée sur les routes de l'API et gestion hétérogène des erreurs.

**Localisation :**
- `src/routes/*.js`
- `src/middlewares/errorHandler.js`

**Suggestion de Refactoring :**
1.  **Standardiser la gestion d'erreurs :** Envelopper systématiquement toutes les fonctions de route asynchrones dans le wrapper `catchAsync` pour centraliser la gestion dans `errorHandler`.
2.  **Implémenter une validation systématique avec Zod/Joi :** Créer et appliquer un middleware de validation à toutes les routes qui acceptent des données en entrée (`req.body`, `req.query`, `req.params`).

### 4. Mise en place d'un Système de Pagination Complet
**Priorité : [Élevée]**

**Problème :** L'application charge la liste complète des investigations, ce qui n'est pas scalable.

**Localisation :**
- `frontend/src/hooks/useInvestigationsList.ts`
- `src/routes/investigations.js`

**Suggestion de Refactoring :**
1.  **Modifier l'API backend :** La route `GET /api/investigations` doit accepter des paramètres de pagination (`page`, `limit`). La requête Prisma doit utiliser `skip` et `take`.
2.  **Adapter le hook `useInvestigationsList`** pour gérer l'état de la page et passer les paramètres à l'API.
3.  **Ajouter des contrôles de pagination** à l'UI.

---
### **BLOC 2 : SÉCURITÉ & QUALITÉ DU CODE**
---

### 5. Sécurisation du Stockage des Tokens
**Priorité : [Moyenne]**

**Problème :** Le stockage du JWT dans le `localStorage` est vulnérable aux attaques XSS.

**Localisation :**
- `frontend/src/components/providers/NotificationsProvider.tsx:L32`

**Suggestion de Refactoring :**
Utiliser des **cookies `httpOnly`** pour le stockage des tokens, définis par le backend, pour les rendre inaccessibles au JavaScript côté client.

### 6. Renforcement du Typage et des Conventions TypeScript
**Priorité : [Moyenne]**

**Problème :** Le typage pourrait être plus strict (`any` est utilisé), les conventions d'import sont perfectibles (imports relatifs longs) et les types ne sont pas partagés proprement entre le frontend et le backend.

**Localisation :**
- `tsconfig.json` (frontend et backend)
- `frontend/src/pages/investigation/[id].tsx`

**Suggestion de Refactoring :**
1.  **Créer un package de types partagés** (`packages/shared-types`) dans un workspace pour garantir la cohérence.
2.  **Activer le mode `strict`** dans les `tsconfig.json`.
3.  **Configurer les alias d'importation** (`paths`) dans les `tsconfig.json` pour des imports plus propres (ex: `@/lib/store` au lieu de `../../lib/store`).
4.  **Remplacer `any` par `unknown`** et valider le type avant utilisation.

### 7. Sécurisation des Dépendances Logicielles
**Priorité : [Moyenne]**

**Problème :** Aucune analyse des dépendances pour détecter les vulnérabilités connues.

**Localisation :**
- `package.json`

**Suggestion de Refactoring :**
1.  **Intégrer `npm audit`** dans le pipeline de CI/CD pour échouer le build en cas de vulnérabilité haute.
2.  **Utiliser des outils comme Dependabot ou Snyk** pour automatiser la mise à jour des dépendances vulnérables.

### 8. Application Automatisée des Standards de Code
**Priorité : [Moyenne]**

**Problème :** L'utilisation d'ESLint et Prettier n'est pas garantie avant les commits.

**Suggestion de Refactoring :**
Mettre en place un **pre-commit hook** avec `husky` et `lint-staged` pour formater et linter automatiquement le code avant chaque commit.

---
### **BLOC 3 : OPTIMISATION & EXPÉRIENCE DÉVELOPPEUR**
---

### 9. Optimisation des Performances de Rendu Frontend
**Priorité : [Moyenne]**

**Problème :** La page de détail d'investigation est un composant très large qui rend probablement tous ses onglets en même temps, sans optimisation.

**Localisation :**
- `frontend/src/pages/investigation/[id].tsx`

**Suggestion de Refactoring :**
1.  **Lazy Loading des composants d'onglets** pour ne charger et rendre que le contenu de l'onglet actif.
2.  **Memoization** des composants lourds (ex: `UnifiedResultsTable`) avec `React.memo` pour éviter les re-rendus inutiles.
3.  **Optimisation du processus de build** avec `@next/bundle-analyzer` pour visualiser et réduire la taille du code envoyé au client.

### 10. Logique de Fetching Manuelle et Répétitive
**Priorité : [Moyenne]**

**Problème :** Le client API (`api-client.ts`) utilise une surcouche manuelle à `fetch` alors que le projet utilise déjà React Query.

**Suggestion de Refactoring :**
La logique est **partiellement traitée** car `useQuery` est déjà utilisé. Pour aller plus loin, remplacer le wrapper `fetcher` par une librairie comme `axios` ou `ky`, qui simplifierait la gestion des erreurs et le parsing JSON, rendant le `api-client` plus concis.

### 11. Utilisation Inefficace de Prisma
**Priorité : [Basse]**

**Problème :** Les requêtes Prisma ne sont pas optimisées : elles récupèrent tous les champs par défaut et n'utilisent pas de transactions pour les opérations atomiques.

**Suggestion de Refactoring :**
1.  Utiliser systématiquement la **sélection de champs (`select`)** dans les requêtes Prisma pour ne récupérer que les données nécessaires.
2.  Envelopper les opérations multi-écritures dans des **transactions (`$transaction`)** pour garantir l'atomicité.

### 12. Analyse Critique des Dépendances
**Priorité : [Basse]**

**Problème :** Dépendances inutiles côté backend (`three`, `@react-three/fiber`), redondance de librairies d'icônes et utilisation de librairies "legacy" (Moment.js, via sous-dépendances).

**Localisation :**
- `package.json` (frontend et backend)

**Suggestion de Refactoring :**
1.  **Nettoyer les dépendances du backend** en supprimant les librairies 3D.
2.  **Standardiser la librairie d'icônes** en choisissant une seule source de vérité (ex: `lucide-react`).

### 13. Simplification de la Documentation et Stratégie de Branches
**Priorité : [Basse]**

**Problème :** Documentation fragmentée et absence de conventions claires pour les commits et les branches.

**Suggestion de Refactoring :**
1.  **Centraliser la documentation** dans un dossier `/docs` et utiliser le `README.md` principal comme un portail.
2.  Adopter les **"Conventional Commits"** pour des messages de commit standardisés.
3.  Définir une **stratégie de branches** simple (ex: `main`, `develop`, `feat/...`).

### 14. Code Inutilisé ou Commenté
**Priorité : [Basse]**

**Problème :** Des blocs de code commentés et des `TODO` indiquent des fonctionnalités incomplètes ou abandonnées.

**Suggestion de Refactoring :**
Faire une passe sur tout le projet pour **supprimer le code mort** et les commentaires obsolètes, et implémenter ou supprimer les fonctionnalités marquées `TODO`.

### 15. Amélioration de la Sémantique HTML et de l'Accessibilité (A11y)
**Priorité : [Basse]**

**Problème :** Lacunes en matière d'accessibilité (divs cliquables, icônes sans libellé).

**Suggestion de Refactoring :**
1.  Remplacer systématiquement les `<div onClick={...}>` par des `<button onClick={...}>`.
2.  Ajouter des `aria-label` descriptifs à tous les boutons qui ne contiennent que des icônes. 