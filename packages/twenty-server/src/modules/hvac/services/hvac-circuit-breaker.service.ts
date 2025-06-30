/**
 * HVAC Circuit Breaker Service
 * "Pasja rodzi profesjonalizm" - Professional resilience for Polish HVAC systems
 *
 * Implements circuit breaker pattern with fallback mechanisms and timeout/retry policies
 * specifically designed for Polish HVAC equipment response characteristics
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HVACErrorContext, HvacSentryService } from './hvac-sentry.service';

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
  timeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  exponentialBackoff: boolean;
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalCalls: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  stateChangedAt: number;
  averageResponseTime: number;
  failureRate: number;
}

export interface FallbackOptions<T> {
  fallbackValue?: T;
  fallbackFunction?: () => Promise<T>;
  useCachedValue?: boolean;
  cacheKey?: string;
}

@Injectable()
export class HvacCircuitBreakerService {
  private readonly logger = new Logger(HvacCircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitBreakerMetrics>();
  private readonly configs = new Map<string, CircuitBreakerConfig>();

  // Default configurations for different HVAC equipment types
  private readonly DEFAULT_CONFIGS = {
    // Polish heating systems (slower response expected)
    HEATING_SYSTEM: {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      halfOpenMaxCalls: 3,
      timeoutMs: 15000, // 15 seconds for heating systems
      retryAttempts: 3,
      retryDelayMs: 2000,
      exponentialBackoff: true,
    },
    // Air conditioning (faster response expected)
    AIR_CONDITIONING: {
      failureThreshold: 3,
      recoveryTimeout: 30000, // 30 seconds
      monitoringPeriod: 180000, // 3 minutes
      halfOpenMaxCalls: 2,
      timeoutMs: 8000, // 8 seconds for AC systems
      retryAttempts: 2,
      retryDelayMs: 1000,
      exponentialBackoff: true,
    },
    // Ventilation systems
    VENTILATION: {
      failureThreshold: 4,
      recoveryTimeout: 45000, // 45 seconds
      monitoringPeriod: 240000, // 4 minutes
      halfOpenMaxCalls: 2,
      timeoutMs: 10000, // 10 seconds for ventilation
      retryAttempts: 3,
      retryDelayMs: 1500,
      exponentialBackoff: true,
    },
    // Smart thermostats and IoT devices
    IOT_DEVICE: {
      failureThreshold: 2,
      recoveryTimeout: 20000, // 20 seconds
      monitoringPeriod: 120000, // 2 minutes
      halfOpenMaxCalls: 1,
      timeoutMs: 5000, // 5 seconds for IoT
      retryAttempts: 2,
      retryDelayMs: 500,
      exponentialBackoff: false,
    },
    // External weather APIs
    WEATHER_API: {
      failureThreshold: 3,
      recoveryTimeout: 120000, // 2 minutes
      monitoringPeriod: 600000, // 10 minutes
      halfOpenMaxCalls: 1,
      timeoutMs: 10000, // 10 seconds for weather APIs
      retryAttempts: 3,
      retryDelayMs: 3000,
      exponentialBackoff: true,
    },
  };

  constructor(
    private readonly _configService: ConfigService,
    private readonly hvacSentryService: HvacSentryService,
  ) {
    this.initializeDefaultCircuits();
  }

  private initializeDefaultCircuits(): void {
    for (const [circuitName, config] of Object.entries(this.DEFAULT_CONFIGS)) {
      this.configs.set(circuitName, config);
      this.circuits.set(circuitName, this.createInitialMetrics());
    }

    this.logger.log(
      `Initialized ${this.circuits.size} circuit breakers for HVAC systems`,
    );
  }

  private createInitialMetrics(): CircuitBreakerMetrics {
    return {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      totalCalls: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      stateChangedAt: Date.now(),
      averageResponseTime: 0,
      failureRate: 0,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    circuitName: string,
    operation: () => Promise<T>,
    fallbackOptions?: FallbackOptions<T>,
  ): Promise<T> {
    const circuit = this.getOrCreateCircuit(circuitName);
    const config = this.getConfig(circuitName);

    // Check if circuit is open
    if (circuit.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset(circuit, config)) {
        this.transitionToHalfOpen(circuitName);
      } else {
        return this.executeFallback(circuitName, fallbackOptions);
      }
    }

    // Check if circuit is half-open and we've exceeded max calls
    if (
      circuit.state === CircuitState.HALF_OPEN &&
      circuit.totalCalls >= config.halfOpenMaxCalls
    ) {
      return this.executeFallback(circuitName, fallbackOptions);
    }

    return this.executeWithRetry(
      circuitName,
      operation,
      fallbackOptions,
      config,
    );
  }

  private async executeWithRetry<T>(
    circuitName: string,
    operation: () => Promise<T>,
    fallbackOptions: FallbackOptions<T> | undefined,
    config: CircuitBreakerConfig,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.retryAttempts; attempt++) {
      try {
        const startTime = Date.now();

        // Execute with timeout
        const result = await this.executeWithTimeout(
          operation,
          config.timeoutMs,
        );

        // Record success
        this.recordSuccess(circuitName, Date.now() - startTime);

        return result;
      } catch (error) {
        lastError = error as Error;

        // Record failure
        this.recordFailure(circuitName, lastError);

        // If this is not the last attempt, wait before retrying
        if (attempt < config.retryAttempts) {
          const delay = this.calculateRetryDelay(attempt, config);

          await this.sleep(delay);

          this.logger.debug(
            `Retrying operation for circuit ${circuitName}, attempt ${attempt + 2}/${config.retryAttempts + 1}`,
          );
        }
      }
    }

    // All retries failed, execute fallback
    this.logger.error(
      `All retries failed for circuit ${circuitName}`,
      lastError,
    );

    return this.executeFallback(
      circuitName,
      fallbackOptions,
      lastError || undefined,
    );
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private calculateRetryDelay(
    attempt: number,
    config: CircuitBreakerConfig,
  ): number {
    if (!config.exponentialBackoff) {
      return config.retryDelayMs;
    }

    // Exponential backoff with jitter for Polish HVAC systems
    const baseDelay = config.retryDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter

    return Math.min(baseDelay + jitter, 30000); // Max 30 seconds
  }

  private async executeFallback<T>(
    circuitName: string,
    fallbackOptions?: FallbackOptions<T>,
    originalError?: Error,
  ): Promise<T> {
    this.logger.warn(`Executing fallback for circuit ${circuitName}`, {
      circuitState: this.circuits.get(circuitName)?.state,
      originalError: originalError?.message,
    });

    if (fallbackOptions?.fallbackFunction) {
      try {
        return await fallbackOptions.fallbackFunction();
      } catch (fallbackError) {
        this.logger.error(
          `Fallback function failed for circuit ${circuitName}`,
          fallbackError,
        );
      }
    }

    if (fallbackOptions?.fallbackValue !== undefined) {
      return fallbackOptions.fallbackValue;
    }

    // If no fallback is provided, throw the original error or a circuit breaker error
    const error =
      originalError ||
      new Error(
        `Circuit breaker ${circuitName} is open and no fallback provided`,
      );

    this.hvacSentryService.reportHVACError(
      error,
      {
        context: HVACErrorContext.HVAC_API_INTEGRATION,
        operation: 'circuit_breaker_fallback',
        additionalData: { circuitName },
      },
      'error',
    );

    throw error;
  }

  private recordSuccess(circuitName: string, responseTime: number): void {
    const circuit = this.circuits.get(circuitName);

    if (!circuit) return;

    circuit.successCount++;
    circuit.totalCalls++;
    circuit.lastSuccessTime = Date.now();

    // Update average response time
    const totalResponseTime =
      circuit.averageResponseTime * (circuit.totalCalls - 1) + responseTime;

    circuit.averageResponseTime = totalResponseTime / circuit.totalCalls;

    // Reset failure count on success
    circuit.failureCount = 0;

    // Update failure rate
    this.updateFailureRate(circuit);

    // Transition from half-open to closed if successful
    if (circuit.state === CircuitState.HALF_OPEN) {
      this.transitionToClosed(circuitName);
    }

    this.logger.debug(`Recorded success for circuit ${circuitName}`, {
      responseTime,
      totalCalls: circuit.totalCalls,
      state: circuit.state,
    });
  }

  private recordFailure(circuitName: string, error: Error): void {
    const circuit = this.circuits.get(circuitName);
    const config = this.getConfig(circuitName);

    if (!circuit) return;

    circuit.failureCount++;
    circuit.totalCalls++;
    circuit.lastFailureTime = Date.now();

    // Update failure rate
    this.updateFailureRate(circuit);

    // Check if we should open the circuit
    if (
      circuit.failureCount >= config.failureThreshold &&
      circuit.state === CircuitState.CLOSED
    ) {
      this.transitionToOpen(circuitName);
    } else if (circuit.state === CircuitState.HALF_OPEN) {
      // If we're in half-open and get a failure, go back to open
      this.transitionToOpen(circuitName);
    }

    this.logger.debug(`Recorded failure for circuit ${circuitName}`, {
      error: error.message,
      failureCount: circuit.failureCount,
      state: circuit.state,
    });
  }

  private updateFailureRate(circuit: CircuitBreakerMetrics): void {
    if (circuit.totalCalls === 0) {
      circuit.failureRate = 0;

      return;
    }

    // Calculate failure rate over the monitoring period
    // Note: In production, implement sliding window calculation using periodStart
    // const now = Date.now();
    // const config = this.getConfig('default');
    // const _periodStart = now - config.monitoringPeriod;

    // Simplified calculation - in production, use sliding window
    circuit.failureRate = circuit.failureCount / circuit.totalCalls;
  }

  private shouldAttemptReset(
    circuit: CircuitBreakerMetrics,
    config: CircuitBreakerConfig,
  ): boolean {
    const timeSinceLastFailure = Date.now() - circuit.lastFailureTime;

    return timeSinceLastFailure >= config.recoveryTimeout;
  }

  private transitionToClosed(circuitName: string): void {
    const circuit = this.circuits.get(circuitName);

    if (!circuit) return;

    circuit.state = CircuitState.CLOSED;
    circuit.stateChangedAt = Date.now();
    circuit.failureCount = 0;

    this.logger.log(`Circuit ${circuitName} transitioned to CLOSED state`);
  }

  private transitionToOpen(circuitName: string): void {
    const circuit = this.circuits.get(circuitName);

    if (!circuit) return;

    circuit.state = CircuitState.OPEN;
    circuit.stateChangedAt = Date.now();

    this.logger.warn(`Circuit ${circuitName} transitioned to OPEN state`, {
      failureCount: circuit.failureCount,
      failureRate: circuit.failureRate,
    });

    // Report circuit breaker opening to Sentry
    this.hvacSentryService.reportHVACError(
      new Error(`Circuit breaker ${circuitName} opened due to failures`),
      {
        context: HVACErrorContext.HVAC_API_INTEGRATION,
        operation: 'circuit_breaker_open',
        additionalData: {
          circuitName,
          failureCount: circuit.failureCount,
          failureRate: circuit.failureRate,
        },
      },
      'warning',
    );
  }

  private transitionToHalfOpen(circuitName: string): void {
    const circuit = this.circuits.get(circuitName);

    if (!circuit) return;

    circuit.state = CircuitState.HALF_OPEN;
    circuit.stateChangedAt = Date.now();
    circuit.totalCalls = 0; // Reset call count for half-open period

    this.logger.log(`Circuit ${circuitName} transitioned to HALF_OPEN state`);
  }

  private getOrCreateCircuit(circuitName: string): CircuitBreakerMetrics {
    if (!this.circuits.has(circuitName)) {
      this.circuits.set(circuitName, this.createInitialMetrics());

      // Use default config if specific config doesn't exist
      if (!this.configs.has(circuitName)) {
        this.configs.set(circuitName, this.DEFAULT_CONFIGS.HEATING_SYSTEM);
      }

      this.logger.log(`Created new circuit breaker: ${circuitName}`);
    }

    const circuit = this.circuits.get(circuitName);

    if (!circuit) {
      throw new Error(`Circuit ${circuitName} not found after creation`);
    }

    return circuit;
  }

  private getConfig(circuitName: string): CircuitBreakerConfig {
    return this.configs.get(circuitName) || this.DEFAULT_CONFIGS.HEATING_SYSTEM;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Public API methods

  /**
   * Get circuit breaker metrics for monitoring
   */
  getCircuitMetrics(circuitName: string): CircuitBreakerMetrics | null {
    return this.circuits.get(circuitName) || null;
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllCircuitMetrics(): Map<string, CircuitBreakerMetrics> {
    return new Map(this.circuits);
  }

  /**
   * Manually reset a circuit breaker
   */
  resetCircuit(circuitName: string): boolean {
    const circuit = this.circuits.get(circuitName);

    if (!circuit) return false;

    circuit.state = CircuitState.CLOSED;
    circuit.failureCount = 0;
    circuit.stateChangedAt = Date.now();

    this.logger.log(`Manually reset circuit breaker: ${circuitName}`);

    return true;
  }

  /**
   * Configure a custom circuit breaker
   */
  configureCircuit(
    circuitName: string,
    config: Partial<CircuitBreakerConfig>,
  ): void {
    const existingConfig = this.getConfig(circuitName);
    const newConfig = { ...existingConfig, ...config };

    this.configs.set(circuitName, newConfig);

    this.logger.log(`Configured circuit breaker: ${circuitName}`, newConfig);
  }

  /**
   * Check if a circuit is healthy
   */
  isCircuitHealthy(circuitName: string): boolean {
    const circuit = this.circuits.get(circuitName);

    if (!circuit) return true; // Non-existent circuits are considered healthy

    return circuit.state === CircuitState.CLOSED && circuit.failureRate < 0.5;
  }

  /**
   * Get health status of all circuits
   */
  getHealthStatus(): {
    healthy: string[];
    unhealthy: string[];
    open: string[];
  } {
    const healthy: string[] = [];
    const unhealthy: string[] = [];
    const open: string[] = [];

    for (const [name, circuit] of this.circuits.entries()) {
      if (circuit.state === CircuitState.OPEN) {
        open.push(name);
      } else if (this.isCircuitHealthy(name)) {
        healthy.push(name);
      } else {
        unhealthy.push(name);
      }
    }

    return { healthy, unhealthy, open };
  }

  /**
   * Execute operation with specific HVAC equipment type configuration
   */
  async executeForEquipmentType<T>(
    equipmentType: keyof typeof this.DEFAULT_CONFIGS,
    operation: () => Promise<T>,
    fallbackOptions?: FallbackOptions<T>,
  ): Promise<T> {
    return this.execute(equipmentType, operation, fallbackOptions);
  }
}
