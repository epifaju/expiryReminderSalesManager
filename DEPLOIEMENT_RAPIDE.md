# ⚡ Déploiement Rapide - Sales Manager en Production

## 🎯 Mettez votre app en ligne en 30 minutes !

Ce guide vous donne la méthode **la plus rapide** pour déployer Sales Manager en production.

---

## 🚀 Solution Recommandée : Railway + EAS Build

### Pourquoi Railway ?

- ✅ **Gratuit pour commencer** (500h/mois)
- ✅ **Déploiement automatique** depuis GitHub
- ✅ **PostgreSQL inclus** gratuitement
- ✅ **HTTPS automatique**
- ✅ **Zéro configuration**
- ✅ **URL publique** générée automatiquement

### Temps total : ~30 minutes

---

## 📱 Étape 1 : Préparer l'app mobile (5 minutes)

### 1.1 Installer EAS CLI

```powershell
npm install -g eas-cli
```

### 1.2 Login Expo

```powershell
cd mobile-expo
eas login
# Créez un compte Expo si vous n'en avez pas
```

### 1.3 Configurer EAS

```powershell
eas build:configure
# Répondez 'Yes' aux questions
```

---

## ☁️ Étape 2 : Déployer le backend sur Railway (10 minutes)

### 2.1 Créer un compte Railway

1. Aller sur https://railway.app
2. Sign up with GitHub
3. Autoriser Railway à accéder à vos repos

### 2.2 Pousser votre code sur GitHub

```powershell
cd C:\Users\epifa\cursor-workspace\expiryReminder

# Si pas encore fait
git init
git add .
git commit -m "Ready for production"

# Créer un repo sur GitHub, puis :
git remote add origin https://github.com/votre-username/sales-manager.git
git push -u origin main
```

### 2.3 Déployer sur Railway

1. **New Project** sur Railway
2. **Deploy from GitHub repo**
3. Sélectionner votre repo `sales-manager`
4. Railway détecte automatiquement Spring Boot
5. Cliquer **Deploy Now**

### 2.4 Ajouter PostgreSQL

1. Dans votre projet Railway, cliquer **New**
2. **Database** → **Add PostgreSQL**
3. Railway crée la base automatiquement
4. La connexion est automatiquement liée au backend !

### 2.5 Configurer les variables d'environnement

Dans Railway, onglet **Variables** :

```
SPRING_PROFILES_ACTIVE=postgresql
JWT_SECRET=votre_secret_jwt_super_securise_minimum_64_caracteres_123456
```

### 2.6 Obtenir l'URL publique

1. Railway génère une URL comme : `https://sales-manager-production-xxxx.up.railway.app`
2. **Copier cette URL** (vous en aurez besoin !)

### 2.7 Tester

```powershell
# Remplacez par votre URL Railway
curl https://sales-manager-production-xxxx.up.railway.app/actuator/health
# Devrait retourner : {"status":"UP"}
```

---

## 📲 Étape 3 : Connecter l'app mobile au backend (5 minutes)

### 3.1 Modifier l'URL de l'API

Ouvrez `mobile-expo/src/services/authService.ts` :

```typescript
const getApiUrls = () => {
  if (Platform.OS === "web") {
    return ["https://sales-manager-production-xxxx.up.railway.app"];
  } else {
    return [
      "https://sales-manager-production-xxxx.up.railway.app", // Production
      "http://192.168.1.16:8082", // Fallback pour dev local
    ];
  }
};
```

### 3.2 Commit et push

```powershell
git add .
git commit -m "Update API URL for production"
git push
```

---

## 📦 Étape 4 : Builder l'app mobile (10 minutes)

### 4.1 Build pour Android

```powershell
cd mobile-expo

# Build APK de production
eas build --platform android --profile production

# Le build prend 5-10 minutes
# Vous recevrez un lien de téléchargement à la fin
```

### 4.2 Télécharger l'APK

```
Le lien sera comme :
https://expo.dev/artifacts/eas/xxxxxxxxxxxx.apk

→ Téléchargez l'APK
→ C'est votre application prête pour distribution !
```

---

## 🎉 Étape 5 : Distribuer aux utilisateurs

### Option A : Distribution directe (immédiate)

1. **Partagez l'APK** :

   - Google Drive
   - Dropbox
   - Email
   - WhatsApp

2. **Instructions pour vos utilisateurs** :

   ```
   📱 Installation Sales Manager

   1. Télécharger le fichier APK
   2. Ouvrir le fichier
   3. Autoriser "Sources inconnues" si demandé
   4. Installer l'application
   5. Se connecter avec : admin / admin123
   ```

### Option B : Publication Play Store (processus plus long)

```powershell
# Soumettre au Play Store
eas submit --platform android

# Suivre le processus de review (1-3 jours)
```

---

## ✅ Vérification Finale

### Backend en production :

```powershell
# Test de santé
curl https://votre-url-railway.up.railway.app/actuator/health

# Test d'authentification
curl -X POST https://votre-url-railway.up.railway.app/auth/signin `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"password\":\"admin123\"}'
```

### Application mobile :

1. Installer l'APK sur un téléphone Android
2. Ouvrir l'application
3. Se connecter (admin / admin123)
4. Créer un produit
5. Créer une vente
6. Vérifier que tout fonctionne

### Persistance des données :

1. Redémarrer le backend sur Railway (Restart)
2. Se reconnecter dans l'app
3. ✅ Les données sont toujours là !

---

## 🔧 Commandes Utiles

### Railway CLI

```powershell
# Installer
npm install -g @railway/cli

# Login
railway login

# Voir les logs
railway logs

# Ouvrir le dashboard
railway open

# Variables d'environnement
railway variables
```

### Mise à jour du code

```powershell
# 1. Modifier votre code
# 2. Commit
git add .
git commit -m "Update features"
git push

# 3. Railway redéploie automatiquement ! 🎉
```

---

## 📊 Tableau de Bord

### Railway Dashboard vous donne :

- 📈 **Métriques** : CPU, RAM, réseau
- 📝 **Logs** en temps réel
- 🗄️ **Base de données** : connexion, taille
- 🔄 **Déploiements** : historique
- ⚙️ **Variables** : configuration
- 🌐 **Domaine** : URL publique

---

## 🎯 Résumé des 30 Minutes

| Étape | Durée    | Action                                    |
| ----- | -------- | ----------------------------------------- |
| 1     | 5 min    | Installer EAS CLI et configurer           |
| 2     | 10 min   | Déployer backend sur Railway + PostgreSQL |
| 3     | 5 min    | Mettre à jour URL dans l'app mobile       |
| 4     | 10 min   | Builder l'APK avec EAS                    |
| 5     | Immédiat | Partager l'APK aux utilisateurs           |

**Total : ~30 minutes → App en production ! 🚀**

---

## 💡 Prochaines Étapes

### Immédiatement après le déploiement :

1. **Créer des utilisateurs** pour vos clients
2. **Importer vos produits** (via l'app ou CSV)
3. **Former vos utilisateurs** à l'application
4. **Monitorer les logs** pour détecter les problèmes

### Semaine suivante :

1. **Configurer les backups** automatiques
2. **Activer le monitoring** (Sentry, LogRocket)
3. **Optimiser les performances** si nécessaire
4. **Collecter les feedbacks** utilisateurs

### Mois suivant :

1. **Publication Play Store** (si volume d'utilisateurs important)
2. **Domaine personnalisé** (api.votredomaine.com)
3. **SSL personnalisé** si besoin
4. **Upgrade plan** Railway si nécessaire

---

## 🆘 Résolution de Problèmes

### Le backend ne démarre pas sur Railway

**Vérifier :**

```
1. Logs Railway → Chercher les erreurs
2. Variables d'environnement → Toutes présentes ?
3. Build logs → Compilation réussie ?
```

**Solution commune :**

```
Ajouter dans Variables :
SPRING_PROFILES_ACTIVE=postgresql
```

### L'app mobile ne se connecte pas

**Vérifier :**

```
1. URL correcte dans authService.ts ?
2. Backend accessible ? (test avec curl)
3. CORS configuré ? (allowed-origins)
```

**Solution :**

```typescript
// Dans authService.ts
const API_URLS = ["https://votre-url-railway-exacte.up.railway.app"];
```

### Erreur de base de données

**Vérifier :**

```
1. PostgreSQL ajouté dans Railway ?
2. Variable DATABASE_URL présente ?
3. Tables créées ? (vérifier les logs)
```

---

## 🎊 Félicitations !

Votre application **Sales Manager** est maintenant :

- ✅ **Déployée** sur Railway
- ✅ **Accessible** via HTTPS
- ✅ **Base de données** PostgreSQL persistante
- ✅ **APK** prêt pour distribution
- ✅ **Utilisateurs** peuvent l'installer

**Vous avez une vraie application en production ! 🎉**

---

## 📞 Besoin d'aide ?

- 📖 Guide complet : `GUIDE_DEPLOIEMENT_PRODUCTION.md`
- 🔧 Setup PostgreSQL : `GUIDE_MIGRATION_POSTGRESQL.md`
- 💬 Questions : Créer une issue GitHub

**Votre app est prête à servir vos utilisateurs ! 🚀**
