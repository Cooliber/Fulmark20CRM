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
import {
    HvacAnalyticsIcon,
    HvacEquipmentIcon,
    HvacMaintenanceIcon,
    HvacOverviewIcon,
    HvacSearchIcon,
    HvacTicketsIcon
} from './icons/HvacIconBridge';

// Types - Updated to match HVAC state management
export type TabType = 'overview' | 'search' | 'tickets' | 'equipment' | 'maintenance' | 'analytics';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<any>;
}

interface HvacDashboardHeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

// Tab configuration - Using SOTA HvacIconBridge system
const tabs: Tab[] = [
  { id: 'overview', label: 'Przegląd', icon: HvacOverviewIcon },
  { id: 'search', label: 'Wyszukiwanie', icon: HvacSearchIcon },
  { id: 'tickets', label: 'Zgłoszenia', icon: HvacTicketsIcon },
  { id: 'equipment', label: 'Sprzęt', icon: HvacEquipmentIcon },
  { id: 'maintenance', label: 'Konserwacja', icon: HvacMaintenanceIcon },
  { id: 'analytics', label: 'Analityka', icon: HvacAnalyticsIcon },
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
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Export tabs for use in other components
export { tabs };
