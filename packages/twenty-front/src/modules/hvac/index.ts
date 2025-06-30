// HVAC Module Exports
// "Pasja rodzi profesjonalizm" - Fulmark HVAC Professional CRM

// State Management - Following Twenty CRM cursor rules
export * from './states';

// Components
export { HvacDashboard } from './components/HvacDashboard';
export { HvacSemanticSearch } from './components/HvacSemanticSearch';
export { HvacServiceTicketList } from './components/HvacServiceTicketList';

// Enhanced Customer 360 Components
export { Customer360CommunicationTabEnhanced } from './components/customer360/Customer360CommunicationTabEnhanced';

// Lazy Loading Components - Bundle Size Optimization
export {
    HvacLazyCalendar, HvacLazyChart, HvacLazyDataTable, LazyAnalyticsDashboard, LazyCustomer360,
    LazyCustomer360CommunicationTab,
    LazyCustomer360EquipmentTab, LazyKanbanBoard,
    LazyMaintenanceDashboard, PRIMEREACT_BUNDLE_SAVINGS, createLoadingTracker, preloadCriticalPrimeReactComponents, preloadHeavyComponents
} from './components/lazy';

// Bundle Optimization Services
export {
    BUNDLE_SIZE_ESTIMATES, BundleOptimizationService, bundleOptimizationService, type BundleMetrics, type ComponentType,
    type LoadingStrategy, type OptimizationConfig
} from './services/BundleOptimizationService';

// Advanced Lazy Loading Hooks
export {
    useIdlePreload, useLazyComponent,
    useLazyIntersectionObserver, type LazyComponentState,
    type UseLazyComponentOptions,
    type UseLazyComponentReturn
} from './hooks/useLazyComponent';

// Performance Monitoring Services
export {
    PERFORMANCE_THRESHOLDS as CORE_WEB_VITALS_THRESHOLDS, PerformanceMonitoringService, performanceMonitoringService, type ComponentPerformanceMetric, type CoreWebVitalMetric,
    type PerformanceMetric,
    type SearchPerformanceMetric
} from './services/PerformanceMonitoringService';

// Performance Monitoring Components
export { PerformanceMonitor } from './components/monitoring/PerformanceMonitor';

// Search Components - Refactored for cursor rules compliance
export { SearchHeader, SearchResults, SearchStats } from './components/search';

// Error Handling and Fault Tolerance
export { HvacErrorBoundary } from './components/error-handling';
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
    hvacApiCircuitBreaker, searchCircuitBreaker, weaviateCircuitBreaker, type CircuitBreakerConfig,
    type CircuitBreakerMetrics, type CircuitBreakerState
} from './services/CircuitBreakerService';
export {
    RetryService, apiRetryService, criticalRetryService, networkRetryService, searchRetryService, type RetryConfig,
    type RetryResult, type RetryStrategy
} from './services/RetryService';

// Kanban Components - Use lazy versions for bundle optimization
export { CreateCardDialog } from './components/kanban/CreateCardDialog';
export { KanbanBoard } from './components/kanban/KanbanBoard';
export { KanbanCard } from './components/kanban/KanbanCard';
export { KanbanColumn } from './components/kanban/KanbanColumn';

// Alias for KanbanColumn to match import expectations
export { KanbanColumn as KanbanColumnComponent } from './components/kanban/KanbanColumn';

// Analytics Components - Use lazy versions for bundle optimization
// export { AdvancedAnalyticsDashboard } from './components/analytics/AdvancedAnalyticsDashboard'; // Replaced with LazyAnalyticsDashboard

// Service Planner Components
export {
    HvacDispatchPanel,
    HvacRouteOptimizer, HvacSchedulingCalendar, HvacSchedulingDashboard, HvacTechnicianTracker
} from './components/scheduling';

// Maintenance Components - Use lazy versions for bundle optimization
export {
    HvacComplianceTracker,
    HvacMaintenanceAnalytics, HvacMaintenanceCalendar,
    HvacMaintenanceChecklist
} from './components/maintenance';

export {
    HvacMobileDashboard,
    HvacMobileJobCard, HvacMobileNavigation, HvacMobileWorkOrder
} from './components/mobile';

// Navigation Components
export {
    HvacNavigationSection
} from './components/navigation';

// Customer 360 Components - Use lazy versions for bundle optimization
// export {
//     Customer360AnalyticsTab, Customer360CommunicationTab, Customer360Container, Customer360Content, Customer360EquipmentTab, Customer360ErrorState, Customer360Header,
//     Customer360KPICards, Customer360LoadingState, Customer360ProfileTab
// } from './components/customer360';

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

// Dashboard Components - Use lazy versions for bundle optimization
// export {
//     HvacDashboardHeader, HvacDashboardOverview,
//     HvacDashboardPlaceholder, HvacDashboardStats,
//     HvacDashboardWelcome, type TabType
// } from './components/dashboard';

// Error Handling & Monitoring
export {
    HVACErrorBoundary, useHVACErrorReporting, withHVACErrorBoundary
} from './components/HVACErrorBoundary';

// Fault Tolerance Components
export {
    HVACNetworkMonitor, HVACRetryWrapper,
    HVACSuspenseWrapper
} from './components/fault-tolerance';

// Performance Monitoring
export {
    PERFORMANCE_THRESHOLDS, useHVACDebouncedPerformance, useHVACPerformanceMonitoring
} from './hooks/useHVACPerformanceMonitoring';

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
