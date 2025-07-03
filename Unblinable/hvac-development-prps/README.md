# HVAC Development PRPs for TwentyCRM
## "Pasja rodzi profesjonalizm" - Context Engineering dla HVAC SOTA++

Zaawansowane Product Requirements Prompts (PRPs) dla rozwoju modułów HVAC w TwentyCRM, wykorzystujące Context Engineering do osiągnięcia najwyższej jakości integracji.

## 🎯 Filozofia Rozwoju

**"Piękna unifikacja w pełnym stylu Twenty CRM"** - Każdy komponent HVAC musi być perfekcyjnie zintegrowany z architekturą TwentyCRM, zachowując spójność wizualną, funkcjonalną i techniczną.

## 🚀 Struktura PRPs

```
hvac-development-prps/
├── README.md                           # Ten plik
├── HVAC_CLAUDE.md                     # Globalne zasady dla HVAC w TwentyCRM
├── core-components/
│   ├── hvac-dashboard-enhancement.md  # Ulepszenia dashboardu HVAC
│   ├── hvac-equipment-management.md   # Zarządzanie sprzętem HVAC
│   ├── hvac-service-orders.md         # Zlecenia serwisowe HVAC
│   └── hvac-analytics-engine.md       # Silnik analityczny HVAC
├── integration-prps/
│   ├── twenty-navigation-integration.md  # Integracja z nawigacją Twenty
│   ├── twenty-ui-components.md          # Komponenty UI w stylu Twenty
│   ├── twenty-graphql-integration.md    # Integracja GraphQL
│   └── twenty-auth-integration.md       # Integracja uwierzytelniania
├── advanced-features/
│   ├── hvac-ai-assistant.md           # Asystent AI dla HVAC
│   ├── hvac-iot-integration.md        # Integracja IoT
│   ├── hvac-mobile-app.md             # Aplikacja mobilna
│   └── hvac-predictive-maintenance.md # Predykcyjna konserwacja
├── polish-market/
│   ├── polish-compliance.md           # Zgodność z polskim prawem
│   ├── polish-manufacturers.md        # Integracja z polskimi producentami
│   └── polish-energy-providers.md     # Integracja z dostawcami energii
└── examples/
    ├── twenty-component-patterns/      # Wzorce komponentów Twenty
    ├── hvac-business-logic/            # Logika biznesowa HVAC
    └── integration-examples/           # Przykłady integracji
```

## 🔧 Kluczowe Zasady

### 1. **TwentyCRM Architecture Compliance**
- Functional components only (no class components)
- Named exports (no default exports)
- Types over interfaces
- Specific twenty-ui imports (`twenty-ui/display`, `twenty-ui/input`)
- Event handlers over useEffect where possible

### 2. **HVAC Business Logic Excellence**
- Polish market compliance (VAT, regulations)
- Integration with Polish HVAC manufacturers
- Energy efficiency calculations
- Predictive maintenance algorithms
- IoT device management

### 3. **Performance & Bundle Optimization**
- Bundle size under 4.7MB total
- Code splitting for heavy dependencies
- Lazy loading for non-critical components
- 300ms search performance target

### 4. **Testing & Quality Assurance**
- Comprehensive Playwright E2E tests
- Unit tests for all business logic
- Integration tests with TwentyCRM components
- Performance testing and monitoring

## 🎨 Design Philosophy

**"Gobeklitepe architect-worthy"** - Każdy komponent musi być zaprojektowany z myślą o długoterminowej skalowalności i elegancji architektury.

### Visual Design
- Material Design 3 Expressive
- Cosmic UX patterns
- Consistent with TwentyCRM design system
- Polish market cultural considerations

### Technical Design
- Micro-packages architecture
- Clean separation of concerns
- Reactive state management
- Real-time updates via WebSockets

## 🚀 Quick Start

1. **Wybierz PRP** z odpowiedniego folderu
2. **Przeczytaj HVAC_CLAUDE.md** dla globalnych zasad
3. **Sprawdź examples/** dla wzorców i przykładów
4. **Wykonaj PRP** używając Context Engineering

## 📋 Status Rozwoju

### ✅ Completed
- Podstawowa struktura modułów HVAC
- Integracja z nawigacją TwentyCRM
- Bundle optimization (5.52MB → target 4.7MB)
- Icon integration fixes

### 🔄 In Progress
- Bundle size optimization (0.82MB do redukcji)
- Advanced analytics engine
- IoT integration framework

### 📋 Planned
- AI-powered predictive maintenance
- Mobile application
- Advanced Polish market compliance
- Multi-tenant architecture

## 🎯 Success Metrics

- **Bundle Size**: < 4.7MB
- **Performance**: < 300ms search response
- **Test Coverage**: > 90%
- **User Satisfaction**: > 95%
- **Polish Compliance**: 100%

---

**"Kontrola Klimatu = Kontrola Sukcesu"** 🌟
