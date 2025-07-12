# Dockerfile pour l'application Next.js
FROM node:18-alpine

# Installer les dépendances système nécessaires
RUN apk add --no-cache libc6-compat bash

WORKDIR /app

# Variables d'environnement
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copier et installer les dépendances
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copier les fichiers de configuration et le code source
COPY . .

# Exposer le port
EXPOSE 3000

# Démarrer en mode développement
CMD ["npm", "run", "dev", "--", "--port", "3000", "--hostname", "0.0.0.0"] 