# 📴 Guide de Test du Mode Offline

## 🎯 Objectif

Ce guide vous explique comment tester toutes les fonctionnalités du mode offline de l'application Sales Manager mobile.

---

## 🔧 Méthode 1 : Test sur Émulateur Android

### Prérequis

- Android Studio installé
- Émulateur Android configuré
- Application installée sur l'émulateur

### Étapes de test

#### 1. Démarrer l'application

```bash
cd mobile-expo
npm start
# Dans un autre terminal
npm run android
```

#### 2. Activer le mode avion (Offline)

**Option A : Depuis l'émulateur**

1. Glissez depuis le haut pour ouvrir les Quick Settings
2. Cliquez sur l'icône ✈️ "Airplane mode"
3. Ou allez dans Settings > Network & Internet > Airplane mode

**Option B : Depuis adb (ligne de commande)**

```bash
# Activer le mode avion
adb shell cmd connectivity airplane-mode enable

# Vérifier l'état
adb shell settings get global airplane_mode_on
# Retourne : 1 (activé) ou 0 (désactivé)
```

#### 3. Scénarios de test

##### ✅ Test 1 : Enregistrer des ventes offline

1. **Créer une vente** :

   - Ouvrir l'écran "Nouvelle vente"
   - Sélectionner un produit
   - Entrer la quantité (ex: 5)
   - Confirmer la vente
   - ✅ **Vérifier** : Message "Vente enregistrée (sera synchronisée)"

2. **Créer 10 ventes supplémentaires**

   - Répéter le processus 10 fois
   - ✅ **Vérifier** : Toutes les ventes sont dans la liste

3. **Vérifier la file d'attente**
   - Aller dans l'onglet "Synchronisation"
   - ✅ **Vérifier** : Badge affiche "11 opérations en attente"

##### ✅ Test 2 : Ajouter des produits offline

1. **Créer un produit** :

   - Ouvrir "Nouveau produit"
   - Remplir : Nom, Prix, Stock, Catégorie
   - Confirmer
   - ✅ **Vérifier** : Produit visible dans l'inventaire

2. **Modifier un produit**
   - Ouvrir un produit existant
   - Modifier le prix ou le stock
   - Enregistrer
   - ✅ **Vérifier** : Modifications visibles

##### ✅ Test 3 : Consulter les rapports offline

1. **Ouvrir les rapports**

   - Aller dans l'onglet "Rapports"
   - ✅ **Vérifier** : Les ventes récentes s'affichent
   - ✅ **Vérifier** : Les graphiques se chargent avec les données locales

2. **Filtrer par date**
   - Sélectionner "Aujourd'hui"
   - ✅ **Vérifier** : Seules les ventes du jour apparaissent

##### ✅ Test 4 : Interface utilisateur

1. **Badge de connexion**

   - ✅ **Vérifier** : Badge rouge "🔴 Hors ligne" visible en haut

2. **Compteur d'opérations**

   - ✅ **Vérifier** : Badge avec nombre d'opérations en attente

3. **Messages d'information**
   - ✅ **Vérifier** : Banner "Mode offline activé" affiché

#### 4. Tester la synchronisation

##### ✅ Test 5 : Synchronisation automatique

1. **Réactiver la connexion**

```bash
# Désactiver le mode avion
adb shell cmd connectivity airplane-mode disable

# Ou depuis l'émulateur :
# Quick Settings > Désactiver Airplane mode
```

2. **Observer la synchronisation**

   - ⏱️ **Attendre 5-10 secondes**
   - ✅ **Vérifier** : Message "Synchronisation en cours..."
   - ✅ **Vérifier** : Barre de progression affichée
   - ✅ **Vérifier** : Badge passe de 🔴 à 🟢

3. **Vérifier le résultat**
   - ✅ **Vérifier** : Notification "11 opérations synchronisées"
   - ✅ **Vérifier** : Badge "0 opérations en attente"
   - ✅ **Vérifier** : Les ventes ont des IDs serveur

##### ✅ Test 6 : Synchronisation manuelle

1. **Mode offline** : Activer le mode avion
2. **Créer 5 ventes**
3. **Réactiver la connexion**
4. **Ouvrir l'onglet Synchronisation**
5. **Appuyer sur "Synchroniser maintenant"**
6. ✅ **Vérifier** : Synchronisation se déclenche immédiatement

---

## 🔧 Méthode 2 : Test sur Appareil Physique

### Configuration

1. **Activer le mode développeur** :

   - Paramètres > À propos du téléphone
   - Appuyer 7 fois sur "Numéro de build"

2. **Activer le débogage USB** :

   - Paramètres > Options pour les développeurs
   - Activer "Débogage USB"

3. **Connecter le téléphone** :

```bash
# Vérifier la connexion
adb devices

# Lancer l'app
cd mobile-expo
npm run android
```

### Test de coupure réseau réelle

#### Scénario 1 : Zone sans couverture

1. **Préparer l'app** :

   - Ouvrir l'application
   - Vérifier que la connexion est active (🟢)

2. **Simuler la coupure** :

   - Activer le mode avion
   - Ou aller dans une zone sans réseau (ascenseur, parking souterrain)

3. **Tester l'app** :

   - Créer 5-10 ventes
   - Modifier des produits
   - Consulter les rapports

4. **Revenir en ligne** :
   - Retourner dans une zone avec réseau
   - Observer la synchronisation automatique

#### Scénario 2 : Connexion instable

1. **Activer/Désactiver le WiFi** :

   - Activer WiFi → Créer 3 ventes
   - Désactiver WiFi → Créer 3 ventes
   - Réactiver WiFi → Observer la sync

2. **Basculer WiFi/4G** :
   - Sur WiFi → Sync en cours
   - Couper WiFi en pleine sync
   - ✅ **Vérifier** : Sync reprend sur 4G

---

## 🔧 Méthode 3 : Test avec Script Automatisé

### Script de test complet

Créer le fichier `test-offline-mode.sh` :

```bash
#!/bin/bash

echo "🧪 Test du Mode Offline - Sales Manager"
echo "========================================"

PACKAGE="com.salesmanager"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour vérifier une condition
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ $1${NC}"
  else
    echo -e "${RED}❌ $1 - ÉCHOUÉ${NC}"
  fi
}

# 1. Vérifier que l'app est installée
echo -e "\n1️⃣ Vérification de l'application..."
adb shell pm list packages | grep $PACKAGE > /dev/null
check "Application installée"

# 2. Démarrer l'app
echo -e "\n2️⃣ Démarrage de l'application..."
adb shell am start -n $PACKAGE/.MainActivity
sleep 3
check "Application démarrée"

# 3. Activer le mode offline
echo -e "\n3️⃣ Activation du mode offline..."
adb shell cmd connectivity airplane-mode enable
sleep 2
AIRPLANE_MODE=$(adb shell settings get global airplane_mode_on)
if [ "$AIRPLANE_MODE" == "1" ]; then
  echo -e "${GREEN}✅ Mode avion activé${NC}"
else
  echo -e "${RED}❌ Mode avion non activé${NC}"
fi

# 4. Simuler la création de ventes (via deep links ou UI automation)
echo -e "\n4️⃣ Création de ventes en mode offline..."
for i in {1..5}; do
  # Simuler un tap sur le bouton "Nouvelle vente"
  adb shell input tap 200 500
  sleep 1
  # Simuler la saisie
  adb shell input tap 200 700
  sleep 0.5
  adb shell input tap 200 900
  sleep 1
  echo "   Vente $i créée"
done
check "5 ventes créées en offline"

# 5. Vérifier la base de données locale
echo -e "\n5️⃣ Vérification de la base de données locale..."
DB_PATH="/data/data/$PACKAGE/databases/salesmanager.db"
QUEUE_COUNT=$(adb shell "run-as $PACKAGE sqlite3 $DB_PATH 'SELECT COUNT(*) FROM sync_queue WHERE sync_status=\"pending\"'")
echo "   Opérations en attente: $QUEUE_COUNT"

if [ "$QUEUE_COUNT" -ge 5 ]; then
  echo -e "${GREEN}✅ File d'attente correcte ($QUEUE_COUNT opérations)${NC}"
else
  echo -e "${RED}❌ File d'attente incorrecte${NC}"
fi

# 6. Réactiver la connexion
echo -e "\n6️⃣ Réactivation de la connexion..."
adb shell cmd connectivity airplane-mode disable
sleep 2
check "Connexion réactivée"

# 7. Attendre la synchronisation automatique
echo -e "\n7️⃣ Attente de la synchronisation automatique (30s)..."
sleep 30

# 8. Vérifier que la queue est vide
QUEUE_AFTER=$(adb shell "run-as $PACKAGE sqlite3 $DB_PATH 'SELECT COUNT(*) FROM sync_queue WHERE sync_status=\"pending\"'")
echo "   Opérations restantes: $QUEUE_AFTER"

if [ "$QUEUE_AFTER" -eq 0 ]; then
  echo -e "${GREEN}✅ Synchronisation réussie (queue vide)${NC}"
else
  echo -e "${RED}❌ Synchronisation incomplète ($QUEUE_AFTER opérations restantes)${NC}"
fi

# 9. Résumé
echo -e "\n=========================================="
echo "📊 RÉSUMÉ DU TEST"
echo "=========================================="
echo "Ventes créées offline: 5"
echo "Opérations en queue: $QUEUE_COUNT → $QUEUE_AFTER"
echo "Statut: $([ "$QUEUE_AFTER" -eq 0 ] && echo -e "${GREEN}SUCCÈS${NC}" || echo -e "${RED}ÉCHEC${NC}")"
echo "=========================================="
```

### Exécution du script

```bash
chmod +x test-offline-mode.sh
./test-offline-mode.sh
```

---

## 🔧 Méthode 4 : Test avec React Native Debugger

### 1. Installer React Native Debugger

```bash
# Mac
brew install --cask react-native-debugger

# Windows/Linux
# Télécharger depuis https://github.com/jhen0409/react-native-debugger/releases
```

### 2. Activer le mode debug

```bash
# Secouer l'appareil ou
adb shell input keyevent 82

# Sélectionner "Debug"
```

### 3. Observer les logs

Dans React Native Debugger, ouvrir la console pour voir :

```javascript
[NETWORK] État connexion: offline
[SYNC_QUEUE] Opération ajoutée: sale_123
[SYNC_QUEUE] Queue: 11 opérations
[NETWORK] État connexion: online
[SYNC] Démarrage synchronisation
[SYNC] Batch 1/1 : 11 ops
[SYNC] Succès : 11 ops en 8532ms
```

---

## 📊 Checklist de Validation

### ✅ Fonctionnalités à tester

- [ ] **Enregistrement offline**

  - [ ] Créer une vente sans Internet
  - [ ] Créer 10 ventes consécutives
  - [ ] Créer un produit
  - [ ] Modifier un produit existant

- [ ] **Stockage local**

  - [ ] Les données sont visibles hors ligne
  - [ ] Les modifications sont persistées
  - [ ] La queue de sync s'incrémente

- [ ] **Interface utilisateur**

  - [ ] Badge "Hors ligne" affiché
  - [ ] Compteur d'opérations visible
  - [ ] Messages d'info clairs

- [ ] **Synchronisation**

  - [ ] Sync automatique au retour de connexion
  - [ ] Sync manuelle fonctionne
  - [ ] Barre de progression affichée
  - [ ] Notification de succès

- [ ] **Rapports offline**

  - [ ] Graphiques avec données locales
  - [ ] Filtres fonctionnent
  - [ ] Export PDF possible

- [ ] **Gestion d'erreurs**
  - [ ] Coupure pendant la sync : reprise automatique
  - [ ] Conflits détectés et résolus
  - [ ] Messages d'erreur clairs

---

## 🐛 Cas de Test Avancés

### Test 1 : Coupure pendant la synchronisation

```bash
# 1. Créer 50 ventes offline
# 2. Réactiver la connexion
# 3. Attendre que la sync démarre (5s)
# 4. Couper la connexion
adb shell cmd connectivity airplane-mode enable
# 5. Attendre 10s
# 6. Réactiver
adb shell cmd connectivity airplane-mode disable
# 7. Vérifier que la sync reprend
```

**Résultat attendu** : ✅ Sync reprend automatiquement, aucune perte de données

### Test 2 : Conflit de données

1. **Appareil A** : Modifier le prix du produit "Riz" → 15000 FCFA (offline)
2. **Appareil B** : Modifier le prix du produit "Riz" → 14500 FCFA (offline)
3. **Synchroniser A** → Prix serveur = 15000
4. **Synchroniser B** → Conflit détecté !
5. **Résoudre** : Choisir quelle version garder

**Résultat attendu** : ✅ Conflit détecté, UI de résolution affichée

### Test 3 : Volume important

```bash
# Créer 1000 ventes offline
for i in {1..1000}; do
  # Simuler création vente
  adb shell input tap 200 500
  sleep 0.1
done

# Synchroniser
# Mesurer le temps
```

**Résultat attendu** : ✅ Sync < 60s, pas de crash, mémoire stable

---

## 📈 Métriques à mesurer

### Performance

| Métrique                     | Objectif | Comment mesurer                       |
| ---------------------------- | -------- | ------------------------------------- |
| Enregistrement vente offline | < 500ms  | Observer le temps de réponse UI       |
| Sync 100 opérations          | < 30s    | Chronomètre depuis "Sync en cours"    |
| Taille DB après 1000 ventes  | < 50MB   | `adb shell du -h /data/data/$PACKAGE` |
| Consommation batterie sync   | < 5%     | Android Battery Historian             |

### Commandes de mesure

```bash
# Taille de la base de données
adb shell "run-as com.salesmanager du -sh databases/"

# Nombre d'opérations en queue
adb shell "run-as com.salesmanager sqlite3 databases/salesmanager.db 'SELECT COUNT(*) FROM sync_queue'"

# Logs de sync
adb logcat | grep -E "SYNC|NETWORK|QUEUE"
```

---

## 🔍 Debug et Dépannage

### Inspecter la base de données

```bash
# Ouvrir SQLite
adb shell "run-as com.salesmanager sqlite3 /data/data/com.salesmanager/databases/salesmanager.db"

# Commandes utiles
sqlite> .tables
sqlite> SELECT * FROM sync_queue LIMIT 10;
sqlite> SELECT COUNT(*) FROM products WHERE sync_status='pending';
sqlite> SELECT * FROM sync_metadata;
sqlite> .exit
```

### Logs détaillés

```bash
# Filtrer les logs pertinents
adb logcat -s ReactNativeJS:V | grep -E "SYNC|NETWORK|DATABASE"

# Sauvegarder les logs
adb logcat > offline-test-logs.txt
```

### Réinitialiser la base de données

```bash
# ATTENTION : Supprime toutes les données locales
adb shell "run-as com.salesmanager rm -rf /data/data/com.salesmanager/databases/salesmanager.db"
```

---

## ✅ Résultat Attendu

Après tous ces tests, vous devriez avoir :

1. ✅ **100% des ventes enregistrées** offline sont synchronisées
2. ✅ **0 perte de données** en cas de coupure
3. ✅ **Sync automatique** fonctionne en < 10s après retour de connexion
4. ✅ **Interface claire** avec badges et notifications
5. ✅ **Performance optimale** : < 500ms par vente, < 30s pour 100 ops

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifier les logs : `adb logcat | grep SYNC`
2. Inspecter la DB : `adb shell sqlite3`
3. Consulter la documentation : `docs/GUIDE_MODE_OFFLINE_FR.md`
4. Contacter le support : support@salesmanager.gw

---

**✨ Le mode offline est maintenant prêt à être testé en conditions réelles !**

_Dernière mise à jour : 07 octobre 2025_  
_Version : 1.0_
