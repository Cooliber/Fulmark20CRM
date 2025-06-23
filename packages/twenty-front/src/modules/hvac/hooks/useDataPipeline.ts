/**
 * useDataPipeline Hook - Zarządzanie pipeline'em danych HVAC
 * "Pasja rodzi profesjonalizm" - Profesjonalny hook do data pipeline management
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Event handlers over useEffect
 * - Proper TypeScript typing
 * - Performance optimization with real-time sync
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  dataPipelineService,
  DataPipeline,
  PipelineType,
  PipelineStatus,
  PipelineAnalytics,
  RealTimeSyncConfig,
} from '../services/DataPipelineService';
import { trackHVACUserAction } from '../index';

// Hook state interface
interface UseDataPipelineState {
  pipelines: DataPipeline[];
  selectedPipeline: DataPipeline | null;
  analytics: PipelineAnalytics | null;
  realTimeSyncStatus: RealTimeSyncStatus | null;
  loading: boolean;
  error: string | null;
  runningPipelines: Map<string, PipelineRunStatus>;
}

// Real-time sync status
interface RealTimeSyncStatus {
  isRunning: boolean;
  lastSync: Date;
  syncCount: number;
  errorCount: number;
  queueSize: number;
}

// Pipeline run status
interface PipelineRunStatus {
  runId: string;
  status: string;
  progress: number;
  recordsProcessed: number;
  errors: string[];
  startTime: Date;
  endTime?: Date;
}

// Hook options
interface UseDataPipelineOptions {
  autoLoad?: boolean;
  enableRealTimeUpdates?: boolean;
  refreshInterval?: number; // in milliseconds
  onPipelineCreated?: (pipeline: DataPipeline) => void;
  onPipelineRunCompleted?: (runId: string, status: string) => void;
  onSyncError?: (error: string) => void;
  onError?: (error: Error) => void;
}

// Hook return type
interface UseDataPipelineReturn {
  // State
  pipelines: DataPipeline[];
  selectedPipeline: DataPipeline | null;
  analytics: PipelineAnalytics | null;
  realTimeSyncStatus: RealTimeSyncStatus | null;
  loading: boolean;
  error: string | null;
  runningPipelines: Map<string, PipelineRunStatus>;

  // Pipeline operations
  loadPipelines: (filters?: { type?: PipelineType; status?: PipelineStatus; search?: string }) => Promise<void>;
  createPipeline: (pipelineData: Omit<DataPipeline, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DataPipeline>;
  runPipeline: (pipelineId: string, options?: { fullSync?: boolean; dryRun?: boolean }) => Promise<string>;
  selectPipeline: (pipeline: DataPipeline | null) => void;

  // Real-time sync operations
  configureRealTimeSync: (config: RealTimeSyncConfig) => Promise<void>;
  loadRealTimeSyncStatus: () => Promise<void>;
  syncRecord: (recordId: string, sourceType: 'supabase' | 'weaviate', destinationType: 'supabase' | 'weaviate') => Promise<void>;

  // Analytics operations
  loadAnalytics: (dateRange?: { from: Date; to: Date }) => Promise<void>;
  getPipelineMetrics: (pipelineId: string) => PipelineMetrics | null;
  getSuccessRate: (pipelineId: string) => number;

  // Monitoring operations
  monitorPipelineRun: (runId: string) => Promise<void>;
  stopMonitoring: (runId: string) => void;
  testConnection: (connection: any) => Promise<{ success: boolean; latency: number; error?: string }>;

  // Utility functions
  getActivePipelines: () => DataPipeline[];
  getFailedPipelines: () => DataPipeline[];
  refreshPipelines: () => Promise<void>;
  clearError: () => void;
}

// Pipeline metrics interface
interface PipelineMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageRunTime: number;
  lastRunDuration: number;
  recordsProcessed: number;
  recordsSuccess: number;
  recordsError: number;
  errorRate: number;
}

/**
 * Data pipeline hook with comprehensive pipeline management
 * Implements HVAC CRM data synchronization between Weaviate and Supabase
 */
export const useDataPipeline = (
  options: UseDataPipelineOptions = {}
): UseDataPipelineReturn => {
  const {
    autoLoad = true,
    enableRealTimeUpdates = false,
    refreshInterval = 30000, // 30 seconds
    onPipelineCreated,
    onPipelineRunCompleted,
    onSyncError,
    onError,
  } = options;

  // State management
  const [state, setState] = useState<UseDataPipelineState>({
    pipelines: [],
    selectedPipeline: null,
    analytics: null,
    realTimeSyncStatus: null,
    loading: false,
    error: null,
    runningPipelines: new Map(),
  });

  const abortControllerRef = useRef<AbortController>();
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const monitoringIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load pipelines
  const loadPipelines = useCallback(async (filters?: {
    type?: PipelineType;
    status?: PipelineStatus;
    search?: string;
  }) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      trackHVACUserAction('pipeline_load_started', 'DATA_PIPELINE', {
        filters,
      });

      const pipelines = await dataPipelineService.getPipelines(filters);

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setState(prev => ({
        ...prev,
        pipelines,
        loading: false,
      }));

      trackHVACUserAction('pipeline_load_success', 'DATA_PIPELINE', {
        count: pipelines.length,
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));

      trackHVACUserAction('pipeline_load_error', 'DATA_PIPELINE', {
        error: errorMessage,
      });
    }
  }, [onError]);

  // Create pipeline
  const createPipeline = useCallback(async (
    pipelineData: Omit<DataPipeline, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DataPipeline> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const newPipeline = await dataPipelineService.createPipeline(pipelineData);

      // Refresh pipelines
      await loadPipelines();

      onPipelineCreated?.(newPipeline);

      return newPipeline;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [loadPipelines, onPipelineCreated, onError]);

  // Run pipeline
  const runPipeline = useCallback(async (
    pipelineId: string,
    options?: { fullSync?: boolean; dryRun?: boolean }
  ): Promise<string> => {
    try {
      const result = await dataPipelineService.runPipeline(pipelineId, options);

      // Start monitoring the run
      monitorPipelineRun(result.runId);

      return result.runId;

    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to run pipeline'));
      throw error;
    }
  }, [onError]);

  // Select pipeline
  const selectPipeline = useCallback((pipeline: DataPipeline | null) => {
    setState(prev => ({ ...prev, selectedPipeline: pipeline }));
    
    if (pipeline) {
      trackHVACUserAction('pipeline_selected', 'DATA_PIPELINE', {
        pipelineId: pipeline.id,
        pipelineType: pipeline.type,
        status: pipeline.status,
      });
    }
  }, []);

  // Configure real-time sync
  const configureRealTimeSync = useCallback(async (config: RealTimeSyncConfig) => {
    try {
      await dataPipelineService.configureRealTimeSync(config);
      
      // Refresh sync status
      await loadRealTimeSyncStatus();

    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to configure real-time sync'));
    }
  }, [onError]);

  // Load real-time sync status
  const loadRealTimeSyncStatus = useCallback(async () => {
    try {
      const status = await dataPipelineService.getRealTimeSyncStatus();
      setState(prev => ({ ...prev, realTimeSyncStatus: status }));
    } catch (error) {
      onSyncError?.('Failed to load real-time sync status');
    }
  }, [onSyncError]);

  // Sync record
  const syncRecord = useCallback(async (
    recordId: string,
    sourceType: 'supabase' | 'weaviate',
    destinationType: 'supabase' | 'weaviate'
  ) => {
    try {
      await dataPipelineService.syncRecord(recordId, sourceType, destinationType);
      
      trackHVACUserAction('record_sync_requested', 'DATA_PIPELINE', {
        recordId,
        sourceType,
        destinationType,
      });

    } catch (error) {
      onSyncError?.(error instanceof Error ? error.message : 'Failed to sync record');
    }
  }, [onSyncError]);

  // Load analytics
  const loadAnalytics = useCallback(async (dateRange?: { from: Date; to: Date }) => {
    try {
      const analytics = await dataPipelineService.getPipelineAnalytics(dateRange);
      setState(prev => ({ ...prev, analytics }));
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to load analytics'));
    }
  }, [onError]);

  // Get pipeline metrics
  const getPipelineMetrics = useCallback((pipelineId: string): PipelineMetrics | null => {
    const pipeline = state.pipelines.find(p => p.id === pipelineId);
    return pipeline ? pipeline.metrics : null;
  }, [state.pipelines]);

  // Get success rate
  const getSuccessRate = useCallback((pipelineId: string): number => {
    const metrics = getPipelineMetrics(pipelineId);
    if (!metrics || metrics.totalRuns === 0) return 0;
    return (metrics.successfulRuns / metrics.totalRuns) * 100;
  }, [getPipelineMetrics]);

  // Monitor pipeline run
  const monitorPipelineRun = useCallback(async (runId: string) => {
    // Clear existing monitoring for this run
    const existingInterval = monitoringIntervals.current.get(runId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const status = await dataPipelineService.getPipelineRunStatus(runId);

        setState(prev => ({
          ...prev,
          runningPipelines: new Map(prev.runningPipelines).set(runId, {
            runId,
            ...status,
          }),
        }));

        // Stop monitoring if completed
        if (status.status === 'completed' || status.status === 'failed') {
          stopMonitoring(runId);
          onPipelineRunCompleted?.(runId, status.status);
        }

      } catch (error) {
        console.error('Failed to get pipeline run status:', error);
        stopMonitoring(runId);
      }
    }, 5000); // Check every 5 seconds

    monitoringIntervals.current.set(runId, interval);
  }, [onPipelineRunCompleted]);

  // Stop monitoring
  const stopMonitoring = useCallback((runId: string) => {
    const interval = monitoringIntervals.current.get(runId);
    if (interval) {
      clearInterval(interval);
      monitoringIntervals.current.delete(runId);
    }

    setState(prev => {
      const newRunningPipelines = new Map(prev.runningPipelines);
      newRunningPipelines.delete(runId);
      return { ...prev, runningPipelines: newRunningPipelines };
    });
  }, []);

  // Test connection
  const testConnection = useCallback(async (connection: any) => {
    try {
      return await dataPipelineService.testConnection(connection);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to test connection'));
      throw error;
    }
  }, [onError]);

  // Get active pipelines
  const getActivePipelines = useCallback((): DataPipeline[] => {
    return state.pipelines.filter(pipeline => pipeline.status === 'active');
  }, [state.pipelines]);

  // Get failed pipelines
  const getFailedPipelines = useCallback((): DataPipeline[] => {
    return state.pipelines.filter(pipeline => pipeline.status === 'failed');
  }, [state.pipelines]);

  // Refresh pipelines
  const refreshPipelines = useCallback(async () => {
    await loadPipelines();
  }, [loadPipelines]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-load pipelines on mount
  useEffect(() => {
    if (autoLoad) {
      loadPipelines();
      loadRealTimeSyncStatus();
      loadAnalytics();
    }
  }, [autoLoad, loadPipelines, loadRealTimeSyncStatus, loadAnalytics]);

  // Real-time updates
  useEffect(() => {
    if (enableRealTimeUpdates) {
      refreshIntervalRef.current = setInterval(() => {
        refreshPipelines();
        loadRealTimeSyncStatus();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [enableRealTimeUpdates, refreshInterval, refreshPipelines, loadRealTimeSyncStatus]);

  // Cleanup monitoring intervals on unmount
  useEffect(() => {
    return () => {
      monitoringIntervals.current.forEach(interval => {
        clearInterval(interval);
      });
      monitoringIntervals.current.clear();
    };
  }, []);

  return {
    // State
    pipelines: state.pipelines,
    selectedPipeline: state.selectedPipeline,
    analytics: state.analytics,
    realTimeSyncStatus: state.realTimeSyncStatus,
    loading: state.loading,
    error: state.error,
    runningPipelines: state.runningPipelines,

    // Pipeline operations
    loadPipelines,
    createPipeline,
    runPipeline,
    selectPipeline,

    // Real-time sync operations
    configureRealTimeSync,
    loadRealTimeSyncStatus,
    syncRecord,

    // Analytics operations
    loadAnalytics,
    getPipelineMetrics,
    getSuccessRate,

    // Monitoring operations
    monitorPipelineRun,
    stopMonitoring,
    testConnection,

    // Utility functions
    getActivePipelines,
    getFailedPipelines,
    refreshPipelines,
    clearError,
  };
};
