/**
 * HVAC Navigation Section
 * "Pasja rodzi profesjonalizm" - Professional HVAC Navigation
 * 
 * Custom navigation section for HVAC functionality
 */

import { AppPath } from '@/types/AppPath';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import React from 'react';
import {
    IconCalendar,
    IconChartCandle,
    IconGauge,
    IconPhone,
    IconUsers
} from 'twenty-ui';

export const HvacNavigationSection: React.FC = () => {
  return (
    <NavigationDrawerSection>
      <NavigationDrawerSectionTitle label="HVAC" />
      <NavigationDrawerItem
        label="Dashboard"
        to={AppPath.HvacDashboard}
        Icon={IconGauge}
      />
      <NavigationDrawerItem
        label="Planer Serwisowy"
        to={AppPath.HvacServicePlanner}
        Icon={IconCalendar}
      />
      <NavigationDrawerItem
        label="Dyspozytornia"
        to={AppPath.HvacDispatch}
        Icon={IconUsers}
      />
      <NavigationDrawerItem
        label="Mobilny"
        to={AppPath.HvacMobile}
        Icon={IconPhone}
      />
      <NavigationDrawerItem
        label="Analityka"
        to={AppPath.HvacAnalytics}
        Icon={IconChartCandle}
      />
    </NavigationDrawerSection>
  );
};
