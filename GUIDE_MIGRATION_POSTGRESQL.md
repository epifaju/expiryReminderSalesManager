# 🔄 Guide Complet de Migration H2 vers PostgreSQL

## 📋 Vue d'ensemble

Votre application **Sales Manager** fonctionne actuellement avec **H2** (base de données en mémoire). Ce guide vous explique comment passer à **PostgreSQL** pour une solution de production avec persistance des données.

---

## ✅ Bonne nouvelle : Votre projet est déjà préparé !

Votre backend contient déjà :

- ✅ Driver PostgreSQL dans `pom.xml`
- ✅ Configuration PostgreSQL prête dans `application-postgresql.yml`
- ✅ Script SQL de setup dans `setup-postgresql.sql`
- ✅ Guide de migration existant

**Il suffit de suivre les étapes ci-dessous !**

---

## 🚀 Migration en 3 étapes simples

### Étape 1️⃣ : Installer PostgreSQL

#### Option A : Avec Chocolatey (recommandé pour Windows)

```powershell
# Ouvrir PowerShell en administrateur
choco install postgresql

# Démarrer le service
Start-Service postgresql-x64-14
```

#### Option B : Installation manuelle

1. Télécharger depuis : https://www.postgresql.org/download/windows/
2. Installer avec les options par défaut
3. **Notez le mot de passe** que vous créez pour l'utilisateur `postgres`

#### Vérification de l'installation :

```powershell
psql --version
# Devrait afficher : psql (PostgreSQL) 14.x ou supérieur
```

---

### Étape 2️⃣ : Créer la base de données

#### Option A : Avec le script fourni (recommandé)

```powershell
# Ouvrir PowerShell dans le dossier du projet
cd backend

# Se connecter à PostgreSQL (mot de passe par défaut: postgres)
psql -U postgres

# Dans l'invite psql, exécuter :
\i setup-postgresql.sql

# Quitter psql
\q
```

#### Option B : Manuellement

```sql
-- Se connecter à PostgreSQL
psql -U postgres

-- Créer la base de données
CREATE DATABASE salesmanager;

-- Créer l'utilisateur
CREATE USER salesmanager WITH PASSWORD 'password';

-- Accorder les privilèges
GRANT ALL PRIVILEGES ON DATABASE salesmanager TO salesmanager;

-- Se connecter à la base
\c salesmanager;

-- Accorder les privilèges sur le schéma
GRANT ALL ON SCHEMA public TO salesmanager;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO salesmanager;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO salesmanager;

-- Quitter
\q
```

#### Vérification :

```powershell
# Tester la connexion
psql -U salesmanager -d salesmanager

# Si ça fonctionne, vous êtes connecté ! Quittez avec \q
```

---

### Étape 3️⃣ : Modifier la configuration Spring Boot

Vous avez **2 options** :

#### Option A : Modifier application.yml (changement permanent)

Ouvrez `backend/src/main/resources/application.yml` et remplacez la section `datasource` :

**Avant (H2) :**

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driverClassName: org.h2.Driver
    username: sa
    password:
  h2:
    console:
      enabled: true
      path: /h2-console
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: create-drop
```

**Après (PostgreSQL) :**

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/salesmanager
    username: ${DB_USERNAME:salesmanager}
    password: ${DB_PASSWORD:password}
    driver-class-name: org.postgresql.Driver
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: update # Important : 'update' au lieu de 'create-drop'
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        jdbc:
          lob:
            non_contextual_creation: true
```

#### Option B : Utiliser le profil PostgreSQL (recommandé)

Ne modifiez pas `application.yml`, utilisez simplement le profil :

```powershell
# Démarrer avec le profil postgresql
cd backend
mvn spring-boot:run -Dspring.profiles.active=postgresql
```

Ou créez un script PowerShell `start-backend-postgresql.ps1` :

```powershell
Write-Host "🚀 Démarrage du backend Spring Boot avec PostgreSQL..." -ForegroundColor Green
Write-Host ""

cd backend

Write-Host "📦 Compilation Maven..." -ForegroundColor Yellow
mvn clean compile

Write-Host ""
Write-Host "🔧 Démarrage Spring Boot sur port 8082 avec PostgreSQL..." -ForegroundColor Cyan
mvn spring-boot:run -Dspring.profiles.active=postgresql

pause
```

---

## 🎯 Comparaison H2 vs PostgreSQL

| Caractéristique         | H2 (actuel)                       | PostgreSQL                   |
| ----------------------- | --------------------------------- | ---------------------------- |
| **Persistance**         | ❌ Données perdues au redémarrage | ✅ Données persistées        |
| **Performance**         | Bon pour dev/test                 | ✅ Excellent pour production |
| **Multi-utilisateurs**  | ⚠️ Limité                         | ✅ Support complet           |
| **Production ready**    | ❌ Non recommandé                 | ✅ Oui                       |
| **Scalabilité**         | ⚠️ Limitée                        | ✅ Excellente                |
| **Fonctionnalités SQL** | Basiques                          | ✅ Complètes                 |

---

## 🔍 Vérifier que tout fonctionne

### 1. Démarrer le backend

```powershell
cd backend
mvn spring-boot:run
# Ou avec profil : mvn spring-boot:run -Dspring.profiles.active=postgresql
```

### 2. Vérifier les logs

Cherchez dans les logs :

```
✅ BON : "HHH000400: Using dialect: org.hibernate.dialect.PostgreSQLDialect"
✅ BON : "Initialized JPA EntityManagerFactory for persistence unit 'default'"
❌ ERREUR : Si vous voyez "H2Dialect" → H2 est encore utilisé
```

### 3. Tester la connexion

```powershell
# Ouvrir un autre terminal
curl http://localhost:8082/auth/test
# Devrait retourner quelque chose sans erreur
```

### 4. Vérifier dans PostgreSQL

```sql
-- Se connecter à la base
psql -U salesmanager -d salesmanager

-- Lister les tables
\dt

-- Vous devriez voir : products, sales, users, etc.

-- Quitter
\q
```

---

## 🔧 Dépannage

### Problème 1 : PostgreSQL ne démarre pas

**Solution :**

```powershell
# Vérifier le service
Get-Service -Name postgresql*

# Démarrer le service
Start-Service postgresql-x64-14
```

### Problème 2 : "password authentication failed for user salesmanager"

**Solution :**

```sql
-- Se connecter en tant que postgres
psql -U postgres

-- Changer le mot de passe
ALTER USER salesmanager WITH PASSWORD 'password';

-- Ou utiliser des variables d'environnement
```

Puis dans PowerShell :

```powershell
$env:DB_USERNAME="salesmanager"
$env:DB_PASSWORD="votre_mot_de_passe"
mvn spring-boot:run
```

### Problème 3 : "database salesmanager does not exist"

**Solution :**

```sql
-- Se connecter en tant que postgres
psql -U postgres

-- Créer la base
CREATE DATABASE salesmanager;

-- Accorder les privilèges
GRANT ALL PRIVILEGES ON DATABASE salesmanager TO salesmanager;
```

### Problème 4 : Le backend utilise toujours H2

**Solution :**
Vérifier `application.yml` et s'assurer que la configuration PostgreSQL est active, ou utiliser le profil :

```powershell
mvn spring-boot:run -Dspring.profiles.active=postgresql
```

---

## 📊 Configuration PostgreSQL (Détails)

### Fichier : `application-postgresql.yml`

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/salesmanager
    username: ${DB_USERNAME:salesmanager}
    password: ${DB_PASSWORD:password}
    driver-class-name: org.postgresql.Driver

  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: update # Crée/met à jour les tables automatiquement
```

### Variables d'environnement (optionnel)

Pour plus de sécurité, utilisez des variables d'environnement :

```powershell
# PowerShell
$env:DB_USERNAME="mon_utilisateur"
$env:DB_PASSWORD="mon_mot_de_passe_securise"
mvn spring-boot:run
```

---

## 🔄 Revenir à H2 temporairement

Si vous voulez tester quelque chose rapidement avec H2 :

### Option 1 : Utiliser le profil test

```powershell
mvn spring-boot:run -Dspring.profiles.active=test
```

### Option 2 : Utiliser le script existant

```powershell
.\start-backend-h2.ps1
```

---

## 📈 Migration des données

### Si vous avez des données dans H2 à migrer :

1. **Exporter depuis H2** (avant de changer)

   ```sql
   -- Se connecter à la console H2
   -- http://localhost:8082/h2-console

   -- Exporter en SQL
   SCRIPT TO 'export.sql'
   ```

2. **Adapter le script** (si nécessaire)

   - H2 et PostgreSQL ont des syntaxes légèrement différentes
   - Modifier les types de données si besoin

3. **Importer dans PostgreSQL**
   ```powershell
   psql -U salesmanager -d salesmanager -f export.sql
   ```

### Note importante :

⚠️ Hibernate avec `ddl-auto: update` créera automatiquement les tables. Les données H2 seront perdues car H2 est "en mémoire". Pour une vraie migration, exportez d'abord vos données !

---

## ✨ Après la migration

### Vérifications finales :

1. ✅ PostgreSQL installé et démarré
2. ✅ Base `salesmanager` créée
3. ✅ Utilisateur `salesmanager` créé avec privilèges
4. ✅ Backend démarre sans erreur
5. ✅ Les tables sont créées automatiquement
6. ✅ L'application mobile se connecte correctement

### Tester avec l'application mobile :

1. Démarrer le backend avec PostgreSQL
2. Se connecter dans l'app mobile (admin / admin123)
3. Créer un produit
4. Créer une vente
5. **Redémarrer le backend**
6. Se reconnecter
7. ✅ **Les données sont toujours là !** (contrairement à H2)

---

## 🎯 Résumé des commandes

### Installation complète (première fois)

```powershell
# 1. Installer PostgreSQL
choco install postgresql

# 2. Démarrer le service
Start-Service postgresql-x64-14

# 3. Créer la base de données
psql -U postgres -f backend/setup-postgresql.sql

# 4. Démarrer le backend avec PostgreSQL
cd backend
mvn spring-boot:run -Dspring.profiles.active=postgresql
```

### Utilisation quotidienne

```powershell
# Démarrer PostgreSQL (si pas déjà démarré)
Start-Service postgresql-x64-14

# Démarrer le backend
cd backend
mvn spring-boot:run -Dspring.profiles.active=postgresql

# Ou simplement (si application.yml est modifié)
mvn spring-boot:run
```

---

## 📝 Fichiers importants

| Fichier                                                 | Description                          |
| ------------------------------------------------------- | ------------------------------------ |
| `backend/setup-postgresql.sql`                          | Script de création de la base        |
| `backend/src/main/resources/application.yml`            | Config H2 actuelle                   |
| `backend/src/main/resources/application-postgresql.yml` | Config PostgreSQL prête              |
| `backend/pom.xml`                                       | Dépendances (PostgreSQL déjà inclus) |
| `backend/POSTGRESQL_MIGRATION_GUIDE.md`                 | Guide existant                       |

---

## 💡 Recommandations

### Pour le développement :

- **H2** : Rapide, simple, idéal pour tests
- **PostgreSQL** : Comme en production, données persistées

### Pour la production :

- **PostgreSQL uniquement** : Fiable, performant, professionnel

### Solution hybride (recommandée) :

```yaml
# application.yml (dev avec H2)
spring:
  profiles:
    active: default  # Utilise H2 par défaut

# Lancer avec PostgreSQL quand nécessaire
mvn spring-boot:run -Dspring.profiles.active=postgresql
```

---

## 🎉 Avantages après migration

### ✅ Persistance

- Les données restent après redémarrage du serveur
- Plus de perte de données !

### ✅ Performance

- Meilleure gestion des transactions
- Optimisations de requêtes avancées

### ✅ Production-ready

- Base de données professionnelle
- Supportée par tous les hébergeurs

### ✅ Fonctionnalités avancées

- Index performants
- Contraintes d'intégrité
- Triggers et fonctions stockées

---

## 📞 Besoin d'aide ?

Si vous rencontrez des problèmes :

1. **Vérifier les logs** du backend Spring Boot
2. **Tester la connexion** PostgreSQL avec `psql`
3. **Vérifier le service** : `Get-Service postgresql*`
4. **Consulter** `backend/POSTGRESQL_MIGRATION_GUIDE.md`

---

## ✨ Conclusion

La migration vers PostgreSQL est **simple et rapide** grâce aux fichiers de configuration déjà présents dans votre projet !

**Recommandation** : Testez d'abord avec le profil PostgreSQL pour vous assurer que tout fonctionne, puis modifiez `application.yml` pour passer définitivement.

**Bon à savoir** : Vous pouvez toujours revenir à H2 pour des tests rapides en utilisant le profil `test` ou le script `start-backend-h2.ps1`.
