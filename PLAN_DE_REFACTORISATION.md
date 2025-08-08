# Plan de Refactorisation de l'Application

## 🧭 Ordre d’exécution recommandé (critique pour la stabilité)
1. Variables d’environnement & bootstrap (Redis, JWT, NextAuth, services outils) + .env.example
2. Alignement Prisma ⇄ code (Results/Indicators) + migrations + régénération client
3. Orchestrateur (imports manquants, phases, compteurs, robustesse microservices)
4. Base des services outils (contrats d’API, gestion des erreurs, enregistrements DB)
5. API contracts côté backend (validation Zod, erreurs normalisées)
6. Frontend API/WS (URL unifiées, session/401, NextAuth)
7. WebSockets (auth, rooms, fix d’API d’émission)
8. Puppeteer/Chromium (PDF) et Nginx/Helmet (CSP unifiée)
9. Protection sécurité (rate-limits auth, journaux, CORS dynamique)
10. Tests (unit/int/ e2e) sur le flux investigation complet

---

## 📌 Backlog priorisé (P1 d’abord)

- **[P1 | Config & Bootstrap]** Redis URL manquante/mismatch; seed superadmin bloquant; secrets JWT/NextAuth; URLs microservices (pas de `localhost` en Docker); image prod sans dev-deps/nodemon.
  - Fichiers: `docker-compose.yml`, `src/utils/redis.js`, `start-backend.sh`, `prisma/seed.js`, `src/routes/auth.js`, `frontend/src/pages/api/auth/[...nextauth].ts`, `src/services/tools/*`, `Dockerfile`.

- **[P1 | Modèle de données & Prisma]** Écritures hors schéma (`rawData`, `sourceTool`, `parentId`); filtres relationnels Prisma incorrects; recherche JSON invalide; normalisation `confidence` (0–1); coût: ignorer `userId` du body.
  - Fichiers: `src/services/tools/BaseToolService.js`, `prisma/schema.prisma`, `src/routes/results.js`, `src/routes/statistics.js`, `src/routes/investigations.js` (search & cost), services outils.

- **[P1 | Orchestrateur & Phases]** Import `ApiError` manquant; compteurs/flags d’enrichissement; démarrage concurrent `/:id/start`; quotas/concurrence globale.
  - Fichiers: `src/services/orchestrator.js`, `src/services/phases/EnrichmentPhaseManager.js`, `src/routes/investigations.js`.

- **[P1 | API Correctness & AuthZ]** Export PDF sans vérification du propriétaire; `/results/recent` non filtré; transactions crédits non atomiques.
  - Fichiers: `src/routes/reports.js`, `src/routes/results.js`, `src/services/orchestrator.js` (`finalizeInvestigation`).

- **[P1 | Intégrations Outillage]** Robustesse aux pannes (retries/backoff/skip); tokens internes inter-services; binaires présents/pinnés.
  - Fichiers: `src/services/tools/*`, `tools/*/server.*`, `docker-compose.yml` (env, build), configuration d’un header interne commun.

- **[P1 | Frontend API/WS & Nginx]** Base URL API relative; WS via `window.location.origin`; Nginx routes `/api` et `/socket.io`.
  - Fichiers: `frontend/src/lib/api-client.ts`, `frontend/src/lib/socket.ts`, `nginx.conf`.

- **[P1 | Socket.IO]** `emitToOthers` variable hors scope; WS room `join_user` non authentifiée (imposer room depuis JWT).
  - Fichiers: `src/utils/socket.js`.

- **[P1 | PDF]** Chromium manquant et accès à une page protégée (PDF du login au lieu du rapport).
  - Fichiers: `Dockerfile`, `src/services/reportService.js`, `frontend/src/middleware.ts` (créer route SSR PDF interne signée ou token courte durée).

- **[P2 | Sécurité Prod]** CSP unifiée stricte; HSTS seulement en HTTPS; Swagger protégé/masqué en prod; logs PII masqués; CORS dynamique whitelist; CORS/CSP pour WS.
  - Fichiers: `nginx.conf`, `src/index.js` (helmet, swagger), `src/middlewares/errorHandler.js`, config CORS/WS.

- **[P2 | Archi & Perf]** Déduplication listeners Socket.IO; graphe déterministe; PDF asynchrone + cache; rate limiting Redis distribué; cache ciblé stats; observabilité (Prometheus/Sentry); circuit breaker.
  - Fichiers: `src/services/orchestrator.js`, `src/utils/socket.js`, `src/routes/investigations.js` (`/graph`), `src/services/reportService.js`, `src/middlewares/rateLimiter.js`, `src/routes/statistics.js`.

- **[P2 | Métier & Qualité]** Modèle de coût issu de `workflow.json`; dédoublonnage `Result` via hash; nettoyage deps backend; scripts de migration documentés; validations Zod manquantes sur endpoints.
  - Fichiers: `src/config/workflow.json`, `src/services/orchestrator.js`, `src/services/tools/*`, `package.json`, `migrate-to-postgres.js`, `src/routes/*`, `src/middlewares/validate.js`.

- **[Tests]** Contrats microservices (parsers buster/wau/spiderfoot); Prisma sur DB réelle (relations/JSON); E2E robustes (pannes outils, crédits insuffisants, exports).
  - Dossiers: `tests/services/tools/*.test.js`, `tests/integration/*.test.js`, `tests/e2e/full-flow.spec.js`.

---

## 🐛 Bugs Critiques
- [ ] **[P1]** Redis mal configuré (plantage démarrage / connexions runtime)
  - **Localisation :** `start-backend.sh` (vérification des variables d’environnement), `src/utils/redis.js` (initialisation du client Redis), `docker-compose.yml` (service `backend` — variables env)
  - **Étapes :**
    - Ajouter `REDIS_URL=redis://redis:6379` au service `backend` dans `docker-compose.yml` (et `.env.example`).
    - Dans `src/utils/redis.js`, construire l’URL depuis `REDIS_URL` sinon fallback `redis://${process.env.REDIS_HOST||'localhost'}:${process.env.REDIS_PORT||6379}`.
    - Dans `start-backend.sh`, remplacer l’échec dur quand `REDIS_URL` manquant par un log + tentative de déduction depuis `REDIS_HOST/PORT` puis retry (exponential backoff x5).
  - **Critères d’acceptation :** le backend démarre et la connexion Redis réussit en local/dans Docker; health `/api/health` → 200 database et Redis healthy.

- [ ] **[P1]** Mismatch Prisma ⇄ code pour `Result`/`Indicator` (écritures invalides)
  - **Localisation :** `src/services/tools/BaseToolService.js` (méthodes `_saveResult`, `_saveIndicators`) vs `prisma/schema.prisma` (`Result`, `Indicator`)
  - **Racine :** le code tente de stocker des champs non définis dans le schéma (`rawData`, `sourceTool`, `parentId`).
  - **Décision :** Option A (reco) = aligner le code au schéma actuel pour un hotfix rapide.
  - **Étapes (Option A) :**
    - Supprimer `rawData` dans `_saveResult` et ne persister que `data`.
    - Remplacer `sourceTool` par `source` existant dans `Indicator` (via `data: { source: this.toolName }`) et supprimer `parentId`.
    - Dans tous les services (`mosint`, `maigret`, `phoneinfoga`, `asn`, `waybulk`, `wau`, `spiderfoot`), vérifier les appels `_saveResult/_saveIndicators` pour correspondre au schéma (utiliser `indicatorId` optionnel et `investigationId` requis).
  - **Critères d’acceptation :** aucune erreur Prisma liées aux champs inconnus, création de résultats et indicateurs fonctionnelle pendant une investigation complète.
  - **(Option B)** Étendre le schéma (ajouter `rawData Json?`, `Indicator.parentId String?`, `Indicator.source String?`) + migration. À envisager plus tard si besoin de traçabilité parentale.

- [ ] **[P1]** Crédits décimaux vs colonne Int (décrément invalide)
  - **Localisation :** `prisma/schema.prisma` (`User.credits`), `src/services/orchestrator.js` (calcul coût dans `calculateInvestigationCost`, écriture coût/transaction dans `finalizeInvestigation`)
  - **Étapes (Option A – recommandé pour simplicité) :**
    - Travailler en « centimes de jetons » (entiers). Multiplier tous les coûts par 100 et arrondir (Math.round). Stocker/décrémenter en Int.
    - Exposer côté UI un affichage divisé par 100.
  - **Critères d’acceptation :** aucune erreur Prisma lors du `decrement`, cohérence des soldes après completion/échec.

- [ ] **[P1]** Import manquant `ApiError` (exceptions silencieuses/orphelines)
  - **Localisation :** `src/services/orchestrator.js` (utilisation d’`ApiError` dans la validation des plans et limites)
  - **Étapes :** ajouter `const ApiError = require('../utils/ApiError');` en tête de fichier.
  - **Critères d’acceptation :** erreurs métier remontées en 4xx/5xx cohérents.

- [ ] **[P1]** Bug Socket.IO: `emitToOthers` référence une variable hors scope
  - **Localisation :** `src/utils/socket.js` (objet `io.investigation`, méthode `emitToOthers`)
  - **Étapes :** remplacer par `io.to(investigationId).except(excludeSocketId).emit(event, data)` (v4.5+) ou implémenter une exclusion via rooms.
  - **Critères d’acceptation :** pas d’erreur runtime Socket.IO; événements correctement diffusés.

- [ ] **[P1]** Base URL API/WS incohérente (404/CORS)
  - **Localisation :** `frontend/src/lib/api-client.ts` (const `API_URL`), `frontend/src/lib/socket.ts` (const `URL`), `nginx.conf` (locations `/api/`, `/socket.io/`)
  - **Étapes :**
    - Dans le client, utiliser des chemins relatifs `/api/...` et pour WS `io(window.location.origin, ...)` côté navigateur.
    - Confirmer que Nginx route `location /api/` et `/socket.io/` vers `backend:5001`.
    - Supprimer dépendance à `NEXT_PUBLIC_API_URL` si non requis (ou définir à `http://localhost:8081` en dev proxifié).
  - **Critères d’acceptation :** appels API et WS fonctionnent via Nginx (`http://localhost:8081`).

- [ ] **[P1]** Génération PDF (Chromium manquant)
  - **Localisation :** `Dockerfile` (étapes d’installation), `src/services/reportService.js` (fonction `generatePdfReport`)
  - **Étapes :**
    - Installer `chromium` dans l’image prod et définir `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` ou autoriser le download en builder et copier le binaire.
    - Tester génération d’un PDF sur une investigation existante.
  - **Critères d’acceptation :** endpoint `GET /api/reports/investigation/:id/export?format=pdf` retourne un PDF valide.

- [ ] **[P1]** Phases d’enrichissement non déterministes (compteurs/flags non init.)
  - **Localisation :** `src/services/phases/EnrichmentPhaseManager.js` (méthodes `run`, `handleToolCompletion`, `checkPhaseCompletion`)
  - **Étapes :**
    - Initialiser `activeInvestigations.enrichmentTasks=0` et `isEnrichmentLoopRunning=true` en début de `run()`.
    - Décrémenter de façon atomique à chaque completion; définir `isEnrichmentLoopRunning=false` avant bascule de phase.
    - Gérer le cas « aucun outil applicable » → log + avance vers SCANNING.
  - **Critères d’acceptation :** fin de phase fiable, pas de boucles infinies; progression passe ENRICHING→SCANNING→CONSOLIDATING.

- [ ] **[P1]** JWT/NextAuth secrets & expirations
  - **Localisation :** `src/routes/auth.js` (génération JWT), `docker-compose.yml` (service `frontend` — variables NextAuth)
  - **Étapes :**
    - Forcer une valeur par défaut sécurisée `JWT_EXPIRES_IN=7d` (si absent) côté code ou fail-fast en prod.
    - Ajouter `NEXTAUTH_SECRET` dans `.env`/compose; fail-fast s’il est manquant en prod.
  - **Critères d’acceptation :** login réussi et renouvellement session OK; pas d’avertissement NextAuth.

- [ ] **[P1]** Robustesse microservices outils (erreurs en chaîne lors d’une investigation)
  - **Localisation :** `src/services/orchestrator.js` (méthode `runInvestigationFlow`), `src/services/tools/*` (appels axios et `_handleApiError`)
  - **Étapes :**
    - Avant lancement, vérifier la reachability de chaque service configuré (HEAD/health) et logguer l’état; si down, passer l’outil en « skipped » (log + note dans `investigationLog`) plutôt que d’échouer l’ensemble.
    - Encapsuler toutes les erreurs d’outil via `_handleApiError` et ne jamais faire planter la phase; laisser `_runToolWithRetry` gérer les retries.
  - **Critères d’acceptation :** une investigation ne s’arrête pas si UN outil échoue; logs détaillés; statut final correct.

- [ ] **[P1]** Échec du seed en absence de variables superadmin (bloque le démarrage)
  - **Localisation :** `prisma/seed.js`, `start-backend.sh`
  - **Étapes :** rendre le seed optionnel (dev/CI uniquement) ou idempotent et tolérant à l’absence des variables; conditionner l’exécution via `RUN_DB_SEED=true`.
  - **Critères d’acceptation :** backend démarre sans variables superadmin en prod; seed OK en dev.

- [ ] **[P1]** Bug de transformation WAU (valeur inexistante)
  - **Localisation :** `src/utils/resultTransformer.js` (`transformWau`)
  - **Étapes :** utiliser `result.indicator?.value` (et inclure `indicator` dans les requêtes appelantes) ou fallback sur `result.data.email`.
  - **Critères d’acceptation :** items WAU non vides; affichage correct.

- [ ] **[P1]** Image de prod embarque des dev-deps et `nodemon`
  - **Localisation :** `Dockerfile`, `package.json`
  - **Étapes :** `npm ci --only=production` en prod; `start` → `node src/index.js`.
  - **Critères d’acceptation :** image plus légère; pas de `nodemon` en prod.

- [ ] **[P1]** Script de nettoyage legacy dangereux
  - **Localisation :** `cleanup-legacy.js`
  - **Étapes :** déplacer dans `tools/legacy/`, ajouter confirmation `--force`, exclure fichiers critiques.
  - **Critères d’acceptation :** aucune suppression accidentelle.

- [ ] **[P1]** Concurrence/quotas sur exécutions lourdes
  - **Localisation :** `src/services/orchestrator.js`, `src/services/phases/EnrichmentPhaseManager.js`
  - **Étapes :** contrôle de concurrence (global/par user) + file d’attente; exposer métriques/état.
  - **Critères d’acceptation :** charge maîtrisée; pas de saturation.

- [ ] **[P1]** Mauvais filtrage Prisma sur relations
  - **Localisation :** `src/routes/results.js`, `src/routes/statistics.js`
  - **Étapes :** `where: { investigation: { is: {...} } }`, `indicator: { is: {...} }`; ajouter tests.
  - **Critères d’acceptation :** filtres corrects; pas d’erreurs Prisma.

- [ ] **[P1]** Filtrage JSON Prisma invalide (recherche)
  - **Localisation :** `src/routes/investigations.js`
  - **Étapes :** retirer ce filtre ou matérialiser une table/index dédiée (trigram/GIN) pour recherche textuelle.
  - **Critères d’acceptation :** recherche fonctionnelle et performante.

- [ ] **[P1]** Endpoint de coût: ne pas accepter `userId` du body
  - **Localisation :** `src/routes/investigations.js` (`/cost`)
  - **Étapes :** utiliser `req.user.id` exclusivement.
  - **Critères d’acceptation :** limites/coûts appliqués à l’utilisateur courant.

- [ ] **[P1]** AuthZ export rapports & résultats récents
  - **Localisation :** `src/routes/reports.js`, `src/routes/results.js` (`/recent`)
  - **Étapes :** filtrer par `userId` propriétaire.
  - **Critères d’acceptation :** aucune fuite de données.

- [ ] **[P1]** Atomicité facturation & race démarrage
  - **Localisation :** `src/services/orchestrator.js`, `src/routes/investigations.js`
  - **Étapes :** transaction Prisma + update conditionnel/optimistic locking.
  - **Critères d’acceptation :** pas de double débit; un seul flow lancé.

---

## 🛡️ Failles de Sécurité
- [ ] **[P1]** CSP unifiée et stricte (supprimer `unsafe-inline`)
  - **Localisation :** `nginx.conf` (en-tête `Content-Security-Policy`), `src/index.js` (configuration `helmet` CSP)
  - **Étapes :** définir CSP unique dans Nginx; désactiver `contentSecurityPolicy` de Helmet ou l’aligner. Retirer `'unsafe-inline'` de `script-src`; utiliser `nonce` si nécessaire.
  - **Critères d’acceptation :** pas d’alerte CSP dans le navigateur; UI fonctionne.

- [ ] **[P1]** Rate-limit renforcé sur `/api/auth/login`
  - **Localisation :** `src/middlewares/rateLimiter.js` (créer un limiter spécifique), `src/routes/auth.js` (appliquer le limiter sur les routes d’auth)
  - **Critères d’acceptation :** dépassement limite → 429; autres routes non impactées.

- [ ] **[P2]** CORS dynamique via whitelist
  - **Localisation :** `nginx.conf` (bloc `location /api/` — en-têtes CORS)
  - **Étapes :** injecter dynamiquement l’origin (env whitelist) et renvoyer `Access-Control-Allow-Origin` en conséquence; cible: éviter `*` ou origin figé.
  - **Critères d’acceptation :** préflight OPTIONS ok; pas de fuites cross-origin.

- [ ] **[P2]** Logs: masquer PII
  - **Localisation :** `src/middlewares/errorHandler.js` (logging)
  - **Étapes :** filtrer `password`, `token`, secrets des `req.body/query/params` avant log.
  - **Critères d’acceptation :** plus de sensitive data dans les logs d’erreur.

- [ ] **[P2]** HSTS seulement en HTTPS
  - **Localisation :** `nginx.conf`
  - **Étapes :** ne servir `Strict-Transport-Security` qu’en TLS; rediriger 80→443 en prod.
  - **Critères d’acceptation :** conformité HSTS.

- [ ] **[P2]** Swagger contrôlé en prod
  - **Localisation :** `src/index.js`
  - **Étapes :** activer via `ENABLE_SWAGGER=true` et/ou restreindre aux admins.
  - **Critères d’acceptation :** `/api-docs` fermé par défaut.

- [ ] **[P2]** Sécurité WS
  - **Localisation :** `src/index.js` (Server CORS), `nginx.conf`, `src/utils/socket.js`
  - **Étapes :** whitelist origine, aligner CSP `connect-src`, auth WS via middleware.
  - **Critères d’acceptation :** connexions WS sûres.

---

## 📉 Problèmes de Performance
- [ ] **[P2]** `nodemon` seulement en dev
  - **Localisation :** `package.json` (backend — scripts)
  - **Étapes :** `start` → `node src/index.js` en prod; conserver `dev` pour `nodemon`.
  - **Critères d’acceptation :** image prod légère; pas de restart hot en prod.

- [ ] **[P2]** PDF asynchrone + cache
  - **Localisation :** `src/services/reportService.js` (fonction `generatePdfReport`)
  - **Étapes :** basculer la génération en tâche de fond (file de jobs) et stocker en cache disque/objet; endpoint renvoie 202 puis permet le téléchargement.
  - **Critères d’acceptation :** pics CPU réduits; pas de timeouts.

- [ ] **[P2]** Cache HTTP/Redis ciblé
  - **Localisation :** `src/middlewares/cache.js`, routes `statistics`
  - **Étapes :** remplacer `express-redis-cache` par implémentation simple TTL sur endpoints non sensibles (statistiques); sinon supprimer si inutile.
  - **Critères d’acceptation :** métriques stables; code épuré.

- [ ] **[P2]** Rate limiting distribué (Redis)
  - **Localisation :** `src/middlewares/rateLimiter.js`
  - **Étapes :** store Redis pour partager l’état; clés par IP/user/route.
  - **Critères d’acceptation :** limites efficaces en multi-instance.

- [ ] **[P2]** Circuit breaker & Observabilité
  - **Localisation :** `src/services/tools/*`, global backend/microservices
  - **Étapes :** wrapper axios avec breaker; métriques Prometheus; Sentry optionnel.
  - **Critères d’acceptation :** résilience accrue; tableaux de bord.

---

## 🧩 Incohérences Logiques
- [ ] **[P1]** Recherche récursive/tag Maigret: indicateur parent requis
  - **Localisation :** `src/services/orchestrator.js` (méthodes `runRecursiveMaigretSearch`, `runMaigretTagSearch`)
  - **Étapes :** si `USERNAME` absent, créer en DB puis utiliser son `id` pour `_saveResult/_saveIndicators`.
  - **Critères d’acceptation :** `indicatorId` non nul dans `results` liés au username.

- [ ] **[P2]** Swagger servers corrects en reverse proxy
  - **Localisation :** `src/index.js` (configuration Swagger — `servers`)
  - **Étapes :** mettre `servers: [{ url: process.env.PUBLIC_API_BASE_URL || 'http://localhost:8081' }]`.
  - **Critères d’acceptation :** Swagger UI affiche la bonne base URL.

- [ ] **[P2]** Graphe déterministe
  - **Localisation :** `src/services/tools/spiderfoot.js` (`_generateGraphData`), `src/routes/investigations.js` (`/graph`)
  - **Étapes :** positions non aléatoires.
  - **Critères d’acceptation :** rendu stable.

---

## 🛠️ Améliorations de l'Architecture
- [ ] **[P1]** Unifier API/WS côté front
  - **Localisation :** `frontend/src/lib/api-client.ts`, `frontend/src/lib/socket.ts`, `nginx.conf`
  - **Étapes :** base path `/api` et WS sur `window.location.origin`; Nginx proxy `/api/` et `/socket.io/`.
  - **Critères d’acceptation :** zéro CORS; WS stables.

- [ ] **[P2]** Erreurs normalisées
  - **Localisation :** `src/middlewares/errorHandler.js`, `src/utils/ApiError.js`, `src/middlewares/validate.js`
  - **Étapes :** payload `{ success:false, code, message, details? }`; validation Zod retourne `details` structurés.
  - **Critères d’acceptation :** front affiche proprement les erreurs champs/forme.

- [ ] **[P2]** Config centralisée + `.env.example`
  - **Localisation :** global
  - **Étapes :** créer `src/config/index.js` validant via Zod: `DATABASE_URL, REDIS_URL, JWT_SECRET, JWT_EXPIRES_IN, NEXTAUTH_SECRET, *_SERVICE_URL, FRONTEND_URL`; fournir `.env.example` complet.
  - **Critères d’acceptation :** démarrage fail-fast avec message clair si var manquante en prod.

- [ ] **[P2]** Auth WS
  - **Localisation :** `src/utils/socket.js` (middleware `io.use` et gestion des rooms)
  - **Étapes :** valider un JWT en handshake; joindre `user_${userId}` automatiquement; limiter les `join_*` aux ressources autorisées.
  - **Critères d’acceptation :** pas de connexion WS anonyme aux rooms utilisateur.

- [ ] **[P2]** Dé-doublonner la configuration Socket.IO
  - **Localisation :** `src/utils/socket.js`, `src/services/orchestrator.js`
  - **Étapes :** centraliser la gestion des événements dans un seul module.
  - **Critères d’acceptation :** pas de listeners dupliqués.

---

## ✨ Features à Améliorer
- [ ] **[P2]** Export `Case` (PDF/CSV)
  - **Localisation :** `src/routes/reports.js` (nouvelle route case)
  - **Étapes :** agrégations sur toutes les investigations du case; réutiliser transformer/csv; PDF via route front dédiée.
  - **Critères d’acceptation :** endpoints opérationnels et testés.

- [ ] **[P2]** Statut outils réel (non mock)
  - **Localisation :** `src/routes/tools.js`, `src/routes/health.js`
  - **Étapes :** requêtes `/health` de chaque microservice, retour latence/version; TTL 30s.
  - **Critères d’acceptation :** dashboard service status fiable.

---

## 📦 Référentiel variables d’environnement (.env.example à créer)
- `DATABASE_URL` (obligatoire prod)
- `REDIS_URL` (ex: `redis://redis:6379`)
- `JWT_SECRET`, `JWT_EXPIRES_IN` (ex: `7d`)
- `NEXTAUTH_SECRET`
- `INTERNAL_API_URL` (frontend SSR → `http://backend:5001`)
- `PUBLIC_API_BASE_URL` (Swagger, ex: `http://localhost:8081`)
- `MAIGRET_SERVICE_URL`, `MOSINT_SERVICE_URL`, `PHONEINFOGA_SERVICE_URL`, `ASN_SERVICE_URL`, `WAU_SERVICE_URL`, `WAYBULK_SERVICE_URL`, `SPIDERFOOT_SERVICE_URL`
- `SPIDERFOOT_*` clés API si nécessaires

---

## ✅ Plan de tests (à automatiser)
- **Unitaires**: `ResultTransformer`, `errorHandler`, `rateLimiter`, services outils (mocks axios)
- **Intégration**: login/register, création investigation, phases, résultats, logs, coûts/crédits (succès/échec), exports PDF/CSV (mock Puppeteer si besoin)
- **E2E**: scénario complet (auth → création case → investigation → résultats → export), WS (événements `investigation:update`/`log`)
- **Contrats/DB réels**: tests Prisma sur DB Postgres réelle pour filtres relationnels/JSON, parsers outils (buster/wau/spiderfoot) via stubs/containers.

---

## 📋 Commandes utiles
- Prisma: `npx prisma generate`, `npx prisma migrate dev --name align_schema`, `npx prisma migrate deploy`
- Tests: `npm run test`, `npm run test:e2e`
- Lint/Format: `npm run lint`, `npm run format`

---

## Annexe — Table de correspondance des points audités

- **Seed superadmin requis** → Voir: 🐛 Bugs Critiques » Échec du seed en absence de variables superadmin
- **Bug de transformation WAU** → Voir: 🐛 Bugs Critiques » Bug de transformation WAU (valeur inexistante)
- **Image prod avec dev-deps/nodemon** → Voir: 🐛 Bugs Critiques » Image de prod embarque des dev-deps et `nodemon`
- **Script cleanup-legacy dangereux** → Voir: 🐛 Bugs Critiques » Script de nettoyage legacy dangereux
- **Robustesse/outils externes + token interne** → Voir: 🐛 Bugs Critiques » Robustesse microservices outils (erreurs en chaîne…)
- **Concurrence/quotas exécutions lourdes** → Voir: 🐛 Bugs Critiques » Concurrence/quotas sur exécutions lourdes
- **Swagger contrôlé en prod** → Voir: 🛡️ Failles de Sécurité » Swagger contrôlé en prod
- **TLS/HSTS** → Voir: 🛡️ Failles de Sécurité » HSTS seulement en HTTPS et Sécurité (ajouts) » TLS et certificats
- **Circuit breaker par outil** → Voir: 📉 Problèmes de Performance » Circuit breaker & Observabilité
- **Observabilité (Prometheus/Sentry)** → Voir: 📉 Problèmes de Performance » Circuit breaker & Observabilité
- **Coût aligné sur `workflow.json`** → Voir: 🧩 Cohérence Métier » Aligner le modèle de coût avec `workflow.json`
- **Dédoublonnage des résultats** → Voir: 🧩 Cohérence Métier » Dédoublonnage des résultats
- **Nettoyage dépendances backend** → Voir: 🧱 Infra / Dépendances » Nettoyage des dépendances backend
- **Scripts migration utilitaires** → Voir: 🧱 Infra / Dépendances » Scripts de migration utilitaires
- **Tests contrat microservices outils** → Voir: ✅ Plan de tests (Contrats) et Tests (ajouts) » Tests de contrat microservices outils
- **Tests E2E robustes** → Voir: ✅ Plan de tests (E2E) et Tests (ajouts) » Tests d’investigation end-to-end robustes
- **Mauvais filtrage Prisma relations** → Voir: 🐛 Bugs Critiques (ajouts 2) » Mauvais filtrage Prisma sur relations
- **Filtrage JSON Prisma invalide** → Voir: 🐛 Bugs Critiques (ajouts 2) » Filtrage JSON Prisma invalide (recherche)
- **Endpoint coût: userId du body** → Voir: 🐛 Bugs Critiques (ajouts 2) » Endpoint de coût: ne pas accepter `userId` du body
- **Normalisation `confidence` 0–1** → Voir: 🐛 Bugs Critiques (ajouts 2) » Incohérence d’échelle de confiance (0–1 vs 0–100)
- **URLs microservices (pas `localhost`)** → Voir: 🐛 Bugs Critiques (ajouts 2) » URLs par défaut des microservices erronées en environnement Docker
- **HSTS servi en clair** → Voir: 🛡️ Failles de Sécurité (ajouts 2) » HSTS servi en clair
- **Swagger public par défaut** → Voir: 🛡️ Failles de Sécurité (ajouts 2) » Swagger accessible publiquement par défaut
- **Dé-doublonner config Socket.IO** → Voir: 🛠️ Améliorations de l'Architecture (ajouts 2) » Dé-doublonner la configuration Socket.IO
- **Graphe déterministe** → Voir: 🛠️ Améliorations de l'Architecture (ajouts 2) » Positions de graphe déterministes et 🧩 Incohérences Logiques » Graphe déterministe
- **Recherche investigations performante** → Voir: 📉 Performance (ajouts 2) » Recherche `investigations` performante
- **Tests Prisma sur DB réelle** → Voir: ✅ Plan de tests » Contrats/DB réels et Tests (ajouts 2) » Tests Prisma des filtres…
- **AuthZ export rapports** → Voir: 🐛 Bugs Critiques (ajouts 3) » Contrôle d’accès manquant sur l’export de rapports
- **Fuite `/results/recent`** → Voir: 🐛 Bugs Critiques (ajouts 3) » Fuite d’informations via `/api/results/recent`
- **Atomicité facturation** → Voir: 🐛 Bugs Critiques (ajouts 3) » Atomicité et idempotence de la facturation
- **Race démarrage investigation** → Voir: 🐛 Bugs Critiques (ajouts 3) » Condition de course: démarrage multiple d’une investigation
- **WS `join_user` non authentifié** → Voir: 🛡️ Failles de Sécurité (ajouts 3) » Événement WS `join_user` non authentifié
- **CORS/CSP Socket.IO** → Voir: 🛡️ Failles de Sécurité (ajouts 3) » CORS/CSP pour Socket.IO
- **Logs PII** → Voir: 🛡️ Failles de Sécurité (ajouts 3) » Journalisation de PII
- **PDF Next.js protégé (auth)** → Voir: 🧩 Incohérences Logiques (ajouts 3) » Génération PDF appelle une page Next.js protégée
- **Zod manquant** → Voir: 🧩 Incohérences Logiques (ajouts 3) » Validation Zod absente sur plusieurs endpoints
- **Rate limiting distribué** → Voir: 📉 Problèmes de Performance » Rate limiting distribué (Redis) et 📉 Performance (ajouts 3) » Rate limiting in-memory non scalable

---

## Checklists détaillées (How-To par point)

### P1 | Config & Bootstrap
- [ ] Redis URL et bootstrap
  - [ ] Éditer `docker-compose.yml` (service `backend`) et ajouter `REDIS_URL=redis://redis:6379`.
  - [ ] Éditer `src/utils/redis.js` pour construire l’URL depuis `process.env.REDIS_URL` sinon fallback `redis://${REDIS_HOST}:${REDIS_PORT}`.
  - [ ] Éditer `start-backend.sh` pour ne plus `exit 1` si `REDIS_URL` manquant: log + retry (backoff) puis continuer.
  - [ ] Ajouter ces clés dans `.env.example`.
  - [ ] Vérifier: `/api/health` doit renvoyer database/redis healthy.
- [ ] Seed superadmin optionnel et sûr
  - [ ] `prisma/seed.js`: si `SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD` absents, ne pas `process.exit(1)` en prod (log et skip); documenter.
  - [ ] `start-backend.sh`: exécuter le seed seulement si `RUN_DB_SEED=true`.
  - [ ] `.env.example`: ajouter `RUN_DB_SEED` + vars superadmin (commentées).
- [ ] Secrets JWT/NextAuth
  - [ ] `src/routes/auth.js`: si `process.env.JWT_EXPIRES_IN` absent → défaut sécurisé `7d` (dev) et fail-fast en prod.
  - [ ] `docker-compose.yml` (frontend): ajouter `NEXTAUTH_SECRET` (dev) et documenter pour prod.
- [ ] URLs microservices (pas de `localhost` en Docker)
  - [ ] Services `src/services/tools/*.js`: supprimer fallbacks `http://localhost:*` et exiger les env `*_SERVICE_URL`; ou fournir défauts Docker valides (ex: `http://maigret-service:5002`).
  - [ ] `.env.example` + `docker-compose.yml`: s’assurer que toutes les URL sont définies.
- [ ] Image prod sans dev-deps/nodemon
  - [ ] `Dockerfile` (étape prod): exécuter `npm ci --only=production` au lieu de copier `node_modules`.
  - [ ] `package.json` (backend): `start` → `node src/index.js` (garder `dev` pour `nodemon`).

### P1 | Modèle de données & Prisma
- [ ] Écritures hors schéma (BaseToolService)
  - [ ] `src/services/tools/BaseToolService.js`: supprimer `rawData` du `create` de `Result`; remplacer `Indicator.sourceTool`/`parentId` par `source` existant; s’assurer que `indicatorId` est optionnel.
  - [ ] Parcourir `src/services/tools/*` pour aligner `_saveResult/_saveIndicators`.
- [ ] Filtres relationnels Prisma
  - [ ] `src/routes/results.js`, `src/routes/statistics.js`: utiliser `where: { investigation: { is: {...} } }` et `indicator: { is: {...} }`.
  - [ ] Ajouter tests d’intégration Prisma (DB réelle) couvrant ces filtres.
- [ ] Recherche JSON invalide
  - [ ] `src/routes/investigations.js` (GET liste): retirer le filtre JSON non supporté, ou implémenter une table `IndicatorValue` + index GIN trigram et adapter la requête.
- [ ] Normalisation `confidence`
  - [ ] Uniformiser toutes écritures de `confidence` en 0–1: `spiderfoot.js` (75→0.75), `waybulk.js` (0.8 OK), `mosint/phoneinfoga/buster/asn/wau`.
  - [ ] `EnrichmentPhaseManager`: `minConfidence` déjà 0–1 → cohérent.
- [ ] Endpoint de coût (`/cost`) ne doit pas accepter `userId` du body
  - [ ] `src/routes/investigations.js` (POST `/cost`): ignorer `userId` du body; utiliser `req.user.id`.

### P1 | Orchestrateur & Phases
- [ ] Import `ApiError`
  - [ ] `src/services/orchestrator.js`: ajouter `const ApiError = require('../utils/ApiError');` en tête.
- [ ] Compteurs/flags pour ENRICHMENT
  - [ ] `src/services/phases/EnrichmentPhaseManager.js` (`run`, `handleToolCompletion`, `checkPhaseCompletion`): init `enrichmentTasks=0`, flag `isEnrichmentLoopRunning=true`, décrément atomique, set à false avant bascule.
- [ ] Démarrage concurrent d’une investigation
  - [ ] `src/routes/investigations.js` (POST `/:id/start`): faire un `update` conditionnel (passage `status`→ENRICHING si status non en cours), sinon 409; alternative: champ `version` pour optimistic locking.
- [ ] Quotas/concurrence globale
  - [ ] `OrchestratorService`: ajouter un gestionnaire de limites (tâches actives globales/par user) + file en mémoire (ou BullMQ Redis) avec métriques.

### P1 | API Correctness & AuthZ
- [ ] Export PDF restreint au propriétaire
  - [ ] `src/routes/reports.js` (GET export): remplacer `findUnique` par `findFirst({ where: { id, userId: req.user.id } })`; 404 si non trouvé.
- [ ] `/api/results/recent` filtré par user
  - [ ] `src/routes/results.js` (GET `/recent`): ajouter `where: { investigation: { is: { userId: req.user.id } } }`.
- [ ] Transactions crédits atomiques
  - [ ] `src/services/orchestrator.js` (`finalizeInvestigation`): encapsuler décrément crédits + `CreditTransaction.create` + `Investigation.update` dans `prisma.$transaction`; idempotence via unique `investigationId`.

### P1 | Intégrations Outillage
- [ ] Robustesse pannes
  - [ ] `src/services/tools/*`: wrapper axios (timeouts, retries avec backoff), gestion `skip` non bloquante, logs structurés.
- [ ] Token interne inter-services
  - [ ] Ajouter un header commun (ex: `X-Internal-Token` via env) dans les requêtes backend→microservices; valider côté `tools/*/server.*` et refuser si absent.
- [ ] Binaries présents/pinnés
  - [ ] Dockerfiles des tools: installer/pinner les versions (mosint/phoneinfoga/spiderfoot/buster/asn/wau); healthcheck `/health`.

### P1 | Frontend API/WS & Nginx
- [ ] API relative + WS même origine
  - [ ] `frontend/src/lib/api-client.ts`: `API_URL` → relatif (`''` ou `/api`).
  - [ ] `frontend/src/lib/socket.ts`: construire `io(window.location.origin, { path: '/socket.io' })` côté client.
  - [ ] `nginx.conf`: `location /api/` et `location /socket.io/` vers `backend:5001`.

### P1 | Socket.IO
- [ ] Correction `emitToOthers`
  - [ ] `src/utils/socket.js`: remplacer usage de `socket` hors scope par `io.to(investigationId).except(excludeSocketId).emit(...)`.
- [ ] Auth WS room utilisateur
  - [ ] `src/utils/socket.js`: middleware `io.use` pour valider JWT; lors de `connection`, joindre automatiquement `user_${userId}` du token; ignorer `userId` fourni par client.

### P1 | PDF
- [ ] Chromium + auth page report
  - [ ] `Dockerfile`: installer `chromium` et définir `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` (ou copier binaire depuis builder).
  - [ ] `src/services/reportService.js`: éviter page Next protégée → soit route SSR interne avec clé interne, soit token temporaire passé en header/query et validé côté page.

### P2 | Sécurité Prod
- [ ] CSP unifiée stricte
  - [ ] `nginx.conf`: définir CSP complète; retirer `'unsafe-inline'` de `script-src` (utiliser `nonce` si besoin).
  - [ ] `src/index.js`: désactiver `helmet` CSP ou l’aligner avec Nginx (éviter double en-tête).
- [ ] HSTS seulement en HTTPS
  - [ ] `nginx.conf`: servir `Strict-Transport-Security` uniquement sur 443; redirection 80→443 en prod.
- [ ] Swagger protégé/masqué
  - [ ] `src/index.js`: monter `/api-docs` si `ENABLE_SWAGGER=true` et restreindre aux admins via middleware.
- [ ] Logs PII masqués
  - [ ] `src/middlewares/errorHandler.js` et logs debug d’investigation: redacter `password`, `token`, emails/phones si nécessaire; éviter `inputData` brut en prod.
- [ ] CORS dynamique & WS
  - [ ] `nginx.conf`: whitelist origins via env; WS `connect-src` limité au domaine Nginx.

### P2 | Archi & Perf
- [ ] Listeners Socket.IO dédupliqués
  - [ ] Centraliser les listeners dans `src/utils/socket.js`; l’orchestrateur expose des hooks au lieu d’attacher `connection`.
- [ ] Graphe déterministe
  - [ ] `src/services/tools/spiderfoot.js` (`_generateGraphData`) et `/graph`: remplacer `Math.random()` par positions déterministes (hash-based ou layout fixe).
- [ ] PDF asynchrone + cache
  - [ ] `src/services/reportService.js`: déléguer à un job queue; endpoint retourne 202 + polling; stocker le PDF (TTL) et réutiliser.
- [ ] Rate limiting Redis
  - [ ] `src/middlewares/rateLimiter.js`: utiliser un store Redis (ex: `rate-limit-redis`) pour multi-instance.
- [ ] Cache statistiques & Observabilité
  - [ ] `src/routes/statistics.js`: TTL court (ex: 30–60s) via Redis; exposer métriques Prometheus (latence/erreurs/outils/jobs).

### P2 | Métier & Qualité
- [ ] Coût selon `workflow.json`
  - [ ] `src/services/orchestrator.js` (`calculateInvestigationCost`): sommer `cost` par outil/phase selon `workflow.json`, appliquer profondeur (`maxGeneration`), profils (éco/équilibré/exhaustif).
- [ ] Dédoublonnage `Result`
  - [ ] Avant `Result.create`, calculer `dataHash=sha256(toolSource+indicatorId+JSON.stringify(data))`; option: ajouter colonne unique partielle.
- [ ] Nettoyage deps backend
  - [ ] `package.json`: retirer deps front (`react`, `three`, etc.) inutiles côté backend; garder `bcryptjs` (retirer `bcrypt` si doublon); pinner `axios`, `puppeteer`.
- [ ] Scripts migrations utilitaires
  - [ ] `migrate-to-postgres.js`: documenter usage; aligner `DATABASE_URL` par défaut avec compose; ne pas shipper en prod si inutile.
- [ ] Validations Zod manquantes
  - [ ] `src/routes/results.js`, `src/routes/reports.js`, `src/routes/tools.js`, `src/routes/statistics.js`: ajouter schémas Zod et middleware `validate`.

### Tests (unit/int/E2E)
- [ ] Contrats microservices outils
  - [ ] `tests/services/tools/*.test.js`: stubs/containers pour `buster/wau/spiderfoot` (parsers), timeouts, erreurs; vérifier format de sortie.
- [ ] Prisma (DB réelle)
  - [ ] `tests/integration/*.test.js`: couvrir filtres relationnels (`investigation`, `indicator`) et recherche; exécuter contre Postgres docker.
- [ ] E2E robustes
  - [ ] `tests/e2e/full-flow.spec.js`: cas outils down (skip + complétion), crédits insuffisants (402), plans/limites, export CSV/PDF.
