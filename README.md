# 🚀 NumOSINT - Plateforme d'Investigation Numérique Unifiée

<div align="center">
  
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

</div>

**NumOSINT est une solution open-source complète conçue pour les professionnels de la cybersécurité, les analystes du renseignement et les enquêteurs numériques. Notre mission est de simplifier et d'accélérer le processus d'Open Source Intelligence (OSINT) en unifiant plusieurs outils de pointe au sein d'une interface unique, intuitive et puissante.**

Le projet intègre un orchestrateur intelligent qui automatise la collecte et la corrélation de données à partir de diverses sources, permettant aux utilisateurs de transformer des informations brutes en renseignements exploitables. Avec son architecture moderne et modulaire, NumOSINT est conçu pour être à la fois performant, extensible et facile à déployer.

---

## 🛠️ Services OSINT Intégrés

<table>
<tr>
<td width="33%">

### 🔍 Buster
**Génération d'e-mails et recherche Reverse Whois**

Découverte d'adresses e-mail à partir de domaines et recherche inversée de propriétaires de domaines.

`📧 Email Discovery` `🌐 Whois` `🐳 Microservice`

</td>
<td width="33%">

### 📧 Mosint
**Analyse d'e-mails et recherche de fuites**

Analyse complète d'adresses e-mail, recherche de fuites de données et de liens Google.

`🔬 Email Analysis` `⚠️ Breach Check` `🐳 Microservice`

</td>
<td width="33%">

### 👤 Maigret
**Recherche de profils sur 400+ plateformes**

Recherche exhaustive de profils utilisateur à travers plus de 400 plateformes sociales.

`📱 Social Media` `🔍 Username Search` `🐳 Microservice`

</td>
</tr>
<tr>
<td width="33%">

### 📱 PhoneInfoga
**Analyse de numéros de téléphone**

Analyse complète de numéros de téléphone : localisation, opérateur, et recherche de fuites.

`📞 Phone Analysis` `📍 Geolocation` `🐳 Microservice`

</td>
<td width="33%">

### 🕷️ SpiderFoot
**Scan OSINT exhaustif et graphes**

Framework complet d'automatisation OSINT avec génération de graphes de corrélation.

`📊 Comprehensive` `🔗 Correlation` `🐳 Microservice`

</td>
<td width="33%">

### 🛡️ ASN Lookup
**Enrichissement d'adresses IP**

Enrichissement d'adresses IP avec informations ASN, géolocalisation et fournisseur.

`🌐 IP Analysis` `📊 ASN Info` `🐳 Microservice`

</td>
</tr>
<tr>
<td width="33%">

### 🤵 People Data Labs
**Enrichissement avancé de profils**

API premium pour l'enrichissement de données personnelles et professionnelles.

`👤 People Search` `⭐ Premium API` `🌐 External Service`

</td>
<td width="33%">

### 🔎 WAU
**Validation d'adresses e-mail**

Validation rapide et efficace de la validité des adresses e-mail.

`✅ Email Validation` `⚡ Fast Processing` `💻 Local Binary`

</td>
<td width="33%">

### 🌐 Waybulk
**Recherche d'URLs archivées**

Recherche d'URLs archivées via la Wayback Machine pour l'analyse historique.

`📚 Web Archive` `📅 Historical Data` `💻 Local Binary`

</td>
</tr>
</table>

---

## 🚀 Installation Rapide

> ⚡ **Démarrage en 3 étapes simples**

| Étape | Action | Commande |
|-------|--------|----------|
| **1️⃣** | **Cloner le projet** | `git clone https://github.com/votre-repo/numosint.git`<br>`cd numosint` |
| **2️⃣** | **Configurer l'environnement** | `touch .env` |
| **3️⃣** | **Démarrer l'application** | `docker-compose up` |

### 🔧 Configuration minimale du fichier `.env`

```env
# Configuration minimale
DATABASE_URL=postgresql://numosint:numosint_password@postgres:5432/numosint
REDIS_URL=redis://redis:6379

# Clé API People Data Labs (optionnelle mais recommandée)
PDL_API_KEY=votre_clé_api_pdl_ici
```

### 🎯 Accès à l'application

Une fois démarré, l'application sera disponible sur : **http://localhost:3001**

## 📖 Glossaire des Concepts Clés

-   **Investigation** : Le conteneur global pour une session d'enquête.
-   **Indicateur** : Une pièce d'information atomique (email, IP, etc.) qui sert de point de départ ou de résultat d'une analyse.
-   **Résultat** : Les données brutes retournées par un outil après l'analyse d'un indicateur.
-   **Génération** : Le "niveau de profondeur" d'un indicateur. Les indicateurs initiaux sont de génération 0. Ceux découverts à partir d'eux sont de génération 1, et ainsi de suite. Permet de contrôler la portée des investigations.
-   **Confiance** : Un score de 0 à 1 indiquant la fiabilité estimée d'un indicateur.

## 🔑 Configuration des Clés API

Plusieurs outils intégrés peuvent utiliser des clés API pour étendre leurs capacités et fournir de meilleurs résultats. Voici comment les configurer :

### 1. Mosint

L'outil `mosint` peut utiliser plusieurs clés API pour enrichir les adresses e-mail. La configuration se fait dans le fichier [`tools/mosint/config.yaml`](tools/mosint/config.yaml).

-   **Clés API générales :** Remplissez les champs `breach_directory_api_key`, `hunter_api_key`, etc., avec vos clés.
-   **Pour IntelX :**
    -   Ajoutez votre clé dans le champ `intelx_api_key`.
    -   Assurez-vous que le champ `intelx_host` correspond à votre type de licence :
        -   Licence gratuite/trial : `https://free.intelx.io`
        -   Licence commerciale : `https://api.intelx.io`

### 2. People Data Labs (PDL)

Ce service est utilisé pour un enrichissement de données de haute qualité.

-   **Fichier de configuration :** [`.env`](.env)
-   **Instructions :** Dans le fichier `.env` à la racine du projet, ajoutez ou modifiez la ligne suivante en remplaçant `VOTRE_CLE_API_PDL_ICI` par votre clé :
    ```env
    PDL_API_KEY=VOTRE_CLE_API_PDL_ICI
    ```

### 3. SpiderFoot

SpiderFoot est un framework d'automatisation OSINT très puissant avec des dizaines de modules configurables.

-   **Fichier de configuration :** [`tools/spiderfoot/config/sfconfig.py`](tools/spiderfoot/config/sfconfig.py)
-   **Instructions :** Modifiez ce fichier pour ajouter les configurations des modules que vous souhaitez utiliser. Le fichier contient un exemple pour vous guider. Vous pouvez trouver la liste complète des modules et de leurs options dans la documentation officielle de SpiderFoot.

---

Après toute modification de configuration :
- **Modifications du fichier `.env`** : Redémarrer simplement avec `docker-compose restart`
- **Modifications de `docker-compose.yml`** ou des fichiers de configuration des outils : Rebuilder avec `docker-compose up -d --build`

---

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
3.  **Phase d'Enrichissement (Workflow Dynamique)** :
    *   **Détermination de la Stratégie :** Au début de cette phase, l'Orchestrateur analyse les indicateurs initiaux (fournis par l'utilisateur) pour définir une **stratégie de workflow**. La priorité est donnée aux indicateurs les plus spécifiques (Email > Téléphone > Domaine > Pseudo > Nom).
    *   **Exécution Ciblée :** L'Orchestrateur parcourt les indicateurs non traités. Pour chacun, il appelle les outils pertinents, mais de manière conditionnelle en fonction de la stratégie.
    *   **Exemple :** Si un `EMAIL` et un `DOMAIN` sont fournis, la stratégie primaire sera "Email". Le workflow d'analyse d'email sera complet. Lorsque l'indicateur de domaine sera traité, seuls les scans les moins coûteux seront lancés, car ce n'est pas la piste principale.
    *   **Génération de Données :** Les nouveaux indicateurs découverts sont stockés en base avec une `generation` incrémentée pour suivre la profondeur de l'enquête.
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

### Exemple de fichier .env
```env
# PostgreSQL Database Configuration
POSTGRES_DB=numosint
POSTGRES_USER=numosint
POSTGRES_PASSWORD=numosint_password

# Database connection URL
DATABASE_URL=postgresql://numosint:numosint_password@postgres:5432/numosint

# Redis Configuration
REDIS_URL=redis://redis:6379

# External API Keys
PDL_API_KEY=votre_clé_api_pdl_ici

# Application Configuration
NODE_ENV=production
PORT=5001
LOG_LEVEL=info

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001
```

> **⚠️ Important :** Assurez-vous d'ajouter votre clé API People Data Labs dans le fichier `.env` avant de démarrer l'application avec `docker-compose up`.

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
