# Guide de Migration PostgreSQL

## Migration de H2 vers PostgreSQL

### Changements Effectués

1. **Configuration de l'application** ✅

   - `application.yml` : PostgreSQL par défaut (prod) + variables d’environnement (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`)
   - `application-postgresql.yml` : Configuration spécifique PostgreSQL créée
   - Hibernate `ddl-auto=none` (le schéma est géré par Flyway)
   - `application-h2.yml` : profil H2 fichier (export/backup) pour la migration de données

2. **Dépendances Maven** ✅

   - PostgreSQL driver déjà présent dans `pom.xml`
   - PostgreSQL driver présent dans `pom.xml`
   - H2 conservé en runtime pour l’outil de migration H2→Postgres (non utilisé en prod)

3. **Script de configuration** ✅
   - `setup-postgresql.sql` (optionnel) + `docker-compose.yml` (recommandé)

### Prérequis pour l'Utilisation

1. **Installation PostgreSQL**

   ```bash
   # Windows (avec Chocolatey)
   choco install postgresql

   # Ou télécharger depuis https://www.postgresql.org/download/
   ```

2. **Création de la base de données**

   ```bash
   # Se connecter à PostgreSQL en tant que superuser
   psql -U postgres

   # Exécuter le script de configuration
   \i backend/setup-postgresql.sql
   ```

3. **Variables d'environnement (optionnel)**
   ```bash
   export DB_USERNAME=salesmanager
   export DB_PASSWORD=password
   ```

### Configuration par défaut (prod)

- **URL de base de données** : `jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}`
- **Utilisateur** : `salesmanager` (configurable via `DB_USERNAME`)
- **Mot de passe** : `password` (configurable via `DB_PASSWORD`)
- **Port** : `5432` (port par défaut PostgreSQL)

### Migrations Flyway (schéma complet)

Les scripts SQL sont dans `src/main/resources/db/migration/` :
- **V1** : schéma initial PostgreSQL (tables métier)
- **V2 → V6** : évolutions (index, sync, barcode, devise)

Voir **[FLYWAY.md](FLYWAY.md)** pour exécuter `mvn flyway:migrate -Ppostgresql` ou lancer l’API avec le profil `postgresql` (Flyway s’exécute au démarrage).

### Démarrage de l'Application

1. **Avec PostgreSQL local** :

   ```bash
   cd backend
   set DB_USERNAME=salesmanager
   set DB_PASSWORD=password
   mvn spring-boot:run
   ```

2. **Avec configuration personnalisée** :
   ```bash
   cd backend
   DB_USERNAME=myuser DB_PASSWORD=mypass mvn spring-boot:run
   ```

### Avantages de PostgreSQL vs H2

- ✅ **Persistance des données** : Les données survivent aux redémarrages
- ✅ **Performance** : Meilleure performance pour les applications en production
- ✅ **Fonctionnalités avancées** : Support complet SQL, index, contraintes
- ✅ **Scalabilité** : Adapté pour la production et les gros volumes
- ✅ **Concurrent access** : Support multi-utilisateurs natif

### Migration des données H2 existantes (conservation)

#### Étape A — figer H2 dans un fichier (pour exporter)

1. Démarrer l’API une dernière fois avec le profil H2 fichier :

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

2. Vérifier que le fichier est créé dans `backend/data/h2/`.

#### Étape B — démarrer PostgreSQL + migrer schéma (Flyway)

```bash
cd backend
docker compose up -d
mvn spring-boot:run
```

#### Étape C — migrer les données H2 → PostgreSQL (outil)

```bash
cd backend
set H2_URL=jdbc:h2:file:./data/h2/salesmanager
set H2_USER=sa
set H2_PASSWORD=
set PG_URL=jdbc:postgresql://localhost:5432/salesmanager
set PG_USER=salesmanager
set PG_PASSWORD=password
mvn -q -DskipTests exec:java -Dexec.mainClass="com.salesmanager.tools.H2ToPostgresMigrator"
```

### Retour vers H2 (si nécessaire)

Pour revenir temporairement à H2 :

```bash
cd backend
mvn spring-boot:run -Dspring.profiles.active=test
```

### Vérification de la Migration

L'application est maintenant configurée pour utiliser PostgreSQL par défaut. La compilation Maven réussie confirme que toutes les dépendances sont correctement configurées.
