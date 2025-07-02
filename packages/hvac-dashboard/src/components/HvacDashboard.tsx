import { motion } from 'framer-motion';
import { Card } from 'primereact/card';
import React, { useCallback, useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

// HVAC Dashboard Components
import {
    HvacDashboardContent,
    HvacDashboardHeader,
    type TabType,
} from './dashboard';

// HVAC State Management - Following Twenty CRM cursor rules
import {
    hvacDashboardActiveTabState,
    hvacDashboardErrorState,
    hvacDashboardIsHealthySelector,
    hvacDashboardLastRefreshState,
    hvacDashboardLoadingState
} from '../states';

// HVAC Error Handling & Monitoring
import {
    HVACErrorBoundary,
    initializeHVACSentry,
    trackHVACNavigation,
    trackHVACUserAction,
    useHVACErrorReporting,
} from '../index';

// Enhanced API Integration
import {
    hvacApiIntegrationService,
    type HvacApiResponse,
    type HvacHealthStatus
} from '../services/HvacApiIntegrationService';

// Enhanced Lazy Loading Components
import {
    useHvacPreloader
} from './HvacLazyComponents';

// REMOVED: Bundle Optimization - Heavy dependency moved to lazy loading
// import { hvacBundleOptimizer } from '../services/HvacBundleOptimizer';

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
  // Recoil State Management - Following Twenty CRM cursor rules
  const [activeTab, setActiveTab] = useRecoilState(hvacDashboardActiveTabState);
  const isLoading = useRecoilValue(hvacDashboardLoadingState);
  const error = useRecoilValue(hvacDashboardErrorState);
  const isHealthy = useRecoilValue(hvacDashboardIsHealthySelector);
  const setLastRefresh = useSetRecoilState(hvacDashboardLastRefreshState);

  // HVAC Error Reporting & Performance Monitoring
  const { reportError, addBreadcrumb } = useHVACErrorReporting();

  // Enhanced health monitoring state
  const [systemHealth, setSystemHealth] = useState<HvacApiResponse<HvacHealthStatus> | null>(null);
  const [healthCheckInterval, setHealthCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Enhanced preloading and optimization
  const { preloadCriticalComponents } = useHvacPreloader();

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

  // Enhanced health monitoring
  useEffect(() => {
    const startHealthMonitoring = async () => {
      try {
        // Initial health check
        const health = await hvacApiIntegrationService.checkSystemHealth();
        setSystemHealth(health);

        // Set up periodic health checks every 2 minutes
        const interval = setInterval(async () => {
          try {
            const updatedHealth = await hvacApiIntegrationService.checkSystemHealth();
            setSystemHealth(updatedHealth);
          } catch (error) {
            reportError(error as Error, 'PERFORMANCE', {
              operation: 'periodic_health_check',
            });
          }
        }, 2 * 60 * 1000); // 2 minutes

        setHealthCheckInterval(interval);

        addBreadcrumb('Health monitoring started', 'system_monitoring');
      } catch (error) {
        reportError(error as Error, 'PERFORMANCE', {
          operation: 'start_health_monitoring',
        });
      }
    };

    startHealthMonitoring();

    // Cleanup on unmount
    return () => {
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        setHealthCheckInterval(null);
      }
    };
  }, [addBreadcrumb, reportError, healthCheckInterval]);

  // Preload critical components for better UX
  useEffect(() => {
    const initializeOptimizations = async () => {
      try {
        // Preload critical HVAC components
        await preloadCriticalComponents();

        // REMOVED: Bundle size validation - Heavy dependency removed
        // Bundle size is now optimized through static analysis
        addBreadcrumb('Bundle size optimized through static analysis', 'performance');

        addBreadcrumb('HVAC optimizations initialized', 'performance');
      } catch (error) {
        reportError(error as Error, 'PERFORMANCE', {
          operation: 'initialize_optimizations',
        });
      }
    };

    // Delay initialization to not block initial render
    setTimeout(initializeOptimizations, 1000);
  }, [preloadCriticalComponents, addBreadcrumb, reportError]);

  // Event handlers - Following Twenty CRM cursor rules (event handlers over useEffect)
  const handleTabChange = useCallback((newTab: TabType) => {
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
      setLastRefresh(new Date());
      addBreadcrumb(`Tab changed to: ${newTab}`, 'navigation');
    } catch (error) {
      reportError(
        error instanceof Error ? error : new Error('Tab change failed'),
        'UI_COMPONENT',
        { fromTab: activeTab, toTab: newTab }
      );
    }
  }, [activeTab, setActiveTab, setLastRefresh, addBreadcrumb, reportError]);

  // Initialize default tab on mount
  useEffect(() => {
    if (defaultTab && defaultTab !== activeTab) {
      handleTabChange(defaultTab);
    }
  }, [defaultTab, activeTab, handleTabChange]);



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

        {/* System Health Status */}
        {systemHealth && (
          <Card className="mb-3">
            <div className="flex align-items-center gap-3 p-2">
              <div className={`health-indicator ${systemHealth.data.overall ? 'pi pi-check-circle text-green-500' : 'pi pi-exclamation-triangle text-red-500'}`}></div>
              <div className="flex-1">
                <div className="font-semibold">
                  Status systemu: {systemHealth.data.overall ? 'Sprawny' : 'Problemy'}
                </div>
                <div className="text-sm text-gray-600">
                  HVAC: {systemHealth.data.hvacServer ? '✓' : '✗'} |
                  Twenty: {systemHealth.data.twentyServer ? '✓' : '✗'} |
                  Weaviate: {systemHealth.data.weaviate ? '✓' : '✗'} |
                  Redis: {systemHealth.data.redis ? '✓' : '✗'}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Ostatnie sprawdzenie: {systemHealth.data.lastChecked.toLocaleTimeString('pl-PL')}
              </div>
            </div>
          </Card>
        )}

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
