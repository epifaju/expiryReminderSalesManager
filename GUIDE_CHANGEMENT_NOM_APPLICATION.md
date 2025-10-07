# 🏷️ Guide de Changement de Nom d'Application

## 🎯 Objectif

Changer le nom de votre application de **"Sales Manager"** vers **votre propre nom** avant le déploiement en production.

**Difficulté : ⭐ Facile**  
**Temps estimé : 10-15 minutes**

---

## ✅ Pourquoi changer le nom ?

- ✅ **Personnalisation** - Votre marque, votre nom
- ✅ **Marketing** - Nom unique et mémorable
- ✅ **Légal** - Éviter les conflits de marques
- ✅ **Play Store** - Nom unique requis pour publication

---

## 📝 Fichiers à Modifier

Voici TOUS les fichiers où le nom "Sales Manager" apparaît :

### 📱 Application Mobile (mobile-expo/)

1. **app.json** - Configuration principale Expo
2. **package.json** - Métadonnées npm
3. **Fichiers de traduction** :
   - `src/i18n/locales/fr.json`
   - `src/i18n/locales/pt.json`
   - `src/i18n/locales/cr.json`

### 🔧 Backend (backend/)

4. **pom.xml** - Métadonnées Maven
5. **Fichiers de messages** (optionnel) :
   - `src/main/resources/messages.properties`
   - `src/main/resources/messages_fr.properties`
   - `src/main/resources/messages_pt.properties`

### 📖 Documentation (racine)

6. **README.md** - Documentation principale
7. **Guides de déploiement** (optionnel)

---

## 🚀 Procédure de Changement

### Étape 1 : Choisir votre nouveau nom

**Exemples :**

- MonCommerce
- GestiVente
- StockPro
- VenteFacile
- [Votre nom ici]

**Conseils :**

- ✅ Court et mémorable
- ✅ Facile à prononcer
- ✅ Unique (vérifier sur Play Store)
- ✅ Sans espaces pour le package Android

---

### Étape 2 : Modifier l'application mobile

#### 2.1 Fichier `mobile-expo/app.json`

**Cherchez et remplacez :**

```json
{
  "expo": {
    "name": "Sales Manager Mobile", // ← CHANGER ICI
    "slug": "sales-manager", // ← ET ICI
    "android": {
      "package": "com.salesmanager.app" // ← ET ICI
    }
  }
}
```

**Exemple avec "MonCommerce" :**

```json
{
  "expo": {
    "name": "MonCommerce",
    "slug": "mon-commerce",
    "android": {
      "package": "com.moncommerce.app"
    }
  }
}
```

**⚠️ Important :**

- `name` : Le nom affiché à l'utilisateur
- `slug` : Utilisé par Expo (minuscules, tirets)
- `package` : Identifiant unique Android (domaine inversé)

#### 2.2 Fichier `mobile-expo/package.json`

**Cherchez :**

```json
{
  "name": "sales-manager-mobile", // ← CHANGER ICI
  "version": "1.0.0"
}
```

**Remplacez par :**

```json
{
  "name": "mon-commerce-mobile",
  "version": "1.0.0"
}
```

#### 2.3 Fichiers de traduction

**Fichier : `mobile-expo/src/i18n/locales/fr.json`**

Cherchez la section `"app"` :

```json
"app": {
  "name": "Sales Manager Mobile",   // ← CHANGER ICI
  "initialization": "Initialisation...",
  "loading": "⏳ Chargement...",
  "ready": "✅ App prête à utiliser"
}
```

Remplacez par :

```json
"app": {
  "name": "MonCommerce",
  "initialization": "Initialisation...",
  "loading": "⏳ Chargement...",
  "ready": "✅ App prête à utiliser"
}
```

**Répétez pour :**

- `mobile-expo/src/i18n/locales/pt.json`
- `mobile-expo/src/i18n/locales/cr.json`

---

### Étape 3 : Modifier le backend

#### 3.1 Fichier `backend/pom.xml`

**Cherchez :**

```xml
<groupId>com.salesmanager</groupId>
<artifactId>sales-manager-api</artifactId>
<version>1.0.0</version>
<name>sales-manager-api</name>
<description>API pour l'application de gestion de ventes et stock</description>
```

**Remplacez par (exemple MonCommerce) :**

```xml
<groupId>com.moncommerce</groupId>
<artifactId>moncommerce-api</artifactId>
<version>1.0.0</version>
<name>moncommerce-api</name>
<description>API pour MonCommerce - Gestion de ventes et stock</description>
```

**⚠️ Note :** Si vous changez le `groupId` et `artifactId`, vous devrez aussi renommer les packages Java (plus complexe). **Recommandation : Ne changez que `name` et `description`.**

#### 3.2 Fichiers de messages (optionnel)

Dans les fichiers `.properties`, cherchez toute mention de "Sales Manager" et remplacez.

---

### Étape 4 : Modifier la documentation

#### 4.1 README.md

Cherchez et remplacez toutes les occurrences de "Sales Manager" par votre nouveau nom.

#### 4.2 Autres fichiers (optionnel)

- Guides de déploiement
- Documentation utilisateur

---

## 🛠️ Script Automatique de Changement

Je vais créer un script PowerShell pour automatiser ce changement :

**Utilisation :**

```powershell
.\rename-application.ps1 -NewName "MonCommerce"
```

Le script changera automatiquement :

- ✅ app.json
- ✅ package.json
- ✅ Fichiers de traduction
- ✅ README.md
- ✅ Documentation

---

## ⚠️ Choses à NE PAS changer

### Ne changez PAS (sauf si vous savez ce que vous faites) :

1. **Packages Java** (`com.salesmanager.*`)

   - Cela nécessite de renommer tous les fichiers Java
   - Très complexe et risqué

2. **Noms de tables** en base de données

   - Peut casser les migrations existantes

3. **Endpoints API** (`/auth/signin`, etc.)
   - L'app mobile les utilise
   - Cassera la compatibilité

### Vous pouvez changer librement :

1. ✅ Nom affiché à l'utilisateur
2. ✅ Nom dans les stores
3. ✅ Slug Expo
4. ✅ Package Android
5. ✅ Description de l'app
6. ✅ Traductions

---

## 📋 Checklist de Changement

Après avoir changé le nom :

- [ ] `mobile-expo/app.json` → `name`, `slug`, `package` modifiés
- [ ] `mobile-expo/package.json` → `name` modifié
- [ ] `mobile-expo/src/i18n/locales/fr.json` → `app.name` modifié
- [ ] `mobile-expo/src/i18n/locales/pt.json` → `app.name` modifié
- [ ] `mobile-expo/src/i18n/locales/cr.json` → `app.name` modifié
- [ ] `backend/pom.xml` → `name` et `description` modifiés (optionnel)
- [ ] `README.md` → Mentions du nom modifiées (optionnel)

### Tester après changement :

- [ ] Lancer l'app mobile : `cd mobile-expo && npm start`
- [ ] Vérifier que le nouveau nom s'affiche
- [ ] Tester la connexion
- [ ] Tester les fonctionnalités
- [ ] Builder un APK de test

---

## 🎯 Exemple Complet

### Si vous voulez appeler votre app "GestiStock Pro"

#### Dans app.json :

```json
{
  "expo": {
    "name": "GestiStock Pro",
    "slug": "gestistock-pro",
    "android": {
      "package": "com.gestistock.pro"
    }
  }
}
```

#### Dans package.json :

```json
{
  "name": "gestistock-pro-mobile"
}
```

#### Dans fr.json :

```json
"app": {
  "name": "GestiStock Pro"
}
```

---

## 🔧 Utilisation du Script Automatique

**Script : `rename-application.ps1`**

```powershell
# Syntax
.\rename-application.ps1 -NewName "VotreNom"

# Exemples
.\rename-application.ps1 -NewName "MonCommerce"
.\rename-application.ps1 -NewName "GestiVente Pro"
.\rename-application.ps1 -NewName "StockManager"
```

Le script :

1. ✅ Demande confirmation
2. ✅ Crée une sauvegarde
3. ✅ Modifie tous les fichiers
4. ✅ Affiche un résumé des changements
5. ✅ Donne les prochaines étapes

---

## ⏰ Quand changer le nom ?

### ✅ Meilleur moment : AVANT le déploiement

- Pas d'utilisateurs impactés
- Pas de migration nécessaire
- Simple et propre

### ⚠️ Possible : APRÈS le déploiement

- Nécessite une nouvelle version
- Les utilisateurs doivent réinstaller
- Plus complexe

**Recommandation : Changez maintenant si vous voulez un nom différent !**

---

## 💡 Suggestions de Noms

Selon votre marque ou secteur :

### Commerce général :

- MonCommerce
- VentePro
- GestiVente
- CommerceManager

### Spécialisé Stock :

- StockPro
- GestiStock
- InventoryMaster
- StockManager

### Secteur alimentaire :

- FreshStock
- AlimentPro
- ExpiryManager

### Personnalisé :

- [VotreNom]Manager
- [VotreNom]Pro
- [VotreNom]Stock

---

## ✅ Vérification Post-Changement

### 1. Test local

```powershell
# Backend
cd backend
mvn clean compile
# Devrait compiler sans erreur

# Mobile
cd mobile-expo
npm start
# L'app devrait se lancer avec le nouveau nom
```

### 2. Vérifier les affichages

Ouvrez l'app mobile et vérifiez que le nouveau nom apparaît :

- Écran de login
- Header de chaque écran
- Écran "À propos"
- Paramètres

### 3. Build de test

```powershell
cd mobile-expo

# Build de test
eas build --platform android --profile preview

# Vérifier l'APK :
# - Nom du fichier
# - Nom affiché après installation
# - Icône de l'app
```

---

## 🎨 Bonus : Personnaliser davantage

Après avoir changé le nom, vous pouvez aussi :

### 1. Changer l'icône de l'app

Modifiez dans `app.json` :

```json
{
  "expo": {
    "icon": "./assets/icon.png", // Votre icône personnalisée
    "splash": {
      "image": "./assets/splash.png" // Votre splash screen
    }
  }
}
```

Créez vos images :

- `icon.png` : 1024x1024 pixels
- `splash.png` : 2048x2048 pixels (ou autre résolution)

### 2. Changer les couleurs du thème

Dans votre code, remplacez `#667eea` (bleu violet) par votre couleur de marque.

### 3. Personnaliser le slogan

Dans les fichiers i18n, modifiez :

```json
"about": {
  "tagline": "Votre slogan personnalisé ici"
}
```

---

## ⚠️ Attention : Package Android

Le **package Android** (`com.salesmanager.app`) est l'**identifiant unique** de votre app sur Play Store.

**Une fois publié sur Play Store, vous ne pouvez PLUS le changer !**

**Choisissez bien :**

- Format : `com.votredomaine.votreapp`
- Exemples :
  - `com.moncommerce.app`
  - `com.gestistock.pro`
  - `com.votreentreprise.ventes`

---

## 🎯 Résumé Rapide

### Changement minimal (5 minutes) :

```powershell
# 1. app.json
"name": "VotreNom"
"slug": "votre-nom"
"package": "com.votreapp.app"

# 2. Fichiers i18n (fr.json, pt.json, cr.json)
"app": { "name": "VotreNom" }

# 3. Tester
npm start
```

### Changement complet (15 minutes) :

```powershell
# Utiliser le script automatique
.\rename-application.ps1 -NewName "VotreNom"

# Le script fait tout pour vous !
```

---

## ✨ Après le Changement

### Vérifiez que tout fonctionne :

```powershell
# 1. Backend
cd backend
mvn clean compile
mvn spring-boot:run

# 2. Mobile
cd mobile-expo
npm start

# 3. Tester l'app
# Devrait afficher le nouveau nom partout
```

### Ensuite, déployez :

```powershell
# Suivre DEPLOIEMENT_RAPIDE.md
# Votre app aura maintenant son nouveau nom en production !
```

---

## 📞 Questions Fréquentes

### Q: Est-ce que ça casse quelque chose ?

**R:** Non ! Le changement de nom est purement cosmétique si vous suivez le guide.

### Q: Dois-je changer le code Java ?

**R:** Non ! Gardez `com.salesmanager.*` en Java. Changez seulement les noms affichés.

### Q: Puis-je changer après le déploiement ?

**R:** Oui, mais c'est plus compliqué. Mieux vaut le faire maintenant.

### Q: Le package Android doit correspondre au groupId Java ?

**R:** Non ! Ils peuvent être différents. Le package Android est juste un identifiant.

### Q: Combien de temps ça prend ?

**R:** 5-15 minutes selon si vous utilisez le script ou manuellement.

---

## 🎉 Conclusion

Changer le nom de votre application est **facile et recommandé** avant le déploiement !

**Prochaines étapes :**

1. ✅ Choisir votre nom
2. ✅ Exécuter `.\rename-application.ps1 -NewName "VotreNom"`
3. ✅ Tester que tout fonctionne
4. ✅ Déployer avec le nouveau nom !

**Votre application aura son identité propre ! 🚀**
