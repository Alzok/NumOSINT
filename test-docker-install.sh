#!/bin/bash

set -e

echo "🚀 Test d'installation 100% automatisée NumOSINT"
echo "================================================="

# Fonction de logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Fonction de test
test_endpoint() {
    local url=$1
    local expected_status=$2
    local name=$3
    
    log "🧪 Test: $name"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        log "✅ $name: SUCCESS (HTTP $response)"
        return 0
    else
        log "❌ $name: FAILED (HTTP $response, expected $expected_status)"
        return 1
    fi
}

# Fonction de test JSON
test_json_endpoint() {
    local url=$1
    local name=$2
    
    log "🧪 Test JSON: $name"
    
    local response=$(curl -s "$url" 2>/dev/null)
    
    if echo "$response" | grep -q '"status":\|"investigations":\|"message":'; then
        log "✅ $name: SUCCESS (JSON valide)"
        return 0
    else
        log "❌ $name: FAILED (Pas de réponse JSON)"
        return 1
    fi
}

# Étape 1: Installation automatisée
log "📦 Étape 1: Installation automatisée"
log "Commande: docker-compose up -d"
docker-compose up -d

# Attendre le démarrage
log "⏳ Attente du démarrage des services (30 secondes)..."
sleep 30

# Étape 2: Tests des services
log "🔍 Étape 2: Tests des services"

# Test backend health
test_json_endpoint "http://localhost:5001/api/health" "Backend Health"

# Test API investigations
test_json_endpoint "http://localhost:5001/api/investigations" "API Investigations"

# Test nginx
test_endpoint "http://localhost:8081/" "200" "Nginx"

# Étape 3: Test fonctionnel complet
log "🎯 Étape 3: Test fonctionnel complet"

# Créer une investigation
log "📝 Création d'une investigation test..."
investigation_response=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"names":["Test Auto"],"emails":["test@auto.com"],"usernames":["autotest"]}' \
    http://localhost:5001/api/investigations)

if echo "$investigation_response" | grep -q '"id":'; then
    log "✅ Investigation créée avec succès"
    
    # Extraire l'ID de l'investigation
    investigation_id=$(echo "$investigation_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    log "📋 ID de l'investigation: $investigation_id"
    
    # Démarrer l'investigation
    log "🚀 Démarrage de l'investigation..."
    start_response=$(curl -s -X POST "http://localhost:5001/api/investigations/$investigation_id/start")
    
    if echo "$start_response" | grep -q '"message":'; then
        log "✅ Investigation démarrée avec succès"
        
        # Attendre et vérifier le statut
        log "⏳ Vérification du statut (5 secondes)..."
        sleep 5
        
        status_response=$(curl -s "http://localhost:5001/api/investigations/$investigation_id")
        if echo "$status_response" | grep -q '"status":'; then
            log "✅ Investigation en cours d'exécution"
        else
            log "❌ Erreur lors de la vérification du statut"
        fi
        
    else
        log "❌ Erreur lors du démarrage de l'investigation"
    fi
else
    log "❌ Erreur lors de la création de l'investigation"
fi

# Étape 4: Résumé
log "📊 Étape 4: Résumé de l'installation"
log "===================================="

# Vérifier les conteneurs
log "🐳 Statut des conteneurs:"
docker-compose ps

# Vérifier les ports
log "🔌 Services disponibles:"
log "  - Backend API: http://localhost:5001/api/health"
log "  - Frontend: http://localhost:3001/ (Next.js)"
log "  - Nginx: http://localhost:8081/ (Reverse proxy)"
log "  - PostgreSQL: localhost:5435"
log "  - Redis: localhost:6380"

# Vérifier les logs récents
log "📋 Logs récents du backend:"
docker-compose logs backend --tail=5

log "🎉 Installation 100% automatisée terminée!"
log "💡 Utilisez 'docker-compose logs [service]' pour voir les logs détaillés" 