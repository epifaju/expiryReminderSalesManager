/**
 * Polyfill minimal pour uuid v4 dans ProductDAO / SaleDAO / SyncService.
 * Évite react-native-get-random-values (erreur « Native module not found » sans ExpoRandom).
 */
export function installCryptoPolyfill(): void {
  if (typeof global.crypto?.getRandomValues === 'function') {
    return;
  }

  const cryptoRef = global.crypto ?? {};
  cryptoRef.getRandomValues = <T extends ArrayBufferView>(array: T): T => {
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
  global.crypto = cryptoRef;
}
