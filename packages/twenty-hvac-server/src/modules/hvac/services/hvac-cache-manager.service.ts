import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HvacConfigService } from '../../../config/hvac-config/hvac-config.service';
import { HvacSentryService, HVACErrorContext } from './hvac-sentry.service';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
  size: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  averageAccessTime: number;
  topKeys: { key: string; accessCount: number; size: number }[];
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in MB
  maxEntries: number; // Maximum number of entries
  defaultTtl: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  enableCompression: boolean;
  enableMetrics: boolean;
}

@Injectable()
export class HvacCacheManagerService {
  private readonly logger = new Logger(HvacCacheManagerService.name);
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalAccessTime: 0,
    accessCount: 0,
  };
  private config: CacheConfig;

  constructor(
    private readonly hvacConfigService: HvacConfigService,
    private readonly hvacSentryService: HvacSentryService,
  ) {
    this.initializeConfig();
    this.logger.log('HVAC Cache Manager initialized');
  }

  private initializeConfig(): void {
    this.config = {
      maxSize: this.hvacConfigService.getNumberConfig('CACHE_MAX_SIZE_MB', 100),
      maxEntries: this.hvacConfigService.getNumberConfig('CACHE_MAX_ENTRIES', 10000),
      defaultTtl: this.hvacConfigService.getNumberConfig('CACHE_DEFAULT_TTL', 300000), // 5 minutes
      cleanupInterval: this.hvacConfigService.getNumberConfig('CACHE_CLEANUP_INTERVAL', 60000), // 1 minute
      enableCompression: this.hvacConfigService.getBooleanConfig('CACHE_ENABLE_COMPRESSION', false),
      enableMetrics: this.hvacConfigService.getBooleanConfig('CACHE_ENABLE_METRICS', true),
    };
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.recordMiss();
        return null;
      }

      // Check if entry has expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.recordMiss();
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      
      this.recordHit();
      this.recordAccessTime(Date.now() - startTime);
      
      return entry.data as T;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}`, error);
      this.hvacSentryService.reportHVACError(
        error as Error,
        {
          context: HVACErrorContext.CONFIGURATION,
          operation: 'cache_get',
          additionalData: { key },
        },
        'warning'
      );
      return null;
    }
  }

  async set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      tags?: string[];
      priority?: 'low' | 'normal' | 'high';
    } = {}
  ): Promise<void> {
    try {
      const ttl = options.ttl || this.config.defaultTtl;
      const tags = options.tags || [];
      const size = this.calculateSize(data);

      // Check if we need to make space
      await this.ensureSpace(size);

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        tags,
        size,
      };

      this.cache.set(key, entry);
      
      this.logger.debug(`Cached entry for key ${key}`, {
        size,
        ttl,
        tags,
        totalEntries: this.cache.size,
      });
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}`, error);
      this.hvacSentryService.reportHVACError(
        error as Error,
        {
          context: HVACErrorContext.CONFIGURATION,
          operation: 'cache_set',
          additionalData: { key, size: this.calculateSize(data) },
        },
        'warning'
      );
    }
  }

  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Deleted cache entry for key ${key}`);
    }
    return deleted;
  }

  async clear(): Promise<void> {
    const entriesCount = this.cache.size;
    this.cache.clear();
    this.resetStats();
    this.logger.log(`Cleared cache: ${entriesCount} entries removed`);
  }

  async invalidateByTag(tag: string): Promise<number> {
    let invalidatedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    this.logger.log(`Invalidated ${invalidatedCount} entries with tag: ${tag}`);
    return invalidatedCount;
  }

  async invalidateByPattern(pattern: RegExp): Promise<number> {
    let invalidatedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    this.logger.log(`Invalidated ${invalidatedCount} entries matching pattern: ${pattern}`);
    return invalidatedCount;
  }

  // Automatic cleanup every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async performCleanup(): Promise<void> {
    try {
      const startTime = Date.now();
      let expiredCount = 0;
      let evictedCount = 0;

      // Remove expired entries
      for (const [key, entry] of this.cache.entries()) {
        if (Date.now() - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
          expiredCount++;
        }
      }

      // Check if we need to evict entries due to size/count limits
      if (this.cache.size > this.config.maxEntries) {
        evictedCount = await this.evictLeastUsed(this.cache.size - this.config.maxEntries);
      }

      const totalSize = this.getTotalSize();
      if (totalSize > this.config.maxSize * 1024 * 1024) { // Convert MB to bytes
        const targetSize = this.config.maxSize * 1024 * 1024 * 0.8; // Target 80% of max size
        evictedCount += await this.evictBySize(totalSize - targetSize);
      }

      const duration = Date.now() - startTime;
      
      if (expiredCount > 0 || evictedCount > 0) {
        this.logger.debug(`Cache cleanup completed in ${duration}ms`, {
          expiredCount,
          evictedCount,
          remainingEntries: this.cache.size,
          totalSize: this.getTotalSize(),
        });
      }
    } catch (error) {
      this.logger.error('Cache cleanup failed', error);
      this.hvacSentryService.reportHVACError(
        error as Error,
        {
          context: HVACErrorContext.CONFIGURATION,
          operation: 'cache_cleanup',
        },
        'warning'
      );
    }
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    const currentSize = this.getTotalSize();
    const maxSizeBytes = this.config.maxSize * 1024 * 1024;
    
    if (currentSize + requiredSize > maxSizeBytes) {
      const spaceToFree = (currentSize + requiredSize) - (maxSizeBytes * 0.8); // Free to 80% capacity
      await this.evictBySize(spaceToFree);
    }
    
    if (this.cache.size >= this.config.maxEntries) {
      await this.evictLeastUsed(1);
    }
  }

  private async evictLeastUsed(count: number): Promise<number> {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => {
        // Sort by access count (ascending) and last accessed (ascending)
        if (a.accessCount !== b.accessCount) {
          return a.accessCount - b.accessCount;
        }
        return a.lastAccessed - b.lastAccessed;
      });

    let evicted = 0;
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      const [key] = entries[i];
      this.cache.delete(key);
      evicted++;
      this.stats.evictions++;
    }

    return evicted;
  }

  private async evictBySize(targetSize: number): Promise<number> {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => {
        // Prioritize larger, less frequently accessed entries
        const scoreA = a.size / (a.accessCount + 1);
        const scoreB = b.size / (b.accessCount + 1);
        return scoreB - scoreA;
      });

    let freedSize = 0;
    let evicted = 0;
    
    for (const [key, entry] of entries) {
      if (freedSize >= targetSize) break;
      
      this.cache.delete(key);
      freedSize += entry.size;
      evicted++;
      this.stats.evictions++;
    }

    return evicted;
  }

  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1000; // Default size if calculation fails
    }
  }

  private getTotalSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  private recordHit(): void {
    this.stats.hits++;
  }

  private recordMiss(): void {
    this.stats.misses++;
  }

  private recordAccessTime(time: number): void {
    this.stats.totalAccessTime += time;
    this.stats.accessCount++;
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalAccessTime: 0,
      accessCount: 0,
    };
  }

  // Public API
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;
    const averageAccessTime = this.stats.accessCount > 0 ? this.stats.totalAccessTime / this.stats.accessCount : 0;

    // Get top accessed keys
    const topKeys = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        size: entry.size,
      }));

    return {
      totalEntries: this.cache.size,
      totalSize: this.getTotalSize(),
      hitRate,
      missRate,
      evictionCount: this.stats.evictions,
      averageAccessTime,
      topKeys,
    };
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...updates };
    this.logger.log('Cache configuration updated', updates);
  }

  // Utility methods for common cache patterns
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: { ttl?: number; tags?: string[] }
  ): Promise<T> {
    let data = await this.get<T>(key);
    
    if (data === null) {
      data = await factory();
      await this.set(key, data, options);
    }
    
    return data;
  }

  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const value = await this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    }
    
    return results;
  }

  async mset<T>(entries: Map<string, T>, options?: { ttl?: number; tags?: string[] }): Promise<void> {
    const promises = Array.from(entries.entries()).map(([key, value]) =>
      this.set(key, value, options)
    );
    
    await Promise.all(promises);
  }
}
