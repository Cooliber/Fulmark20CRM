// HVAC Module Exports
// "Pasja rodzi profesjonalizm" - Fulmark HVAC Professional CRM

// Components
export { HvacDashboard } from './components/HvacDashboard';
export { HvacSemanticSearch } from './components/HvacSemanticSearch';
export { HvacServiceTicketList } from './components/HvacServiceTicketList';

// Enhanced Customer 360 Components
export { Customer360CommunicationTabEnhanced } from './components/customer360/Customer360CommunicationTabEnhanced';

// Lazy Loading Components
export {
  LazyCustomer360,
  LazyCustomer360CommunicationTab,
  LazyCustomer360EquipmentTab,
} from './components/lazy/LazyCustomer360';

// Performance Components
export { PerformanceMonitor } from './components/performance/PerformanceMonitor';

// Kanban Components
export { KanbanBoard } from './components/kanban/KanbanBoard';
export { KanbanColumn } from './components/kanban/KanbanColumn';

// Analytics Components
export { AdvancedAnalyticsDashboard } from './components/analytics/AdvancedAnalyticsDashboard';

// Service Planner Components
export {
  HvacSchedulingDashboard,
  HvacSchedulingCalendar,
  HvacTechnicianTracker,
  HvacDispatchPanel,
  HvacRouteOptimizer,
} from './components/scheduling';

export {
  HvacMaintenanceDashboard,
  HvacMaintenanceCalendar,
  HvacMaintenanceChecklist,
  HvacComplianceTracker,
  HvacMaintenanceAnalytics,
} from './components/maintenance';

export {
  HvacMobileDashboard,
  HvacMobileJobCard,
  HvacMobileWorkOrder,
  HvacMobileNavigation,
} from './components/mobile';

// Navigation Components
export {
  HvacNavigationSection,
} from './components/navigation';

// Customer 360 Components
export {
  Customer360Container,
  Customer360LoadingState,
  Customer360ErrorState,
  Customer360Content,
  Customer360Header,
  Customer360KPICards,
  Customer360ProfileTab,
  Customer360CommunicationTab,
  Customer360EquipmentTab,
  Customer360AnalyticsTab,
} from './components/customer360';

// Services
export {
  customerAPIService,
  CustomerAPIService,
  type Customer,
  type CustomerInsights,
  type Customer360Data,
  type Equipment,
  type ServiceTicket,
  type Contract,
  type CustomerAddress,
  type EmergencyContact,
  CustomerStatus,
  CustomerType,
  CompanySize,
  PaymentMethod,
  ContactMethod,
  RiskLevel,
} from './services/CustomerAPIService';

export {
  polishBusinessValidationService,
  PolishBusinessValidationService,
  type ValidationResult,
  type NIPValidationResult,
  type REGONValidationResult,
  type VATCalculation,
  VATCategory,
} from './services/PolishBusinessValidationService';

export {
  equipmentAPIService,
  EquipmentAPIService,
  type Equipment as HVACEquipment,
  type MaintenanceRecord,
  type EquipmentFilter,
  type CreateEquipmentRequest,
  type UpdateEquipmentRequest,
  type ScheduleMaintenanceRequest,
} from './services/EquipmentAPIService';

export {
  communicationAPIService,
  CommunicationAPIService,
  type Communication,
  type AIInsights,
  type CommunicationFilter,
  type CreateCommunicationRequest,
  type CommunicationStats,
  type Participant,
  type Attachment,
} from './services/CommunicationAPIService';

export {
  customerDataFlowService,
  CustomerDataFlowService,
  type CustomerDataFlow,
  type CustomerStage,
  type FlowStatus,
  type Priority,
  type CustomerSource,
  type FlowAnalytics,
  type CustomerFlowMetadata,
  type HVACRequirement,
} from './services/CustomerDataFlowService';

export {
  quoteManagementService,
  QuoteManagementService,
  type Quote,
  type QuoteStatus,
  type QuoteItem,
  type QuoteTemplate,
  type QuoteAnalytics,
  type HVACCategory,
  type PaymentMethod as QuotePaymentMethod,
} from './services/QuoteManagementService';

export {
  kanbanFlowService,
  KanbanFlowService,
  type KanbanBoard as KanbanBoardType,
  type KanbanColumn as KanbanColumnType,
  type KanbanCard as KanbanCardType,
  type KanbanAnalytics,
  type BoardType,
  type CardType,
  type CardStatus,
} from './services/KanbanFlowService';

export {
  dataPipelineService,
  DataPipelineService,
  type DataPipeline,
  type PipelineType,
  type PipelineStatus,
  type PipelineAnalytics,
  type RealTimeSyncConfig,
} from './services/DataPipelineService';

// Hooks
export {
  useCustomer360,
  useCustomerList,
} from './hooks/useCustomer360';

export {
  useCustomerValidation,
} from './hooks/useCustomerValidation';

export {
  useDebounce,
  useDebounceSearch,
} from './hooks/useDebounce';

export {
  useServerSideFilter,
} from './hooks/useServerSideFilter';

export {
  useEquipmentManagement,
} from './hooks/useEquipmentManagement';

export {
  useCommunicationTimeline,
} from './hooks/useCommunicationTimeline';

export {
  useDataLoader,
} from './hooks/useDataLoader';

export {
  useCustomerDataFlow,
} from './hooks/useCustomerDataFlow';

export {
  useQuoteManagement,
} from './hooks/useQuoteManagement';

export {
  useKanbanFlow,
} from './hooks/useKanbanFlow';

export {
  useDataPipeline,
} from './hooks/useDataPipeline';

// Service Planner Hooks
export {
  useHvacScheduling,
} from './hooks/useHvacScheduling';

export {
  useHvacDispatch,
} from './hooks/useHvacDispatch';

export {
  useHvacTechnicians,
} from './hooks/useHvacTechnicians';

export {
  useHvacMaintenance,
} from './hooks/useHvacMaintenance';

export {
  useHvacMobileTechnician,
} from './hooks/useHvacMobileTechnician';

// Dashboard Components
export {
  HvacDashboardHeader,
  HvacDashboardStats,
  HvacDashboardWelcome,
  HvacDashboardOverview,
  HvacDashboardPlaceholder,
  type TabType,
} from './components/dashboard';

// Error Handling & Monitoring
export {
  HVACErrorBoundary,
  withHVACErrorBoundary,
  useHVACErrorReporting
} from './components/HVACErrorBoundary';

// Fault Tolerance Components
export {
  HVACRetryWrapper,
  HVACSuspenseWrapper,
  HVACNetworkMonitor,
} from './components/fault-tolerance';

// Performance Monitoring
export {
  useHVACPerformanceMonitoring,
  useHVACDebouncedPerformance,
  PERFORMANCE_THRESHOLDS
} from './hooks/useHVACPerformanceMonitoring';

// Sentry Configuration & Utilities
export {
  initializeHVACSentry,
  updateHVACUserContext,
  clearHVACUserSession,
  trackHVACUserAction,
  trackHVACNavigation,
  trackHVACAPICall,
  trackPolishBusinessOperation,
  isHVACSentryInitialized,
  HVACErrorContexts,
} from './utils/sentry-init';

export {
  reportHVACError,
  reportHVACMessage,
  reportPolishBusinessError,
  startHVACTransaction,
  addHVACBreadcrumb,
  setHVACUserContext,
  clearHVACUserContext,
  HVACErrorContexts as ErrorContexts,
  PolishBusinessTags,
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
