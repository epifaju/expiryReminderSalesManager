# Sales Manager Mobile - React Native

Application mobile de gestion de ventes et stock développée avec React Native, Tailwind CSS (NativeWind), et Redux Toolkit.

## 🚀 Fonctionnalités

- ✅ Tableau de bord avec statistiques en temps réel
- ✅ Gestion des produits avec scanner code-barres
- ✅ Système de ventes complet
- ✅ Rapports et analyses détaillés
- ✅ Notifications d'expiration et stock faible
- ✅ Support multilingue (Français, Portugais, Créole)
- ✅ Fonctionnement offline/online avec synchronisation
- ✅ Interface moderne avec Tailwind CSS

## 🛠 Technologies Utilisées

- **React Native** 0.72.6
- **TypeScript** pour la sécurité des types
- **NativeWind** (Tailwind CSS pour React Native)
- **Redux Toolkit** pour la gestion d'état
- **React Navigation** pour la navigation
- **React Native Paper** pour les composants UI
- **Axios** pour les appels API
- **AsyncStorage** pour le stockage local

## 📱 Architecture

```
mobile/
├── src/
│   ├── components/          # Composants réutilisables
│   ├── screens/            # Écrans de l'application
│   │   ├── DashboardScreen.tsx
│   │   ├── ProductsScreen.tsx
│   │   ├── SalesScreen.tsx
│   │   ├── ReportsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── store/              # Redux store et slices
│   │   ├── index.ts
│   │   └── slices/
│   ├── services/           # Services API
│   ├── utils/              # Utilitaires
│   ├── i18n/              # Internationalisation
│   └── types/             # Types TypeScript
├── App.tsx                # Point d'entrée principal
├── global.css            # Styles Tailwind
└── package.json
```

## 🔧 Installation

### Prérequis

- Node.js >= 16
- React Native CLI
- Android Studio (pour Android)
- Xcode (pour iOS, macOS uniquement)

### Étapes d'installation

1. **Installer les dépendances**
   ```bash
   cd mobile
   npm install
   ```

2. **Configuration iOS (macOS uniquement)**
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Lancer l'application**
   
   Pour Android:
   ```bash
   npm run android
   ```
   
   Pour iOS:
   ```bash
   npm run ios
   ```

## 🔗 Connexion avec le Backend

L'application se connecte à l'API Spring Boot sur `http://localhost:8081`.

### Configuration de l'API

Modifiez l'URL de base dans `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://10.0.2.2:8081'; // Android Emulator
// const API_BASE_URL = 'http://localhost:8081'; // iOS Simulator
```

## 🌍 Support Multilingue

L'application supporte trois langues:
- 🇫🇷 Français (par défaut)
- 🇵🇹 Portugais
- 🇭🇹 Créole Haïtien

## 📊 Fonctionnalités Principales

### Tableau de Bord
- Statistiques en temps réel
- Alertes de stock et d'expiration
- Actions rapides
- Activité récente

### Gestion des Produits
- Liste des produits avec recherche
- Ajout/modification de produits
- Scanner de code-barres
- Gestion des stocks
- Alertes d'expiration

### Système de Ventes
- Création de ventes
- Gestion des clients
- Méthodes de paiement multiples
- Génération de reçus PDF

### Rapports
- Rapports de ventes (quotidien, hebdomadaire, mensuel)
- Analyses de bénéfices
- Statistiques des produits
- Export PDF/Excel

## 🔄 Migration depuis le Frontend Vanilla

Cette application React Native remplace le frontend web vanilla JavaScript existant avec:

1. **Interface moderne** avec Tailwind CSS
2. **Navigation native** optimisée pour mobile
3. **Gestion d'état centralisée** avec Redux
4. **Fonctionnalités offline** avec persistance
5. **Performance améliorée** avec React Native

## 🚧 État du Développement

- [x] Structure de base et navigation
- [x] Écran tableau de bord fonctionnel
- [x] Configuration Redux et persistance
- [x] Intégration Tailwind CSS
- [ ] Implémentation complète des écrans
- [ ] Intégration API backend
- [ ] Tests unitaires
- [ ] Déploiement

## 📝 Prochaines Étapes

1. Implémenter les services API
2. Développer les écrans de gestion des produits
3. Créer le système de ventes complet
4. Ajouter les fonctionnalités de rapports
5. Intégrer le scanner de code-barres
6. Implémenter l'internationalisation
7. Ajouter les tests
8. Optimiser les performances

## 🤝 Contribution

Pour contribuer au projet:

1. Fork le repository
2. Créer une branche feature
3. Commiter les changements
4. Pousser vers la branche
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.
