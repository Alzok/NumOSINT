# Manuel d'Utilisation de NumOSINT

## Introduction

Bienvenue sur NumOSINT, votre plateforme unifiée pour l'investigation numérique basée sur les sources ouvertes (Open Source Intelligence - OSINT).

L'OSINT est l'art de collecter et d'analyser des informations disponibles publiquement sur Internet. NumOSINT automatise et simplifie ce processus pour vous permettre de découvrir des connexions et des informations précieuses à partir de simples indicateurs comme une adresse e-mail, un nom d'utilisateur ou un numéro de téléphone.

Ce manuel vous guidera à travers toutes les fonctionnalités de l'application.

---

## Section 1 : Le Tableau de Bord (Dashboard)

Le tableau de bord est votre point d'entrée. Il vous donne une vue d'ensemble de l'activité sur la plateforme.

*   **Indicateurs Clés :** En haut de la page, des cartes vous montrent des statistiques vitales :
    *   **Investigations en cours :** Le nombre d'analyses qui tournent actuellement.
    *   **Investigations terminées :** Le nombre d'analyses complétées avec succès.
    *   **Toutes les investigations :** Le total des analyses lancées.
    *   **Total des résultats :** Le nombre total d'informations collectées sur l'ensemble des investigations.

*   **Graphique d'Activité :** Le graphique "Investigations Créées par Jour" vous montre le volume d'activité sur la plateforme, vous aidant à visualiser les tendances.

*   **Progression de l'Investigation :** Cette section affiche une timeline en temps réel de la dernière investigation lancée ou de la plus récente en cours. Elle vous permet de suivre pas à pas les étapes de l'analyse (Enrichissement, Scan, Consolidation).

`[Capture d'écran du tableau de bord avec annotations]`

---

## Section 2 : Mener une Investigation

Pour lancer une analyse, utilisez le formulaire "Nouvelle Investigation" sur le tableau de bord.

*   **Le Formulaire de Recherche :**
    *   **Indicateurs :** Remplissez un ou plusieurs champs avec les informations que vous possédez. Vous pouvez ajouter plusieurs indicateurs du même type (par exemple, plusieurs noms d'utilisateur) en cliquant sur le bouton `+`.
        *   **Noms complets :** `ex: Jean Dupont`
        *   **Noms d'utilisateur :** `ex: jdupont123`
        *   **Adresses email :** `ex: jean.dupont@email.com`
        *   **Numéros de téléphone :** `ex: +33612345678`
        *   **Adresses IP, Domaines, URLs...**

*   **Options Avancées :**
    *   **Profondeur Max :** Définit le nombre de "sauts" que l'investigation fera. Une profondeur de 2 signifie que l'application cherchera des informations liées à vos indicateurs, puis des informations liées à ce qu'elle a trouvé. Une valeur plus élevée donne plus de résultats mais allonge la durée de l'analyse.
    *   **Seuil de Fiabilité :** C'est un score de confiance (entre 0% et 100%). Un seuil élevé (ex: 90%) signifie que seuls les résultats très probables seront utilisés pour la suite de l'investigation, rendant la recherche plus précise mais potentiellement moins exhaustive.

*   **Utiliser les Modèles (Templates) :**
    *   **Sauvegarder :** Si vous utilisez souvent les mêmes paramètres, cliquez sur "Sauvegarder comme modèle" pour enregistrer votre configuration.
    *   **Charger :** Utilisez le menu déroulant "Charger un modèle" pour réappliquer instantanément une configuration sauvegardée.

`[Capture d'écran du formulaire de recherche avec les options avancées]`

---

## Section 3 : Explorer les Résultats

Une fois une investigation terminée, vous pouvez consulter ses résultats.

*   **Le Tableau de Résultats Unifié :**
    Ce tableau centralise toutes les informations collectées.
    *   **Colonnes :**
        *   `Type` : Le type de donnée (email, pseudo, etc.).
        *   `Valeur` : La donnée brute découverte.
        *   `Catégorie` : La nature de la découverte (Compte en ligne, Fuite de données, etc.).
        *   `Source` : L'outil OSINT qui a trouvé l'information.
        *   `Date` : Quand l'information a été découverte.
    *   **Filtrer et Trier :** Utilisez la barre de recherche pour filtrer par valeur, ou les menus déroulants en haut des colonnes pour filtrer par `Source` ou `Type`. Cliquez sur les en-têtes de colonnes pour trier.
    *   **Actions :** L'icône lien vous permet d'ouvrir la source de l'information dans un nouvel onglet.

`[Capture d'écran du tableau de résultats avec les filtres activés]`

---

## Section 4 : Le Graphe de Relations

Le graphe est un outil puissant pour visualiser les liens entre les données.

*   **Comment le lire :**
    *   Chaque **nœud** (cercle) représente une information (un email, un nom, un site web).
    *   Chaque **lien** (ligne) entre deux nœuds montre une corrélation directe trouvée par les outils.
*   **Interagir avec le graphe :** Vous pouvez cliquer et glisser les nœuds, zoomer et vous déplacer pour explorer les connexions et découvrir des relations que vous n'auriez pas vues dans un tableau.

`[Capture d'écran du graphe de relations montrant un lien entre un email et un pseudo]`

---

## Section 5 : Notifications et Suivi

*   **Le Centre de Notifications :** L'icône en forme de cloche en haut à droite vous informe des événements importants.
*   **Types de notifications :** Vous serez notifié lorsqu'une investigation est terminée, si elle a échoué, ou pour d'autres mises à jour système.
*   **Gestion :** Vous pouvez marquer les notifications comme lues individuellement ou toutes en même temps.

---

## Section 6 : Exporter un Rapport

Pour archiver ou partager vos résultats, vous pouvez exporter un rapport depuis la page de détail d'une investigation.

*   **Formats disponibles :**
    *   **CSV :** Génère un fichier tableur avec toutes les données brutes. Idéal pour une analyse approfondie ou une importation dans d'autres outils.
    *   **PDF :** (Prochainement) Générera un rapport visuel et synthétique, facile à lire et à partager.