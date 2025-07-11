# 🚀 NumOSINT - Plateforme d'Investigation Numérique Unifiée

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/your-repo/your-workflow.yml?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/your-repo/your-branch?style=for-the-badge)
![GitHub contributors](https://img.shields.io/github/contributors/your-repo?style=for-the-badge)
![License](https://img.shields.io/github/license/your-repo?style=for-the-badge)

**NumOSINT est une solution open-source complète conçue pour les professionnels de la cybersécurité, les analystes du renseignement et les enquêteurs numériques. Notre mission est de simplifier et d'accélérer le processus d'Open Source Intelligence (OSINT) en unifiant plusieurs outils de pointe au sein d'une interface unique, intuitive et puissante.**

Le projet intègre un orchestrateur intelligent qui automatise la collecte et la corrélation de données à partir de diverses sources, permettant aux utilisateurs de transformer des informations brutes en renseignements exploitables. Avec son architecture moderne et modulaire, NumOSINT est conçu pour être à la fois performant, extensible et facile à déployer.

**Plateforme OSINT moderne avec orchestrateur multi-outils, interface React/Next.js et backend Node.js/PostgreSQL.**

## 🎯 Vue d'Ensemble

NumOSINT est une plateforme d'investigation numérique qui unifie plusieurs outils OSINT spécialisés dans un flux de travail automatisé et intelligent.

- **🔍 Buster** : Génération d'e-mails et recherche "Reverse Whois".
- **📧 Mosint** : Analyse d'e-mails, recherche de fuites de données et de liens Google.
- **👤 Maigret** : Recherche de profils sur plus de 400 plateformes.
- **📱 PhoneInfoga** : Analyse de numéros de téléphone.
- **🕷️ SpiderFoot** : Scan OSINT exhaustif et génération de graphes de corrélation.
- **🛡️ nitefood/asn** : Enrichissement d'adresses IP (ASN, géolocalisation).
- **🤵 peopledatalabs** : Enrichissement avancé de profils de personnes.
- **🔎 wau** : Validation d'adresses e-mail.
- **🌐 waybulk** : Recherche d'URLs archivées via la Wayback Machine.

## 📖 Glossaire des Concepts Clés

-   **Investigation** : Le conteneur global pour une session d'enquête.
-   **Indicateur** : Une pièce d'information atomique (email, IP, etc.) qui sert de point de départ ou de résultat d'une analyse.
-   **Résultat** : Les données brutes retournées par un outil après l'analyse d'un indicateur.
-   **Génération** : Le "niveau de profondeur" d'un indicateur. Les indicateurs initiaux sont de génération 0. Ceux découverts à partir d'eux sont de génération 1, et ainsi de suite. Permet de contrôler la portée des investigations.
-   **Confiance** : Un score de 0 à 1 indiquant la fiabilité estimée d'un indicateur.

## 🏗️ Architecture et Contexte pour l'IA

Cette section fournit un résumé complet de l'architecture de NumOSINT, conçu pour donner un contexte technique détaillé à une intelligence artificielle pour la maintenance et le développement futur.

### 1. Diagramme d'Architecture Globale

Le diagramme ci-dessous illustre l'interaction entre les différents composants du système. Il met en évidence la distinction entre les outils OSINT déployés comme des microservices Docker indépendants et ceux installés comme des binaires directement dans le conteneur du backend.

```mermaid
graph TD
    subgraph "User Interface"
        Frontend[Next.js UI]
    end

    subgraph "Core Services"
        Backend(Node.js Backend)
        Postgres[(PostgreSQL DB)]
        Redis[(Redis Cache)]
    end

    subgraph "OSINT Microservices (Docker)"
        Maigret[Maigret Service]
        Buster[Buster Service]
        Mosint[Mosint Service]
        PhoneInfoga[PhoneInfoga Service]
        ASN[ASN Service]
        SpiderFoot[SpiderFoot Service]
    end

    subgraph "Local Binaries (in Backend Container)"
        Wau(wau binary)
        Waybulk(waybulk binary)
    end

    Frontend -- API Calls / WebSocket --> Backend
    Backend -- CRUD --> Postgres
    Backend -- Cache / Jobs --> Redis

    Backend -- HTTP Requests --> Maigret
    Backend -- HTTP Requests --> Buster
    Backend -- HTTP Requests --> Mosint
    Backend -- HTTP Requests --> PhoneInfoga
    Backend -- HTTP Requests --> ASN
    Backend -- HTTP Requests --> SpiderFoot

    Backend -- child_process.exec() --> Wau
    Backend -- child_process.exec() --> Waybulk
```

### 2. Description des Composants

-   **Frontend** : Une application web moderne construite avec **Next.js** et **TypeScript**. Elle communique avec le backend via une API REST et des WebSockets pour les mises à jour en temps réel.
-   **Backend** : Le cœur de l'application, construit avec **Node.js** et **Express**. Il gère la logique métier, l'orchestration des outils OSINT, et expose l'API. Il utilise **Prisma** comme ORM pour interagir avec la base de données.
-   **PostgreSQL** : La base de données relationnelle qui stocke toutes les données persistantes : investigations, indicateurs, résultats, logs, etc. Le schéma est défini dans [`prisma/schema.prisma`](prisma/schema.prisma).
-   **Redis** : Utilisé comme cache pour les données fréquemment consultées et potentiellement pour la gestion des files d'attente de jobs à l'avenir.
-   **Nginx** : Agit comme un reverse proxy pour le frontend et le backend.

### 3. Intégration des Outils OSINT

L'intégration des outils est hybride, choisissant la meilleure approche pour chaque outil :

| Outil | Rôle | Méthode d'Intégration | Service Node.js |
| :--- | :--- | :--- | :--- |
| Maigret | Recherche de profils | Microservice Docker | `MaigretService` |
| Buster | Génération email/whois | Microservice Docker | `BusterService` |
| Mosint | Analyse email | Microservice Docker | `MosintService` |
| PhoneInfoga | Analyse téléphone | Microservice Docker | `PhoneInfogaService` |
| nitefood/asn | Enrichissement IP | Microservice Docker | `AsnService` |
| SpiderFoot | Scan OSINT exhaustif | Microservice Docker | `SpiderFootService` |
| PDL | Enrichissement de profils | API Externe | `PdlService` |
| **wau** | **Validation email** | **Binaire local** | `WauService` |
| **waybulk** | **Archives web** | **Binaire local** | `WaybulkService` |

### 4. Flux de Données d'une Investigation

1.  **Création** : L'utilisateur soumet des indicateurs initiaux (ex: email, pseudo) via le Frontend.
2.  **Initialisation** : Le Backend crée une nouvelle `Investigation` dans la base de données et initialise l'**Orchestrateur** (`OrchestratorService`).
3.  **Phase d'Enrichissement** :
    *   L'Orchestrateur prend les indicateurs non traités un par un.
    *   Pour chaque indicateur, il sélectionne l'outil approprié (ex: `Mosint` pour un `EMAIL`).
    *   Il appelle le service correspondant (ex: `MosintService`), qui communique avec le microservice ou exécute le binaire local.
    *   Les résultats obtenus (nouveaux indicateurs) sont stockés en base avec une `generation` incrémentée.
    *   Le processus se répète jusqu'à ce qu'il n'y ait plus d'indicateurs à enrichir dans la limite de `maxGeneration`.
4.  **Phase de Scanning** :
    *   L'Orchestrateur lance un scan `SpiderFoot` avec tous les indicateurs pertinents collectés. C'est un scan long et asynchrone.
5.  **Phase de Consolidation** :
    *   Une fois le scan terminé, l'Orchestrateur regroupe tous les `Result` de l'investigation.
    *   Il génère un `finalReport` au format JSON et met à jour le statut de l'investigation à `COMPLETED`.
6.  **Notification** : Le Frontend est notifié à chaque étape via WebSocket.

### 5. Modèle de Données (`prisma/schema.prisma`)

-   **`Investigation`**: L'entité centrale. Contient le statut, la progression, et les relations avec les autres modèles.
-   **`Indicator`**: Un élément de donnée à investiguer (ex: un email, une IP). Possède un `type`, une `value`, et une `generation` pour suivre sa provenance.
-   **`Result`**: Le produit d'une analyse d'un outil sur un indicateur. Contient les données brutes au format `Json`.
-   **`InvestigationLog`**: Enregistre chaque étape du processus pour le logging et le debug.

## 🛠️ Configuration Avancée

Le fichier `.env` à la racine du projet centralise la configuration.

### Variables Requises
- `DATABASE_URL`: L'URL de connexion à la base de données PostgreSQL.
  - Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
- `REDIS_URL`: L'URL de connexion au serveur Redis.
  - Format: `redis://HOST:PORT`

### Variables Optionnelles pour les Outils
Certains outils nécessitent des clés API pour fonctionner. Si une clé n'est pas fournie, l'outil concerné sera simplement désactivé par l'orchestrateur.

- `PDL_API_KEY`: Votre clé API pour le service People Data Labs.
- `SPIDERFOOT_USERNAME` / `SPIDERFOOT_PASSWORD`: Identifiants pour l'API de SpiderFoot si vous l'avez sécurisée.

## 🤝 Guide du Contributeur : Ajouter un Nouvel Outil OSINT

NumOSINT est conçu pour être extensible. Voici comment ajouter votre propre outil.

### Étape 1 : Choisir la Méthode d'Intégration

1.  **Microservice Docker (Recommandé pour la complexité)**:
    -   **Quand ?** Pour les outils avec des dépendances complexes, écrits dans d'autres langages (Python, Go), ou qui sont des applications web complètes (comme SpiderFoot).
    -   **Comment ?** Vous créez un `Dockerfile` pour votre outil dans le dossier `tools/`, qui expose une simple API HTTP que le backend Node.js peut appeler.

2.  **Binaire Local (Recommandé pour la simplicité)**:
    -   **Quand ?** Pour les outils autonomes en ligne de commande, souvent écrits en Go ou Rust, qui n'ont pas de dépendances lourdes.
    -   **Comment ?** Vous écrivez un script `install.sh` qui télécharge ou compile le binaire, et vous modifiez le `Dockerfile` principal pour exécuter ce script.

### Étape 2 : Créer le Service Node.js

Créez un nouveau fichier dans `src/services/tools/`, par exemple `myNewTool.js`. Ce fichier doit contenir une classe qui gère la logique de l'outil.

```javascript
class MyNewToolService {
  constructor(prisma) {
    this.prisma = prisma;
    this.toolName = 'myNewTool';
  }

  async analyze(investigationId, indicator) {
    // 1. Appeler le microservice ou exécuter le binaire
    const rawData = await this.callTool(indicator.value);

    // 2. Parser les résultats
    const { newIndicators, results } = this.parseOutput(rawData);

    // 3. Sauvegarder les résultats en base
    if (results) {
      await this.prisma.result.create({
        data: {
          investigationId,
          indicatorId: indicator.id,
          toolSource: this.toolName,
          data: results,
        },
      });
    }

    // 4. Créer les nouveaux indicateurs découverts
    if (newIndicators && newIndicators.length > 0) {
      await this.prisma.indicator.createMany({
        data: newIndicators.map(ind => ({ ...ind, investigationId })),
        skipDuplicates: true,
      });
    }
  }
}
```

### Étape 3 : Intégrer dans l'Orchestrateur

Modifiez `src/services/orchestrator.js`:
1.  **Importez et instanciez** votre nouveau service dans le constructeur.
2.  **Appelez votre service** dans la méthode d'enrichissement appropriée (ex: `_enrichEmail`, `_enrichDomain`, etc.) à l'intérieur d'un `_runToolWithRetry`.

### Étape 4 : Mettre à jour la Configuration

-   **Si Microservice** : Ajoutez la définition de votre service dans `docker-compose.yml`.
-   **Si Binaire Local** : Ajoutez l'exécution de votre `install.sh` dans le `Dockerfile` principal.

### Étape 5 : Mettre à jour la Documentation

Ajoutez une ligne pour votre nouvel outil dans le tableau "Intégration des Outils OSINT" de ce `README.md`.

## 📊 Fonctionnalités Actuelles

### ✅ Fonctionnel
- **7 services OSINT** intégrés et opérationnels.
- **Orchestrateur de workflow dynamique** qui sélectionne les outils en fonction des données d'entrée et des résultats intermédiaires.
- **Interface React** moderne et responsive avec des vues spécialisées par type de données.
- **API REST** complète.
- **Base PostgreSQL** avec schéma optimisé.
- **WebSocket** pour le suivi des investigations en temps réel.
- **Docker** multi-services stable pour un déploiement facile.

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
