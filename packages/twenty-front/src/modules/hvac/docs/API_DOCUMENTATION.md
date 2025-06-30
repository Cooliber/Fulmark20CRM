# 🔧 HVAC CRM API Documentation

**"Pasja rodzi profesjonalizm"** - Complete API reference for Fulmark HVAC CRM

## 📋 Overview

This document provides comprehensive API documentation for the HVAC CRM module integrated with Twenty CRM. The API follows GraphQL standards with REST endpoints for specific HVAC operations.

## 🏗️ Architecture

### GraphQL Endpoints
- **Main API**: `http://localhost:3001/graphql`
- **Metadata API**: `http://localhost:3001/metadata`

### REST Endpoints
- **HVAC API**: `http://localhost:8001/api/v1/`
- **Health Check**: `http://localhost:8001/health`

## 🔐 Authentication

All API requests require authentication using JWT tokens:

```typescript
headers: {
  'Authorization': 'Bearer <your-jwt-token>',
  'Content-Type': 'application/json'
}
```

## 📊 GraphQL Schema

### HVAC Service Tickets

#### Query Service Tickets
```graphql
query GetHvacServiceTickets(
  $filter: HvacServiceTicketFilterInput
  $orderBy: [HvacServiceTicketOrderByInput!]
  $first: Int
  $after: String
) {
  hvacServiceTickets(
    filter: $filter
    orderBy: $orderBy
    first: $first
    after: $after
  ) {
    edges {
      node {
        id
        ticketNumber
        title
        description
        status
        priority
        serviceType
        customerId
        equipmentId
        technicianId
        scheduledDate
        completedDate
        estimatedDuration
        actualDuration
        cost
        notes
        createdAt
        updatedAt
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

#### Create Service Ticket
```graphql
mutation CreateHvacServiceTicket($input: HvacServiceTicketCreateInput!) {
  createHvacServiceTicket(input: $input) {
    id
    ticketNumber
    title
    status
    priority
    createdAt
  }
}
```

#### Update Service Ticket
```graphql
mutation UpdateHvacServiceTicket(
  $id: ID!
  $input: HvacServiceTicketUpdateInput!
) {
  updateHvacServiceTicket(id: $id, input: $input) {
    id
    status
    updatedAt
  }
}
```

### HVAC Equipment

#### Query Equipment
```graphql
query GetHvacEquipment(
  $filter: HvacEquipmentFilterInput
  $orderBy: [HvacEquipmentOrderByInput!]
  $first: Int
) {
  hvacEquipment(filter: $filter, orderBy: $orderBy, first: $first) {
    edges {
      node {
        id
        name
        type
        brand
        model
        serialNumber
        installationDate
        warrantyExpiration
        lastMaintenanceDate
        nextMaintenanceDate
        status
        location
        customerId
        specifications
        maintenanceHistory {
          id
          date
          type
          description
          technicianId
          cost
        }
      }
    }
  }
}
```

### HVAC Customers

#### Query Customers with HVAC Data
```graphql
query GetHvacCustomers($filter: HvacCustomerFilterInput) {
  hvacCustomers(filter: $filter) {
    edges {
      node {
        id
        name
        email
        phone
        address
        nip
        regon
        properties {
          id
          address
          type
          size
          equipment {
            id
            name
            type
            status
          }
        }
        serviceHistory {
          totalTickets
          completedTickets
          pendingTickets
          totalCost
          lastServiceDate
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
  }
}
```

### HVAC Semantic Search

#### Semantic Search Query
```graphql
query HvacSemanticSearch(
  $query: String!
  $filters: HvacSearchFiltersInput
  $limit: Int = 20
) {
  hvacSemanticSearch(query: $query, filters: $filters, limit: $limit) {
    results {
      id
      type
      title
      description
      relevanceScore
      metadata
      highlights
    }
    totalCount
    searchTime
    suggestions
  }
}
```

## 🔧 REST API Endpoints

### Service Tickets

#### GET /api/v1/service-tickets
Get all service tickets with filtering and pagination.

**Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 20)
- `status` (string): Filter by status
- `priority` (string): Filter by priority
- `technician_id` (string): Filter by technician
- `customer_id` (string): Filter by customer

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "ticket_number": "TKT-2024-001",
      "title": "Naprawa klimatyzacji",
      "description": "Klimatyzacja nie chłodzi",
      "status": "open",
      "priority": "high",
      "service_type": "repair",
      "customer_id": "uuid",
      "equipment_id": "uuid",
      "technician_id": "uuid",
      "scheduled_date": "2024-01-15T10:00:00Z",
      "estimated_duration": 120,
      "cost": 250.00,
      "created_at": "2024-01-10T08:00:00Z",
      "updated_at": "2024-01-10T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### POST /api/v1/service-tickets
Create a new service ticket.

**Request Body:**
```json
{
  "title": "Konserwacja klimatyzacji",
  "description": "Rutynowa konserwacja systemu HVAC",
  "priority": "medium",
  "service_type": "maintenance",
  "customer_id": "uuid",
  "equipment_id": "uuid",
  "scheduled_date": "2024-01-20T14:00:00Z",
  "estimated_duration": 90
}
```

### Equipment Management

#### GET /api/v1/equipment
Get equipment list with filtering.

**Parameters:**
- `customer_id` (string): Filter by customer
- `type` (string): Equipment type
- `status` (string): Equipment status
- `maintenance_due` (boolean): Show equipment due for maintenance

#### POST /api/v1/equipment
Register new equipment.

**Request Body:**
```json
{
  "name": "Klimatyzator Daikin",
  "type": "air_conditioner",
  "brand": "Daikin",
  "model": "FTXS35K",
  "serial_number": "DK2024001",
  "installation_date": "2024-01-15",
  "warranty_expiration": "2027-01-15",
  "customer_id": "uuid",
  "location": "Biuro główne - sala konferencyjna",
  "specifications": {
    "power": "3.5kW",
    "cooling_capacity": "3.5kW",
    "heating_capacity": "4.0kW",
    "energy_class": "A+++"
  }
}
```

### Semantic Search

#### POST /api/v1/search
Perform semantic search across HVAC data.

**Request Body:**
```json
{
  "query": "problemy z klimatyzacją w biurze",
  "filters": {
    "types": ["service_tickets", "equipment", "customers"],
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    },
    "customer_id": "uuid"
  },
  "limit": 20
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "type": "service_ticket",
      "title": "Klimatyzacja - brak chłodzenia",
      "description": "Klimatyzacja w biurze nie chłodzi pomieszczenia",
      "relevance_score": 0.95,
      "metadata": {
        "customer": "Firma ABC Sp. z o.o.",
        "equipment": "Klimatyzator Daikin FTXS35K",
        "status": "resolved"
      },
      "highlights": [
        "problemy z <mark>klimatyzacją</mark> w <mark>biurze</mark>"
      ]
    }
  ],
  "total_count": 15,
  "search_time": 0.045,
  "suggestions": [
    "serwis klimatyzacji",
    "naprawa wentylacji",
    "konserwacja HVAC"
  ]
}
```

## 📈 Performance Monitoring

### GET /api/v1/metrics
Get performance metrics for HVAC operations.

**Response:**
```json
{
  "performance": {
    "average_response_time": 150,
    "requests_per_minute": 45,
    "error_rate": 0.02,
    "cache_hit_rate": 0.85
  },
  "business_metrics": {
    "active_tickets": 25,
    "completed_today": 8,
    "technicians_active": 12,
    "customer_satisfaction": 4.7
  }
}
```

## 🔄 Real-time Updates

### WebSocket Connection
Connect to real-time updates:

```typescript
const ws = new WebSocket('ws://localhost:8001/ws/hvac-updates');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('HVAC Update:', update);
};
```

### Update Types
- `ticket_status_changed`
- `technician_location_updated`
- `equipment_alert`
- `maintenance_reminder`

## 🚨 Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "HVAC_001",
    "message": "Service ticket not found",
    "details": {
      "ticket_id": "invalid-uuid",
      "timestamp": "2024-01-10T10:00:00Z"
    }
  }
}
```

### Common Error Codes
- `HVAC_001`: Resource not found
- `HVAC_002`: Invalid input data
- `HVAC_003`: Authentication required
- `HVAC_004`: Insufficient permissions
- `HVAC_005`: External service unavailable

## 📝 Rate Limiting

- **Standard endpoints**: 100 requests/minute
- **Search endpoints**: 50 requests/minute
- **Bulk operations**: 10 requests/minute

## 🧪 Testing

### GraphQL Playground
Access the GraphQL playground at: `http://localhost:3001/graphql`

### API Testing Examples
```bash
# Get service tickets
curl -X GET "http://localhost:8001/api/v1/service-tickets?status=open" \
  -H "Authorization: Bearer <token>"

# Create service ticket
curl -X POST "http://localhost:8001/api/v1/service-tickets" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test ticket", "priority": "medium"}'
```

## 📚 Additional Resources

- [HVAC Integration Guide](../../../HVAC_INTEGRATION_README.md)
- [Component Documentation](./COMPONENT_DOCUMENTATION.md)
- [Setup Guide](./SETUP_GUIDE.md)
- [Performance Guide](./PERFORMANCE_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [GraphQL Schema Reference](./GRAPHQL_SCHEMA.md)

## 🔄 Changelog

### v1.0.0 (2024-01-10)
- Initial HVAC API implementation
- GraphQL schema for service tickets, equipment, customers
- Semantic search integration
- Performance monitoring endpoints
- Polish localization support

### v1.1.0 (2024-01-15)
- Enhanced error handling
- Real-time WebSocket updates
- Improved caching strategies
- Bundle optimization
- Mobile API endpoints

---

**Fulmark HVAC CRM** - Professional API for Polish HVAC businesses
*"Pasja rodzi profesjonalizm"* 🏆
