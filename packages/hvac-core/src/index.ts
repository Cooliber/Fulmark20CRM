/**
 * HVAC Core Package
 * "Pasja rodzi profesjonalizm" - Podstawowe komponenty systemu HVAC
 *
 * Ten pakiet zawiera podstawowe typy, hooks, utils i states
 * dla całego systemu HVAC. Maksymalny rozmiar: 500KB.
 */

// Types
export * from './types/unified';
export * from './types/hvac-audio.types';
export * from './types/hvac-polish-compliance.types';

// States
export * from './states';

// Core Hooks (lightweight only)
export { useDebounce } from './hooks/useDebounce';

// Utils
export * from './utils/constants';

// Core constants
export const HVAC_CORE_VERSION = '0.1.0';
export const HVAC_BUNDLE_LIMIT = 500 * 1024; // 500KB limit for core package

// Package info for bundle optimization
export const HVAC_CORE_INFO = {
  name: 'hvac-core',
  version: HVAC_CORE_VERSION,
  description: 'Podstawowe komponenty systemu HVAC',
  bundleLimit: HVAC_BUNDLE_LIMIT,
  philosophy: 'Pasja rodzi profesjonalizm',
  dependencies: ['react', 'recoil', 'twenty-ui', 'twenty-shared'],
  estimatedSize: '~300KB'
} as const;
