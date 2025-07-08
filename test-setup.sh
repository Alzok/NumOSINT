#!/bin/bash

echo "🧪 Test de l'installation Turbolehe"
echo "=================================="

# Vérifier que Docker est disponible
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

echo "✅ Docker et Docker Compose disponibles"

# Vérifier la structure des fichiers
echo "📁 Vérification de la structure..."

required_files=(
    "docker-compose.yml"
    "Dockerfile"
    "app.py"
    "turbolehe.py"
    "parse_csv.py"
    "frontend/Dockerfile"
    "frontend/package.json"
    "frontend/src/pages/index.tsx"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file manquant"
    fi
done

# Vérifier les dossiers
required_dirs=(
    "reports"
    "logs" 
    "results"
    "frontend/src"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/"
    else
        echo "❌ $dir/ manquant"
        mkdir -p "$dir"
        echo "  📁 Créé automatiquement"
    fi
done

echo ""
echo "🚀 Prêt pour le lancement !"
echo "Commande : docker-compose up"
echo ""
echo "🌐 URLs après démarrage :"
echo "  - Frontend Next.js: http://localhost:3000"
echo "  - Frontend Legacy:  http://localhost:8080"
echo "  - Backend API:      http://localhost:5000" 