import { ScannerParser } from '../ScannerParser';

describe('ScannerParser', () => {
  it('détecte un suffixe LF', () => {
    const parser = new ScannerParser('LF');
    expect(parser.feed('1234567890123\n')).toEqual(['1234567890123']);
    expect(parser.feed('')).toEqual([]);
  });

  it('détecte un suffixe CRLF', () => {
    const parser = new ScannerParser('CRLF');
    expect(parser.feed('ABC\r\nDEF\r\n')).toEqual(['ABC', 'DEF']);
  });

  it('bufferise les fragments partiels', () => {
    const parser = new ScannerParser('LF');
    expect(parser.feed('1234')).toEqual([]);
    expect(parser.feed('567\n890')).toEqual(['1234567']);
    expect(parser.feed('\n')).toEqual(['890']);
  });

  it('accepte un suffixe CR seul', () => {
    const parser = new ScannerParser('CRLF');
    expect(parser.feed('ABC\rDEF\r')).toEqual(['ABC', 'DEF']);
  });
});
