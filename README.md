# Application de Gestion de Ventes et Stock

Une application mobile complète pour la gestion de ventes, stock et comptabilité avec support multilingue.

## Fonctionnalités

- ✅ Enregistrement des ventes et produits (avec scanner code-barres optionnel)
- ✅ Gestion de stock avec alertes produits bas
- ✅ Notifications d'expiration selon dates de péremption
- ✅ Rapports de ventes (quotidien, hebdomadaire, mensuel, annuel)
- ✅ Génération de tickets et reçus PDF
- ✅ Comptabilité simplifiée (entrées, sorties, bénéfices)
- ✅ Fonctionnement offline et online
- ✅ Support multilingue (Portugais, Créole, Français)

## Architecture

### Backend

- **Framework**: Spring Boot
- **Base de données**: PostgreSQL
- **Authentification**: JWT
- **API**: REST

### Frontend

- **Framework**: React Native
- **Styling**: Tailwind CSS (NativeWind)
- **Navigation**: React Navigation
- **État**: Redux Toolkit
- **Offline**: Redux Persist + AsyncStorage

## Structure du Projet

```
├── backend/                 # API Spring Boot
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── pom.xml
├── mobile/                  # Application React Native
│   ├── src/
│   ├── android/
│   ├── ios/
│   └── package.json
├── docs/                    # Documentation
└── README.md
```

## 🚀 Démarrage Rapide

### ⚡ Méthode Simple (3 commandes)

```powershell
# Terminal 1 - Backend
.\start-backend-h2.ps1

# Terminal 2 - Mobile (nouvelle fenêtre)
cd mobile-expo
npm start
```

**Identifiants par défaut :** `admin` / `admin123`

📖 **Guides disponibles :**
- ⚡ **[DEMARRAGE_RAPIDE.md](DEMARRAGE_RAPIDE.md)** - Guide ultra rapide (3 minutes)
- 📖 **[GUIDE_DEMARRAGE_APPLICATION.md](GUIDE_DEMARRAGE_APPLICATION.md)** - Guide complet avec toutes les options
- 🔧 **[GUIDE_MIGRATION_POSTGRESQL.md](GUIDE_MIGRATION_POSTGRESQL.md)** - Migration vers PostgreSQL
- 🚀 **[DEPLOIEMENT_RAPIDE.md](DEPLOIEMENT_RAPIDE.md)** - Déployer en production

### Méthode Manuelle

#### Backend

```bash
# Avec H2 (base en mémoire - recommandé pour débuter)
cd backend
mvn spring-boot:run

# Avec PostgreSQL (production)
mvn spring-boot:run -Dspring.profiles.active=postgresql
```

#### Mobile

```bash
cd mobile-expo
npm install        # Première fois uniquement
npm start          # Démarrer Expo
# ou
npx expo run:android  # Build natif Android
```

## Langues Supportées

- 🇫🇷 Français
- 🇵🇹 Portugais
- 🇭🇹 Créole Haïtien
