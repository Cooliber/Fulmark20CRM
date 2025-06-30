/**
 * HVAC State Management Index
 * "Pasja rodzi profesjonalizm" - Professional HVAC CRM State Management
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Organized state exports
 * - Performance optimization with proper state structure
 */

// Dashboard State
export {
  // Types
  type HvacDashboardTab,
  type HvacDashboardStats,
  type HvacDashboardFilters,
  type HvacDashboardPreferences,
  
  // Atoms
  hvacDashboardActiveTabState,
  hvacDashboardStatsState,
  hvacDashboardLoadingState,
  hvacDashboardErrorState,
  hvacDashboardFiltersState,
  hvacDashboardPreferencesState,
  hvacDashboardLastRefreshState,
  
  // Selectors
  hvacDashboardIsHealthySelector,
  hvacDashboardCriticalAlertsSelector,
  hvacDashboardKpiSummarySelector,
  hvacDashboardActiveFiltersCountSelector,
  hvacDashboardShouldAutoRefreshSelector,
} from './hvacDashboardState';

// Service Ticket State
export {
  // Types
  type ServiceTicketStatus,
  type ServiceTicketPriority,
  type ServiceTicketType,
  type ServiceTicket,
  type ServiceTicketFilters,
  type ServiceTicketSortOptions,
  
  // Atoms
  hvacServiceTicketsState,
  hvacServiceTicketsLoadingState,
  hvacServiceTicketsErrorState,
  hvacServiceTicketFiltersState,
  hvacServiceTicketSortState,
  hvacSelectedServiceTicketIdState,
  hvacServiceTicketPaginationState,
  
  // Atom Families
  hvacServiceTicketByIdState,
  hvacServiceTicketNotesState,
  hvacServiceTicketAttachmentsState,
  
  // Selectors
  hvacFilteredServiceTicketsSelector,
  hvacServiceTicketStatsSelector,
  hvacSelectedServiceTicketSelector,
  
  // Selector Families
  hvacServiceTicketWithDetailsSelector,
  hvacServiceTicketsByStatusSelector,
  hvacServiceTicketsByTechnicianSelector,
} from './hvacServiceTicketState';

// Semantic Search State
export {
  // Types
  type SearchResultType,
  type SearchResult,
  type SearchFilters,
  type SearchStats,
  type SearchHistory,
  type SearchSuggestion,
  
  // Atoms
  hvacSemanticSearchQueryState,
  hvacSemanticSearchResultsState,
  hvacSemanticSearchLoadingState,
  hvacSemanticSearchErrorState,
  hvacSemanticSearchFiltersState,
  hvacSemanticSearchStatsState,
  hvacSemanticSearchHistoryState,
  hvacSemanticSearchSuggestionsState,
  hvacSemanticSearchUseWeaviateState,
  hvacSemanticSearchLastQueryTimeState,
  hvacSemanticSearchExecutionTimeState,
  
  // Selectors
  hvacSemanticSearchIsValidQuerySelector,
  hvacSemanticSearchFilteredResultsSelector,
  hvacSemanticSearchResultsByTypeSelector,
  hvacSemanticSearchStatsSelector,
  hvacSemanticSearchRecentQueriesSelector,
  hvacSemanticSearchPopularQueriesSelector,
  hvacSemanticSearchHealthStatusSelector,
  
  // Selector Families
  hvacSemanticSearchSuggestionsByTypeSelector,
  hvacSemanticSearchResultByIdSelector,
} from './hvacSemanticSearchState';

// Dispatch State
export {
  // Types
  type DispatchStatus,
  type TechnicianStatus,
  type DispatchPriority,
  type DispatchJob,
  type Technician,
  type DispatchMetrics,
  
  // Atoms
  hvacDispatchJobsState,
  hvacTechniciansState,
  hvacDispatchLoadingState,
  hvacDispatchErrorState,
  hvacDispatchMetricsState,
  hvacSelectedDispatchJobIdState,
  hvacSelectedTechnicianIdState,
  hvacDispatchFiltersState,
  hvacDispatchRealTimeUpdatesState,
  hvacDispatchLastUpdateState,
  
  // Atom Families
  hvacDispatchJobByIdState,
  hvacTechnicianByIdState,
  hvacTechnicianLocationState,
  
  // Selectors
  hvacPendingDispatchJobsSelector,
  hvacActiveDispatchJobsSelector,
  hvacEmergencyDispatchJobsSelector,
  hvacAvailableTechniciansSelector,
  hvacBusyTechniciansSelector,
  hvacFilteredDispatchJobsSelector,
  hvacDispatchEfficiencySelector,
  hvacSelectedDispatchJobSelector,
  hvacSelectedTechnicianSelector,
  
  // Selector Families
  hvacDispatchJobsByStatusSelector,
  hvacDispatchJobsByTechnicianSelector,
  hvacTechniciansByStatusSelector,
  hvacTechniciansBySkillSelector,
} from './hvacDispatchState';

// State Management Utilities
export const HVAC_STATE_KEYS = {
  DASHBOARD: {
    ACTIVE_TAB: 'hvacDashboardActiveTabState',
    STATS: 'hvacDashboardStatsState',
    LOADING: 'hvacDashboardLoadingState',
    ERROR: 'hvacDashboardErrorState',
    FILTERS: 'hvacDashboardFiltersState',
    PREFERENCES: 'hvacDashboardPreferencesState',
    LAST_REFRESH: 'hvacDashboardLastRefreshState',
  },
  SERVICE_TICKETS: {
    TICKETS: 'hvacServiceTicketsState',
    LOADING: 'hvacServiceTicketsLoadingState',
    ERROR: 'hvacServiceTicketsErrorState',
    FILTERS: 'hvacServiceTicketFiltersState',
    SORT: 'hvacServiceTicketSortState',
    SELECTED: 'hvacSelectedServiceTicketIdState',
    PAGINATION: 'hvacServiceTicketPaginationState',
  },
  SEMANTIC_SEARCH: {
    QUERY: 'hvacSemanticSearchQueryState',
    RESULTS: 'hvacSemanticSearchResultsState',
    LOADING: 'hvacSemanticSearchLoadingState',
    ERROR: 'hvacSemanticSearchErrorState',
    FILTERS: 'hvacSemanticSearchFiltersState',
    STATS: 'hvacSemanticSearchStatsState',
    HISTORY: 'hvacSemanticSearchHistoryState',
    SUGGESTIONS: 'hvacSemanticSearchSuggestionsState',
    USE_WEAVIATE: 'hvacSemanticSearchUseWeaviateState',
  },
  DISPATCH: {
    JOBS: 'hvacDispatchJobsState',
    TECHNICIANS: 'hvacTechniciansState',
    LOADING: 'hvacDispatchLoadingState',
    ERROR: 'hvacDispatchErrorState',
    METRICS: 'hvacDispatchMetricsState',
    SELECTED_JOB: 'hvacSelectedDispatchJobIdState',
    SELECTED_TECHNICIAN: 'hvacSelectedTechnicianIdState',
    FILTERS: 'hvacDispatchFiltersState',
    REAL_TIME: 'hvacDispatchRealTimeUpdatesState',
    LAST_UPDATE: 'hvacDispatchLastUpdateState',
  },
} as const;

// Performance optimization constants
export const HVAC_STATE_PERFORMANCE = {
  DEBOUNCE_DELAYS: {
    SEARCH_QUERY: 300, // 300ms for search input
    FILTER_CHANGE: 150, // 150ms for filter changes
    LOCATION_UPDATE: 1000, // 1s for location updates
  },
  CACHE_DURATIONS: {
    DASHBOARD_STATS: 30000, // 30s
    SERVICE_TICKETS: 60000, // 1min
    SEARCH_RESULTS: 300000, // 5min
    TECHNICIAN_STATUS: 15000, // 15s
  },
  BATCH_SIZES: {
    SERVICE_TICKETS: 20,
    SEARCH_RESULTS: 20,
    DISPATCH_JOBS: 50,
    TECHNICIANS: 100,
  },
} as const;

// State validation helpers
export const validateHvacState = {
  dashboard: (state: unknown): state is HvacDashboardStats => {
    return typeof state === 'object' && 
           state !== null && 
           'totalTickets' in state && 
           'activeTickets' in state;
  },
  
  serviceTicket: (state: unknown): state is ServiceTicket => {
    return typeof state === 'object' && 
           state !== null && 
           'id' in state && 
           'ticketNumber' in state && 
           'status' in state;
  },
  
  searchResult: (state: unknown): state is SearchResult => {
    return typeof state === 'object' && 
           state !== null && 
           'id' in state && 
           'type' in state && 
           'score' in state;
  },
  
  dispatchJob: (state: unknown): state is DispatchJob => {
    return typeof state === 'object' && 
           state !== null && 
           'id' in state && 
           'ticketId' in state && 
           'status' in state;
  },
  
  technician: (state: unknown): state is Technician => {
    return typeof state === 'object' && 
           state !== null && 
           'id' in state && 
           'name' in state && 
           'status' in state;
  },
};

// State reset utilities
export const resetHvacState = {
  dashboard: () => ({
    activeTab: 'overview' as HvacDashboardTab,
    stats: null,
    loading: false,
    error: null,
  }),
  
  serviceTickets: () => ({
    tickets: [],
    loading: false,
    error: null,
    selectedId: null,
  }),
  
  semanticSearch: () => ({
    query: '',
    results: [],
    loading: false,
    error: null,
  }),
  
  dispatch: () => ({
    jobs: [],
    technicians: [],
    loading: false,
    error: null,
    selectedJobId: null,
    selectedTechnicianId: null,
  }),
};
