# Liste des Tâches et Améliorations pour NumOSINT

Ce document centralise toutes les tâches de développement, des fonctionnalités immédiates aux objectifs à long terme.

---

## 🎯 Prochaines Étapes Prioritaires

### 1. Architecture : Refactorisation en Microservices
- [x] **Architecture : Planification**
    - [x] Définir l'architecture cible avec des microservices pour chaque outil.
    - [x] Valider le plan de migration.
- [x] **Service : Maigret**
    - [x] Créer le `Dockerfile` dédié.
    - [x] Créer le serveur `Flask` (`server.py`).
    - [x] Mettre à jour `docker-compose.yml`.
    - [x] Mettre à jour le service Node.js (`maigret.js`) pour appeler le microservice.
- [x] **Service : Buster**
    - [x] Créer le `Dockerfile` dédié.
    - [x] Créer le serveur `Go` (`server.go`).
    - [x] Mettre à jour `docker-compose.yml`.
    - [x] Mettre à jour le service Node.js (`buster.js`) pour appeler le microservice.
- [x] **Service : Mosint**
    - [x] Créer le `Dockerfile` dédié.
    - [x] Créer le serveur `Go` (`server.go`).
    - [x] Mettre à jour `docker-compose.yml`.
    - [x] Mettre à jour le service Node.js (`mosint.js`) pour appeler le microservice.
- [x] **Service : PhoneInfoga**
    - [x] Créer le `Dockerfile` dédié.
    - [x] Créer le serveur `Go` (`server.go`).
    - [x] Mettre à jour `docker-compose.yml`.
    - [x] Mettre à jour le service Node.js (`phoneinfoga.js`) pour appeler le microservice.
- [x] **Nettoyage**
    - [x] Supprimer les dépendances des outils du `Dockerfile` principal.

### 2. Gestion de Dossiers d'Investigation
- [x] **Backend : Modèle de Données**
    - [x] Créer une nouvelle entité `Case` (Dossier) dans `prisma/schema.prisma`.
    - [x] Établir une relation un-à-plusieurs : un `Case` contient plusieurs `Investigation`.
    - [x] Ajouter les champs : `id`, `name`, `description`, `createdAt`, `updatedAt`.
- [x] **Backend : API**
    - [x] Créer un nouveau fichier de route `src/routes/cases.js`.
    - [x] Implémenter les endpoints CRUD pour les dossiers.
    - [x] Implémenter un endpoint pour l'association d'investigations.
- [ ] **Frontend : Page des Investigations (`/investigations`)**
    - [x] Refondre l'UI pour afficher une structure de dossiers.
    - [ ] Intégrer une bibliothèque de drag-and-drop (ex: `dnd-kit`) - (reporté).
    - [x] Ajouter un bouton "Créer un dossier" avec une modale.
    - [x] Ajouter la possibilité d'assigner une investigation à un dossier.
- [x] **Frontend : Nouvelle Page de Dossier (`/case/[id]`)**
    - [x] Créer une page dynamique `pages/case/[id].tsx`.
    - [x] Afficher les détails et la liste des investigations du dossier.
    - [x] Créer un composant "Vue de Synthèse du Dossier".

### 2. Finalisation du Moteur d'Investigation
- [x] **Orchestrateur et Flux**
    - [x] Implémenter la gestion d'erreurs robuste et le système de retry par étape.
    - [x] Gérer les investigations interrompues et permettre l'annulation.
    - [x] Remplacer le polling par des WebSockets pour les mises à jour de statut.
- [x] **Adaptateurs de Données**
    - [ ] Valider la normalisation des données pour chaque outil.
    - [x] Implémenter la déduplication des résultats au niveau applicatif.
    - [x] Créer les index PostgreSQL optimisés pour les requêtes fréquentes.

---

##  backlog  backlog Améliorations et Nouvelles Fonctionnalités

### UI/UX
- [ ] **Page de Résultats**
    - [ ] Ajouter des filtres avancés (par date, type de résultat).
    - [ ] Vue "graphique" des relations entre indicateurs.
    - [ ] Pagination ou défilement infini.
- [ ] **Tableau de Bord**
    - [ ] Rendre les cartes de statistiques cliquables.
    - [ ] Ajouter des graphiques d'évolution.
- [ ] **Formulaire d'Investigation**
    - [ ] Validation en temps réel du format des indicateurs.
    - [ ] Sauvegarder des "modèles" d'investigation.
- [ ] **Aide et Guidage**
    - [ ] Ajouter des infobulles (`Tooltip`) sur les fonctionnalités complexes.
    - [ ] Créer une page d'aide ou une modale de bienvenue.
- [ ] **Centre de Notifications**
    - [ ] Ajouter une icône "cloche" dans la barre de navigation.
    - [ ] Créer une page `/notifications` pour l'historique des alertes.
    - [ ] Permettre de marquer les notifications comme lues/non lues.

### Fonctionnalités Majeures
- [ ] **Exportation de Rapports**
    - [ ] Bouton "Exporter" sur les pages d'investigation et de dossier.
    - [ ] Génération de rapports PDF et CSV/XLSX.
- [ ] **Intégration de Nouveaux Outils OSINT**
    - [ ] Identifier et intégrer de nouveaux outils pertinents.

---

## 🛠️ Qualité, Tests et Documentation

### Tests
- [ ] **Tests Unitaires**
    - [x] Compléter la couverture pour `mosint.js`, `maigret.js`, `phoneinfoga.js`, `spiderfoot.js`.
    - [x] Ajouter des tests pour les modèles Prisma (CRUD, relations).

### Documentation
- [ ] **Documentation Technique**
    - [ ] Documenter l'API avec Swagger/OpenAPI.
    - [ ] Rédiger un guide de déploiement et d'architecture.
- [ ] **Documentation Utilisateur**
    - [ ] Rédiger un manuel d'utilisation et une FAQ.