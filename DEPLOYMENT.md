# Guide de Déploiement de NumOSINT

Ce guide fournit les instructions pour déployer l'application NumOSINT en utilisant Docker et Docker Compose.

## Prérequis

Avant de commencer, assurez-vous d'avoir les outils suivants installés sur votre machine :

-   [Docker](https://docs.docker.com/get-docker/)
-   [Docker Compose](https://docs.docker.com/compose/install/)
-   [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

## 1. Configuration de l'Environnement

### a. Cloner le Dépôt

Clonez le projet depuis son dépôt Git :

```bash
git clone https://github.com/user/numosint.git
cd numosint
```

### b. Créer le Fichier d'Environnement

Copiez le fichier d'exemple `.env.example` pour créer votre propre fichier de configuration `.env`.

```bash
cp .env.example .env
```

### c. Configurer les Variables d'Environnement

Ouvrez le fichier `.env` et modifiez les variables si nécessaire. La configuration par défaut est conçue pour fonctionner localement avec Docker.

La variable la plus importante à configurer pour un usage complet est `PDL_API_KEY` si vous souhaitez utiliser l'outil qui en dépend.

```dotenv
# .env

# Configuration de la base de données PostgreSQL
POSTGRES_DB=numosint
POSTGRES_USER=numosint
POSTGRES_PASSWORD=numosint_password

# URL de connexion pour Docker (ne pas changer pour un déploiement standard)
DATABASE_URL=postgresql://numosint:numosint_password@postgres:5432/numosint

# Configuration Redis (ne pas changer pour un déploiement standard)
REDIS_URL=redis://redis:6379

# Clés d'API externes
PDL_API_KEY=VOTRE_CLE_API_PDL_ICI

# ... autres variables ...
```

## 2. Déploiement de l'Application

Une fois la configuration terminée, vous pouvez lancer l'ensemble de l'application avec une seule commande Docker Compose.

### a. Construire et Démarrer les Conteneurs

Cette commande va construire les images Docker pour chaque service (si elles n'existent pas déjà) et démarrer tous les conteneurs en arrière-plan (`-d`).

```bash
docker-compose up -d --build
```

Le premier lancement peut prendre plusieurs minutes, le temps de télécharger les images de base et de construire les services.

### b. Initialiser la Base de Données

Après le premier démarrage, exécutez les migrations de la base de données pour créer les tables nécessaires.

```bash
docker-compose exec backend npm run db:migrate
```

Votre application NumOSINT est maintenant déployée et devrait être accessible.

## 3. Vérification

### a. Vérifier les Conteneurs

Pour vous assurer que tous les services sont en cours d'exécution, utilisez la commande :

```bash
docker-compose ps
```

Vous devriez voir une liste de tous les services (`postgres`, `redis`, `backend`, `frontend`, etc.) avec le statut `Up` ou `running`.

### b. Accéder à l'Application

-   **Frontend :** Ouvrez votre navigateur et allez à [http://localhost:3001](http://localhost:3001)
-   **API Backend :** L'API est accessible sur [http://localhost:5001](http://localhost:5001)
-   **Documentation de l'API (Swagger) :** [http://localhost:5001/api-docs](http://localhost:5001/api-docs)

## 4. Gestion des Services

Voici quelques commandes Docker Compose utiles pour gérer votre déploiement :

-   **Arrêter tous les services :**
    ```bash
    docker-compose down
    ```

-   **Voir les logs d'un service (par exemple, le backend) :**
    ```bash
    docker-compose logs -f backend
    ```

-   **Redémarrer un service spécifique :**
    ```bash
    docker-compose restart backend
    ```

-   **Exécuter une commande dans un conteneur (par exemple, ouvrir un shell dans le backend) :**
    ```bash
    docker-compose exec backend /bin/sh