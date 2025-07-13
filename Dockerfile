FROM node:18-slim

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    git \
    curl \
    make \
    g++ \
    openssl \
    ca-certificates \
    procps \
    python3 \
    python3-pip \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les fichiers de dépendances et installer
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copier le reste de l'application
COPY . .

# Installer les outils Go et Python
RUN apt-get update && apt-get install -y golang && rm -rf /var/lib/apt/lists/*
COPY tools/wau/install.sh /usr/local/bin/install-wau.sh
RUN chmod +x /usr/local/bin/install-wau.sh && dos2unix /usr/local/bin/install-wau.sh && /usr/local/bin/install-wau.sh
COPY tools/waybulk /app/tools/waybulk
RUN chmod +x /app/tools/waybulk/install.sh && dos2unix /app/tools/waybulk/install.sh && /app/tools/waybulk/install.sh
RUN apt-get purge -y --auto-remove golang

# Générer le client Prisma
RUN npx prisma generate

# Rendre le script de démarrage exécutable
RUN chmod +x start-backend.sh && dos2unix start-backend.sh

# Exposer le port
EXPOSE 5001

# Script de démarrage (sera exécuté en tant que root)
CMD ["./start-backend.sh"]