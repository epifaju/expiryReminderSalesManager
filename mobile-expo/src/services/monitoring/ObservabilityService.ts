/**
 * Service d'observabilité - Logs structurés et traces distribuées
 * 
 * Ce service gère :
 * - Logs structurés avec contexte
 * - Traces distribuées pour le suivi des opérations
 * - Spans pour la mesure de performance
 * - Corrélation des logs et traces
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LogLevel,
  LogEntry,
  LogContext,
  ErrorDetails,
  Trace,
  Span,
  SpanStatus,
  TraceStatus,
  SpanLog,
  IObservabilityService,
} from '../../types/monitoring';

/**
 * Clés de stockage
 */
const STORAGE_KEYS = {
  LOGS: '@observability:logs',
  TRACES: '@observability:traces',
  CONTEXT: '@observability:context',
};

/**
 * Service singleton d'observabilité
 */
class ObservabilityService implements IObservabilityService {
  private static instance: ObservabilityService;
  
  private context: LogContext = {};
  private logs: LogEntry[] = [];
  private traces: Map<string, Trace> = new Map();
  private activeSpans: Map<string, Span> = new Map();
  
  private maxLogsInMemory = 1000;
  private maxTracesInMemory = 100;
  
  private constructor() {
    this.loadData().catch(err => 
      console.error('[OBSERVABILITY] Erreur chargement initial:', err)
    );
  }
  
  /**
   * Obtient l'instance singleton
   */
  public static getInstance(): ObservabilityService {
    if (!ObservabilityService.instance) {
      ObservabilityService.instance = new ObservabilityService();
    }
    return ObservabilityService.instance;
  }
  
  /**
   * Définit le contexte global
   */
  public setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
    console.log('[OBSERVABILITY] Contexte mis à jour:', this.context);
  }
  
  /**
   * Récupère le contexte actuel
   */
  public getContext(): LogContext {
    return { ...this.context };
  }
  
  /**
   * Log un message
   */
  public log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    metadata?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'mobile-app',
      context: { ...this.context, ...context },
      metadata,
    };
    
    this.logs.push(entry);
    
    // Log console basé sur le niveau
    this.logToConsole(entry);
    
    // Limiter la taille
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-Math.floor(this.maxLogsInMemory * 0.8));
    }
    
    // Sauvegarder périodiquement
    if (this.logs.length % 50 === 0) {
      this.saveData().catch(err => 
        console.error('[OBSERVABILITY] Erreur sauvegarde:', err)
      );
    }
  }
  
  /**
   * Trace une opération asynchrone
   */
  public async trace<T>(
    name: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const trace: Trace = {
      traceId: this.generateId(),
      spans: [],
      duration: 0,
      status: TraceStatus.SUCCESS,
      startTime: new Date().toISOString(),
      endTime: '',
      metadata: context,
    };
    
    this.traces.set(trace.traceId, trace);
    
    const rootSpan = this.createSpan(name, undefined, trace.traceId);
    const startTime = Date.now();
    
    try {
      this.log(LogLevel.DEBUG, `Trace started: ${name}`, {
        ...context,
        traceId: trace.traceId,
      });
      
      const result = await fn();
      
      const duration = Date.now() - startTime;
      trace.duration = duration;
      trace.endTime = new Date().toISOString();
      
      this.endSpan(rootSpan, SpanStatus.OK);
      
      this.log(LogLevel.DEBUG, `Trace completed: ${name} (${duration}ms)`, {
        ...context,
        traceId: trace.traceId,
      });
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      trace.duration = duration;
      trace.endTime = new Date().toISOString();
      trace.status = TraceStatus.ERROR;
      
      this.endSpan(rootSpan, SpanStatus.ERROR, this.errorToDetails(error as Error));
      
      this.log(LogLevel.ERROR, `Trace failed: ${name}`, {
        ...context,
        traceId: trace.traceId,
      }, {
        error: this.errorToDetails(error as Error),
        duration,
      });
      
      throw error;
    } finally {
      // Nettoyer si trop de traces
      if (this.traces.size > this.maxTracesInMemory) {
        const oldestKeys = Array.from(this.traces.keys()).slice(0, 20);
        oldestKeys.forEach(key => this.traces.delete(key));
      }
    }
  }
  
  /**
   * Crée un nouveau span
   */
  public createSpan(name: string, parentSpan?: Span, traceId?: string): Span {
    const span: Span = {
      spanId: this.generateId(),
      traceId: traceId || parentSpan?.traceId || this.generateId(),
      parentSpanId: parentSpan?.spanId,
      name,
      service: 'mobile-app',
      operation: name,
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0,
      status: SpanStatus.UNSET,
      logs: [],
    };
    
    this.activeSpans.set(span.spanId, span);
    
    // Ajouter à la trace si elle existe
    const trace = this.traces.get(span.traceId);
    if (trace) {
      trace.spans.push(span);
    }
    
    return span;
  }
  
  /**
   * Termine un span
   */
  public endSpan(span: Span, status?: SpanStatus, error?: ErrorDetails): void {
    const activeSpan = this.activeSpans.get(span.spanId);
    if (!activeSpan) {
      console.warn('[OBSERVABILITY] Span non trouvé:', span.spanId);
      return;
    }
    
    activeSpan.endTime = new Date().toISOString();
    activeSpan.duration = new Date(activeSpan.endTime).getTime() - new Date(activeSpan.startTime).getTime();
    activeSpan.status = status || SpanStatus.OK;
    activeSpan.error = error;
    
    this.activeSpans.delete(span.spanId);
    
    this.log(LogLevel.TRACE, `Span completed: ${activeSpan.name} (${activeSpan.duration}ms)`, {
      traceId: activeSpan.traceId,
      spanId: activeSpan.spanId,
    });
  }
  
  /**
   * Ajoute un log à un span
   */
  public addSpanLog(span: Span, fields: Record<string, any>): void {
    const activeSpan = this.activeSpans.get(span.spanId);
    if (activeSpan) {
      activeSpan.logs?.push({
        timestamp: new Date().toISOString(),
        fields,
      });
    }
  }
  
  /**
   * Récupère tous les logs
   */
  public getLogs(
    level?: LogLevel,
    limit: number = 100,
    offset: number = 0
  ): LogEntry[] {
    let filteredLogs = [...this.logs];
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(offset, offset + limit);
  }
  
  /**
   * Récupère une trace par ID
   */
  public getTrace(traceId: string): Trace | undefined {
    return this.traces.get(traceId);
  }
  
  /**
   * Récupère toutes les traces
   */
  public getTraces(limit: number = 50): Trace[] {
    return Array.from(this.traces.values()).slice(-limit);
  }
  
  /**
   * Recherche dans les logs
   */
  public searchLogs(query: string, limit: number = 100): LogEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.logs
      .filter(log => 
        log.message.toLowerCase().includes(lowerQuery) ||
        JSON.stringify(log.metadata).toLowerCase().includes(lowerQuery)
      )
      .slice(-limit);
  }
  
  /**
   * Nettoie les anciennes données
   */
  public async cleanup(retentionDays: number = 7): Promise<void> {
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    
    const beforeLogsCount = this.logs.length;
    const beforeTracesCount = this.traces.size;
    
    this.logs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > cutoffTime
    );
    
    const oldTraces = Array.from(this.traces.entries())
      .filter(([_, trace]) => new Date(trace.startTime).getTime() < cutoffTime)
      .map(([id]) => id);
    
    oldTraces.forEach(id => this.traces.delete(id));
    
    const removedLogs = beforeLogsCount - this.logs.length;
    const removedTraces = beforeTracesCount - this.traces.size;
    
    console.log(`[OBSERVABILITY] Nettoyage: ${removedLogs} logs, ${removedTraces} traces supprimés`);
    
    await this.saveData();
  }
  
  /**
   * Exporte les données
   */
  public async exportData(format: 'json' | 'text' = 'json'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        context: this.context,
        logs: this.logs,
        traces: Array.from(this.traces.values()),
        exportedAt: new Date().toISOString(),
      }, null, 2);
    } else {
      // Format texte
      const lines: string[] = [];
      lines.push('=== OBSERVABILITY DATA EXPORT ===');
      lines.push(`Exported at: ${new Date().toISOString()}`);
      lines.push(`Total logs: ${this.logs.length}`);
      lines.push(`Total traces: ${this.traces.size}`);
      lines.push('');
      lines.push('=== LOGS ===');
      
      this.logs.forEach(log => {
        lines.push(`[${log.timestamp}] ${log.level.toUpperCase()} - ${log.message}`);
        if (log.metadata) {
          lines.push(`  Metadata: ${JSON.stringify(log.metadata)}`);
        }
      });
      
      lines.push('');
      lines.push('=== TRACES ===');
      
      Array.from(this.traces.values()).forEach(trace => {
        lines.push(`Trace ${trace.traceId} (${trace.status}) - Duration: ${trace.duration}ms`);
        trace.spans.forEach(span => {
          const indent = '  '.repeat((span.parentSpanId ? 1 : 0) + 1);
          lines.push(`${indent}Span: ${span.name} (${span.duration}ms) - ${span.status}`);
        });
      });
      
      return lines.join('\n');
    }
  }
  
  // ============================================================================
  // Méthodes utilitaires privées
  // ============================================================================
  
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.level.toUpperCase()}]`;
    const contextStr = entry.context?.traceId 
      ? ` [trace:${entry.context.traceId.substring(0, 8)}]` 
      : '';
    
    const message = `${prefix}${contextStr} ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.FATAL:
      case LogLevel.ERROR:
        console.error(message, entry.metadata || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.metadata || '');
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        if (__DEV__) {
          console.debug(message, entry.metadata || '');
        }
        break;
      default:
        console.log(message, entry.metadata || '');
    }
  }
  
  private errorToDetails(error: Error): ErrorDetails {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private async loadData(): Promise<void> {
    try {
      const [logsData, tracesData, contextData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.TRACES),
        AsyncStorage.getItem(STORAGE_KEYS.CONTEXT),
      ]);
      
      if (logsData) {
        this.logs = JSON.parse(logsData);
      }
      if (tracesData) {
        const tracesArray = JSON.parse(tracesData) as Trace[];
        tracesArray.forEach(trace => this.traces.set(trace.traceId, trace));
      }
      if (contextData) {
        this.context = JSON.parse(contextData);
      }
      
      console.log('[OBSERVABILITY] Données chargées');
    } catch (error) {
      console.error('[OBSERVABILITY] Erreur chargement:', error);
    }
  }
  
  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.logs.slice(-500))),
        AsyncStorage.setItem(STORAGE_KEYS.TRACES, JSON.stringify(
          Array.from(this.traces.values()).slice(-50)
        )),
        AsyncStorage.setItem(STORAGE_KEYS.CONTEXT, JSON.stringify(this.context)),
      ]);
    } catch (error) {
      console.error('[OBSERVABILITY] Erreur sauvegarde:', error);
    }
  }
}

export default ObservabilityService.getInstance();

