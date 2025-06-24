import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';
import { HvacSentryService, HVACErrorContext } from './hvac-sentry.service';
import { HvacCacheManagerService } from './hvac-cache-manager.service';

export interface QueryPerformanceMetrics {
  queryId: string;
  query: string;
  averageExecutionTime: number;
  executionCount: number;
  lastExecuted: Date;
  slowestExecution: number;
  fastestExecution: number;
  errorCount: number;
  cacheHitRate: number;
}

export interface DatabaseOptimizationReport {
  slowQueries: QueryPerformanceMetrics[];
  indexRecommendations: IndexRecommendation[];
  connectionPoolStats: ConnectionPoolStats;
  cacheEfficiency: CacheEfficiencyReport;
  recommendations: OptimizationRecommendation[];
}

export interface IndexRecommendation {
  table: string;
  columns: string[];
  reason: string;
  estimatedImpact: 'low' | 'medium' | 'high';
  query: string;
}

export interface ConnectionPoolStats {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  maxConnections: number;
  averageWaitTime: number;
  connectionErrors: number;
}

export interface CacheEfficiencyReport {
  queryCache: {
    hitRate: number;
    totalQueries: number;
    averageResponseTime: number;
  };
  entityCache: {
    hitRate: number;
    totalRequests: number;
    memoryUsage: number;
  };
}

export interface OptimizationRecommendation {
  type: 'query' | 'index' | 'cache' | 'connection';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImpact: string;
  implementation: string;
}

@Injectable()
export class HvacDatabaseOptimizerService {
  private readonly logger = new Logger(HvacDatabaseOptimizerService.name);
  private queryMetrics = new Map<string, QueryPerformanceMetrics>();
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private readonly MAX_METRICS_ENTRIES = 1000;

  constructor(
    private readonly hvacConfigService: HvacConfigService,
    private readonly hvacSentryService: HvacSentryService,
    private readonly cacheManager: HvacCacheManagerService,
  ) {
    this.logger.log('HVAC Database Optimizer initialized');
  }

  // Monitor query execution and collect metrics
  async monitorQuery<T>(
    queryId: string,
    query: string,
    executor: () => Promise<T>,
    useCache = true
  ): Promise<T> {
    const startTime = Date.now();
    let result: T;
    let fromCache = false;

    try {
      // Try cache first if enabled
      if (useCache) {
        const cacheKey = `query:${queryId}:${this.hashQuery(query)}`;
        const cachedResult = await this.cacheManager.get<T>(cacheKey);
        
        if (cachedResult !== null) {
          fromCache = true;
          result = cachedResult;
        } else {
          result = await executor();
          // Cache the result with appropriate TTL based on query type
          const ttl = this.determineCacheTtl(query);
          await this.cacheManager.set(cacheKey, result, {
            ttl,
            tags: ['database-query', queryId],
          });
        }
      } else {
        result = await executor();
      }

      const executionTime = Date.now() - startTime;
      this.recordQueryMetrics(queryId, query, executionTime, false, fromCache);

      // Log slow queries
      if (executionTime > this.SLOW_QUERY_THRESHOLD && !fromCache) {
        this.logger.warn(`Slow query detected: ${queryId}`, {
          executionTime,
          query: query.substring(0, 200),
        });
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordQueryMetrics(queryId, query, executionTime, true, fromCache);
      
      this.hvacSentryService.reportHVACError(
        error as Error,
        {
          context: HVACErrorContext.CONFIGURATION,
          operation: 'database_query',
          additionalData: {
            queryId,
            executionTime,
            query: query.substring(0, 200),
          },
        },
        'error'
      );
      
      throw error;
    }
  }

  private recordQueryMetrics(
    queryId: string,
    query: string,
    executionTime: number,
    isError: boolean,
    fromCache: boolean
  ): void {
    let metrics = this.queryMetrics.get(queryId);
    
    if (!metrics) {
      metrics = {
        queryId,
        query,
        averageExecutionTime: 0,
        executionCount: 0,
        lastExecuted: new Date(),
        slowestExecution: 0,
        fastestExecution: Infinity,
        errorCount: 0,
        cacheHitRate: 0,
      };
      this.queryMetrics.set(queryId, metrics);
    }

    // Update metrics
    metrics.executionCount++;
    metrics.lastExecuted = new Date();
    
    if (!fromCache) {
      // Update execution time metrics only for non-cached queries
      const totalTime = metrics.averageExecutionTime * (metrics.executionCount - 1) + executionTime;
      metrics.averageExecutionTime = totalTime / metrics.executionCount;
      metrics.slowestExecution = Math.max(metrics.slowestExecution, executionTime);
      metrics.fastestExecution = Math.min(metrics.fastestExecution, executionTime);
    }
    
    if (isError) {
      metrics.errorCount++;
    }

    // Update cache hit rate
    const cacheHits = metrics.executionCount - (metrics.executionCount - (fromCache ? 1 : 0));
    metrics.cacheHitRate = cacheHits / metrics.executionCount;

    // Limit the number of tracked queries
    if (this.queryMetrics.size > this.MAX_METRICS_ENTRIES) {
      this.cleanupOldMetrics();
    }
  }

  private cleanupOldMetrics(): void {
    const entries = Array.from(this.queryMetrics.entries())
      .sort(([, a], [, b]) => b.lastExecuted.getTime() - a.lastExecuted.getTime());
    
    // Keep only the most recent 80% of entries
    const keepCount = Math.floor(this.MAX_METRICS_ENTRIES * 0.8);
    const toKeep = entries.slice(0, keepCount);
    
    this.queryMetrics.clear();
    toKeep.forEach(([key, value]) => {
      this.queryMetrics.set(key, value);
    });
    
    this.logger.debug(`Cleaned up query metrics, kept ${keepCount} entries`);
  }

  private hashQuery(query: string): string {
    // Simple hash function for query caching
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private determineCacheTtl(query: string): number {
    const queryLower = query.toLowerCase();
    
    // Different TTL based on query type
    if (queryLower.includes('select') && queryLower.includes('count')) {
      return 300000; // 5 minutes for count queries
    } else if (queryLower.includes('select') && !queryLower.includes('where')) {
      return 600000; // 10 minutes for full table scans
    } else if (queryLower.includes('select')) {
      return 180000; // 3 minutes for regular selects
    }
    
    return 60000; // 1 minute default
  }

  // Run optimization analysis every hour
  @Cron(CronExpression.EVERY_HOUR)
  async performOptimizationAnalysis(): Promise<void> {
    try {
      this.logger.log('Starting database optimization analysis');
      
      const report = await this.generateOptimizationReport();
      
      // Log critical recommendations
      const criticalRecommendations = report.recommendations.filter(r => r.priority === 'critical');
      if (criticalRecommendations.length > 0) {
        this.logger.warn(`Found ${criticalRecommendations.length} critical database optimization recommendations`);
        criticalRecommendations.forEach(rec => {
          this.logger.warn(`Critical: ${rec.description}`);
        });
      }

      // Cache the report for dashboard access
      await this.cacheManager.set('database:optimization:report', report, {
        ttl: 3600000, // 1 hour
        tags: ['database-optimization'],
      });

    } catch (error) {
      this.logger.error('Database optimization analysis failed', error);
      this.hvacSentryService.reportHVACError(
        error as Error,
        {
          context: HVACErrorContext.CONFIGURATION,
          operation: 'database_optimization_analysis',
        },
        'error'
      );
    }
  }

  async generateOptimizationReport(): Promise<DatabaseOptimizationReport> {
    const slowQueries = this.getSlowQueries();
    const indexRecommendations = this.generateIndexRecommendations(slowQueries);
    const connectionPoolStats = await this.getConnectionPoolStats();
    const cacheEfficiency = await this.getCacheEfficiencyReport();
    const recommendations = this.generateOptimizationRecommendations(
      slowQueries,
      indexRecommendations,
      connectionPoolStats,
      cacheEfficiency
    );

    return {
      slowQueries,
      indexRecommendations,
      connectionPoolStats,
      cacheEfficiency,
      recommendations,
    };
  }

  private getSlowQueries(): QueryPerformanceMetrics[] {
    return Array.from(this.queryMetrics.values())
      .filter(metrics => metrics.averageExecutionTime > this.SLOW_QUERY_THRESHOLD)
      .sort((a, b) => b.averageExecutionTime - a.averageExecutionTime)
      .slice(0, 20); // Top 20 slow queries
  }

  private generateIndexRecommendations(slowQueries: QueryPerformanceMetrics[]): IndexRecommendation[] {
    const recommendations: IndexRecommendation[] = [];

    slowQueries.forEach(queryMetrics => {
      const query = queryMetrics.query.toLowerCase();
      
      // Simple pattern matching for index recommendations
      if (query.includes('where') && query.includes('=')) {
        const whereMatch = query.match(/where\s+(\w+)\s*=/);
        if (whereMatch) {
          const column = whereMatch[1];
          recommendations.push({
            table: this.extractTableName(query),
            columns: [column],
            reason: `Frequent equality filter on ${column}`,
            estimatedImpact: queryMetrics.executionCount > 100 ? 'high' : 'medium',
            query: queryMetrics.query.substring(0, 200),
          });
        }
      }

      if (query.includes('order by')) {
        const orderMatch = query.match(/order\s+by\s+(\w+)/);
        if (orderMatch) {
          const column = orderMatch[1];
          recommendations.push({
            table: this.extractTableName(query),
            columns: [column],
            reason: `Frequent sorting on ${column}`,
            estimatedImpact: 'medium',
            query: queryMetrics.query.substring(0, 200),
          });
        }
      }
    });

    return recommendations;
  }

  private extractTableName(query: string): string {
    const fromMatch = query.match(/from\s+(\w+)/i);
    return fromMatch ? fromMatch[1] : 'unknown';
  }

  private async getConnectionPoolStats(): Promise<ConnectionPoolStats> {
    // In production, this would query actual connection pool metrics
    return {
      activeConnections: 15,
      idleConnections: 5,
      totalConnections: 20,
      maxConnections: 50,
      averageWaitTime: 25,
      connectionErrors: 0,
    };
  }

  private async getCacheEfficiencyReport(): Promise<CacheEfficiencyReport> {
    const cacheStats = this.cacheManager.getStats();
    
    return {
      queryCache: {
        hitRate: cacheStats.hitRate,
        totalQueries: cacheStats.totalEntries,
        averageResponseTime: cacheStats.averageAccessTime,
      },
      entityCache: {
        hitRate: cacheStats.hitRate,
        totalRequests: cacheStats.totalEntries,
        memoryUsage: cacheStats.totalSize,
      },
    };
  }

  private generateOptimizationRecommendations(
    slowQueries: QueryPerformanceMetrics[],
    indexRecommendations: IndexRecommendation[],
    connectionPoolStats: ConnectionPoolStats,
    cacheEfficiency: CacheEfficiencyReport
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Query optimization recommendations
    if (slowQueries.length > 5) {
      recommendations.push({
        type: 'query',
        priority: 'high',
        description: `${slowQueries.length} slow queries detected`,
        expectedImpact: 'Significant performance improvement',
        implementation: 'Review and optimize slow queries, consider query restructuring',
      });
    }

    // Index recommendations
    const highImpactIndexes = indexRecommendations.filter(idx => idx.estimatedImpact === 'high');
    if (highImpactIndexes.length > 0) {
      recommendations.push({
        type: 'index',
        priority: 'high',
        description: `${highImpactIndexes.length} high-impact indexes recommended`,
        expectedImpact: 'Major query performance improvement',
        implementation: 'Create recommended indexes during maintenance window',
      });
    }

    // Cache efficiency recommendations
    if (cacheEfficiency.queryCache.hitRate < 0.7) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        description: `Low cache hit rate: ${(cacheEfficiency.queryCache.hitRate * 100).toFixed(1)}%`,
        expectedImpact: 'Reduced database load and faster response times',
        implementation: 'Increase cache TTL for stable data, implement cache warming',
      });
    }

    // Connection pool recommendations
    const poolUtilization = connectionPoolStats.activeConnections / connectionPoolStats.maxConnections;
    if (poolUtilization > 0.8) {
      recommendations.push({
        type: 'connection',
        priority: 'high',
        description: `High connection pool utilization: ${(poolUtilization * 100).toFixed(1)}%`,
        expectedImpact: 'Prevent connection exhaustion and timeouts',
        implementation: 'Increase connection pool size or optimize connection usage',
      });
    }

    return recommendations;
  }

  // Public API
  getQueryMetrics(): QueryPerformanceMetrics[] {
    return Array.from(this.queryMetrics.values());
  }

  async getOptimizationReport(): Promise<DatabaseOptimizationReport | null> {
    return this.cacheManager.get<DatabaseOptimizationReport>('database:optimization:report');
  }

  clearMetrics(): void {
    this.queryMetrics.clear();
    this.logger.log('Query metrics cleared');
  }

  // Utility method for common database operations with automatic optimization
  async optimizedQuery<T>(
    queryId: string,
    query: string,
    executor: () => Promise<T>,
    options: {
      useCache?: boolean;
      cacheTtl?: number;
      tags?: string[];
    } = {}
  ): Promise<T> {
    const { useCache = true, cacheTtl, tags = [] } = options;
    
    if (useCache) {
      const cacheKey = `optimized:${queryId}:${this.hashQuery(query)}`;
      return this.cacheManager.getOrSet(
        cacheKey,
        () => this.monitorQuery(queryId, query, executor, false),
        {
          ttl: cacheTtl || this.determineCacheTtl(query),
          tags: ['optimized-query', ...tags],
        }
      );
    } else {
      return this.monitorQuery(queryId, query, executor, false);
    }
  }
}
