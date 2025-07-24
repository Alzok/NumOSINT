# =================================
# Etape 1: Dépendances
# =================================
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# =================================
# Etape 2: Builder
# =================================
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# =================================
# Etape 3: Production
# =================================
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Créer un utilisateur non-privilégié
RUN addgroup -S app && adduser -S -G app app

# Copier les fichiers de build depuis l'étape builder
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/.next ./.next
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/package.json ./package.json

# Le propriétaire est déjà défini avec --chown, plus besoin de cette commande lente
# RUN chown -R app:app /app

# Passer à l'utilisateur non-privilégié
USER app

EXPOSE 3000
ENV PORT 3000

# Démarrer le serveur Next.js en production
CMD ["npm", "start"]