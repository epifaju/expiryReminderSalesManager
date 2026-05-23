# 🚀 Guide de Démarrage - Sales Manager

## 🎯 Démarrer l'application complète en 5 minutes !

Ce guide vous explique comment démarrer votre application **Sales Manager** pour la première fois.

---

## 📋 Prérequis

### ✅ Vérifier les installations

Avant de démarrer, assurez-vous d'avoir :

1. **Java 17** (ou supérieur)
   ```powershell
   java -version
   # Doit afficher : java version "17"...
   ```

2. **Maven** (pour le backend)
   ```powershell
   mvn -version
   # Doit afficher : Apache Maven...
   ```

3. **Node.js** et **npm** (pour le mobile)
   ```powershell
   node -v
   npm -v
   ```

4. **Expo CLI** (optionnel, pour le mobile)
   ```powershell
   npm install -g expo-cli
   ```

### ⚠️ PostgreSQL (optionnel)

- **Pour H2** : Aucune installation nécessaire ✅
- **Pour PostgreSQL** : Installation requise (voir `GUIDE_MIGRATION_POSTGRESQL.md`)

---

## 🎯 Méthode Rapide : Démarrage Automatique

### Option 1 : Script Automatique Complet (Recommandé)

J'ai créé un script qui démarre tout automatiquement :

```powershell
.\start-application-complete.ps1
```

Ce script :
- ✅ Vérifie les prérequis
- ✅ Démarre le backend (H2 ou PostgreSQL)
- ✅ Démarre l'application mobile
- ✅ Ouvre les bonnes fenêtres

**C'est la méthode la plus simple !** ⭐

---

## 📝 Méthode Manuelle : Démarrage Étape par Étape

### 🔧 Partie 1 : Démarrer le Backend

Vous avez **2 options** pour le backend :

#### Option A : Backend avec H2 (Base en mémoire) - ⭐ RECOMMANDÉ pour débuter

**Avantages :**
- ✅ Aucune installation de base de données
- ✅ Démarrage ultra rapide
- ✅ Parfait pour tester et développer

**Démarrage :**

```powershell
# Méthode 1 : Script PowerShell (le plus simple)
.\start-backend-h2.ps1

# Méthode 2 : Manuellement
cd backend
mvn spring-boot:run
```

**Le backend démarre sur :** `http://localhost:8083`

#### Option B : Backend avec PostgreSQL (Base persistante)

**Avantages :**
- ✅ Données persistantes
- ✅ Production-ready
- ✅ Plus robuste

**Prérequis :**
- PostgreSQL installé et configuré
- Base `salesmanager` créée

**Démarrage :**

```powershell
# Méthode 1 : Script PowerShell
.\start-backend-postgresql.ps1

# Méthode 2 : Manuellement
cd backend
mvn spring-boot:run -Dspring.profiles.active=postgresql
```

**Le backend démarre sur :** `http://localhost:8082`

---

### ✅ Vérifier que le backend fonctionne

Une fois le backend démarré, ouvrez un **nouveau terminal** et testez :

```powershell
# Test de santé (Health Check)
curl http://localhost:8082/actuator/health

# Devrait retourner : {"status":"UP"}
```

**⚠️ Important :** Laissez ce terminal ouvert ! Le backend doit rester en cours d'exécution.

---

### 📱 Partie 2 : Démarrer l'Application Mobile

**Une fois le backend démarré**, dans un **nouveau terminal** :

#### Méthode 1 : Avec Expo Go (Recommandé pour débuter)

```powershell
# Aller dans le dossier mobile
cd mobile-expo

# Installer les dépendances (première fois seulement)
npm install

# Démarrer Expo
npm start
# ou
npx expo start
```

**Ce qui se passe :**
1. Expo démarre et affiche un **QR code**
2. **Option A** : Scanner avec **Expo Go** sur votre téléphone
3. **Option B** : Appuyer sur `a` pour ouvrir dans l'émulateur Android
4. **Option C** : Appuyer sur `i` pour ouvrir dans le simulateur iOS

#### Méthode 2 : Script automatique (Windows)

```powershell
cd mobile-expo
.\start-app.bat
```

#### Méthode 3 : Build natif Android (si Expo Go ne suffit pas)

```powershell
cd mobile-expo
npx expo run:android
```

---

## 🎯 Scénarios de Démarrage

### Scénario 1 : Démarrage Complet (Backend + Mobile)

**Étape 1 : Terminal 1 - Backend**
```powershell
# Dans la racine du projet
.\start-backend-h2.ps1
# Attendre : "Started SalesManagerApplication"
```

**Étape 2 : Terminal 2 - Mobile**
```powershell
cd mobile-expo
npm start
# Attendre le QR code ou l'URL
```

**Étape 3 : Tester**
- Ouvrir l'app sur téléphone/émulateur
- Se connecter avec : `admin` / `admin123`
- ✅ Ça fonctionne !

---

### Scénario 2 : Backend uniquement (pour tester l'API)

```powershell
# Démarrer le backend
.\start-backend-h2.ps1

# Dans un autre terminal, tester l'API
curl http://localhost:8082/actuator/health
curl -X POST http://localhost:8082/auth/signin -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
```

---

### Scénario 3 : Mobile uniquement (backend déjà démarré)

Si le backend est déjà lancé ailleurs (ou en production) :

```powershell
cd mobile-expo
npm start
```

**L'app se connectera automatiquement au backend configuré.**

---

## 🔍 Dépannage

### ❌ Le backend ne démarre pas

**Erreur : "Port already in use"**
```powershell
# Trouver le processus qui utilise le port
netstat -ano | findstr :8082
# Tuer le processus (remplacer PID par le numéro)
taskkill /PID [PID] /F
```

**Erreur : "Maven not found"**
```powershell
# Vérifier que Maven est installé
mvn -version
# Si non installé, télécharger depuis : https://maven.apache.org
```

**Erreur : "Java version incorrect"**
```powershell
# Vérifier la version Java
java -version
# Doit être Java 17 ou supérieur
```

### ❌ L'app mobile ne se connecte pas au backend

**Problème : URL incorrecte**

Vérifiez dans `mobile-expo/src/services/authService.ts` :

```typescript
const getApiUrls = () => {
  return [
    'http://192.168.1.16:8082',  // ← Votre IP locale
    // ou
    'http://localhost:8082',      // ← Pour émulateur
  ];
};
```

**Pour trouver votre IP locale :**
```powershell
ipconfig
# Chercher "IPv4 Address" sous votre carte réseau active
```

**Problème : Backend non accessible**

1. Vérifier que le backend est bien démarré
2. Vérifier le port (8082 pour PostgreSQL, 8083 pour H2)
3. Tester avec `curl http://localhost:8082/actuator/health`

**Problème : CORS**

Si vous avez des erreurs CORS, vérifiez la configuration dans `backend/src/main/resources/application.yml`

---

## 📊 Tableau de Référence Rapide

| Composant | Port | URL | Commande |
|-----------|------|-----|----------|
| **Backend H2** | 8083 | http://localhost:8083 | `.\start-backend-h2.ps1` |
| **Backend PostgreSQL** | 8082 | http://localhost:8082 | `.\start-backend-postgresql.ps1` |
| **Mobile Expo** | 19000 | http://localhost:19000 | `cd mobile-expo && npm start` |
| **Health Check** | - | http://localhost:8082/actuator/health | `curl http://localhost:8082/actuator/health` |

---

## 🎓 Commandes Utiles

### Backend

```powershell
# Compiler sans démarrer
cd backend
mvn clean compile

# Builder le JAR
mvn clean package

# Démarrer avec un profil spécifique
mvn spring-boot:run -Dspring.profiles.active=postgresql

# Voir les logs en détail
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dlogging.level.root=DEBUG"
```

### Mobile

```powershell
# Installer les dépendances
cd mobile-expo
npm install

# Nettoyer le cache
npx expo start --clear

# Builder pour Android
npx expo run:android

# Builder pour iOS (Mac uniquement)
npx expo run:ios

# Lancer les tests
npm test
```

---

## ✅ Checklist de Démarrage

### Avant de démarrer :

- [ ] Java 17+ installé (`java -version`)
- [ ] Maven installé (`mvn -version`)
- [ ] Node.js et npm installés (`node -v`, `npm -v`)
- [ ] Dépendances installées (`npm install` dans mobile-expo)

### Démarrage :

- [ ] Backend démarré (terminal 1)
- [ ] Backend accessible (test avec curl)
- [ ] Mobile démarré (terminal 2)
- [ ] App ouverte sur téléphone/émulateur
- [ ] Connexion réussie (admin/admin123)

### Après démarrage :

- [ ] Créer un produit de test
- [ ] Créer une vente de test
- [ ] Générer un reçu
- [ ] Vérifier les rapports

---

## 🎯 Identifiants par Défaut

```
Nom d'utilisateur : admin
Mot de passe      : admin123
```

**⚠️ Important :** Changez ces identifiants en production !

---

## 🚀 Script de Démarrage Automatique

Je vais créer un script qui démarre tout automatiquement :

```powershell
# Démarre backend + mobile en une commande
.\start-application-complete.ps1
```

**Fonctionnalités :**
- ✅ Vérifie les prérequis
- ✅ Démarre le backend (choix H2 ou PostgreSQL)
- ✅ Attend que le backend soit prêt
- ✅ Démarre l'app mobile
- ✅ Affiche les URLs et instructions

---

## 📖 Guides Complémentaires

- **`GUIDE_MIGRATION_POSTGRESQL.md`** - Passer de H2 à PostgreSQL
- **`GUIDE_DEPLOIEMENT_PRODUCTION.md`** - Déployer en production
- **`DEPLOIEMENT_RAPIDE.md`** - Déploiement rapide en 30 minutes

---

## 💡 Conseils

### Pour le développement :
- ✅ Utilisez **H2** (plus rapide, pas de configuration)
- ✅ Utilisez **Expo Go** (pas besoin de build natif)

### Pour la production :
- ✅ Utilisez **PostgreSQL** (données persistantes)
- ✅ Builder un **APK** ou **AAB** (pas Expo Go)

### Performance :
- ✅ Gardez le backend en cours d'exécution (pas besoin de redémarrer à chaque changement)
- ✅ L'app mobile se recharge automatiquement avec Expo

---

## 🎉 C'est Parti !

Vous êtes maintenant prêt à démarrer votre application Sales Manager !

**Prochaines étapes :**

1. ✅ Choisir votre méthode de démarrage
2. ✅ Démarrer le backend
3. ✅ Démarrer l'app mobile
4. ✅ Tester avec admin/admin123
5. ✅ Commencer à utiliser l'app !

**Besoin d'aide ?** Consultez les guides ou créez une issue ! 🚀

