# 🚀 NumOSINT - Plateforme d'Investigation Numérique Unifiée

**Plateforme OSINT moderne avec orchestrateur multi-outils, interface React/Next.js et backend Node.js/PostgreSQL.**

## 🎯 Vue d'Ensemble

NumOSINT est une plateforme d'investigation numérique qui unifie 5 outils OSINT spécialisés dans un flux automatisé :

- **🔍 Buster** : Génération et validation d'e-mails
- **📧 Mosint** : Analyse d'e-mails et fuites de données  
- **👤 Maigret** : Recherche de profils utilisateur (400+ plateformes)
- **📱 PhoneInfoga** : Analyse de numéros de téléphone
- **🕷️ SpiderFoot** : Scan OSINT exhaustif (25+ modules)

### Architecture Moderne
- **Frontend** : Next.js 14 + TypeScript + Tailwind CSS
- **Backend** : Node.js + Express + TypeScript
- **Base de données** : PostgreSQL + Prisma ORM
- **Cache** : Redis
- **Conteneurisation** : Docker + Docker Compose
- **Temps réel** : WebSocket (Socket.IO)

## 🚀 Installation Rapide

### Prérequis
- Docker et Docker Compose
- 8GB RAM recommandés
- Ports disponibles : 3000, 5000, 5432, 6379

### Démarrage
```bash
# Cloner et démarrer en une commande
git clone <repo-url>
cd NumOSINT
docker-compose up
```

## 🌐 Accès aux Services

Après démarrage (< 2 minutes) :

| Service | URL | Description |
|---------|-----|-------------|
| **Interface Principale** | http://localhost:3000 | Application Next.js moderne |
| **API Backend** | http://localhost:5000 | API REST + WebSocket |
| **Interface Legacy** | http://localhost:8080 | Interface de compatibilité |
| **PostgreSQL** | localhost:5432 | Base de données |
| **Redis** | localhost:6379 | Cache et sessions |

## 📖 Guide d'Utilisation

### 1. Créer une Investigation
1. Ouvrir http://localhost:3000
2. Cliquer "Nouvelle Investigation"
3. Saisir les indicateurs (nom, email, téléphone, username)
4. Lancer l'investigation

### 2. Suivi en Temps Réel
- **Progression** : Barre de progression par étape
- **Logs** : Messages en temps réel via WebSocket
- **Statuts** : INITIALIZING → ENRICHING → SCANNING → CONSOLIDATING → COMPLETED

### 3. Résultats
- **Vue unifiée** : Tous les résultats dans une interface
- **Par outil** : Résultats détaillés par service OSINT
- **Export** : Données disponibles en JSON
- **Historique** : Toutes les investigations sauvegardées

## 🏗️ Architecture Technique

### Structure du Projet
```
NumOSINT/
├── 📁 src/                    # Backend Node.js
│   ├── services/tools/        # Services OSINT (buster, mosint, etc.)
│   ├── routes/               # Routes API REST
│   └── utils/                # Utilitaires (logger, socket)
├── 📁 frontend/              # Frontend Next.js
│   ├── src/components/       # Composants React
│   ├── src/pages/           # Pages Next.js
│   └── src/hooks/           # Hooks personnalisés
├── 📁 prisma/               # Schéma base de données
├── 📁 todo/                 # Documentation tâches
└── 📄 docker-compose.yml    # Configuration services
```

### Flux d'Investigation
```mermaid
graph TD
    A[Utilisateur] --> B[Investigation Form]
    B --> C[Orchestrateur]
    C --> D[Base PostgreSQL]
    
    C --> E1[Buster Service]
    C --> E2[Mosint Service] 
    C --> E3[Maigret Service]
    C --> E4[PhoneInfoga Service]
    C --> E5[SpiderFoot Service]
    
    E1 --> F[Consolidateur]
    E2 --> F
    E3 --> F
    E4 --> F
    E5 --> F
    
    F --> G[Rapport Final]
    G --> H[Interface Utilisateur]
```

## 📊 Fonctionnalités Actuelles

### ✅ Fonctionnel
- **5 services OSINT** intégrés et opérationnels
- **Orchestrateur** avec gestion d'état automatique
- **Interface React** moderne et responsive
- **API REST** complète avec documentation
- **Base PostgreSQL** avec schéma optimisé
- **WebSocket** pour temps réel
- **Docker** multi-services stable

### 🟡 En Développement
- Tests automatisés (infrastructure prête)
- Authentification et autorisation
- Optimisation des performances
- Documentation utilisateur complète

### ❌ Planifié
- Cache Redis avancé
- Load balancing et clustering
- Monitoring et alerting
- CI/CD pipeline

## 🛠️ Développement

### Environnement Local
```bash
# Backend (Node.js)
cd src
npm install
npm run dev

# Frontend (Next.js)
cd frontend  
npm install
npm run dev

# Base de données
npx prisma migrate dev
npx prisma generate
```

### Tests
```bash
# Validation complète
./test-final.sh

# Tests spécifiques
npm run test          # Tests unitaires
npm run test:e2e      # Tests end-to-end (préparé)
```

### Logs et Debugging
```bash
# Logs en temps réel
docker-compose logs -f

# Logs spécifiques
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

## 📈 Métriques et Performance

### Performance Actuelle
- **Démarrage** : < 30 secondes
- **API Response** : < 100ms (endpoints simples)
- **Investigation complète** : 2-5 minutes
- **Interface** : Temps réel via WebSocket

### Statistiques Code
- **Backend** : ~80KB Node.js/TypeScript
- **Frontend** : ~50KB React/TypeScript  
- **Base données** : Schéma PostgreSQL optimisé
- **Docker** : 5 services orchestrés

## 🔧 Configuration

### Variables d'Environnement
```bash
# Backend
DATABASE_URL=postgresql://numosint:password@postgres:5432/numosint
REDIS_URL=redis://redis:6379
NODE_ENV=development

# Frontend  
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Ports Utilisés
- **3000** : Frontend Next.js
- **5000** : Backend API
- **5432** : PostgreSQL
- **6379** : Redis
- **8080** : Interface legacy (compatibilité)

## 📚 Documentation

### Guides Disponibles
- [`todo/todo.md`](todo/todo.md) : Tâches restantes détaillées
- [`todo/todo_prod.md`](todo/todo_prod.md) : Préparation production
- [`todo/changelog.md`](todo/changelog.md) : Historique des réalisations
- [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md) : Plan complet de migration

### API Documentation
- REST API : http://localhost:5000/api-docs (Swagger, préparé)
- WebSocket : Événements investigation temps réel
- Schéma DB : Voir `prisma/schema.prisma`

## 🚨 Notes Importantes

### Système Hybride Temporaire
Le projet utilise actuellement deux systèmes en parallèle :
- **Nouveau** : Node.js + PostgreSQL (recommandé)
- **Legacy** : Python + fichiers CSV (compatibilité)

### Migration des Données
```bash
# Migrer les anciens résultats
./migrate-results.sh

# Parser les fichiers CSV existants  
python3 parse_csv.py
```

## 🎯 Feuille de Route

### Prochaines Priorités (4-6 semaines)
1. **Finaliser la migration** PostgreSQL complète
2. **Tests automatisés** avec couverture 80%+
3. **Sécurité de base** (auth/autorisation)
4. **Optimisation performance**

### Production (7-8 semaines)
1. **Load balancing** et clustering
2. **Monitoring avancé** (Grafana/Prometheus)
3. **CI/CD pipeline** complet
4. **Documentation finale**

## 🤝 Contribution

### Développement
1. Fork du projet
2. Créer une branche feature
3. Tests et validation
4. Pull request avec description

### Architecture
- **Modulaire** : Chaque outil OSINT est un service indépendant
- **Extensible** : Facile d'ajouter de nouveaux outils
- **Type-safe** : TypeScript partout
- **Testable** : Architecture prête pour tests

## 📞 Support

### Debugging
```bash
# Health check complet
curl http://localhost:5000/api/health

# Statut des services
docker-compose ps

# Redémarrage complet
docker-compose restart
```

### Problèmes Fréquents
- **Port occupé** : Vérifier avec `netstat -tlnp`
- **Mémoire insuffisante** : 8GB RAM recommandés
- **Docker** : Vérifier installation et daemon

---

## 🏆 Progression Actuelle

**✅ ~65% du plan de migration complété**

- ✅ **Phase 1** : Architecture et Infrastructure (90%)
- 🟡 **Phase 2** : Flux Unifié (70%) 
- ❌ **Phase 3** : Fonctionnalités Avancées (10%)
- ❌ **Phase 4** : Production (5%)

**NumOSINT est opérationnel pour les investigations OSINT avec une architecture moderne et extensible. Prêt pour finalisation et déploiement production.**
