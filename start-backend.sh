#!/bin/bash

set -e

echo "🚀 Démarrage du backend NumOSINT..."

# Fonction de logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Fonction d'erreur
error_exit() {
    log "❌ ERREUR: $1"
    exit 1
}

# Attendre que Postgres soit prêt
log "⏳ Attente de PostgreSQL..."
while ! nc -z postgres 5432; do
  log "Postgres est indisponible - en attente..."
  sleep 1
done
log "✅ PostgreSQL est prêt."

# Vérifier que les variables d'environnement sont définies
log "🔍 Vérification des variables d'environnement..."
if [ -z "$DATABASE_URL" ]; then
    error_exit "DATABASE_URL n'est pas défini"
fi

if [ -z "$REDIS_URL" ]; then
    error_exit "REDIS_URL n'est pas défini"
fi

# Appliquer les migrations de la base de données
log "⏳ Application des migrations de la base de données..."
# Utiliser "migrate deploy" pour les environnements non-interactifs comme Docker
npx prisma migrate deploy || error_exit "Échec de l'application des migrations"

log "✅ Migrations appliquées !"

# Générer le client Prisma
log "🔧 Génération du client Prisma..."
npx prisma generate || error_exit "Échec de la génération du client Prisma"

# Les répertoires sont maintenant créés dans le Dockerfile

# Démarrer le serveur principal
log "🚀 Démarrage du serveur Node.js..."
exec node src/index.js