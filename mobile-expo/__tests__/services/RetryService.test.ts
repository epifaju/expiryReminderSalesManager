/**
 * Tests unitaires pour le service de retry
 * Validation de la logique de retry avec backoff exponentiel
 */

import RetryService from '../../src/services/retry/RetryService';
import {
  RetryConfig,
  RetryStrategy,
  RetryReason,
  DEFAULT_RETRY_CONFIG,
  AGGRESSIVE_RETRY_CONFIG,
  CONSERVATIVE_RETRY_CONFIG,
  SYNC_RETRY_CONFIG
} from '../../src/types/retry';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}));

describe('RetryService', () => {
  let retryService: RetryService;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock AsyncStorage
    const mockAsyncStorage = require('@react-native-async-storage/async-storage');
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);

    // Get service instance
    retryService = RetryService.getInstance();
    
    // Initialize service
    await retryService.initialize();
  });

  afterEach(async () => {
    await retryService.cleanup();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = RetryService.getInstance();
      const instance2 = RetryService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize only once', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await retryService.initialize();
      await retryService.initialize();
      
      expect(consoleSpy).toHaveBeenCalledWith('[RETRY_SERVICE] Service déjà initialisé');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Basic Retry Functionality', () => {
    it('should execute operation successfully on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await retryService.executeWithRetry(operation);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toHaveLength(0);
      expect(result.finalAttempt).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');
      
      const result = await retryService.executeWithRetry(operation);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toHaveLength(2);
      expect(result.finalAttempt).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent error'));
      
      await expect(retryService.executeWithRetry(operation)).rejects.toThrow('Persistent error');
      
      expect(operation).toHaveBeenCalledTimes(DEFAULT_RETRY_CONFIG.maxRetries);
    });

    it('should respect custom retry configuration', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      const customConfig: Partial<RetryConfig> = {
        maxRetries: 2,
        baseDelayMs: 100,
        strategy: RetryStrategy.FIXED
      };
      
      await expect(retryService.executeWithRetry(operation, { config: customConfig })).rejects.toThrow();
      
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Retry Strategies', () => {
    it('should use exponential backoff strategy', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      const config: Partial<RetryConfig> = {
        maxRetries: 3,
        baseDelayMs: 1000,
        strategy: RetryStrategy.EXPONENTIAL,
        backoffMultiplier: 2
      };
      
      const startTime = Date.now();
      
      try {
        await retryService.executeWithRetry(operation, { config });
      } catch (error) {
        // Expected to fail
      }
      
      const totalTime = Date.now() - startTime;
      
      // Should take at least the sum of delays: 1000 + 2000 + 4000 = 7000ms
      expect(totalTime).toBeGreaterThanOrEqual(6000);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use linear backoff strategy', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      const config: Partial<RetryConfig> = {
        maxRetries: 3,
        baseDelayMs: 1000,
        strategy: RetryStrategy.LINEAR
      };
      
      const startTime = Date.now();
      
      try {
        await retryService.executeWithRetry(operation, { config });
      } catch (error) {
        // Expected to fail
      }
      
      const totalTime = Date.now() - startTime;
      
      // Should take at least: 1000 + 2000 + 3000 = 6000ms
      expect(totalTime).toBeGreaterThanOrEqual(5000);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use fixed delay strategy', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      const config: Partial<RetryConfig> = {
        maxRetries: 3,
        baseDelayMs: 500,
        strategy: RetryStrategy.FIXED
      };
      
      const startTime = Date.now();
      
      try {
        await retryService.executeWithRetry(operation, { config });
      } catch (error) {
        // Expected to fail
      }
      
      const totalTime = Date.now() - startTime;
      
      // Should take at least: 500 + 500 + 500 = 1500ms
      expect(totalTime).toBeGreaterThanOrEqual(1400);
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Analysis', () => {
    it('should correctly identify network errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Network connection failed'));
      
      try {
        await retryService.executeWithRetry(operation);
      } catch (error) {
        // Expected to fail
      }
      
      const result = retryService.getStats();
      expect(result.metrics.mostCommonReason).toBe(RetryReason.NETWORK_ERROR);
    });

    it('should correctly identify timeout errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Request timeout'));
      
      try {
        await retryService.executeWithRetry(operation);
      } catch (error) {
        // Expected to fail
      }
      
      const result = retryService.getStats();
      expect(result.metrics.mostCommonReason).toBe(RetryReason.TIMEOUT);
    });

    it('should correctly identify rate limit errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Rate limit exceeded'));
      
      try {
        await retryService.executeWithRetry(operation);
      } catch (error) {
        // Expected to fail
      }
      
      const result = retryService.getStats();
      expect(result.metrics.mostCommonReason).toBe(RetryReason.RATE_LIMIT);
    });
  });

  describe('Specialized Retry Methods', () => {
    it('should use sync retry configuration', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Sync error'));
      
      try {
        await retryService.executeSyncWithRetry(operation);
      } catch (error) {
        // Expected to fail
      }
      
      expect(operation).toHaveBeenCalledTimes(SYNC_RETRY_CONFIG.maxRetries);
    });

    it('should use aggressive retry configuration for network operations', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      
      try {
        await retryService.executeNetworkWithRetry(operation);
      } catch (error) {
        // Expected to fail
      }
      
      expect(operation).toHaveBeenCalledTimes(AGGRESSIVE_RETRY_CONFIG.maxRetries);
    });

    it('should use conservative retry configuration for critical operations', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Critical error'));
      
      try {
        await retryService.executeCriticalWithRetry(operation);
      } catch (error) {
        // Expected to fail
      }
      
      expect(operation).toHaveBeenCalledTimes(CONSERVATIVE_RETRY_CONFIG.maxRetries);
    });
  });

  describe('Callbacks and Events', () => {
    it('should call onAttempt callback for each retry', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      const onAttempt = jest.fn();
      
      try {
        await retryService.executeWithRetry(operation, { onAttempt });
      } catch (error) {
        // Expected to fail
      }
      
      expect(onAttempt).toHaveBeenCalledTimes(DEFAULT_RETRY_CONFIG.maxRetries);
      expect(onAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          attemptNumber: expect.any(Number),
          timestamp: expect.any(String),
          reason: expect.any(String),
          error: expect.any(Error)
        })
      );
    });

    it('should call onSuccess callback when operation succeeds', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');
      const onSuccess = jest.fn();
      
      await retryService.executeWithRetry(operation, { onSuccess });
      
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith('success', expect.any(Array));
    });

    it('should call onFailure callback when operation fails', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent error'));
      const onFailure = jest.fn();
      
      try {
        await retryService.executeWithRetry(operation, { onFailure });
      } catch (error) {
        // Expected to fail
      }
      
      expect(onFailure).toHaveBeenCalledTimes(1);
      expect(onFailure).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Array)
      );
    });
  });

  describe('Event Listeners', () => {
    it('should emit retry events to listeners', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');
      
      const eventListener = jest.fn();
      retryService.addEventListener(eventListener);
      
      await retryService.executeWithRetry(operation);
      
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'retry_started',
          timestamp: expect.any(String),
          attemptNumber: 0
        })
      );
      
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'retry_success',
          timestamp: expect.any(String),
          attemptNumber: 2
        })
      );
      
      retryService.removeEventListener(eventListener);
    });

    it('should handle listener errors gracefully', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const eventListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      
      retryService.addEventListener(eventListener);
      
      await retryService.executeWithRetry(operation);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[RETRY_SERVICE] Erreur listener événement:',
        expect.any(Error)
      );
      
      retryService.removeEventListener(eventListener);
      consoleSpy.mockRestore();
    });
  });

  describe('Statistics and Metrics', () => {
    it('should track retry statistics correctly', async () => {
      const operation1 = jest.fn().mockResolvedValue('success1');
      const operation2 = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success2');
      const operation3 = jest.fn().mockRejectedValue(new Error('Persistent error'));
      
      await retryService.executeWithRetry(operation1);
      await retryService.executeWithRetry(operation2);
      
      try {
        await retryService.executeWithRetry(operation3);
      } catch (error) {
        // Expected to fail
      }
      
      const stats = retryService.getStats();
      
      expect(stats.metrics.totalAttempts).toBeGreaterThan(0);
      expect(stats.metrics.successfulAttempts).toBe(2);
      expect(stats.metrics.failedAttempts).toBe(1);
      expect(stats.metrics.successRate).toBeGreaterThan(0);
    });

    it('should provide current retry status', async () => {
      const stats = retryService.getStats();
      
      expect(stats.isCurrentlyRetrying).toBe(false);
      expect(stats.metrics).toBeDefined();
      expect(stats.config).toBeDefined();
      expect(stats.recentAttempts).toBeDefined();
    });
  });

  describe('History Management', () => {
    it('should save retry history', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      await retryService.executeWithRetry(operation);
      
      const history = await retryService.getHistory();
      
      expect(history.totalSessions).toBeGreaterThan(0);
      expect(history.successfulSessions).toBeGreaterThan(0);
    });

    it('should clear retry history', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      await retryService.executeWithRetry(operation);
      
      await retryService.clearHistory();
      
      const history = await retryService.getHistory();
      
      expect(history.totalSessions).toBe(0);
      expect(history.successfulSessions).toBe(0);
    });
  });

  describe('Timeout Handling', () => {
    it('should respect operation timeout', async () => {
      const operation = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 5000))
      );
      
      const config: Partial<RetryConfig> = {
        maxRetries: 1,
        timeoutMs: 1000
      };
      
      try {
        await retryService.executeWithRetry(operation, { config });
      } catch (error) {
        expect((error as Error).message).toContain('timeout');
      }
      
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Abort Signal', () => {
    it('should respect abort signal', async () => {
      const abortController = new AbortController();
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      
      // Abort after 100ms
      setTimeout(() => abortController.abort(), 100);
      
      try {
        await retryService.executeWithRetry(operation, {
          abortSignal: abortController.signal
        });
      } catch (error) {
        expect((error as Error).message).toContain('annulée');
      }
    });
  });

  describe('Jitter', () => {
    it('should add jitter to delays when enabled', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      const config: Partial<RetryConfig> = {
        maxRetries: 2,
        baseDelayMs: 1000,
        strategy: RetryStrategy.EXPONENTIAL,
        jitter: true
      };
      
      const startTime = Date.now();
      
      try {
        await retryService.executeWithRetry(operation, { config });
      } catch (error) {
        // Expected to fail
      }
      
      const totalTime = Date.now() - startTime;
      
      // With jitter, the time should be slightly different from exact calculation
      expect(totalTime).toBeGreaterThan(1000);
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Classification', () => {
    it('should only retry retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Validation error'));
      const config: Partial<RetryConfig> = {
        maxRetries: 3,
        retryableErrors: [RetryReason.NETWORK_ERROR, RetryReason.TIMEOUT]
      };
      
      try {
        await retryService.executeWithRetry(operation, { config });
      } catch (error) {
        // Expected to fail
      }
      
      // Should not retry validation errors
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
});

