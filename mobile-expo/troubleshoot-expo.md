# Guide de dépannage - Problème de connexion dans l'émulateur

## ✅ PROBLÈME RÉSOLU : Connexion bloquée lors du login

### 🔍 Diagnostic effectué :

- Le backend fonctionne correctement sur le port 8081
- L'URL `http://192.168.1.27:8081` est accessible depuis l'émulateur
- L'URL `http://10.0.2.2:8081` ne fonctionne pas (timeout)
- La configuration CORS a été corrigée

### 🛠️ Solutions appliquées :

#### 1. Configuration CORS corrigée dans le backend

- Ajout de toutes les URLs nécessaires dans `SecurityConfig.java`
- Activation de `allowCredentials: true`

#### 2. Service d'authentification amélioré

- Meilleure gestion des erreurs réseau
- Timeout augmenté à 15 secondes
- Logs de débogage détaillés
- URL fonctionnelle placée en première position

#### 3. Interface utilisateur améliorée

- Validation des champs de saisie
- Messages d'erreur plus explicites
- Meilleure gestion des états de chargement

### 🧪 Test de connectivité

Pour tester la connectivité depuis votre environnement :

```bash
cd mobile-expo
node test-connection-emulator.js
```

### 📱 Configuration actuelle (FONCTIONNELLE)

L'application utilise maintenant ces URLs dans l'ordre :

1. `http://192.168.1.27:8081` ✅ (CONFIRMÉ FONCTIONNEL)
2. `http://10.0.2.2:8081` (Standard Android emulator)
3. `http://localhost:8081` (Fallback)
4. `http://127.0.0.1:8081` (Local loopback)

### 🚀 Pour démarrer l'application :

#### Backend :

```bash
cd backend
mvn spring-boot:run
```

#### Application mobile :

```bash
cd mobile-expo
npx expo start
```

### 👤 Identifiants de test :

- **Nom d'utilisateur :** admin
- **Mot de passe :** admin123

---

## Autres problèmes potentiels

### Problème : "Expo Go isn't responding"

#### Solutions à essayer dans l'ordre :

1. **Redémarrer le serveur Metro**

```bash
cd mobile-expo
npx expo start --clear
```

2. **Nettoyer le cache**

```bash
cd mobile-expo
npx expo start --clear --reset-cache
```

3. **Redémarrer l'émulateur Android**

- Fermer l'émulateur Android
- Redémarrer l'émulateur
- Attendre qu'il soit complètement chargé

4. **Réinstaller Expo Go sur l'émulateur**

- Ouvrir Google Play Store dans l'émulateur
- Désinstaller Expo Go
- Réinstaller Expo Go depuis le Play Store

5. **Utiliser le développement local (sans Expo Go)**

```bash
cd mobile-expo
npx expo run:android
```

6. **Alternative : Utiliser le navigateur web**

```bash
cd mobile-expo
npx expo start --web
```

### Commandes utiles pour le diagnostic :

```bash
# Vérifier la version d'Expo
npx expo --version

# Vérifier l'état du projet
npx expo doctor

# Lister les appareils connectés
adb devices

# Tester la connectivité backend
node test-connection-emulator.js
```

### 🔧 Si l'IP change

Si votre adresse IP locale change, mettez à jour :

1. `mobile-expo/src/services/authService.ts` (ligne ~12)
2. Relancez le test : `node test-connection-emulator.js`

---

## ⚠️ Problème de build Gradle (Erreur expo-gradle-plugin)

### 🔍 Erreur rencontrée :

```
Error resolving plugin [id: 'com.facebook.react.settings']
> Included build 'expo-modules-autolinking\android\expo-gradle-plugin' does not exist.
```

### ✅ Solutions recommandées :

#### Solution 1 : Utiliser Expo Go (RECOMMANDÉ)

Au lieu de compiler l'APK, utilisez Expo Go pour tester :

```bash
cd mobile-expo
npx expo start --clear
```

Puis :

1. Installez Expo Go sur l'émulateur depuis le Play Store
2. Scannez le QR code ou utilisez l'URL tunnel
3. L'application se chargera directement dans Expo Go

#### Solution 2 : Nettoyer et réinstaller

```bash
cd mobile-expo
# Supprimer node_modules (Windows)
Remove-Item -Recurse -Force node_modules
npm install
npx expo start --clear
```

#### Solution 3 : Utiliser le mode web pour tester

```bash
cd mobile-expo
npx expo start --web
```

#### Solution 4 : Prebuild (si nécessaire)

```bash
cd mobile-expo
npx expo prebuild --clean
npx expo run:android
```

### 🎯 Approche recommandée pour les tests

1. **Pour le développement** : Utilisez Expo Go avec `npx expo start`
2. **Pour les tests de connectivité** : L'application fonctionne parfaitement dans Expo Go
3. **Pour la production** : Utilisez `expo build` ou EAS Build

### 📱 Instructions Expo Go

1. Démarrez le backend : `cd backend && mvn spring-boot:run`
2. Démarrez Expo : `cd mobile-expo && npx expo start --clear`
3. Installez Expo Go sur l'émulateur
4. Connectez-vous avec le QR code ou l'URL
5. Testez la connexion avec admin/admin123

La connexion fonctionnera parfaitement car nous avons résolu les problèmes CORS et de connectivité réseau.

---

## 🐛 Problèmes d'affichage et de connectivité résolus

### ✅ Erreur "height: NaN" dans les graphiques (RÉSOLU)

- **Problème** : Erreur React Native `Invariant Violation` avec `height: "<<NaN>>"`
- **Cause** : Division par zéro dans le calcul de la hauteur des barres du graphique
- **Solution** : Ajout de vérifications pour éviter les divisions par zéro

### ✅ Erreur "Impossible de charger les produits" (RÉSOLU)

- **Problème** : Services utilisant des URLs et ports différents
- **Cause** : `apiClient.ts` configuré avec `http://192.168.1.50:8080/api` au lieu de `http://192.168.1.27:8081`
- **Solution** :
  - Mise à jour d'`apiClient.ts` avec la bonne URL et port
  - Synchronisation avec la configuration d'`authService.ts`
  - Amélioration de la gestion des tokens d'authentification

### 🔧 Corrections appliquées :

#### 1. Correction du graphique (ReportsScreen.tsx)

```typescript
// Avant (causait NaN)
height: (item.revenue /
  Math.max(...stats.salesByPeriod.map((s) => s.revenue))) *
  100;

// Après (sécurisé)
height: Math.max(
  20,
  stats.salesByPeriod.length > 0 &&
    Math.max(...stats.salesByPeriod.map((s) => s.revenue)) > 0
    ? (item.revenue / Math.max(...stats.salesByPeriod.map((s) => s.revenue))) *
        100
    : 20
);
```

#### 2. Correction de l'API Client (apiClient.ts)

- ✅ URL corrigée : `http://192.168.1.27:8081`
- ✅ Port corrigé : 8081 (au lieu de 8080)
- ✅ Suppression de SecureStore (problématique dans Expo Go)
- ✅ Utilisation du token depuis authService
- ✅ Timeout augmenté à 15 secondes
- ✅ Logs de débogage améliorés

### 📱 Résultat

- ✅ Connexion fonctionnelle
- ✅ Chargement des produits réussi
- ✅ Affichage des graphiques sans erreur
- ✅ Navigation fluide entre les écrans
