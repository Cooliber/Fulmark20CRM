/**
 * HVAC Analytics Package
 * "Pasja rodzi profesjonalizm" - Komponenty analityczne systemu HVAC
 * 
 * Ten pakiet zawiera komponenty analityczne z Chart.js i D3.js
 * Ładowane dynamicznie dla optymalizacji bundle size.
 */

// Analytics Components - Lazy loaded by default
export { AdvancedAnalyticsDashboard } from './components/AdvancedAnalyticsDashboard';

// Services
export { HvacAnalyticsService } from './services/HvacAnalyticsService';

// Analytics-specific utilities
export const HVAC_ANALYTICS_INFO = {
  name: 'hvac-analytics',
  version: '0.1.0',
  description: 'Komponenty analityczne systemu HVAC',
  estimatedSize: '~1.2MB',
  heavyDependencies: ['chart.js', 'd3'],
  loadingStrategy: 'dynamic',
  bundleOptimization: {
    lazyLoading: true,
    codesplitting: true,
    optionalDependencies: true
  },
  features: [
    'Advanced charts',
    'Data visualization',
    'Performance analytics',
    'Equipment efficiency tracking'
  ]
} as const;

// Dynamic import helper for heavy dependencies
export const loadAnalyticsComponents = async () => {
  try {
    // Only load when actually needed
    const [chartJs, d3] = await Promise.all([
      import('chart.js').catch(() => null),
      import('d3').catch(() => null)
    ]);
    
    return {
      chartJs: chartJs?.default || null,
      d3: d3?.default || null,
      available: !!(chartJs || d3)
    };
  } catch (error) {
    console.warn('Failed to load analytics dependencies:', error);
    return { chartJs: null, d3: null, available: false };
  }
};
