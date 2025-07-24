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
# Utilisation de pg_isready pour une vérification plus fiable
# La variable d'environnement PGPASSWORD est utilisée par pg_isready
export PGPASSWORD=${POSTGRES_PASSWORD:-numosint_password}
while ! pg_isready -h postgres -p 5432 -U ${POSTGRES_USER:-numosint} -d ${POSTGRES_DB:-numosint} -q; do
  log "Postgres est indisponible - en attente..."
  sleep 2
done
unset PGPASSWORD
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

log "🌱 Exécution du seed de la base de données..."
npx prisma db seed || error_exit "Échec de l'exécution du seed"

# Les répertoires sont maintenant créés dans le Dockerfile

# Démarrer le serveur principal
log "🚀 Démarrage du serveur Node.js..."
exec npm start