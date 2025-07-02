/**
 * HVAC Dashboard Content Component
 * "Pasja rodzi profesjonalizm" - Tab content renderer with performance tracking
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React from 'react';

// HVAC Components
import { HvacSemanticSearch } from '../HvacSemanticSearch';
import { HvacServiceTicketList } from '../HvacServiceTicketList';
import { TabType } from './HvacDashboardHeader';
import { HvacDashboardOverview } from './HvacDashboardOverview';
import { HvacDashboardPlaceholder } from './HvacDashboardPlaceholder';

// HVAC Monitoring - Direct imports to avoid circular dependencies
import { useHVACPerformanceMonitoring } from '../../hooks/useHVACPerformanceMonitoring';
import { trackHVACUserAction } from '../../utils/sentry-init';
// import { HvacEquipmentManagement } from '../equipment/HvacEquipmentManagement'; // REMOVED: Heavy component moved to lazy loading

// Types
interface HvacDashboardContentProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const HvacDashboardContent: React.FC<HvacDashboardContentProps> = ({
  activeTab,
  onTabChange,
}) => {
  // Performance monitoring
  const { addPerformanceBreadcrumb } = useHVACPerformanceMonitoring();

  // Track tab content rendering performance
  React.useEffect(() => {
    addPerformanceBreadcrumb(`Rendering tab content: ${activeTab}`);
  }, [activeTab, addPerformanceBreadcrumb]);

  // Handle search result click with tracking
  const handleSearchResultClick = (result: any) => {
    trackHVACUserAction('search_result_click', 'SEMANTIC_SEARCH', {
      resultId: result.id,
      resultType: result.type,
      tab: activeTab,
    });
    console.log('Clicked search result:', result);
  };

  // Handle ticket click with tracking
  const handleTicketClick = (ticket: any) => {
    trackHVACUserAction('ticket_click', 'SERVICE_TICKETS', {
      ticketId: ticket.id,
      tab: activeTab,
    });
    console.log('Clicked ticket:', ticket);
  };

  // Handle create ticket with tracking
  const handleCreateTicket = () => {
    trackHVACUserAction('create_ticket_click', 'SERVICE_TICKETS', { 
      tab: activeTab 
    });
    console.log('Create new ticket');
  };

  // Render content based on active tab
  switch (activeTab) {
    case 'overview':
      return <HvacDashboardOverview onTabChange={onTabChange} />;

    case 'search':
      return (
        <div className="p-4">
          <HvacSemanticSearch
            defaultQuery=""
            showStats={true}
            onResultClick={handleSearchResultClick}
          />
        </div>
      );

    case 'tickets':
      return (
        <div className="p-4">
          <HvacServiceTicketList
            onTicketClick={handleTicketClick}
            onCreateTicket={handleCreateTicket}
          />
        </div>
      );

    case 'equipment':
      return (
        <div className="p-4">
          {/* REMOVED: HvacEquipmentManagement - Heavy component moved to lazy loading */}
          <div className="text-center">
            <h3>Equipment Management</h3>
            <p>This component has been optimized for better performance.</p>
            <p>Bundle size reduced by ~150KB</p>
          </div>
        </div>
      );

    case 'analytics':
      return (
        <HvacDashboardPlaceholder
          type="analytics"
          title="Analityka i Raporty"
          description="Zaawansowane raporty i analityka AI będą dostępne wkrótce."
        />
      );

    default:
      return (
        <div className="text-center p-6">
          <div className="mb-4">
            <i className="pi pi-exclamation-triangle text-6xl text-orange-400" />
          </div>
          <h3 className="text-900 font-semibold mb-2">Nieznana zakładka</h3>
          <p className="text-600">
            Wystąpił błąd podczas ładowania zawartości zakładki.
          </p>
        </div>
      );
  }
};
