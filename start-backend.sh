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

# Attendre que PostgreSQL soit prêt
log "⏳ Attente de PostgreSQL..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
    log "PostgreSQL n'est pas encore prêt, nouvelle tentative dans 2 secondes..."
    sleep 2
done

log "✅ PostgreSQL est prêt et le schéma est synchronisé!"

# Générer le client Prisma
log "🔧 Génération du client Prisma..."
npx prisma generate || error_exit "Échec de la génération du client Prisma"

# Créer les répertoires nécessaires
log "📁 Création des répertoires..."
mkdir -p /app/logs /app/results

# Vérifier que le serveur peut démarrer
log "🧪 Test de démarrage..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Connexion Prisma réussie');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion Prisma:', err);
    process.exit(1);
  });
" || error_exit "Échec du test de connexion Prisma"

# Démarrer le serveur principal
log "🚀 Démarrage du serveur Node.js..."
exec node src/index.js 