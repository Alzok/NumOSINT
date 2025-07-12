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
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les fichiers de dépendances et installer en tant que root
COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps && npm cache clean --force

# Copier le reste de l'application
COPY . .

# Créer l'utilisateur non-root
RUN groupadd --gid 1001 app && \
    useradd --uid 1001 --gid app --shell /bin/bash --create-home app

# Installer les outils Go et Python
RUN apt-get update && apt-get install -y golang && rm -rf /var/lib/apt/lists/*
COPY tools/wau/install.sh /usr/local/bin/install-wau.sh
RUN chmod +x /usr/local/bin/install-wau.sh && /usr/local/bin/install-wau.sh
COPY tools/waybulk /app/tools/waybulk
RUN chmod +x /app/tools/waybulk/install.sh && /app/tools/waybulk/install.sh
RUN apt-get purge -y --auto-remove golang

# Générer le client Prisma
RUN npx prisma generate

# Changer les permissions pour l'utilisateur non-root
RUN chown -R app:app /app

# Changer vers l'utilisateur non-root
USER app

# Exposer le port
EXPOSE 5001

# Script de démarrage
CMD ["./start-backend.sh"]