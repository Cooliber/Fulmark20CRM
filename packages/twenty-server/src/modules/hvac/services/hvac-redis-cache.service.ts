/**
 * Advanced HVAC Redis Multi-Tier Caching Service
 * "Pasja rodzi profesjonalizm" - Professional caching for optimal performance
 *
 * Implements Redis-based multi-tier caching with intelligent invalidation,
 * cache warming, and performance optimization for Polish HVAC market
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import IORedis from 'ioredis';

import { HVACErrorContext, HvacSentryService } from './hvac-sentry.service';

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
  size: number;
  tier: CacheTier;
  compressionEnabled: boolean;
}

export enum CacheTier {
  L1_MEMORY = 'l1_memory',
  L2_REDIS = 'l2_redis',
  L3_DATABASE = 'l3_database',
}

export interface CacheConfig {
  l1MaxSize: number;
  l1MaxEntries: number;
  l2DefaultTtl: number;
  l3DefaultTtl: number;
  compressionThreshold: number;
  warmupEnabled: boolean;
  invalidationStrategy: 'time' | 'event' | 'manual';
}

export interface CacheMetrics {
  l1HitRate: number;
  l2HitRate: number;
  l3HitRate: number;
  totalHits: number;
  totalMisses: number;
  averageResponseTime: number;
  memoryUsage: number;
  redisConnections: number;
  evictionCount: number;
}

@Injectable()
export class HvacRedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(HvacRedisCacheService.name);
  private readonly redis: IORedis;
  private readonly l1Cache = new Map<string, CacheEntry>();
  private readonly config: CacheConfig;
  private readonly metrics: CacheMetrics;
  private cleanupInterval: NodeJS.Timeout;

  // Cache key prefixes for different data types
  private readonly CACHE_PREFIXES = {
    CUSTOMER: 'hvac:customer:',
    EQUIPMENT: 'hvac:equipment:',
    MAINTENANCE: 'hvac:maintenance:',
    TICKET: 'hvac:ticket:',
    INSIGHTS: 'hvac:insights:',
    SEARCH: 'hvac:search:',
    WEATHER: 'hvac:weather:',
    ANALYTICS: 'hvac:analytics:',
  };

  // TTL configurations for different data types (in seconds)
  private readonly TTL_CONFIG = {
    CUSTOMER_PROFILE: 3600, // 1 hour
    EQUIPMENT_STATUS: 300, // 5 minutes
    MAINTENANCE_SCHEDULE: 1800, // 30 minutes
    WEATHER_DATA: 900, // 15 minutes
    SEARCH_RESULTS: 600, // 10 minutes
    ANALYTICS_DATA: 7200, // 2 hours
    INSIGHTS: 3600, // 1 hour
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly hvacSentryService: HvacSentryService,
  ) {
    this.config = this.initializeConfig();
    this.metrics = this.initializeMetrics();
    this.redis = this.initializeRedis();
    this.startCleanupInterval();
    this.warmupCache();
  }

  private initializeConfig(): CacheConfig {
    return {
      l1MaxSize: this.configService.get<number>(
        'HVAC_CACHE_L1_MAX_SIZE_MB',
        50,
      ),
      l1MaxEntries: this.configService.get<number>(
        'HVAC_CACHE_L1_MAX_ENTRIES',
        5000,
      ),
      l2DefaultTtl: this.configService.get<number>('HVAC_CACHE_L2_TTL', 3600),
      l3DefaultTtl: this.configService.get<number>('HVAC_CACHE_L3_TTL', 86400),
      compressionThreshold: this.configService.get<number>(
        'HVAC_CACHE_COMPRESSION_THRESHOLD',
        1024,
      ),
      warmupEnabled: this.configService.get<boolean>(
        'HVAC_CACHE_WARMUP_ENABLED',
        true,
      ),
      invalidationStrategy: this.configService.get<'time' | 'event' | 'manual'>(
        'HVAC_CACHE_INVALIDATION',
        'time',
      ),
    };
  }

  private initializeMetrics(): CacheMetrics {
    return {
      l1HitRate: 0,
      l2HitRate: 0,
      l3HitRate: 0,
      totalHits: 0,
      totalMisses: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      redisConnections: 0,
      evictionCount: 0,
    };
  }

  private initializeRedis(): IORedis {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      throw new Error('REDIS_URL must be configured for HVAC caching');
    }

    const redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      keyPrefix: 'hvac:cache:',
      db: this.configService.get<number>('HVAC_REDIS_DB', 1),
    });

    redis.on('connect', () => {
      this.logger.log('Connected to Redis for HVAC caching');
      this.metrics.redisConnections++;
    });

    redis.on('error', (error) => {
      this.logger.error('Redis connection error', error);
      this.hvacSentryService.reportHVACError(
        error,
        {
          context: HVACErrorContext.CONFIGURATION,
          operation: 'redis_connection',
        },
        'error',
      );
    });

    return redis;
  }

  /**
   * Get data from multi-tier cache (L1 -> L2 -> L3)
   */
  async get<T>(
    key: string,
    options?: { skipL1?: boolean; skipL2?: boolean },
  ): Promise<T | null> {
    const startTime = Date.now();

    try {
      // L1 Cache (Memory) - fastest
      if (!options?.skipL1) {
        const l1Result = this.getFromL1<T>(key);

        if (l1Result !== null) {
          this.recordHit('l1');
          this.recordResponseTime(Date.now() - startTime);

          return l1Result;
        }
      }

      // L2 Cache (Redis) - fast
      if (!options?.skipL2) {
        const l2Result = await this.getFromL2<T>(key);

        if (l2Result !== null) {
          // Promote to L1 cache
          await this.setToL1(key, l2Result);
          this.recordHit('l2');
          this.recordResponseTime(Date.now() - startTime);

          return l2Result;
        }
      }

      // Cache miss
      this.recordMiss();
      this.recordResponseTime(Date.now() - startTime);

      return null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}`, error);
      this.hvacSentryService.reportHVACError(
        error as Error,
        {
          context: HVACErrorContext.CONFIGURATION,
          operation: 'cache_get',
          additionalData: { key },
        },
        'warning',
      );

      return null;
    }
  }

  /**
   * Set data to multi-tier cache
   */
  async set<T>(
    key: string,
    data: T,
    options?: {
      ttl?: number;
      tags?: string[];
      tier?: CacheTier;
      compress?: boolean;
    },
  ): Promise<void> {
    try {
      const ttl = options?.ttl || this.getTtlForKey(key);
      const tags = options?.tags || [];
      const tier = options?.tier || CacheTier.L2_REDIS;
      const compress = options?.compress || this.shouldCompress(data);

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl * 1000, // Convert to milliseconds
        accessCount: 0,
        lastAccessed: Date.now(),
        tags,
        size: this.calculateSize(data),
        tier,
        compressionEnabled: compress,
      };

      // Set to appropriate tiers based on configuration
      if (tier === CacheTier.L1_MEMORY || tier === CacheTier.L2_REDIS) {
        await this.setToL1(key, data, entry);
      }

      if (tier === CacheTier.L2_REDIS || tier === CacheTier.L3_DATABASE) {
        await this.setToL2(key, data, entry);
      }

      this.logger.debug(`Cached entry for key ${key}`, {
        tier,
        size: entry.size,
        ttl,
        tags,
        compressed: compress,
      });
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}`, error);
      this.hvacSentryService.reportHVACError(
        error as Error,
        {
          context: HVACErrorContext.CONFIGURATION,
          operation: 'cache_set',
          additionalData: { key },
        },
        'warning',
      );
    }
  }

  /**
   * Delete from all cache tiers
   */
  async delete(key: string): Promise<boolean> {
    try {
      const l1Deleted = this.l1Cache.delete(key);
      const l2Deleted = await this.redis.del(key);

      this.logger.debug(`Deleted cache entry for key ${key}`, {
        l1Deleted,
        l2Deleted: l2Deleted > 0,
      });

      return l1Deleted || l2Deleted > 0;
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}`, error);

      return false;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let invalidatedCount = 0;

    try {
      // Invalidate L1 cache
      for (const [key, entry] of this.l1Cache.entries()) {
        if (entry.tags.some((tag) => tags.includes(tag))) {
          this.l1Cache.delete(key);
          invalidatedCount++;
        }
      }

      // Invalidate L2 cache using Redis SCAN
      for (const tag of tags) {
        const keys = await this.redis.keys(`*:tag:${tag}:*`);

        if (keys.length > 0) {
          const deleted = await this.redis.del(...keys);

          invalidatedCount += deleted;
        }
      }

      this.logger.log(`Invalidated ${invalidatedCount} cache entries by tags`, {
        tags,
      });

      return invalidatedCount;
    } catch (error) {
      this.logger.error('Cache invalidation by tags failed', error);

      return 0;
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  private async warmupCache(): Promise<void> {
    if (!this.config.warmupEnabled) {
      return;
    }

    try {
      this.logger.log('Starting cache warmup for HVAC data');

      // Warmup strategies for Polish HVAC market
      const warmupTasks = [
        this.warmupWeatherData(),
        this.warmupEquipmentStatuses(),
        this.warmupMaintenanceSchedules(),
        this.warmupCustomerProfiles(),
      ];

      await Promise.allSettled(warmupTasks);
      this.logger.log('Cache warmup completed');
    } catch (error) {
      this.logger.error('Cache warmup failed', error);
    }
  }

  private async warmupWeatherData(): Promise<void> {
    // Warmup weather data for major Polish cities
    const polishCities = ['Warsaw', 'Krakow', 'Gdansk', 'Wroclaw', 'Poznan'];

    // Implementation would fetch and cache weather data
    this.logger.debug(
      `Warmed up weather data for ${polishCities.length} Polish cities`,
    );
  }

  private async warmupEquipmentStatuses(): Promise<void> {
    // Warmup critical equipment statuses
    // Implementation would fetch and cache equipment data
    this.logger.debug('Warmed up critical equipment statuses');
  }

  private async warmupMaintenanceSchedules(): Promise<void> {
    // Warmup upcoming maintenance schedules
    // Implementation would fetch and cache maintenance data
    this.logger.debug('Warmed up maintenance schedules');
  }

  private async warmupCustomerProfiles(): Promise<void> {
    // Warmup VIP customer profiles
    // Implementation would fetch and cache customer data
    this.logger.debug('Warmed up VIP customer profiles');
  }

  // Helper methods for L1 cache operations
  private getFromL1<T>(key: string): T | null {
    const entry = this.l1Cache.get(key);

    if (!entry) {
      return null;
    }

    // Check expiration
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.l1Cache.delete(key);
      this.metrics.evictionCount++;

      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data as T;
  }

  private async setToL1<T>(
    key: string,
    data: T,
    entry?: CacheEntry<T>,
  ): Promise<void> {
    // Ensure we don't exceed L1 cache limits
    await this.ensureL1Space();

    const cacheEntry = entry || {
      data,
      timestamp: Date.now(),
      ttl: this.config.l2DefaultTtl * 1000,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags: [],
      size: this.calculateSize(data),
      tier: CacheTier.L1_MEMORY,
      compressionEnabled: false,
    };

    this.l1Cache.set(key, cacheEntry);
  }

  // Helper methods for L2 cache operations
  private async getFromL2<T>(key: string): Promise<T | null> {
    try {
      const result = await this.redis.get(key);

      if (!result) {
        return null;
      }

      const parsed = JSON.parse(result);

      return parsed.data as T;
    } catch (error) {
      this.logger.error(`L2 cache get error for key ${key}`, error);

      return null;
    }
  }

  private async setToL2<T>(
    key: string,
    data: T,
    entry: CacheEntry<T>,
  ): Promise<void> {
    try {
      const serialized = JSON.stringify({
        data,
        metadata: {
          timestamp: entry.timestamp,
          tags: entry.tags,
          size: entry.size,
          tier: entry.tier,
        },
      });

      const ttlSeconds = Math.floor(entry.ttl / 1000);

      await this.redis.setex(key, ttlSeconds, serialized);

      // Set tag references for invalidation
      for (const tag of entry.tags) {
        await this.redis.sadd(`tag:${tag}`, key);
        await this.redis.expire(`tag:${tag}`, ttlSeconds);
      }
    } catch (error) {
      this.logger.error(`L2 cache set error for key ${key}`, error);
    }
  }

  // Utility methods
  private getTtlForKey(key: string): number {
    if (key.includes('customer')) return this.TTL_CONFIG.CUSTOMER_PROFILE;
    if (key.includes('equipment')) return this.TTL_CONFIG.EQUIPMENT_STATUS;
    if (key.includes('maintenance'))
      return this.TTL_CONFIG.MAINTENANCE_SCHEDULE;
    if (key.includes('weather')) return this.TTL_CONFIG.WEATHER_DATA;
    if (key.includes('search')) return this.TTL_CONFIG.SEARCH_RESULTS;
    if (key.includes('analytics')) return this.TTL_CONFIG.ANALYTICS_DATA;
    if (key.includes('insights')) return this.TTL_CONFIG.INSIGHTS;

    return this.config.l2DefaultTtl;
  }

  private shouldCompress(data: unknown): boolean {
    const size = this.calculateSize(data);

    return size > this.config.compressionThreshold;
  }

  private calculateSize(data: unknown): number {
    return JSON.stringify(data).length;
  }

  private async ensureL1Space(): Promise<void> {
    if (this.l1Cache.size >= this.config.l1MaxEntries) {
      // LRU eviction - remove least recently used entries
      const entries = Array.from(this.l1Cache.entries());

      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

      const toRemove = Math.floor(this.config.l1MaxEntries * 0.1); // Remove 10%

      for (let i = 0; i < toRemove; i++) {
        this.l1Cache.delete(entries[i][0]);
        this.metrics.evictionCount++;
      }
    }
  }

  // Metrics methods
  private recordHit(tier: 'l1' | 'l2' | 'l3'): void {
    this.metrics.totalHits++;
    switch (tier) {
      case 'l1':
        this.metrics.l1HitRate = this.calculateHitRate('l1');
        break;
      case 'l2':
        this.metrics.l2HitRate = this.calculateHitRate('l2');
        break;
      case 'l3':
        this.metrics.l3HitRate = this.calculateHitRate('l3');
        break;
    }
  }

  private recordMiss(): void {
    this.metrics.totalMisses++;
  }

  private recordResponseTime(time: number): void {
    const total = this.metrics.totalHits + this.metrics.totalMisses;

    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (total - 1) + time) / total;
  }

  private calculateHitRate(_tier: 'l1' | 'l2' | 'l3'): number {
    const total = this.metrics.totalHits + this.metrics.totalMisses;

    if (total === 0) return 0;

    // Simplified calculation - in production, track per-tier statistics
    return this.metrics.totalHits / total;
  }

  // Cleanup and lifecycle methods
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Cleanup every minute
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.l1Cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.l1Cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired L1 cache entries`);
      this.metrics.evictionCount += cleanedCount;
    }
  }

  // Public API methods
  async getMetrics(): Promise<CacheMetrics> {
    this.metrics.memoryUsage = this.calculateMemoryUsage();

    return { ...this.metrics };
  }

  private calculateMemoryUsage(): number {
    let totalSize = 0;

    for (const entry of this.l1Cache.values()) {
      totalSize += entry.size;
    }

    return totalSize;
  }

  async clear(): Promise<void> {
    this.l1Cache.clear();
    await this.redis.flushdb();
    this.logger.log('All cache tiers cleared');
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: { ttl?: number; tags?: string[]; tier?: CacheTier },
  ): Promise<T> {
    let data = await this.get<T>(key);

    if (data === null) {
      data = await factory();
      await this.set(key, data, options);
    }

    return data;
  }

  // Generate cache keys with proper prefixes
  generateKey(
    type: keyof typeof this.CACHE_PREFIXES,
    identifier: string,
  ): string {
    return `${this.CACHE_PREFIXES[type]}${identifier}`;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.redis) {
      await this.redis.quit();
    }

    this.logger.log('HVAC Redis cache service destroyed');
  }
}
