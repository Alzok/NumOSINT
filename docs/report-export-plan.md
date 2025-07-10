# Plan d'Architecture : Exportation de Rapports

Ce document décrit l'architecture pour la fonctionnalité d'exportation de rapports aux formats PDF et CSV.

## 1. Analyse des Formats et Bibliothèques

### 1.1. Génération CSV

-   **Bibliothèque :** `papaparse`
-   **Justification :** Léger, rapide, et très populaire pour la manipulation de CSV en JavaScript. Il peut fonctionner aussi bien côté serveur (Node.js) que côté client, mais nous l'utiliserons côté serveur pour accéder directement aux données de la base.

### 1.2. Génération PDF

-   **Bibliothèque :** `Puppeteer`
-   **Justification :** Permet de générer des PDF à partir de pages web (HTML/CSS). Cette approche est idéale car elle nous permet de créer des templates de rapport en utilisant des technologies web que nous maîtrisons déjà (React/CSS). Nous pouvons créer un composant React dédié pour le rapport, le rendre sur le serveur, et utiliser Puppeteer pour "l'imprimer" en PDF. C'est plus flexible et puissant que des bibliothèques comme `pdf-lib` pour des mises en page complexes.

## 2. Conception de l'API

Une nouvelle route sera créée pour gérer les exports.

### Fichier de Route

-   `src/routes/reports.js`

### Endpoints

-   `GET /api/reports/investigation/:id/export`
-   `GET /api/reports/case/:id/export`

### Paramètres de Requête

-   `format` (obligatoire) : `pdf` ou `csv`.

### Logique du Contrôleur

1.  Récupérer l'ID de l'investigation ou du dossier depuis les paramètres de l'URL.
2.  Récupérer le format depuis les paramètres de la requête.
3.  Appeler un nouveau `ReportService` pour générer le rapport.
4.  Le service récupérera toutes les données nécessaires depuis la base de données (détails de l'investigation/dossier, indicateurs, résultats).
5.  Le service formatera les données et générera le fichier (PDF ou CSV).
6.  L'API renverra le fichier généré en tant que flux (`stream`) avec les en-têtes HTTP appropriés pour déclencher le téléchargement côté client.
    -   `Content-Type`: `application/pdf` ou `text/csv`.
    -   `Content-Disposition`: `attachment; filename="rapport-investigation-ID.pdf"`.

## 3. Structure des Rapports

### 3.1. Rapport CSV

Le CSV sera une extraction "plate" de tous les résultats.
**Colonnes :**
`id_resultat`, `source_outil`, `type_indicateur`, `valeur_indicateur`, `donnee_principale`, `details_json`, `score`, `date_creation`

### 3.2. Rapport PDF

Le PDF sera basé sur un template HTML/React.
**Structure :**
-   **Page de Garde :**
    -   Titre : "Rapport d'Investigation" / "Rapport de Dossier"
    -   Nom de l'investigation / du dossier.
    -   Date de génération.
-   **Résumé et Statistiques :**
    -   Nombre total d'indicateurs.
    -   Nombre total de résultats.
    -   Répartition des résultats par outil (graphique).
    -   Répartition des indicateurs par type (graphique).
-   **Liste des Indicateurs :**
    -   Tableau des indicateurs initiaux et découverts.
-   **Détail des Résultats :**
    -   Section par outil.
    -   Liste des résultats trouvés pour chaque outil, formatés pour la lisibilité.

## 4. Interaction Frontend

1.  Ajouter un bouton "Exporter" avec un menu déroulant (PDF/CSV) sur les pages `/investigation/[id]` et `/case/[id]`.
2.  Au clic, une fonction dans `investigation-api.ts` appellera l'endpoint de l'API correspondant.
3.  La fonction utilisera une technique pour déclencher le téléchargement du fichier reçu depuis l'API. Par exemple, en créant un lien `<a>` temporaire avec l'URL du blob et en simulant un clic.

## 5. Plan d'Implémentation

1.  **Backend :**
    -   `npm install puppeteer papaparse`
    -   Créer `src/services/reportService.js`.
    -   Créer `src/routes/reports.js`.
    -   Enregistrer la nouvelle route dans `src/index.js`.
    -   Créer un composant React simple pour le template PDF dans un dossier `src/report-templates`.
2.  **Frontend :**
    -   Mettre à jour `investigation-api.ts` avec les nouvelles fonctions d'export.
    -   Ajouter le bouton d'export dans les pages concernées.