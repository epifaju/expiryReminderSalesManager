# Bluetooth SPP Scanner (Bloc 1)

Fondation scanner Bluetooth Classic (SPP) pour l’app **mobile-expo**.

> Le PRD référence `mobile/src/bluetooth/` ; dans ce dépôt le code source mobile actif est sous `mobile-expo/src/bluetooth/`.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `scannerTypes.ts` | Types, constantes, préférences |
| `scannerUtils.ts` | Debounce 500 ms, validation barcode |
| `ScannerParser.ts` | Buffer + suffixe `\n` / `\r\n` |
| `BluetoothScannerService.ts` | Service singleton `scannerService` |
| `bluetoothPermissions.ts` | Permissions Android runtime |

## Test unitaire (liste appairés)

```bash
cd mobile-expo
npm test -- src/bluetooth/__tests__/BluetoothScannerService.paired.test.ts
```

## Test sur appareil Android

1. Rebuild natif (module natif requis) :

```bash
cd mobile-expo
npx expo run:android
```

2. Appairer le scanner dans les paramètres Android Bluetooth.

3. Depuis un écran de debug (Bloc 2) ou la console Metro :

```javascript
import { scannerService } from './src/bluetooth';
const devices = await scannerService.getPairedDevices();
console.log(devices);
```

## Permissions

Déclarées dans `android/app/src/main/AndroidManifest.xml` (section 15 du PRD).

## Bloc 2 — Réglages UI

- `useBluetooth.ts`, `BluetoothSettingsScreen.tsx`, `ScannerConnectButton.tsx`
- Navigation : **Paramètres** → **Scanner Bluetooth**

## Bloc 3 — Intégration POS (SQLite)

- `src/hooks/useScannerEvent.ts` — scan → `findByBarcode` → callbacks
- `src/database/scannerSqlMigrations.ts` — migrations PRD §13
- `ProductDAO.findByBarcode()` — seule extension du DAO produit

```bash
npm test -- src/hooks/__tests__/useScannerEvent.test.tsx src/dao/__tests__/ProductDAO.findByBarcode.test.ts src/database/__tests__/scannerSqlMigrations.test.ts
```

## Bloc 6 — Sync offline, réseau, feedback, reconnexion

| Fichier | Rôle |
|---------|------|
| `../services/scanner/PendingProductSyncService.ts` | Push API des produits `sync_status=pending` |
| `../services/scanner/ScannerConnectivityCoordinator.ts` | NetInfo → sync + auto-connect scanner |
| `scannerFeedback.ts` | Vibration + retour haptique (son optionnel) |

- Suffixe par défaut : **CRLF** (`\r\n`) pour Netum / Eyoyo / Zebra SPP.
- Reconnexion : 3 × 5 s puis pause 30 s (PRD §6 règle 3).
- Tests terrain : [PHYSICAL_SCANNER_TEST.md](./PHYSICAL_SCANNER_TEST.md)

```bash
npm test -- --testPathPattern=scanner
```
