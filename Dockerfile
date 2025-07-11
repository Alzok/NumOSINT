FROM node:18-slim

# Installer les dépendances système nécessaires pour Prisma
RUN apt-get update && apt-get install -y \
    git \
    curl \
    make \
    g++ \
    openssl \
    ca-certificates \
    procps \
    # Les dépendances Python et Go sont maintenant dans leurs propres services
    && rm -rf /var/lib/apt/lists/*

# Créer l'utilisateur et les répertoires avec les bonnes permissions
RUN groupadd --gid 1001 app && \
    useradd --uid 1001 --gid app --shell /bin/bash --create-home app

# Définir le répertoire de travail
WORKDIR /app

# Créer les répertoires nécessaires avec les bonnes permissions
RUN mkdir -p /app/logs /app/results /app/prisma && \
    chown -R app:app /app && \
    chmod -R 755 /app

# Copier d'abord les fichiers de configuration pour l'installation
COPY package*.json ./
COPY prisma ./prisma/

# Changer vers l'utilisateur app pour l'installation
USER app

# Installer les dépendances Node.js
RUN npm ci --only=production && \
    npm cache clean --force

# Générer le client Prisma avec les bons binaryTargets
RUN npx prisma generate

# Revenir à root pour copier les fichiers de l'application
USER root

# Copier le reste de l'application
COPY --chown=app:app . .

# Rendre le script de démarrage exécutable
RUN chmod +x start-backend.sh

# Installer wau
COPY tools/wau/install.sh /usr/local/bin/install-wau.sh
RUN chmod +x /usr/local/bin/install-wau.sh
RUN /usr/local/bin/install-wau.sh

# Installer waybulk
COPY tools/waybulk/install.sh /usr/local/bin/install-waybulk.sh
RUN chmod +x /usr/local/bin/install-waybulk.sh
RUN /usr/local/bin/install-waybulk.sh

# S'assurer que tous les fichiers appartiennent à app
RUN chown -R app:app /app && \
    chmod -R 755 /app/logs /app/results

# Changer définitivement vers l'utilisateur non-root
USER app

# Exposer le port
EXPOSE 5001

# Variables d'environnement pour Prisma
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node
ENV PRISMA_QUERY_ENGINE_BINARY=/app/node_modules/.prisma/client/query-engine-debian-openssl-3.0.x

# Script de démarrage amélioré
CMD ["./start-backend.sh"] 