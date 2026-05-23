# PRD Optimisé – Intégration Scanner Bluetooth SPP
## Pour implémentation via Cursor AI Agent Mode

---

> **Contexte applicatif existant**
> L'application React Native POS dispose déjà de : enregistrement des ventes/produits, gestion de stock avec alertes, notifications d'expiration produit, rapports (quotidien/hebdo/mensuel/annuel), génération PDF de tickets/reçus, comptabilité simplifiée, fonctionnement offline/online et interface multilingue (PT/Créole/FR). **Toute implémentation doit être non-régressive : zéro modification des services, hooks, composants ou entités existants.**

---

## 1. Objectif fonctionnel

Connecter un scanner physique Bluetooth utilisant le protocole **SPP (Serial Port Profile)** afin de :
1. Scanner un code-barres → créer ou retrouver un produit
2. Scanner un code-barres → ajouter le produit au panier de vente active
3. Fonctionner sans scanner photo (caméra)
4. Opérer en **100% offline** avec synchronisation différée

**Plateforme MVP : Android uniquement** (Bluetooth Classic requis)

---

## 2. Contraintes d'architecture non-régressive

```
RÈGLES ABSOLUES POUR CURSOR AI :
- Ne jamais modifier un fichier service, hook, composant ou entité existant
- Toute nouvelle logique = nouveaux fichiers uniquement
- Toute intégration dans un écran existant = via props optionnels ou composition
- Toute persistance = nouvelles colonnes ou tables SQLite via migration versionnée
- Aucune dépendance circulaire avec les modules existants
```

---

## 3. Stack technique

| Couche | Technologie |
|---|---|
| Mobile | React Native (version existante du projet) |
| Bluetooth | `react-native-bluetooth-classic` ^1.x |
| Stockage local | `react-native-sqlite-storage` (déjà présent) |
| Préférences | `@react-native-async-storage/async-storage` (déjà présent) |
| Backend | Spring Boot 3 / PostgreSQL 16 (existant) |

---

## 4. Structure de fichiers à créer

```
mobile/src/
├── bluetooth/
│   ├── BluetoothScannerService.ts       # Service principal SPP
│   ├── useBluetooth.ts                  # Hook React pour les composants
│   ├── ScannerParser.ts                 # Parsing des trames reçues
│   ├── scannerTypes.ts                  # Types TypeScript
│   └── scannerUtils.ts                  # Utilitaires (debounce, validation barcode)
│
├── screens/
│   └── BluetoothSettingsScreen.tsx      # Écran configuration scanner
│
├── components/bluetooth/
│   ├── ScannerStatusBar.tsx             # Bandeau statut permanent
│   ├── ScannerConnectButton.tsx         # Bouton connexion/déconnexion
│   └── UnknownBarcodeModal.tsx          # Modal "Produit inconnu → Créer"
│
└── hooks/
    └── useScannerEvent.ts               # Hook écoute des scans pour intégration POS
```

---

## 5. Types TypeScript (scannerTypes.ts)

```typescript
export type ScannerConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ERROR';

export interface BluetoothDevice {
  id: string;           // Adresse MAC
  name: string;
  bonded: boolean;
}

export interface ScanEvent {
  barcode: string;
  timestamp: number;
  deviceId: string;
}

export interface ScannerPreferences {
  favoriteDeviceId: string | null;
  autoReconnect: boolean;
  scanSuffix: 'LF' | 'CRLF';   // \n ou \r\n
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}
```

---

## 6. BluetoothScannerService.ts – Spécification complète

### Responsabilités
- Gérer le cycle de vie de la connexion SPP (connect / disconnect / reconnect)
- Lire le flux entrant caractère par caractère et émettre des `ScanEvent` complets
- Persister les préférences scanner dans AsyncStorage
- Émettre des événements via un `EventEmitter` interne (pas de state global)

### Contrat d'interface public

```typescript
class BluetoothScannerService {
  // Connexion
  async getPairedDevices(): Promise<BluetoothDevice[]>
  async connect(deviceId: string): Promise<void>
  async disconnect(): Promise<void>
  getConnectionState(): ScannerConnectionState
  getConnectedDevice(): BluetoothDevice | null

  // Événements
  onScan(listener: (event: ScanEvent) => void): () => void     // retourne unsubscribe
  onStateChange(listener: (state: ScannerConnectionState) => void): () => void

  // Préférences
  async loadPreferences(): Promise<ScannerPreferences>
  async savePreferences(prefs: Partial<ScannerPreferences>): Promise<void>
  async autoConnectFavorite(): Promise<boolean>               // retourne true si connecté

  // Nettoyage
  destroy(): void
}

export const scannerService = new BluetoothScannerService(); // singleton
```

### Règles d'implémentation critiques

```
1. PARSING : Buffer les caractères reçus jusqu'au suffixe (\n ou \r\n).
   Émettre le ScanEvent seulement quand le suffixe est détecté.
   Vider le buffer après émission.

2. DEBOUNCE : Ignorer tout scan identique dans les 500ms suivant le précédent
   (éviter double-scan matériel).

3. RECONNEXION : Si autoReconnect = true et deviceId favori défini,
   tenter reconnexion toutes les 5 secondes (max 3 tentatives consécutives),
   puis pause de 30 secondes avant de relancer le cycle.

4. PERMISSIONS : Vérifier BLUETOOTH_CONNECT + BLUETOOTH_SCAN avant toute
   opération. Si refusées, émettre état ERROR avec message explicite.

5. THREAD SAFETY : Toutes les émissions d'événements doivent transiter par
   le thread UI (utiliser DeviceEventEmitter ou callback sur le thread JS).
```

---

## 7. useBluetooth.ts – Hook React

```typescript
interface UseBluetoothReturn {
  connectionState: ScannerConnectionState;
  connectedDevice: BluetoothDevice | null;
  pairedDevices: BluetoothDevice[];
  isLoadingDevices: boolean;
  connect: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshPairedDevices: () => Promise<void>;
  preferences: ScannerPreferences;
  updatePreferences: (prefs: Partial<ScannerPreferences>) => Promise<void>;
}

export function useBluetooth(): UseBluetoothReturn
```

**Règles :**
- Appel unique à `scannerService` singleton
- `useEffect` pour s'abonner à `onStateChange` → nettoyage au démontage
- Pas de logique métier dans le hook (déléguer au service)

---

## 8. useScannerEvent.ts – Hook d'intégration POS

Ce hook est le **point d'entrée** pour les écrans existants (ventes, création produit).

```typescript
interface UseScannerEventOptions {
  onProductFound: (product: LocalProduct) => void;
  onProductNotFound: (barcode: string) => void;
  onScanError?: (error: string) => void;
  enabled?: boolean;    // Permet de désactiver sur certains écrans
}

export function useScannerEvent(options: UseScannerEventOptions): {
  lastScan: ScanEvent | null;
  isScanning: boolean;   // true pendant la recherche SQLite
}
```

### Workflow interne du hook

```
ScanEvent reçu
    │
    ▼
Recherche SQLite locale par barcode (via repository existant)
    │
    ├─ Trouvé ──► options.onProductFound(product)
    │
    └─ Non trouvé ──► options.onProductNotFound(barcode)
```

**Important :** Ce hook ne modifie pas directement le state des écrans existants. Il appelle des callbacks fournis par le parent.

---

## 9. Intégration dans les écrans existants

### 9.1 Écran de vente (NewSaleScreen ou équivalent)

**Modification minimale autorisée :** ajouter `useScannerEvent` dans le composant.

```typescript
// Dans le composant existant, AJOUTER uniquement :
const { lastScan } = useScannerEvent({
  onProductFound: (product) => {
    // Appeler la fonction existante d'ajout au panier
    addToCart(product);
    playSuccessSound();
  },
  onProductNotFound: (barcode) => {
    setUnknownBarcode(barcode);
    setShowCreateProductModal(true);
  },
  enabled: isScreenFocused,
});
```

### 9.2 Écran de création produit

```typescript
const { lastScan } = useScannerEvent({
  onProductFound: (product) => {
    // Produit déjà existant → naviguer vers édition
    navigation.navigate('EditProduct', { productId: product.id });
  },
  onProductNotFound: (barcode) => {
    // Préremplir le champ barcode du formulaire
    setValue('barcode', barcode);
  },
  enabled: true,
});
```

---

## 10. UnknownBarcodeModal.tsx – Spécification

```
Déclencheur : scan d'un barcode inconnu (depuis useScannerEvent)

Props :
  visible: boolean
  barcode: string            // Prérempli, non modifiable
  onCreateProduct: (data: QuickProductFormData) => void
  onDismiss: () => void

Champs du formulaire rapide :
  - Barcode (readonly, prérempli)
  - Nom du produit (requis)
  - Prix de vente (requis, numérique)
  - Quantité en stock (requis, entier)
  - Date d'expiration (optionnel, DatePicker)
  - Catégorie (optionnel, Picker)

Comportement :
  - Sauvegarde locale SQLite immédiate (sync_status = 'PENDING')
  - Fermeture automatique après sauvegarde
  - Affichage feedback succès (toast/snackbar)
  - Support i18n (PT/Créole/FR) obligatoire
```

---

## 11. BluetoothSettingsScreen.tsx – Spécification

```
Navigation : Paramètres → Scanner Bluetooth

Sections :
┌─────────────────────────────────┐
│  ÉTAT CONNEXION                 │
│  ● Connecté : [Nom Scanner]  ✅  │
│  ○ Déconnecté               ❌   │
│  ○ Connexion en cours...    ⏳   │
├─────────────────────────────────┤
│  SCANNERS APPAIRÉS              │
│  Liste FlatList des devices     │
│  bonded (getPairedDevices)      │
│  Bouton [Connecter] par device  │
├─────────────────────────────────┤
│  TEST DE SCAN                   │
│  Zone d'affichage dernier scan  │
│  Texte dernier barcode reçu     │
├─────────────────────────────────┤
│  PRÉFÉRENCES                    │
│  ☑ Reconnexion automatique      │
│  ☑ Son après scan               │
│  ☑ Vibration après scan         │
│  Suffixe : [LF / CRLF]         │
└─────────────────────────────────┘
```

---

## 12. ScannerStatusBar.tsx – Bandeau permanent

Composant à intégrer dans le layout principal (AppNavigator ou équivalent).

```typescript
// Affichage conditionnel : visible uniquement si scanner configuré
// Position : en haut ou en bas selon la navigation existante
// Contenu compact :
//   Icône Bluetooth [couleur selon état] + Nom device + Compteur scans session

interface ScannerStatusBarProps {
  compact?: boolean;   // Mode réduit pour topbar
}
```

---

## 13. Migrations SQLite

### Migration 001 – Colonne barcode sur products (si absente)

```sql
-- À exécuter une seule fois au démarrage (IF NOT EXISTS)
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)
  WHERE barcode IS NOT NULL;
```

### Migration 002 – Table préférences scanner

```sql
CREATE TABLE IF NOT EXISTS scanner_preferences (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Migration 003 – Table historique scans (MVP V2)

```sql
CREATE TABLE IF NOT EXISTS scan_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode     TEXT NOT NULL,
  product_id  TEXT,
  scan_result TEXT NOT NULL,   -- 'FOUND' | 'NOT_FOUND' | 'ERROR'
  context     TEXT NOT NULL,   -- 'SALE' | 'CREATE_PRODUCT' | 'TEST'
  device_id   TEXT,
  scanned_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_scan_history_barcode ON scan_history(barcode);
CREATE INDEX IF NOT EXISTS idx_scan_history_date ON scan_history(scanned_at);
```

**Règle :** Toutes les migrations doivent être idempotentes (`IF NOT EXISTS`).

---

## 14. Backend Spring Boot – Endpoint barcode

### Entité Product – Ajout colonne

```java
// Dans l'entité Product existante (AJOUTER uniquement, ne pas modifier)
@Column(name = "barcode", unique = true, length = 50)
private String barcode;
```

### Nouveau Repository (fichier séparé)

```java
// ProductBarcodeRepository.java
@Repository
public interface ProductBarcodeRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findByBarcodeAndOrganisationId(String barcode, UUID organisationId);
}
```

### Nouveau Controller (fichier séparé)

```java
// ProductBarcodeController.java
@RestController
@RequestMapping("/api/v1/products")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
public class ProductBarcodeController {

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<ApiResponse<ProductDto>> findByBarcode(
        @PathVariable String barcode,
        @AuthenticationPrincipal UserDetails user
    ) {
        // Déléguer à ProductBarcodeService (nouveau fichier)
    }
}
```

### Réponse JSON standard

```json
{
  "success": true,
  "data": {
    "id": "prod_001",
    "name": "Riz 5kg",
    "barcode": "6194001234567",
    "salePrice": 5000,
    "stockQuantity": 15,
    "expirationDate": "2025-12-31",
    "syncStatus": "SYNCED"
  },
  "error": null
}
```

---

## 15. Permissions Android (AndroidManifest.xml)

```xml
<!-- Bluetooth Classic (API < 31) -->
<uses-permission android:name="android.permission.BLUETOOTH"
    android:maxSdkVersion="30"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"
    android:maxSdkVersion="30"/>

<!-- Bluetooth Modern (API >= 31) -->
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"
    android:usesPermissionFlags="neverForLocation"
    tools:targetApi="s"/>

<!-- Localisation requise pour scan Bluetooth sur API < 31 -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"
    android:maxSdkVersion="30"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"
    android:maxSdkVersion="30"/>

<!-- Feature declaration -->
<uses-feature android:name="android.hardware.bluetooth" android:required="true"/>
```

### Demande runtime des permissions

```typescript
// bluetoothPermissions.ts – nouveau fichier utilitaire
export async function requestBluetoothPermissions(): Promise<boolean>
// Utiliser PermissionsAndroid de React Native
// Gérer API level 31+ (BLUETOOTH_CONNECT) vs API < 31 (ACCESS_FINE_LOCATION)
// Retourner true uniquement si toutes les permissions accordées
```

---

## 16. Internationalisation (i18n)

Toutes les chaînes UI de cette fonctionnalité doivent être ajoutées dans les fichiers i18n existants du projet :

```json
// À ajouter dans chaque fichier de traduction (PT/FR/Créole)
{
  "bluetooth": {
    "settings_title": "Scanner Bluetooth",
    "status_connected": "Connecté",
    "status_disconnected": "Déconnecté",
    "status_connecting": "Connexion...",
    "status_error": "Erreur Bluetooth",
    "paired_devices": "Scanners appairés",
    "no_devices": "Aucun scanner appairé",
    "connect_button": "Connecter",
    "disconnect_button": "Déconnecter",
    "test_scan": "Test de scan",
    "last_scan": "Dernier scan",
    "auto_reconnect": "Reconnexion automatique",
    "sound_enabled": "Son après scan",
    "vibration_enabled": "Vibration après scan",
    "scan_suffix": "Suffixe scan",
    "product_not_found": "Produit inconnu",
    "create_product_prompt": "Ce code-barres n'existe pas. Créer le produit ?",
    "scan_success": "Produit ajouté",
    "permission_denied": "Permission Bluetooth refusée"
  }
}
```

---

## 17. Gestion des erreurs et edge cases

| Scénario | Comportement attendu |
|---|---|
| Bluetooth désactivé au lancement | Toast informatif + bouton "Activer" |
| Permission refusée | Message explicite + lien Paramètres Android |
| Scanner déconnecté en cours de vente | Toast "Scanner déconnecté" + vente continue manuellement |
| Barcode vide ou malformé | Ignorer silencieusement (log debug uniquement) |
| Double scan < 500ms | Ignorer le second scan |
| Scan pendant modal ouvert | Ignorer jusqu'à fermeture modal |
| Offline + produit non trouvé localement | Créer localement (sync_status = 'PENDING') |
| Backend indisponible | Créer/utiliser données SQLite locales uniquement |

---

## 18. Plan d'implémentation Cursor AI (6 blocs séquentiels)

### Bloc 1 – Foundation Bluetooth (Semaine 1)

```
PROMPT CURSOR AI – Bloc 1 :
Installer react-native-bluetooth-classic et configurer les permissions Android.
Créer les fichiers :
  - mobile/src/bluetooth/scannerTypes.ts (types complets section 5)
  - mobile/src/bluetooth/scannerUtils.ts (debounce 500ms, validation barcode)
  - mobile/src/bluetooth/ScannerParser.ts (buffer + détection suffixe \n/\r\n)
  - mobile/src/bluetooth/BluetoothScannerService.ts (contrat section 6)
  - mobile/src/bluetooth/bluetoothPermissions.ts (section 15)
Mettre à jour AndroidManifest.xml avec les permissions section 15.
Ne modifier aucun fichier existant.
Tester : BluetoothScannerService.getPairedDevices() retourne la liste des devices.
```

### Bloc 2 – Hook et Settings Screen (Semaine 2)

```
PROMPT CURSOR AI – Bloc 2 :
Créer les fichiers :
  - mobile/src/bluetooth/useBluetooth.ts (section 7)
  - mobile/src/screens/BluetoothSettingsScreen.tsx (section 11)
  - mobile/src/components/bluetooth/ScannerConnectButton.tsx
Ajouter la route BluetoothSettings dans le navigator de Paramètres existant (modification minimale).
Utiliser les clés i18n section 16 (ajouter dans les fichiers de traduction).
Ne modifier aucun autre fichier existant.
Tester : Ouvrir l'écran, voir les scanners appairés, connecter/déconnecter.
```

### Bloc 3 – Intégration SQLite et hook POS (Semaine 3)

```
PROMPT CURSOR AI – Bloc 3 :
Créer les fichiers :
  - mobile/src/hooks/useScannerEvent.ts (section 8)
  - Appliquer les migrations SQLite section 13
Implémenter la recherche par barcode dans le repository produit existant
(nouvelle méthode findByBarcode uniquement, sans modifier le reste).
Tester : Scanner un barcode → recherche SQLite → callback onProductFound ou onProductNotFound.
```

### Bloc 4 – Intégration écran de vente (Semaine 4)

```
PROMPT CURSOR AI – Bloc 4 :
Intégrer useScannerEvent dans l'écran de vente existant (section 9.1).
Créer mobile/src/components/bluetooth/UnknownBarcodeModal.tsx (section 10).
Créer mobile/src/components/bluetooth/ScannerStatusBar.tsx (section 12).
Intégrer ScannerStatusBar dans le layout principal (modification minimale).
Tester workflow complet : scan → produit trouvé → ajout panier / produit inconnu → modal création.
```

### Bloc 5 – Backend Spring Boot (Semaine 5)

```
PROMPT CURSOR AI – Bloc 5 :
Ajouter la colonne barcode à l'entité Product existante (section 14 – AJOUTER uniquement).
Créer les nouveaux fichiers backend :
  - ProductBarcodeRepository.java
  - ProductBarcodeService.java
  - ProductBarcodeController.java
Créer la migration Flyway Vxx__add_barcode_to_products.sql.
Tester : GET /api/v1/products/barcode/{barcode} retourne ApiResponse<ProductDto>.
```

### Bloc 6 – Synchronisation et tests terrain (Semaine 6)

```
PROMPT CURSOR AI – Bloc 6 :
Implémenter la synchronisation des produits créés offline (sync_status = 'PENDING').
Déclencher la sync au retour de la connectivité réseau (NetInfo listener).
Ajouter sons (react-native-sound) et vibrations (Vibration API) optionnels.
Implémenter la reconnexion automatique (section 6, règle 3).
Tests avec scanner physique réel (Netum/Eyoyo/Zebra en mode SPP, suffixe \r\n).
```

---

## 19. Critères d'acceptation

| Critère | Mesure |
|---|---|
| Scan → ajout panier | < 1 seconde end-to-end |
| Reconnexion automatique | Reconnecté en < 10 secondes après coupure |
| Offline complet | 100% fonctionnel sans réseau |
| Zéro régression | Aucun test existant cassé |
| Permissions correctes | Android 10, 11, 12+ gérés |
| Double-scan évité | Debounce 500ms actif |
| Crash sur perte BT | Aucun crash, toast informatif uniquement |
| i18n | PT/Créole/FR complets |

---

## 20. Matériel compatible (tests recommandés)

| Scanner | Mode | Suffixe par défaut |
|---|---|---|
| Netum Bluetooth Scanner | SPP | `\r\n` |
| Eyoyo Bluetooth Scanner | SPP | `\r\n` |
| Zebra DS2278 | SPP / HID | Configurable |
| Tera HW0008 | SPP | `\r\n` |

> **Note :** Configurer le scanner en mode SPP (pas HID). Le suffixe `\r\n` est le plus courant — vérifier dans le manuel du scanner et aligner avec `ScannerPreferences.scanSuffix`.
