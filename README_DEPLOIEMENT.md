# 📚 Documentation de Déploiement - Sales Manager

## 🎯 Guides Disponibles

Voici tous les guides pour déployer votre application Sales Manager en production :

---

## 🚀 Guides de Déploiement

### 1. ⚡ **DEPLOIEMENT_RAPIDE.md** - Démarrage Rapide

**Temps : 30 minutes**

Le guide le plus rapide pour mettre votre app en ligne.

- Solution Railway (gratuit)
- Build APK avec EAS
- Distribution immédiate

👉 **Commencez par celui-ci si vous voulez déployer aujourd'hui !**

### 2. 📖 **GUIDE_DEPLOIEMENT_PRODUCTION.md** - Guide Complet

**Temps : 1-2 heures**

Guide détaillé couvrant toutes les options de déploiement.

- Options cloud (Railway, Heroku, AWS, etc.)
- Déploiement VPS
- Docker et conteneurisation
- Sécurité en production
- Monitoring et maintenance
- Coûts estimés

👉 **Consultez-le pour comprendre toutes les options disponibles.**

### 3. 🔄 **GUIDE_MIGRATION_POSTGRESQL.md** - Migration Base de Données

**Temps : 10-20 minutes**

Guide complet pour passer de H2 à PostgreSQL.

- Installation PostgreSQL
- Création de la base
- Configuration Spring Boot
- Dépannage

👉 **Utile si vous voulez PostgreSQL en local d'abord.**

### 4. ⚡ **GUIDE_DEMARRAGE_RAPIDE_POSTGRESQL.md** - PostgreSQL Rapide

**Temps : 5 minutes**

Version condensée du guide PostgreSQL.

- Commandes essentielles
- Checklist rapide
- Commandes utiles

👉 **Pour une référence rapide des commandes PostgreSQL.**

---

## 🛠️ Scripts Utiles

### Scripts de Démarrage :

| Script                         | Description             | Usage                            |
| ------------------------------ | ----------------------- | -------------------------------- |
| `start-backend-h2.ps1`         | Démarre avec H2 (dev)   | `.\start-backend-h2.ps1`         |
| `start-backend-postgresql.ps1` | Démarre avec PostgreSQL | `.\start-backend-postgresql.ps1` |

### Scripts de Vérification :

| Script                        | Description               | Usage                           |
| ----------------------------- | ------------------------- | ------------------------------- |
| `verify-postgresql-setup.ps1` | Vérifie PostgreSQL        | `.\verify-postgresql-setup.ps1` |
| `prepare-for-production.ps1`  | Vérifie si prêt pour prod | `.\prepare-for-production.ps1`  |

---

## 🎯 Quel Guide Utiliser ?

### Je veux déployer MAINTENANT (gratuit) :

→ **DEPLOIEMENT_RAPIDE.md** (30 min)

### Je veux comprendre toutes les options :

→ **GUIDE_DEPLOIEMENT_PRODUCTION.md** (lecture 20 min)

### Je veux PostgreSQL en local d'abord :

→ **GUIDE_MIGRATION_POSTGRESQL.md** (10-20 min)

### Je cherche une commande spécifique :

→ **GUIDE_DEMARRAGE_RAPIDE_POSTGRESQL.md** (référence)

---

## 📋 Checklist Globale

### Avant de déployer :

- [ ] Code testé en local
- [ ] Backend compile sans erreur
- [ ] App mobile se connecte au backend
- [ ] PostgreSQL testé en local
- [ ] Toutes les fonctionnalités testées

### Pour déployer :

- [ ] Compte Railway créé (ou autre hébergeur)
- [ ] Repo GitHub créé et pushé
- [ ] EAS CLI installé
- [ ] Variables d'environnement préparées

### Après déploiement :

- [ ] Backend accessible via HTTPS
- [ ] Base de données connectée
- [ ] APK buildé et téléchargé
- [ ] Application mobile testée en production
- [ ] Utilisateurs peuvent se connecter

---

## 🎓 Parcours Recommandé

### Étape 1 : Tester PostgreSQL en Local

```powershell
.\verify-postgresql-setup.ps1
.\start-backend-postgresql.ps1
```

### Étape 2 : Préparer pour Production

```powershell
.\prepare-for-production.ps1
```

### Étape 3 : Déployer

Suivre **DEPLOIEMENT_RAPIDE.md** étape par étape

### Étape 4 : Distribuer

- Télécharger l'APK depuis EAS
- Partager avec vos utilisateurs

---

## 💰 Coûts Récapitulatifs

### Gratuit (Démarrage) :

- Railway : Gratuit (500h/mois)
- PostgreSQL Railway : Gratuit
- EAS Build : 1 build gratuit/mois
- Distribution APK : Gratuit

**Total : 0 €/mois** ✅

### Payant (Croissance) :

- Railway Pro : 5-20 $/mois
- Play Store : 25 $ (paiement unique)
- EAS Priority Build : 29 $/mois

**Total : ~30-50 $/mois + 25 $ initial**

---

## 🔗 Liens Rapides

### Plateformes de déploiement :

- Railway : https://railway.app
- Heroku : https://heroku.com
- Render : https://render.com
- DigitalOcean : https://digitalocean.com

### Build mobile :

- Expo EAS : https://expo.dev/eas
- Documentation Expo : https://docs.expo.dev

### Base de données :

- PostgreSQL : https://postgresql.org
- Managed databases : Railway, Heroku, DigitalOcean

---

## 📞 Support

### Guides dans ce projet :

1. `DEPLOIEMENT_RAPIDE.md` - Guide 30 minutes
2. `GUIDE_DEPLOIEMENT_PRODUCTION.md` - Guide complet
3. `GUIDE_MIGRATION_POSTGRESQL.md` - PostgreSQL détaillé
4. `GUIDE_DEMARRAGE_RAPIDE_POSTGRESQL.md` - PostgreSQL rapide

### Scripts utiles :

- `prepare-for-production.ps1` - Vérifier si prêt
- `start-backend-postgresql.ps1` - Démarrer avec PostgreSQL
- `verify-postgresql-setup.ps1` - Vérifier PostgreSQL

---

## ✨ Commencer Maintenant

Pour déployer votre application aujourd'hui :

```powershell
# 1. Vérifier que tout est prêt
.\prepare-for-production.ps1

# 2. Lire le guide rapide
# Ouvrir DEPLOIEMENT_RAPIDE.md

# 3. Suivre les étapes (30 minutes)
# - Créer compte Railway
# - Déployer backend
# - Builder APK
# - Distribuer

# 4. Votre app est en ligne ! 🎉
```

---

**Bonne chance avec votre déploiement ! 🚀**

Votre application **Sales Manager** va bientôt servir vos utilisateurs ! 🎊
