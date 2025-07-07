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

  // ============================================================================
  // MISSING METHOD IMPLEMENTATIONS - CACHE STRATEGY SERVICE
  // ============================================================================

  /**
   * Cache warming methods
   */
  private async warmCacheForDataType(dataType: string): Promise<void> {
    try {
      this.logger.debug(`Warming cache for data type: ${dataType}`);

      // Define data warming strategies for different types
      const warmingStrategies: Record<string, () => Promise<void>> = {
        'active-service-tickets': async () => {
          // Pre-load active service tickets
          const tickets = await this.fetchActiveServiceTickets();
          for (const ticket of tickets) {
            await this.set(`ticket:${ticket.id}`, ticket, 'TICKET');
          }
        },
        'technician-locations': async () => {
          // Pre-load technician locations
          const locations = await this.fetchTechnicianLocations();
          for (const location of locations) {
            await this.set(`technician:${location.id}:location`, location, 'TECHNICIAN');
          }
        },
        'customer-priority-list': async () => {
          // Pre-load priority customers
          const customers = await this.fetchPriorityCustomers();
          for (const customer of customers) {
            await this.set(`customer:${customer.id}:priority`, customer, 'CUSTOMER');
          }
        },
        'equipment-alerts': async () => {
          // Pre-load equipment alerts
          const alerts = await this.fetchEquipmentAlerts();
          for (const alert of alerts) {
            await this.set(`equipment:${alert.equipmentId}:alert`, alert, 'EQUIPMENT');
          }
        },
        'parts-inventory-critical': async () => {
          // Pre-load critical parts inventory
          const inventory = await this.fetchCriticalPartsInventory();
          await this.set('inventory:critical', inventory, 'INVENTORY');
        }
      };

      const strategy = warmingStrategies[dataType];
      if (strategy) {
        await strategy();
        this.logger.log(`Cache warmed for data type: ${dataType}`);
      } else {
        this.logger.warn(`No warming strategy found for data type: ${dataType}`);
      }
    } catch (error) {
      this.logger.error(`Failed to warm cache for data type: ${dataType}`, error);
    }
  }

  /**
   * Cache statistics methods
   */
  private getMemoryCacheStats(): any {
    try {
      // Calculate memory cache statistics
      const totalEntries = this.memoryCache.size;
      const memoryUsage = this.calculateMemoryUsage();

      return {
        hits: this.memoryCacheHits || 0,
        misses: this.memoryCacheMisses || 0,
        total: totalEntries,
        avgResponseTime: 0.1, // Memory cache is very fast
        memoryUsage: memoryUsage,
        evictions: this.memoryCacheEvictions || 0
      };
    } catch (error) {
      this.logger.error('Failed to get memory cache stats', error);
      return {
        hits: 0,
        misses: 0,
        total: 0,
        avgResponseTime: 0,
        memoryUsage: 0,
        evictions: 0
      };
    }
  }

  private async getRedisCacheStats(): Promise<any> {
    try {
      // Get Redis cache statistics
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');

      // Parse Redis info for relevant metrics
      const memoryUsage = this.parseRedisMemoryUsage(info);
      const totalKeys = this.parseRedisKeyCount(keyspace);

      return {
        hits: this.redisCacheHits || 0,
        misses: this.redisCacheMisses || 0,
        total: totalKeys,
        avgResponseTime: 2.5, // Typical Redis response time in ms
        memoryUsage: memoryUsage,
        evictions: this.redisCacheEvictions || 0
      };
    } catch (error) {
      this.logger.error('Failed to get Redis cache stats', error);
      return {
        hits: 0,
        misses: 0,
        total: 0,
        avgResponseTime: 0,
        memoryUsage: 0,
        evictions: 0
      };
    }
  }

  private getAccessCount(key: string): number {
    try {
      // Get access count for a specific key
      const entry = this.memoryCache.get(key) as CacheEntry;
      return entry?.accessCount || 0;
    } catch (error) {
      this.logger.error(`Failed to get access count for key: ${key}`, error);
      return 0;
    }
  }

  /**
   * Cache tier management methods
   */
  private getFromMemory<T>(key: string): T | null {
    try {
      const entry = this.memoryCache.get(key) as CacheEntry;
      if (!entry) {
        return null;
      }

      // Check if entry has expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        return null;
      }

      // Increment access count
      entry.accessCount++;
      this.memoryCache.set(key, entry);

      return entry.data as T;
    } catch (error) {
      this.logger.error(`Failed to get from memory cache: ${key}`, error);
      return null;
    }
  }

  private async getFromRedis<T>(key: string, config: CacheConfig): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) {
        return null;
      }

      // Decompress if needed
      const decompressedData = config.compressionEnabled
        ? this.decompress(data)
        : data;

      return JSON.parse(decompressedData) as T;
    } catch (error) {
      this.logger.error(`Failed to get from Redis cache: ${key}`, error);
      return null;
    }
  }

  private setInMemory<T>(key: string, value: T, config: CacheConfig): void {
    try {
      const entry: CacheEntry = {
        data: value,
        timestamp: Date.now(),
        accessCount: 1,
        ttl: config.ttl
      };

      this.memoryCache.set(key, entry);

      // Implement LRU eviction if memory cache is full
      if (this.memoryCache.size > this.maxMemoryCacheSize) {
        this.evictLeastRecentlyUsed();
      }
    } catch (error) {
      this.logger.error(`Failed to set in memory cache: ${key}`, error);
    }
  }

  private async setInRedis<T>(key: string, value: T, config: CacheConfig): Promise<void> {
    try {
      const serializedData = JSON.stringify(value);

      // Compress if enabled
      const dataToStore = config.compressionEnabled
        ? this.compress(serializedData)
        : serializedData;

      await this.redis.setex(key, Math.floor(config.ttl / 1000), dataToStore);
    } catch (error) {
      this.logger.error(`Failed to set in Redis cache: ${key}`, error);
    }
  }

  private setupInvalidation(key: string, dataType: string, config: CacheConfig): void {
    try {
      if (config.invalidationStrategy === 'time') {
        // Time-based invalidation is handled by TTL
        return;
      }

      if (config.invalidationStrategy === 'event') {
        // Event-based invalidation is handled by invalidateByEvent method
        this.registerKeyForEventInvalidation(key, dataType);
      }

      // Manual invalidation requires no setup
    } catch (error) {
      this.logger.error(`Failed to setup invalidation for key: ${key}`, error);
    }
  }

  private async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Invalidate keys matching the pattern
      if (pattern.includes('*')) {
        // Handle wildcard patterns
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // Direct key deletion
        await this.redis.del(pattern);
      }

      // Also remove from memory cache
      this.invalidateMemoryPattern(pattern);
    } catch (error) {
      this.logger.error(`Failed to invalidate pattern: ${pattern}`, error);
    }
  }

  // ============================================================================
  // HELPER METHODS AND UTILITIES
  // ============================================================================

  private calculateMemoryUsage(): number {
    try {
      // Estimate memory usage of the memory cache
      let totalSize = 0;
      for (const [key, entry] of this.memoryCache.entries()) {
        totalSize += this.estimateObjectSize(key) + this.estimateObjectSize(entry);
      }
      return totalSize;
    } catch (error) {
      this.logger.error('Failed to calculate memory usage', error);
      return 0;
    }
  }

  private parseRedisMemoryUsage(info: string): number {
    try {
      const match = info.match(/used_memory:(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    } catch (error) {
      this.logger.error('Failed to parse Redis memory usage', error);
      return 0;
    }
  }

  private parseRedisKeyCount(keyspace: string): number {
    try {
      const match = keyspace.match(/keys=(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    } catch (error) {
      this.logger.error('Failed to parse Redis key count', error);
      return 0;
    }
  }

  private evictLeastRecentlyUsed(): void {
    try {
      let oldestKey = '';
      let oldestTimestamp = Date.now();

      for (const [key, entry] of this.memoryCache.entries()) {
        const cacheEntry = entry as CacheEntry;
        if (cacheEntry.timestamp < oldestTimestamp) {
          oldestTimestamp = cacheEntry.timestamp;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
        this.memoryCacheEvictions = (this.memoryCacheEvictions || 0) + 1;
      }
    } catch (error) {
      this.logger.error('Failed to evict least recently used entry', error);
    }
  }

  private compress(data: string): string {
    try {
      // Mock compression - would use actual compression library in production
      return data; // Placeholder
    } catch (error) {
      this.logger.error('Failed to compress data', error);
      return data;
    }
  }

  private decompress(data: string): string {
    try {
      // Mock decompression - would use actual compression library in production
      return data; // Placeholder
    } catch (error) {
      this.logger.error('Failed to decompress data', error);
      return data;
    }
  }

  private registerKeyForEventInvalidation(key: string, dataType: string): void {
    try {
      // Register key for event-based invalidation
      // In production, this would maintain a registry of keys by data type
      this.logger.debug(`Registered key for event invalidation: ${key} (${dataType})`);
    } catch (error) {
      this.logger.error(`Failed to register key for event invalidation: ${key}`, error);
    }
  }

  private invalidateMemoryPattern(pattern: string): void {
    try {
      // Invalidate memory cache entries matching pattern
      const keysToDelete: string[] = [];

      for (const key of this.memoryCache.keys()) {
        if (this.matchesPattern(key, pattern)) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate memory pattern: ${pattern}`, error);
    }
  }

  private matchesPattern(key: string, pattern: string): boolean {
    try {
      // Simple pattern matching for wildcards
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(key);
      }
      return key === pattern;
    } catch (error) {
      this.logger.error(`Failed to match pattern: ${pattern}`, error);
      return false;
    }
  }

  private estimateObjectSize(obj: any): number {
    try {
      // Rough estimation of object size in bytes
      return JSON.stringify(obj).length * 2; // Approximate UTF-16 encoding
    } catch (error) {
      this.logger.error('Failed to estimate object size', error);
      return 0;
    }
  }

  private recordCacheHit(tier: 'memory' | 'redis', dataType: string): void {
    try {
      if (tier === 'memory') {
        this.memoryCacheHits = (this.memoryCacheHits || 0) + 1;
      } else {
        this.redisCacheHits = (this.redisCacheHits || 0) + 1;
      }
    } catch (error) {
      this.logger.error(`Failed to record cache hit for ${tier}`, error);
    }
  }

  private recordCacheMiss(dataType: string): void {
    try {
      this.memoryCacheMisses = (this.memoryCacheMisses || 0) + 1;
      this.redisCacheMisses = (this.redisCacheMisses || 0) + 1;
    } catch (error) {
      this.logger.error('Failed to record cache miss', error);
    }
  }

  // ============================================================================
  // DATA FETCHING METHODS (Mock implementations)
  // ============================================================================

  private async fetchActiveServiceTickets(): Promise<any[]> {
    try {
      // Mock implementation - would fetch from database in production
      return [
        { id: '1', status: 'active', priority: 'high', customerId: 'c1' },
        { id: '2', status: 'active', priority: 'medium', customerId: 'c2' }
      ];
    } catch (error) {
      this.logger.error('Failed to fetch active service tickets', error);
      return [];
    }
  }

  private async fetchTechnicianLocations(): Promise<any[]> {
    try {
      // Mock implementation
      return [
        { id: 't1', lat: 52.2297, lng: 21.0122, lastUpdate: new Date() },
        { id: 't2', lat: 52.4064, lng: 16.9252, lastUpdate: new Date() }
      ];
    } catch (error) {
      this.logger.error('Failed to fetch technician locations', error);
      return [];
    }
  }

  private async fetchPriorityCustomers(): Promise<any[]> {
    try {
      // Mock implementation
      return [
        { id: 'c1', name: 'VIP Customer 1', priority: 'high' },
        { id: 'c2', name: 'VIP Customer 2', priority: 'high' }
      ];
    } catch (error) {
      this.logger.error('Failed to fetch priority customers', error);
      return [];
    }
  }

  private async fetchEquipmentAlerts(): Promise<any[]> {
    try {
      // Mock implementation
      return [
        { equipmentId: 'e1', alertType: 'maintenance_due', severity: 'medium' },
        { equipmentId: 'e2', alertType: 'temperature_high', severity: 'high' }
      ];
    } catch (error) {
      this.logger.error('Failed to fetch equipment alerts', error);
      return [];
    }
  }

  private async fetchCriticalPartsInventory(): Promise<any> {
    try {
      // Mock implementation
      return {
        filters: { critical: 5, low: 12 },
        thermostats: { critical: 3, low: 8 },
        refrigerant: { critical: 2, low: 5 }
      };
    } catch (error) {
      this.logger.error('Failed to fetch critical parts inventory', error);
      return {};
    }
  }

  private async prefetchTodaysSchedules(): Promise<void> {
    try {
      const schedules = await this.fetchTodaysSchedules();
      for (const schedule of schedules) {
        await this.set(`schedule:${schedule.id}`, schedule, 'SCHEDULE');
      }
    } catch (error) {
      this.logger.error('Failed to prefetch today\'s schedules', error);
    }
  }

  private async prefetchActiveCustomers(): Promise<void> {
    try {
      const customers = await this.fetchActiveCustomers();
      for (const customer of customers) {
        await this.set(`customer:${customer.id}`, customer, 'CUSTOMER');
      }
    } catch (error) {
      this.logger.error('Failed to prefetch active customers', error);
    }
  }

  private async prefetchEquipmentData(equipmentIds: string[]): Promise<void> {
    try {
      for (const equipmentId of equipmentIds) {
        const equipment = await this.fetchEquipmentById(equipmentId);
        if (equipment) {
          await this.set(`equipment:${equipmentId}`, equipment, 'EQUIPMENT');
        }
      }
    } catch (error) {
      this.logger.error('Failed to prefetch equipment data', error);
    }
  }

  private async prefetchPartsInventory(requiredParts: string[]): Promise<void> {
    try {
      for (const partId of requiredParts) {
        const inventory = await this.fetchPartInventory(partId);
        if (inventory) {
          await this.set(`inventory:${partId}`, inventory, 'INVENTORY');
        }
      }
    } catch (error) {
      this.logger.error('Failed to prefetch parts inventory', error);
    }
  }

  private async prefetchEmergencyData(location: { lat: number; lng: number }): Promise<void> {
    try {
      const emergencyData = await this.fetchEmergencyData(location);
      await this.set(`emergency:${location.lat}:${location.lng}`, emergencyData, 'EMERGENCY');
    } catch (error) {
      this.logger.error('Failed to prefetch emergency data', error);
    }
  }

  // Additional mock data fetching methods
  private async fetchTodaysSchedules(): Promise<any[]> {
    return [{ id: 's1', date: new Date(), technicianId: 't1' }];
  }

  private async fetchActiveCustomers(): Promise<any[]> {
    return [{ id: 'c1', name: 'Active Customer 1', status: 'active' }];
  }

  private async fetchEquipmentById(equipmentId: string): Promise<any> {
    return { id: equipmentId, type: 'HVAC', status: 'operational' };
  }

  private async fetchPartInventory(partId: string): Promise<any> {
    return { partId, quantity: 10, location: 'warehouse-1' };
  }

  private async fetchEmergencyData(location: { lat: number; lng: number }): Promise<any> {
    return { nearestTechnicians: ['t1', 't2'], emergencyContacts: ['contact1'] };
  }

  // Class properties for tracking cache statistics
  private memoryCacheHits = 0;
  private memoryCacheMisses = 0;
  private memoryCacheEvictions = 0;
  private redisCacheHits = 0;
  private redisCacheMisses = 0;
  private redisCacheEvictions = 0;
  private readonly maxMemoryCacheSize = 1000; // Maximum number of entries in memory cache
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
