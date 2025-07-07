/**
 * HVAC Search Components Index
 * "Pasja rodzi profesjonalizm" - Professional Search Components
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Modular component architecture
 * - Max 150 lines per component
 */

// Search Components
export { SearchHeader } from './SearchHeader';
export { SearchStats } from './SearchStats';
export { SearchResults, type SearchResult } from './SearchResults';

// Component display names for debugging
export const SEARCH_COMPONENT_NAMES = {
  HEADER: 'SearchHeader',
  STATS: 'SearchStats',
  RESULTS: 'SearchResults',
} as const;
