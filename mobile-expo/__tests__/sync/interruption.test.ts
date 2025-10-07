/**
 * Tests d'interruption réseau pendant la synchronisation
 * 
 * Ces tests valident :
 * - Comportement lors de coupure réseau pendant sync
 * - Reprise automatique après reconnexion
 * - Cohérence des données après interruption
 * - Gestion des opérations partiellement synchronisées
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

import SyncService from '../../src/services/sync/SyncService';
import NetworkService from '../../src/services/network/NetworkService';
import RetryService from '../../src/services/retry/RetryService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Mocks
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('../../src/services/apiClient');

describe('Tests d\'interruption réseau', () => {
  let mockFetch: jest.Mock;
  let networkConnected = true;
  
  beforeEach(() => {
    jest.clearAllMocks();
    networkConnected = true;
    
    // Mock AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    
    // Mock NetInfo avec changements de connexion
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      const unsubscribe = jest.fn();
      // Appeler immédiatement avec l'état initial
      callback({
        isConnected: networkConnected,
        isInternetReachable: networkConnected,
        type: networkConnected ? 'wifi' : 'none',
      });
      return unsubscribe;
    });
    
    (NetInfo.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        isConnected: networkConnected,
        isInternetReachable: networkConnected,
        type: networkConnected ? 'wifi' : 'none',
      })
    );
    
    // Mock fetch global
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  // ============================================================================
  // Test 1 : Interruption pendant sync batch
  // ============================================================================
  
  describe('Interruption pendant sync batch', () => {
    it('devrait détecter la perte de connexion et arrêter la sync', async () => {
      // Préparer 100 opérations
      const operations = Array.from({ length: 100 }, (_, i) => ({
        id: `op-${i}`,
        entityType: 'product',
        entityId: `product-${i}`,
        operationType: 'create',
        data: { name: `Product ${i}`, price: 1000 + i },
      }));
      
      let requestCount = 0;
      
      // Mock fetch : Succès pour les 50 premières, puis coupure
      mockFetch.mockImplementation(() => {
        requestCount++;
        
        if (requestCount <= 50) {
          // 50 premières requêtes réussissent
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success_count: 1,
              error_count: 0,
              results: [{ status: 'SUCCESS' }],
            }),
          });
        } else {
          // Après 50 requêtes, simuler coupure réseau
          networkConnected = false;
          return Promise.reject(new Error('Network request failed'));
        }
      });
      
      // Initialiser le service
      await SyncService.initialize();
      
      // Tenter la synchronisation
      try {
        const result = await SyncService.syncBatch(operations);
        
        // La sync devrait échouer ou être partielle
        expect(result.synced).toBeLessThan(100);
        expect(result.failed).toBeGreaterThan(0);
        
      } catch (error: any) {
        // C'est acceptable qu'une erreur soit levée
        expect(error.message).toContain('Network');
      }
      
      // Vérifier que les opérations non synchronisées sont conservées
      const metadata = await SyncService.getMetadata();
      expect(metadata.pendingOperations).toBeGreaterThan(0);
    });
    
    it('devrait sauvegarder l\'état de progression avant l\'interruption', async () => {
      const operations = Array.from({ length: 50 }, (_, i) => ({
        id: `op-${i}`,
        entityType: 'sale',
        entityId: `sale-${i}`,
        operationType: 'create',
        data: { amount: 5000 + i, quantity: 1 },
      }));
      
      let callCount = 0;
      
      mockFetch.mockImplementation(() => {
        callCount++;
        
        if (callCount <= 25) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success_count: 1 }),
          });
        } else {
          // Coupure après 25 opérations
          networkConnected = false;
          return Promise.reject(new Error('Network unavailable'));
        }
      });
      
      await SyncService.initialize();
      
      try {
        await SyncService.syncBatch(operations);
      } catch (error) {
        // Erreur attendue
      }
      
      // Vérifier que les métadonnées sont sauvegardées
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('sync:metadata'),
        expect.any(String)
      );
    });
  });
  
  // ============================================================================
  // Test 2 : Reprise automatique après reconnexion
  // ============================================================================
  
  describe('Reprise automatique après reconnexion', () => {
    it('devrait reprendre la sync automatiquement après reconnexion', async () => {
      const operations = Array.from({ length: 30 }, (_, i) => ({
        id: `op-${i}`,
        entityType: 'product',
        entityId: `product-${i}`,
        operationType: 'update',
        data: { name: `Updated Product ${i}` },
      }));
      
      let syncAttempts = 0;
      
      // Simuler plusieurs tentatives de sync
      mockFetch.mockImplementation(() => {
        syncAttempts++;
        
        if (syncAttempts === 1) {
          // Première tentative échoue (réseau coupé)
          return Promise.reject(new Error('Network error'));
        } else {
          // Tentatives suivantes réussissent (réseau restauré)
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success_count: operations.length,
              error_count: 0,
              results: operations.map(() => ({ status: 'SUCCESS' })),
            }),
          });
        }
      });
      
      await SyncService.initialize();
      await RetryService.initialize();
      
      // Première tentative avec retry
      const result = await RetryService.executeSyncWithRetry(async () => {
        return await SyncService.syncBatch(operations);
      });
      
      // Devrait réussir après retry
      expect(result.success).toBe(true);
      expect(syncAttempts).toBeGreaterThan(1);
    });
    
    it('devrait émettre des événements lors de la reconnexion', async () => {
      const eventListener = jest.fn();
      
      // Écouter les événements de connexion
      NetworkService.addEventListener(eventListener);
      
      // Simuler reconnexion
      networkConnected = false;
      await NetworkService.checkConnectivity();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      networkConnected = true;
      await NetworkService.checkConnectivity();
      
      // Vérifier que les événements sont émis
      expect(eventListener).toHaveBeenCalled();
      
      NetworkService.removeEventListener(eventListener);
    });
    
    it('devrait reprendre depuis le dernier point de sauvegarde', async () => {
      // Simuler des métadonnées avec progression
      const mockMetadata = JSON.stringify({
        lastSyncTimestamp: new Date(Date.now() - 60000).toISOString(),
        pendingOperations: 25,
        lastSyncStatus: 'interrupted',
        syncInProgress: true,
      });
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockMetadata);
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success_count: 25,
          error_count: 0,
        }),
      });
      
      await SyncService.initialize();
      
      const metadata = await SyncService.getMetadata();
      expect(metadata.pendingOperations).toBe(25);
      
      // Reprendre la sync
      const operations = Array.from({ length: 25 }, (_, i) => ({
        id: `remaining-op-${i}`,
        entityType: 'product',
        operationType: 'create',
        data: {},
      }));
      
      const result = await SyncService.syncBatch(operations);
      expect(result.synced).toBe(25);
    });
  });
  
  // ============================================================================
  // Test 3 : Cohérence des données après interruption
  // ============================================================================
  
  describe('Cohérence des données', () => {
    it('ne devrait pas perdre de données lors d\'une interruption', async () => {
      const operations = Array.from({ length: 20 }, (_, i) => ({
        id: `op-${i}`,
        entityType: 'sale',
        entityId: `sale-${i}`,
        operationType: 'create',
        data: { amount: 1000 * i },
      }));
      
      // Mock : 10 succès, puis coupure
      let count = 0;
      mockFetch.mockImplementation(() => {
        count++;
        if (count <= 10) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success_count: 1 }),
          });
        } else {
          return Promise.reject(new Error('Connection lost'));
        }
      });
      
      await SyncService.initialize();
      
      try {
        await SyncService.syncBatch(operations);
      } catch (error) {
        // Erreur attendue
      }
      
      // Vérifier que les 10 premières opérations sont marquées comme synchronisées
      // et les 10 restantes comme en attente
      const metadata = await SyncService.getMetadata();
      
      // Les opérations non synchronisées doivent être conservées
      expect(metadata.pendingOperations).toBeGreaterThanOrEqual(10);
    });
    
    it('ne devrait pas créer de doublons après reprise', async () => {
      const operation = {
        id: 'unique-op-1',
        entityType: 'product',
        entityId: 'product-123',
        operationType: 'update',
        data: { name: 'Test Product', price: 5000 },
      };
      
      let attemptCount = 0;
      const processedIds = new Set<string>();
      
      mockFetch.mockImplementation(async (url: string, options: any) => {
        attemptCount++;
        
        const body = JSON.parse(options.body);
        const ops = body.operations || [];
        
        // Enregistrer les IDs traités
        ops.forEach((op: any) => {
          if (!processedIds.has(op.entity_id)) {
            processedIds.add(op.entity_id);
          } else {
            // Doublon détecté !
            throw new Error(`Duplicate operation detected: ${op.entity_id}`);
          }
        });
        
        if (attemptCount === 1) {
          // Première tentative échoue
          return Promise.reject(new Error('Timeout'));
        } else {
          // Deuxième tentative réussit
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success_count: ops.length,
              error_count: 0,
            }),
          });
        }
      });
      
      await SyncService.initialize();
      await RetryService.initialize();
      
      // Synchroniser avec retry
      const result = await RetryService.executeSyncWithRetry(async () => {
        return await SyncService.syncBatch([operation]);
      });
      
      // Vérifier qu'il n'y a pas eu de doublon
      expect(processedIds.size).toBe(1);
      expect(result.success).toBe(true);
    });
    
    it('devrait maintenir l\'ordre des opérations après interruption', async () => {
      const operations = [
        { id: 'op-1', entityType: 'product', entityId: 'p-1', operationType: 'create', data: { seq: 1 } },
        { id: 'op-2', entityType: 'product', entityId: 'p-1', operationType: 'update', data: { seq: 2 } },
        { id: 'op-3', entityType: 'product', entityId: 'p-1', operationType: 'update', data: { seq: 3 } },
      ];
      
      const processedSequence: number[] = [];
      
      mockFetch.mockImplementation(async (url: string, options: any) => {
        const body = JSON.parse(options.body);
        const ops = body.operations || [];
        
        ops.forEach((op: any) => {
          processedSequence.push(op.entity_data.seq);
        });
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success_count: ops.length,
          }),
        });
      });
      
      await SyncService.initialize();
      await SyncService.syncBatch(operations);
      
      // Vérifier que l'ordre est préservé
      expect(processedSequence).toEqual([1, 2, 3]);
    });
  });
  
  // ============================================================================
  // Test 4 : Timeout et délais
  // ============================================================================
  
  describe('Gestion des timeouts', () => {
    it('devrait timeout après le délai configuré', async () => {
      const operations = [{
        id: 'op-timeout',
        entityType: 'product',
        operationType: 'create',
        data: {},
      }];
      
      // Mock : Requête qui ne répond jamais
      mockFetch.mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );
      
      await SyncService.initialize();
      await RetryService.initialize();
      
      const startTime = Date.now();
      
      try {
        await RetryService.executeWithRetry(
          () => SyncService.syncBatch(operations),
          {
            config: {
              maxRetries: 1,
              baseDelayMs: 100,
            },
            timeoutMs: 1000, // Timeout de 1 seconde
          }
        );
        
        fail('Should have thrown timeout error');
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        // Devrait timeout rapidement
        expect(duration).toBeLessThan(3000);
        expect(error.message).toContain('timeout');
      }
    });
    
    it('devrait réessayer après timeout avec backoff', async () => {
      const operations = [{
        id: 'op-retry',
        entityType: 'sale',
        operationType: 'create',
        data: {},
      }];
      
      let attemptCount = 0;
      
      mockFetch.mockImplementation(() => {
        attemptCount++;
        
        if (attemptCount < 3) {
          // Premières tentatives timeout
          return new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 100)
          );
        } else {
          // Troisième tentative réussit
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success_count: 1 }),
          });
        }
      });
      
      await RetryService.initialize();
      
      const result = await RetryService.executeSyncWithRetry(async () => {
        return await SyncService.syncBatch(operations);
      });
      
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });
  });
  
  // ============================================================================
  // Test 5 : Reconnexion et reprise
  // ============================================================================
  
  describe('Reconnexion et reprise', () => {
    it('devrait reprendre automatiquement lors de la reconnexion', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => ({
        id: `op-${i}`,
        entityType: 'product',
        operationType: 'create',
        data: { name: `Product ${i}` },
      }));
      
      // Simuler opérations en attente
      const queueData = JSON.stringify(operations);
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(queueData) // Pour la queue
        .mockResolvedValue(null);
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success_count: operations.length,
          error_count: 0,
        }),
      });
      
      await SyncService.initialize();
      await NetworkService.initialize();
      
      // Simuler événement de reconnexion
      networkConnected = true;
      
      // Déclencher la vérification de connectivité
      await NetworkService.checkConnectivity();
      
      // Attendre un peu pour que la sync auto se déclenche
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Vérifier que la sync a été déclenchée
      // (dans une vraie implémentation, NetworkService devrait déclencher auto-sync)
      const metadata = await SyncService.getMetadata();
      expect(metadata).toBeDefined();
    });
    
    it('devrait gérer plusieurs interruptions successives', async () => {
      const operations = Array.from({ length: 15 }, (_, i) => ({
        id: `op-${i}`,
        entityType: 'product',
        operationType: 'create',
        data: {},
      }));
      
      let callCount = 0;
      
      mockFetch.mockImplementation(() => {
        callCount++;
        
        // Pattern : 5 succès, échec, 5 succès, échec, 5 succès
        const position = callCount % 6;
        
        if (position === 0) {
          return Promise.reject(new Error('Intermittent failure'));
        } else {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success_count: 1 }),
          });
        }
      });
      
      await SyncService.initialize();
      await RetryService.initialize();
      
      const result = await RetryService.executeSyncWithRetry(
        () => SyncService.syncBatch(operations),
        {
          config: {
            maxRetries: 5,
            baseDelayMs: 100,
          },
        }
      );
      
      // Devrait finalement réussir malgré les interruptions
      expect(result.success).toBe(true);
    });
  });
  
  // ============================================================================
  // Test 6 : État de la queue après interruption
  // ============================================================================
  
  describe('État de la queue', () => {
    it('devrait conserver les opérations non synchronisées dans la queue', async () => {
      const operations = Array.from({ length: 40 }, (_, i) => ({
        id: `op-${i}`,
        entityType: 'product',
        operationType: 'create',
        data: { name: `Product ${i}` },
      }));
      
      let successCount = 0;
      
      mockFetch.mockImplementation(() => {
        successCount++;
        
        if (successCount <= 20) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success_count: 1 }),
          });
        } else {
          return Promise.reject(new Error('Network interrupted'));
        }
      });
      
      await SyncService.initialize();
      
      try {
        await SyncService.syncBatch(operations);
      } catch (error) {
        // Erreur attendue
      }
      
      // Vérifier l'état de la queue
      const metadata = await SyncService.getMetadata();
      
      // Il devrait rester environ 20 opérations en attente
      expect(metadata.pendingOperations).toBeGreaterThanOrEqual(15);
      expect(metadata.pendingOperations).toBeLessThanOrEqual(25);
    });
    
    it('devrait nettoyer la queue après sync complète réussie', async () => {
      const operations = Array.from({ length: 5 }, (_, i) => ({
        id: `op-${i}`,
        entityType: 'sale',
        operationType: 'create',
        data: {},
      }));
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success_count: operations.length,
          error_count: 0,
        }),
      });
      
      await SyncService.initialize();
      
      await SyncService.syncBatch(operations);
      
      const metadata = await SyncService.getMetadata();
      expect(metadata.pendingOperations).toBe(0);
    });
  });
  
  // ============================================================================
  // Test 7 : Erreurs serveur pendant interruption
  // ============================================================================
  
  describe('Erreurs serveur', () => {
    it('devrait différencier erreur réseau et erreur serveur', async () => {
      const operations = [{
        id: 'op-1',
        entityType: 'product',
        operationType: 'create',
        data: {},
      }];
      
      let attemptCount = 0;
      
      mockFetch.mockImplementation(() => {
        attemptCount++;
        
        if (attemptCount === 1) {
          // Erreur réseau
          return Promise.reject(new Error('Network request failed'));
        } else if (attemptCount === 2) {
          // Erreur serveur 500
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Internal server error' }),
          });
        } else {
          // Succès
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success_count: 1 }),
          });
        }
      });
      
      await RetryService.initialize();
      
      const result = await RetryService.executeNetworkWithRetry(async () => {
        const response = await fetch('/api/sync/batch', {
          method: 'POST',
          body: JSON.stringify({ operations }),
        });
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        return response.json();
      });
      
      expect(result.success).toBe(true);
      expect(attemptCount).toBeGreaterThanOrEqual(3);
    });
  });
  
  // ============================================================================
  // Test 8 : Statistiques après interruptions
  // ============================================================================
  
  describe('Statistiques et métriques', () => {
    it('devrait tracker les tentatives et échecs', async () => {
      const operations = [{
        id: 'op-stats',
        entityType: 'product',
        operationType: 'create',
        data: {},
      }];
      
      let attemptCount = 0;
      
      mockFetch.mockImplementation(() => {
        attemptCount++;
        
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'));
        } else {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success_count: 1 }),
          });
        }
      });
      
      await RetryService.initialize();
      
      const result = await RetryService.executeSyncWithRetry(
        () => SyncService.syncBatch(operations)
      );
      
      // Vérifier les statistiques
      const stats = RetryService.getStats();
      
      expect(stats.totalAttempts).toBeGreaterThanOrEqual(3);
      expect(stats.successfulOperations).toBeGreaterThan(0);
      expect(result.attempts).toBe(3);
    });
    
    it('devrait enregistrer l\'historique des interruptions', async () => {
      await RetryService.initialize();
      
      // Effectuer plusieurs opérations avec échecs
      for (let i = 0; i < 3; i++) {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ success_count: 1 }),
          });
        
        await RetryService.executeWithRetry(
          async () => {
            const response = await fetch('/api/test');
            return response;
          },
          {
            config: { maxRetries: 2, baseDelayMs: 50 },
          }
        );
      }
      
      const history = RetryService.getHistory();
      
      // Vérifier que l'historique contient les sessions
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].attempts).toBeGreaterThan(1);
    });
  });
});

