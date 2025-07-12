# Foire Aux Questions (FAQ)

## Questions Générales

**Q : Qu'est-ce que NumOSINT ?**

R : NumOSINT est une plateforme d'investigation qui automatise la collecte et l'analyse d'informations depuis des sources publiques sur Internet (OSINT). Elle vous aide à trouver des informations et à visualiser les liens entre elles à partir de données de départ comme un email, un pseudo, ou un numéro de téléphone.

**Q : Les recherches sont-elles anonymes et privées ?**

R : NumOSINT agit comme un orchestrateur qui lance des outils de recherche. Ces recherches sont effectuées depuis le serveur où NumOSINT est hébergé. Votre identité en tant qu'utilisateur final n'est pas directement exposée, mais les requêtes proviendront de l'adresse IP du serveur. Les données de vos investigations sont stockées dans la base de données de votre instance NumOSINT et ne sont accessibles qu'aux utilisateurs de la plateforme.

**Q : Quels types de données puis-je rechercher ?**

R : Vous pouvez lancer une investigation à partir de noms complets, noms d'utilisateur, adresses e-mail, numéros de téléphone, adresses IP, noms de domaine et URLs.

---

## Utilisation de l'Application

**Q : Je n'obtiens aucun résultat, pourquoi ?**

R : Plusieurs raisons sont possibles :
1.  L'indicateur de départ est peut-être trop vague ou ne possède aucune empreinte numérique publique.
2.  Les outils OSINT n'ont trouvé aucune information correspondante.
3.  Essayez d'ajouter plus d'indicateurs ou de vérifier l'orthographe de celui que vous avez fourni.

**Q : Quelle est la différence entre "Profondeur Max" et "Seuil de Fiabilité" ?**

R :
*   **Profondeur Max :** C'est le nombre de "niveaux" de recherche. Une profondeur de 1 cherche des informations sur votre cible. Une profondeur de 2 cherche aussi des informations sur les informations trouvées au niveau 1.
*   **Seuil de Fiabilité :** C'est un filtre de confiance. Un seuil élevé (ex: 95%) ne gardera que les résultats quasi-certains pour continuer la recherche, la rendant plus rapide et précise. Un seuil bas explorera plus de pistes, même les moins probables.

**Q : Comment puis-je organiser mes investigations ?**

R : Sur la page "Investigations", vous pouvez créer des "Dossiers" pour regrouper plusieurs investigations liées, par exemple pour un même cas ou une même cible.

**Q : À quoi servent les "modèles" de recherche ?**

R : Si vous effectuez souvent le même type de recherche avec les mêmes réglages (profondeur, fiabilité), vous pouvez les sauvegarder comme modèle. Cela vous permet de lancer rapidement une nouvelle investigation avec vos paramètres préférés en un seul clic.

---

## Technique et Dépannage

**Q : Une investigation est bloquée ou a échoué, que faire ?**

R : Allez sur la page "Investigations". Si une investigation a échoué, vous pourrez voir un message d'erreur en passant la souris sur le badge "Échouée". Vous pouvez essayer de la relancer avec des paramètres différents ou moins d'indicateurs. Si le problème persiste, contactez l'administrateur de la plateforme.

**Q : Comment puis-je signaler un bug ou suggérer une amélioration ?**

R : Le projet NumOSINT est open-source. Le meilleur moyen est de créer une "Issue" sur le dépôt GitHub du projet pour décrire le problème ou votre idée.

**Q : Les données sont-elles sauvegardées si je ferme mon navigateur ?**

R : Oui. Toutes les investigations et leurs résultats sont sauvegardés en temps réel dans la base de données du serveur. Vous pouvez fermer votre navigateur et retrouver votre travail plus tard.