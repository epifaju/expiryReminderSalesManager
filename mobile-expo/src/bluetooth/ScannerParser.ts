import { ScanSuffix } from './scannerTypes';
import { normalizeBarcode } from './scannerUtils';

/**
 * Buffer de caractères SPP jusqu'au suffixe configuré (\\n ou \\r\\n).
 */
export class ScannerParser {
  private buffer = '';

  constructor(private suffix: ScanSuffix = 'LF') {}

  setSuffix(suffix: ScanSuffix): void {
    this.suffix = suffix;
  }

  getSuffix(): ScanSuffix {
    return this.suffix;
  }

  /**
   * Ajoute un fragment reçu du flux SPP et retourne les codes-barres complets détectés.
   */
  feed(chunk: string): string[] {
    if (!chunk) {
      return [];
    }

    this.buffer += chunk;
    const completed: string[] = [];

    // Accepte LF, CRLF et CR seul (scanners SPP courants).
    let match = this.buffer.match(/\r\n|\n|\r/);
    while (match && match.index !== undefined) {
      const index = match.index;
      const delimLen = match[0].length;
      const rawLine = this.buffer.slice(0, index);
      this.buffer = this.buffer.slice(index + delimLen);
      const barcode = normalizeBarcode(rawLine);
      if (barcode) {
        completed.push(barcode);
      }
      match = this.buffer.match(/\r\n|\n|\r/);
    }

    return completed;
  }

  clear(): void {
    this.buffer = '';
  }
}
