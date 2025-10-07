# 📝 Exemple de Changement de Nom - Avant/Après

## 🎯 Scénario : Changer "Sales Manager" → "MonCommerce"

Voici exactement ce qui change dans chaque fichier.

---

## 📱 Fichier 1 : mobile-expo/app.json

### ❌ AVANT :

```json
{
  "expo": {
    "name": "Sales Manager Mobile",
    "slug": "sales-manager",
    "version": "1.0.0",
    "android": {
      "package": "com.salesmanager.app",
      "versionCode": 1
    }
  }
}
```

### ✅ APRÈS :

```json
{
  "expo": {
    "name": "MonCommerce",
    "slug": "mon-commerce",
    "version": "1.0.0",
    "android": {
      "package": "com.moncommerce.app",
      "versionCode": 1
    }
  }
}
```

**Changements :**

- `name` : "Sales Manager Mobile" → "MonCommerce"
- `slug` : "sales-manager" → "mon-commerce"
- `package` : "com.salesmanager.app" → "com.moncommerce.app"

---

## 📦 Fichier 2 : mobile-expo/package.json

### ❌ AVANT :

```json
{
  "name": "sales-manager-mobile",
  "version": "1.0.0",
  "main": "index.js"
}
```

### ✅ APRÈS :

```json
{
  "name": "mon-commerce-mobile",
  "version": "1.0.0",
  "main": "index.js"
}
```

**Changements :**

- `name` : "sales-manager-mobile" → "mon-commerce-mobile"

---

## 🌐 Fichier 3 : mobile-expo/src/i18n/locales/fr.json

### ❌ AVANT :

```json
{
  "app": {
    "name": "Sales Manager Mobile",
    "initialization": "Initialisation...",
    "loading": "⏳ Chargement...",
    "ready": "✅ App prête à utiliser"
  }
}
```

### ✅ APRÈS :

```json
{
  "app": {
    "name": "MonCommerce",
    "initialization": "Initialisation...",
    "loading": "⏳ Chargement...",
    "ready": "✅ App prête à utiliser"
  }
}
```

**Changements :**

- `app.name` : "Sales Manager Mobile" → "MonCommerce"

**⚠️ Répéter pour :**

- `mobile-expo/src/i18n/locales/pt.json`
- `mobile-expo/src/i18n/locales/cr.json`

---

## 🔧 Fichier 4 : backend/pom.xml

### ❌ AVANT :

```xml
<groupId>com.salesmanager</groupId>
<artifactId>sales-manager-api</artifactId>
<version>1.0.0</version>
<name>sales-manager-api</name>
<description>API pour l'application de gestion de ventes et stock</description>
```

### ✅ APRÈS :

```xml
<groupId>com.salesmanager</groupId>
<artifactId>sales-manager-api</artifactId>
<version>1.0.0</version>
<name>mon-commerce-api</name>
<description>API pour MonCommerce - Gestion de ventes et stock</description>
```

**Changements :**

- `name` : "sales-manager-api" → "mon-commerce-api"
- `description` : Mise à jour avec le nouveau nom

**⚠️ Note :** On garde `groupId` et `artifactId` pour éviter de casser le code Java.

---

## 👁️ Où le nom apparaîtra après changement

### Dans l'application mobile :

1. **Écran de connexion** : "🛍️ MonCommerce"
2. **Paramètres** : En-tête
3. **À propos** : "MonCommerce - Version 1.0.0"
4. **Écran de chargement** : "MonCommerce"
5. **Icône de l'app** sur le téléphone : "MonCommerce"

### Sur Play Store (si publié) :

- **Nom de l'app** : "MonCommerce"
- **Package** : com.moncommerce.app
- **URL** : play.google.com/store/apps/details?id=com.moncommerce.app

### Dans les logs backend :

- **Application name** : mon-commerce-api
- **Description** : API pour MonCommerce

---

## 🔍 Vérification Visuelle

### Avant le changement :

```
📱 Téléphone Android
┌─────────────────┐
│  🛍️             │
│  Sales Manager  │  ← Icône de l'app
│  Mobile         │
└─────────────────┘

Écran de login :
┌───────────────────────────────┐
│  🛍️ Sales Manager Mobile     │
│  Connexion                    │
│  ...                          │
└───────────────────────────────┘
```

### Après le changement (MonCommerce) :

```
📱 Téléphone Android
┌─────────────────┐
│  🛍️             │
│  MonCommerce    │  ← Nouveau nom !
│                 │
└─────────────────┘

Écran de login :
┌───────────────────────────────┐
│  🛍️ MonCommerce              │
│  Connexion                    │
│  ...                          │
└───────────────────────────────┘
```

---

## 🎨 Exemples de Noms Populaires

### Commerce Général :

```powershell
.\rename-application.ps1 -NewName "MonCommerce"
.\rename-application.ps1 -NewName "VentePro"
.\rename-application.ps1 -NewName "CommerceManager"
```

### Gestion de Stock :

```powershell
.\rename-application.ps1 -NewName "StockPro"
.\rename-application.ps1 -NewName "GestiStock"
.\rename-application.ps1 -NewName "InventoryMaster"
```

### Secteur Alimentaire :

```powershell
.\rename-application.ps1 -NewName "FreshStock"
.\rename-application.ps1 -NewName "AlimentPro"
.\rename-application.ps1 -NewName "ExpirySafe"
```

### Avec Package Personnalisé :

```powershell
# Spécifier le package Android manuellement
.\rename-application.ps1 -NewName "MonCommerce" -NewPackage "com.maboite.commerce"
```

---

## ✅ Après le Changement

### 1. Vérifier les fichiers modifiés

```powershell
# app.json
Get-Content mobile-expo/app.json | Select-String "name"

# Devrait afficher : "name": "MonCommerce"
```

### 2. Tester l'application

```powershell
cd mobile-expo
npm start
```

### 3. Vérifier visuellement

Ouvrir l'app et vérifier que "MonCommerce" apparaît :

- ✅ Écran de login
- ✅ Écran de paramètres
- ✅ Écran À propos

### 4. Builder un APK de test

```powershell
eas build --platform android --profile preview
```

Installer l'APK et vérifier :

- ✅ Nom de l'app sur le téléphone
- ✅ Nom dans l'app
- ✅ Tout fonctionne normalement

---

## 🔄 Annuler le Changement

Si vous voulez revenir en arrière :

```powershell
# Restaurer depuis la sauvegarde
Copy-Item backup_rename_YYYYMMDD_HHMMSS/* . -Force -Recurse

# Ou refaire le changement vers "Sales Manager"
.\rename-application.ps1 -NewName "Sales Manager Mobile"
```

---

## 💡 Conseils pour Choisir un Nom

### ✅ Bon nom :

- Court et mémorable
- Facile à prononcer
- Unique sur Play Store
- Représente votre activité
- Sans caractères spéciaux

### ❌ Éviter :

- Noms trop longs
- Caractères spéciaux (@, #, etc.)
- Noms déjà pris sur Play Store
- Noms génériques ("App", "Manager")
- Marques déposées

### 🔍 Vérifier la disponibilité :

1. **Play Store** : https://play.google.com/store/search?q=votre+nom
2. **Nom de domaine** : https://namecheap.com (si vous voulez un site web)
3. **Réseaux sociaux** : Instagram, Facebook, etc.

---

## 🎯 Checklist Finale

Après le changement de nom :

- [ ] app.json modifié avec nouveau nom, slug, package
- [ ] package.json modifié
- [ ] Fichiers i18n (fr, pt, cr) modifiés
- [ ] pom.xml modifié (optionnel)
- [ ] Application testée en local
- [ ] Nouveau nom s'affiche correctement
- [ ] APK de test buildé et testé
- [ ] Prêt pour déploiement en production

---

## ✨ Résultat

Votre application aura maintenant :

- ✅ **Son propre nom** partout
- ✅ **Son identité unique** sur Play Store
- ✅ **Son package Android** unique
- ✅ **Sa personnalité** propre

**C'est votre app, avec votre nom ! 🎉**

---

## 📞 Besoin d'aide ?

### Pour changer le nom :

```powershell
.\rename-application.ps1 -NewName "VotreNom"
```

### En cas de problème :

- Restaurer depuis le dossier `backup_rename_*`
- Consulter `GUIDE_CHANGEMENT_NOM_APPLICATION.md`
- Revérifier les fichiers manuellement

**Le changement de nom est simple et sûr ! 🚀**
