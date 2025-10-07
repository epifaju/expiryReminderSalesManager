/**
 * Simulateur de conditions réseau pour tests
 * 
 * Permet de simuler :
 * - Coupures réseau
 * - Latence variable
 * - Perte de paquets
 * - Bande passante limitée
 * - Reconnexions intermittentes
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

/**
 * Configuration du simulateur
 */
export interface NetworkSimulatorConfig {
  enabled: boolean;
  latencyMs?: number;        // Latence artificielle (0-5000ms)
  packetLoss?: number;       // Taux de perte de paquets (0-1)
  bandwidth?: number;        // Bande passante en KB/s
  disconnectAfter?: number;  // Déconnecter après N requêtes
  reconnectAfter?: number;   // Reconnecter après N ms
  intermittent?: boolean;    // Mode intermittent (on/off aléatoire)
}

/**
 * Statistiques du simulateur
 */
export interface NetworkSimulatorStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  droppedRequests: number;
  averageLatency: number;
  currentlyConnected: boolean;
}

/**
 * Service simulateur de réseau
 */
class NetworkSimulator {
  private static instance: NetworkSimulator;
  
  private config: NetworkSimulatorConfig = {
    enabled: false,
  };
  
  private stats: NetworkSimulatorStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    droppedRequests: 0,
    averageLatency: 0,
    currentlyConnected: true,
  };
  
  private latencies: number[] = [];
  private requestCount = 0;
  private disconnectTimer: NodeJS.Timeout | null = null;
  
  private constructor() {}
  
  /**
   * Obtient l'instance singleton
   */
  public static getInstance(): NetworkSimulator {
    if (!NetworkSimulator.instance) {
      NetworkSimulator.instance = new NetworkSimulator();
    }
    return NetworkSimulator.instance;
  }
  
  /**
   * Configure le simulateur
   */
  public configure(config: Partial<NetworkSimulatorConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[NETWORK_SIMULATOR] Configuration:', this.config);
    
    // Planifier déconnexion si configuré
    if (config.disconnectAfter && config.reconnectAfter) {
      this.scheduleDisconnection(config.disconnectAfter, config.reconnectAfter);
    }
  }
  
  /**
   * Active le simulateur
   */
  public enable(): void {
    this.config.enabled = true;
    console.log('[NETWORK_SIMULATOR] ✅ Activé');
  }
  
  /**
   * Désactive le simulateur
   */
  public disable(): void {
    this.config.enabled = false;
    console.log('[NETWORK_SIMULATOR] ❌ Désactivé');
  }
  
  /**
   * Simule une requête réseau
   */
  public async simulateRequest<T>(
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (!this.config.enabled) {
      return requestFn();
    }
    
    this.stats.totalRequests++;
    this.requestCount++;
    
    // Vérifier déconnexion
    if (this.config.disconnectAfter && this.requestCount > this.config.disconnectAfter) {
      if (!this.stats.currentlyConnected) {
        this.stats.failedRequests++;
        throw new Error('Network disconnected');
      }
    }
    
    // Vérifier mode intermittent
    if (this.config.intermittent && Math.random() < 0.3) {
      this.stats.failedRequests++;
      throw new Error('Intermittent network failure');
    }
    
    // Vérifier perte de paquets
    if (this.config.packetLoss && Math.random() < this.config.packetLoss) {
      this.stats.droppedRequests++;
      throw new Error('Packet lost');
    }
    
    // Ajouter latence
    if (this.config.latencyMs) {
      const latency = this.config.latencyMs + (Math.random() - 0.5) * 100;
      await this.delay(latency);
      this.latencies.push(latency);
      
      // Calculer latence moyenne
      this.stats.averageLatency = 
        this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
    }
    
    // Exécuter la requête
    try {
      const startTime = Date.now();
      const result = await requestFn();
      const duration = Date.now() - startTime;
      
      this.stats.successfulRequests++;
      
      console.log(`[NETWORK_SIMULATOR] Requête réussie (${duration}ms)`);
      
      return result;
      
    } catch (error) {
      this.stats.failedRequests++;
      throw error;
    }
  }
  
  /**
   * Simule une coupure réseau
   */
  public disconnect(): void {
    this.stats.currentlyConnected = false;
    console.log('[NETWORK_SIMULATOR] 📵 Réseau déconnecté');
  }
  
  /**
   * Simule une reconnexion
   */
  public reconnect(): void {
    this.stats.currentlyConnected = true;
    this.requestCount = 0; // Reset counter
    console.log('[NETWORK_SIMULATOR] 📶 Réseau reconnecté');
  }
  
  /**
   * Planifie une déconnexion et reconnexion
   */
  public scheduleDisconnection(afterRequests: number, reconnectAfterMs: number): void {
    console.log(`[NETWORK_SIMULATOR] Déconnexion planifiée après ${afterRequests} requêtes, reconnexion après ${reconnectAfterMs}ms`);
    
    this.config.disconnectAfter = afterRequests;
    this.config.reconnectAfter = reconnectAfterMs;
    
    // Monitorer les requêtes
    const checkInterval = setInterval(() => {
      if (this.requestCount >= afterRequests && this.stats.currentlyConnected) {
        this.disconnect();
        
        // Planifier reconnexion
        setTimeout(() => {
          this.reconnect();
          clearInterval(checkInterval);
        }, reconnectAfterMs);
      }
    }, 100);
  }
  
  /**
   * Simule une connexion lente
   */
  public simulateSlowConnection(latencyMs: number = 2000): void {
    this.configure({
      enabled: true,
      latencyMs,
    });
    console.log(`[NETWORK_SIMULATOR] 🐌 Connexion lente activée (${latencyMs}ms)`);
  }
  
  /**
   * Simule une connexion instable
   */
  public simulateUnstableConnection(packetLoss: number = 0.2): void {
    this.configure({
      enabled: true,
      packetLoss,
      intermittent: true,
    });
    console.log(`[NETWORK_SIMULATOR] ⚡ Connexion instable (${packetLoss * 100}% perte)`);
  }
  
  /**
   * Simule une bonne connexion
   */
  public simulateGoodConnection(): void {
    this.configure({
      enabled: true,
      latencyMs: 50,
      packetLoss: 0,
      intermittent: false,
    });
    console.log('[NETWORK_SIMULATOR] ✅ Bonne connexion simulée');
  }
  
  /**
   * Récupère les statistiques
   */
  public getStats(): NetworkSimulatorStats {
    return { ...this.stats };
  }
  
  /**
   * Réinitialise les statistiques
   */
  public resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      droppedRequests: 0,
      averageLatency: 0,
      currentlyConnected: true,
    };
    this.latencies = [];
    this.requestCount = 0;
    console.log('[NETWORK_SIMULATOR] Statistiques réinitialisées');
  }
  
  /**
   * Réinitialise complètement le simulateur
   */
  public reset(): void {
    this.config = { enabled: false };
    this.resetStats();
    
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }
    
    console.log('[NETWORK_SIMULATOR] Réinitialisé');
  }
  
  /**
   * Retourne l'état de connexion
   */
  public isConnected(): boolean {
    return this.stats.currentlyConnected;
  }
  
  // ============================================================================
  // Méthodes utilitaires privées
  // ============================================================================
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default NetworkSimulator.getInstance();

