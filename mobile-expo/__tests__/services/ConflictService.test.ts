/**
 * Tests unitaires pour le service de résolution de conflits
 * Validation de la logique de détection et résolution de conflits
 */

import ConflictService from '../../src/services/conflicts/ConflictService';
import {
  ConflictType,
  ConflictResolutionStrategy,
  ConflictStatus,
  ConflictSeverity,
  ConflictContext,
  DEFAULT_CONFLICT_CONFIG
} from '../../src/types/conflicts';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}));

describe('ConflictService', () => {
  let conflictService: ConflictService;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock AsyncStorage
    const mockAsyncStorage = require('@react-native-async-storage/async-storage');
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);

    // Get service instance
    conflictService = ConflictService.getInstance();
    
    // Initialize service
    await conflictService.initialize();
  });

  afterEach(async () => {
    await conflictService.cleanup();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ConflictService.getInstance();
      const instance2 = ConflictService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize only once', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await conflictService.initialize();
      await conflictService.initialize();
      
      expect(consoleSpy).toHaveBeenCalledWith('[CONFLICT_SERVICE] Service déjà initialisé');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Conflict Detection', () => {
    it('should detect update-update conflicts', () => {
      const clientData = {
        id: 'product_123',
        name: 'Product Client',
        price: 100,
        version: 2,
        updated_at: new Date(Date.now() - 5000).toISOString()
      };

      const serverData = {
        id: 'product_123',
        name: 'Product Server',
        price: 120,
        version: 2,
        updated_at: new Date().toISOString()
      };

      const context: ConflictContext = {
        userId: 'user_123',
        deviceId: 'device_456',
        syncSessionId: 'session_789',
        timestamp: new Date().toISOString(),
        metadata: {}
      };

      const conflicts = conflictService.detectConflicts(clientData, serverData, 'product', context);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictType).toBe(ConflictType.UPDATE_UPDATE);
      expect(conflicts[0].entityType).toBe('product');
      expect(conflicts[0].status).toBe(ConflictStatus.PENDING);
    });

    it('should detect version conflicts', () => {
      const clientData = {
        id: 'product_123',
        name: 'Product',
        price: 100,
        version: 2,
        updated_at: new Date().toISOString()
      };

      const serverData = {
        id: 'product_123',
        name: 'Product',
        price: 100,
        version: 3,
        updated_at: new Date().toISOString()
      };

      const context: ConflictContext = {
        userId: 'user_123',
        deviceId: 'device_456',
        syncSessionId: 'session_789',
        timestamp: new Date().toISOString(),
        metadata: {}
      };

      const conflicts = conflictService.detectConflicts(clientData, serverData, 'product', context);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictType).toBe(ConflictType.VERSION_CONFLICT);
    });

    it('should detect create-create conflicts', () => {
      const clientData = {
        id: 'product_123',
        name: 'Product Client',
        price: 100
      };

      const serverData = {
        id: 'product_123',
        name: 'Product Server',
        price: 120
      };

      const context: ConflictContext = {
        userId: 'user_123',
        deviceId: 'device_456',
        syncSessionId: 'session_789',
        timestamp: new Date().toISOString(),
        metadata: {}
      };

      const conflicts = conflictService.detectConflicts(clientData, serverData, 'product', context);
      
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts.some(c => c.conflictType === ConflictType.CREATE_CREATE)).toBe(true);
    });

    it('should not detect conflicts for identical data', () => {
      const data = {
        id: 'product_123',
        name: 'Product',
        price: 100,
        version: 1,
        updated_at: new Date().toISOString()
      };

      const context: ConflictContext = {
        userId: 'user_123',
        deviceId: 'device_456',
        syncSessionId: 'session_789',
        timestamp: new Date().toISOString(),
        metadata: {}
      };

      const conflicts = conflictService.detectConflicts(data, data, 'product', context);
      
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('Conflict Resolution', () => {
    let conflict: any;

    beforeEach(() => {
      conflict = {
        id: 'conflict_123',
        entityType: 'product',
        entityId: 'product_123',
        conflictType: ConflictType.UPDATE_UPDATE,
        severity: ConflictSeverity.MEDIUM,
        status: ConflictStatus.PENDING,
        createdAt: new Date().toISOString(),
        clientData: {
          id: 'product_123',
          name: 'Product Client',
          price: 100,
          updated_at: new Date(Date.now() - 5000).toISOString()
        },
        serverData: {
          id: 'product_123',
          name: 'Product Server',
          price: 120,
          updated_at: new Date().toISOString()
        },
        clientTimestamp: new Date(Date.now() - 5000).toISOString(),
        serverTimestamp: new Date().toISOString(),
        operationType: 'update',
        conflictReason: 'Simultaneous modifications detected'
      };
    });

    it('should resolve conflict with Last Write Wins strategy', async () => {
      const result = await conflictService.resolveConflict(conflict, ConflictResolutionStrategy.LAST_WRITE_WINS);
      
      expect(result.success).toBe(true);
      expect(result.resolution).toBeDefined();
      expect(result.resolution?.strategy).toBe(ConflictResolutionStrategy.LAST_WRITE_WINS);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should resolve conflict with Client Wins strategy', async () => {
      const result = await conflictService.resolveConflict(conflict, ConflictResolutionStrategy.CLIENT_WINS);
      
      expect(result.success).toBe(true);
      expect(result.resolution?.strategy).toBe(ConflictResolutionStrategy.CLIENT_WINS);
      expect(result.resolution?.resolvedData).toEqual(conflict.clientData);
    });

    it('should resolve conflict with Server Wins strategy', async () => {
      const result = await conflictService.resolveConflict(conflict, ConflictResolutionStrategy.SERVER_WINS);
      
      expect(result.success).toBe(true);
      expect(result.resolution?.strategy).toBe(ConflictResolutionStrategy.SERVER_WINS);
      expect(result.resolution?.resolvedData).toEqual(conflict.serverData);
    });

    it('should resolve conflict with Merge strategy', async () => {
      const result = await conflictService.resolveConflict(conflict, ConflictResolutionStrategy.MERGE_STRATEGY);
      
      expect(result.success).toBe(true);
      expect(result.resolution?.strategy).toBe(ConflictResolutionStrategy.MERGE_STRATEGY);
      expect(result.resolution?.resolvedData).toBeDefined();
    });

    it('should handle resolution failure gracefully', async () => {
      // Mock a resolution failure
      const invalidConflict = {
        ...conflict,
        clientData: null,
        serverData: null
      };

      const result = await conflictService.resolveConflict(invalidConflict);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Automatic Resolution', () => {
    it('should resolve multiple conflicts automatically', async () => {
      const conflicts = [
        {
          id: 'conflict_1',
          entityType: 'product',
          entityId: 'product_1',
          conflictType: ConflictType.UPDATE_UPDATE,
          severity: ConflictSeverity.MEDIUM,
          status: ConflictStatus.PENDING,
          createdAt: new Date().toISOString(),
          clientData: { id: 'product_1', name: 'Client' },
          serverData: { id: 'product_1', name: 'Server' },
          clientTimestamp: new Date(Date.now() - 5000).toISOString(),
          serverTimestamp: new Date().toISOString(),
          operationType: 'update',
          conflictReason: 'Test conflict 1'
        },
        {
          id: 'conflict_2',
          entityType: 'product',
          entityId: 'product_2',
          conflictType: ConflictType.UPDATE_UPDATE,
          severity: ConflictSeverity.MEDIUM,
          status: ConflictStatus.PENDING,
          createdAt: new Date().toISOString(),
          clientData: { id: 'product_2', name: 'Client 2' },
          serverData: { id: 'product_2', name: 'Server 2' },
          clientTimestamp: new Date(Date.now() - 3000).toISOString(),
          serverTimestamp: new Date().toISOString(),
          operationType: 'update',
          conflictReason: 'Test conflict 2'
        }
      ];

      const results = await conflictService.resolveConflicts(conflicts);
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle mixed resolution results', async () => {
      const conflicts = [
        {
          id: 'conflict_1',
          entityType: 'product',
          entityId: 'product_1',
          conflictType: ConflictType.UPDATE_UPDATE,
          severity: ConflictSeverity.MEDIUM,
          status: ConflictStatus.PENDING,
          createdAt: new Date().toISOString(),
          clientData: { id: 'product_1', name: 'Client' },
          serverData: { id: 'product_1', name: 'Server' },
          clientTimestamp: new Date(Date.now() - 5000).toISOString(),
          serverTimestamp: new Date().toISOString(),
          operationType: 'update',
          conflictReason: 'Test conflict 1'
        },
        {
          id: 'conflict_2',
          entityType: 'product',
          entityId: 'product_2',
          conflictType: ConflictType.CONSTRAINT_VIOLATION,
          severity: ConflictSeverity.CRITICAL,
          status: ConflictStatus.PENDING,
          createdAt: new Date().toISOString(),
          clientData: null,
          serverData: null,
          clientTimestamp: new Date().toISOString(),
          serverTimestamp: new Date().toISOString(),
          operationType: 'update',
          conflictReason: 'Invalid conflict for testing'
        }
      ];

      const results = await conflictService.resolveConflicts(conflicts);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('Resolution Rules', () => {
    it('should add resolution rule', () => {
      const rule = {
        id: 'rule_1',
        name: 'Test Rule',
        description: 'Test rule for products',
        entityType: 'product',
        conflictType: ConflictType.UPDATE_UPDATE,
        condition: {
          field: 'price',
          operator: 'greater_than' as const,
          value: 100
        },
        strategy: ConflictResolutionStrategy.CLIENT_WINS,
        priority: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      conflictService.addResolutionRule(rule);
      const rules = conflictService.getResolutionRules();
      
      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe('rule_1');
    });

    it('should remove resolution rule', () => {
      const rule = {
        id: 'rule_1',
        name: 'Test Rule',
        description: 'Test rule',
        entityType: 'product',
        conflictType: ConflictType.UPDATE_UPDATE,
        condition: {
          field: 'price',
          operator: 'greater_than' as const,
          value: 100
        },
        strategy: ConflictResolutionStrategy.CLIENT_WINS,
        priority: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      conflictService.addResolutionRule(rule);
      expect(conflictService.getResolutionRules()).toHaveLength(1);
      
      conflictService.removeResolutionRule('rule_1');
      expect(conflictService.getResolutionRules()).toHaveLength(0);
    });
  });

  describe('Metrics and Reports', () => {
    it('should provide conflict metrics', () => {
      const metrics = conflictService.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalConflicts).toBeDefined();
      expect(metrics.resolvedConflicts).toBeDefined();
      expect(metrics.pendingConflicts).toBeDefined();
      expect(metrics.escalatedConflicts).toBeDefined();
      expect(metrics.failedResolutions).toBeDefined();
    });

    it('should generate conflict report', async () => {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const report = await conflictService.generateReport({ start: startDate, end: endDate });
      
      expect(report).toBeDefined();
      expect(report.period.start).toBe(startDate);
      expect(report.period.end).toBe(endDate);
      expect(report.summary).toBeDefined();
      expect(report.trends).toBeDefined();
      expect(report.topConflicts).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });
  });

  describe('Conflict Management', () => {
    it('should get pending conflicts', () => {
      const pendingConflicts = conflictService.getPendingConflicts();
      
      expect(Array.isArray(pendingConflicts)).toBe(true);
    });

    it('should get resolved conflicts', () => {
      const resolvedConflicts = conflictService.getResolvedConflicts();
      
      expect(Array.isArray(resolvedConflicts)).toBe(true);
    });
  });

  describe('Event Listeners', () => {
    it('should emit conflict events to listeners', async () => {
      const eventListener = jest.fn();
      conflictService.addEventListener(eventListener);

      const clientData = {
        id: 'product_123',
        name: 'Product Client',
        price: 100,
        version: 2,
        updated_at: new Date(Date.now() - 5000).toISOString()
      };

      const serverData = {
        id: 'product_123',
        name: 'Product Server',
        price: 120,
        version: 2,
        updated_at: new Date().toISOString()
      };

      const context: ConflictContext = {
        userId: 'user_123',
        deviceId: 'device_456',
        syncSessionId: 'session_789',
        timestamp: new Date().toISOString(),
        metadata: {}
      };

      conflictService.detectConflicts(clientData, serverData, 'product', context);
      
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'conflict_detected',
          entityType: 'product',
          conflictType: expect.any(String)
        })
      );

      conflictService.removeEventListener(eventListener);
    });

    it('should handle listener errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const eventListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      
      conflictService.addEventListener(eventListener);

      const clientData = { id: 'product_123', name: 'Client' };
      const serverData = { id: 'product_123', name: 'Server' };
      const context: ConflictContext = {
        userId: 'user_123',
        deviceId: 'device_456',
        syncSessionId: 'session_789',
        timestamp: new Date().toISOString(),
        metadata: {}
      };

      conflictService.detectConflicts(clientData, serverData, 'product', context);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[CONFLICT_SERVICE] Erreur listener événement:',
        expect.any(Error)
      );

      conflictService.removeEventListener(eventListener);
      consoleSpy.mockRestore();
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', async () => {
      await conflictService.initialize();
      
      const metrics = conflictService.getMetrics();
      expect(metrics).toBeDefined();
    });

    it('should accept custom configuration', async () => {
      const customConfig = {
        ...DEFAULT_CONFLICT_CONFIG,
        enableAutoResolution: false,
        maxConflictsPerSync: 10
      };

      await conflictService.initialize(customConfig);
      
      // Configuration should be applied
      expect(conflictService['config'].enableAutoResolution).toBe(false);
      expect(conflictService['config'].maxConflictsPerSync).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when not initialized', () => {
      const uninitializedService = ConflictService.getInstance();
      uninitializedService['isInitialized'] = false;

      expect(() => {
        uninitializedService.detectConflicts({}, {}, 'product', {
          userId: 'user_123',
          deviceId: 'device_456',
          syncSessionId: 'session_789',
          timestamp: new Date().toISOString(),
          metadata: {}
        });
      }).toThrow('Service de conflits non initialisé');
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      const mockAsyncStorage = require('@react-native-async-storage/async-storage');
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      // Should not throw during initialization
      await expect(conflictService.initialize()).resolves.not.toThrow();
    });
  });
});

