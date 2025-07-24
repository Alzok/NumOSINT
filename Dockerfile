# =================================
# Etape 1: Builder
# =================================
FROM node:18 as builder

# Installer les dépendances système pour la compilation, avec des tentatives
RUN apt-get update && \
    for i in 1 2 3; do \
      apt-get install -y \
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
        golang \
      && break; \
      echo "apt-get install a échoué, nouvelle tentative dans 5s..." && sleep 5; \
    done && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les fichiers de dépendances et installer toutes les dépendances (y compris dev)
COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install && npm cache clean --force

# Copier le reste de l'application
COPY . .

# L'installation des outils Go est maintenant gérée dans leurs propres services.

# Générer le client Prisma, avec des tentatives
RUN for i in 1 2 3; do \
      npx prisma generate && break; \
      echo "prisma generate a échoué, nouvelle tentative dans 5s..." && sleep 5; \
    done

# =================================
# Etape 2: Production
# =================================
FROM node:18-slim

# Créer un utilisateur et un groupe non-root
RUN addgroup --system app && adduser --system --ingroup app app

# Installer uniquement les dépendances système nécessaires à l'exécution
RUN apt-get update && apt-get install -y \
    curl \
    procps \
    netcat-openbsd \
    openssl \
    ca-certificates \
    python3 \
    python3-pip \
    dos2unix \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les dépendances de production depuis l'étape builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copier le code de l'application
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma/seed.js ./prisma/
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/start-backend.sh .
COPY --from=builder /app/jsrepo.json .

# S'assurer que le script de démarrage a les bonnes permissions et fins de ligne
RUN dos2unix /app/start-backend.sh && chmod +x /app/start-backend.sh

# Les outils ne sont plus copiés dans l'image du backend.

# Créer les répertoires pour les logs, les résultats et les rapports
RUN mkdir -p /app/logs /app/results /app/reports

# Changer les permissions du répertoire de l'application
RUN chown -R app:app /app

# Repasser à l'utilisateur non-root
USER app

# Exposer le port
EXPOSE 5001

# Script de démarrage
CMD ["/app/start-backend.sh"]