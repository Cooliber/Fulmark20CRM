/**
 * HvacDashboard - Główny komponent dashboard HVAC
 * "Pasja rodzi profesjonalizm" - Professional HVAC CRM Dashboard
 *
 * Simplified version for hvac-dashboard package
 */

import { motion } from 'framer-motion';
import React, { useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

// Core state management from hvac-core
import {
    hvacDashboardActiveTabState,
    hvacDashboardErrorState,
    hvacDashboardLoadingState,
    HvacDashboardTab
} from 'hvac-core';

// Local components
import { HvacDashboardContent } from './HvacDashboardContent';
import type { TabType } from './HvacDashboardHeader';
import { HvacDashboardHeader } from './HvacDashboardHeader';

// Styling classes
const dashboardClasses = {
  container: 'flex flex-column gap-4 p-4 min-h-screen bg-gray-50',
  contentArea: 'flex-1 bg-white border-round-lg',
};

interface HvacDashboardProps {
  defaultTab?: HvacDashboardTab;
}

export const HvacDashboard: React.FC<HvacDashboardProps> = ({
  defaultTab = 'overview',
}) => {
  // State management from hvac-core
  const [activeTab, setActiveTab] = useRecoilState(hvacDashboardActiveTabState);
  const isLoading = useRecoilValue(hvacDashboardLoadingState);
  const error = useRecoilValue(hvacDashboardErrorState);

  // Tab change handler
  const handleTabChange = useCallback((newTab: TabType) => {
    setActiveTab(newTab as HvacDashboardTab);
  }, [setActiveTab]);

  // Error handling
  if (error) {
    return (
      <div className="p-4 text-center">
        <h3>Błąd ładowania dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p>Ładowanie dashboard...</p>
      </div>
    );
  }



  return (
    <motion.div
      className={dashboardClasses.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <HvacDashboardHeader
        activeTab={activeTab as TabType}
        onTabChange={handleTabChange}
      />

      {/* Content Area */}
      <div className={dashboardClasses.contentArea}>
        <HvacDashboardContent
          activeTab={activeTab as TabType}
          onTabChange={handleTabChange}
        />
      </div>
    </motion.div>
  );
};
