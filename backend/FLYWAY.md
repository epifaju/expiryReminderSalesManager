# Flyway — migrations base de données

## Configuration

- **Dépendance** : `flyway-core` (Spring Boot 3.2 exécute Flyway au démarrage si activé)
- **Scripts** : `src/main/resources/db/migration/`
- **Profil `postgresql`** : Flyway activé (`application-postgresql.yml`)
- **Profils `default` (H2) et `test`** : Flyway désactivé (schéma géré par Hibernate `create-drop`)

### Paramètres Flyway (PostgreSQL)

| Propriété | Valeur |
|-----------|--------|
| `spring.flyway.baseline-on-migrate` | `true` |
| `spring.flyway.baseline-version` | `2` |
| `spring.jpa.hibernate.ddl-auto` | `none` |

Sur une base **déjà créée par Hibernate**, Flyway enregistre un baseline en version **2**, puis applique **V3 → V4 → V5** (dont `V5__add_barcode_to_products.sql`).

Sur une base **vide**, créer d’abord le schéma (démarrage unique avec `ddl-auto=update`, ou scripts manuels), puis relancer avec Flyway.

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
| V1–V2 | baseline | No-op (schéma legacy Hibernate) |
| V3 | `add_sync_conflicts_table` | Table `sync_conflicts` |
| V4 | `add_performance_indexes` | Index + colonne `barcode` si absente |
| V5 | `add_barcode_to_products` | Colonne `barcode` + index unique |

## Dépannage

- **Authentification PostgreSQL refusée** : ajuster `DB_USERNAME` / `DB_PASSWORD` ou les options `-Dflyway.user` / `-Dflyway.password`.
- **Table `users` introuvable** sur base vide : la base doit déjà contenir le schéma métier avant V3, ou utiliser `baseline-version` adapté après création manuelle des tables.
- **H2 / tests** : Flyway reste désactivé ; les tests JUnit utilisent Hibernate `create-drop`.
