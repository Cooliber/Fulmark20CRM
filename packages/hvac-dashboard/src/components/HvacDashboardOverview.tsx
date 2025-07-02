/**
 * HVAC Dashboard Overview Tab Component
 * "Pasja rodzi profesjonalizm" - Main overview with stats and quick access
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React from 'react';
import { Card } from 'primereact/card';

// HVAC Components
import { HvacSentryStatus } from '../HvacSentryStatus';
import { HvacSemanticSearch } from '../HvacSemanticSearch';
import { HvacServiceTicketList } from '../HvacServiceTicketList';
import { HvacDashboardWelcome } from './HvacDashboardWelcome';
import { HvacDashboardStats } from './HvacDashboardStats';

// HVAC Fault Tolerance
import {
  HVACSuspenseWrapper,
  HVACRetryWrapper,
  HVACNetworkMonitor
} from '../fault-tolerance';

// HVAC Monitoring
import { trackHVACUserAction } from '../../index';
import { TabType } from './HvacDashboardHeader';

// Types
interface HvacDashboardOverviewProps {
  onTabChange: (tab: TabType) => void;
}

export const HvacDashboardOverview: React.FC<HvacDashboardOverviewProps> = ({
  onTabChange,
}) => {
  // Handle ticket click with tracking
  const handleTicketClick = (ticket: any) => {
    trackHVACUserAction('ticket_click', 'SERVICE_TICKETS', { ticketId: ticket.id });
    console.log('Clicked ticket:', ticket);
    onTabChange('tickets');
  };

  // Handle create ticket with tracking
  const handleCreateTicket = () => {
    trackHVACUserAction('create_ticket_click', 'SERVICE_TICKETS');
    onTabChange('tickets');
  };

  // Handle search result click with tracking
  const handleSearchResultClick = (result: any) => {
    trackHVACUserAction('search_result_click', 'SEMANTIC_SEARCH', {
      resultId: result.id,
      resultType: result.type
    });
    console.log('Clicked search result:', result);
  };

  // Retry function for failed data loading
  const handleRetryDataLoad = async () => {
    // Simulate data reload
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
  };

  return (
    <HVACNetworkMonitor>
      <HVACRetryWrapper
        onRetry={handleRetryDataLoad}
        maxRetries={3}
        autoRetry={false}
        errorMessage="Nie udało się załadować danych dashboard'u."
      >
        <div className="p-4">
          {/* Welcome Message */}
          <HvacDashboardWelcome />

          {/* Stats Grid */}
          <HVACSuspenseWrapper
            skeletonType="card"
            skeletonRows={1}
            loadingMessage="Ładowanie statystyk..."
          >
            <HvacDashboardStats />
          </HVACSuspenseWrapper>

          {/* System Monitoring Section */}
          <HvacSentryStatus />

          {/* Main Content Grid */}
          <div className="grid">
            <div className="col-12 lg:col-6">
              <Card title="Ostatnie Zgłoszenia" className="h-full">
                <HVACSuspenseWrapper
                  skeletonType="list"
                  skeletonRows={3}
                  loadingMessage="Ładowanie zgłoszeń..."
                >
                  <HvacServiceTicketList
                    onTicketClick={handleTicketClick}
                    onCreateTicket={handleCreateTicket}
                  />
                </HVACSuspenseWrapper>
              </Card>
            </div>

            <div className="col-12 lg:col-6">
              <Card title="Wyszukiwanie Semantyczne" className="h-full">
                <HVACSuspenseWrapper
                  skeletonType="card"
                  skeletonRows={2}
                  loadingMessage="Ładowanie wyszukiwarki..."
                >
                  <HvacSemanticSearch
                    defaultQuery=""
                    showStats={true}
                    onResultClick={handleSearchResultClick}
                  />
                </HVACSuspenseWrapper>
              </Card>
            </div>
          </div>
        </div>
      </HVACRetryWrapper>
    </HVACNetworkMonitor>
  );
};
