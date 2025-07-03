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
import { TabType } from './HvacDashboardHeader';
import { HvacDashboardOverview } from './HvacDashboardOverview';
import { HvacDashboardPlaceholder } from './HvacDashboardPlaceholder';

// HVAC Monitoring - Direct imports to avoid circular dependencies
// Simplified - removed complex dependencies
// import { HvacEquipmentManagement } from '../equipment/HvacEquipmentManagement'; // REMOVED: Heavy component moved to lazy loading

// Types
interface HvacDashboardContentProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

// Placeholder functions
const useHVACPerformanceMonitoring = () => ({
  addPerformanceBreadcrumb: (message: string) => console.log('Performance:', message),
});

const trackHVACUserAction = (action: string, context: string, data?: Record<string, unknown>) => {
  console.log('HVAC User Action:', { action, context, data });
};

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

    case 'tickets':
      return (
        <div className="p-4">
          <h3>🎫 Zgłoszenia Serwisowe</h3>
          <p>Lista zgłoszeń serwisowych będzie dostępna wkrótce.</p>
        </div>
      );

    case 'maintenance':
      return (
        <div className="p-4">
          <h3>🔧 Konserwacja i Serwis</h3>
          <p>Moduł konserwacji HVAC będzie dostępny wkrótce.</p>
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
