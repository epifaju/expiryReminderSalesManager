# Guide de Migration PostgreSQL

## Migration de H2 vers PostgreSQL - Terminée ✅

### Changements Effectués

1. **Configuration de l'application** ✅

   - `application.yml` : Mise à jour pour utiliser PostgreSQL au lieu de H2
   - `application-postgresql.yml` : Configuration spécifique PostgreSQL créée
   - Dialecte Hibernate changé vers `PostgreSQLDialect`
   - DDL auto configuré sur `update` pour préserver les données

2. **Dépendances Maven** ✅

   - PostgreSQL driver déjà présent dans `pom.xml`
   - H2 déplacé vers scope `test` uniquement
   - Compilation réussie confirmée

3. **Script de configuration** ✅
   - `setup-postgresql.sql` créé pour initialiser la base de données

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

### Configuration par Défaut

- **URL de base de données** : `jdbc:postgresql://localhost:5432/salesmanager`
- **Utilisateur** : `salesmanager` (configurable via `DB_USERNAME`)
- **Mot de passe** : `password` (configurable via `DB_PASSWORD`)
- **Port** : `5432` (port par défaut PostgreSQL)

### Démarrage de l'Application

1. **Avec PostgreSQL local** :

   ```bash
   cd backend
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

### Migration des Données Existantes

Si vous aviez des données en H2, elles seront perdues lors du passage à PostgreSQL. Pour migrer :

1. Exporter les données depuis H2 (si nécessaire)
2. Démarrer l'application avec PostgreSQL
3. Les tables seront créées automatiquement (DDL auto = update)
4. Réimporter les données si nécessaire

### Retour vers H2 (si nécessaire)

Pour revenir temporairement à H2 :

```bash
cd backend
mvn spring-boot:run -Dspring.profiles.active=test
```

### Vérification de la Migration

L'application est maintenant configurée pour utiliser PostgreSQL par défaut. La compilation Maven réussie confirme que toutes les dépendances sont correctement configurées.
