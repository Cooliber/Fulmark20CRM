/**
 * Enhanced HVAC GraphQL Mutations
 * "Pasja rodzi profesjonalizm" - Professional GraphQL Operations
 * 
 * Optimized mutations for the separated HVAC backend integration
 * Following Twenty CRM patterns and TypeScript best practices
 */

import { gql } from '@apollo/client';
import { 
  HVAC_CUSTOMER_FRAGMENT, 
  HVAC_SERVICE_TICKET_FRAGMENT, 
  HVAC_EQUIPMENT_FRAGMENT 
} from './hvac-queries';

// Customer mutations
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
  mutation UpdateHvacCustomer($id: ID!, $input: UpdateHvacCustomerInput!) {
    updateHvacCustomer(id: $id, input: $input) {
      ...HvacCustomerFragment
    }
  }
`;

export const DELETE_HVAC_CUSTOMER = gql`
  mutation DeleteHvacCustomer($id: ID!) {
    deleteHvacCustomer(id: $id) {
      success
      message
    }
  }
`;

// Service ticket mutations
export const CREATE_HVAC_SERVICE_TICKET = gql`
  ${HVAC_SERVICE_TICKET_FRAGMENT}
  mutation CreateHvacServiceTicket($input: CreateHvacServiceTicketInput!) {
    createHvacServiceTicket(input: $input) {
      ...HvacServiceTicketFragment
      customer {
        id
        name
        phone
        email
      }
    }
  }
`;

export const UPDATE_HVAC_SERVICE_TICKET = gql`
  ${HVAC_SERVICE_TICKET_FRAGMENT}
  mutation UpdateHvacServiceTicket($id: ID!, $input: UpdateHvacServiceTicketInput!) {
    updateHvacServiceTicket(id: $id, input: $input) {
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
      }
    }
  }
`;

export const ASSIGN_TECHNICIAN_TO_TICKET = gql`
  mutation AssignTechnicianToTicket($ticketId: ID!, $technicianId: ID!) {
    assignTechnicianToTicket(ticketId: $ticketId, technicianId: $technicianId) {
      id
      technicianId
      status
      assignedAt
      technician {
        id
        name
        phone
        specializations
        currentLocation
      }
    }
  }
`;

export const UPDATE_TICKET_STATUS = gql`
  mutation UpdateTicketStatus($id: ID!, $status: HvacServiceTicketStatus!, $notes: String) {
    updateTicketStatus(id: $id, status: $status, notes: $notes) {
      id
      status
      updatedAt
      statusHistory {
        status
        timestamp
        notes
        updatedBy
      }
    }
  }
`;

// Equipment mutations
export const CREATE_HVAC_EQUIPMENT = gql`
  ${HVAC_EQUIPMENT_FRAGMENT}
  mutation CreateHvacEquipment($input: CreateHvacEquipmentInput!) {
    createHvacEquipment(input: $input) {
      ...HvacEquipmentFragment
      customer {
        id
        name
      }
    }
  }
`;

export const UPDATE_HVAC_EQUIPMENT = gql`
  ${HVAC_EQUIPMENT_FRAGMENT}
  mutation UpdateHvacEquipment($id: ID!, $input: UpdateHvacEquipmentInput!) {
    updateHvacEquipment(id: $id, input: $input) {
      ...HvacEquipmentFragment
    }
  }
`;

export const SCHEDULE_EQUIPMENT_MAINTENANCE = gql`
  mutation ScheduleEquipmentMaintenance($input: ScheduleMaintenanceInput!) {
    scheduleEquipmentMaintenance(input: $input) {
      id
      equipmentId
      scheduledDate
      type
      description
      technicianId
      estimatedDuration
      priority
      createdAt
      equipment {
        id
        name
        type
        location
      }
      technician {
        id
        name
        specializations
      }
    }
  }
`;

// Communication mutations
export const ADD_COMMUNICATION_TO_TICKET = gql`
  mutation AddCommunicationToTicket($input: AddCommunicationInput!) {
    addCommunicationToTicket(input: $input) {
      id
      ticketId
      type
      direction
      content
      timestamp
      participant {
        id
        name
        role
        email
        phone
      }
      aiAnalysis {
        sentiment
        urgency
        keywords
        summary
      }
    }
  }
`;

// Semantic search mutations
export const INDEX_HVAC_DOCUMENT = gql`
  mutation IndexHvacDocument($input: IndexDocumentInput!) {
    indexHvacDocument(input: $input) {
      success
      documentId
      message
      indexedAt
    }
  }
`;

export const UPDATE_SEARCH_INDEX = gql`
  mutation UpdateSearchIndex($type: HvacDocumentType!) {
    updateSearchIndex(type: $type) {
      success
      message
      documentsProcessed
      processingTime
    }
  }
`;

// Batch operations
export const BATCH_UPDATE_SERVICE_TICKETS = gql`
  mutation BatchUpdateServiceTickets($updates: [BatchServiceTicketUpdate!]!) {
    batchUpdateServiceTickets(updates: $updates) {
      success
      updatedCount
      errors {
        ticketId
        error
      }
    }
  }
`;

export const BULK_ASSIGN_TECHNICIAN = gql`
  mutation BulkAssignTechnician($ticketIds: [ID!]!, $technicianId: ID!) {
    bulkAssignTechnician(ticketIds: $ticketIds, technicianId: $technicianId) {
      success
      assignedCount
      errors {
        ticketId
        error
      }
    }
  }
`;

// Analytics and reporting mutations
export const GENERATE_HVAC_REPORT = gql`
  mutation GenerateHvacReport($input: GenerateReportInput!) {
    generateHvacReport(input: $input) {
      reportId
      status
      downloadUrl
      estimatedCompletionTime
      createdAt
    }
  }
`;

// System administration mutations
export const CLEAR_HVAC_CACHE = gql`
  mutation ClearHvacCache($cacheType: HvacCacheType) {
    clearHvacCache(cacheType: $cacheType) {
      success
      message
      clearedKeys
    }
  }
`;

export const SYNC_HVAC_DATA = gql`
  mutation SyncHvacData($syncType: HvacSyncType!) {
    syncHvacData(syncType: $syncType) {
      success
      message
      syncedRecords
      errors
      startedAt
      completedAt
    }
  }
`;

// Polish compliance mutations
export const VALIDATE_POLISH_BUSINESS_DATA = gql`
  mutation ValidatePolishBusinessData($input: PolishBusinessValidationInput!) {
    validatePolishBusinessData(input: $input) {
      isValid
      validationResults {
        field
        isValid
        error
        suggestion
      }
      nipValidation {
        isValid
        companyName
        address
        status
      }
      regonValidation {
        isValid
        companyName
        legalForm
        registrationDate
      }
    }
  }
`;
