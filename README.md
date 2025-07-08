# 🚀 NumOSINT - OSINT Search Tool

Outil de recherche OSINT moderne avec interface React/Next.js et backend Python.

## 🐳 Installation automatique

**Une seule commande pour tout installer et lancer :**

```bash
docker-compose up
```

C'est tout ! 🎉

## 🌐 Accès

Après le démarrage, accédez à :

- **Interface principale** : http://localhost:8080 ✅
- **API Backend** : http://localhost:5000 ✅
- **Redis** : localhost:6379 ✅

## ✅ Test de l'installation

Pour vérifier que tout fonctionne :

```bash
./test-final.sh
```

## 📁 Organisation des rapports

Les rapports sont maintenant organisés dans le dossier `reports/` :

```
reports/
├── Prénom-Nom/           # Un dossier par recherche
│   ├── holehe_*.csv      # Résultats individuels par email
│   └── main.csv          # Rapport consolidé
├── John-Doe/
├── Raphael-Delatour/     # ✅ Migré automatiquement
└── Raphael-de/           # ✅ Migré automatiquement
```

### Migration Automatique
Les anciens résultats ont été automatiquement migrés :
- ✅ **Raphael-Delatour/** : 17 fichiers, 6 emails, 20 comptes trouvés
- ✅ **Raphael-de/** : 3 fichiers, comptes supplémentaires

## 🔧 Utilisation

1. **Démarrer** : `docker-compose up`
2. **Ouvrir** : http://localhost:8080
3. **Rechercher** : Entrez un prénom et nom
4. **Résultats** : Les rapports sont dans `reports/Prénom-Nom/`

## 🛠️ Développement

```bash
# Arrêter les services
docker-compose down

# Reconstruire si nécessaire
docker-compose build

# Voir les logs
docker-compose logs -f
```

## 📊 Fonctionnalités

- ✅ Interface moderne avec React/Next.js
- ✅ Mode sombre/clair
- ✅ Recherches en temps réel
- ✅ Notifications
- ✅ Rapports organisés
- ✅ API REST complète
- ✅ Installation automatique

---

**Prêt à l'emploi en une commande !** 🚀
