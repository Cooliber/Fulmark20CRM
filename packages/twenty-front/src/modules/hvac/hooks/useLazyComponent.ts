/**
 * useLazyComponent Hook - Advanced Lazy Loading for HVAC Components
 * "Pasja rodzi profesjonalizm" - Professional lazy loading with performance optimization
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Event handlers over useEffect
 * - Proper TypeScript typing
 * - Performance optimization with 300ms debounced loading
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { bundleOptimizationService, type ComponentType, type LoadingStrategy } from '../services/BundleOptimizationService';
import { trackHVACUserAction } from '../index';

// Types
export type LazyComponentState = 'idle' | 'loading' | 'loaded' | 'error';

export type UseLazyComponentOptions = {
  componentType: ComponentType;
  loadingStrategy?: LoadingStrategy;
  preload?: boolean;
  preloadDelay?: number;
  enableIntersectionObserver?: boolean;
  intersectionThreshold?: number;
  debounceDelay?: number;
  retryAttempts?: number;
  retryDelay?: number;
  onLoadStart?: () => void;
  onLoadSuccess?: (component: any) => void;
  onLoadError?: (error: Error) => void;
};

export type UseLazyComponentReturn = {
  component: any;
  state: LazyComponentState;
  error: Error | null;
  loadComponent: () => Promise<void>;
  retryLoad: () => Promise<void>;
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
  loadTime: number;
};

/**
 * Advanced lazy loading hook with performance optimization
 * Implements HVAC CRM performance standards with 300ms debounced loading
 */
export const useLazyComponent = (options: UseLazyComponentOptions): UseLazyComponentReturn => {
  const {
    componentType,
    loadingStrategy = 'ON_DEMAND',
    preload = false,
    preloadDelay = 2000,
    enableIntersectionObserver = true,
    intersectionThreshold = 0.1,
    debounceDelay = 300, // 300ms for debounced performance
    retryAttempts = 3,
    retryDelay = 1000,
    onLoadStart,
    onLoadSuccess,
    onLoadError,
  } = options;

  // State management
  const [state, setState] = useState<LazyComponentState>('idle');
  const [component, setComponent] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loadTime, setLoadTime] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Refs for cleanup and debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const loadStartTimeRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);

  // Debounced load function - Following Twenty CRM cursor rules (event handlers over useEffect)
  const debouncedLoad = useCallback(async () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;

      try {
        setState('loading');
        setError(null);
        loadStartTimeRef.current = performance.now();

        if (onLoadStart) {
          onLoadStart();
        }

        trackHVACUserAction('lazy_component_load_started', 'PERFORMANCE', {
          componentType,
          loadingStrategy,
          retryCount,
        });

        const loadedComponent = await bundleOptimizationService.loadComponent(
          componentType,
          loadingStrategy
        );

        if (!mountedRef.current) return;

        const endTime = performance.now();
        const totalLoadTime = endTime - loadStartTimeRef.current;

        setComponent(loadedComponent);
        setState('loaded');
        setLoadTime(totalLoadTime);
        setRetryCount(0);

        if (onLoadSuccess) {
          onLoadSuccess(loadedComponent);
        }

        trackHVACUserAction('lazy_component_load_success', 'PERFORMANCE', {
          componentType,
          loadingStrategy,
          loadTime: totalLoadTime,
        });

      } catch (loadError) {
        if (!mountedRef.current) return;

        const errorInstance = loadError instanceof Error ? loadError : new Error('Component load failed');
        setError(errorInstance);
        setState('error');

        if (onLoadError) {
          onLoadError(errorInstance);
        }

        trackHVACUserAction('lazy_component_load_error', 'ERROR_REPORTING', {
          componentType,
          loadingStrategy,
          error: errorInstance.message,
          retryCount,
        });

        // Auto-retry logic
        if (retryCount < retryAttempts) {
          setTimeout(() => {
            if (mountedRef.current) {
              setRetryCount(prev => prev + 1);
              debouncedLoad();
            }
          }, retryDelay * (retryCount + 1)); // Exponential backoff
        }
      }
    }, debounceDelay);
  }, [
    componentType,
    loadingStrategy,
    retryCount,
    retryAttempts,
    retryDelay,
    debounceDelay,
    onLoadStart,
    onLoadSuccess,
    onLoadError,
  ]);

  // Load component function
  const loadComponent = useCallback(async () => {
    if (state === 'loading' || state === 'loaded') return;
    await debouncedLoad();
  }, [state, debouncedLoad]);

  // Retry load function
  const retryLoad = useCallback(async () => {
    setRetryCount(0);
    setState('idle');
    setError(null);
    await debouncedLoad();
  }, [debouncedLoad]);

  // Setup intersection observer for automatic loading
  useEffect(() => {
    if (!enableIntersectionObserver || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && state === 'idle') {
            loadComponent();
          }
        });
      },
      {
        threshold: intersectionThreshold,
        rootMargin: '50px',
      }
    );

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [enableIntersectionObserver, intersectionThreshold, state, loadComponent]);

  // Preload logic
  useEffect(() => {
    if (preload && state === 'idle') {
      const preloadTimer = setTimeout(() => {
        if (mountedRef.current && state === 'idle') {
          loadComponent();
        }
      }, preloadDelay);

      return () => clearTimeout(preloadTimer);
    }
  }, [preload, preloadDelay, state, loadComponent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, []);

  // Derived state
  const isLoading = state === 'loading';
  const isLoaded = state === 'loaded';
  const isError = state === 'error';

  return {
    component,
    state,
    error,
    loadComponent,
    retryLoad,
    isLoading,
    isLoaded,
    isError,
    loadTime,
  };
};

/**
 * Hook for observing element intersection for lazy loading
 */
export const useLazyIntersectionObserver = (
  callback: () => void,
  options: {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
  } = {}
) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = useCallback((element: HTMLElement | null) => {
    if (elementRef.current && observerRef.current) {
      observerRef.current.unobserve(elementRef.current);
    }

    elementRef.current = element;

    if (element && !hasTriggered) {
      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              setIsIntersecting(entry.isIntersecting);
              
              if (entry.isIntersecting && (!triggerOnce || !hasTriggered)) {
                callback();
                if (triggerOnce) {
                  setHasTriggered(true);
                }
              }
            });
          },
          { threshold, rootMargin }
        );
      }

      observerRef.current.observe(element);
    }
  }, [callback, threshold, rootMargin, triggerOnce, hasTriggered]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { setRef, isIntersecting, hasTriggered };
};

/**
 * Hook for preloading components during idle time
 */
export const useIdlePreload = (
  componentTypes: ComponentType[],
  options: {
    delay?: number;
    maxConcurrent?: number;
  } = {}
) => {
  const { delay = 5000, maxConcurrent = 2 } = options;
  const [preloadedComponents, setPreloadedComponents] = useState<Set<ComponentType>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined' || !('requestIdleCallback' in window)) {
      return;
    }

    const idleCallback = window.requestIdleCallback(
      async () => {
        const chunkedComponents = [];
        for (let i = 0; i < componentTypes.length; i += maxConcurrent) {
          chunkedComponents.push(componentTypes.slice(i, i + maxConcurrent));
        }

        for (const chunk of chunkedComponents) {
          try {
            await Promise.all(
              chunk.map(async (componentType) => {
                if (!preloadedComponents.has(componentType)) {
                  await bundleOptimizationService.loadComponent(componentType, 'IDLE_PRELOAD');
                  setPreloadedComponents(prev => new Set([...prev, componentType]));
                }
              })
            );
          } catch (error) {
            console.warn('Failed to preload component chunk:', error);
          }
        }
      },
      { timeout: delay }
    );

    return () => {
      window.cancelIdleCallback(idleCallback);
    };
  }, [componentTypes, delay, maxConcurrent, preloadedComponents]);

  return { preloadedComponents };
};
