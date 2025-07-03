# HVAC Development Rules for TwentyCRM
## "Pasja rodzi profesjonalizm" - Globalne zasady dla HVAC SOTA++

### 🎯 Project Awareness & HVAC Context
- **Always read TwentyCRM patterns** from packages/twenty-front/src/modules for architectural consistency
- **Follow "piękna unifikacja w pełnym stylu twenty crm"** philosophy in every component
- **Use Augment Context Engine** extensively for understanding existing TwentyCRM patterns
- **Maintain Polish market focus** with compliance and cultural considerations
- **Target bundle size under 4.7MB** with micro-packages architecture

### 🏗️ TwentyCRM Architecture Compliance
- **Functional components only** - No class components allowed
- **Named exports only** - No default exports (export { ComponentName })
- **Types over interfaces** - Use `type` declarations instead of `interface`
- **Specific twenty-ui imports** - Use `twenty-ui/display`, `twenty-ui/input`, `twenty-ui/layout`
- **Event handlers over useEffect** - Prefer onClick handlers over useEffect where possible
- **Max 150 lines per component** - Split larger components into smaller modules

### 🔧 HVAC-Specific Technical Standards
```typescript
// ✅ Correct HVAC component structure
import { IconBuildingSkyscraper } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { Card } from 'twenty-ui/layout';

export type HVACSystemType = 'heating' | 'ventilation' | 'air_conditioning' | 'combined';

export const HVACDashboard = () => {
  // Component logic here
};
```

### 🇵🇱 Polish Market Requirements
- **VAT calculations** - Implement Polish VAT rates (23%, 8%, 5%)
- **Energy certificates** - Support Polish energy efficiency standards
- **Manufacturer integration** - Vaillant, Viessmann, Bosch, Junkers
- **Regulatory compliance** - Polish building codes and HVAC regulations
- **Currency formatting** - PLN with proper Polish number formatting

### 📦 Bundle Optimization Rules
- **Lazy load heavy dependencies** - Chart.js, D3.js, PrimeReact components
- **Code splitting by feature** - Each HVAC module as separate chunk
- **Dynamic imports for analytics** - Load visualization libraries on demand
- **Micro-packages architecture**:
  - `hvac-core` (500KB) - Base functionality
  - `hvac-dashboard` (800KB target) - Dashboard components
  - `hvac-analytics` (lazy loaded) - Advanced analytics
  - `hvac-equipment` (lazy loaded) - Equipment management

### 🧪 Testing & Quality Standards
```typescript
// ✅ Required test structure for HVAC components
describe('HVACComponent', () => {
  it('should render with TwentyCRM styling', () => {
    // Test TwentyCRM integration
  });
  
  it('should handle Polish market data', () => {
    // Test Polish-specific functionality
  });
  
  it('should maintain performance under 300ms', () => {
    // Performance testing
  });
});
```

### 🎨 Design System Compliance
- **Material Design 3 Expressive** - Follow MD3 guidelines
- **Cosmic UX patterns** - Implement space-themed design elements
- **TwentyCRM color palette** - Use existing Twenty color variables
- **Consistent spacing** - Follow Twenty's spacing system
- **Responsive design** - Mobile-first approach with breakpoints

### 🔄 State Management & Data Flow
- **GraphQL integration** - Use TwentyCRM's GraphQL patterns
- **Real-time updates** - WebSocket integration for live data
- **Optimistic updates** - Immediate UI feedback
- **Error boundaries** - Comprehensive error handling
- **Loading states** - Consistent loading indicators

### 🚀 Performance Requirements
- **Search response < 300ms** - Debounced search with caching
- **Bundle size monitoring** - Continuous bundle analysis
- **Memory management** - Proper cleanup of subscriptions
- **Lazy loading** - Progressive component loading
- **Caching strategy** - Intelligent data caching

### 🔐 Security & Authentication
- **TwentyCRM auth integration** - Use existing auth patterns
- **Role-based access** - HVAC technician, manager, admin roles
- **Data encryption** - Sensitive HVAC data protection
- **API security** - Secure external API integrations
- **Audit logging** - Track all HVAC operations

### 📱 Mobile & Accessibility
- **Mobile-first design** - Responsive HVAC interfaces
- **Touch-friendly controls** - Large touch targets for technicians
- **Offline capability** - Critical HVAC data available offline
- **Accessibility compliance** - WCAG 2.1 AA standards
- **Screen reader support** - Proper ARIA labels

### 🔧 Development Workflow
- **Branch naming**: `hvac-feature-name` or `hvac-fix-description`
- **Commit messages**: `feat(hvac): add equipment monitoring dashboard`
- **PR requirements**: Include Playwright tests and bundle size impact
- **Code review**: Focus on TwentyCRM integration and Polish market compliance
- **Documentation**: Update README with Polish and English descriptions

### 🎯 Success Criteria for HVAC Components
- ✅ **Perfect TwentyCRM integration** - Seamless user experience
- ✅ **Bundle size under 4.7MB** - Performance optimization
- ✅ **Polish market compliance** - Legal and cultural requirements
- ✅ **90%+ test coverage** - Comprehensive testing
- ✅ **300ms search performance** - Fast user interactions
- ✅ **Mobile responsiveness** - Works on all devices
- ✅ **Accessibility compliance** - Inclusive design

### 🧠 AI Assistant Behavior for HVAC
- **Never assume HVAC standards** - Always verify Polish regulations
- **Research TwentyCRM patterns** - Use codebase-retrieval extensively
- **Validate bundle impact** - Check size after each change
- **Test Polish scenarios** - Include Polish market test cases
- **Document decisions** - Explain HVAC-specific choices
- **Consider technician workflow** - Design for field workers

---

**"Kontrola Klimatu = Kontrola Sukcesu"** 🌟
**"Gobeklitepe architect-worthy HVAC solutions"** 🏗️
