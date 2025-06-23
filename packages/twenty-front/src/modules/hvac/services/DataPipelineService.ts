/**
 * Data Pipeline Service - Optymalizacja pipeline'u danych HVAC
 * "Pasja rodzi profesjonalizm" - Profesjonalny system synchronizacji danych
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript with no 'any' types
 * - Proper error handling
 * - Performance monitoring integration
 * - Real-time sync between Weaviate (semantic) and Supabase (structured)
 */

import { trackHVACUserAction } from '../index';

// Data Pipeline Types
export interface DataPipeline {
  id: string;
  name: string;
  description: string;
  type: PipelineType;
  source: DataSource;
  destination: DataDestination;
  transformations: DataTransformation[];
  schedule: PipelineSchedule;
  status: PipelineStatus;
  lastRun: Date | null;
  nextRun: Date | null;
  metrics: PipelineMetrics;
  configuration: PipelineConfiguration;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataSource {
  type: 'supabase' | 'weaviate' | 'api' | 'file' | 'webhook';
  connection: ConnectionConfig;
  query?: string;
  filters?: Record<string, unknown>;
  batchSize: number;
  incrementalField?: string; // for incremental sync
}

export interface DataDestination {
  type: 'supabase' | 'weaviate' | 'api' | 'file';
  connection: ConnectionConfig;
  table?: string;
  collection?: string;
  upsertStrategy: 'insert' | 'update' | 'upsert' | 'replace';
  conflictResolution: 'source_wins' | 'destination_wins' | 'merge' | 'manual';
}

export interface ConnectionConfig {
  url: string;
  apiKey?: string;
  database?: string;
  schema?: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface DataTransformation {
  id: string;
  name: string;
  type: TransformationType;
  order: number;
  configuration: TransformationConfig;
  isEnabled: boolean;
}

export interface TransformationConfig {
  mapping?: FieldMapping[];
  validation?: ValidationRule[];
  enrichment?: EnrichmentRule[];
  aggregation?: AggregationRule[];
  customScript?: string;
}

export interface FieldMapping {
  sourceField: string;
  destinationField: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array';
  defaultValue?: unknown;
  transformation?: string; // JavaScript expression
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  parameters: Record<string, unknown>;
  errorAction: 'skip' | 'fail' | 'default';
}

export interface EnrichmentRule {
  field: string;
  source: 'api' | 'lookup' | 'calculation' | 'ai';
  configuration: Record<string, unknown>;
}

export interface AggregationRule {
  groupBy: string[];
  aggregations: Array<{
    field: string;
    function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'concat';
    alias: string;
  }>;
}

export interface PipelineSchedule {
  type: 'manual' | 'interval' | 'cron' | 'event';
  interval?: number; // minutes
  cronExpression?: string;
  eventTrigger?: string;
  timezone: string;
  isEnabled: boolean;
}

export interface PipelineMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageRunTime: number; // seconds
  lastRunDuration: number; // seconds
  recordsProcessed: number;
  recordsSuccess: number;
  recordsError: number;
  dataVolume: number; // bytes
  errorRate: number; // percentage
}

export interface PipelineConfiguration {
  parallelism: number;
  memoryLimit: number; // MB
  timeoutLimit: number; // seconds
  enableLogging: boolean;
  enableMetrics: boolean;
  enableAlerts: boolean;
  alertThresholds: AlertThresholds;
  retryPolicy: RetryPolicy;
}

export interface AlertThresholds {
  errorRate: number; // percentage
  runTime: number; // seconds
  memoryUsage: number; // percentage
  failureCount: number;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number; // seconds
  maxDelay: number; // seconds
}

export type PipelineType = 
  | 'sync' 
  | 'etl' 
  | 'streaming' 
  | 'batch' 
  | 'real_time' 
  | 'incremental';

export type PipelineStatus = 
  | 'active' 
  | 'paused' 
  | 'stopped' 
  | 'running' 
  | 'failed' 
  | 'completed';

export type TransformationType = 
  | 'mapping' 
  | 'validation' 
  | 'enrichment' 
  | 'aggregation' 
  | 'filtering' 
  | 'custom';

// Real-time Sync Configuration
export interface RealTimeSyncConfig {
  enabled: boolean;
  syncInterval: number; // milliseconds
  batchSize: number;
  conflictResolution: 'timestamp' | 'version' | 'manual';
  syncDirection: 'bidirectional' | 'supabase_to_weaviate' | 'weaviate_to_supabase';
  enabledTables: string[];
  enabledCollections: string[];
  transformations: SyncTransformation[];
}

export interface SyncTransformation {
  sourceType: 'supabase' | 'weaviate';
  sourceEntity: string;
  destinationType: 'supabase' | 'weaviate';
  destinationEntity: string;
  fieldMappings: FieldMapping[];
  conditions?: SyncCondition[];
}

export interface SyncCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: unknown;
}

// Pipeline Analytics
export interface PipelineAnalytics {
  totalPipelines: number;
  activePipelines: number;
  runningPipelines: number;
  failedPipelines: number;
  averageSuccessRate: number;
  totalDataProcessed: number; // bytes
  averageProcessingTime: number; // seconds
  pipelinePerformance: PipelinePerformance[];
  errorAnalysis: ErrorAnalysis[];
  resourceUtilization: ResourceUtilization;
}

export interface PipelinePerformance {
  pipelineId: string;
  pipelineName: string;
  successRate: number;
  averageRunTime: number;
  throughput: number; // records per second
  errorCount: number;
  lastRun: Date;
}

export interface ErrorAnalysis {
  errorType: string;
  count: number;
  percentage: number;
  affectedPipelines: string[];
  commonCauses: string[];
}

export interface ResourceUtilization {
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  networkUsage: number; // bytes per second
  storageUsage: number; // bytes
}

/**
 * Data Pipeline Service Class
 * Zarządza pipeline'ami danych między Weaviate a Supabase
 */
export class DataPipelineService {
  private baseURL: string;
  private cache: Map<string, { data: unknown; timestamp: number }>;
  private readonly CACHE_TTL = 1 * 60 * 1000; // 1 minute for real-time data
  private syncQueue: Array<{ id: string; data: unknown; timestamp: Date }> = [];
  private isProcessing = false;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_HVAC_API_URL || 'http://localhost:8000';
    this.cache = new Map();
  }

  /**
   * Make API call with error handling and performance tracking
   */
  private async makeAPICall<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; status: number }> {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_HVAC_API_KEY || ''}`,
          ...options.headers,
        },
        ...options,
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      trackHVACUserAction('pipeline_api_success', 'API_SUCCESS', {
        endpoint,
        duration,
        status: response.status,
      });

      return { data, status: response.status };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      trackHVACUserAction('pipeline_api_error', 'API_ERROR', {
        endpoint,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Get all data pipelines
   */
  async getPipelines(filters?: {
    type?: PipelineType;
    status?: PipelineStatus;
    search?: string;
  }): Promise<DataPipeline[]> {
    const cacheKey = `pipelines_${JSON.stringify(filters)}`;
    const cached = this.getCachedData<DataPipeline[]>(cacheKey);
    
    if (cached) {
      trackHVACUserAction('pipeline_cache_hit', 'API_CACHE', { filters });
      return cached;
    }

    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await this.makeAPICall<DataPipeline[]>(
      `/api/v1/data-pipeline/pipelines?${queryParams.toString()}`
    );

    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Create new pipeline
   */
  async createPipeline(pipelineData: Omit<DataPipeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataPipeline> {
    const response = await this.makeAPICall<DataPipeline>('/api/v1/data-pipeline/pipelines', {
      method: 'POST',
      body: JSON.stringify(pipelineData),
    });

    // Invalidate cache
    this.invalidateCache('pipelines_');

    trackHVACUserAction('pipeline_created', 'DATA_PIPELINE', {
      pipelineId: response.data.id,
      pipelineType: response.data.type,
      sourceType: response.data.source.type,
      destinationType: response.data.destination.type,
    });

    return response.data;
  }

  /**
   * Run pipeline manually
   */
  async runPipeline(pipelineId: string, options?: {
    fullSync?: boolean;
    dryRun?: boolean;
  }): Promise<{ runId: string; status: string }> {
    const response = await this.makeAPICall<{ runId: string; status: string }>(
      `/api/v1/data-pipeline/pipelines/${pipelineId}/run`,
      {
        method: 'POST',
        body: JSON.stringify(options || {}),
      }
    );

    trackHVACUserAction('pipeline_run_started', 'DATA_PIPELINE', {
      pipelineId,
      runId: response.data.runId,
      options,
    });

    return response.data;
  }

  /**
   * Get pipeline run status
   */
  async getPipelineRunStatus(runId: string): Promise<{
    status: string;
    progress: number;
    recordsProcessed: number;
    errors: string[];
    startTime: Date;
    endTime?: Date;
  }> {
    const response = await this.makeAPICall<{
      status: string;
      progress: number;
      recordsProcessed: number;
      errors: string[];
      startTime: Date;
      endTime?: Date;
    }>(`/api/v1/data-pipeline/runs/${runId}/status`);

    return response.data;
  }

  /**
   * Configure real-time sync
   */
  async configureRealTimeSync(config: RealTimeSyncConfig): Promise<void> {
    await this.makeAPICall('/api/v1/data-pipeline/real-time-sync/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });

    trackHVACUserAction('real_time_sync_configured', 'DATA_PIPELINE', {
      enabled: config.enabled,
      syncInterval: config.syncInterval,
      syncDirection: config.syncDirection,
    });
  }

  /**
   * Get real-time sync status
   */
  async getRealTimeSyncStatus(): Promise<{
    isRunning: boolean;
    lastSync: Date;
    syncCount: number;
    errorCount: number;
    queueSize: number;
  }> {
    const response = await this.makeAPICall<{
      isRunning: boolean;
      lastSync: Date;
      syncCount: number;
      errorCount: number;
      queueSize: number;
    }>('/api/v1/data-pipeline/real-time-sync/status');

    return response.data;
  }

  /**
   * Sync specific record between Weaviate and Supabase
   */
  async syncRecord(
    recordId: string,
    sourceType: 'supabase' | 'weaviate',
    destinationType: 'supabase' | 'weaviate',
    transformationId?: string
  ): Promise<void> {
    const syncData = {
      recordId,
      sourceType,
      destinationType,
      transformationId,
      timestamp: new Date(),
    };

    await this.makeAPICall('/api/v1/data-pipeline/sync-record', {
      method: 'POST',
      body: JSON.stringify(syncData),
    });

    trackHVACUserAction('record_synced', 'DATA_PIPELINE', {
      recordId,
      sourceType,
      destinationType,
    });
  }

  /**
   * Get pipeline analytics
   */
  async getPipelineAnalytics(dateRange?: {
    from: Date;
    to: Date;
  }): Promise<PipelineAnalytics> {
    const cacheKey = `analytics_${JSON.stringify(dateRange)}`;
    const cached = this.getCachedData<PipelineAnalytics>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const queryParams = new URLSearchParams();
    if (dateRange) {
      queryParams.append('from', dateRange.from.toISOString());
      queryParams.append('to', dateRange.to.toISOString());
    }

    const response = await this.makeAPICall<PipelineAnalytics>(
      `/api/v1/data-pipeline/analytics?${queryParams.toString()}`
    );

    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Test pipeline connection
   */
  async testConnection(connection: ConnectionConfig): Promise<{
    success: boolean;
    latency: number;
    error?: string;
  }> {
    const response = await this.makeAPICall<{
      success: boolean;
      latency: number;
      error?: string;
    }>('/api/v1/data-pipeline/test-connection', {
      method: 'POST',
      body: JSON.stringify(connection),
    });

    trackHVACUserAction('connection_tested', 'DATA_PIPELINE', {
      connectionType: connection.url.includes('supabase') ? 'supabase' : 'weaviate',
      success: response.data.success,
      latency: response.data.latency,
    });

    return response.data;
  }

  /**
   * Cache management
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private invalidateCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// Export singleton instance
export const dataPipelineService = new DataPipelineService();
