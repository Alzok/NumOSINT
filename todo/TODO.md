# 🚀 TODO Production - Mise en Production NumOSINT

## Vue d'Ensemble
Tâches spécifiques pour préparer NumOSINT à un déploiement en production sécurisé et scalable.

---

## 🏗️ Infrastructure Production

### 1.1 Architecture Scalable
- [ ] **Load Balancing**
  - [ ] Configurer Nginx comme load balancer
  - [ ] Implémenter la répartition de charge pour l'API
  - [ ] Load balancer pour les services OSINT
  - [ ] Health checks pour les instances
  - [ ] Failover automatique en cas de panne

- [ ] **Clustering**
  - [ ] Configuration cluster PostgreSQL (Master/Slave)
  - [ ] Redis Cluster pour la haute disponibilité
  - [ ] Réplication des données entre nœuds
  - [ ] Synchronisation des sessions utilisateur
  - [ ] Gestion des instances multiples Node.js

- [ ] **Auto-scaling**
  - [ ] Metrics de scaling (CPU, mémoire, requêtes)
  - [ ] Scaling horizontal des services API
  - [ ] Scaling vertical pour PostgreSQL
  - [ ] Queue management pour les investigations
  - [ ] Limitation des ressources par investigation

### 1.2 Conteneurisation Production
- [ ] **Optimisation Docker**
  - [ ] Images multi-stage pour réduire la taille
  - [ ] Images de production (sans dev dependencies)
  - [ ] Registry privé pour les images
  - [ ] Versioning et tags des images
  - [ ] Scanning de sécurité des images

- [ ] **Orchestration Kubernetes (optionnel)**
  - [ ] Manifests Kubernetes
  - [ ] Services et Ingress
  - [ ] ConfigMaps et Secrets
  - [ ] Persistent Volumes pour PostgreSQL
  - [ ] HorizontalPodAutoscaler

---

## 🔒 Sécurité Production

### 2.1 Authentification et Autorisation
- [ ] **Système d'authentification**
  - [ ] JWT tokens avec refresh tokens
  - [ ] OAuth2/OIDC integration (optionnel)
  - [ ] Multi-factor authentication (MFA)
  - [ ] Session management sécurisé
  - [ ] Password policies et rotation

- [ ] **Autorisation granulaire**
  - [ ] Role-Based Access Control (RBAC)
  - [ ] Permissions par investigation
  - [ ] API access tokens avec scopes
  - [ ] Rate limiting par utilisateur/IP
  - [ ] Audit des accès et actions

### 2.2 Sécurité Infrastructure
- [ ] **HTTPS et TLS**
  - [ ] Certificats SSL/TLS (Let's Encrypt ou commercial)
  - [ ] TLS 1.3 minimum
  - [ ] HSTS headers
  - [ ] Certificate pinning
  - [ ] TLS termination au load balancer

- [ ] **Sécurité réseau**
  - [ ] Firewall rules (iptables/UFW)
  - [ ] VPN pour accès admin
  - [ ] Network segmentation
  - [ ] DDoS protection (Cloudflare/AWS Shield)
  - [ ] IP whitelisting pour APIs sensibles

### 2.3 Sécurité Données
- [ ] **Chiffrement**
  - [ ] Chiffrement au repos (PostgreSQL TDE)
  - [ ] Chiffrement en transit (TLS)
  - [ ] Chiffrement des secrets (Vault/AWS KMS)
  - [ ] Chiffrement des backups
  - [ ] Key rotation automatique

- [ ] **Privacy et GDPR**
  - [ ] Data anonymization
  - [ ] Right to be forgotten
  - [ ] Data retention policies
  - [ ] Consent management
  - [ ] Privacy impact assessments

---

## 📊 Monitoring et Observabilité

### 3.1 Monitoring Système
- [ ] **Métriques Infrastructure**
  - [ ] Prometheus + Grafana
  - [ ] Métriques CPU, RAM, disque, réseau
  - [ ] Monitoring PostgreSQL (pg_stat_user_tables)
  - [ ] Monitoring Redis (memory usage, hit rate)
  - [ ] Alertes automatiques (PagerDuty/Slack)

- [ ] **Application Performance Monitoring (APM)**
  - [ ] Intégration New Relic/DataDog/Elastic APM
  - [ ] Tracing des requêtes API
  - [ ] Performance des investigations
  - [ ] Database query performance
  - [ ] Error tracking et alerting

### 3.2 Logging et Debugging
- [ ] **Logs Centralisés**
  - [ ] ELK Stack (Elasticsearch, Logstash, Kibana)
  - [ ] Fluentd pour la collecte de logs
  - [ ] Logs structurés (JSON format)
  - [ ] Log rotation et archivage
  - [ ] Recherche et filtrage avancés

- [ ] **Debugging Production**
  - [ ] Health check endpoints détaillés
  - [ ] Debug mode sécurisé (sans secrets)
  - [ ] Stack trace sanitization
  - [ ] Performance profiling
  - [ ] Memory leak detection

---

## 🔄 CI/CD et Déploiement

### 4.1 Pipeline CI/CD
- [ ] **Continuous Integration**
  - [ ] GitHub Actions/GitLab CI/Jenkins
  - [ ] Tests automatisés sur chaque commit
  - [ ] Code quality gates (SonarQube)
  - [ ] Security scanning (Snyk/OWASP)
  - [ ] Build et push des images Docker

- [ ] **Continuous Deployment**
  - [ ] Déploiement automatique en staging
  - [ ] Blue-green deployment
  - [ ] Canary releases
  - [ ] Rollback automatique en cas d'erreur
  - [ ] Database migrations automatiques

### 4.2 Environnements
- [ ] **Staging Environment**
  - [ ] Réplique exacte de la production
  - [ ] Tests d'intégration complets
  - [ ] Load testing
  - [ ] Security testing
  - [ ] User acceptance testing

- [ ] **Production Environment**
  - [ ] Infrastructure as Code (Terraform/CloudFormation)
  - [ ] Configuration management (Ansible/Chef)
  - [ ] Secrets management (Vault/AWS Secrets Manager)
  - [ ] Environment variables sécurisées
  - [ ] Rollback procedures documentées

---

## 💾 Backup et Disaster Recovery

### 5.1 Stratégie de Backup
- [ ] **Database Backups**
  - [ ] Backups PostgreSQL automatiques (pg_dump)
  - [ ] Point-in-time recovery (PITR)
  - [ ] Backups chiffrés
  - [ ] Tests de restauration réguliers
  - [ ] Retention policy (3-2-1 rule)

- [ ] **Application Backups**
  - [ ] Configuration files backup
  - [ ] User-uploaded data backup
  - [ ] Container images backup
  - [ ] Infrastructure configuration backup
  - [ ] Documentation et runbooks backup

### 5.2 Disaster Recovery
- [ ] **Plan de Continuité**
  - [ ] RTO/RPO objectives définis
  - [ ] Procédures de failover documentées
  - [ ] Tests de disaster recovery
  - [ ] Communication plan en cas d'incident
  - [ ] Post-mortem process

- [ ] **Multi-zone/Multi-region**
  - [ ] Déploiement multi-AZ
  - [ ] Cross-region replication
  - [ ] DNS failover (Route53/CloudFlare)
  - [ ] Data synchronization
  - [ ] Geographic load balancing

---

## 📈 Performance et Scalabilité

### 6.1 Optimisation Performance
- [ ] **Cache Strategy**
  - [ ] Redis pour cache applicatif
  - [ ] CDN pour assets statiques
  - [ ] Database query caching
  - [ ] API response caching
  - [ ] Browser caching headers

- [ ] **Database Optimization**
  - [ ] Index optimization pour requêtes fréquentes
  - [ ] Query optimization et EXPLAIN ANALYZE
  - [ ] Connection pooling (PgBouncer)
  - [ ] Read replicas pour les lectures
  - [ ] Partitioning pour les grandes tables

### 6.2 Capacity Planning
- [ ] **Resource Planning**
  - [ ] Profiling des investigations types
  - [ ] Calcul des besoins en ressources
  - [ ] Scaling thresholds définis
  - [ ] Cost optimization (AWS Cost Explorer)
  - [ ] Performance benchmarks

- [ ] **Load Testing**
  - [ ] Tests de charge avec k6/JMeter
  - [ ] Stress testing des investigations
  - [ ] Concurrent users testing
  - [ ] Memory leak testing
  - [ ] Performance regression testing

---

## 🔧 Maintenance et Support

### 7.1 Maintenance Proactive
- [ ] **Updates et Patches**
  - [ ] Automated security updates
  - [ ] Dependency vulnerability scanning
  - [ ] Regular dependency updates
  - [ ] OS security patches
  - [ ] Database maintenance (VACUUM, ANALYZE)

- [ ] **Health Monitoring**
  - [ ] Automated health checks
  - [ ] Synthetic monitoring
  - [ ] User experience monitoring
  - [ ] Business metrics tracking
  - [ ] Capacity utilization alerts

### 7.2 Support et Documentation
- [ ] **Runbooks**
  - [ ] Incident response procedures
  - [ ] Troubleshooting guides
  - [ ] Deployment procedures
  - [ ] Rollback procedures
  - [ ] Emergency contacts

- [ ] **User Support**
  - [ ] User documentation
  - [ ] API documentation (Swagger)
  - [ ] Status page (status.io)
  - [ ] Support ticket system
  - [ ] User feedback collection

---

## 🎯 Critères de Production Ready

### Checklist Final
- [ ] **Security**
  - [ ] Penetration testing complet
  - [ ] Security audit externe
  - [ ] Compliance check (GDPR, SOC2)
  - [ ] Vulnerability assessment
  - [ ] Security training équipe

- [ ] **Performance**
  - [ ] Load testing 100+ utilisateurs concurrents
  - [ ] Response time < 200ms (95th percentile)
  - [ ] 99.9% uptime SLA
  - [ ] RTO < 4 heures, RPO < 1 heure
  - [ ] Scalability à 1000+ investigations/jour

- [ ] **Operations**
  - [ ] 24/7 monitoring et alerting
  - [ ] On-call rotation définie
  - [ ] Incident response plan testé
  - [ ] Documentation complète
  - [ ] Team formation sur production

---

## 📅 Timeline Production

### Phase 1 (Semaines 1-2) - Infrastructure
- Configuration load balancing et clustering
- Sécurisation de base (HTTPS, authentification)
- Monitoring de base

### Phase 2 (Semaines 3-4) - CI/CD et Tests
- Pipeline de déploiement
- Tests de performance
- Backup et disaster recovery

### Phase 3 (Semaines 5-6) - Optimisation
- Optimisation performance
- Security hardening
- Documentation et formation

### Phase 4 (Semaine 7) - Go-Live
- Tests finaux
- Migration des données
- Déploiement production

---

**Estimation totale : 7-8 semaines pour une mise en production complète** 
---

## 👥 Collaboration (Fonctionnalité avancée)

- [ ] **Gestion des Utilisateurs**
  - [ ] Mettre en place un système d'authentification complet (ex: avec Passport.js, Auth0, ou Next-Auth).
  - [ ] Créer des modèles de données pour `User`, `Team`, et les rôles.
  - [ ] Développer une interface d'administration pour gérer les utilisateurs et les équipes.

- [ ] **Partage et Permissions**
  - [ ] Permettre d'assigner des investigations et des dossiers à des utilisateurs ou des équipes.
  - [ ] Définir des niveaux de permission (ex: lecteur, éditeur, administrateur) par dossier/investigation.

- [ ] **Fonctionnalités Collaboratives**
  - [ ] Ajouter une section de commentaires ou de notes sur une investigation.
  - [ ] Mettre en place un journal d'audit pour tracer les actions des utilisateurs sur une investigation.
  - [ ] Développer un système de notifications en temps réel pour les actions collaboratives.
---

## 🔔 Notifications Avancées

- [ ] **Infrastructure de Notification**
  - [ ] Mettre en place un service de messagerie (ex: SendGrid, Mailgun pour les emails).
  - [ ] Configurer un service pour les webhooks sortants.

- [ ] **Déclencheurs de Notification**
  - [ ] Notification par email à la fin d'une investigation.
  - [ ] Notification par webhook pour intégration avec des outils tiers (ex: Slack, Discord).
  - [ ] Notifications pour les mentions dans les commentaires (si la collaboration est implémentée).

---
---

# Plan de développement - Section Achat de Jetons (Tâche Actuelle)

Ce document détaille les étapes restantes pour l'implémentation de la section d'achat de jetons.

## Statut Actuel
- **Problème identifié** : La migration de la base de données avec les nouveaux modèles `Subscription` échoue à cause de problèmes de communication entre l'environnement local et les conteneurs Docker.
- **Action en cours** : Redémarrage complet des services Docker (`docker-compose down && docker-compose up -d`).

---

## Prochaines Étapes Techniques

### ✅ Tâche 1 : Finaliser la migration de la base de données
*   **Objectif** : Appliquer avec succès les changements du schéma Prisma.
*   **Sous-tâches** :
    1.  Attendre la fin du redémarrage des services Docker.
    2.  Vérifier que le service `backend` est `healthy` avec `docker-compose ps`.
    3.  Tenter d'appliquer la migration en utilisant la commande `docker-compose exec backend npx prisma migrate deploy`. Cette commande est non-interactive et devrait fonctionner à l'intérieur du conteneur.
    4.  Si l'étape 3 échoue, il faudra trouver un moyen de générer le fichier de migration manuellement pour ensuite l'appliquer.
    5.  Une fois la migration réussie, marquer la tâche 1 de la liste de rappel comme terminée.

### Tâche 2 : Création des routes d'API
*   **Objectif** : Mettre en place les endpoints nécessaires pour que le frontend puisse interagir avec le système d'abonnements et de crédits.
*   **Fichier à créer** : `src/routes/subscriptions.js`
*   **Endpoints à créer** :
    *   `POST /api/subscriptions/create-checkout-session` : Simule la création d'une session de paiement Stripe et retourne une URL de redirection factice. Prend en paramètre l'ID du plan.
    *   `POST /api/subscriptions/manage` : Simule la redirection vers un portail de gestion d'abonnement Stripe.
    *   `POST /api/credits/purchase` : Gère l'achat ponctuel de jetons. Prend en paramètre la quantité de jetons.
*   **Logique à implémenter** :
    *   Ces routes devront être protégées et accessibles uniquement aux utilisateurs authentifiés.
    *   La logique de paiement sera simulée pour l'instant (pas d'intégration Stripe réelle).
    *   L'endpoint d'achat de crédits mettra à jour le champ `credits` du modèle `User` et créera une `CreditTransaction`.

### Tâche 3 : Adapter la logique métier
*   **Objectif** : S'assurer que les limitations définies dans les offres ("Enquêteur", "Stratège") sont bien appliquées dans l'application.
*   **Fichiers à modifier** : Principalement `src/services/orchestrator.js` et `src/validations/investigation.validation.js`.
*   **Logique à implémenter** :
    *   Avant de lancer une investigation, vérifier le plan de l'utilisateur (`req.user.subscription.plan`).
    *   Appliquer les limitations sur `maxGeneration`, le nombre d'indicateurs, et les outils autorisés en fonction du plan.
    *   Retourner une erreur claire si l'utilisateur tente une action non autorisée par son plan.

### Tâche 4 à 9 : Développement Frontend
*   **Objectif** : Construire l'interface utilisateur en suivant le plan et le design validés.
*   **Fichier principal à créer** : `frontend/src/components/Billing/PurchaseSection.tsx`
*   **Déroulement** :
    1.  **Structure de base** : Créer le composant `PurchaseSection` et l'intégrer dans la page `billing.tsx` à la place de l'encart "Bientôt disponible".
    2.  **UI (Tabs & Cards)** : Utiliser les composants ShadCN/UI (`Tabs`, `Card`, `Button`, `Badge`) pour construire la structure visuelle avec les deux onglets (Abonnements, Achat ponctuel) et les cartes pour chaque offre.
    3.  **Logique d'affichage** :
        *   Récupérer les informations sur l'abonnement de l'utilisateur.
        *   Afficher dynamiquement le statut de l'abonnement actuel.
        *   Mettre en surbrillance l'offre "Stratège" avec un badge "Le plus populaire".
    4.  **Achat ponctuel (Slider)** :
        *   Intégrer le composant `Slider` pour la sélection du nombre de jetons.
        *   Implémenter la logique de tarification dégressive et afficher le coût/jeton en temps réel.
        *   Appliquer et afficher la réduction si l'utilisateur est abonné.
    5.  **Connexion API** : Lier les boutons "Choisir ce plan" et "Acheter" aux routes d'API créées à l'étape 2.
    6.  **Finitions UI/UX** : Ajouter les micro-animations (survol des cartes, transitions fluides) et les icônes `lucide-react` pour rendre l'interface plus vivante et intuitive.

---
Je vais maintenant attendre la fin de la commande en cours et continuerai à suivre ce plan.