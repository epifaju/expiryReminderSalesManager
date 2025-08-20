# Guide de Dépannage - Build Android

## Problème Rencontré

Erreur lors du build Android : `Error resolving plugin [id: 'com.facebook.react.settings']`

## Solutions

### Solution 1 : Script Automatique (Recommandé)

Exécutez le script de correction automatique :

```powershell
cd mobile-expo
.\fix-android-build.ps1
```

### Solution 2 : Étapes Manuelles

#### 1. Nettoyer les caches

```powershell
# Supprimer node_modules
Remove-Item -Recurse -Force node_modules

# Supprimer package-lock.json
Remove-Item -Force package-lock.json

# Nettoyer les builds Android
Remove-Item -Recurse -Force android\build
Remove-Item -Recurse -Force android\app\build
```

#### 2. Réinstaller les dépendances

```powershell
npm install
```

#### 3. Nettoyer Gradle

```powershell
cd android
.\gradlew clean
```

#### 4. Tester le build

```powershell
.\gradlew assembleDebug
```

### Solution 3 : Si le problème persiste

#### Vérifier les versions

Assurez-vous que les versions dans `package.json` sont compatibles :

- `expo`: version récente
- `react-native`: compatible avec Expo
- `@expo/cli`: installé globalement

#### Réinstaller Expo CLI

```powershell
npm install -g @expo/cli
```

#### Vérifier Java et Android SDK

- Java 11 ou 17 installé
- Android SDK configuré
- Variables d'environnement JAVA_HOME et ANDROID_HOME définies

### Solution 4 : Alternative avec Expo Development Build

Si le build natif continue à poser problème, utilisez Expo Go :

```powershell
npx expo start
```

Puis scannez le QR code avec l'app Expo Go sur votre téléphone.

## Erreurs Communes et Solutions

### Erreur : "expo-modules-autolinking not found"

```powershell
npm install expo-modules-autolinking --save-dev
```

### Erreur : "React Native Gradle Plugin not found"

```powershell
npm install @react-native/gradle-plugin --save-dev
```

### Erreur : "Java version incompatible"

Installez Java 11 ou 17 et configurez JAVA_HOME.

## Vérification Post-Correction

Après avoir appliqué les corrections :

1. **Vérifier que le build fonctionne :**

   ```powershell
   cd android
   .\gradlew assembleDebug
   ```

2. **Tester l'application :**

   ```powershell
   npx expo run:android
   ```

3. **Vérifier la création de vente :**
   - Ouvrir l'app sur le téléphone
   - Aller dans "Nouvelle Vente"
   - Ajouter des produits
   - Créer une vente
   - Vérifier qu'aucune erreur n'apparaît

## Support

Si les problèmes persistent :

1. Vérifiez les logs détaillés avec `--stacktrace`
2. Consultez la documentation Expo
3. Vérifiez les issues GitHub d'Expo
