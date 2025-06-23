/**
 * HVAC Navigation Section
 * "Pasja rodzi profesjonalizm" - Professional HVAC Navigation
 * 
 * Custom navigation section for HVAC functionality
 */

import React from 'react';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { AppPath } from '@/types/AppPath';
import { useLingui } from '@lingui/react/macro';
import { 
  IconCalendar, 
  IconWrench, 
  IconMobile, 
  IconChartBar,
  IconTool,
  IconUsers,
  IconMapPin,
} from 'twenty-ui/display';

export const HvacNavigationSection: React.FC = () => {
  const { t } = useLingui();

  return (
    <NavigationDrawerSection title="HVAC">
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
        Icon={IconWrench}
      />
      <NavigationDrawerItem
        label="Mobilny"
        to={`${AppPath.HvacServicePlanner}#mobile`}
        Icon={IconMobile}
      />
      <NavigationDrawerItem
        label="Analityka"
        to={`${AppPath.HvacServicePlanner}#analytics`}
        Icon={IconChartBar}
      />
    </NavigationDrawerSection>
  );
};
