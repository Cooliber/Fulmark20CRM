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
// Placeholder Card component
const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
  className?: string;
}> = ({ children, style, title, className }) => (
  <div
    style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: 'white',
      ...style
    }}
    className={className}
  >
    {title && <h3 style={{ marginTop: 0, marginBottom: '16px' }}>{title}</h3>}
    {children}
  </div>
);

// Local dashboard components
import { HvacDashboardStats } from './HvacDashboardStats';
import { HvacDashboardWelcome } from './HvacDashboardWelcome';

// Placeholder functions and components for local use
const trackHVACUserAction = (action: string, context: string, data?: Record<string, unknown>) => {
  console.log('HVAC User Action:', { action, context, data });
};

// Placeholder components
const HVACNetworkMonitor: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>
    {children}
  </div>
);

const HVACRetryWrapper: React.FC<{
  children: React.ReactNode;
  onRetry?: () => Promise<void>;
  maxRetries?: number;
  autoRetry?: boolean;
  errorMessage?: string;
}> = ({ children }) => (
  <div>{children}</div>
);

const HVACSuspenseWrapper: React.FC<{
  children: React.ReactNode;
  skeletonType?: string;
  skeletonRows?: number;
  loadingMessage?: string;
}> = ({ children }) => (
  <div>{children}</div>
);

const HvacSemanticSearch: React.FC<{
  defaultQuery?: string;
  showStats?: boolean;
  onResultClick?: (result: any) => void;
}> = () => (
  <Card style={{ padding: '20px', textAlign: 'center' }}>
    <h4>Wyszukiwanie Semantyczne HVAC</h4>
    <p>Zaawansowane wyszukiwanie jest w trakcie ładowania...</p>
  </Card>
);

const HvacServiceTicketList: React.FC<{
  onTicketClick?: (ticket: any) => void;
  onCreateTicket?: () => void;
}> = () => (
  <Card style={{ padding: '20px', textAlign: 'center' }}>
    <h4>Lista Zgłoszeń Serwisowych</h4>
    <p>Lista zgłoszeń jest w trakcie ładowania...</p>
  </Card>
);

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

          {/* System Monitoring Section - Placeholder */}
          <Card title="Status Systemu" style={{ marginBottom: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ color: '#10b981', fontSize: '14px' }}>✅ System działa prawidłowo</div>
            </div>
          </Card>

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
