/**
 * Service de compression/décompression de données
 * 
 * Gère la compression gzip des payloads pour réduire la bande passante
 * Utilisé pour les requêtes de synchronisation
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

import pako from 'pako';

/**
 * Statistiques de compression
 */
export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;    // 0-1 (0.5 = 50% de réduction)
  compressionTime: number;     // ms
  decompressionTime?: number;  // ms
}

/**
 * Options de compression
 */
export interface CompressionOptions {
  level?: number;  // 0-9 (0 = aucune, 9 = max)
  threshold?: number;  // Taille minimale pour compression (bytes)
  enabled?: boolean;
}

/**
 * Service de compression
 */
class CompressionService {
  private static instance: CompressionService;
  
  private options: CompressionOptions = {
    level: 6,        // Niveau équilibré
    threshold: 1024, // 1 KB minimum
    enabled: true,
  };
  
  private stats: CompressionStats[] = [];
  
  private constructor() {}
  
  /**
   * Obtient l'instance singleton
   */
  public static getInstance(): CompressionService {
    if (!CompressionService.instance) {
      CompressionService.instance = new CompressionService();
    }
    return CompressionService.instance;
  }
  
  /**
   * Configure le service
   */
  public configure(options: Partial<CompressionOptions>): void {
    this.options = { ...this.options, ...options };
    console.log('[COMPRESSION_SERVICE] Configuration:', this.options);
  }
  
  /**
   * Compresse des données
   */
  public compress(data: any): { compressed: Uint8Array; stats: CompressionStats } | null {
    if (!this.options.enabled) {
      return null;
    }
    
    const startTime = Date.now();
    
    try {
      // Convertir en JSON
      const jsonString = JSON.stringify(data);
      const originalSize = new Blob([jsonString]).size;
      
      // Vérifier le seuil
      if (originalSize < (this.options.threshold || 0)) {
        console.log(`[COMPRESSION_SERVICE] Données trop petites (${originalSize} bytes), skip compression`);
        return null;
      }
      
      // Compresser avec pako (gzip)
      const compressed = pako.gzip(jsonString, {
        level: this.options.level || 6,
      });
      
      const compressionTime = Date.now() - startTime;
      const compressedSize = compressed.length;
      const compressionRatio = 1 - (compressedSize / originalSize);
      
      const stats: CompressionStats = {
        originalSize,
        compressedSize,
        compressionRatio,
        compressionTime,
      };
      
      // Sauvegarder les stats
      this.stats.push(stats);
      if (this.stats.length > 100) {
        this.stats = this.stats.slice(-50);
      }
      
      console.log(`[COMPRESSION_SERVICE] Compressé: ${originalSize} → ${compressedSize} bytes (${(compressionRatio * 100).toFixed(1)}% réduit) en ${compressionTime}ms`);
      
      return { compressed, stats };
      
    } catch (error) {
      console.error('[COMPRESSION_SERVICE] Erreur compression:', error);
      return null;
    }
  }
  
  /**
   * Décompresse des données
   */
  public decompress(compressedData: Uint8Array): { data: any; stats: Partial<CompressionStats> } | null {
    const startTime = Date.now();
    
    try {
      // Décompresser avec pako
      const decompressed = pako.ungzip(compressedData, { to: 'string' });
      
      const decompressionTime = Date.now() - startTime;
      
      // Parser le JSON
      const data = JSON.parse(decompressed);
      
      console.log(`[COMPRESSION_SERVICE] Décompressé en ${decompressionTime}ms`);
      
      return {
        data,
        stats: {
          decompressionTime,
          compressedSize: compressedData.length,
          originalSize: new Blob([decompressed]).size,
        } as CompressionStats,
      };
      
    } catch (error) {
      console.error('[COMPRESSION_SERVICE] Erreur décompression:', error);
      return null;
    }
  }
  
  /**
   * Compresse et encode en base64 (pour transmission HTTP)
   */
  public compressToBase64(data: any): { base64: string; stats: CompressionStats } | null {
    const result = this.compress(data);
    
    if (!result) return null;
    
    // Convertir en base64
    const base64 = this.uint8ArrayToBase64(result.compressed);
    
    return {
      base64,
      stats: result.stats,
    };
  }
  
  /**
   * Décompresse depuis base64
   */
  public decompressFromBase64(base64: string): { data: any; stats: Partial<CompressionStats> } | null {
    try {
      // Décoder base64
      const compressed = this.base64ToUint8Array(base64);
      
      // Décompresser
      return this.decompress(compressed);
      
    } catch (error) {
      console.error('[COMPRESSION_SERVICE] Erreur décompression base64:', error);
      return null;
    }
  }
  
  /**
   * Vérifie si les données doivent être compressées
   */
  public shouldCompress(data: any): boolean {
    if (!this.options.enabled) return false;
    
    const size = new Blob([JSON.stringify(data)]).size;
    return size >= (this.options.threshold || 0);
  }
  
  /**
   * Obtient les statistiques de compression
   */
  public getStats(): {
    totalCompressions: number;
    averageCompressionRatio: number;
    averageCompressionTime: number;
    totalBytesSaved: number;
  } {
    if (this.stats.length === 0) {
      return {
        totalCompressions: 0,
        averageCompressionRatio: 0,
        averageCompressionTime: 0,
        totalBytesSaved: 0,
      };
    }
    
    const totalCompressions = this.stats.length;
    const averageCompressionRatio = 
      this.stats.reduce((sum, s) => sum + s.compressionRatio, 0) / totalCompressions;
    const averageCompressionTime = 
      this.stats.reduce((sum, s) => sum + s.compressionTime, 0) / totalCompressions;
    const totalBytesSaved = 
      this.stats.reduce((sum, s) => sum + (s.originalSize - s.compressedSize), 0);
    
    return {
      totalCompressions,
      averageCompressionRatio,
      averageCompressionTime,
      totalBytesSaved,
    };
  }
  
  /**
   * Réinitialise les statistiques
   */
  public resetStats(): void {
    this.stats = [];
    console.log('[COMPRESSION_SERVICE] Statistiques réinitialisées');
  }
  
  // ============================================================================
  // Méthodes utilitaires privées
  // ============================================================================
  
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

export default CompressionService.getInstance();

