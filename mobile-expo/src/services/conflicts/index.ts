/**
 * Index des services de résolution de conflits
 * Centralise tous les exports liés aux conflits
 */

// Export du service principal
export { default as ConflictService } from './ConflictService';

// Export des hooks
export {
  useConflicts,
  useHasConflicts,
  usePendingConflicts,
  useConflictMetrics,
  useConflictResolution,
  useConflictDetection,
  useAutoConflictResolution,
  type UseConflictsReturn
} from '../../hooks/useConflicts';

// Export de tous les types
export * from '../../types/conflicts';

