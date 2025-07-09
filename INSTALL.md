# Installation 100% Automatisée NumOSINT

## 🚀 Installation en Une Commande

```bash
docker-compose up -d
```

**C'est tout !** L'installation est entièrement automatisée.

## 📋 Prérequis

- **Docker** et **Docker Compose** installés
- **Ports disponibles** : 5001, 3001, 8081, 5435, 6380
- **Système supporté** : Linux, macOS, Windows (WSL2)

## 🔧 Services Inclus

| Service | Port | Description |
|---------|------|-------------|
| **Backend API** | 5001 | API REST Node.js + Prisma |
| **Frontend** | 3001 | Interface React/Next.js |
| **Nginx** | 8081 | Reverse proxy (Frontend + API) |
| **PostgreSQL** | 5435 | Base de données |
| **Redis** | 6380 | Cache et sessions |

## 📦 Installation Automatisée

### 1. Cloner le Projet
```bash
git clone <repository-url>
cd NumOSINT
```

### 2. Démarrage Automatique
```bash
docker-compose up -d
```

### 3. Vérification
```bash
# Statut des services
docker-compose ps

# Logs en temps réel
docker-compose logs -f backend

# Tests des services
curl http://localhost:5001/api/health    # Backend direct
curl http://localhost:3001/              # Frontend direct
curl http://localhost:8081/              # Via nginx (frontend)
curl http://localhost:8081/api/health    # Via nginx (API)
```

## 🌐 Accès aux Services

### 🎯 **Interface Principale (Recommandée)**
- **Via Nginx** : http://localhost:8081/
  - Frontend Next.js intégré
  - API backend accessible via `/api/`
  - Configuration reverse proxy complète

### 🔧 **Services Directs (Développement)**
- **Frontend** : http://localhost:3001/
- **Backend API** : http://localhost:5001/api/health
- **PostgreSQL** : localhost:5435
- **Redis** : localhost:6380

## 🧪 Test Automatisé

Un script de test complet est fourni :

```bash
./test-docker-install.sh
```

Ce script :
- ✅ Démarre tous les services
- ✅ Teste les endpoints API
- ✅ Crée une investigation test
- ✅ Valide l'orchestrateur OSINT
- ✅ Vérifie la connectivité complète

## 🎯 Fonctionnalités Automatisées

### 🔧 Configuration Automatique
- **Base de données** : Création automatique du schéma Prisma
- **Services OSINT** : Validation de tous les outils (Buster, Mosint, Maigret, PhoneInfoga, SpiderFoot)
- **Permissions** : Gestion automatique des droits d'accès
- **Réseaux** : Configuration Docker networks
- **Nginx** : Reverse proxy avec load balancing

### 📊 Monitoring Intégré
- **Health checks** : Vérification automatique des services
- **Logs structurés** : Logging Winston avec rotation
- **Métriques** : Monitoring des performances
- **Notifications** : WebSocket temps réel

## 🔍 Architecture Complète

```
┌─────────────────────────────────────────────────────────┐
│                    NUMOSINT STACK                       │
├─────────────────────────────────────────────────────────┤
│  Nginx (Port 8081)          │  Interface Utilisateur    │
│  ├─ Frontend (/)            │  └─ React/Next.js         │
│  └─ Backend (/api/)         │                           │
├─────────────────────────────────────────────────────────┤
│  Frontend (Port 3001)       │  Backend (Port 5001)      │
│  - Interface React          │  - API REST                │
│  - 4 vues d'analyse         │  - Orchestrateur OSINT     │
│  - Temps réel               │  - WebSocket               │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL (Port 5435)     │  Redis (Port 6380)        │
│  - Schéma Prisma auto       │  - Sessions                │
│  - Migrations auto          │  - Cache queries           │
├─────────────────────────────────────────────────────────┤
│  Services OSINT             │  Monitoring                │
│  - Buster, Mosint, Maigret  │  - Health checks           │
│  - PhoneInfoga, SpiderFoot  │  - Logs automatiques       │
│  - Orchestration auto       │  - Métriques temps réel    │
└─────────────────────────────────────────────────────────┘
```

## 🎉 Succès !

Si vous voyez ce message après `docker-compose up -d` :
```
✔ Container numosint_postgres  Healthy
✔ Container numosint_redis     Healthy  
✔ Container numosint_backend   Started
✔ Container numosint_frontend  Started
✔ Container numosint_nginx     Started
```

**Votre installation NumOSINT est opérationnelle !**

### 🔗 **Liens Rapides**
- 🌐 **Interface principale** : http://localhost:8081/
- 📊 **API Health** : http://localhost:8081/api/health
- 🔧 **Frontend direct** : http://localhost:3001/
- ⚙️ **Backend direct** : http://localhost:5001/api/health

## 📊 Statut d'Achèvement

**✅ 100% Automatisé et Fonctionnel :**
- [x] Backend API complet
- [x] Frontend React intégré
- [x] Base PostgreSQL avec migrations
- [x] 5 services OSINT opérationnels
- [x] Orchestrateur d'investigations
- [x] Socket.IO temps réel
- [x] Docker multi-services
- [x] Nginx reverse proxy
- [x] Configuration automatique
- [x] Tests automatisés
- [x] Documentation complète

## 🚨 Résolution de Problèmes

### Ports Occupés
```bash
# Vérifier les ports
netstat -tulpn | grep -E ':(5001|3001|8081|5435|6380)'

# Modifier les ports dans docker-compose.yml si nécessaire
```

### Permissions
```bash
# Réinitialiser les permissions
sudo chown -R $USER:$USER logs/ results/
chmod -R 755 logs/ results/
```

### Redémarrage Complet
```bash
docker-compose down -v
docker-compose up -d
```

### Frontend ERR_EMPTY_RESPONSE
Si le frontend ne répond pas :
```bash
docker-compose logs frontend
docker-compose restart frontend
```

## 🎯 Installation Validée

Cette installation a été testée et validée avec :
- ✅ **Docker Desktop** sur Windows/WSL2
- ✅ **Docker Engine** sur Linux
- ✅ **Tous les services** opérationnels
- ✅ **Interface web** fonctionnelle
- ✅ **API complète** validée
- ✅ **Investigations OSINT** testées 