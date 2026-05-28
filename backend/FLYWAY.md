# Flyway — migrations base de données

## Configuration

- **Dépendance** : `flyway-core` (Spring Boot 3.2 exécute Flyway au démarrage si activé)
- **Scripts** : `src/main/resources/db/migration/`
- **Profil `postgresql`** : Flyway activé (`application-postgresql.yml`)
- **Profil `h2`** : Flyway désactivé (schéma géré par Hibernate `update` sur un fichier H2)
- **Profil `test`** : Flyway désactivé (schéma géré par Hibernate `create-drop`)

### Paramètres Flyway (PostgreSQL)

| Propriété | Valeur |
|-----------|--------|
| `spring.flyway.baseline-on-migrate` | `false` |
| `spring.jpa.hibernate.ddl-auto` | `none` |

Sur une base **vide**, Flyway crée le schéma complet via **V1**, puis applique V2 → V6.

## Exécuter les migrations

### 1. Au démarrage Spring Boot (recommandé)

```bash
cd backend
set DB_USERNAME=votre_utilisateur
set DB_PASSWORD=votre_mot_de_passe
mvn spring-boot:run -Dspring-boot.run.profiles=postgresql
```

### 2. Ligne de commande Maven (sans démarrer l’API)

```bash
cd backend
mvn flyway:migrate -Ppostgresql ^
  -Dflyway.user=VOTRE_USER ^
  -Dflyway.password=VOTRE_MOT_DE_PASSE
```

Variables d’environnement (alignées sur `application-postgresql.yml`) :

```bash
set DB_USERNAME=salesmanager
set DB_PASSWORD=password
mvn flyway:migrate -Ppostgresql -Dflyway.user=%DB_USERNAME% -Dflyway.password=%DB_PASSWORD%
```

### 3. Vérifier l’état

```bash
mvn flyway:info -Ppostgresql -Dflyway.user=... -Dflyway.password=...
```

## Migrations disponibles

| Version | Fichier | Description |
|---------|---------|-------------|
| V1 | init schema | Schéma initial PostgreSQL (tables métier) |
| V2 | baseline continue | No-op (réservé compat legacy) |
| V3 | `add_sync_conflicts_table` | Table `sync_conflicts` |
| V4 | `add_performance_indexes` | Index + colonne `barcode` si absente |
| V5 | `add_barcode_to_products` | Colonne `barcode` + index unique |
| V6 | `add_preferred_currency_to_users` | Colonne `preferred_currency` |

## Dépannage

- **Authentification PostgreSQL refusée** : ajuster `DB_USERNAME` / `DB_PASSWORD` ou les options `-Dflyway.user` / `-Dflyway.password`.
- **Port PostgreSQL déjà utilisé** : modifier le mapping dans `backend/docker-compose.yml`.
- **H2 / tests** : Flyway reste désactivé ; les tests JUnit utilisent Hibernate `create-drop`.
