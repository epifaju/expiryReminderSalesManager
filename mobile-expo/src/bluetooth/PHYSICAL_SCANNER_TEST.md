# Tests terrain — scanners SPP (Bloc 6)

## Obligatoire : pas Expo Go

Le scanner Bluetooth **ne fonctionne pas dans Expo Go**. Utiliser le build natif :

```bash
cd mobile-expo
npx expo run:android
npx expo start --dev-client
```

Sur la tablette, ouvrir l’app **mobile-expo** (pas Expo Go). Package Android : `com.anonymous.mobileexpo`.

## Matériel compatible

| Scanner | Mode | Suffixe |
|---------|------|---------|
| Netum | SPP (pas HID) | `\r\n` (CRLF) |
| Eyoyo | SPP | `\r\n` |
| Zebra DS2278 | SPP | `\r\n` (vérifier config) |
| **Tera XL23 / 8100** | **SPP** (scanner le code « Bluetooth SPP » du manuel) | `\r\n` (CRLF) — appareil : **BarCode Scanner SPP** |

## Préparation

1. Appairer le scanner dans **Paramètres Android → Bluetooth**.
2. Dans l’app : **Paramètres → Scanner Bluetooth**.
3. Choisir le suffixe **CRLF** (défaut Bloc 6).
4. Activer **Reconnexion automatique** et **Son / Vibration** selon besoin.
5. Connecter le scanner depuis la liste des appareils appairés.

## Checklist

### Scan vente

- [ ] Onglet **Nouvelle vente** actif.
- [ ] Scan code connu → vibration/son + produit au panier &lt; 1 s.
- [ ] Scan code inconnu → vibration + modal création rapide.
- [ ] Double scan rapide (&lt; 500 ms) → un seul traitement.

### Offline / sync

- [ ] Mode avion ON → scan inconnu → création produit local (`pending`).
- [ ] Mode avion OFF → sync auto (produit visible API / panier si `server_id`).
- [ ] Vérifier logs `[ScannerConnectivity] Réseau disponible`.

### Reconnexion Bluetooth

- [ ] Scanner connecté → éteindre le scanner ou sortir de portée.
- [ ] Bandeau passe à **Déconnecté** (pas de crash).
- [ ] Rallumer : reconnexion en &lt; 10 s (3 tentatives × 5 s + pause 30 s max).

### Régression

- [ ] Scan caméra (bouton existant) toujours OK.
- [ ] `npm test -- --testPathPattern=scanner` vert.

## Dépannage

| Problème | Action |
|----------|--------|
| Caractères parasites | Passer LF ↔ CRLF dans les préférences |
| Aucun scan reçu | Vérifier mode SPP dans le manuel fabricant |
| Pas de son | `soundEnabled` ; retour haptique via expo-haptics |
| Sync échoue | Backend joignable, JWT valide, barcode unique côté API |
