/**
 * HVAC Semantic Search State Management
 * "Pasja rodzi profesjonalizm" - Professional Semantic Search State
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Types over interfaces
 * - Proper Recoil state management
 * - Performance optimization with debounced search
 */

import { atom, selector, selectorFamily } from 'recoil';
import { createState } from 'twenty-ui/utilities';

// Types
export type SearchResultType = 
  | 'SERVICE_TICKET' 
  | 'CUSTOMER' 
  | 'EQUIPMENT' 
  | 'MAINTENANCE_PLAN' 
  | 'TECHNICIAN' 
  | 'KNOWLEDGE_BASE' 
  | 'MANUAL' 
  | 'PART';

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
  highlights: string[];
  url?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SearchFilters = {
  types: SearchResultType[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  minScore: number;
  maxResults: number;
  includeArchived: boolean;
  language: 'pl' | 'en';
};

export type SearchStats = {
  totalDocuments: number;
  lastSync: Date | null;
  totalSynced: number;
  errors: number;
  isRunning: boolean;
  weaviateHealth: boolean;
  hvacApiHealth: boolean;
  indexSize: number;
  averageQueryTime: number;
  popularQueries: Array<{ query: string; count: number }>;
};

export type SearchHistory = {
  id: string;
  query: string;
  filters: SearchFilters;
  resultCount: number;
  executionTime: number;
  timestamp: Date;
  userId: string;
};

export type SearchSuggestion = {
  text: string;
  type: 'query' | 'filter' | 'entity';
  score: number;
  metadata?: Record<string, unknown>;
};

// Atoms - Primitive state
export const hvacSemanticSearchQueryState = createState<string>({
  key: 'hvacSemanticSearchQueryState',
  defaultValue: '',
});

export const hvacSemanticSearchResultsState = createState<SearchResult[]>({
  key: 'hvacSemanticSearchResultsState',
  defaultValue: [],
});

export const hvacSemanticSearchLoadingState = createState<boolean>({
  key: 'hvacSemanticSearchLoadingState',
  defaultValue: false,
});

export const hvacSemanticSearchErrorState = createState<string | null>({
  key: 'hvacSemanticSearchErrorState',
  defaultValue: null,
});

export const hvacSemanticSearchFiltersState = createState<SearchFilters>({
  key: 'hvacSemanticSearchFiltersState',
  defaultValue: {
    types: [],
    dateRange: {
      start: null,
      end: null,
    },
    minScore: 0.5,
    maxResults: 20,
    includeArchived: false,
    language: 'pl',
  },
});

export const hvacSemanticSearchStatsState = createState<SearchStats | null>({
  key: 'hvacSemanticSearchStatsState',
  defaultValue: null,
});

export const hvacSemanticSearchHistoryState = createState<SearchHistory[]>({
  key: 'hvacSemanticSearchHistoryState',
  defaultValue: [],
});

export const hvacSemanticSearchSuggestionsState = createState<SearchSuggestion[]>({
  key: 'hvacSemanticSearchSuggestionsState',
  defaultValue: [],
});

export const hvacSemanticSearchUseWeaviateState = createState<boolean>({
  key: 'hvacSemanticSearchUseWeaviateState',
  defaultValue: true,
});

export const hvacSemanticSearchLastQueryTimeState = createState<Date | null>({
  key: 'hvacSemanticSearchLastQueryTimeState',
  defaultValue: null,
});

export const hvacSemanticSearchExecutionTimeState = createState<number>({
  key: 'hvacSemanticSearchExecutionTimeState',
  defaultValue: 0,
});

// Selectors - Derived state
export const hvacSemanticSearchIsValidQuerySelector = selector({
  key: 'hvacSemanticSearchIsValidQuerySelector',
  get: ({ get }) => {
    const query = get(hvacSemanticSearchQueryState);
    return query.trim().length >= 2; // Minimum 2 characters for valid search
  },
});

export const hvacSemanticSearchFilteredResultsSelector = selector({
  key: 'hvacSemanticSearchFilteredResultsSelector',
  get: ({ get }) => {
    const results = get(hvacSemanticSearchResultsState);
    const filters = get(hvacSemanticSearchFiltersState);
    
    return results.filter(result => {
      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(result.type)) {
        return false;
      }
      
      // Score filter
      if (result.score < filters.minScore) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange.start && new Date(result.createdAt) < filters.dateRange.start) {
        return false;
      }
      
      if (filters.dateRange.end && new Date(result.createdAt) > filters.dateRange.end) {
        return false;
      }
      
      return true;
    }).slice(0, filters.maxResults);
  },
});

export const hvacSemanticSearchResultsByTypeSelector = selector({
  key: 'hvacSemanticSearchResultsByTypeSelector',
  get: ({ get }) => {
    const results = get(hvacSemanticSearchFilteredResultsSelector);
    
    const resultsByType: Record<SearchResultType, SearchResult[]> = {
      SERVICE_TICKET: [],
      CUSTOMER: [],
      EQUIPMENT: [],
      MAINTENANCE_PLAN: [],
      TECHNICIAN: [],
      KNOWLEDGE_BASE: [],
      MANUAL: [],
      PART: [],
    };
    
    results.forEach(result => {
      resultsByType[result.type].push(result);
    });
    
    return resultsByType;
  },
});

export const hvacSemanticSearchStatsSelector = selector({
  key: 'hvacSemanticSearchStatsSelector',
  get: ({ get }) => {
    const results = get(hvacSemanticSearchResultsState);
    const executionTime = get(hvacSemanticSearchExecutionTimeState);
    const stats = get(hvacSemanticSearchStatsState);
    
    const resultStats = {
      totalResults: results.length,
      averageScore: results.length > 0 ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0,
      highScoreResults: results.filter(r => r.score > 0.8).length,
      mediumScoreResults: results.filter(r => r.score > 0.6 && r.score <= 0.8).length,
      lowScoreResults: results.filter(r => r.score <= 0.6).length,
      executionTime,
      resultsByType: {} as Record<SearchResultType, number>,
    };
    
    // Count results by type
    Object.values(SearchResultType).forEach(type => {
      resultStats.resultsByType[type as SearchResultType] = results.filter(r => r.type === type).length;
    });
    
    return {
      ...resultStats,
      systemStats: stats,
    };
  },
});

export const hvacSemanticSearchRecentQueriesSelector = selector({
  key: 'hvacSemanticSearchRecentQueriesSelector',
  get: ({ get }) => {
    const history = get(hvacSemanticSearchHistoryState);
    
    // Get last 10 unique queries
    const recentQueries = history
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
      .reduce((unique: SearchHistory[], current) => {
        if (!unique.find(item => item.query === current.query)) {
          unique.push(current);
        }
        return unique;
      }, [])
      .slice(0, 10);
    
    return recentQueries;
  },
});

export const hvacSemanticSearchPopularQueriesSelector = selector({
  key: 'hvacSemanticSearchPopularQueriesSelector',
  get: ({ get }) => {
    const history = get(hvacSemanticSearchHistoryState);
    
    // Count query frequency
    const queryCount: Record<string, number> = {};
    history.forEach(item => {
      queryCount[item.query] = (queryCount[item.query] || 0) + 1;
    });
    
    // Sort by frequency and return top 10
    return Object.entries(queryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
  },
});

export const hvacSemanticSearchHealthStatusSelector = selector({
  key: 'hvacSemanticSearchHealthStatusSelector',
  get: ({ get }) => {
    const stats = get(hvacSemanticSearchStatsState);
    const error = get(hvacSemanticSearchErrorState);
    
    if (error) {
      return {
        status: 'unhealthy' as const,
        message: error,
        details: { error },
      };
    }
    
    if (!stats) {
      return {
        status: 'unknown' as const,
        message: 'Brak danych o stanie systemu',
        details: {},
      };
    }
    
    const isHealthy = stats.weaviateHealth && stats.hvacApiHealth && stats.errors < 10;
    const isDegraded = (stats.weaviateHealth || stats.hvacApiHealth) && stats.errors < 50;
    
    if (isHealthy) {
      return {
        status: 'healthy' as const,
        message: 'System działa prawidłowo',
        details: {
          totalDocuments: stats.totalDocuments,
          lastSync: stats.lastSync,
          averageQueryTime: stats.averageQueryTime,
        },
      };
    }
    
    if (isDegraded) {
      return {
        status: 'degraded' as const,
        message: 'System działa z ograniczeniami',
        details: {
          weaviateHealth: stats.weaviateHealth,
          hvacApiHealth: stats.hvacApiHealth,
          errors: stats.errors,
        },
      };
    }
    
    return {
      status: 'unhealthy' as const,
      message: 'System nie działa prawidłowo',
      details: {
        weaviateHealth: stats.weaviateHealth,
        hvacApiHealth: stats.hvacApiHealth,
        errors: stats.errors,
      },
    };
  },
});

// Selector families for dynamic queries
export const hvacSemanticSearchSuggestionsByTypeSelector = selectorFamily({
  key: 'hvacSemanticSearchSuggestionsByTypeSelector',
  get: (type: SearchSuggestion['type']) => ({ get }) => {
    const suggestions = get(hvacSemanticSearchSuggestionsState);
    return suggestions.filter(suggestion => suggestion.type === type);
  },
});

export const hvacSemanticSearchResultByIdSelector = selectorFamily({
  key: 'hvacSemanticSearchResultByIdSelector',
  get: (resultId: string) => ({ get }) => {
    const results = get(hvacSemanticSearchResultsState);
    return results.find(result => result.id === resultId) || null;
  },
});
