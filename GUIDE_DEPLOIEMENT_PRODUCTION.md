# 🚀 Guide de Déploiement en Production - Sales Manager

## 📋 Vue d'ensemble

Ce guide vous explique comment déployer votre application **Sales Manager** en production pour la rendre accessible aux utilisateurs.

Votre application se compose de :

- 🔧 **Backend** : Spring Boot (API REST)
- 📱 **Mobile** : React Native / Expo
- 🗄️ **Base de données** : PostgreSQL

---

## 🎯 Options de déploiement

### Option 1 : Déploiement Cloud Complet (Recommandé)

- Backend sur un serveur cloud
- Base de données PostgreSQL hébergée
- Application mobile publiée sur les stores

### Option 2 : Déploiement Serveur Local

- Backend sur votre propre serveur
- Accès via VPN ou IP publique
- Application mobile en mode "développement"

### Option 3 : Déploiement Hybride

- Backend cloud + Base de données cloud
- Distribution de l'APK directement (sans stores)

---

## 📱 Partie 1 : Déploiement de l'Application Mobile

### Option A : Publication sur Google Play Store (Android)

#### Prérequis :

- Compte développeur Google Play (25 USD, paiement unique)
- Application signée avec une clé de production

#### Étapes :

**1. Préparer l'application pour production**

```powershell
cd mobile-expo

# Mettre à jour app.json
```

Modifiez `mobile-expo/app.json` :

```json
{
  "expo": {
    "name": "Sales Manager",
    "slug": "sales-manager",
    "version": "1.0.0",
    "android": {
      "package": "com.salesmanager.app",
      "versionCode": 1,
      "permissions": ["CAMERA", "INTERNET", "VIBRATE"]
    }
  }
}
```

**2. Configurer l'URL de production**

Modifiez `mobile-expo/src/services/authService.ts` :

```typescript
const getApiUrls = () => {
  if (Platform.OS === "web") {
    return ["https://api.votredomaine.com"];
  } else {
    return [
      "https://api.votredomaine.com", // URL de production
      "http://192.168.1.16:8082", // Fallback local pour dev
    ];
  }
};
```

**3. Build pour production**

```powershell
# Avec EAS Build (Expo Application Services)
npm install -g eas-cli
eas login
eas build:configure

# Build Android
eas build --platform android --profile production

# Build iOS (nécessite compte Apple Developer - 99 USD/an)
eas build --platform ios --profile production
```

**4. Soumettre au Play Store**

```powershell
eas submit --platform android
```

### Option B : Distribution APK Direct (sans Play Store)

**1. Build l'APK**

```powershell
cd mobile-expo

# Build APK
eas build --platform android --profile preview

# Ou avec expo build (ancienne méthode)
expo build:android -t apk
```

**2. Distribuer l'APK**

- L'APK sera téléchargeable depuis EAS
- Partagez le lien de téléchargement
- Les utilisateurs installent manuellement

⚠️ **Attention** : Les utilisateurs devront autoriser "Sources inconnues" dans Android.

---

## 🔧 Partie 2 : Déploiement du Backend Spring Boot

### Option A : Hébergement Cloud (Recommandé)

#### 1. Heroku (Gratuit avec limitations)

**Configuration :**

Créez `Procfile` dans le dossier `backend/` :

```
web: java -jar target/sales-manager-api-1.0.0.jar --server.port=$PORT
```

**Déploiement :**

```powershell
# Installer Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Créer l'app
heroku create sales-manager-api

# Ajouter PostgreSQL
heroku addons:create heroku-postgresql:mini

# Configurer les variables
heroku config:set JWT_SECRET=votre_secret_jwt_tres_long_et_securise

# Déployer
cd backend
git init
git add .
git commit -m "Initial commit"
git push heroku master

# L'URL sera : https://sales-manager-api.herokuapp.com
```

#### 2. Railway.app (Simple et moderne)

**Déploiement :**

1. Créer un compte sur https://railway.app
2. Créer un nouveau projet
3. Connecter votre repo GitHub
4. Railway détecte automatiquement Spring Boot
5. Ajouter une base PostgreSQL
6. Configurer les variables d'environnement :
   - `JWT_SECRET` : Votre secret JWT
   - `SPRING_PROFILES_ACTIVE` : `postgresql`

**Configuration automatique** : Railway configure tout automatiquement !

#### 3. Render.com (Gratuit avec limitations)

1. Compte sur https://render.com
2. New Web Service
3. Connecter GitHub
4. Détection automatique de Spring Boot
5. Ajouter PostgreSQL database
6. Déployer

#### 4. AWS, Azure, Google Cloud (Production professionnelle)

**AWS Elastic Beanstalk** (exemple) :

```powershell
# Build JAR
cd backend
mvn clean package -DskipTests

# Déployer sur AWS
# Télécharger le JAR sur Elastic Beanstalk
# Configurer RDS PostgreSQL
# Configurer les variables d'environnement
```

### Option B : Serveur VPS (Linux)

**Avec DigitalOcean, Linode, ou OVH :**

**1. Préparer le serveur (Ubuntu/Debian)**

```bash
# Se connecter en SSH
ssh root@votre-serveur-ip

# Installer Java 17
sudo apt update
sudo apt install openjdk-17-jdk

# Installer PostgreSQL
sudo apt install postgresql postgresql-contrib

# Installer Maven
sudo apt install maven
```

**2. Configurer PostgreSQL**

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base
CREATE DATABASE salesmanager;
CREATE USER salesmanager WITH PASSWORD 'mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE salesmanager TO salesmanager;
\q
```

**3. Déployer le backend**

```bash
# Cloner votre repo ou transférer les fichiers
git clone votre-repo
cd expiryReminder/backend

# Build
mvn clean package -DskipTests

# Démarrer
java -jar target/sales-manager-api-1.0.0.jar
```

**4. Configurer comme service systemd**

Créer `/etc/systemd/system/salesmanager.service` :

```ini
[Unit]
Description=Sales Manager API
After=network.target

[Service]
Type=simple
User=salesmanager
WorkingDirectory=/home/salesmanager/backend
ExecStart=/usr/bin/java -jar target/sales-manager-api-1.0.0.jar
Restart=always

Environment="DB_USERNAME=salesmanager"
Environment="DB_PASSWORD=mot_de_passe_securise"
Environment="JWT_SECRET=votre_secret_jwt_tres_long"

[Install]
WantedBy=multi-user.target
```

**Activer le service :**

```bash
sudo systemctl enable salesmanager
sudo systemctl start salesmanager
sudo systemctl status salesmanager
```

**5. Configurer Nginx (reverse proxy)**

```bash
# Installer Nginx
sudo apt install nginx

# Créer la configuration
sudo nano /etc/nginx/sites-available/salesmanager
```

Configuration Nginx :

```nginx
server {
    listen 80;
    server_name api.votredomaine.com;

    location / {
        proxy_pass http://localhost:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Activer et démarrer :**

```bash
sudo ln -s /etc/nginx/sites-available/salesmanager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**6. Configurer HTTPS avec Let's Encrypt**

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir certificat SSL
sudo certbot --nginx -d api.votredomaine.com

# Renouvellement automatique déjà configuré
```

### Option C : Conteneurisation avec Docker

**1. Créer `Dockerfile` dans `backend/` :**

```dockerfile
FROM maven:3.8.6-openjdk-17-slim AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/sales-manager-api-1.0.0.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**2. Créer `docker-compose.yml` à la racine :**

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: salesmanager
      POSTGRES_USER: salesmanager
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8082:8082"
    environment:
      SPRING_PROFILES_ACTIVE: postgresql
      DB_USERNAME: salesmanager
      DB_PASSWORD: password
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/salesmanager
      JWT_SECRET: votre_secret_jwt_tres_long_et_securise
    depends_on:
      - postgres

volumes:
  postgres_data:
```

**3. Déployer avec Docker :**

```powershell
# Build et démarrer
docker-compose up -d

# Vérifier les logs
docker-compose logs -f backend

# Arrêter
docker-compose down
```

---

## 🗄️ Partie 3 : Base de Données en Production

### Option A : PostgreSQL Hébergé

#### 1. Heroku Postgres

```bash
heroku addons:create heroku-postgresql:mini
heroku config:get DATABASE_URL
```

#### 2. Railway PostgreSQL

- Ajoutez PostgreSQL dans votre projet Railway
- URL fournie automatiquement

#### 3. AWS RDS

- Créer une instance PostgreSQL
- Configurer les groupes de sécurité
- Noter l'endpoint

#### 4. DigitalOcean Managed Database

- Créer un cluster PostgreSQL
- Obtenir la chaîne de connexion
- Configurer le firewall

### Option B : PostgreSQL sur VPS

Configuration de sécurité :

```bash
# Écouter uniquement localhost par défaut
sudo nano /etc/postgresql/14/main/postgresql.conf
# listen_addresses = 'localhost'

# Configurer pg_hba.conf pour autoriser l'app
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Ajouter : host salesmanager salesmanager 127.0.0.1/32 md5

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

---

## 🔒 Partie 4 : Sécurité en Production

### Checklist de sécurité :

#### Backend :

1. **✅ Utiliser HTTPS obligatoirement**

   - Certificat SSL avec Let's Encrypt
   - Redirection HTTP → HTTPS

2. **✅ Changer le secret JWT**

   ```powershell
   # Générer un secret fort (64+ caractères)
   $env:JWT_SECRET="votre_secret_jwt_super_long_et_aleatoire_123456789"
   ```

3. **✅ Mots de passe de base de données forts**

   ```sql
   ALTER USER salesmanager WITH PASSWORD 'mot_de_passe_tres_securise_123!@#';
   ```

4. **✅ Désactiver les endpoints de debug**

   Dans `application.yml` (production) :

   ```yaml
   spring:
     jpa:
       show-sql: false # Désactiver les logs SQL
     h2:
       console:
         enabled: false # Désactiver console H2

   logging:
     level:
       com.salesmanager: INFO # Moins de logs
   ```

5. **✅ Configurer CORS correctement**

   ```yaml
   cors:
     allowed-origins:
       - https://votredomaine.com
       # Supprimer localhost en production
   ```

#### Base de données :

1. **✅ Sauvegardes automatiques**

   ```bash
   # Créer un script de backup quotidien
   0 2 * * * pg_dump -U salesmanager salesmanager > /backups/salesmanager_$(date +\%Y\%m\%d).sql
   ```

2. **✅ Limiter les accès réseau**
   - Autoriser uniquement le serveur backend
   - Firewall configuré

#### Application mobile :

1. **✅ Obfuscation du code**

   - ProGuard activé pour Android
   - Code minimisé

2. **✅ Stockage sécurisé**
   - Tokens dans AsyncStorage (déjà fait)
   - Ne jamais logger les mots de passe

---

## 🌐 Partie 5 : Configuration DNS et Domaine

### 1. Acheter un nom de domaine

- Namecheap, GoDaddy, OVH, etc.
- Ex : `salesmanager.com`

### 2. Configurer les DNS

```
Type  | Nom              | Valeur
------|------------------|------------------
A     | api              | IP_de_votre_serveur
A     | @                | IP_de_votre_serveur
CNAME | www              | salesmanager.com
```

### 3. Tester

```powershell
# Vérifier la résolution DNS
nslookup api.salesmanager.com

# Tester l'API
curl https://api.salesmanager.com/auth/test
```

---

## 📦 Partie 6 : Déploiement Étape par Étape (Solution Recommandée)

### Architecture recommandée :

```
┌─────────────────────────────────────────┐
│  Utilisateurs (smartphones)             │
└───────────────┬─────────────────────────┘
                │
                ↓
┌───────────────────────────────────────────┐
│  Application Mobile                       │
│  (APK ou Play Store)                      │
└───────────────┬───────────────────────────┘
                │ HTTPS
                ↓
┌───────────────────────────────────────────┐
│  Backend Spring Boot                      │
│  (Railway / Heroku / VPS)                 │
│  Port 8082 → 80/443                       │
└───────────────┬───────────────────────────┘
                │
                ↓
┌───────────────────────────────────────────┐
│  PostgreSQL Database                      │
│  (Managed DB ou VPS)                      │
└───────────────────────────────────────────┘
```

### Scénario : Déploiement sur Railway (Le plus simple)

**Étape 1 : Créer un compte Railway**

1. Aller sur https://railway.app
2. S'inscrire avec GitHub
3. Gratuit pour commencer (500h/mois)

**Étape 2 : Déployer le backend**

```powershell
# 1. Créer un repo GitHub pour votre projet (si pas déjà fait)
cd C:\Users\epifa\cursor-workspace\expiryReminder
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/votre-username/sales-manager.git
git push -u origin main

# 2. Sur Railway :
# - New Project
# - Deploy from GitHub repo
# - Sélectionner le dossier backend
# - Railway détecte automatiquement Spring Boot
```

**Étape 3 : Ajouter PostgreSQL**

Sur Railway :

1. Add Database → PostgreSQL
2. Railway génère automatiquement :
   - `DATABASE_URL`
   - Connexion configurée
3. Votre backend se connecte automatiquement !

**Étape 4 : Configurer les variables**

Dans Railway, ajouter :

```
JWT_SECRET=votre_secret_jwt_tres_long_et_securise_minimum_64_caracteres
SPRING_PROFILES_ACTIVE=postgresql
```

**Étape 5 : Obtenir l'URL publique**

Railway génère une URL comme :

```
https://sales-manager-api-production-xxxx.up.railway.app
```

**Étape 6 : Mettre à jour l'app mobile**

Dans `mobile-expo/src/services/authService.ts` :

```typescript
const getApiUrls = () => {
  return ["https://sales-manager-api-production-xxxx.up.railway.app"];
};
```

**Étape 7 : Rebuild l'app mobile**

```powershell
cd mobile-expo
eas build --platform android
```

---

## 🔄 Partie 7 : Workflow de Déploiement Continu

### Automatisation avec GitHub Actions

Créer `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up JDK 17
        uses: actions/setup-java@v2
        with:
          java-version: "17"
          distribution: "temurin"

      - name: Build with Maven
        run: |
          cd backend
          mvn clean package -DskipTests

      - name: Deploy to Railway
        run: |
          # Railway CLI deployment
          railway up
```

---

## 📊 Partie 8 : Monitoring et Maintenance

### Surveillance en production :

#### 1. Logs du backend

**Railway/Heroku :**

```powershell
# Railway CLI
railway logs

# Heroku CLI
heroku logs --tail
```

**VPS :**

```bash
# Logs systemd
journalctl -u salesmanager -f

# Logs fichier
tail -f /var/log/salesmanager/app.log
```

#### 2. Métriques

Activer Spring Boot Actuator (déjà dans votre projet) :

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always
```

Accéder à :

- `https://api.votredomaine.com/actuator/health`
- `https://api.votredomaine.com/actuator/metrics`

#### 3. Surveillance de la base de données

```sql
-- Connexions actives
SELECT count(*) FROM pg_stat_activity;

-- Taille de la base
SELECT pg_size_pretty(pg_database_size('salesmanager'));

-- Tables les plus volumineuses
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 💰 Partie 9 : Coûts Estimés

### Option Gratuite (Démarrage) :

| Service    | Coût    | Limitations                |
| ---------- | ------- | -------------------------- |
| Railway    | Gratuit | 500h/mois, 512MB RAM       |
| Heroku     | Gratuit | App en veille après 30min  |
| Render     | Gratuit | App en veille, limites CPU |
| APK Direct | Gratuit | Pas de Play Store          |

**Total : 0 € par mois** ✅

### Option Professionnelle :

| Service               | Coût/mois     | Avantages                         |
| --------------------- | ------------- | --------------------------------- |
| Railway Pro           | ~5-20 $       | Pas de veille, plus de ressources |
| DigitalOcean Droplet  | 6 $           | VPS complet, 1GB RAM              |
| Managed PostgreSQL    | 15 $          | DB hébergée, backups auto         |
| Google Play Developer | 25 $ (unique) | Publication Play Store            |

**Total : ~25-40 $ par mois**

### Option Entreprise :

| Service           | Coût/mois | Avantages                |
| ----------------- | --------- | ------------------------ |
| AWS EC2 + RDS     | 50-100 $  | Scalabilité, fiabilité   |
| Azure App Service | 50-100 $  | Support Microsoft        |
| Google Cloud Run  | 40-80 $   | Serverless, auto-scaling |

**Total : 50-150 $ par mois**

---

## ✅ Checklist de Déploiement

### Avant le déploiement :

- [ ] Code testé localement
- [ ] PostgreSQL fonctionne en local
- [ ] Tous les endpoints API testés
- [ ] Application mobile testée avec backend distant
- [ ] Variables d'environnement préparées
- [ ] Secret JWT généré (64+ caractères)
- [ ] Mots de passe sécurisés

### Backend :

- [ ] JAR buildé avec succès
- [ ] Profil de production configuré
- [ ] Base de données PostgreSQL prête
- [ ] Variables d'environnement configurées
- [ ] CORS configuré pour production
- [ ] HTTPS activé
- [ ] Logs configurés
- [ ] Healthcheck fonctionnel

### Application Mobile :

- [ ] URL de production dans le code
- [ ] Version incrémentée (app.json)
- [ ] Build de production réussi
- [ ] APK testé sur appareil réel
- [ ] Permissions Android correctes
- [ ] Icône et splash screen configurés

### Post-déploiement :

- [ ] Backend accessible via HTTPS
- [ ] Application mobile se connecte
- [ ] Authentification fonctionne
- [ ] CRUD produits fonctionne
- [ ] CRUD ventes fonctionne
- [ ] Génération de reçus fonctionne
- [ ] Données persistées après redémarrage
- [ ] Monitoring en place
- [ ] Backups configurés

---

## 🎯 Recommandation Finale

### Pour commencer RAPIDEMENT (aujourd'hui) :

**1. Déployer sur Railway :**

- Créer compte Railway
- Connecter GitHub
- Ajouter PostgreSQL
- Déployer → 10 minutes !

**2. Builder l'APK :**

```powershell
cd mobile-expo
eas build --platform android --profile preview
```

**3. Distribuer l'APK :**

- Télécharger l'APK depuis EAS
- Partager avec vos utilisateurs
- Installation manuelle

**Coût : 0 € - Application en production ! 🎉**

### Pour une solution PROFESSIONNELLE :

1. **VPS DigitalOcean** (6 $/mois)
2. **Managed PostgreSQL** (15 $/mois)
3. **Publication Play Store** (25 $ unique)

**Coût : ~21 $/mois + 25 $ initial**

---

## 📝 Scripts de Déploiement

J'ai créé des scripts pour vous aider :

1. **`start-backend-postgresql.ps1`** - Démarrage local avec PostgreSQL
2. **`verify-postgresql-setup.ps1`** - Vérification de la configuration
3. **`GUIDE_MIGRATION_POSTGRESQL.md`** - Migration détaillée
4. **`GUIDE_DEMARRAGE_RAPIDE_POSTGRESQL.md`** - Démarrage rapide

---

## 🆘 Support et Ressources

### Documentation :

- Spring Boot : https://spring.io/guides/gs/spring-boot/
- Expo EAS : https://docs.expo.dev/build/introduction/
- Railway : https://docs.railway.app/
- PostgreSQL : https://www.postgresql.org/docs/

### Communautés :

- Stack Overflow
- Discord Expo
- Reddit r/SpringBoot

---

## ✨ Conclusion

Votre application **Sales Manager** est prête pour la production !

**La route la plus simple :**

1. ☁️ **Railway** pour le backend (gratuit au début)
2. 🗄️ **Railway PostgreSQL** (inclus)
3. 📱 **APK Direct** ou **Play Store** pour l'app

**Temps estimé : 1-2 heures pour un déploiement complet !**

Besoin d'aide ? Consultez les guides détaillés ou contactez-moi ! 🚀
