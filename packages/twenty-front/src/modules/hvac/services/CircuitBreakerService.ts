/**
 * Circuit Breaker Service
 * "Pasja rodzi profesjonalizm" - Professional Fault Tolerance
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Performance optimization with circuit breaker pattern
 * - Proper TypeScript typing
 * - Event handlers over useEffect
 */

import { trackHVACUserAction } from '../index';

// Types
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type CircuitBreakerConfig = {
  failureThreshold: number; // Number of failures before opening
  recoveryTimeout: number; // Time in ms before attempting recovery
  monitoringPeriod: number; // Time window for failure counting
  successThreshold: number; // Successes needed to close from half-open
  maxRetries: number; // Maximum retry attempts
};

export type CircuitBreakerMetrics = {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeouts: number;
  circuitOpenCount: number;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
  averageResponseTime: number;
};

export type CircuitBreakerEvent = {
  type: 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'CIRCUIT_OPEN' | 'CIRCUIT_CLOSE' | 'CIRCUIT_HALF_OPEN';
  timestamp: Date;
  duration?: number;
  error?: string;
};

// Default configuration
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeout: 30000, // 30 seconds
  monitoringPeriod: 60000, // 1 minute
  successThreshold: 3,
  maxRetries: 3,
};

class CircuitBreakerService {
  private state: CircuitBreakerState = 'CLOSED';
  private config: CircuitBreakerConfig;
  private metrics: CircuitBreakerMetrics;
  private events: CircuitBreakerEvent[] = [];
  private lastFailureTime: number = 0;
  private consecutiveSuccesses: number = 0;
  private consecutiveFailures: number = 0;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      circuitOpenCount: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      averageResponseTime: 0,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    operationName: string = 'unknown',
    timeout: number = 10000
  ): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (this.shouldAttemptRecovery()) {
        this.transitionToHalfOpen();
      } else {
        const error = new Error(`Circuit breaker is OPEN for operation: ${operationName}`);
        this.recordEvent('CIRCUIT_OPEN', 0, error.message);
        throw error;
      }
    }

    const startTime = performance.now();
    this.metrics.totalRequests++;

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(operation, timeout);
      const duration = performance.now() - startTime;

      this.onSuccess(duration, operationName);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.onFailure(error as Error, duration, operationName);
      throw error;
    }
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      operation()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Handle successful operation
   */
  private onSuccess(duration: number, operationName: string): void {
    this.metrics.successfulRequests++;
    this.metrics.lastSuccessTime = new Date();
    this.updateAverageResponseTime(duration);
    
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses++;

    this.recordEvent('SUCCESS', duration);

    // Transition from HALF_OPEN to CLOSED if enough successes
    if (this.state === 'HALF_OPEN' && this.consecutiveSuccesses >= this.config.successThreshold) {
      this.transitionToClosed();
    }

    trackHVACUserAction('circuit_breaker_success', 'FAULT_TOLERANCE', {
      operationName,
      duration,
      state: this.state,
      consecutiveSuccesses: this.consecutiveSuccesses,
    });
  }

  /**
   * Handle failed operation
   */
  private onFailure(error: Error, duration: number, operationName: string): void {
    this.metrics.failedRequests++;
    this.metrics.lastFailureTime = new Date();
    this.lastFailureTime = Date.now();
    
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures++;

    const isTimeout = error.message.includes('timed out');
    if (isTimeout) {
      this.metrics.timeouts++;
      this.recordEvent('TIMEOUT', duration, error.message);
    } else {
      this.recordEvent('FAILURE', duration, error.message);
    }

    // Check if we should open the circuit
    if (this.shouldOpenCircuit()) {
      this.transitionToOpen();
    }

    trackHVACUserAction('circuit_breaker_failure', 'FAULT_TOLERANCE', {
      operationName,
      error: error.message,
      duration,
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      isTimeout,
    });
  }

  /**
   * Check if circuit should be opened
   */
  private shouldOpenCircuit(): boolean {
    return this.consecutiveFailures >= this.config.failureThreshold;
  }

  /**
   * Check if recovery should be attempted
   */
  private shouldAttemptRecovery(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.recoveryTimeout;
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    this.state = 'OPEN';
    this.metrics.circuitOpenCount++;
    this.recordEvent('CIRCUIT_OPEN');

    trackHVACUserAction('circuit_breaker_opened', 'FAULT_TOLERANCE', {
      consecutiveFailures: this.consecutiveFailures,
      failureThreshold: this.config.failureThreshold,
    });
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    this.state = 'HALF_OPEN';
    this.consecutiveSuccesses = 0;
    this.recordEvent('CIRCUIT_HALF_OPEN');

    trackHVACUserAction('circuit_breaker_half_open', 'FAULT_TOLERANCE', {
      recoveryTimeout: this.config.recoveryTimeout,
    });
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.recordEvent('CIRCUIT_CLOSE');

    trackHVACUserAction('circuit_breaker_closed', 'FAULT_TOLERANCE', {
      consecutiveSuccesses: this.consecutiveSuccesses,
      successThreshold: this.config.successThreshold,
    });
  }

  /**
   * Record circuit breaker event
   */
  private recordEvent(
    type: CircuitBreakerEvent['type'],
    duration?: number,
    error?: string
  ): void {
    const event: CircuitBreakerEvent = {
      type,
      timestamp: new Date(),
      duration,
      error,
    };

    this.events.push(event);

    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(duration: number): void {
    const totalRequests = this.metrics.totalRequests;
    const currentAverage = this.metrics.averageResponseTime;
    
    this.metrics.averageResponseTime = 
      (currentAverage * (totalRequests - 1) + duration) / totalRequests;
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent events
   */
  getEvents(limit: number = 10): CircuitBreakerEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    isHealthy: boolean;
    state: CircuitBreakerState;
    failureRate: number;
    averageResponseTime: number;
    message: string;
  } {
    const failureRate = this.metrics.totalRequests > 0 
      ? this.metrics.failedRequests / this.metrics.totalRequests 
      : 0;

    const isHealthy = this.state === 'CLOSED' && failureRate < 0.1; // Less than 10% failure rate

    let message = 'System działa prawidłowo';
    if (this.state === 'OPEN') {
      message = 'System tymczasowo niedostępny - trwa odzyskiwanie';
    } else if (this.state === 'HALF_OPEN') {
      message = 'System w trakcie testowania dostępności';
    } else if (failureRate > 0.1) {
      message = 'System działa z ograniczeniami';
    }

    return {
      isHealthy,
      state: this.state,
      failureRate,
      averageResponseTime: this.metrics.averageResponseTime,
      message,
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = 0;
    
    // Reset metrics but keep historical data
    this.metrics.totalRequests = 0;
    this.metrics.successfulRequests = 0;
    this.metrics.failedRequests = 0;
    this.metrics.timeouts = 0;
    this.metrics.averageResponseTime = 0;

    this.recordEvent('CIRCUIT_CLOSE');

    trackHVACUserAction('circuit_breaker_reset', 'FAULT_TOLERANCE', {
      previousState: this.state,
    });
  }
}

// Singleton instances for different services
export const hvacApiCircuitBreaker = new CircuitBreakerService({
  failureThreshold: 5,
  recoveryTimeout: 30000,
  successThreshold: 3,
});

export const weaviateCircuitBreaker = new CircuitBreakerService({
  failureThreshold: 3,
  recoveryTimeout: 15000,
  successThreshold: 2,
});

export const searchCircuitBreaker = new CircuitBreakerService({
  failureThreshold: 10,
  recoveryTimeout: 10000,
  successThreshold: 5,
});

// Export service class for custom configurations
export { CircuitBreakerService };
