import {
  extractRetailBarcode,
  gs1DateToIso,
  gtin14ToRetailBarcode,
  parseScannedBarcode,
} from '../gs1BarcodeParser';

describe('gs1BarcodeParser', () => {
  it('extrait GTIN et date depuis une chaîne GS1 type 01+17+10', () => {
    const raw = '01034009491339321727110010412096';
    const parsed = parseScannedBarcode(raw);

    expect(parsed.isGs1).toBe(true);
    expect(parsed.gtin14).toBe('03400949133932');
    expect(parsed.barcode).toBe('3400949133932');
    expect(parsed.expiryDate).toBe('2027-11-01');
    expect(parsed.lot).toBe('412096');
  });

  it('laisse un EAN-13 inchangé', () => {
    expect(extractRetailBarcode('3400949133932')).toBe('3400949133932');
  });

  it('convertit GTIN-14 en EAN-13', () => {
    expect(gtin14ToRetailBarcode('03400949133932')).toBe('3400949133932');
  });

  it('convertit AI 17 en date ISO', () => {
    expect(gs1DateToIso('271100')).toBe('2027-11-01');
  });
});
