#!/bin/bash

echo "🔍 VÉRIFICATION FINALE - PROJET TURBOLEHE"
echo "========================================"
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

success_count=0
total_checks=0

check_item() {
    local description="$1"
    local command="$2"
    ((total_checks++))
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "✅ ${GREEN}$description${NC}"
        ((success_count++))
    else
        echo -e "❌ ${RED}$description${NC}"
    fi
}

echo "📋 STRUCTURE DU PROJET"
echo "====================="
check_item "Docker Compose configuré" "[ -f docker-compose.yml ]"
check_item "Dockerfile backend présent" "[ -f Dockerfile ]"
check_item "Dockerfile frontend présent" "[ -f frontend/Dockerfile ]"
check_item "Package.json frontend" "[ -f frontend/package.json ]"
check_item "Configuration Next.js" "[ -f frontend/next.config.js ]"
check_item "Configuration TypeScript" "[ -f frontend/tsconfig.json ]"
check_item "Configuration Tailwind" "[ -f frontend/tailwind.config.js ]"

echo ""
echo "📁 DOSSIERS ET FICHIERS"
echo "======================"
check_item "Dossier reports/" "[ -d reports ]"
check_item "Dossier logs/" "[ -d logs ]"
check_item "Dossier frontend/src/" "[ -d frontend/src ]"
check_item "Composants UI présents" "[ -d frontend/src/components/ui ]"
check_item "Turbolehe.py modifié" "grep -q 'reports_dir' turbolehe.py"
check_item "Parse_csv.py adapté" "grep -q 'reports_dir' parse_csv.py"

echo ""
echo "🎨 COMPOSANTS FRONTEND"
echo "===================="
check_item "Composant Button" "[ -f frontend/src/components/ui/button.tsx ]"
check_item "Composant Card" "[ -f frontend/src/components/ui/card.tsx ]"
check_item "Composant Input" "[ -f frontend/src/components/ui/input.tsx ]"
check_item "Composant Badge" "[ -f frontend/src/components/ui/badge.tsx ]"
check_item "Page principale" "[ -f frontend/src/pages/index.tsx ]"
check_item "SearchForm" "[ -f frontend/src/components/Search/SearchForm.tsx ]"

echo ""
echo "🐳 CONFIGURATION DOCKER"
echo "======================"
check_item "Service frontend configuré" "grep -q 'frontend:' docker-compose.yml"
check_item "Service backend configuré" "grep -q 'backend:' docker-compose.yml"
check_item "Service Redis configuré" "grep -q 'redis:' docker-compose.yml"
check_item "Volume reports configuré" "grep -q './reports:/app/reports' docker-compose.yml"

echo ""
echo "📊 DONNÉES MIGRÉES"
echo "=================="
reports_count=$(ls -1 reports/ 2>/dev/null | wc -l)
csv_count=$(find reports/ -name "*.csv" 2>/dev/null | wc -l)
check_item "Dossiers de rapports présents" "[ $reports_count -gt 0 ]"
check_item "Fichiers CSV migrés" "[ $csv_count -gt 0 ]"
check_item "Data.json généré" "[ -f data.json ]"

echo ""
echo "🛠️ OUTILS ET SCRIPTS"
echo "==================="
check_item "Script de test" "[ -f test-setup.sh ] && [ -x test-setup.sh ]"
check_item "Script de migration" "[ -f migrate-results.sh ] && [ -x migrate-results.sh ]"
check_item "README à jour" "grep -q 'docker-compose up' README.md"

echo ""
echo "📊 RÉSUMÉ FINAL"
echo "=============="
echo -e "✅ ${GREEN}Vérifications réussies: $success_count/$total_checks${NC}"

if [ $success_count -eq $total_checks ]; then
    echo -e "🎉 ${GREEN}PROJET PRÊT !${NC}"
    echo ""
    echo "🚀 Pour démarrer:"
    echo "   docker-compose up"
    echo ""
    echo "🌐 URLs:"
    echo "   - Frontend Next.js: http://localhost:3000"
    echo "   - Frontend Legacy:  http://localhost:8080"
    echo "   - Backend API:      http://localhost:5000"
elif [ $success_count -gt $((total_checks * 80 / 100)) ]; then
    echo -e "⚠️  ${YELLOW}PROJET PRESQUE PRÊT${NC}"
    echo "   Quelques éléments mineurs à finaliser"
else
    echo -e "❌ ${RED}PROJET NÉCESSITE DES CORRECTIONS${NC}"
    echo "   Plusieurs éléments critiques manquent"
fi

echo ""
echo "📈 Statistiques du projet:"
echo "   - Dossiers de rapports: $reports_count"
echo "   - Fichiers CSV: $csv_count"
echo "   - Taille reports/: $(du -sh reports/ 2>/dev/null | cut -f1 || echo '0B')" 