/**
 * Enhanced HVAC GraphQL Queries
 * "Pasja rodzi profesjonalizm" - Professional GraphQL Operations
 * 
 * Optimized queries for the separated HVAC backend integration
 * Following Twenty CRM patterns and TypeScript best practices
 */

import { gql } from '@apollo/client';

// Fragment definitions for reusability and consistency
export const HVAC_CUSTOMER_FRAGMENT = gql`
  fragment HvacCustomerFragment on HvacCustomer {
    id
    name
    email
    phone
    nip
    regon
    address {
      street
      city
      postalCode
      country
    }
    status
    type
    createdAt
    updatedAt
  }
`;

export const HVAC_SERVICE_TICKET_FRAGMENT = gql`
  fragment HvacServiceTicketFragment on HvacServiceTicket {
    id
    title
    description
    status
    priority
    type
    customerId
    technicianId
    equipmentId
    scheduledDate
    completedDate
    estimatedDuration
    actualDuration
    cost
    notes
    createdAt
    updatedAt
  }
`;

export const HVAC_EQUIPMENT_FRAGMENT = gql`
  fragment HvacEquipmentFragment on HvacEquipment {
    id
    name
    type
    brand
    model
    serialNumber
    installationDate
    warrantyExpiry
    customerId
    location
    specifications
    maintenanceSchedule
    status
    lastMaintenanceDate
    nextMaintenanceDate
    createdAt
    updatedAt
  }
`;

// Customer queries
export const GET_HVAC_CUSTOMERS = gql`
  ${HVAC_CUSTOMER_FRAGMENT}
  query GetHvacCustomers(
    $filter: HvacCustomerFilter
    $sort: HvacCustomerSort
    $pagination: PaginationInput
  ) {
    hvacCustomers(filter: $filter, sort: $sort, pagination: $pagination) {
      data {
        ...HvacCustomerFragment
      }
      pagination {
        total
        page
        limit
        hasNext
        hasPrevious
      }
    }
  }
`;

export const CREATE_HVAC_CUSTOMER = gql`
  ${HVAC_CUSTOMER_FRAGMENT}
  mutation CreateHvacCustomer($input: CreateHvacCustomerInput!) {
    createHvacCustomer(input: $input) {
      ...HvacCustomerFragment
    }
  }
`;

export const UPDATE_HVAC_CUSTOMER = gql`
  ${HVAC_CUSTOMER_FRAGMENT}
  mutation UpdateHvacCustomer($input: UpdateHvacCustomerInput!) {
    updateHvacCustomer(input: $input) {
      ...HvacCustomerFragment
    }
  }
`;

export const DELETE_HVAC_CUSTOMER = gql`
  mutation DeleteHvacCustomer($id: ID!) {
    deleteHvacCustomer(id: $id)
  }
`;

export const GET_HVAC_CUSTOMER_BY_ID = gql`
  ${HVAC_CUSTOMER_FRAGMENT}
  query GetHvacCustomerById($id: ID!) {
    hvacCustomer(id: $id) {
      ...HvacCustomerFragment
      serviceTickets {
        id
        title
        status
        priority
        scheduledDate
        createdAt
      }
      equipment {
        id
        name
        type
        status
        lastMaintenanceDate
        nextMaintenanceDate
      }
      contracts {
        id
        type
        startDate
        endDate
        value
        status
      }
    }
  }
`;

// Service ticket queries
export const GET_HVAC_SERVICE_TICKETS = gql`
  ${HVAC_SERVICE_TICKET_FRAGMENT}
  query GetHvacServiceTickets(
    $filter: HvacServiceTicketFilter
    $sort: HvacServiceTicketSort
    $pagination: PaginationInput
  ) {
    hvacServiceTickets(filter: $filter, sort: $sort, pagination: $pagination) {
      data {
        ...HvacServiceTicketFragment
        customer {
          id
          name
          phone
          email
        }
        technician {
          id
          name
          phone
          specializations
        }
        equipment {
          id
          name
          type
          location
        }
      }
      pagination {
        total
        page
        limit
        hasNext
        hasPrevious
      }
    }
  }
`;

export const GET_HVAC_SERVICE_TICKET_BY_ID = gql`
  ${HVAC_SERVICE_TICKET_FRAGMENT}
  query GetHvacServiceTicketById($id: ID!) {
    hvacServiceTicket(id: $id) {
      ...HvacServiceTicketFragment
      customer {
        id
        name
        phone
        email
        address {
          street
          city
          postalCode
        }
      }
      technician {
        id
        name
        phone
        email
        specializations
        currentLocation
      }
      equipment {
        id
        name
        type
        brand
        model
        location
        specifications
      }
      communications {
        id
        type
        direction
        content
        timestamp
        participant {
          name
          role
        }
      }
      attachments {
        id
        filename
        url
        type
        size
        uploadedAt
      }
    }
  }
`;

// Equipment queries
export const GET_HVAC_EQUIPMENT = gql`
  ${HVAC_EQUIPMENT_FRAGMENT}
  query GetHvacEquipment(
    $filter: HvacEquipmentFilter
    $sort: HvacEquipmentSort
    $pagination: PaginationInput
  ) {
    hvacEquipment(filter: $filter, sort: $sort, pagination: $pagination) {
      data {
        ...HvacEquipmentFragment
        customer {
          id
          name
          phone
        }
        maintenanceRecords {
          id
          type
          date
          description
          cost
          technicianId
        }
      }
      pagination {
        total
        page
        limit
        hasNext
        hasPrevious
      }
    }
  }
`;

// Semantic search query
export const HVAC_SEMANTIC_SEARCH = gql`
  query HvacSemanticSearch(
    $query: String!
    $limit: Int = 10
    $threshold: Float = 0.7
    $filters: HvacSearchFilters
  ) {
    hvacSemanticSearch(
      query: $query
      limit: $limit
      threshold: $threshold
      filters: $filters
    ) {
      results {
        id
        type
        title
        content
        score
        metadata
        highlights
      }
      totalResults
      searchTime
      suggestions
    }
  }
`;

// Dashboard analytics query
export const GET_HVAC_DASHBOARD_ANALYTICS = gql`
  query GetHvacDashboardAnalytics(
    $dateRange: DateRangeInput!
    $filters: HvacAnalyticsFilters
  ) {
    hvacDashboardAnalytics(dateRange: $dateRange, filters: $filters) {
      summary {
        totalCustomers
        activeServiceTickets
        completedTicketsToday
        upcomingMaintenances
        revenue {
          today
          thisWeek
          thisMonth
          thisYear
        }
      }
      charts {
        ticketsByStatus {
          status
          count
          percentage
        }
        ticketsByPriority {
          priority
          count
          percentage
        }
        revenueOverTime {
          date
          amount
          ticketCount
        }
        technicianPerformance {
          technicianId
          name
          completedTickets
          averageRating
          efficiency
        }
      }
      kpis {
        averageResponseTime
        customerSatisfaction
        firstTimeFixRate
        equipmentUptime
        maintenanceCompliance
      }
    }
  }
`;

// Health check query
export const GET_HVAC_SYSTEM_HEALTH = gql`
  query GetHvacSystemHealth {
    hvacSystemHealth {
      overall
      services {
        name
        status
        responseTime
        lastChecked
        details
      }
      metrics {
        activeConnections
        cacheHitRate
        averageResponseTime
        errorRate
      }
    }
  }
`;
