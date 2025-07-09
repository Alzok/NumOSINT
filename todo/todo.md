# 📋 TODO - Tâches Restantes NumOSINT

## Vue d'Ensemble
Progression actuelle : **~85%** du plan de migration complet
Basé sur l'analyse du travail effectué vs le plan de migration original.

**🎉 Avancées majeures accomplies :**
- ✅ Système hybride CSV/PostgreSQL éliminé
- ✅ Code Python legacy supprimé (app.py, parse_csv.py, etc.)
- ✅ Script de migration PostgreSQL créé
- ✅ Structure de tests unitaires et intégration mise en place
- ✅ Configuration Docker simplifiée
- ✅ Consolidation vers Node.js/TypeScript uniquement

---

## 🔄 Phase 2 : Finalisation du Flux Unifié (30% restant)

### 2.1 Intégration Frontend avec Backend
- [ ] **Remplacer complètement l'ancien système de recherche**
  - [ ] Désactiver l'ancien formulaire de recherche
  - [ ] Intégrer le nouveau `InvestigationForm` dans la page principale
  - [ ] Supprimer les références à `app.py` (Flask) du frontend
  - [ ] Migrer vers l'API Node.js uniquement

- [ ] **Finaliser les vues de résultats**
  - [x] Créer `EmailAnalysisView` pour mosint
  - [x] Créer `UsernameAnalysisView` pour Maigret  
  - [x] Créer `PhoneAnalysisView` pour PhoneInfoga
  - [x] Créer `ComprehensiveReportView` pour SpiderFoot
  - [ ] Intégrer ces vues dans la page de détail d'investigation

- [x] **Système de notifications en temps réel**
  - [x] Connecter Socket.IO côté frontend
  - [x] Afficher les logs d'investigation en temps réel
  - [x] Notifications toast pour les étapes complétées
  - [x] Barre de progression synchronisée

### 2.2 Migration Complète des Données
- [x] **Éliminer le système de fichiers CSV**
  - [x] Créer un script de migration one-time des données existantes
  - [x] Valider que toutes les données sont dans PostgreSQL
  - [x] Supprimer `parse_csv.py` et dépendances
  - [x] Supprimer le dossier `reports/` après migration

- [ ] **Finaliser les adaptateurs de données**
  - [ ] Tester les adaptateurs pour chaque outil OSINT
  - [ ] Valider la normalisation des données
  - [ ] Implémenter la déduplication au niveau DB
  - [ ] Créer les index PostgreSQL optimisés

### 2.3 Orchestrateur et Flux
- [ ] **Finaliser l'orchestrateur central**
  - [ ] Tester le flux complet bout en bout
  - [ ] Implémenter la gestion d'erreurs robuste
  - [ ] Ajouter le système de retry par étape
  - [ ] Valider les transitions d'état

- [ ] **Système de polling et statuts**
  - [ ] Optimiser le polling des investigations actives
  - [ ] Implémenter les WebSockets pour les mises à jour
  - [ ] Gérer les investigations interrompues
  - [ ] Ajouter la possibilité d'annuler une investigation

---

## 🧪 Phase 3 : Tests et Validation (100% à faire)

### 3.1 Tests Unitaires
- [x] **Tests des services OSINT**
  - [x] Tests unitaires pour `buster.js`
  - [ ] Tests unitaires pour `mosint.js`
  - [ ] Tests unitaires pour `maigret.js`
  - [ ] Tests unitaires pour `phoneinfoga.js`
  - [ ] Tests unitaires pour `spiderfoot.js`

- [x] **Tests de l'orchestrateur**
  - [x] Tests des transitions d'état
  - [x] Tests de gestion d'erreurs
  - [x] Tests des dépendances entre étapes
  - [x] Tests de timeout et retry

- [ ] **Tests des modèles Prisma**
  - [ ] Tests CRUD pour Investigation
  - [ ] Tests CRUD pour Indicator
  - [ ] Tests CRUD pour Result
  - [ ] Tests des relations et contraintes

### 3.2 Tests d'Intégration
- [x] **Tests API**
  - [x] Tests des routes `/api/investigations`
  - [x] Tests des routes `/api/tools`
  - [ ] Tests des routes `/api/health`
  - [ ] Tests de l'authentification (si ajoutée)

- [ ] **Tests End-to-End**
  - [ ] Test du flux complet d'investigation
  - [ ] Test de création → exécution → résultats
  - [ ] Test des cas d'erreur
  - [ ] Test de performance sur investigations longues

### 3.3 Tests Frontend
- [ ] **Tests des composants**
  - [ ] Tests du `InvestigationForm`
  - [ ] Tests du `ActiveInvestigations`
  - [ ] Tests des vues de résultats
  - [ ] Tests des notifications

- [ ] **Tests des hooks**
  - [ ] Tests du `useInvestigation`
  - [ ] Tests de l'API client
  - [ ] Tests de gestion d'état
  - [ ] Tests du polling

---

## 🔧 Phase 4 : Fonctionnalités et UX (70% à faire)

### 4.1 Interface Utilisateur Améliorée
- [ ] **Visualisation des résultats**
  - [ ] Améliorer l'affichage des données par outil
  - [ ] Graphiques et statistiques visuelles
  - [ ] Timeline des découvertes
  - [ ] Filtres et recherche dans les résultats

- [ ] **Export et Partage**
  - [ ] Export des rapports (PDF, Excel, JSON)
  - [ ] Impression des résultats
  - [ ] Partage via liens
  - [ ] Templates de rapports

### 4.2 Gestion d'Erreurs et Robustesse
- [ ] **Messages utilisateur**
  - [ ] Messages d'erreur clairs et actionables
  - [ ] Guide de résolution des problèmes
  - [ ] Tooltips et aide contextuelle
  - [ ] Notifications d'état améliorées

- [ ] **Récupération d'erreurs**
  - [ ] Retry automatique intelligent
  - [ ] Sauvegarde état en cas d'interruption
  - [ ] Mode dégradé si un outil échoue
  - [ ] Logs détaillés pour debugging

### 4.3 UX/UI
- [ ] **Interface utilisateur**
  - [ ] Mode hors ligne (service worker)
  - [ ] Améliorer la visualisation des résultats
  - [ ] Filtres et recherche dans les résultats
  - [ ] Export des rapports (PDF, Excel)

- [ ] **Accessibilité**
  - [ ] Conformité WCAG 2.1
  - [ ] Navigation au clavier
  - [ ] Support des lecteurs d'écran
  - [ ] Contrastes et tailles de police

---

## 🧹 Phase 5 : Nettoyage et Refactoring (70% à faire)

### 5.1 Nettoyage du Code
- [x] **Supprimer l'ancien système**
  - [x] Supprimer `app.py` (Flask) complètement
  - [x] Supprimer `parse_csv.py` après migration
  - [x] Supprimer `numosint_search.py`
  - [x] Nettoyer `docker-compose-simple.yml`

- [x] **Consolidation**
  - [x] Unifier sous Node.js/TypeScript uniquement
  - [x] Supprimer les dépendances Python inutiles
  - [x] Nettoyer les variables d'environnement
  - [x] Optimiser les images Docker

### 5.2 Documentation
- [ ] **Documentation technique**
  - [ ] Documenter l'API avec Swagger/OpenAPI
  - [ ] Guide de déploiement détaillé
  - [ ] Architecture et schémas de données
  - [ ] Guide de contribution

- [ ] **Documentation utilisateur**
  - [ ] Manuel d'utilisation
  - [ ] FAQ et troubleshooting
  - [ ] Guide de configuration
  - [ ] Exemples d'utilisation

---

## 🐛 Phase 6 : Corrections Spécifiques (100% à faire)

### 6.1 Bugs Identifiés
- [x] **Système hybride**
  - [x] Éliminer la coexistence fichiers/PostgreSQL
  - [x] Assurer la cohérence des données
  - [x] Fixer les références croisées
  - [x] Valider l'intégrité des migrations

- [x] **Configuration Docker**
  - [x] Simplifier docker-compose.yml
  - [x] Supprimer les services legacy
  - [x] Optimiser les volumes et réseaux
  - [x] Valider les variables d'environnement

### 6.2 Améliorations Critiques
- [ ] **Gestion d'erreurs**
  - [ ] Messages d'erreur utilisateur friendly
  - [ ] Logging détaillé pour le debugging
  - [ ] Récupération automatique après erreur
  - [ ] Notifications d'erreur appropriées

- [ ] **Performance critique**
  - [ ] Optimiser le démarrage des investigations
  - [ ] Réduire l'usage mémoire des services OSINT
  - [ ] Paralléliser les opérations indépendantes
  - [ ] Timeout configurables par outil

---

## 📊 Métriques de Succès

### Critères de Validation
- [ ] **Fonctionnel**
  - [ ] Toutes les investigations se terminent avec succès
  - [ ] Aucune dépendance aux fichiers CSV
  - [ ] Interface unifiée fonctionnelle
  - [ ] Données cohérentes en PostgreSQL

- [ ] **Performance**
  - [ ] Temps de réponse API < 200ms
  - [ ] Investigation complète < 5 minutes
  - [ ] Usage mémoire < 1GB par investigation
  - [ ] 99% de disponibilité

- [ ] **Qualité**
  - [ ] Couverture de tests > 80%
  - [ ] Zéro vulnérabilité critique
  - [ ] Documentation complète
  - [ ] Code review passé

---

## 🎯 Priorités Recommandées

### Priority 1 (Critique - Local/Dev)
1. Éliminer le système hybride fichiers/PostgreSQL
2. Finaliser l'intégration frontend/backend
3. Créer les tests essentiels
4. Nettoyer le code legacy

### Priority 2 (Important - Fonctionnel)
1. Features avancées d'UI
2. Documentation utilisateur
3. Gestion d'erreurs améliorée

### Priority 3 (Production - voir todo_prod.md)
1. Optimisation performances et cache
2. Sécurité et authentification
3. Monitoring et alerting
4. Load balancing et clustering

---

**Temps estimé pour application fonctionnelle complète : 3-4 semaines**  
**Temps estimé pour production (voir todo_prod.md) : 7-8 semaines supplémentaires** 