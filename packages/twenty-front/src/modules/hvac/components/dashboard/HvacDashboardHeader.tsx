/**
 * HVAC Dashboard Header Component
 * "Pasja rodzi profesjonalizm" - Dashboard header with navigation tabs
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React from 'react';
import { Button } from 'primereact/button';
import { IconSearch, IconTool, IconCalendar } from 'twenty-ui/display';
import { IconTag as IconTicket, IconGauge as IconChartBar } from 'twenty-ui/display';

// Types
export type TabType = 'overview' | 'search' | 'tickets' | 'equipment' | 'analytics';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ size: number }>;
}

interface HvacDashboardHeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

// Tab configuration
const tabs: Tab[] = [
  { id: 'overview', label: 'Przegląd', icon: IconChartBar },
  { id: 'search', label: 'Wyszukiwanie', icon: IconSearch },
  { id: 'tickets', label: 'Zgłoszenia', icon: IconTicket },
  { id: 'equipment', label: 'Sprzęt', icon: IconTool },
  { id: 'analytics', label: 'Analityka', icon: IconChartBar },
];

// PrimeFlex classes
const headerClasses = {
  container: 'flex justify-content-between align-items-center pb-3 border-bottom-1 border-gray-200',
  content: 'flex-1',
  title: 'text-3xl font-bold text-900 m-0 flex align-items-center gap-3',
  subtitle: 'text-base text-600 mt-1 m-0',
  tabContainer: 'flex gap-1 bg-white p-1 border-round border-1 border-gray-200',
};

export const HvacDashboardHeader: React.FC<HvacDashboardHeaderProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className={headerClasses.container}>
      {/* Header Content */}
      <div className={headerClasses.content}>
        <h1 className={headerClasses.title}>
          🏗️ Fulmark HVAC CRM
        </h1>
        <p className={headerClasses.subtitle}>
          Profesjonalny system zarządzania usługami HVAC z AI
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={headerClasses.tabContainer}>
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            label={tab.label}
            icon={<tab.icon size={16} />}
            className={`p-button-text ${
              activeTab === tab.id 
                ? 'p-button-primary' 
                : 'p-button-secondary'
            }`}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </div>
    </div>
  );
};

// Export tabs for use in other components
export { tabs };
