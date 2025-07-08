#!/bin/bash

# Script de configuration automatique pour NumOSINT Next.js
# Usage: ./setup.sh

set -e

echo "🚀 Configuration automatique de NumOSINT Next.js"
echo "================================================"

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker et Docker Compose."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose."
    exit 1
fi

# Créer les répertoires nécessaires
echo "📁 Création des répertoires..."
mkdir -p results logs frontend/src/{components,hooks,lib,types,styles,pages} frontend/public

# Créer les fichiers de configuration manquants
echo "⚙️  Création des fichiers de configuration..."

# Créer le fichier .env pour le frontend
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000
BACKEND_URL=http://backend:5000
NODE_ENV=development
EOF

# Créer le fichier next-env.d.ts
cat > frontend/next-env.d.ts << EOF
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

# Créer le fichier .eslintrc.json
cat > frontend/.eslintrc.json << EOF
{
  "extends": "next/core-web-vitals"
}
EOF

# Créer un favicon simple
cat > frontend/public/favicon.ico << EOF
data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII=
EOF

# Créer le fichier gitignore pour le frontend
cat > frontend/.gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production
.next/
out/
build/

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
EOF

# Créer un README pour le frontend
cat > frontend/README.md << EOF
# NumOSINT Frontend (Next.js)

Application React/Next.js moderne pour NumOSINT.

## Démarrage rapide

\`\`\`bash
# Installer les dépendances
npm install

# Démarrer en développement
npm run dev

# Construire pour la production
npm run build

# Démarrer en production
npm start
\`\`\`

## Technologies utilisées

- Next.js 14
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand
- React Query
- Axios
EOF

# Mettre à jour la configuration Next.js pour le mode standalone
cat > frontend/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://backend:5000/api/:path*',
      },
    ];
  },
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000',
  },
};

module.exports = nextConfig;
EOF

echo "📦 Installation des dépendances..."
cd frontend

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js n'est pas installé. Les dépendances seront installées dans Docker."
else
    echo "📥 Installation des dépendances Node.js..."
    npm install
fi

cd ..

echo "🐳 Construction des images Docker..."
docker-compose build

echo "🔧 Configuration terminée!"
echo ""
echo "🎉 Pour démarrer l'application complète:"
echo "   docker-compose up"
echo ""
echo "📱 Accès aux services:"
echo "   - Frontend Next.js: http://localhost:3000"
echo "   - Frontend Legacy:   http://localhost:8080"
echo "   - Backend API:       http://localhost:5000"
echo "   - Redis:             localhost:6379"
echo ""
echo "🛠️  Pour le développement frontend uniquement:"
echo "   cd frontend && npm run dev"
echo ""
echo "✅ Configuration terminée avec succès!"
EOF 