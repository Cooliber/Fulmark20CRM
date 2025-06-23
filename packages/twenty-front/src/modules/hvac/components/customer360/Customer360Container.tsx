/**
 * Customer 360 Container - Main orchestrator component
 * "Pasja rodzi profesjonalizm" - Unified Customer 360 architecture
 *
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';

// HVAC Error Handling and Monitoring
import {
  HVACErrorBoundary,
  trackHVACUserAction,
} from '../../index';

// Customer 360 Hook and Components
import { useCustomer360 } from '../../hooks/useCustomer360';
import { Customer360LoadingState } from './Customer360LoadingState';
import { Customer360ErrorState } from './Customer360ErrorState';
import { Customer360Content } from './Customer360Content';

interface Customer360ContainerProps {
  customerId: string;
  onClose?: () => void;
  initialTab?: number;
}

export const Customer360Container: React.FC<Customer360ContainerProps> = ({
  customerId,
  onClose,
  initialTab = 0,
}) => {
  // Use Customer 360 hook for data management
  const {
    data: customerData,
    loading,
    error,
    refreshCustomerData,
    clearError,
  } = useCustomer360(customerId, {
    autoLoad: true,
    enableCache: true,
    onError: (error) => {
      trackHVACUserAction('customer_360_error', 'CUSTOMER_360', {
        customerId,
        error: error.message,
      });
    },
    onDataLoaded: (data) => {
      trackHVACUserAction('customer_360_loaded', 'CUSTOMER_360', {
        customerId,
        dataSize: JSON.stringify(data).length,
      });
    },
  });

  // Handle tab change with tracking
  const handleTabChange = useCallback((newTabIndex: number) => {
    const tabNames = ['profile', 'communication', 'equipment', 'analytics'];
    const tabName = tabNames[newTabIndex] || 'unknown';

    trackHVACUserAction(
      `customer360_tab_change_${tabName}`,
      'CUSTOMER_360',
      {
        customerId,
        fromTab: initialTab,
        toTab: newTabIndex,
        tabName
      }
    );
  }, [customerId, initialTab]);

  // Handle refresh action
  const handleRefresh = useCallback(async () => {
    trackHVACUserAction('customer_360_refresh', 'CUSTOMER_360', { customerId });
    await refreshCustomerData();
  }, [customerId, refreshCustomerData]);

  // Loading state
  if (loading) {
    return <Customer360LoadingState />;
  }

  // Error state
  if (error || !customerData) {
    return (
      <Customer360ErrorState
        error={error || 'Nie udało się załadować danych klienta'}
        onRetry={handleRefresh}
        onClearError={clearError}
      />
    );
  }

  return (
    <HVACErrorBoundary
      context="CUSTOMER_360"
      customTitle="Błąd w Customer 360"
      customMessage="Wystąpił problem z wyświetleniem danych klienta."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="customer-360-container"
      >
        <Customer360Content
          customerData={customerData}
          customerId={customerId}
          initialTab={initialTab}
          onClose={onClose}
          onRefresh={handleRefresh}
          onTabChange={handleTabChange}
        />
      </motion.div>
    </HVACErrorBoundary>
  );
};
