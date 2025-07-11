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
- [x] **UI**: Créer une section "Profils Sociaux" avec des composants `Card` pour afficher les résultats de la recherche par e-mail.
- [x] **API**: Connecter la recherche de fuites de données au backend.
- [x] **UI**: Afficher les fuites dans une `Alert` dans la section "Sécurité & Exposition".
- [x] **API**: Connecter la recherche de liens (Google, Twitter, etc.).
- [x] **UI**: Afficher les liens dans un `Accordion` dans la section "Empreinte Numérique".
- [x] **API**: Connecter la recherche de domaines (Reverse Whois).
- [x] **UI**: Afficher les résultats du Reverse Whois dans une `Table` dans la section "Actifs Numériques".

### Mosint
- [x] **UI**: Ajouter des `Badge` colorés pour la réputation de l'e-mail et le statut de validité.
- [x] **API**: Intégrer le lookup sur HaveIBeenPwned.
- [x] **UI**: Enrichir la `Alert` des fuites de données avec les informations de HIBP.
- [x] **API**: Intégrer le lookup IP (IPApi).
- [x] **UI**: Créer une `Card` pour afficher les informations de l'IP du serveur mail.

### Maigret
- [x] **UI**: Créer la vue en `Grid` de `Card` pour les profils trouvés.
- [x] **UI**: Implémenter le `Popover` sur chaque carte pour afficher les détails parsés.
- [x] **API & UI**: Ajouter le bouton et la logique pour la recherche récursive.
- [x] **UI**: Ajouter les filtres par `tags` au-dessus de la grille de résultats.

### PhoneInfoga
- [x] **UI**: Créer la `Card` d'en-tête avec les informations de base du numéro.
- [x] **UI**: Implémenter les `Badge` de réputation (jetable, spam).
- [x] **UI**: Structurer les résultats du footprinting dans un `Accordion`.

### SpiderFoot
- [x] **UI (Majeur)**: Intégrer une librairie de graphes (ex: `react-flow`) pour la vue des corrélations.
- [x] **API**: Créer une route qui formate les données de la base pour être compatibles avec la librairie de graphe.
- [x] **UI**: Implémenter le `DropdownMenu` pour les exports de données.
- [x] **API**: Mettre en place la logique d'export en CSV/JSON côté backend.
- [x] **UI**: Créer la section dédiée aux résultats du Dark Web (avec les avertissements nécessaires).
- [x] **UI**: pour les logo tu as créé des png mais utilise des icone plutot de notre bibliotheque mui
- [x] **Readme**: maj le readme avec tout nos changements

## Phase 3: Enrichissement Avancé & Contexte Réseau

### ASN/IP Intel
- [x] **Backend**: Créer un wrapper pour l'outil `nitefood/asn` (microservice, Dockerfile, serveur).
- [x] **API**: Intégrer le service `asn` dans l'orchestrateur pour enrichir les indicateurs IP.
- [x] **UI**: Créer une vue `IpAnalysisView` pour afficher les détails de l'ASN, la géolocalisation et la réputation de l'IP.

### People Data Labs (PDL)
- [x] **Backend**: Créer un service `pdl` qui utilise la librairie officielle de PDL (nécessite une clé API).
- [x] **API**: Ajouter une route et une logique dans l'orchestrateur pour l'enrichissement avancé via PDL.
- [x] **UI**: Créer une vue `PersonProfileView` pour afficher les données professionnelles et personnelles riches de PDL.
- [x] **UI**: Ajouter un bouton "Enrichissement Avancé" sur les indicateurs pertinents pour un déclenchement manuel.
