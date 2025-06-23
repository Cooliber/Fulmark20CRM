/**
 * Customer 360 Content Component
 * "Pasja rodzi profesjonalizm" - Main content orchestrator
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React, { useState, useCallback } from 'react';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';

// Customer 360 Sub-components
import { Customer360Header } from './Customer360Header';
import { Customer360KPICards } from './Customer360KPICards';
import { Customer360ProfileTab } from './Customer360ProfileTab';
import { Customer360CommunicationTab } from './Customer360CommunicationTab';
import { Customer360EquipmentTab } from './Customer360EquipmentTab';
import { Customer360AnalyticsTab } from './Customer360AnalyticsTab';

// Types
import { Customer360Data } from '../../services/CustomerAPIService';

interface Customer360ContentProps {
  customerData: Customer360Data;
  customerId: string;
  initialTab: number;
  onClose?: () => void;
  onRefresh: () => void;
  onTabChange: (tabIndex: number) => void;
}

export const Customer360Content: React.FC<Customer360ContentProps> = ({
  customerData,
  customerId,
  initialTab,
  onClose,
  onRefresh,
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Handle tab change with callback
  const handleTabChange = useCallback((newTabIndex: number) => {
    setActiveTab(newTabIndex);
    onTabChange(newTabIndex);
  }, [onTabChange]);

  return (
    <div className="customer-360-content">
      {/* Header Section */}
      <Customer360Header 
        customer={customerData.customer}
        onClose={onClose}
        onRefresh={onRefresh}
      />

      {/* KPI Cards */}
      <Customer360KPICards 
        customer={customerData.customer}
        insights={customerData.insights}
      />

      {/* Main Content Tabs */}
      <Card>
        <TabView 
          activeIndex={activeTab} 
          onTabChange={(e) => handleTabChange(e.index)}
        >
          <TabPanel header="Profil" leftIcon="pi pi-user">
            <Customer360ProfileTab 
              customer={customerData.customer}
              onUpdate={onRefresh}
            />
          </TabPanel>
          
          <TabPanel header="Komunikacja" leftIcon="pi pi-comments">
            <Customer360CommunicationTab 
              customerId={customerId}
              communications={customerData.communications}
            />
          </TabPanel>
          
          <TabPanel header="Urządzenia" leftIcon="pi pi-cog">
            <Customer360EquipmentTab 
              customerId={customerId}
              equipment={customerData.equipment}
            />
          </TabPanel>
          
          <TabPanel header="Analityka" leftIcon="pi pi-chart-line">
            <Customer360AnalyticsTab 
              customerId={customerId}
              insights={customerData.insights}
            />
          </TabPanel>
        </TabView>
      </Card>
    </div>
  );
};
