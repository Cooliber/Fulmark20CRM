# Initial HVAC Module Overview - 2025-07-01

This report provides an initial overview of the TwentyCRM HVAC module, covering both backend and frontend components, based on a preliminary codebase retrieval and file analysis.

## Backend - `packages/twenty-hvac-server`

The backend HVAC module is implemented as a NestJS application, primarily residing in the `packages/twenty-hvac-server` directory. It exposes a GraphQL API and integrates with external HVAC systems.

### Key Components:

*   **`HvacModule`** ([`packages/twenty-hvac-server/src/modules/hvac/hvac.module.ts`](packages/twenty-hvac-server/src/modules/hvac/hvac.module.ts))
    *   **Description:** The main NestJS module for the HVAC service, responsible for wiring together controllers, services, and GraphQL resolvers. It integrates `HvacConfigModule`, `HvacSentryModule`, `ScheduleModule`, `EventEmitterModule`, and `HttpModule`.
    *   **Key Services Provided/Exported:** `HvacSentryService`, `HvacCacheManagerService`, `HvacRedisCacheService`, `HvacApiIntegrationService`, `HvacWeaviateService`, `HvacDataSyncService`, `HvacCircuitBreakerService`, `HvacErrorHandlerService`, `HvacDatabaseOptimizerService`, `HvacMetricsService`, `HvacSchedulingEngineService`, `HvacDispatchService`, `HvacPreventiveMaintenanceService`, `HvacProductionMonitoringService`, `HvacAlertNotificationService`.
    *   **Key GraphQL Resolvers Provided:** `HvacServiceTicketResolver`, `HvacSemanticSearchResolver`, `HvacCustomerResolver`, `HvacEquipmentResolver`, `HvacCommunicationResolver`, `HvacContractResolver`, `HvacCustomer360Resolver`.

*   **`HvacApiIntegrationService`** ([`packages/twenty-hvac-server/src/modules/hvac/services/hvac-api-integration.service.ts`](packages/twenty-hvac-server/src/modules/hvac/services/hvac-api-integration.service.ts))
    *   **Description:** This service acts as a primary interface to an external HVAC API. It includes robust features like in-memory caching (`cache` property, `getCacheKey`, `getCachedData`, `setCachedData` methods), retry mechanisms, and comprehensive error handling (`performOptimizedRequest` method) for various HTTP errors. It also collects performance metrics (`totalApiRequests`, `totalCacheHits`, `totalApiErrors`, `apiResponseTimes`).
    *   **Key Methods (examples):**
        *   `getCustomers(limit: number, offset: number)`: Fetches customer list.
        *   `getCustomerById(customerId: string)`: Fetches a single customer.
        *   `createCustomer(customerData: Partial<HvacCustomer>)`: Creates a new customer.
        *   `getServiceTickets(limit: number, offset: number)`: Fetches service tickets.
        *   `getEquipment(filters?: HvacEquipmentFilterInput, limit: number, offset: number)`: Fetches equipment list.
        *   `performSemanticSearch(searchQuery: HvacSearchQuery)`: Initiates semantic search, notably mentioned as potentially *not* suitable for standard caching due to dynamic results (implying heavy reliance on external search engine like Weaviate).
        *   `processEmailContentWithAI(emailContent: string, customerId: string)`: Sends email content for AI processing.
        *   `checkApiHealth()`: Checks the health status of the HVAC API.

*   **`HvacCustomerResolver`** ([`packages/twenty-hvac-server/src/modules/hvac/resolvers/hvac-customer.resolver.ts`](packages/twenty-hvac-server/src/modules/hvac/resolvers/hvac-customer.resolver.ts))
    *   **Description:** GraphQL resolver responsible for `HvacCustomer` related queries and mutations, interacting with `HvacApiIntegrationService`.
    *   **Queries:**
        *   `hvacCustomers(page: Int, limit: Int)`: Returns a paginated list of customers (note: current implementation fetches all then slices in memory).
        *   `hvacCustomer(id: ID!)`: Returns a single customer by ID.
    *   **Mutations:**
        *   `createHvacCustomer(input: CreateHvacCustomerInput)`: Creates a new HVAC customer entity.
        *   `updateHvacCustomer(input: UpdateHvacCustomerInput)`: Updates an existing HVAC customer entity.
        *   `deleteHvacCustomer(id: ID!)`: Deletes an HVAC customer entity.

*   **GraphQL Types (`packages/twenty-hvac-server/src/modules/hvac/graphql-types/`)**
    *   **`hvac-customer.types.ts`**: Defines `HvacEquipmentSummaryType`, `HvacPropertyType`, `HvacCustomerAddressType`, `HvacCustomerType` (main GraphQL customer object), and `HvacCustomerListResponse` for list pagination.
    *   Presence of other type files (e.g., `hvac-communication.types.ts`, `hvac-contract.types.ts`, `hvac-equipment.types.ts`, `hvac-quote.types.ts`, `hvac-service-ticket.types.ts`) indicates comprehensive GraphQL schema definitions for all major HVAC entities.

*   **Hvac Workspace Entities (`packages/twenty-hvac-server/src/modules/hvac-*/`)**
    *   **`HvacCustomerWorkspaceEntity`** ([`packages/twenty-hvac-server/src/modules/hvac-customer/hvac-customer.workspace-entity.ts`](packages/twenty-hvac-server/src/modules/hvac-customer/hvac-customer.workspace-entity.ts)): Defines the data model for an HVAC customer within the TwentyCRM workspace, including validation decorators and Polish business fields (`nip`, `regon`). Uses enums like `HvacCustomerType` and `HvacCustomerStatus`. Similar entities are likely to exist for equipment, service tickets, etc.

*   **Weaviate Integration:** `HvacWeaviateService` is explicitly listed as a provider in `HvacModule`, confirming its integration into the backend. The `HvacApiIntegrationService` also exposes `performSemanticSearch`, suggesting Weaviate's role in this functionality.

## Frontend - `packages/twenty-front/src/modules/hvac`

The frontend HVAC module is a React-based application tightly integrated with the TwentyCRM UI, residing in `packages/twenty-front/src/modules/hvac`. It heavily utilizes Recoil for state management and Apollo Client for GraphQL interactions.

### Key Components:

*   **`HvacDashboard.tsx`** ([`packages/twenty-front/src/modules/hvac/components/HvacDashboard.tsx`](packages/twenty-front/src/modules/hvac/components/HvacDashboard.tsx))
    *   **Description:** The central dashboard component displaying various HVAC-related information. It manages active tabs (`HvacDashboardTab` type), handles UI-driven state changes, and monitors system health.
    *   **State Management:** Leverages Recoil atoms (`hvacDashboardActiveTabState`, `hvacDashboardLoadingState`, `hvacDashboardErrorState`, `hvacDashboardLastRefreshState`) and selectors (`hvacDashboardIsHealthySelector`).
    *   **Error Handling:** Integrates `HVACErrorBoundary` for UI resilience and `useHVACErrorReporting` (likely Sentry integration).
    *   **API Interaction:** Uses `hvacApiIntegrationService` for health checks and other API calls.
    *   **Performance:** Includes `useHvacPreloader` for lazy loading and `hvacBundleOptimizer` for bundle size validation.
    *   **Weaviate Status:** The dashboard explicitly displays the health status of `Weaviate`, indicating its critical role in the system.

*   **GraphQL Queries (`packages/twenty-front/src/modules/hvac/graphql/hvac-queries.ts`)**
    *   **Description:** Centralized file for all GraphQL queries and fragments used by the frontend HVAC components.
    *   **Key Fragments:** For `HvacCustomer`, `HvacServiceTicket`, `HvacEquipment`.
    *   **Key Queries:**
        *   `GET_HVAC_CUSTOMERS`, `GET_HVAC_CUSTOMER_BY_ID`: For fetching customer data, including nested relationships (service tickets, equipment, contracts) in `GET_HVAC_CUSTOMER_BY_ID`, enabling the Customer 360 view.
        *   `GET_HVAC_SERVICE_TICKETS`, `GET_HVAC_SERVICE_TICKET_BY_ID`: For service ticket management.
        *   `GET_HVAC_EQUIPMENT`: For equipment listing.
        *   `HVAC_SEMANTIC_SEARCH`: Direct GraphQL query for semantic search functionality, confirming its frontend integration.
        *   `GET_HVAC_DASHBOARD_ANALYTICS`: For fetching dashboard-specific analytics data.
        *   `GET_HVAC_SYSTEM_HEALTH`: Querying internal system health, specifically including `weaviate` component status.

*   **`CustomerAPIService.ts`** ([`packages/twenty-front/src/modules/hvac/services/CustomerAPIService.ts`](packages/twenty-front/src/modules/hvac/services/CustomerAPIService.ts))
    *   **Description:** Frontend service for customer-related API interactions, primarily via GraphQL to the CRM backend, but also potentially to a direct HVAC API. It includes a simple in-memory cache.
    *   **Key Methods:** `getCustomer360Data()` (orchestrates multiple related queries for the 360 view), `getCustomers()`, `getCustomerById()`, `getCustomerInsights()`, `getCustomerEquipment()`, `getCustomerCommunications()`, `getCustomerTickets()`, `getCustomerContracts()`, `updateCustomer()`.
    *   **Data Models:** Defines comprehensive TypeScript interfaces for `Customer`, `Equipment`, `ServiceTicket`, `Communication`, `Contract`, etc., including Polish business compliance fields (NIP, REGON, VAT rates) and various enum types.

*   **State Management (`packages/twenty-front/src/modules/hvac/states/hvacDashboardState.ts`)**
    *   **Description:** Recoil state definitions for the HVAC dashboard, including primitive atoms and derived selectors.
    *   **State Elements:** `hvacDashboardActiveTabState`, `hvacDashboardStatsState`, `hvacDashboardLoadingState`, `hvacDashboardErrorState`, `hvacDashboardFiltersState`, `hvacDashboardPreferencesState`, `hvacDashboardLastRefreshState`.
    *   **Derived Selectors:** `hvacDashboardIsHealthySelector`, `hvacDashboardCriticalAlertsSelector`, `hvacDashboardKpiSummarySelector`, `hvacDashboardActiveFiltersCountSelector`, `hvacDashboardShouldAutoRefreshSelector`.

## Overall Observations and Next Steps:

*   **Interdependence:** The backend (`twenty-hvac-server`) and frontend (`twenty-front/src/modules/hvac`) are clearly designed to work together, with the frontend consuming GraphQL endpoints exposed by the backend services.
*   **Weaviate Role:** Weaviate appears to be a critical component, fundamental to semantic search and included in system health checks. Any simplification involving its removal would require significant re-architecture of semantic search functionality and impact system monitoring.
*   **Complexity:** The module is feature-rich, covering many aspects of HVAC CRM.
*   **Architectural Alignment:** Follows NestJS/React/GraphQL patterns in line with TwentyCRM.

**Next Steps for Orchestrator State Scribe:**

1.  **Transfer to Uber Orchestrator:** This detailed documentation is valuable input for further strategic decisions, particularly regarding the user's implicit question about simplifying the HVAC module (e.g., removing Weaviate). This type of strategic decision should be handled by the Uber Orchestrator, possibly delegating to a `research-planner-strategic` to evaluate the Weaviate alternative.
2.  **Continue Granular Documentation:** Continuously update this report with more granular details (e.g., specific methods of each service/resolver, props of each React component) as development progresses. (This will be done by further processing of files in subsequent State Scribe tasks).
