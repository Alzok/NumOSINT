# 📊 Business Plan - NumOSINT SaaS

**Projet :** NumOSINT - Plateforme d'Investigation Numérique

## 🌍 Analyse de Marché

### Taille du Marché OSINT
- **Marché global OSINT** : $15.2B en 2024, croissance 15.8% CAGR
- **Segment SaaS** : $3.8B, croissance 22% CAGR
- **Marché adressable** : 
  - Entreprises cybersécurité : 50k+ (TAM: $2.5B)
  - Investigateurs privés : 85k+ (TAM: $800M)
  - Journalistes/Chercheurs : 200k+ (TAM: $400M)

### Segmentation Utilisateurs
**Persona 1 : Investigateur Privé**
- Âge : 35-55 ans
- Budget : $50-200/mois
- Besoins : Investigations personnelles, infidélité, localisation

**Persona 2 : Analyste Cybersécurité**
- Âge : 25-40 ans
- Budget : $100-500/mois
- Besoins : Threat intelligence, IOC analysis, attribution

**Persona 3 : Journaliste/Chercheur**
- Âge : 30-50 ans
- Budget : $25-100/mois
- Besoins : Fact-checking, source verification, enquêtes

**Persona 4 : Consultant en Sécurité**
- Âge : 30-45 ans
- Budget : $200-1000/mois
- Besoins : Audits, due diligence, compliance

## 🏆 Analyse Concurrentielle

### Concurrents Directs
**1. Maltego** (Leader)
- Prix : $760-1200/an
- Forces : Visualisation, intégrations
- Faiblesses : Complexité, prix élevé
- Part de marché : 35%

**2. Hunchly**
- Prix : $129-259/an
- Forces : Investigation web, organization
- Faiblesses : Pas d'automatisation
- Part de marché : 15%

**3. Skopenow**
- Prix : $99-299/mois
- Forces : Recherche sociale automatisée
- Faiblesses : Limité aux réseaux sociaux
- Part de marché : 10%

### Concurrents Indirects
- **Shodan** : $59/mois (recherche IoT)
- **Pipl** : $299/mois (recherche personnes)
- **Intelligence X** : $9/mois (data breaches)

### Positionnement Concurrentiel
**NumOSINT** vs **Concurrence** :
- ✅ **Prix** : 5-10x moins cher
- ✅ **Simplicité** : Interface intuitive
- ✅ **Intégration** : 5+ outils unifiés
- ✅ **Flexibilité** : Modèle à la demande
- ⚠️ **Visualisation** : À développer
- ⚠️ **Marque** : Nouveau entrant

## 🎯 Modèle d'Affaires

### Vue d'Ensemble
NumOSINT est une plateforme SaaS d'investigation numérique qui permet aux utilisateurs de lancer des recherches OSINT complètes en utilisant un système de crédits. L'architecture est conçue pour supporter 1000+ utilisateurs occasionnels avec un auto-scaling intelligent.

### Proposition de Valeur
- **Investigation complète** : 5 outils OSINT intégrés (Buster, Mosint, Maigret, PhoneInfoga, SpiderFoot)
- **Simplicité d'usage** : Interface web intuitive, pas d'installation
- **Résultats consolidés** : Rapport unifié et exportable
- **Temps réel** : Suivi des investigations en direct
- **Modèle freemium** : 1 crédit gratuit, puis achat de crédits

## 🏗️ Architecture Technique

### Services Intégrés
1. **Buster** - Génération d'emails à partir de noms
2. **Mosint** - Analyse d'emails et fuites de données
3. **Maigret** - Recherche de profils sur 400+ plateformes
4. **PhoneInfoga** - Analyse de numéros de téléphone
5. **SpiderFoot** - Scan OSINT exhaustif (25+ modules)

### Flux d'Investigation
```
Entrée utilisateur → Orchestrateur → Services OSINT parallèles → Consolidation → Rapport final
Durée moyenne : 2-5 minutes par investigation
```

## 💰 Analyse des Coûts par Architecture

### Option 1 : Google Cloud Run (RECOMMANDÉE)

#### Avantages
- ✅ **Scale-to-zero** : $0 quand inactif
- ✅ **Auto-scaling** : 0 → 1000 instances automatiquement
- ✅ **Paiement à l'usage** : Coût proportionnel
- ✅ **Simplicité** : Déploiement en quelques clics
- ✅ **CI/CD intégré** : GitHub → Cloud Run automatique

#### Configuration des Services
| Service | CPU/RAM | Coût/investigation | Durée moyenne |
|---------|---------|-------------------|---------------|
| Frontend (Next.js) | 0.5 vCPU, 512MB | $0.001 | 30s |
| API Gateway | 1 vCPU, 1GB | $0.002 | 5 min |
| Buster | 0.5 vCPU, 512MB | $0.001 | 30s |
| Mosint | 1 vCPU, 1GB | $0.002 | 60s |
| Maigret | 2 vCPU, 2GB | $0.008 | 120s |
| PhoneInfoga | 0.5 vCPU, 512MB | $0.001 | 30s |
| SpiderFoot | 4 vCPU, 4GB | $0.020 | 180s |

#### Coûts Infrastructure
- **Compute** : $0.035/investigation
- **Cloud SQL PostgreSQL** : $0.003/investigation
- **Cloud Storage** : $0.001/investigation
- **Network** : $0.001/investigation
- **Total** : **$0.04/investigation**

### Option 2 : Google Kubernetes Engine (GKE)

#### Avantages
- ✅ **Contrôle granulaire** des ressources
- ✅ **Haute disponibilité** native
- ✅ **Auto-scaling** avancé
- ✅ **Intégration complète** GCP

#### Coûts
- **Coût fixe** : $74.40/mois (tier gratuit)
- **Coût variable** : $0.04/investigation + overhead
- **Total mensuel** : $74.40 + ($0.04 × nb_investigations)

### Option 3 : Compute Engine

#### Avantages
- ✅ **Coût fixe** prévisible
- ✅ **Performance stable**
- ✅ **Configuration flexible**

#### Coûts
- **VM e2-standard-4** : $97.83/mois
- **Stockage SSD** : $20/mois
- **Total** : $118/mois fixe
- **Coût/investigation** : $0.00 (après amortissement)

## 📊 Scénarios Financiers

### Scénario 1 : Lancement Conservateur
**Profil utilisateurs :** 1000 inscrits, 20% actifs/mois, 1.5 crédit/utilisateur actif/mois

#### Métriques
- **Utilisateurs actifs** : 200/mois
- **Investigations totales** : 300/mois
- **Coût infrastructure** : $12/mois (Cloud Run)

#### Revenus (pricing freemium)
- **Crédits gratuits** : 200 (coût : $8)
- **Crédits payants** : 100 à $0.50 = $50
- **Revenu net** : $50 - $12 = $38/mois
- **Marge brute** : 76%

### Scénario 2 : Croissance Modérée
**Profil utilisateurs :** 1000 inscrits, 40% actifs/mois, 2.5 crédits/utilisateur actif/mois

#### Métriques
- **Utilisateurs actifs** : 400/mois
- **Investigations totales** : 1000/mois
- **Coût infrastructure** : $40/mois (Cloud Run)

#### Revenus
- **Crédits gratuits** : 400 (coût : $16)
- **Crédits payants** : 600 à $0.50 = $300
- **Revenu net** : $300 - $40 = $260/mois
- **Marge brute** : 87%

### Scénario 3 : Adoption Forte
**Profil utilisateurs :** 1000 inscrits, 60% actifs/mois, 4 crédits/utilisateur actif/mois

#### Métriques
- **Utilisateurs actifs** : 600/mois
- **Investigations totales** : 2400/mois
- **Coût infrastructure** : $96/mois (Cloud Run)

#### Revenus
- **Crédits gratuits** : 600 (coût : $24)
- **Crédits payants** : 1800 à $0.50 = $900
- **Revenu net** : $900 - $96 = $804/mois
- **Marge brute** : 89%

### Scénario 4 : Succès Viral
**Profil utilisateurs :** 1000 inscrits, 80% actifs/mois, 6 crédits/utilisateur actif/mois

#### Métriques
- **Utilisateurs actifs** : 800/mois
- **Investigations totales** : 4800/mois
- **Coût infrastructure** : $192/mois (Cloud Run)

#### Revenus
- **Crédits gratuits** : 800 (coût : $32)
- **Crédits payants** : 4000 à $0.50 = $2000
- **Revenu net** : $2000 - $192 = $1808/mois
- **Marge brute** : 90%

## 💳 Stratégie de Pricing

### Modèle Freemium
- **Crédit gratuit** : 1/mois par utilisateur
- **Objectif** : Acquisition d'utilisateurs et démonstration de valeur

### Packs de Crédits
| Pack | Crédits | Prix | Prix/crédit | Économie |
|------|---------|------|-------------|----------|
| **Starter** | 5 | $3.00 | $0.60 | - |
| **Standard** | 10 | $5.00 | $0.50 | 17% |
| **Pro** | 25 | $10.00 | $0.40 | 33% |
| **Enterprise** | 50 | $17.50 | $0.35 | 42% |
| **Unlimited** | 100 | $30.00 | $0.30 | 50% |

### Stratégie de Pricing Psychologique
- **Ancrage** : Prix de référence à $0.60/crédit
- **Économies d'échelle** : Incitation aux gros packs
- **Seuil psychologique** : Maintenir sous $1/crédit

## 📈 Projections Financières

### Année 1 : Phase de Lancement
| Mois | Utilisateurs | Revenus | Coûts | Bénéfice |
|------|-------------|---------|--------|----------|
| M1-3 | 200 | $150/mois | $30/mois | $120/mois |
| M4-6 | 500 | $375/mois | $75/mois | $300/mois |
| M7-9 | 800 | $600/mois | $120/mois | $480/mois |
| M10-12 | 1000 | $750/mois | $150/mois | $600/mois |

**Total Année 1 :** $5625 revenus, $1125 coûts, $4500 bénéfice

### Année 2 : Phase de Croissance
| Trimestre | Utilisateurs | Revenus | Coûts | Bénéfice |
|-----------|-------------|---------|--------|----------|
| T1 | 1500 | $1125/mois | $225/mois | $900/mois |
| T2 | 2000 | $1500/mois | $300/mois | $1200/mois |
| T3 | 2500 | $1875/mois | $375/mois | $1500/mois |
| T4 | 3000 | $2250/mois | $450/mois | $1800/mois |

**Total Année 2 :** $20250 revenus, $4050 coûts, $16200 bénéfice

## 🎯 Facteurs Clés de Succès

### Technique
- **Fiabilité** : Uptime > 99.9%
- **Performance** : Investigations < 5 minutes
- **Scalabilité** : Support 10k+ utilisateurs
- **Sécurité** : Chiffrement des données

### Business
- **Acquisition** : SEO, content marketing, partenariats
- **Rétention** : Valeur du crédit gratuit mensuel
- **Monétisation** : Conversion freemium > 15%
- **Support** : Documentation et assistance

## 🚀 Roadmap de Déploiement

### Phase 1 : MVP (Mois 1-2)
- [ ] Migration vers Cloud Run
- [ ] Système de crédits basique
- [ ] Interface de paiement (Stripe)
- [ ] Documentation utilisateur

### Phase 2 : Optimisation (Mois 3-4)
- [ ] Monitoring avancé
- [ ] Cache Redis pour performance
- [ ] API rate limiting
- [ ] Dashboard analytics

### Phase 3 : Croissance (Mois 5-6)
- [ ] Intégration nouveaux outils (WAU, Waybulk)
- [ ] Fonctionnalités collaboratives
- [ ] API publique
- [ ] Programme partenaires

## 🔍 Analyse des Risques

### Risques Techniques
- **Dépendance externe** : Outils OSINT tiers
- **Scaling** : Pics de charge imprévisibles
- **Mitigation** : Architecture Cloud Run + monitoring

### Risques Business
- **Concurrence** : Nouveaux entrants OSINT
- **Réglementation** : Restrictions OSINT
- **Mitigation** : Différenciation technique + veille juridique

### Risques Financiers
- **Coûts variables** : Explosion des coûts infrastructure
- **Conversion** : Faible taux freemium → payant
- **Mitigation** : Monitoring coûts + optimisation pricing

## 📊 Conclusion

L'architecture Cloud Run offre le meilleur équilibre entre coût, simplicité et scalabilité pour NumOSINT. Avec un coût de $0.04 par investigation et un pricing de $0.30-0.60 par crédit, la marge brute projetée de 85-90% permet une croissance soutenable.

**Recommandation :** Démarrer avec Cloud Run, modèle freemium, et pricing à $0.50/crédit pour maximiser l'adoption tout en maintenant une rentabilité élevée.

---

*Business Plan v1.0 - NumOSINT SaaS Platform* 