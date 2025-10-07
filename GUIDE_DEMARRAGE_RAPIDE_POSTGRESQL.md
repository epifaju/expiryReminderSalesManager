# ⚡ Guide de Démarrage Rapide - PostgreSQL

## 🎯 Migration H2 → PostgreSQL en 5 minutes

Ce guide vous permet de passer rapidement de H2 à PostgreSQL.

---

## ✅ Prérequis

- [ ] PostgreSQL installé
- [ ] Service PostgreSQL démarré
- [ ] Base de données `salesmanager` créée

---

## 🚀 Démarrage Rapide

### Si PostgreSQL est déjà installé et configuré :

```powershell
# 1. Aller dans le dossier du projet
cd C:\Users\epifa\cursor-workspace\expiryReminder

# 2. Exécuter le script de démarrage
.\start-backend-postgresql.ps1
```

**C'est tout ! ✨**

---

## 🆕 Première installation (étapes complètes)

### Étape 1 : Installer PostgreSQL (une seule fois)

```powershell
# Ouvrir PowerShell en ADMINISTRATEUR
choco install postgresql

# OU télécharger et installer depuis :
# https://www.postgresql.org/download/windows/
```

### Étape 2 : Créer la base de données (une seule fois)

```powershell
# Ouvrir PowerShell normal
cd C:\Users\epifa\cursor-workspace\expiryReminder\backend

# Exécuter le script de setup
psql -U postgres -f setup-postgresql.sql

# Mot de passe par défaut : postgres
```

**Alternative manuelle :**

```powershell
psql -U postgres

# Dans psql, taper :
CREATE DATABASE salesmanager;
CREATE USER salesmanager WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE salesmanager TO salesmanager;
\c salesmanager
GRANT ALL ON SCHEMA public TO salesmanager;
\q
```

### Étape 3 : Démarrer le backend

```powershell
# Retourner à la racine du projet
cd C:\Users\epifa\cursor-workspace\expiryReminder

# Lancer le script
.\start-backend-postgresql.ps1
```

---

## 🔍 Vérification rapide

### Le backend démarre correctement si vous voyez :

```
✅ "Using dialect: org.hibernate.dialect.PostgreSQLDialect"
✅ "Started SalesManagerApplication in X.XXX seconds"
✅ "Tomcat started on port(s): 8082"
```

### ❌ Erreurs communes :

**Erreur 1 : "database salesmanager does not exist"**
→ Exécutez l'étape 2 (créer la base de données)

**Erreur 2 : "password authentication failed"**
→ Vérifiez le mot de passe dans setup-postgresql.sql

**Erreur 3 : "connection refused"**
→ PostgreSQL n'est pas démarré : `Start-Service postgresql-x64-14`

---

## 🔄 Commandes utiles

### Gérer le service PostgreSQL

```powershell
# Vérifier le statut
Get-Service -Name postgresql*

# Démarrer
Start-Service postgresql-x64-14

# Arrêter
Stop-Service postgresql-x64-14

# Redémarrer
Restart-Service postgresql-x64-14
```

### Se connecter à la base

```powershell
# En tant que salesmanager
psql -U salesmanager -d salesmanager

# En tant que postgres (admin)
psql -U postgres

# Commandes psql utiles :
\l              # Lister les bases de données
\c salesmanager # Se connecter à salesmanager
\dt             # Lister les tables
\d products     # Décrire la table products
\q              # Quitter
```

### Vérifier les données

```sql
-- Se connecter
psql -U salesmanager -d salesmanager

-- Compter les produits
SELECT COUNT(*) FROM products;

-- Lister les ventes
SELECT * FROM sales ORDER BY created_at DESC LIMIT 5;

-- Quitter
\q
```

---

## 💾 Sauvegarder vos données

### Export de la base (backup)

```powershell
# Exporter toute la base
pg_dump -U salesmanager salesmanager > backup_salesmanager.sql

# Exporter uniquement les données
pg_dump -U salesmanager --data-only salesmanager > backup_data.sql
```

### Restaurer depuis un backup

```powershell
# Restaurer
psql -U salesmanager -d salesmanager -f backup_salesmanager.sql
```

---

## 🔁 Retour à H2 (si nécessaire)

```powershell
# Utiliser le script H2
.\start-backend-h2.ps1

# OU avec Maven
cd backend
mvn spring-boot:run
# (si application.yml pointe vers H2)
```

---

## 📊 Comparaison rapide

| Fonctionnalité       | H2                       | PostgreSQL               |
| -------------------- | ------------------------ | ------------------------ |
| **Démarrage rapide** | ✅ Immédiat              | ⚠️ Requiert installation |
| **Persistance**      | ❌ Perdue au redémarrage | ✅ Données sauvegardées  |
| **Configuration**    | ✅ Aucune                | ⚠️ Base à créer          |
| **Production**       | ❌ Non recommandé        | ✅ Recommandé            |
| **Performance**      | ⚠️ Limitée               | ✅ Optimale              |

---

## ✅ Checklist de migration

- [ ] PostgreSQL installé
- [ ] Service PostgreSQL démarré
- [ ] Base de données `salesmanager` créée
- [ ] Utilisateur `salesmanager` créé
- [ ] Privilèges accordés
- [ ] Script `start-backend-postgresql.ps1` testé
- [ ] Backend démarre sans erreur
- [ ] Application mobile se connecte
- [ ] Données persistées après redémarrage

---

## 🎯 En résumé

### Pour migrer vers PostgreSQL :

1. **Installer PostgreSQL** (une fois)
2. **Créer la base** : `psql -U postgres -f backend/setup-postgresql.sql`
3. **Démarrer le backend** : `.\start-backend-postgresql.ps1`

**C'est fait ! Vos données sont maintenant persistées ! 🎉**

### Pour continuer avec H2 :

```powershell
.\start-backend-h2.ps1
```

---

## 💡 Conseil final

**Utilisez PostgreSQL si :**

- Vous voulez garder vos données
- Vous préparez une mise en production
- Vous avez plusieurs utilisateurs

**Utilisez H2 si :**

- Vous testez rapidement
- Vous ne voulez pas installer PostgreSQL
- Vous voulez un reset facile (redémarrage = données effacées)

---

**Votre projet est prêt pour PostgreSQL ! Suivez simplement les 3 étapes ci-dessus ! 🚀**
