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
    IconPhone,
    IconTool
} from 'twenty-ui/display';

export const HvacNavigationSection: React.FC = () => {
  return (
    <NavigationDrawerSection>
      <NavigationDrawerSectionTitle label="HVAC" />
      <NavigationDrawerItem
        label="Planer Serwisowy"
        to={AppPath.HvacServicePlanner}
        Icon={IconCalendar}
      />
      <NavigationDrawerItem
        label="Harmonogram"
        to={`${AppPath.HvacServicePlanner}#scheduling`}
        Icon={IconCalendar}
      />
      <NavigationDrawerItem
        label="Konserwacja"
        to={`${AppPath.HvacServicePlanner}#maintenance`}
        Icon={IconTool}
      />
      <NavigationDrawerItem
        label="Mobilny"
        to={`${AppPath.HvacServicePlanner}#mobile`}
        Icon={IconPhone}
      />
      <NavigationDrawerItem
        label="Analityka"
        to={`${AppPath.HvacServicePlanner}#analytics`}
        Icon={IconChartCandle}
      />
    </NavigationDrawerSection>
  );
};
