/**
 * HVAC Core Constants
 * "Pasja rodzi profesjonalizm" - Core system constants
 */

// Performance constants
export const HVAC_PERFORMANCE = {
  DEBOUNCE_DELAY: 300, // 300ms debounced search performance
  BUNDLE_SIZE_LIMIT: 4.7 * 1024 * 1024, // 4.7MB Twenty CRM limit
  CORE_PACKAGE_LIMIT: 500 * 1024, // 500KB for hvac-core
  SEARCH_MIN_CHARS: 2,
  CACHE_TTL: 300000, // 5 minutes
} as const;

// Polish market constants
export const POLISH_MARKET = {
  NIP_LENGTH: 10,
  REGON_LENGTH: 9,
  KRS_LENGTH: 10,
  ENERGY_PROVIDERS: ['PGE', 'Tauron', 'Enea', 'Energa'] as const,
  HVAC_MANUFACTURERS: ['Vaillant', 'Viessmann', 'Bosch', 'Junkers'] as const,
} as const;

// HVAC system constants
export const HVAC_SYSTEM = {
  VERSION: '0.1.0',
  PHILOSOPHY: 'Pasja rodzi profesjonalizm',
  BUNDLE_OPTIMIZATION: true,
  LAZY_LOADING: true,
  PERFORMANCE_MONITORING: true,
} as const;
