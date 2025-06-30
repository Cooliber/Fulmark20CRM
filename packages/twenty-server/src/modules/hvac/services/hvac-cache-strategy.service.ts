/**
 * Advanced HVAC Caching Strategy Service
 * "Pasja rodzi profesjonalizm" - Professional caching for optimal performance
 * 
 * Implements multi-tier caching with intelligent invalidation
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface CacheConfig {
  ttl: number;
  tier: 'memory' | 'redis' | 'database';
  invalidationStrategy: 'time' | 'event' | 'manual';
  compressionEnabled: boolean;
}

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  evictionCount: number;
}

@Injectable()
export class HvacCacheStrategyService {
  private readonly logger = new Logger(HvacCacheStrategyService.name);
  private readonly redis: Redis;
  private readonly memoryCache = new Map<string, CacheEntry>();
  
  // Cache configurations for different data types
  private readonly cacheConfigs: Map<string, CacheConfig> = new Map([
    ['customer-data', {
      ttl: 30 * 60 * 1000, // 30 minutes
      tier: 'redis',
      invalidationStrategy: 'event',
      compressionEnabled: true,
    }],
    ['equipment-status', {
      ttl: 5 * 60 * 1000, // 5 minutes
      tier: 'memory',
      invalidationStrategy: 'time',
      compressionEnabled: false,
    }],
    ['service-tickets', {
      ttl: 15 * 60 * 1000, // 15 minutes
      tier: 'redis',
      invalidationStrategy: 'event',
      compressionEnabled: true,
    }],
    ['technician-schedules', {
      ttl: 10 * 60 * 1000, // 10 minutes
      tier: 'redis',
      invalidationStrategy: 'event',
      compressionEnabled: false,
    }],
    ['customer-insights', {
      ttl: 60 * 60 * 1000, // 1 hour
      tier: 'redis',
      invalidationStrategy: 'manual',
      compressionEnabled: true,
    }],
    ['equipment-maintenance-history', {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      tier: 'database',
      invalidationStrategy: 'event',
      compressionEnabled: true,
    }],
  ]);

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }

  /**
   * Intelligent cache retrieval with fallback strategy
   */
  async get<T>(key: string, dataType: string): Promise<T | null> {
    const config = this.cacheConfigs.get(dataType);
    if (!config) {
      this.logger.warn(`No cache config found for data type: ${dataType}`);
      return null;
    }

    try {
      // Try memory cache first (fastest)
      if (config.tier === 'memory' || this.shouldCheckMemoryFirst(dataType)) {
        const memoryResult = this.getFromMemory<T>(key);
        if (memoryResult) {
          this.recordCacheHit('memory', dataType);
          return memoryResult;
        }
      }

      // Try Redis cache
      if (config.tier === 'redis' || config.tier === 'database') {
        const redisResult = await this.getFromRedis<T>(key, config);
        if (redisResult) {
          // Promote to memory cache if frequently accessed
          if (this.shouldPromoteToMemory(key, dataType)) {
            this.setInMemory(key, redisResult, config);
          }
          this.recordCacheHit('redis', dataType);
          return redisResult;
        }
      }

      this.recordCacheMiss(dataType);
      return null;
    } catch (error) {
      this.logger.error(`Cache retrieval failed for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Intelligent cache storage with automatic tier selection
   */
  async set<T>(key: string, value: T, dataType: string): Promise<void> {
    const config = this.cacheConfigs.get(dataType);
    if (!config) {
      this.logger.warn(`No cache config found for data type: ${dataType}`);
      return;
    }

    try {
      // Store in appropriate tier based on configuration
      switch (config.tier) {
        case 'memory':
          this.setInMemory(key, value, config);
          break;
        case 'redis':
          await this.setInRedis(key, value, config);
          break;
        case 'database':
          await this.setInRedis(key, value, config); // Redis as L2 cache
          break;
      }

      // Set up invalidation strategy
      this.setupInvalidation(key, dataType, config);
    } catch (error) {
      this.logger.error(`Cache storage failed for key: ${key}`, error);
    }
  }

  /**
   * Event-driven cache invalidation for Polish HVAC business patterns
   */
  async invalidateByEvent(event: HvacCacheEvent): Promise<void> {
    const patterns = this.getInvalidationPatterns(event);
    
    for (const pattern of patterns) {
      await this.invalidatePattern(pattern);
    }

    this.logger.debug(`Cache invalidated for event: ${event.type}`, {
      patterns,
      affectedKeys: event.affectedKeys,
    });
  }

  /**
   * Smart prefetching for common Polish HVAC workflows
   */
  async prefetchForWorkflow(workflowType: HvacWorkflowType, context: WorkflowContext): Promise<void> {
    const prefetchStrategies = {
      'morning-dispatch': async () => {
        // Prefetch today's service tickets and technician schedules
        await this.prefetchTodaysSchedules();
        await this.prefetchActiveCustomers();
      },
      'equipment-maintenance': async () => {
        // Prefetch equipment history and parts inventory
        await this.prefetchEquipmentData(context.equipmentIds);
        await this.prefetchPartsInventory(context.requiredParts);
      },
      'emergency-response': async () => {
        // Prefetch emergency contacts and nearest technicians
        await this.prefetchEmergencyData(context.location);
      },
    };

    const strategy = prefetchStrategies[workflowType];
    if (strategy) {
      await strategy();
      this.logger.debug(`Prefetching completed for workflow: ${workflowType}`);
    }
  }

  /**
   * Cache warming for peak business hours
   */
  async warmCacheForPeakHours(): Promise<void> {
    const peakHourData = [
      'active-service-tickets',
      'technician-locations',
      'customer-priority-list',
      'equipment-alerts',
      'parts-inventory-critical',
    ];

    for (const dataType of peakHourData) {
      await this.warmCacheForDataType(dataType);
    }

    this.logger.log('Cache warming completed for peak hours');
  }

  /**
   * Performance monitoring and optimization
   */
  async getCacheMetrics(): Promise<CacheMetrics> {
    const memoryStats = this.getMemoryCacheStats();
    const redisStats = await this.getRedisCacheStats();

    return {
      hitRate: (memoryStats.hits + redisStats.hits) / (memoryStats.total + redisStats.total),
      missRate: (memoryStats.misses + redisStats.misses) / (memoryStats.total + redisStats.total),
      averageResponseTime: (memoryStats.avgResponseTime + redisStats.avgResponseTime) / 2,
      memoryUsage: memoryStats.memoryUsage + redisStats.memoryUsage,
      evictionCount: memoryStats.evictions + redisStats.evictions,
    };
  }

  private shouldCheckMemoryFirst(dataType: string): boolean {
    // Check memory first for frequently accessed data
    const frequentlyAccessed = ['equipment-status', 'technician-locations'];
    return frequentlyAccessed.includes(dataType);
  }

  private shouldPromoteToMemory(key: string, dataType: string): boolean {
    // Promote to memory if accessed more than 5 times in last hour
    const accessCount = this.getAccessCount(key);
    return accessCount > 5;
  }

  private getInvalidationPatterns(event: HvacCacheEvent): string[] {
    const patterns: Record<string, string[]> = {
      'customer-updated': [`customer:${event.entityId}:*`, `insights:${event.entityId}:*`],
      'ticket-status-changed': [`ticket:${event.entityId}:*`, `schedule:*`],
      'equipment-maintenance': [`equipment:${event.entityId}:*`, `maintenance:*`],
      'technician-location-updated': [`technician:${event.entityId}:*`, `routes:*`],
    };

    return patterns[event.type] || [];
  }

  // Additional helper methods would be implemented here...
}

// Supporting interfaces
interface CacheEntry {
  data: unknown;
  timestamp: number;
  accessCount: number;
  ttl: number;
}

interface HvacCacheEvent {
  type: string;
  entityId: string;
  affectedKeys?: string[];
  timestamp: Date;
}

type HvacWorkflowType = 'morning-dispatch' | 'equipment-maintenance' | 'emergency-response';

interface WorkflowContext {
  equipmentIds?: string[];
  requiredParts?: string[];
  location?: { lat: number; lng: number };
  technicianId?: string;
}
