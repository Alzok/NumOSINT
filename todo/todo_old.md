# Liste des Tâches et Améliorations pour NumOSINT

Ce document centralise les prochaines étapes de développement pour faire évoluer la plateforme.

---

## 🔧 Plan de Refactorisation - Code Quality & Architecture

### 🎯 Redondances Identifiées

#### 1. **Duplication des Couches API**
- **Problème** : `lib/api.ts` et `lib/investigation-api.ts` contiennent des patterns similaires
- **Solution** : Créer une couche d'abstraction unifiée
- **Fichiers concernés** : 
  - `frontend/src/lib/api.ts`
  - `frontend/src/lib/investigation-api.ts`
- **Actions** :
  - [ ] Créer `lib/base-api.ts` avec une classe abstraite `BaseAPIClient`
  - [ ] Unifier la gestion des erreurs et timeouts
  - [ ] Standardiser les intercepteurs axios
  - [ ] Migrer tous les appels API vers la nouvelle structure

#### 2. **Gestion d'Erreurs Dupliquée**
- **Problème** : Chaque hook et composant gère les erreurs de manière similaire
- **Solution** : Créer un système centralisé de gestion d'erreurs
- **Actions** :
  - [ ] Créer `hooks/useErrorHandler.ts` 
  - [ ] Implémenter `utils/errorUtils.ts` pour la standardisation
  - [ ] Créer un ErrorBoundary global pour React
  - [ ] Refactoriser tous les hooks pour utiliser le système unifié

#### 3. **Connexions Socket.IO Multiples**
- **Problème** : Plusieurs composants créent leurs propres connexions Socket.IO
- **Solution** : Centraliser la gestion des WebSockets
- **Actions** :
  - [ ] Créer `lib/socket-manager.ts` avec singleton pattern
  - [ ] Implémenter `hooks/useSocket.ts` pour la gestion des events
  - [ ] Refactoriser `useInvestigation`, `NotificationsProvider`, etc.
  - [ ] Optimiser les reconnexions automatiques

#### 4. **Instances Prisma Multiples (Backend)**
- **Problème** : Chaque route/service crée sa propre instance Prisma
- **Solution** : Singleton pattern pour Prisma
- **Actions** :
  - [ ] Créer `utils/prisma-client.js` avec instance unique
  - [ ] Refactoriser toutes les routes pour utiliser l'instance partagée
  - [ ] Implémenter la gestion des transactions globales
  - [ ] Ajouter le pooling de connexions optimisé

#### 5. **Services d'Outils avec Patterns Similaires**
- **Problème** : Tous les services (buster, mosint, etc.) ont des structures très similaires
- **Solution** : Créer une classe abstraite pour les services d'outils
- **Actions** :
  - [ ] Créer `services/tools/BaseToolService.js` 
  - [ ] Standardiser les méthodes : `execute()`, `validateConfig()`, `processResults()`
  - [ ] Implémenter le retry pattern unifié
  - [ ] Migrer tous les services vers la nouvelle structure

#### 6. **Logique de Loading Dispersée**
- **Problème** : Chaque composant implémente sa propre logique de loading
- **Solution** : Hook centralisé pour les états de loading
- **Actions** :
  - [ ] Créer `hooks/useAsyncState.ts` générique
  - [ ] Implémenter `components/ui/LoadingStates.tsx`
  - [ ] Standardiser les skeletons et spinners
  - [ ] Refactoriser tous les composants

#### 7. **État Local Redondant avec Store Global**
- **Problème** : Beaucoup de composants dupliquent des états déjà dans Zustand
- **Fichiers concernés** :
  - `pages/results.tsx` - `loading, error, investigations` vs store
  - `pages/statistics.tsx` - `loading, error` vs store
  - `pages/investigations.tsx` - `isLoading` redondant
  - `components/*/` - Multiples états locaux `loading`
- **Actions** :
  - [ ] Identifier tous les états redondants
  - [ ] Créer des selectors Zustand spécialisés
  - [ ] Supprimer les useState redondants
  - [ ] Unifier la gestion des états de loading

#### 8. **Patterns de Validation Dupliqués**
- **Problème** : Validations Zod et logiques similaires répétées
- **Fichiers concernés** :
  - `InvestigationForm.tsx` - Schémas Zod complexes
  - `SearchForm.tsx` - Validation manuelle simple
- **Actions** :
  - [ ] Créer `utils/validation-schemas.ts` centralisé
  - [ ] Créer `hooks/useFormValidation.ts` générique
  - [ ] Standardiser toutes les validations
  - [ ] Implémenter la validation en temps réel unifiée

#### 9. **Fetch Patterns Identiques Partout**
- **Problème** : Pattern `useState + useEffect + async function` répété dans tous les composants
- **Solution** : Hook générique pour les appels API
- **Actions** :
  - [ ] Créer `hooks/useApiCall.ts` générique
  - [ ] Intégrer TanStack Query pour le cache automatique
  - [ ] Refactoriser tous les composants data-fetching
  - [ ] Standardiser les patterns de retry et d'erreur

#### 10. **Styles et Classes CSS Redondants**
- **Problème** : Classes Tailwind répétées, patterns de style dupliqués
- **Fichiers concernés** :
  - Multiples composants avec mêmes classes pour cards, buttons, inputs
  - Patterns de couleurs répétés (statut, types, etc.)
- **Actions** :
  - [ ] Créer `styles/component-variants.ts` avec cva (class-variance-authority)
  - [ ] Standardiser les couleurs dans le design system
  - [ ] Créer des composants composites réutilisables
  - [ ] Éliminer la duplication Tailwind

#### 11. **Transformations de Données Dupliquées**
- **Problème** : Logiques de transformation répétées dans plusieurs composants
- **Fichiers concernés** :
  - `investigation/[id].tsx` - transformations multiples
  - `utils/dataTransform.ts` - fonctions similaires
  - Multiples composants Analysis Views
- **Actions** :
  - [ ] Créer `utils/data-transformers/` par type de données
  - [ ] Standardiser les interfaces de transformation
  - [ ] Créer des mappers génériques réutilisables
  - [ ] Centraliser la logique de normalisation

#### 12. **Notifications Multiples et Dispersées**
- **Problème** : Plusieurs systèmes de notifications qui se chevauchent
- **Redondances identifiées** :
  - Toast notifications (Zustand store)
  - App notifications (Zustand store)
  - Socket.IO notifications (multiples endroits)
  - Notifications Provider + Component
- **Actions** :
  - [ ] Unifier en un seul système de notifications
  - [ ] Créer un NotificationManager centralisé
  - [ ] Standardiser les types et priorités
  - [ ] Optimiser les connexions Socket

---

### 🏗️ Améliorations Architecturales

#### 1. **Couche d'Abstraction Manquante**
- **Problème** : Logique métier mélangée dans les composants React
- **Solution** : Implémenter une architecture en couches
- **Actions** :
  - [ ] Créer `services/` côté frontend pour la logique métier
  - [ ] Implémenter des `Repository` patterns pour les données
  - [ ] Séparer les `ViewModels` des composants React
  - [ ] Créer des `Use Cases` pour les interactions complexes

#### 2. **Gestion des Notifications Dispersée**
- **Problème** : Notifications gérées dans plusieurs endroits
- **Solution** : Système centralisé de notifications
- **Actions** :
  - [ ] Créer `services/NotificationManager.ts`
  - [ ] Implémenter un système de priorités et de queues
  - [ ] Unifier toasts, notifications app et alertes système
  - [ ] Ajouter la persistance des notifications importantes

#### 3. **Absence de Cache**
- **Problème** : Données fréquemment utilisées rechargées à chaque fois
- **Solution** : Implémenter un système de cache intelligent
- **Actions** :
  - [ ] Intégrer TanStack Query (React Query) pour le cache API
  - [ ] Implémenter un cache Redis côté backend
  - [ ] Créer des stratégies de cache par type de données
  - [ ] Optimiser les requêtes avec mise en cache intelligente

#### 4. **Transactions de Base de Données Non Optimisées**
- **Problème** : Opérations DB sans transactions appropriées
- **Solution** : Optimiser les performances et la cohérence
- **Actions** :
  - [ ] Créer `utils/transaction-manager.js`
  - [ ] Implémenter les transactions pour les opérations complexes
  - [ ] Optimiser les requêtes avec `include` et `select`
  - [ ] Ajouter des indices de performance

#### 5. **Logs Dispersés Sans Structure**
- **Problème** : Système de logging non standardisé
- **Solution** : Logging structuré et centralisé
- **Actions** :
  - [ ] Standardiser les formats de logs (JSON structured)
  - [ ] Implémenter des niveaux de log appropriés
  - [ ] Ajouter le tracing distribué pour les investigations
  - [ ] Créer un dashboard de monitoring des logs

#### 6. **Store Zustand Monolithique**
- **Problème** : Store global trop volumineux et non modulaire
- **Actions** :
  - [ ] Diviser le store en modules thématiques
  - [ ] Créer des stores spécialisés (investigations, notifications, ui, etc.)
  - [ ] Implémenter des selectors optimisés
  - [ ] Séparer la logique métier du state management

#### 7. **Types TypeScript Redondants**
- **Problème** : Interfaces similaires dans plusieurs fichiers
- **Actions** :
  - [ ] Centraliser tous les types dans `types/`
  - [ ] Créer une hiérarchie de types cohérente
  - [ ] Éliminer les types dupliqués
  - [ ] Implémenter des types génériques réutilisables

#### 8. **Absence de Design System Cohérent**
- **Problème** : Composants UI inconsistants, styles dispersés
- **Actions** :
  - [ ] Créer un design system complet avec Storybook
  - [ ] Standardiser les tokens design (couleurs, spacing, typography)
  - [ ] Créer des composants composites réutilisables
  - [ ] Documenter les patterns d'usage

---

### 🐛 Bugs et Code Smells Identifiés

#### 1. **Syntax Error dans le Store**
- **Fichier** : `lib/store.ts` ligne 142
- **Problème** : Parenthèse manquante dans `addInvestigationFormField`
- **Action** : [ ] Corriger immédiatement

#### 2. **Memory Leaks Potentiels**
- **Problème** : Connexions Socket.IO et timers non nettoyés
- **Fichiers concernés** : 
  - `useInvestigation.ts` - Multiple useEffect avec sockets
  - `ActiveSearches.tsx` - setInterval non nettoyé
  - [ ] Auditer tous les useEffect pour les cleanups
  - [ ] Implémenter un hook useInterval sécurisé
  - [ ] Centraliser la gestion des WebSockets

#### 3. **Hard-coded Values et Magic Numbers**
- **Problèmes identifiés** :
  - URLs API en dur dans plusieurs composants
  - Timeouts et delays magic numbers
  - 'static_user_id' en dur partout
- **Actions** :
  - [ ] Créer un fichier de configuration centralisé
  - [ ] Extraire toutes les constantes
  - [ ] Implémenter la gestion d'environnement appropriée

#### 4. **Error Handling Inconsistant**
- **Problème** : Certains endroits catchent et loggent, d'autres propagent
- **Actions** :
  - [ ] Standardiser la gestion d'erreurs
  - [ ] Créer des Error classes spécialisées
  - [ ] Implémenter un système de reporting d'erreurs

#### 5. **Performance Issues**
- **Problèmes identifiés** :
  - Re-renders inutiles (manque de React.memo)
  - Requêtes non optimisées (pas de debouncing)
  - Large bundles (pas de code splitting)
- **Actions** :
  - [ ] Auditer les re-renders avec React DevTools
  - [ ] Implémenter le debouncing pour les recherches
  - [ ] Ajouter le lazy loading des composants lourds

---

### 📊 Amélioration des Performances

#### 1. **Optimisation Frontend**
- **Actions** :
  - [ ] Implémenter le lazy loading pour les composants lourds
  - [ ] Optimiser les re-renders avec React.memo et useMemo
  - [ ] Ajouter le code splitting par route
  - [ ] Implémenter la virtualisation pour les grandes listes
  - [ ] Optimiser les images avec Next.js Image
  - [ ] Ajouter la compression des assets

#### 2. **Optimisation Backend**
- **Actions** :
  - [ ] Ajouter la pagination automatique pour toutes les listes
  - [ ] Implémenter la compression gzip
  - [ ] Optimiser les requêtes Prisma avec des indices
  - [ ] Ajouter la mise en cache des requêtes fréquentes
  - [ ] Implémenter le pooling de connexions
  - [ ] Ajouter la limitation de taux (rate limiting)

#### 3. **Optimisation Base de Données**
- **Actions** :
  - [ ] Analyser et optimiser les requêtes lentes
  - [ ] Ajouter des indices composites appropriés
  - [ ] Implémenter la pagination cursor-based
  - [ ] Optimiser les jointures complexes
  - [ ] Ajouter le monitoring des performances

---

#### 1. **Tests Manquants**
- **Actions** :
  - [ ] Ajouter des tests unitaires pour tous les hooks
  - [ ] Créer des tests d'intégration pour les services d'outils
  - [ ] Implémenter des tests E2E pour les workflows critiques
  - [ ] Ajouter des tests de performance
  - [ ] Tester la gestion des erreurs
  - [ ] Tests de régression pour les bugs identifiés

#### 2. **Qualité du Code**
- **Actions** :
  - [ ] Configurer ESLint avec des règles strictes
  - [ ] Ajouter Prettier pour la formatage automatique
  - [ ] Implémenter des pre-commit hooks
  - [ ] Ajouter l'analyse statique avec SonarQube
  - [ ] Mettre en place le type checking strict
  - [ ] Ajouter des métriques de complexité cyclomatique

---

#### 1. **Documentation Technique**
- **Actions** :
  - [ ] Documenter l'architecture avec des diagrammes
  - [ ] Créer des guides de contribution
  - [ ] Documenter les patterns et conventions
  - [ ] Ajouter des exemples d'utilisation
  - [ ] Documenter les APIs avec JSDoc
  - [ ] Créer un guide de migration

#### 2. **Monitoring et Observabilité**
- **Actions** :
  - [ ] Implémenter des métriques applicatives
  - [ ] Ajouter des alertes pour les erreurs critiques
  - [ ] Créer un dashboard de santé système
  - [ ] Implémenter le tracing des performances
  - [ ] Ajouter le monitoring des ressources
  - [ ] Implémenter l'APM (Application Performance Monitoring)
- [ ] **SOCKET CENTRALIZATION** : Centraliser la gestion des WebSockets
- [ ] **STORE REFACTORING** : Modulariser le store Zustand monolithique
- [ ] **VALIDATION UNIFICATION** : Unifier les systèmes de validation
- [ ] **TOOL SERVICES** : Refactoriser les services d'outils avec classe abstraite
- [ ] **CACHE IMPLEMENTATION** : Implémenter TanStack Query
- [ ] **NOTIFICATIONS UNIFICATION** : Unifier les systèmes de notifications
- [ ] **DESIGN SYSTEM** : Créer le design system complet
- [ ] **PERFORMANCE OPTIMIZATION** : Optimiser les performances frontend/backend
- [ ] **TESTING SUITE** : Implémenter la suite de tests complète
- [ ] **MONITORING** : Ajouter monitoring et observabilité
- [ ] **DOCUMENTATION** : Documentation complète du système
- [ ] **CI/CD OPTIMIZATION** : Optimiser les pipelines de déploiement
- [ ] **ARCHITECTURE LAYERS** : Architecture en couches complète
- [ ] **MICRO-FRONTENDS** : Considérer l'approche micro-frontends si pertinent
- [ ] **REAL-TIME OPTIMIZATION** : Optimiser les fonctionnalités temps réel
- [ ] **SECURITY AUDIT** : Audit de sécurité complet
- [ ] **ACCESSIBILITY** : Améliorer l'accessibilité (a11y)
- [ ] **INTERNATIONAL** : Préparer l'internationalisation (i18n)
### 📈 Métriques de Succès

#### KPIs Techniques
- [ ] **Réduction du bundle size** : -30% minimum
- [ ] **Temps de build** : -50% grâce à l'optimisation
- [ ] **Couverture de tests** : 80% minimum
- [ ] **Scores Lighthouse** : 90+ sur tous les critères
- [ ] **Réduction des bugs** : -70% en production

#### KPIs Développement
- [ ] **Vélocité équipe** : +40% grâce à la réduction de la dette technique
- [ ] **Time to market** : -50% pour les nouvelles fonctionnalités
- [ ] **Onboarding** : -60% de temps pour intégrer un nouveau développeur
- [ ] **Maintenance** : -80% de temps pour corriger les bugs

---
### 1. Finalisation du Moteur d'Investigation
- [ ] **Workflow Dynamique** : Implémenter la logique de l'orchestrateur pour lancer les outils pertinents en fonction des données d'entrée initiales (cf. `PLAN.md`).
- [ ] **Normalisation des Données** : Valider et finaliser la transformation des données brutes de chaque outil en un format unifié pour la base de données.

### 2. Améliorations UI/UX
- [ ] **Page de Résultats**
    - [x] Ajouter des filtres avancés (par date, type de résultat, outil).
    - [x] Implémenter la pagination ou un défilement infini pour gérer de grands volumes de résultats.
    - [ ] Développer la vue "graphique" des relations entre les indicateurs (ex: avec `react-flow`).
- [ ] **Tableau de Bord**
    - [ ] Rendre les cartes de statistiques cliquables pour filtrer les vues.
    - [ ] Ajouter des graphiques d'évolution (ex: nombre d'investigations par semaine).
- [ ] **Centre de Notifications**
    - [ ] Ajouter une icône "cloche" dans la barre de navigation.
    - [ ] Créer une page `/notifications` pour l'historique des alertes.
    - [ ] Permettre de marquer les notifications comme lues/non lues.
- [ ] **Gestion des Dossiers**
    - [ ] Intégrer une bibliothèque de drag-and-drop (ex: `dnd-kit`) pour réorganiser les investigations entre les dossiers (reporté).
- [ ] **Aide et Guidage**
    - [ ] Ajouter des infobulles (`Tooltip`) sur les fonctionnalités complexes.
    - [ ] Créer une page d'aide ou une modale de bienvenue.

### 3. Fonctionnalités Majeures
- [ ] **Exportation de Rapports**
    - [ ] Ajouter un bouton "Exporter" sur les pages d'investigation et de dossier.
    - [ ] Implémenter la logique backend pour générer des rapports PDF et CSV/XLSX.
- [ ] **Formulaire d'Investigation Avancé**
    - [ ] Mettre en place une validation en temps réel du format des indicateurs.
    - [ ] Permettre de sauvegarder et charger des "modèles" d'investigation (ex: un modèle pour "recherche de personne" qui pré-remplit certains champs).

### 4. Qualité et Documentation
- [ ] **Documentation Technique**
    - [ ] Générer et documenter l'API avec Swagger/OpenAPI.
    - [ ] Rédiger un guide de déploiement et d'architecture détaillé.
- [ ] **Documentation Utilisateur**
    - [ ] Rédiger un manuel d'utilisation complet et une FAQ.

---

### 🚀 Deep Refactor : Module d'Investigation

Cette section vise une refactorisation en profondeur du module le plus critique de l'application pour démanteler les "God Hooks", optimiser le data-fetching et clarifier l'architecture.

#### 1. **Démanteler le "God Hook" `useInvestigation`**
- **Problème** : Le hook `useInvestigation` est devenu un "God Hook" de plus de 400 lignes, gérant trop de responsabilités (état de la liste, état du détail, actions, WebSockets).
- **Solution** : Décomposer le hook en plusieurs hooks plus petits, chacun avec une seule responsabilité (Single Responsibility Principle).
- **Actions** :
  - [ ] **Créer `hooks/useInvestigationsList.ts`** : Gérera uniquement la récupération et la mise à jour de la liste des investigations.
  - [ ] **Créer `hooks/useInvestigationDetail.ts`** : Gérera uniquement la récupération des données détaillées d'une seule investigation (détails, logs, indicateurs, etc.).
  - [ ] **Créer `hooks/useInvestigationActions.ts`** : Centralisera toutes les actions (mutations) : `create`, `start`, `stop`, `delete`. Cela sépare la lecture (queries) de l'écriture (mutations).

#### 2. **Migration vers TanStack Query (React Query)**
- **Problème** : Le fetching de données est manuel, basé sur `useState` et `useEffect`, sans cache, ce qui cause des chargements inutiles et une complexité accrue.
- **Solution** : Utiliser TanStack Query pour une gestion déclarative et automatique des états serveur.
- **Actions** :
  - [ ] **Remplacer le fetching manuel** : Migrer toute la logique de `investigationAPI` dans des `useQuery` pour la lecture et `useMutation` pour les actions.
  - [ ] **Mise en cache automatique** : Profiter du cache intelligent pour éviter les rechargements inutiles et améliorer la réactivité de l'UI.
  - [ ] **Supprimer la logique de loading/error** : Éliminer les `useState` pour `isLoading`, `error`, etc., car TanStack Query les fournit nativement.
#### 3. **Centralisation de la Gestion des WebSockets**
- **Problème** : Plusieurs hooks et composants (`useInvestigation`, `NotificationsProvider`) créent et gèrent leurs propres connexions WebSocket, ce qui est inefficace et source de bugs.
- **Solution** : Créer un `SocketProvider` unique qui gère une seule connexion pour toute l'application.
- **Actions** :
  - [ ] **Créer `providers/SocketProvider.tsx`** : Ce provider établira la connexion et la rendra disponible via un contexte React.
  - [ ] **Créer le hook `useSocketEvent(event, callback)`** : Permettra aux composants de s'abonner à des événements sans se soucier de la gestion de la connexion.
  - [ ] **Refactoriser tous les modules** pour utiliser ce système centralisé, éliminant les connexions multiples.

#### 4. **Simplification Radicale des Composants**
- **Problème** : Les composants (ex: `InvestigationDetailPage`) contiennent de la logique de fetching et de la gestion d'état complexe.
- **Solution** : Transformer les composants en composants "bêtes" (dumb components) qui ne font que recevoir les données des nouveaux hooks.
- **Actions** :
  - [ ] **Refactoriser `pages/investigation/[id].tsx`** pour utiliser `useInvestigationDetail` et `useInvestigationActions`.
  - [ ] **Refactoriser `pages/investigations.tsx`** pour utiliser `useInvestigationsList`.
  - [ ] **Supprimer toute la logique `useEffect` de fetching** des composants. La logique sera entièrement contenue dans les hooks `useQuery`.

---

- [ ] il faudrait que dans le tableau des résultats, on est un sous tableau par investagion, que ce tableau soit aussi présent dans la page des investigation mais focus sur l'investigation ouverte. dans ce tableau on aura non plus que la liste des compte trouvé mais un résumer de tout ce qui à été trouvé avec des liens si possible vers le détails de chaque élément, il regroupera ligne par ligne les compte trouvé, numéro, photo, site, ip, etc toutes les informations mais présenter ligne par ligne dans le tableau, avec en plus de la colonne catégorie une colonne type avec une icone lié au type de donnée trouvé.

