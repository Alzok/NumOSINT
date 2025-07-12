# Plan d'Intégration Stratégique pour les Nouveaux Outils OSINT

Ce document décrit l'intégration de nouveaux outils au sein de l'architecture NumOSINT, en tenant compte du flux d'investigation dynamique et de la logique d'orchestration basée sur la stratégie.

Pour chaque outil, la méthode d'intégration recommandée est un **Microservice Docker**, conformément à votre guide du contributeur.

---

### 1. Intégration de `h8mail` (Analyse de Fuites de Données)

* **Rôle dans NumOSINT** : Fournir une capacité d'analyse de fuites de données de niveau expert, en remplacement de la fonctionnalité de base de `Mosint`.
* **Stratégie de l'Orchestrateur** : Cet outil devient une **haute priorité** lorsque la stratégie de workflow est déclenchée par un indicateur de type `EMAIL`.
* **Flux d'intégration** :
    1.  L'utilisateur soumet une investigation contenant un `EMAIL`. L'**`OrchestratorService`** identifie "Email" comme la stratégie principale.
    2.  L'Orchestrateur appelle un nouveau **`H8mailService`** dans le backend Node.js.
    3.  Ce service envoie une requête HTTP au microservice `h8mail`, en transmettant l'e-mail cible et les clés API pertinentes (`HaveIBeenPwned`, `IntelligenceX`, etc.) configurées par l'utilisateur.
    4.  Le microservice `h8mail` exécute la recherche et retourne un rapport JSON consolidé.
    5.  Le `H8mailService` reçoit la réponse, la stocke comme un `Result` brut dans **PostgreSQL** et notifie le frontend de la réception de nouvelles données via **Socket.IO**.
    6.  Si des mots de passe en clair ou des hashes sont trouvés, ils sont mis en évidence dans les résultats pour l'analyste.

---

### 2. Intégration de `Waymore` (Archives Web Approfondies)

* **Rôle dans NumOSINT** : Remplacer `waybulk` pour une découverte d'URL plus exhaustive et une analyse de contenu archivé.
* **Stratégie de l'Orchestrateur** : Outil de priorité moyenne, déclenché par un indicateur de type `DOMAIN`.
* **Flux d'intégration** :
    1.  L'Orchestrateur traite un indicateur de type `DOMAIN`.
    2.  Il appelle le **`WaymoreService`** (qui remplace `WaybulkService`).
    3.  Le service appelle le microservice `waymore` avec le domaine cible.
    4.  **Phase 1 (Découverte)** : Le microservice interroge ses 6 sources et retourne une liste d'URL. Le backend crée des indicateurs de type `URL` et des `Result` associés, puis notifie le frontend via **Socket.IO**.
    5.  **Phase 2 (Analyse de Contenu)** : L'Orchestrateur peut ensuite, de manière asynchrone, sélectionner les URL les plus pertinentes (ex: contenant des paramètres) et rappeler le `WaymoreService` pour **télécharger le contenu archivé**. Ce contenu est ensuite analysé par le backend pour y découvrir de nouveaux indicateurs (emails, commentaires, etc.), créant une nouvelle `generation` d'indicateurs.

---

### 3. Intégration de `Social Analyzer` (Recherche de Profils Avancée)

* **Rôle dans NumOSINT** : Remplacer `Maigret` par un outil plus rapide et à la couverture plus large, avec des fonctionnalités de détection avancées.
* **Stratégie de l'Orchestrateur** : Outil de haute priorité lorsqu'un `USERNAME` est un indicateur initial. Peut aussi être déclenché par des `NAME` ou `EMAIL` pour tenter de déduire des pseudos.
* **Flux d'intégration** :
    1.  L'Orchestrateur traite un indicateur `USERNAME`.
    2.  Il appelle le **`SocialAnalyzerService`**.
    3.  Le service envoie une requête HTTP au microservice `social-analyzer`.
    4.  Le microservice scanne son large éventail de sites et retourne un rapport JSON détaillé, incluant les profils trouvés et les alertes de "typosquatting".
    5.  Le backend crée des indicateurs `URL` pour chaque profil valide et des `Result` distincts pour les alertes de phishing.
    6.  Le frontend est mis à jour en temps réel via **Socket.IO**.

---

### 4. Intégration de `Metagoofil` (Renseignement via Métadonnées)

* **Rôle dans NumOSINT** : Ajouter une nouvelle capacité d'investigation en exploitant les métadonnées de documents publics.
* **Stratégie de l'Orchestrateur** : Outil de priorité moyenne à basse, déclenché par un `DOMAIN` pour enrichir le contexte de l'enquête.
* **Flux d'intégration** :
    1.  Lors du traitement d'un `DOMAIN`, l'**`OrchestratorService`** appelle le **`MetagoofilService`**.
    2.  Le service demande au microservice `metagoofil` de rechercher et télécharger les documents publics liés au domaine.
    3.  Le microservice extrait les métadonnées et retourne un rapport JSON.
    4.  Le backend parse ce rapport et **crée une vague de nouveaux indicateurs** de haute qualité : `USERNAME` (auteurs), `EMAIL`, `SOFTWARE` (logiciels utilisés), etc., avec une `generation` incrémentée.
    5.  Ces nouveaux indicateurs sont ensuite injectés dans le workflow et traités par d'autres outils (comme `Social Analyzer` ou `h8mail`).

---

### 5. Intégration de `TruffleHog` (Analyse de Secrets)

* **Rôle dans NumOSINT** : Ajouter une capacité de renseignement technique très spécialisée pour les profils de développeurs.
* **Stratégie de l'Orchestrateur** : Outil très spécifique, déclenché uniquement par un indicateur de type `CODE_REPOSITORY_URL` (ex: un lien GitHub).
* **Flux d'intégration** :
    1.  Un outil comme `SpiderFoot` ou `Mosint` découvre un lien vers un dépôt de code, créant un indicateur `CODE_REPOSITORY_URL`.
    2.  L'Orchestrateur détecte cet indicateur et appelle le **`TrufflehogService`**.
    3.  Le service transmet l'URL du dépôt au microservice `trufflehog`.
    4.  Le microservice scanne l'historique complet du dépôt à la recherche de secrets.
    5.  Il retourne une liste des secrets trouvés (clés API, etc.) au backend.
    6.  Le backend enregistre ces trouvailles comme des `Result` de haute importance, stockés dans **PostgreSQL**. Ces résultats permettent à l'analyste de faire des corrélations uniques entre un profil technique et ses activités.