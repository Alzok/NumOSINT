# Todo - Évolution de la Plateforme NumOSINT

## Phase 1: Workflow Dynamique et Nouveaux Outils

- [ ] **Architecture**: Implémenter la logique de l'orchestrateur de workflow dynamique basée sur les inputs du formulaire initial.
- [ ] **Backend**: Créer un service ou une route générique `/investigate` qui prend les données initiales et démarre le bon workflow.
- [ ] **Intégration (wau)**: Ajouter le wrapper pour l'outil `wau` (créer le microservice, le Dockerfile, et le serveur).
- [ ] **Intégration (waybulk)**: Ajouter le wrapper pour l'outil `waybulk`.
- [ ] **Workflow**: Intégrer `wau` comme étape de validation après la génération d'e-mails par `Buster`.
- [ ] **Workflow**: Intégrer `waybulk` comme première étape lorsqu'un domaine est fourni.
- [ ] **UI**: Créer une section "Archives du Site" pour afficher les résultats de `waybulk` dans une `Table`.

## Phase 2: Exploitation Complète des Fonctionnalités

### Buster
- [ ] **UI**: Créer une section "Profils Sociaux" avec des composants `Card` pour afficher les résultats de la recherche par e-mail.
- [ ] **API**: Connecter la recherche de fuites de données au backend.
- [ ] **UI**: Afficher les fuites dans une `Alert` dans la section "Sécurité & Exposition".
- [ ] **API**: Connecter la recherche de liens (Google, Twitter, etc.).
- [ ] **UI**: Afficher les liens dans un `Accordion` dans la section "Empreinte Numérique".
- [ ] **API**: Connecter la recherche de domaines (Reverse Whois).
- [ ] **UI**: Afficher les résultats du Reverse Whois dans une `Table` dans la section "Actifs Numériques".

### Mosint
- [ ] **UI**: Ajouter des `Badge` colorés pour la réputation de l'e-mail et le statut de validité.
- [ ] **API**: Intégrer le lookup sur HaveIBeenPwned.
- [ ] **UI**: Enrichir la `Alert` des fuites de données avec les informations de HIBP.
- [ ] **API**: Intégrer le lookup IP (IPApi).
- [ ] **UI**: Créer une `Card` pour afficher les informations de l'IP du serveur mail.

### Maigret
- [ ] **UI**: Créer la vue en `Grid` de `Card` pour les profils trouvés.
- [ ] **UI**: Implémenter le `Popover` sur chaque carte pour afficher les détails parsés.
- [ ] **API & UI**: Ajouter le bouton et la logique pour la recherche récursive.
- [ ] **UI**: Ajouter les filtres par `tags` au-dessus de la grille de résultats.

### PhoneInfoga
- [ ] **UI**: Créer la `Card` d'en-tête avec les informations de base du numéro.
- [ ] **UI**: Implémenter les `Badge` de réputation (jetable, spam).
- [ ] **UI**: Structurer les résultats du footprinting dans un `Accordion`.

### SpiderFoot
- [ ] **UI (Majeur)**: Intégrer une librairie de graphes (ex: `react-flow`) pour la vue des corrélations.
- [ ] **API**: Créer une route qui formate les données de la base pour être compatibles avec la librairie de graphe.
- [ ] **UI**: Implémenter le `DropdownMenu` pour les exports de données.
- [ ] **API**: Mettre en place la logique d'export en CSV/JSON côté backend.
- [ ] **UI**: Créer la section dédiée aux résultats du Dark Web (avec les avertissements nécessaires).

- [ ] **UI**: pour les logo tu as créé des png mais utilise des icone plutot de notre bibliotheque mui 
- [ ] **Readme**: maj le readme avec tout nos changements 