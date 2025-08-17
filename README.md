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

## Installation et Démarrage

### Backend

```bash
cd backend
mvn spring-boot:run
```

### Mobile

```bash
cd mobile
npm install
npx react-native run-android
# ou
npx react-native run-ios
```

## Langues Supportées

- 🇫🇷 Français
- 🇵🇹 Portugais
- 🇭🇹 Créole Haïtien
