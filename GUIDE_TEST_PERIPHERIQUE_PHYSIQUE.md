# Guide pour tester l'application sur un périphérique physique Android

## 🔧 Prérequis

### 1. Activation du mode développeur sur Android

1. Allez dans **Paramètres** > **À propos du téléphone**
2. Appuyez **7 fois** sur "Numéro de build" ou "Version de build"
3. Retournez aux **Paramètres** > **Options pour les développeurs**
4. Activez **"Débogage USB"**
5. Activez **"Installer via USB"** (si disponible)

### 2. Vérification des pilotes USB (Windows)

- Assurez-vous que les pilotes USB de votre téléphone sont installés
- Pour Samsung : Samsung USB Driver
- Pour autres marques : pilotes spécifiques ou pilotes universels ADB

## 📱 Méthodes de test

### **Méthode A : Via câble USB (Recommandée)**

#### Étape 1 : Connecter le périphérique

```bash
# 1. Connectez votre téléphone via USB
# 2. Autorisez le débogage USB sur votre téléphone (popup)
# 3. Vérifiez la connexion :
adb devices
```

#### Étape 2 : Lancer l'application

```bash
cd mobile-expo
npx expo run:android --device
# Sélectionnez votre périphérique dans la liste
```

### **Méthode B : Via réseau Wi-Fi (Alternative)**

#### Étape 1 : Démarrer le serveur de développement

```bash
cd mobile-expo
npx expo start --tunnel
```

#### Étape 2 : Scanner le QR code

1. Installez **Expo Go** depuis Google Play Store
2. Ouvrez Expo Go sur votre téléphone
3. Scannez le QR code affiché dans le terminal
4. L'application se chargera automatiquement

### **Méthode C : Build APK pour installation directe**

#### Étape 1 : Créer un build de développement

```bash
cd mobile-expo
npx eas build --platform android --profile development
```

#### Étape 2 : Installer l'APK

```bash
# Une fois le build terminé, téléchargez l'APK et installez-le
adb install chemin/vers/votre/app.apk
```

## 🌐 Configuration réseau pour périphérique physique

### Vérification de l'adresse IP

```bash
# Vérifiez votre adresse IP actuelle
ipconfig | findstr "IPv4"
```

### Configuration automatique

L'application est déjà configurée pour tester plusieurs URLs :

1. `http://192.168.1.27:8081` (votre IP actuelle)
2. `http://10.0.2.2:8081` (émulateur)
3. `http://localhost:8081` (fallback)

### Si votre IP change

Si votre adresse IP change, mettez à jour les fichiers suivants :

- `mobile-expo/App.tsx`
- `mobile-expo/src/screens/DashboardScreen.tsx`
- `mobile-expo/src/screens/ProductsScreen.tsx`
- `mobile-expo/src/screens/SalesScreen.tsx`
- `mobile-expo/src/screens/ReportsScreen.tsx`

## 🔍 Dépannage

### Problème : Périphérique non détecté

```bash
# Vérifiez les périphériques connectés
adb devices

# Redémarrez le serveur ADB si nécessaire
adb kill-server
adb start-server
```

### Problème : Erreur de connexion au serveur

1. Vérifiez que le backend fonctionne : `http://192.168.1.27:8081`
2. Assurez-vous que le téléphone et l'ordinateur sont sur le même réseau Wi-Fi
3. Vérifiez le pare-feu Windows (autoriser le port 8081)

### Problème : Application ne se charge pas

1. Effacez le cache Expo : `npx expo r -c`
2. Redémarrez Metro : `npx expo start --clear`
3. Réinstallez l'application sur le téléphone

## 📋 Checklist de test

### ✅ Tests de base

- [ ] Connexion avec admin/admin123
- [ ] Navigation entre les onglets
- [ ] Chargement des données du dashboard

### ✅ Tests de fonctionnalités

- [ ] Ajout d'un nouveau produit
- [ ] Création d'une nouvelle vente
- [ ] Consultation des rapports
- [ ] Actions rapides du dashboard
- [ ] Alertes de stock faible

### ✅ Tests de connectivité

- [ ] Connexion au backend réussie
- [ ] Synchronisation des données
- [ ] Gestion des erreurs réseau

## 🚀 Commandes utiles

```bash
# Lancer sur périphérique spécifique
npx expo run:android --device [nom_du_périphérique]

# Voir les logs en temps réel
npx expo logs --platform android

# Nettoyer et relancer
npx expo r -c

# Build de production
npx eas build --platform android --profile production
```

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans le terminal
2. Consultez les logs du périphérique : `adb logcat`
3. Testez d'abord sur l'émulateur pour isoler le problème
