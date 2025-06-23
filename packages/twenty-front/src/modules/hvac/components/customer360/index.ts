/**
 * Customer 360 Module Exports
 * "Pasja rodzi profesjonalizm" - Unified Customer 360 architecture
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Modular component architecture
 * - Max 150 lines per component
 */

// Main Container
export { Customer360Container } from './Customer360Container';

// State Components
export { Customer360LoadingState } from './Customer360LoadingState';
export { Customer360ErrorState } from './Customer360ErrorState';
export { Customer360Content } from './Customer360Content';

// Sub-components
export { Customer360Header } from './Customer360Header';
export { Customer360KPICards } from './Customer360KPICards';
export { Customer360ProfileTab } from './Customer360ProfileTab';
export { Customer360CommunicationTab } from './Customer360CommunicationTab';
export { Customer360EquipmentTab } from './Customer360EquipmentTab';
export { Customer360AnalyticsTab } from './Customer360AnalyticsTab';

// Types (to be expanded in future phases)
export interface Customer360Data {
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    nip?: string;
    regon?: string;
    address?: string;
    status: 'active' | 'inactive' | 'prospect' | 'vip';
    totalValue: number;
    lifetimeValue: number;
    satisfactionScore: number;
  };
  insights?: {
    financialMetrics: {
      totalRevenue: number;
      lifetimeValue: number;
      averageOrderValue: number;
    };
    riskIndicators: {
      churnRisk: number;
      paymentRisk: number;
    };
  };
  equipment: any[];
  tickets: any[];
  communications: any[];
  contracts: any[];
}

export interface Customer360Props {
  customerId: string;
  onClose?: () => void;
  initialTab?: number;
}
