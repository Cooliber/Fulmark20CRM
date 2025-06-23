# 🏗️ HVAC CRM Integration Guide

**"Pasja rodzi profesjonalizm"** - Fulmark HVAC Professional CRM

This guide explains how to integrate Twenty CRM with your existing HVAC backend services to create a comprehensive HVAC Customer Relationship Management system.

## 🎯 Overview

The HVAC CRM integration combines:
- **Twenty CRM**: Modern, extensible CRM platform (Frontend + Backend)
- **HVAC Backend**: FastAPI-based HVAC services with AI capabilities
- **Weaviate**: Semantic search and AI-powered insights
- **Bielik LLM**: Polish language AI processing
- **CrewAI**: Intelligent agent orchestration

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HVAC CRM System                          │
├─────────────────────────────────────────────────────────────┤
│  Twenty CRM Frontend     │  Twenty CRM Backend              │
│  (React + TypeScript)    │  (NestJS + GraphQL)             │
│  Port: 3002              │  Port: 3001                     │
│  ├─ HVAC UI Components   │  ├─ HVAC GraphQL Resolvers      │
│  ├─ Polish Localization  │  ├─ HVAC API Integration        │
│  ├─ Semantic Search UI   │  └─ Custom HVAC Objects         │
│  └─ PrimeReact/PrimeFlex │                                 │
├─────────────────────────────────────────────────────────────┤
│                    Integration Layer                        │
│  ├─ HVAC Config Service  │  ├─ Weaviate Integration        │
│  ├─ API Proxy Layer      │  ├─ Bielik LLM Service          │
│  └─ Data Mapping         │  └─ CrewAI Orchestration        │
├─────────────────────────────────────────────────────────────┤
│                    HVAC Backend Services                    │
│  FastAPI (Port: 8000)    │  Weaviate (Port: 8080)         │
│  ├─ Customer Management  │  ├─ Semantic Search             │
│  ├─ Service Tickets      │  ├─ Document Analysis           │
│  ├─ Equipment Tracking   │  └─ AI Insights                 │
│  ├─ Maintenance Records  │                                 │
│  └─ AI Processing        │  PostgreSQL + Redis             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

Ensure your HVAC backend services are running:
- **HVAC FastAPI Backend**: `http://localhost:8000`
- **Weaviate**: `http://localhost:8080`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

### 1. Run the Setup Script

```bash
cd Fulmark20CRM
./scripts/setup-hvac-integration.sh
```

This script will:
- ✅ Configure environment variables
- ✅ Install dependencies
- ✅ Set up database connections
- ✅ Run migrations
- ✅ Create HVAC workspace configuration
- ✅ Generate startup scripts

### 2. Start the System

```bash
./start-hvac-crm.sh
```

### 3. Access the Application

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3001
- **GraphQL Playground**: http://localhost:3001/graphql

## ⚙️ Configuration

### Environment Variables

The integration uses two main environment files:

#### Backend Configuration (`.env`)
```bash
# Core Twenty CRM
PG_DATABASE_URL=postgres://hvac_user:hvac_password_2024@localhost:5432/hvac_crm
REDIS_URL=redis://:hvac_redis_2024@localhost:6379

# HVAC Backend Integration
HVAC_API_URL=http://localhost:8000
HVAC_API_KEY=hvac_api_key_2024_change_in_production

# Weaviate Integration
WEAVIATE_HOST=localhost
WEAVIATE_PORT=8080

# Polish Business Configuration
DEFAULT_LANGUAGE=pl
TIMEZONE=Europe/Warsaw
COMPANY_NAME=Fulmark HVAC
```

#### Frontend Configuration (`.env.local`)
```bash
# API Endpoints
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_HVAC_API_URL=http://localhost:8000

# Polish Localization
NEXT_PUBLIC_DEFAULT_LANGUAGE=pl
NEXT_PUBLIC_LOCALE=pl_PL
NEXT_PUBLIC_CURRENCY=PLN

# HVAC Features
NEXT_PUBLIC_FEATURE_HVAC_SCHEDULING=true
NEXT_PUBLIC_FEATURE_SEMANTIC_SEARCH=true
```

## 🔧 HVAC-Specific Features

### 1. Custom Objects

The integration creates HVAC-specific objects:

- **Service Tickets**: HVAC service requests and work orders
- **Equipment**: HVAC equipment tracking and maintenance
- **Maintenance Records**: Scheduled and completed maintenance
- **Customer Properties**: Building and property information
- **Technicians**: HVAC technician management

### 2. Semantic Search Integration

- **Document Search**: Search through service reports, manuals, emails
- **Customer Insights**: AI-powered customer behavior analysis
- **Equipment Knowledge**: Semantic search of equipment documentation

### 3. Polish Business Compliance

- **NIP/REGON Validation**: Polish business number validation
- **GDPR Compliance**: 7-year data retention as per Polish law
- **Polish Language**: Full Polish localization
- **PLN Currency**: Polish Złoty support

### 4. AI-Powered Features

- **Bielik LLM**: Polish language processing
- **CrewAI Agents**: Intelligent task automation
- **Customer 360**: Comprehensive customer profiles
- **Predictive Maintenance**: AI-driven maintenance scheduling

## 🔌 API Integration

### HVAC Service Endpoints

The integration connects to these HVAC backend endpoints:

```typescript
// Customer Management
GET /api/v1/customers
POST /api/v1/customers
PUT /api/v1/customers/{id}

// Service Tickets
GET /api/v1/tickets
POST /api/v1/tickets
PUT /api/v1/tickets/{id}

// Equipment Management
GET /api/v1/equipment
POST /api/v1/equipment

// Semantic Search
POST /api/v1/search
```

### GraphQL Integration

Twenty CRM exposes HVAC data through GraphQL:

```graphql
query GetHvacCustomers {
  hvacCustomers {
    id
    name
    email
    phone
    properties {
      address
      equipmentList
    }
    serviceHistory {
      tickets {
        id
        status
        priority
        description
      }
    }
  }
}

mutation CreateServiceTicket($input: CreateServiceTicketInput!) {
  createServiceTicket(input: $input) {
    id
    ticketNumber
    status
    priority
    customer {
      name
      phone
    }
  }
}
```

## 🎨 UI/UX Customization

### PrimeReact/PrimeFlex Integration

The frontend uses PrimeReact components with HVAC-specific styling:

```typescript
// HVAC-specific components
import { HvacServiceTicketCard } from '@/components/hvac/ServiceTicketCard';
import { HvacEquipmentList } from '@/components/hvac/EquipmentList';
import { HvacMaintenanceSchedule } from '@/components/hvac/MaintenanceSchedule';

// Polish localization
import { PolishDatePicker } from '@/components/polish/DatePicker';
import { NipValidator } from '@/components/polish/NipValidator';
```

### Dark Theme Configuration

```css
/* HVAC-specific dark theme */
:root {
  --hvac-primary: #1976d2;
  --hvac-secondary: #dc004e;
  --hvac-background: #121212;
  --hvac-surface: #1e1e1e;
}
```

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd packages/twenty-server
yarn test

# Frontend tests
cd packages/twenty-front
yarn test

# Integration tests
yarn test:integration
```

### HVAC-Specific Tests

```bash
# Test HVAC API integration
yarn test:hvac-api

# Test Weaviate connection
yarn test:weaviate

# Test Polish compliance
yarn test:polish-compliance
```

## 🚀 Deployment

### Production Configuration

1. **Update Environment Variables**:
   ```bash
   NODE_ENV=production
   HVAC_API_URL=https://api.fulmark.pl
   PG_DATABASE_URL=postgres://user:pass@prod-db:5432/hvac_crm
   ```

2. **SSL Configuration**:
   ```bash
   SSL_ENABLED=true
   SSL_CERT_PATH=./certs/fulmark-hvac.crt
   SSL_KEY_PATH=./certs/fulmark-hvac.key
   ```

3. **Build for Production**:
   ```bash
   yarn build
   yarn start:prod
   ```

## 🔍 Monitoring

### Health Checks

The system provides comprehensive health monitoring:

```bash
# Check all services
curl http://localhost:3001/health

# Check HVAC backend
curl http://localhost:8000/health

# Check Weaviate
curl http://localhost:8080/v1/.well-known/ready
```

### Sentry Integration

Error monitoring is configured for both frontend and backend:

```bash
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ENVIRONMENT=production
```

## 📚 Documentation

### API Documentation

- **GraphQL Playground**: http://localhost:3001/graphql
- **HVAC API Docs**: http://localhost:8000/docs
- **Weaviate API**: http://localhost:8080/v1

### Component Documentation

- **Storybook**: `yarn storybook`
- **TypeDoc**: `yarn docs:generate`

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Verify database exists
   psql -h localhost -U hvac_user -d hvac_crm -c '\l'
   ```

2. **HVAC API Not Responding**:
   ```bash
   # Check HVAC backend status
   curl http://localhost:8000/health
   
   # Check logs
   tail -f backend/logs/hvac_crm.log
   ```

3. **Weaviate Connection Issues**:
   ```bash
   # Check Weaviate status
   curl http://localhost:8080/v1/.well-known/ready
   
   # Restart Weaviate
   docker restart weaviate
   ```

## 🤝 Support

For support and questions:
- **Email**: support@fulmark.pl
- **Documentation**: [Internal Wiki]
- **Issues**: Create GitHub issue in the repository

---

**"Pasja rodzi profesjonalizm"** 🏗️

*Fulmark HVAC Professional CRM - Powered by Twenty CRM*
