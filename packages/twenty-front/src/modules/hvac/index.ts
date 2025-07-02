// HVAC Module Exports - REFACTORED TO MICRO-PACKAGES
// "Pasja rodzi profesjonalizm" - Fulmark HVAC Professional CRM
//
// MAJOR REFACTOR: Split into micro-packages for bundle optimization
// - hvac-core: Types, hooks, utils, states (max 500KB)
// - hvac-dashboard: Dashboard components with lazy loading
// - hvac-analytics: Chart.js/D3.js components (lazy loaded)
// - hvac-equipment: Equipment management components

// TEMPORARY: Direct imports until packages are properly configured
// TODO: Replace with proper package imports after Nx configuration

// Core functionality - Temporarily using relative imports
export * from '../../hvac-core/src';

// Remaining components that haven't been moved yet
export { HvacCustomerList } from './components/HvacCustomerList';
export { HvacSemanticSearch } from './components/HvacSemanticSearch';
export { HvacServiceTicketList } from './components/HvacServiceTicketList';

// Lazy loading components
export { HvacLazyComponents } from './components/HvacLazyComponents';

// Enhanced Customer 360 Components
export { Customer360CommunicationTabEnhanced } from './components/customer360/Customer360CommunicationTabEnhanced';

// REMOVED: Audio Transcription Components - Heavy dependency (~200KB)
// Moved to lazy loading to reduce main bundle size
// export * from './components/audio-transcription';

// REMOVED: Polish Compliance Components - Heavy dependency (~150KB)
// Moved to lazy loading to reduce main bundle size
// export * from './components/polish-compliance';

// REMOVED: Lazy Components Static Exports - Preventing Code Splitting
// These components should only be imported dynamically to maintain bundle optimization
// Static exports prevent Vite from properly splitting these into separate chunks
// Use dynamic imports instead: const LazyComponent = lazy(() => import('./components/lazy/LazyComponent'))
// export {
//     LazyAnalyticsDashboard, LazyCustomer360, LazyKanbanBoard, LazyMaintenanceDashboard, preloadHeavyComponents
// } from './components/lazy';

// REMOVED: Bundle Optimization Services - Heavy dependency (~200KB)
// Moved to lazy loading to reduce main bundle size
// export {
//     BUNDLE_SIZE_ESTIMATES, BundleOptimizationService, bundleOptimizationService, type BundleMetrics, type ComponentType,
//     type LoadingStrategy, type OptimizationConfig
// } from './services/BundleOptimizationService';

// Advanced Lazy Loading Hooks
export {
    useIdlePreload, useLazyComponent,
    useLazyIntersectionObserver, type LazyComponentState,
    type UseLazyComponentOptions,
    type UseLazyComponentReturn
} from './hooks/useLazyComponent';

// REMOVED: Performance Monitoring Services - Heavy dependency (~100KB)
// Moved to lazy loading to reduce main bundle size
// export {
//     PERFORMANCE_THRESHOLDS as CORE_WEB_VITALS_THRESHOLDS, PerformanceMonitoringService, performanceMonitoringService, type ComponentPerformanceMetric, type CoreWebVitalMetric,
//     type PerformanceMetric,
//     type SearchPerformanceMetric
// } from './services/PerformanceMonitoringService';

// Performance Monitoring Components - Legacy (use HvacPerformanceDashboard instead)

// Search Components - Refactored for cursor rules compliance
export { SearchHeader, SearchResults, SearchStats } from './components/search';

// Error Handling and Fault Tolerance
export {
    useFaultTolerance,
    useFaultToleranceHealth,
    useFaultTolerantApi,
    useFaultTolerantSearch,
    type FaultToleranceConfig,
    type FaultToleranceResult,
    type ServiceType
} from './hooks/useFaultTolerance';
export {
    CircuitBreakerService,
    hvacApiCircuitBreaker, searchCircuitBreaker, type CircuitBreakerConfig,
    type CircuitBreakerMetrics, type CircuitBreakerState
} from './services/CircuitBreakerService';
export {
    RetryService, apiRetryService, criticalRetryService, networkRetryService, searchRetryService, type RetryConfig,
    type RetryResult, type RetryStrategy
} from './services/RetryService';

// REMOVED: Kanban Components - Heavy dependency (~200KB)
// Moved to lazy loading to reduce main bundle size
// export { CreateCardDialog } from './components/kanban/CreateCardDialog';
// export { KanbanBoard } from './components/kanban/KanbanBoard';
// export { KanbanCard } from './components/kanban/KanbanCard';
// export { KanbanColumn } from './components/kanban/KanbanColumn';

// REMOVED: Alias for KanbanColumn to match import expectations
// export { KanbanColumn as KanbanColumnComponent } from './components/kanban/KanbanColumn';

// Analytics Components - Use lazy versions for bundle optimization
// export { AdvancedAnalyticsDashboard } from './components/analytics/AdvancedAnalyticsDashboard'; // Replaced with LazyAnalyticsDashboard

// REMOVED: Service Planner Components - Heavy dependency (~150KB)
// Moved to lazy loading to reduce main bundle size
// export {
//     HvacDispatchPanel,
//     HvacRouteOptimizer, HvacSchedulingCalendar, HvacSchedulingDashboard, HvacTechnicianTracker
// } from './components/scheduling';

// REMOVED: Maintenance Components - Heavy dependency (~120KB)
// Moved to lazy loading to reduce main bundle size
// export {
//     HvacComplianceTracker,
//     HvacMaintenanceAnalytics, HvacMaintenanceCalendar,
//     HvacMaintenanceChecklist
// } from './components/maintenance';

// REMOVED: Equipment Management Components - Heavy dependency (~150KB)
// Moved to lazy loading to reduce main bundle size
// export {
//     HvacEquipmentManagement
// } from './components/equipment/HvacEquipmentManagement';

// REMOVED: Mobile Components - Heavy dependency (~200KB)
// Moved to lazy loading to reduce main bundle size
// export {
//     HvacMobileDashboard,
//     HvacMobileJobCard, HvacMobileNavigation, HvacMobileWorkOrder
// } from './components/mobile';

// Navigation Components
export {
    HvacNavigationSection,
    HvacObjectsNavigationSection
} from './components/navigation';

// Error Handling Components - Unified exports below

// Customer 360 Components - Use lazy versions for bundle optimization
// export {
//     Customer360AnalyticsTab, Customer360CommunicationTab, Customer360Container, Customer360Content, Customer360EquipmentTab, Customer360ErrorState, Customer360Header,
//     Customer360KPICards, Customer360LoadingState, Customer360ProfileTab
// } from './components/customer360';

// REMOVED: Enhanced API Integration Services - Heavy dependency (~150KB)
// Moved to lazy loading to reduce main bundle size
// export {
//     HvacApiIntegrationService,
//     hvacApiIntegrationService,
//     type HvacApiConfig,
//     type HvacApiResponse,
//     type HvacHealthStatus
// } from './services/HvacApiIntegrationService';

// Enhanced Authentication Services
export {
    HvacAuthService, HvacPermission, HvacUserRole, hvacAuthService, type HvacAuthConfig, type HvacAuthToken,
    type HvacUser,
    type HvacUserProfile
} from './services/HvacAuthService';

// Services
export {
    CompanySize, ContactMethod, CustomerAPIService, CustomerStatus,
    CustomerType, PaymentMethod, RiskLevel, customerAPIService, type Contract, type Customer, type Customer360Data, type CustomerAddress, type CustomerInsights, type EmergencyContact, type Equipment,
    type ServiceTicket
} from './services/CustomerAPIService';

export {
    PolishBusinessValidationService, VATCategory, polishBusinessValidationService, type NIPValidationResult,
    type REGONValidationResult,
    type VATCalculation, type ValidationResult
} from './services/PolishBusinessValidationService';

export {
    EquipmentAPIService, equipmentAPIService, type CreateEquipmentRequest, type EquipmentFilter, type Equipment as HVACEquipment,
    type MaintenanceRecord, type ScheduleMaintenanceRequest, type UpdateEquipmentRequest
} from './services/EquipmentAPIService';

export {
    CommunicationAPIService, communicationAPIService, type AIInsights, type Attachment, type Communication, type CommunicationFilter, type CommunicationStats, type CreateCommunicationRequest, type Participant
} from './services/CommunicationAPIService';

export {
    CustomerDataFlowService, customerDataFlowService, type CustomerDataFlow, type CustomerFlowMetadata, type CustomerSource, type CustomerStage, type FlowAnalytics, type FlowStatus, type HVACRequirement, type Priority
} from './services/CustomerDataFlowService';

export {
    QuoteManagementService, quoteManagementService, type HVACCategory, type Quote, type QuoteAnalytics, type QuoteItem, type PaymentMethod as QuotePaymentMethod, type QuoteStatus, type QuoteTemplate
} from './services/QuoteManagementService';

export {
    KanbanFlowService, kanbanFlowService, type BoardType, type CardStatus, type CardType, type KanbanAnalytics, type KanbanBoard as KanbanBoardType, type KanbanCard as KanbanCardType, type KanbanColumn as KanbanColumnType
} from './services/KanbanFlowService';

export {
    DataPipelineService, dataPipelineService, type DataPipeline, type PipelineAnalytics, type PipelineStatus, type PipelineType, type RealTimeSyncConfig
} from './services/DataPipelineService';

// Enhanced GraphQL Integration
export {
    useCreateHvacCustomer, useCreateHvacServiceTicket, useHvacCustomer, useHvacCustomers, useHvacDashboardAnalytics, useHvacEquipment, useHvacGraphQL, useHvacSemanticSearch, useHvacServiceTicket, useHvacServiceTickets, useHvacSystemHealth, useUpdateHvacCustomer, useUpdateHvacServiceTicket
} from './hooks/useHvacGraphQL';

// Enhanced Authentication Integration
export {
    useHvacAuth,
    useHvacPermissions,
    useHvacRoleAccess
} from './hooks/useHvacAuth';

// Enhanced Protection Components
export {
    HvacProtectedRoute, useHvacConditionalRender, withHvacProtection, type HvacProtectedRouteProps
} from './components/HvacProtectedRoute';

// REMOVED: Enhanced Bundle Optimization - Heavy dependency (~100KB)
// Moved to lazy loading to reduce main bundle size
// export {
//     HvacBundleOptimizer,
//     hvacBundleOptimizer,
//     type BundleAnalytics, type LazyLoadConfig, type ModuleSize,
//     type OptimizationSuggestion
// } from './services/HvacBundleOptimizer';

// Enhanced Lazy Loading Components
export {
    HvacErrorFallback, HvacLoadingSpinner, LazyHvacAnalytics, LazyHvacCustomers, LazyHvacEquipment, LazyHvacFinances, LazyHvacInspections, LazyHvacInventory, LazyHvacQuotes, LazyHvacServiceTickets, LazyHvacTechnicians, createLazyComponent, useHvacPreloader, type LazyComponentProps,
    type LazyLoadError
} from './components/HvacLazyComponents';

// GraphQL Types
export type {
    CreateHvacCustomerInput, CreateHvacServiceTicketInput, DateRangeInput, HvacCustomer, HvacCustomerFilter,
    HvacCustomerSort, HvacDashboardAnalytics, HvacEquipment, HvacSemanticSearchResult, PaginationInput, UpdateHvacCustomerInput, UpdateHvacServiceTicketInput
} from './graphql/hvac-types';

// Audio Transcription Types - NEW
export type * from './types/hvac-audio.types';

// Polish Compliance Types - NEW
export type * from './types/hvac-polish-compliance.types';

// Hooks
export {
    useCustomer360,
    useCustomerList
} from './hooks/useCustomer360';

export {
    useCustomerValidation
} from './hooks/useCustomerValidation';

export {
    useDebounce,
    useDebounceSearch
} from './hooks/useDebounce';

export {
    useServerSideFilter
} from './hooks/useServerSideFilter';

export {
    useEquipmentManagement
} from './hooks/useEquipmentManagement';

export {
    useCommunicationTimeline
} from './hooks/useCommunicationTimeline';

export {
    useDataLoader
} from './hooks/useDataLoader';

export {
    useCustomerDataFlow
} from './hooks/useCustomerDataFlow';

export {
    useQuoteManagement
} from './hooks/useQuoteManagement';

export {
    useKanbanFlow
} from './hooks/useKanbanFlow';

export {
    useDataPipeline
} from './hooks/useDataPipeline';

// Service Planner Hooks
export {
    useHvacScheduling
} from './hooks/useHvacScheduling';

export {
    useHvacDispatch
} from './hooks/useHvacDispatch';

export {
    useHvacTechnicians
} from './hooks/useHvacTechnicians';

export {
    useHvacMaintenance
} from './hooks/useHvacMaintenance';

export {
    useHvacMobileTechnician
} from './hooks/useHvacMobileTechnician';

// Audio Transcription Hooks - NEW
export {
    useHvacAudioTranscription
} from './hooks/useHvacAudioTranscription';

// Polish Compliance Hooks - NEW
export {
    useHvacPolishCompliance
} from './hooks/useHvacPolishCompliance';

// Dashboard Components - Use lazy versions for bundle optimization
// export {
//     HvacDashboardHeader, HvacDashboardOverview,
//     HvacDashboardPlaceholder, HvacDashboardStats,
//     HvacDashboardWelcome, type TabType
// } from './components/dashboard';

// Error Handling & Monitoring
export { HvacErrorBoundary } from './components/error/HvacErrorBoundary';
export type { HvacErrorBoundaryProps } from './components/error/HvacErrorBoundary';
export { HVACErrorBoundary, useHVACErrorReporting, withHVACErrorBoundary } from './components/HVACErrorBoundary';

// Fault Tolerance Components
export {
    HVACNetworkMonitor, HVACRetryWrapper,
    HVACSuspenseWrapper
} from './components/fault-tolerance';

// Performance Monitoring & Optimization
export {
    PERFORMANCE_THRESHOLDS, useHVACPerformanceMonitoring
} from './hooks/useHVACPerformanceMonitoring';

export {
    useHVACDebouncedPerformance
} from './hooks/useHVACDebouncedPerformance';

// Performance Components
export { HvacPerformanceDashboard, PerformanceMonitor } from './components/performance';

export { HvacPerformanceOptimizer, hvacPerformanceOptimizer } from './services/HvacPerformanceOptimizer';

export type {
    ComponentMetrics,
    OptimizationConfig as HvacOptimizationConfig,
    PerformanceMetrics
} from './services/HvacPerformanceOptimizer';

// Sentry Configuration & Utilities
export {
    HVACErrorContexts, clearHVACUserSession, initializeHVACSentry, isHVACSentryInitialized, trackHVACAPICall, trackHVACNavigation, trackHVACUserAction, trackPolishBusinessOperation, updateHVACUserContext
} from './utils/sentry-init';

export {
    HVACErrorContexts as ErrorContexts,
    PolishBusinessTags, addHVACBreadcrumb, clearHVACUserContext, reportHVACError,
    reportHVACMessage,
    reportPolishBusinessError, setHVACUserContext, startHVACTransaction
} from './config/sentry.config';

// Types
export type HvacServiceTicket = {
  id: string;
  ticketNumber: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  serviceType: string;
  customerId?: string;
  technicianId?: string;
  scheduledDate?: string;
  estimatedCost?: number;
  createdAt: string;
  updatedAt: string;
};

export type HvacSearchResult = {
  id: string;
  type: string;
  title: string;
  description: string;
  relevanceScore: number;
  metadata: string;
};

// Error handling types
export type { HVACErrorContext } from './config/sentry.config';

// Unified Types - Canonical type definitions
export type {
    ActiveDispatch, ChecklistItem, RouteOptimization, ScheduledJob, Technician, TechnicianJob,
    Communication as UnifiedCommunication,
    Customer as UnifiedCustomer, CustomerAddress as UnifiedCustomerAddress, Equipment as UnifiedEquipment, MaintenanceRecord as UnifiedMaintenanceRecord
} from './types/unified';

export type HvacSearchFilters = {
  type?: string;
  customerId?: string;
  equipmentId?: string;
  startDate?: Date;
  endDate?: Date;
};

// Constants
export const HVAC_SERVICE_TYPES = {
  INSTALLATION: 'Instalacja',
  MAINTENANCE: 'Konserwacja',
  REPAIR: 'Naprawa',
  INSPECTION: 'Przegląd',
  EMERGENCY: 'Awaria',
  CONSULTATION: 'Konsultacja',
} as const;

export const HVAC_PRIORITIES = {
  LOW: 'Niski',
  MEDIUM: 'Średni',
  HIGH: 'Wysoki',
  CRITICAL: 'Krytyczny',
  EMERGENCY: 'Awaria',
} as const;

export const HVAC_STATUSES = {
  OPEN: 'Otwarte',
  SCHEDULED: 'Zaplanowane',
  IN_PROGRESS: 'W trakcie',
  ON_HOLD: 'Wstrzymane',
  COMPLETED: 'Zakończone',
  CANCELLED: 'Anulowane',
} as const;
