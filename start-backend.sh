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
npx prisma migrate dev --name init || error_exit "Échec de l'application des migrations Prisma."

log "✅ PostgreSQL est prêt et le schéma est synchronisé!"

# Générer le client Prisma
log "🔧 Génération du client Prisma..."
npx prisma generate || error_exit "Échec de la génération du client Prisma"

# Créer les répertoires nécessaires
log "📁 Création des répertoires..."
mkdir -p /app/logs /app/results

# Démarrer le serveur principal
log "🚀 Démarrage du serveur Node.js..."
exec node src/index.js 