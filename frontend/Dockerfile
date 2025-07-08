# Dockerfile pour l'application Next.js
FROM node:18-alpine

# Installer les dépendances système nécessaires
RUN apk add --no-cache libc6-compat bash

WORKDIR /app

# Variables d'environnement
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copier et installer les dépendances
COPY package.json package-lock.json* ./
RUN npm install

# Copier les fichiers de configuration
COPY next.config.js ./
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY components.json ./

# Copier le code source
COPY src ./src
COPY public ./public

# Exposer le port
EXPOSE 3000

# Démarrer en mode développement
CMD ["npm", "run", "dev"] 