#!/bin/bash

echo "🚀 Initialisation du frontend Turbolehe Next.js..."

# Créer les répertoires nécessaires
mkdir -p /app/public /app/src/{components,hooks,lib,types,styles,pages}

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Construire l'application si nécessaire
if [ ! -d ".next" ]; then
    echo "🔨 Construction de l'application..."
    npm run build
fi

echo "✅ Initialisation terminée!"

# Démarrer l'application
echo "🚀 Démarrage de l'application..."
npm start 