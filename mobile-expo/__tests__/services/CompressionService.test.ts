/**
 * Tests unitaires pour CompressionService
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

import CompressionService from '../../src/services/compression/CompressionService';

// Mock pako
jest.mock('pako', () => ({
  gzip: jest.fn((data: string) => {
    // Simuler compression (réduction de ~60%)
    const compressed = new Uint8Array(Math.floor(data.length * 0.4));
    return compressed;
  }),
  ungzip: jest.fn((data: Uint8Array, options: any) => {
    // Simuler décompression
    return JSON.stringify({ test: 'data' });
  }),
}));

describe('CompressionService', () => {
  beforeEach(() => {
    CompressionService.resetStats();
    CompressionService.configure({ enabled: true, threshold: 100 });
  });
  
  // ============================================================================
  // Tests de compression
  // ============================================================================
  
  describe('Compression', () => {
    it('devrait compresser des données volumineuses', () => {
      const largeData = {
        operations: Array.from({ length: 50 }, (_, i) => ({
          id: `op-${i}`,
          name: `Operation ${i}`,
          data: { value: i * 100 },
        })),
      };
      
      const result = CompressionService.compress(largeData);
      
      expect(result).not.toBeNull();
      expect(result!.compressed).toBeDefined();
      expect(result!.stats).toBeDefined();
      expect(result!.stats.compressedSize).toBeLessThan(result!.stats.originalSize);
    });
    
    it('ne devrait pas compresser des données trop petites', () => {
      CompressionService.configure({ threshold: 1000 });
      
      const smallData = { id: '123', name: 'Test' };
      const result = CompressionService.compress(smallData);
      
      expect(result).toBeNull();
    });
    
    it('ne devrait pas compresser si désactivé', () => {
      CompressionService.configure({ enabled: false });
      
      const data = { large: 'data'.repeat(1000) };
      const result = CompressionService.compress(data);
      
      expect(result).toBeNull();
    });
    
    it('devrait calculer le ratio de compression', () => {
      const data = { text: 'a'.repeat(10000) };
      const result = CompressionService.compress(data);
      
      expect(result).not.toBeNull();
      expect(result!.stats.compressionRatio).toBeGreaterThan(0);
      expect(result!.stats.compressionRatio).toBeLessThanOrEqual(1);
    });
    
    it('devrait mesurer le temps de compression', () => {
      const data = { operations: Array.from({ length: 100 }, (_, i) => ({ id: i })) };
      const result = CompressionService.compress(data);
      
      expect(result).not.toBeNull();
      expect(result!.stats.compressionTime).toBeGreaterThanOrEqual(0);
    });
  });
  
  // ============================================================================
  // Tests de décompression
  // ============================================================================
  
  describe('Décompression', () => {
    it('devrait décompresser des données compressées', () => {
      const originalData = { test: 'data', value: 123 };
      const compressed = CompressionService.compress(originalData);
      
      expect(compressed).not.toBeNull();
      
      const result = CompressionService.decompress(compressed!.compressed);
      
      expect(result).not.toBeNull();
      expect(result!.data).toBeDefined();
    });
    
    it('devrait mesurer le temps de décompression', () => {
      const data = { large: 'data'.repeat(1000) };
      const compressed = CompressionService.compress(data);
      
      const result = CompressionService.decompress(compressed!.compressed);
      
      expect(result).not.toBeNull();
      expect(result!.stats.decompressionTime).toBeGreaterThanOrEqual(0);
    });
  });
  
  // ============================================================================
  // Tests base64
  // ============================================================================
  
  describe('Compression base64', () => {
    it('devrait compresser et encoder en base64', () => {
      const data = { test: 'data', numbers: [1, 2, 3, 4, 5] };
      const result = CompressionService.compressToBase64(data);
      
      expect(result).not.toBeNull();
      expect(result!.base64).toBeDefined();
      expect(typeof result!.base64).toBe('string');
    });
    
    it('devrait décompresser depuis base64', () => {
      const originalData = { test: 'value', count: 42 };
      const compressed = CompressionService.compressToBase64(originalData);
      
      expect(compressed).not.toBeNull();
      
      const result = CompressionService.decompressFromBase64(compressed!.base64);
      
      expect(result).not.toBeNull();
      expect(result!.data).toBeDefined();
    });
  });
  
  // ============================================================================
  // Tests de seuil
  // ============================================================================
  
  describe('Seuil de compression', () => {
    it('devrait respecter le seuil configuré', () => {
      CompressionService.configure({ threshold: 5000 });
      
      const smallData = { text: 'a'.repeat(1000) }; // ~1KB
      expect(CompressionService.shouldCompress(smallData)).toBe(false);
      
      const largeData = { text: 'a'.repeat(10000) }; // ~10KB
      expect(CompressionService.shouldCompress(largeData)).toBe(true);
    });
    
    it('devrait retourner false si désactivé', () => {
      CompressionService.configure({ enabled: false });
      
      const data = { large: 'data'.repeat(10000) };
      expect(CompressionService.shouldCompress(data)).toBe(false);
    });
  });
  
  // ============================================================================
  // Tests de statistiques
  // ============================================================================
  
  describe('Statistiques', () => {
    it('devrait tracker les statistiques de compression', () => {
      // Compresser plusieurs fois
      for (let i = 0; i < 5; i++) {
        const data = { operations: Array.from({ length: 20 }, (_, j) => ({ id: j })) };
        CompressionService.compress(data);
      }
      
      const stats = CompressionService.getStats();
      
      expect(stats.totalCompressions).toBe(5);
      expect(stats.averageCompressionRatio).toBeGreaterThan(0);
      expect(stats.averageCompressionTime).toBeGreaterThanOrEqual(0);
      expect(stats.totalBytesSaved).toBeGreaterThan(0);
    });
    
    it('devrait réinitialiser les statistiques', () => {
      const data = { test: 'data'.repeat(1000) };
      CompressionService.compress(data);
      
      let stats = CompressionService.getStats();
      expect(stats.totalCompressions).toBeGreaterThan(0);
      
      CompressionService.resetStats();
      
      stats = CompressionService.getStats();
      expect(stats.totalCompressions).toBe(0);
      expect(stats.totalBytesSaved).toBe(0);
    });
    
    it('devrait retourner des stats vides si aucune compression', () => {
      const stats = CompressionService.getStats();
      
      expect(stats.totalCompressions).toBe(0);
      expect(stats.averageCompressionRatio).toBe(0);
      expect(stats.averageCompressionTime).toBe(0);
      expect(stats.totalBytesSaved).toBe(0);
    });
  });
  
  // ============================================================================
  // Tests d'erreurs
  // ============================================================================
  
  describe('Gestion d\'erreurs', () => {
    it('devrait gérer les erreurs de compression gracefully', () => {
      // Mock pako pour lever une erreur
      const pako = require('pako');
      pako.gzip.mockImplementationOnce(() => {
        throw new Error('Compression error');
      });
      
      const data = { test: 'data'.repeat(1000) };
      const result = CompressionService.compress(data);
      
      expect(result).toBeNull();
    });
    
    it('devrait gérer les erreurs de décompression gracefully', () => {
      const pako = require('pako');
      pako.ungzip.mockImplementationOnce(() => {
        throw new Error('Decompression error');
      });
      
      const fakeCompressed = new Uint8Array([1, 2, 3, 4]);
      const result = CompressionService.decompress(fakeCompressed);
      
      expect(result).toBeNull();
    });
  });
});

