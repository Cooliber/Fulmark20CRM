import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { motion } from 'framer-motion';

// HVAC Dashboard Components
import {
  HvacDashboardHeader,
  HvacDashboardContent,
  type TabType,
} from './dashboard';

// HVAC Error Handling & Monitoring
import {
  HVACErrorBoundary,
  useHVACErrorReporting,
  trackHVACUserAction,
  trackHVACNavigation,
  initializeHVACSentry,
} from '../index';

// PrimeReact/PrimeFlex styling classes
const dashboardClasses = {
  container: 'flex flex-column gap-4 p-4 min-h-screen bg-gray-50',
  contentArea: 'flex-1 bg-white border-round-lg',
};

interface HvacDashboardProps {
  defaultTab?: TabType;
}

export const HvacDashboard: React.FC<HvacDashboardProps> = ({
  defaultTab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  // HVAC Error Reporting & Performance Monitoring
  const { reportError, addBreadcrumb } = useHVACErrorReporting();

  // Initialize Sentry on component mount
  useEffect(() => {
    const initializeSentry = async () => {
      try {
        await initializeHVACSentry({
          enablePerformanceMonitoring: true,
          enableUserFeedback: true,
          customTags: {
            component: 'hvac-dashboard',
            version: '1.0.0',
          },
        });

        addBreadcrumb('HVAC Dashboard initialized', 'component_lifecycle');
      } catch (error) {
        console.error('Failed to initialize Sentry for HVAC Dashboard:', error);
      }
    };

    initializeSentry();
  }, [addBreadcrumb]);

  // Handle tab change with tracking
  const handleTabChange = (newTab: TabType) => {
    try {
      // Track navigation
      trackHVACNavigation(activeTab, newTab, {
        component: 'hvac-dashboard',
        timestamp: new Date().toISOString(),
      });

      // Track user action
      trackHVACUserAction(
        `tab_change_${newTab}`,
        'UI_COMPONENT',
        { fromTab: activeTab, toTab: newTab }
      );

      setActiveTab(newTab);
      addBreadcrumb(`Tab changed to: ${newTab}`, 'navigation');
    } catch (error) {
      reportError(
        error instanceof Error ? error : new Error('Tab change failed'),
        'UI_COMPONENT',
        { fromTab: activeTab, toTab: newTab }
      );
    }
  };



  return (
    <HVACErrorBoundary
      context="UI_COMPONENT"
      customTitle="Błąd w Dashboard HVAC"
      customMessage="Wystąpił problem z wyświetleniem dashboard'u HVAC CRM. Spróbuj odświeżyć stronę."
      showReportButton={true}
    >
      <motion.div
        className={dashboardClasses.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <HvacDashboardHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Content Area */}
        <Card className={dashboardClasses.contentArea}>
          <HVACErrorBoundary
            context="UI_COMPONENT"
            customTitle="Błąd w zawartości zakładki"
            customMessage="Wystąpił problem z wyświetleniem zawartości zakładki."
          >
            <HvacDashboardContent
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </HVACErrorBoundary>
        </Card>
      </motion.div>
    </HVACErrorBoundary>
  );
};
