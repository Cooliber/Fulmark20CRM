/**
 * Retry Service
 * "Pasja rodzi profesjonalizm" - Professional Retry Mechanisms
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Performance optimization with intelligent retry
 * - Proper TypeScript typing
 * - Event handlers over useEffect
 */

import { trackHVACUserAction } from '../index';

// Types
export type RetryStrategy = 'FIXED' | 'EXPONENTIAL' | 'LINEAR' | 'FIBONACCI';

export type RetryConfig = {
  maxAttempts: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  strategy: RetryStrategy;
  backoffMultiplier: number;
  jitter: boolean; // Add randomness to prevent thundering herd
  retryCondition?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
};

export type RetryResult<T> = {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
  retryDelays: number[];
};

// Default configuration
const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  strategy: 'EXPONENTIAL',
  backoffMultiplier: 2,
  jitter: true,
};

// Default retry condition - retry on network errors and 5xx status codes
const DEFAULT_RETRY_CONDITION = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  
  // Network errors
  if (message.includes('network') || 
      message.includes('fetch') || 
      message.includes('timeout') ||
      message.includes('connection')) {
    return true;
  }
  
  // Server errors (5xx)
  if (message.includes('500') || 
      message.includes('502') || 
      message.includes('503') || 
      message.includes('504')) {
    return true;
  }
  
  // Rate limiting
  if (message.includes('429') || message.includes('rate limit')) {
    return true;
  }
  
  return false;
};

class RetryService {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      retryCondition: config.retryCondition || DEFAULT_RETRY_CONDITION,
    };
  }

  /**
   * Execute operation with retry logic
   */
  async execute<T>(
    operation: () => Promise<T>,
    operationName: string = 'unknown',
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = customConfig ? { ...this.config, ...customConfig } : this.config;
    const startTime = performance.now();
    const retryDelays: number[] = [];
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        const totalDuration = performance.now() - startTime;

        // Track successful execution
        trackHVACUserAction('retry_service_success', 'FAULT_TOLERANCE', {
          operationName,
          attempts: attempt,
          totalDuration,
          retryDelays,
        });

        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Check if we should retry
        const shouldRetry = attempt < config.maxAttempts && 
                           config.retryCondition!(lastError);

        if (!shouldRetry) {
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, config);
        retryDelays.push(delay);

        // Call retry callback
        if (config.onRetry) {
          config.onRetry(attempt, lastError);
        }

        // Track retry attempt
        trackHVACUserAction('retry_service_attempt', 'FAULT_TOLERANCE', {
          operationName,
          attempt,
          error: lastError.message,
          delay,
          strategy: config.strategy,
        });

        // Wait before next attempt
        await this.delay(delay);
      }
    }

    // All attempts failed
    const totalDuration = performance.now() - startTime;
    
    trackHVACUserAction('retry_service_failed', 'FAULT_TOLERANCE', {
      operationName,
      attempts: config.maxAttempts,
      totalDuration,
      retryDelays,
      finalError: lastError!.message,
    });

    throw lastError!;
  }

  /**
   * Execute operation and return detailed result
   */
  async executeWithResult<T>(
    operation: () => Promise<T>,
    operationName: string = 'unknown',
    customConfig?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const config = customConfig ? { ...this.config, ...customConfig } : this.config;
    const startTime = performance.now();
    const retryDelays: number[] = [];
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        const totalDuration = performance.now() - startTime;

        return {
          success: true,
          result,
          attempts: attempt,
          totalDuration,
          retryDelays,
        };
      } catch (error) {
        lastError = error as Error;
        
        // Check if we should retry
        const shouldRetry = attempt < config.maxAttempts && 
                           config.retryCondition!(lastError);

        if (!shouldRetry) {
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, config);
        retryDelays.push(delay);

        // Call retry callback
        if (config.onRetry) {
          config.onRetry(attempt, lastError);
        }

        // Wait before next attempt
        await this.delay(delay);
      }
    }

    // All attempts failed
    const totalDuration = performance.now() - startTime;
    
    return {
      success: false,
      error: lastError!,
      attempts: config.maxAttempts,
      totalDuration,
      retryDelays,
    };
  }

  /**
   * Calculate delay based on retry strategy
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay: number;

    switch (config.strategy) {
      case 'FIXED':
        delay = config.baseDelay;
        break;
        
      case 'LINEAR':
        delay = config.baseDelay * attempt;
        break;
        
      case 'EXPONENTIAL':
        delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
        break;
        
      case 'FIBONACCI':
        delay = config.baseDelay * this.fibonacci(attempt);
        break;
        
      default:
        delay = config.baseDelay;
    }

    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);

    // Add jitter to prevent thundering herd
    if (config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      const randomJitter = (Math.random() - 0.5) * 2 * jitterAmount;
      delay = Math.max(0, delay + randomJitter);
    }

    return Math.round(delay);
  }

  /**
   * Calculate Fibonacci number
   */
  private fibonacci(n: number): number {
    if (n <= 1) return 1;
    if (n === 2) return 1;
    
    let a = 1, b = 1;
    for (let i = 3; i <= n; i++) {
      const temp = a + b;
      a = b;
      b = temp;
    }
    return b;
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a retryable version of a function
   */
  wrap<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    operationName?: string,
    customConfig?: Partial<RetryConfig>
  ): T {
    const retryService = this;
    
    return (async (...args: Parameters<T>) => {
      return retryService.execute(
        () => fn(...args),
        operationName || fn.name,
        customConfig
      );
    }) as T;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }
}

// Predefined retry services for different use cases
export const networkRetryService = new RetryService({
  maxAttempts: 3,
  baseDelay: 1000,
  strategy: 'EXPONENTIAL',
  backoffMultiplier: 2,
  jitter: true,
});

export const apiRetryService = new RetryService({
  maxAttempts: 5,
  baseDelay: 500,
  maxDelay: 10000,
  strategy: 'EXPONENTIAL',
  backoffMultiplier: 1.5,
  jitter: true,
});

export const searchRetryService = new RetryService({
  maxAttempts: 2,
  baseDelay: 300,
  maxDelay: 1000,
  strategy: 'FIXED',
  jitter: false,
});

export const criticalRetryService = new RetryService({
  maxAttempts: 10,
  baseDelay: 100,
  maxDelay: 5000,
  strategy: 'FIBONACCI',
  jitter: true,
});

// Export service class for custom configurations
export { RetryService };
