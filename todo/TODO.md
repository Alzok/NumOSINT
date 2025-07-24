# NumOSINT : Tâches Restantes

Ce document suit les chantiers de développement actifs et futurs pour la plateforme NumOSINT.

---

## 🚀 Chantiers Prioritaires

### Chantier A : Gestion des Rôles & Superadmin
*Objectif : Mettre en place un système de rôles pour différencier les utilisateurs standards des administrateurs, avec des privilèges spécifiques.*

- [x] **1. Mettre à jour la base de données :**
    - [x] Ajouter un `enum Role` (`USER`, `ADMIN`) dans `prisma/schema.prisma`.
    - [x] Ajouter un champ `role` au modèle `User` avec la valeur par défaut `USER`.
    - [x] Modifier le champ `credits` pour qu'il puisse être `null` (pour les crédits illimités de l'admin).
    - [x] Générer et appliquer la nouvelle migration de base de données.

- [x] **2. Créer le compte Superadmin :**
    - [x] Créer un script de "seed" Prisma.
    - [x] Le script lira les variables d'environnement (`SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`).
    - [x] Le script créera (ou mettra à jour) un utilisateur avec le rôle `ADMIN` et des crédits `null`.

- [x] **3. Adapter la logique métier :**
    - [x] Modifier le service de gestion des crédits pour ne pas déduire de crédits si `user.role === 'ADMIN'`.
    - [x] Mettre à jour le token JWT et la session NextAuth pour y inclure le `role` et les `credits`.

### Chantier B : Améliorations UI/UX
*Objectif : Améliorer l'ergonomie et l'interactivité de l'interface utilisateur.*

- [ ] **Améliorer le feedback des investigations**
    - [ ] Rendre la timeline d'investigation plus interactive (icônes, couleurs, clics).
    - [ ] Utiliser des squelettes de chargement (skeletons) plus contextuels pour améliorer la perception de vitesse.
- [ ] **Améliorer le formulaire d'investigation**
    - [ ] Afficher le coût en crédits en temps réel pendant que l'utilisateur ajoute des indicateurs.
    - [ ] Ajouter une validation instantanée (côté client) pour la syntaxe des indicateurs.
- [ ] **Améliorer la navigation**
    - [ ] Mettre en place un fil d'Ariane (Breadcrumbs) pour faciliter la navigation.
    - [ ] Ajouter une barre de recherche globale dans l'application.
- [ ] **Page de Résultats Unifiée (`/results`)**
    - [ ] Ajouter des filtres avancés (par type de preuve, par outil source, par niveau de confiance).
    - [ ] Mettre en place une pagination ou un défilement infini pour gérer de grands volumes de résultats.
- [ ] **Tableau de Bord Interactif (`/`)**
    - [ ] Permettre de cliquer sur les graphiques pour appliquer des filtres globaux.
    - [ ] Sauvegarder les préférences de filtres de l'utilisateur.
- [ ] **Centre de Notifications (`/notifications`)**
    - [ ] Finaliser la page dédiée pour voir l'historique des notifications.
    - [ ] Ajouter les actions "Marquer tout comme lu" et "Supprimer les notifications lues".

---

## 🛠️ Chantiers de Fond

### Chantier C : Qualité & Stratégie de Test
*Objectif : Assurer la stabilité et la non-régression de l'application.*

- [ ] Mettre en place des tests de non-régression visuelle (par exemple avec Playwright).
- [ ] Augmenter la couverture des tests unitaires pour les services critiques du backend.

### Chantier D : Finalisation du Moteur d'Investigation
*Objectif : Garantir la cohérence et la fiabilité des données traitées par le système.*

- [ ] **Normalisation des Données**:
    - [ ] Valider et finaliser le `ResultTransformer` pour tous les outils OSINT intégrés.
    - [ ] S'assurer que toutes les données brutes sont correctement mappées au schéma de "Preuve" unifié.

---

## 📚 Backlog Technique (Améliorations Futures)

*Ces tâches représentent des améliorations architecturales importantes à considérer une fois les chantiers prioritaires terminés.*

### Backend & Architecture
- [ ] **Refactoriser en Services Découplés** : Extraire la logique métier des routes Express (ex: `auth.js`) dans des services dédiés pour améliorer la modularité et la testabilité.
- [ ] **Gestion de Configuration Avancée** : Mettre en place une validation de la configuration au démarrage (avec `zod`) pour éviter les erreurs dues à des variables d'environnement manquantes.

### Frontend & Performance
- [ ] **Adopter TanStack Query (React Query)** : Remplacer la logique de fetching manuelle (`useState`/`useEffect`) par TanStack Query pour simplifier la gestion du cache, la revalidation des données et les états de chargement/erreur.
- [ ] **Virtualiser les Listes Longues** : Utiliser `TanStack Virtual` pour les listes de résultats, notifications, etc., afin de garantir des performances fluides même avec des milliers d'éléments.