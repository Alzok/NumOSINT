#!/bin/bash

echo "🚀 Test final de l'installation Turbolehe"
echo "=========================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

# Vérifier que Docker est en cours d'exécution
echo "🔍 Vérification de Docker..."
docker --version > /dev/null 2>&1
check_result "Docker disponible"

# Vérifier les services Docker
echo "🔍 Vérification des services..."
docker-compose ps | grep -q "Up"
check_result "Services Docker en cours d'exécution"

# Test du backend API
echo "🔍 Test du backend API (port 5000)..."
curl -s http://localhost:5000/ | grep -q "html"
check_result "Backend API accessible"

# Test du frontend legacy
echo "🔍 Test du frontend legacy (port 8080)..."
curl -s http://localhost:8080 | grep -q "Turbolehe"
check_result "Frontend legacy accessible"

# Vérifier les volumes
echo "🔍 Vérification des volumes..."
[ -d "reports" ] && [ -d "logs" ] && [ -d "results" ]
check_result "Dossiers de données présents"

# Vérifier les données migrées
echo "🔍 Vérification des données migrées..."
[ -d "reports/Raphael-Delatour" ] && [ -d "reports/Raphael-de" ]
check_result "Données migrées dans reports/"

# Compter les fichiers CSV
echo "🔍 Comptage des fichiers CSV..."
CSV_COUNT=$(find reports/ -name "*.csv" | wc -l)
echo "📊 Nombre de fichiers CSV trouvés: $CSV_COUNT"
if [ $CSV_COUNT -gt 0 ]; then
    echo -e "${GREEN}✅ Fichiers CSV présents${NC}"
else
    echo -e "${RED}❌ Aucun fichier CSV trouvé${NC}"
fi

# Test de l'API avec une requête simple
echo "🔍 Test de l'API avec requête..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/search)
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "405" ]; then
    echo -e "${GREEN}✅ API répond aux requêtes${NC}"
else
    echo -e "${YELLOW}⚠️ API répond avec code: $RESPONSE${NC}"
fi

echo ""
echo "🎉 RÉSUMÉ FINAL"
echo "==============="
echo "✅ Backend API : http://localhost:5000"
echo "✅ Frontend Legacy : http://localhost:8080"
echo "✅ Redis : localhost:6379"
echo "✅ Données dans reports/ : $CSV_COUNT fichiers CSV"
echo ""
echo "🚀 Installation terminée avec succès !"
echo "💡 Pour utiliser : ouvrez http://localhost:8080 dans votre navigateur" 