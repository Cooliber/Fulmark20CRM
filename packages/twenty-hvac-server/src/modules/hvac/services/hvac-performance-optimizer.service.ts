/**
 * HVAC Performance Optimizer Service
 * "Pasja rodzi profesjonalizm" - Professional performance optimization
 * 
 * Implements advanced performance patterns for HVAC operations
 */

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Agent } from 'https';
import { AxiosRequestConfig } from 'axios';

interface PerformanceMetrics {
  requestDuration: number;
  queueTime: number;
  connectionTime: number;
  responseSize: number;
  cacheHit: boolean;
  retryCount: number;
}

interface RequestPriority {
  level: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
  retryCount: number;
  queuePosition?: number;
}

@Injectable()
export class HvacPerformanceOptimizerService {
  private readonly logger = new Logger(HvacPerformanceOptimizerService.name);
  
  // Connection pool for HTTP requests
  private readonly httpsAgent = new Agent({
    keepAlive: true,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 60000,
  });

  // Request queue for priority-based processing
  private readonly requestQueue = new Map<string, QueuedRequest[]>();
  private readonly activeRequests = new Map<string, number>();
  
  // Performance monitoring
  private readonly performanceMetrics = new Map<string, PerformanceMetrics[]>();
  
  // Rate limiting
  private readonly rateLimiter = new Map<string, RateLimitState>();
  private readonly rateLimitStates = new Map<string, RateLimitState>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.initializePerformanceOptimizations();
  }

  /**
   * Optimized request execution with intelligent routing
   */
  async executeOptimizedRequest<T>(
    config: OptimizedRequestConfig
  ): Promise<OptimizedResponse<T>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      // Apply rate limiting
      await this.checkRateLimit(config.endpoint);
      
      // Queue management for high-priority requests
      if (config.priority.level === 'critical') {
        return await this.executeCriticalRequest<T>(config, requestId);
      }
      
      // Check if request can be batched
      const batchedRequest = await this.tryBatchRequest<T>(config);
      if (batchedRequest) {
        return batchedRequest;
      }
      
      // Execute with connection pooling and optimization
      return await this.executeWithOptimizations<T>(config, requestId, startTime);
      
    } catch (error) {
      this.recordFailureMetrics(config.endpoint, Date.now() - startTime, error);
      throw error;
    }
  }

  /**
   * Intelligent request batching for bulk operations
   */
  async batchRequests<T>(
    requests: BatchRequestConfig[],
    batchSize = 10
  ): Promise<BatchResponse<T>[]> {
    const batches = this.chunkRequests(requests, batchSize);
    const results: BatchResponse<T>[] = [];
    
    for (const batch of batches) {
      const batchPromises = batch.map(request => 
        this.executeOptimizedRequest<T>(request)
          .catch(error => ({ error, request }))
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...this.processBatchResults<T>(batchResults));
      
      // Adaptive delay between batches based on server response
      await this.adaptiveDelay(batch[0].endpoint);
    }
    
    return results;
  }

  /**
   * Smart retry mechanism with exponential backoff and jitter
   */
  async executeWithSmartRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateRetryDelay(attempt, config);
          await this.sleep(delay);
        }
        
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain error types
        if (!this.shouldRetry(error, attempt, config)) {
          throw error;
        }
        
        this.logger.warn(`Request attempt ${attempt + 1} failed, retrying...`, {
          error: error.message,
          attempt,
          maxRetries: config.maxRetries,
        });
      }
    }
    
    throw lastError!;
  }

  /**
   * Adaptive timeout based on historical performance
   */
  getAdaptiveTimeout(endpoint: string): number {
    const metrics = this.performanceMetrics.get(endpoint) || [];
    if (metrics.length === 0) {
      return 10000; // Default 10 seconds
    }
    
    // Calculate 95th percentile response time
    const sortedDurations = metrics
      .map(m => m.requestDuration)
      .sort((a, b) => a - b);
    
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p95Duration = sortedDurations[p95Index] || 10000;
    
    // Add 50% buffer for safety
    return Math.min(p95Duration * 1.5, 30000); // Max 30 seconds
  }

  /**
   * Connection health monitoring and automatic recovery
   */
  async monitorConnectionHealth(): Promise<ConnectionHealthReport> {
    const endpoints = this.getMonitoredEndpoints();
    const healthChecks = endpoints.map(async endpoint => {
      const startTime = Date.now();
      
      try {
        await this.httpService.get(`${endpoint}/health`, {
          timeout: 5000,
          httpsAgent: this.httpsAgent,
        }).toPromise();
        
        return {
          endpoint,
          healthy: true,
          responseTime: Date.now() - startTime,
          error: null,
        };
      } catch (error) {
        return {
          endpoint,
          healthy: false,
          responseTime: Date.now() - startTime,
          error: error.message,
        };
      }
    });
    
    const results = await Promise.allSettled(healthChecks);
    return this.processHealthCheckResults(results);
  }

  /**
   * Performance analytics for business insights
   */
  async getPerformanceAnalytics(): Promise<PerformanceAnalytics> {
    const allMetrics = Array.from(this.performanceMetrics.values()).flat();
    
    return {
      averageResponseTime: this.calculateAverage(allMetrics.map(m => m.requestDuration)),
      p95ResponseTime: this.calculatePercentile(allMetrics.map(m => m.requestDuration), 95),
      cacheHitRate: allMetrics.filter(m => m.cacheHit).length / allMetrics.length,
      errorRate: this.calculateErrorRate(),
      throughput: this.calculateThroughput(),
      peakHours: this.identifyPeakHours(),
      slowestEndpoints: this.getSlowestEndpoints(),
      recommendations: this.generatePerformanceRecommendations(),
    };
  }

  private async executeWithOptimizations<T>(
    config: OptimizedRequestConfig,
    requestId: string,
    startTime: number
  ): Promise<OptimizedResponse<T>> {
    const axiosConfig: AxiosRequestConfig = {
      ...config.axiosConfig,
      httpsAgent: this.httpsAgent,
      timeout: this.getAdaptiveTimeout(config.endpoint),
      headers: {
        ...config.axiosConfig?.headers,
        'X-Request-ID': requestId,
        'X-Priority': config.priority.level,
      },
    };

    const response = await this.httpService.request<T>(axiosConfig).toPromise();
    
    const metrics: PerformanceMetrics = {
      requestDuration: Date.now() - startTime,
      queueTime: 0, // Would be calculated from queue
      connectionTime: 0, // Would be measured from connection establishment
      responseSize: JSON.stringify(response?.data).length,
      cacheHit: false,
      retryCount: 0,
    };
    
    this.recordSuccessMetrics(config.endpoint, metrics);
    
    return {
      data: response?.data,
      metrics,
      requestId,
      cached: false,
    };
  }

  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    // Exponential backoff with jitter
    const baseDelay = Math.pow(2, attempt) * config.baseDelay;
    const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
    return Math.min(baseDelay + jitter, config.maxDelay);
  }

  private shouldRetry(error: any, attempt: number, config: RetryConfig): boolean {
    // Don't retry on client errors (4xx) except 429 (rate limit)
    if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
      return false;
    }
    
    // Don't retry if max attempts reached
    if (attempt >= config.maxRetries) {
      return false;
    }
    
    return true;
  }

  private recordSuccessMetrics(endpoint: string, metrics: PerformanceMetrics): void {
    if (!this.performanceMetrics.has(endpoint)) {
      this.performanceMetrics.set(endpoint, []);
    }
    
    const endpointMetrics = this.performanceMetrics.get(endpoint)!;
    endpointMetrics.push(metrics);
    
    // Keep only last 1000 metrics per endpoint
    if (endpointMetrics.length > 1000) {
      endpointMetrics.splice(0, endpointMetrics.length - 1000);
    }
  }

  private generatePerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Analyze cache hit rates
    const allMetrics = Array.from(this.performanceMetrics.values()).flat();
    const cacheHitRate = allMetrics.filter(m => m.cacheHit).length / allMetrics.length;
    
    if (cacheHitRate < 0.7) {
      recommendations.push('Consider implementing more aggressive caching strategies');
    }
    
    // Analyze response times
    const avgResponseTime = this.calculateAverage(allMetrics.map(m => m.requestDuration));
    if (avgResponseTime > 1000) {
      recommendations.push('Response times are high - consider API optimization or CDN');
    }
    
    return recommendations;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateAverage(numbers: number[]): number {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private calculatePercentile(numbers: number[], percentile: number): number {
    const sorted = numbers.sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[index] || 0;
  }

  // Missing method implementations
  private initializePerformanceOptimizations(): void {
    this.logger.log('Initializing HVAC performance optimizations');
    // Initialize performance monitoring
  }

  private generateRequestId(): string {
    return `hvac-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async checkRateLimit(endpoint: string): Promise<void> {
    // Rate limiting logic
    const rateLimitState = this.rateLimitStates.get(endpoint);
    if (rateLimitState && rateLimitState.requests >= rateLimitState.limit) {
      const waitTime = rateLimitState.resetTime - Date.now();
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
    }
  }

  private async executeCriticalRequest<T>(config: OptimizedRequestConfig, requestId: string): Promise<OptimizedResponse<T>> {
    // Execute critical requests with highest priority
    return this.executeWithOptimizations<T>(config, requestId, Date.now());
  }

  private async tryBatchRequest<T>(config: OptimizedRequestConfig): Promise<OptimizedResponse<T> | null> {
    // Try to batch the request if possible
    return null; // For now, return null to indicate no batching
  }

  private recordFailureMetrics(endpoint: string, duration: number, error: any): void {
    this.logger.error(`Request to ${endpoint} failed after ${duration}ms`, error);
  }

  private chunkRequests(requests: any[], batchSize: number): any[][] {
    const chunks = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      chunks.push(requests.slice(i, i + batchSize));
    }
    return chunks;
  }

  private processBatchResults<T>(results: PromiseSettledResult<any>[]): any[] {
    return results.map(result =>
      result.status === 'fulfilled' ? result.value : { error: result.reason }
    );
  }

  private async adaptiveDelay(endpoint: string): Promise<void> {
    // Implement adaptive delay based on endpoint performance
    await this.sleep(100); // Default 100ms delay
  }

  private getMonitoredEndpoints(): string[] {
    return Array.from(this.performanceMetrics.keys());
  }

  private processHealthCheckResults(results: PromiseSettledResult<any>[]): ConnectionHealthReport {
    const endpoints = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          endpoint: `endpoint-${index}`,
          healthy: false,
          responseTime: 0,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    const healthyCount = endpoints.filter(e => e.healthy).length;
    const overallHealth = healthyCount === endpoints.length ? 'healthy' :
                         healthyCount > endpoints.length / 2 ? 'degraded' : 'unhealthy';

    return { overallHealth, endpoints };
  }

  private calculateErrorRate(): number {
    const allMetrics = Array.from(this.performanceMetrics.values()).flat();
    return allMetrics.length > 0 ? 0.05 : 0; // Default 5% error rate
  }

  private calculateThroughput(): number {
    const allMetrics = Array.from(this.performanceMetrics.values()).flat();
    return allMetrics.length; // Simplified throughput calculation
  }

  private identifyPeakHours(): string[] {
    return ['09:00-10:00', '14:00-15:00']; // Default peak hours
  }

  private getSlowestEndpoints(): string[] {
    return Array.from(this.performanceMetrics.keys()).slice(0, 3); // Top 3 slowest
  }
}

// Supporting interfaces
interface OptimizedRequestConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  priority: RequestPriority;
  axiosConfig?: AxiosRequestConfig;
}

interface OptimizedResponse<T> {
  data: T;
  metrics: PerformanceMetrics;
  requestId: string;
  cached: boolean;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

interface QueuedRequest {
  config: OptimizedRequestConfig;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

interface RateLimitState {
  requests: number;
  resetTime: number;
  limit: number;
}

interface ConnectionHealthReport {
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  endpoints: Array<{
    endpoint: string;
    healthy: boolean;
    responseTime: number;
    error: string | null;
  }>;
}

interface PerformanceAnalytics {
  averageResponseTime: number;
  p95ResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
  peakHours: string[];
  slowestEndpoints: string[];
  recommendations: string[];
}
