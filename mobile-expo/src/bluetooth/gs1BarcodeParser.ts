/**
 * Extraction du code produit (GTIN/EAN) depuis les scans GS1-128 / DataMatrix.
 * Ex. 01034009491339321727110010412096 → GTIN 03400949133932 → EAN-13 3400949133932
 */

export interface ParsedScannedBarcode {
  /** Code court pour recherche et champ formulaire (souvent EAN-13). */
  barcode: string;
  raw: string;
  gtin14?: string;
  expiryDate?: string;
  lot?: string;
  isGs1: boolean;
}

const GS1_AI_FIELD_LENGTH: Record<string, number> = {
  '00': 18,
  '01': 14,
  '02': 14,
  '17': 6,
};

/** Convertit GTIN-14 en code retail (EAN-13 en retirant le chiffre indicateur). */
export function gtin14ToRetailBarcode(gtin14: string): string {
  const digits = gtin14.replace(/\D/g, '');
  if (digits.length !== 14) {
    return digits;
  }
  return digits.startsWith('0') ? digits.slice(1, 14) : digits.slice(1, 14);
}

/** AI 17 : YYMMDD → YYYY-MM-DD (jour 00 → 01). */
export function gs1DateToIso(yymmdd: string): string | undefined {
  if (!/^\d{6}$/.test(yymmdd)) {
    return undefined;
  }
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = yymmdd.slice(2, 4);
  let dd = yymmdd.slice(4, 6);
  if (dd === '00') {
    dd = '01';
  }
  const year = yy >= 50 ? 1900 + yy : 2000 + yy;
  return `${year}-${mm}-${dd}`;
}

function parseGs1ElementString(digits: string): ParsedScannedBarcode {
  let index = 0;
  let gtin14: string | undefined;
  let expiryYYMMDD: string | undefined;
  let lot: string | undefined;

  while (index < digits.length - 1) {
    const ai = digits.substring(index, index + 2);
    index += 2;

    const fixedLen = GS1_AI_FIELD_LENGTH[ai];
    if (fixedLen !== undefined) {
      if (index + fixedLen > digits.length) {
        break;
      }
      const value = digits.substring(index, index + fixedLen);
      index += fixedLen;

      if (ai === '01' || ai === '02') {
        gtin14 = value;
      } else if (ai === '17') {
        expiryYYMMDD = value;
      }
      continue;
    }

    if (ai === '10') {
      lot = digits.substring(index);
      index = digits.length;
      continue;
    }

    // AI variable non géré : arrêter pour éviter de corrompre le GTIN
    break;
  }

  const barcode = gtin14 ? gtin14ToRetailBarcode(gtin14) : digits;

  return {
    barcode,
    raw: digits,
    gtin14,
    expiryDate: expiryYYMMDD ? gs1DateToIso(expiryYYMMDD) : undefined,
    lot,
    isGs1: Boolean(gtin14),
  };
}

/**
 * Nettoie et interprète un scan (EAN simple ou chaîne GS1 concaténée).
 */
export function parseScannedBarcode(raw: string): ParsedScannedBarcode {
  const cleaned = raw
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .trim();

  if (!cleaned) {
    return { barcode: '', raw: '', isGs1: false };
  }

  const firstSegment = cleaned.split('\x1D')[0]?.trim() || cleaned;
  const digitsOnly = firstSegment.replace(/\D/g, '');

  if (/^\d{8}$/.test(digitsOnly)) {
    return { barcode: digitsOnly, raw: cleaned, isGs1: false };
  }

  if (/^\d{12,13}$/.test(digitsOnly)) {
    return { barcode: digitsOnly, raw: cleaned, isGs1: false };
  }

  if (/^01\d{14}/.test(digitsOnly)) {
    return parseGs1ElementString(digitsOnly);
  }

  if (digitsOnly.length > 16) {
    const parsed = parseGs1ElementString(digitsOnly);
    if (parsed.isGs1) {
      return { ...parsed, raw: cleaned };
    }
  }

  return {
    barcode: firstSegment.length <= 48 ? firstSegment : firstSegment.slice(0, 48),
    raw: cleaned,
    isGs1: false,
  };
}

export function extractRetailBarcode(raw: string): string {
  return parseScannedBarcode(raw).barcode;
}

/** Variantes à tester côté API / catalogue (EAN-13, GTIN-14, GS1). */
export function barcodeLookupCandidates(raw: string): string[] {
  const set = new Set<string>();
  const primary = extractRetailBarcode(raw);
  if (primary) {
    set.add(primary);
  }
  const trimmed = raw.trim();
  if (trimmed) {
    set.add(trimmed);
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits) {
    set.add(digits);
    if (digits.length > 16 && digits.startsWith('01') && digits.length >= 16) {
      const gtin14 = digits.substring(2, 16);
      set.add(gtin14);
      if (gtin14.startsWith('0')) {
        set.add(gtin14.substring(1, 14));
      }
    }
    if (digits.length === 14 && digits.startsWith('0')) {
      set.add(digits.substring(1, 14));
    }
    if (digits.length === 13) {
      set.add(`0${digits}`);
    }
    const stripped = digits.replace(/^0+/, '');
    if (stripped) {
      set.add(stripped);
    }
  }
  return [...set];
}

export function barcodesEquivalent(a: string, b: string): boolean {
  if (!a || !b) {
    return false;
  }
  const ca = barcodeLookupCandidates(a);
  const cb = barcodeLookupCandidates(b);
  return ca.some((x) => cb.includes(x));
}
