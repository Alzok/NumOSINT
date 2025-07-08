#!/bin/bash

echo "🚀 Démarrage de Turbolehe avec Docker..."

# Créer les répertoires nécessaires
mkdir -p results logs

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null
then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker et Docker Compose."
    exit 1
fi

# Vérifier si docker-compose est installé
if ! command -v docker-compose &> /dev/null
then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose."
    exit 1
fi

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# Construire les images
echo "🔨 Construction des images Docker..."
docker-compose build

# Démarrer les services
echo "🎯 Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 5

# Vérifier l'état des services
docker-compose ps

echo ""
echo "✅ Turbolehe est maintenant accessible !"
echo ""
echo "🌐 Interface web: http://localhost:8080"
echo "🔧 API Backend: http://localhost:5000"
echo ""
echo "📝 Pour voir les logs: docker-compose logs -f"
echo "🛑 Pour arrêter: docker-compose down"
echo "" 