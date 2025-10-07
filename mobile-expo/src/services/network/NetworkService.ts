/**
 * Service de détection et gestion de la connectivité réseau
 * Utilise @react-native-community/netinfo pour détecter l'état de connexion
 * Déclenche automatiquement la synchronisation au retour de connectivité
 */

import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

/**
 * Interface pour les informations de connectivité
 */
export interface NetworkInfo {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string | null;
  details: any;
  timestamp: string;
}

/**
 * Interface pour les listeners de changement de réseau
 */
export interface NetworkChangeListener {
  (networkInfo: NetworkInfo): void;
}

/**
 * Service singleton pour la gestion de la connectivité réseau
 */
class NetworkService {
  private static instance: NetworkService;
  private subscription: NetInfoSubscription | null = null;
  private isConnected: boolean = false;
  private isInternetReachable: boolean = false;
  private networkType: string | null = null;
  private networkDetails: any = null;
  private lastConnectionTime: string | null = null;
  private lastDisconnectionTime: string | null = null;
  private listeners: NetworkChangeListener[] = [];
  private isInitialized: boolean = false;

  private constructor() {}

  /**
   * Singleton pattern pour garantir une seule instance
   */
  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  /**
   * Initialise le service de détection réseau
   * Démarre l'écoute des changements de connectivité
   */
  public async initialize(): Promise<void> {
    try {
      console.log('[NETWORK] Initialisation du service de détection réseau...');
      
      // Récupérer l'état initial du réseau
      const initialState = await NetInfo.fetch();
      this.updateNetworkState(initialState);
      
      // S'abonner aux changements de réseau
      this.subscription = NetInfo.addEventListener(this.handleNetworkChange.bind(this));
      
      this.isInitialized = true;
      console.log('[NETWORK] Service de détection réseau initialisé');
      console.log(`[NETWORK] État initial: ${this.isConnected ? 'Connecté' : 'Déconnecté'}`);
      
    } catch (error) {
      console.error('[NETWORK] Erreur lors de l\'initialisation:', error);
      throw new Error(`Échec de l'initialisation du service réseau: ${error}`);
    }
  }

  /**
   * Gère les changements d'état du réseau
   * @param state - Nouvel état du réseau
   */
  private handleNetworkChange(state: NetInfoState): void {
    try {
      console.log('[NETWORK] Changement d\'état réseau détecté');
      console.log(`[NETWORK] Connecté: ${state.isConnected}, Internet: ${state.isInternetReachable}`);
      
      const previousState = this.isConnected;
      this.updateNetworkState(state);
      
      // Notifier tous les listeners
      this.notifyListeners();
      
      // Déclencher la synchronisation si on vient de se reconnecter
      if (!previousState && this.isOnline()) {
        console.log('[NETWORK] Reconnexion détectée - Déclenchement de la synchronisation');
        this.triggerSyncOnReconnection();
      }
      
    } catch (error) {
      console.error('[NETWORK] Erreur lors du traitement du changement réseau:', error);
    }
  }

  /**
   * Met à jour l'état interne du réseau
   * @param state - État du réseau depuis NetInfo
   */
  private updateNetworkState(state: NetInfoState): void {
    this.isConnected = state.isConnected ?? false;
    this.isInternetReachable = state.isInternetReachable ?? false;
    this.networkType = state.type;
    this.networkDetails = state.details;
    
    const now = new Date().toISOString();
    
    if (this.isConnected) {
      this.lastConnectionTime = now;
      console.log(`[NETWORK] Connexion établie à ${now}`);
    } else {
      this.lastDisconnectionTime = now;
      console.log(`[NETWORK] Déconnexion détectée à ${now}`);
    }
  }

  /**
   * Déclenche la synchronisation au retour de connexion
   * Cette méthode sera appelée par le SyncService une fois implémenté
   */
  private triggerSyncOnReconnection(): void {
    try {
      // Import dynamique pour éviter les dépendances circulaires
      // Le SyncService sera importé ici une fois implémenté
      console.log('[NETWORK] Tentative de déclenchement de la synchronisation...');
      
      // TODO: Remplacer par l'import réel du SyncService
      // import SyncService from '../sync/SyncService';
      // SyncService.triggerSync();
      
      console.log('[NETWORK] Synchronisation déclenchée (placeholder)');
      
    } catch (error) {
      console.error('[NETWORK] Erreur lors du déclenchement de la synchronisation:', error);
    }
  }

  /**
   * Vérifie si l'appareil est en ligne (connecté ET internet accessible)
   * @returns true si en ligne, false sinon
   */
  public isOnline(): boolean {
    return this.isConnected && this.isInternetReachable;
  }

  /**
   * Vérifie si l'appareil est connecté (mais pas forcément internet)
   * @returns true si connecté, false sinon
   */
  public isConnectedToNetwork(): boolean {
    return this.isConnected;
  }

  /**
   * Vérifie si internet est accessible
   * @returns true si internet accessible, false sinon
   */
  public isInternetAccessible(): boolean {
    return this.isInternetReachable;
  }

  /**
   * Retourne le type de connexion réseau
   * @returns Type de connexion (wifi, cellular, etc.) ou null
   */
  public getNetworkType(): string | null {
    return this.networkType;
  }

  /**
   * Retourne les détails de la connexion réseau
   * @returns Détails spécifiques au type de connexion
   */
  public getNetworkDetails(): any {
    return this.networkDetails;
  }

  /**
   * Retourne les informations complètes du réseau
   * @returns Objet NetworkInfo avec toutes les informations
   */
  public getNetworkInfo(): NetworkInfo {
    return {
      isConnected: this.isConnected,
      isInternetReachable: this.isInternetReachable,
      type: this.networkType,
      details: this.networkDetails,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Retourne la dernière heure de connexion
   * @returns Timestamp ISO 8601 de la dernière connexion ou null
   */
  public getLastConnectionTime(): string | null {
    return this.lastConnectionTime;
  }

  /**
   * Retourne la dernière heure de déconnexion
   * @returns Timestamp ISO 8601 de la dernière déconnexion ou null
   */
  public getLastDisconnectionTime(): string | null {
    return this.lastDisconnectionTime;
  }

  /**
   * Calcule la durée de déconnexion actuelle
   * @returns Durée en millisecondes ou null si connecté
   */
  public getDisconnectionDuration(): number | null {
    if (this.isConnected || !this.lastDisconnectionTime) {
      return null;
    }
    
    const now = new Date().getTime();
    const disconnectionTime = new Date(this.lastDisconnectionTime).getTime();
    
    return now - disconnectionTime;
  }

  /**
   * Formate la durée de déconnexion en texte lisible
   * @returns Texte formaté (ex: "2h 15min") ou null si connecté
   */
  public getFormattedDisconnectionDuration(): string | null {
    const duration = this.getDisconnectionDuration();
    if (!duration) {
      return null;
    }
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  }

  /**
   * Ajoute un listener pour les changements de réseau
   * @param listener - Fonction à appeler lors des changements
   * @returns Fonction pour supprimer le listener
   */
  public addListener(listener: NetworkChangeListener): () => void {
    console.log('[NETWORK] Ajout d\'un listener de changement réseau');
    this.listeners.push(listener);
    
    // Retourner une fonction de nettoyage
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
        console.log('[NETWORK] Listener de changement réseau supprimé');
      }
    };
  }

  /**
   * Supprime un listener de changement de réseau
   * @param listener - Listener à supprimer
   */
  public removeListener(listener: NetworkChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
      console.log('[NETWORK] Listener de changement réseau supprimé');
    }
  }

  /**
   * Notifie tous les listeners d'un changement de réseau
   */
  private notifyListeners(): void {
    const networkInfo = this.getNetworkInfo();
    
    console.log(`[NETWORK] Notification de ${this.listeners.length} listeners`);
    
    this.listeners.forEach((listener, index) => {
      try {
        listener(networkInfo);
      } catch (error) {
        console.error(`[NETWORK] Erreur dans le listener ${index}:`, error);
      }
    });
  }

  /**
   * Force une vérification de l'état du réseau
   * @returns Promise résolue avec l'état actuel
   */
  public async refreshNetworkState(): Promise<NetworkInfo> {
    try {
      console.log('[NETWORK] Vérification forcée de l\'état du réseau...');
      
      const state = await NetInfo.fetch();
      this.updateNetworkState(state);
      this.notifyListeners();
      
      console.log(`[NETWORK] État vérifié: ${this.isConnected ? 'Connecté' : 'Déconnecté'}`);
      
      return this.getNetworkInfo();
      
    } catch (error) {
      console.error('[NETWORK] Erreur lors de la vérification de l\'état:', error);
      throw new Error(`Échec de la vérification réseau: ${error}`);
    }
  }

  /**
   * Vérifie si le service est initialisé
   * @returns true si initialisé, false sinon
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Retourne le nombre de listeners actifs
   * @returns Nombre de listeners enregistrés
   */
  public getListenerCount(): number {
    return this.listeners.length;
  }

  /**
   * Arrête le service et nettoie les ressources
   */
  public async cleanup(): Promise<void> {
    try {
      console.log('[NETWORK] Nettoyage du service de détection réseau...');
      
      // Désabonner de NetInfo
      if (this.subscription) {
        this.subscription();
        this.subscription = null;
      }
      
      // Vider les listeners
      this.listeners = [];
      
      // Réinitialiser l'état
      this.isConnected = false;
      this.isInternetReachable = false;
      this.networkType = null;
      this.networkDetails = null;
      this.isInitialized = false;
      
      console.log('[NETWORK] Service de détection réseau nettoyé');
      
    } catch (error) {
      console.error('[NETWORK] Erreur lors du nettoyage:', error);
      throw new Error(`Échec du nettoyage du service réseau: ${error}`);
    }
  }

  /**
   * Retourne un résumé de l'état du service
   * @returns Objet avec toutes les informations de statut
   */
  public getServiceStatus(): {
    initialized: boolean;
    connected: boolean;
    internetReachable: boolean;
    networkType: string | null;
    listenersCount: number;
    lastConnection: string | null;
    lastDisconnection: string | null;
    disconnectionDuration: string | null;
  } {
    return {
      initialized: this.isInitialized,
      connected: this.isConnected,
      internetReachable: this.isInternetReachable,
      networkType: this.networkType,
      listenersCount: this.listeners.length,
      lastConnection: this.lastConnectionTime,
      lastDisconnection: this.lastDisconnectionTime,
      disconnectionDuration: this.getFormattedDisconnectionDuration()
    };
  }
}

// Export de l'instance singleton
export default NetworkService.getInstance();

