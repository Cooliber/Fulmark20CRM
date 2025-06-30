/**
 * HVAC Objects Navigation Section
 * "Pasja rodzi profesjonalizm" - Professional HVAC Objects Navigation
 * 
 * Displays HVAC objects (Equipment, Service Tickets, etc.) in the main navigation
 * Integrates with Twenty's object metadata system
 */

import { NavigationDrawerItemForObjectMetadataItem } from '@/object-metadata/components/NavigationDrawerItemForObjectMetadataItem';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { useNavigationSection } from '@/ui/navigation/navigation-drawer/hooks/useNavigationSection';
import React from 'react';
import { useRecoilValue } from 'recoil';

// HVAC object names that should appear in this section
const HVAC_OBJECT_NAMES = [
  'hvacEquipment',
  'hvacServiceTickets', 
  'hvacTechnicians',
  'hvacMaintenanceRecords'
];

export const HvacObjectsNavigationSection: React.FC = () => {
  const { activeNonSystemObjectMetadataItems } = useFilteredObjectMetadataItems();
  
  const { toggleNavigationSection, isNavigationSectionOpenState } =
    useNavigationSection('HvacObjects');
  const isNavigationSectionOpen = useRecoilValue(isNavigationSectionOpenState);

  // Filter for HVAC objects only
  const hvacObjectMetadataItems = activeNonSystemObjectMetadataItems.filter(
    (item) => HVAC_OBJECT_NAMES.includes(item.namePlural)
  );

  // Sort HVAC objects in a logical order
  const sortedHvacObjectMetadataItems = hvacObjectMetadataItems.sort((a, b) => {
    const order = {
      'hvacServiceTickets': 1,
      'hvacEquipment': 2, 
      'hvacTechnicians': 3,
      'hvacMaintenanceRecords': 4
    };
    
    const aOrder = order[a.namePlural as keyof typeof order] || 999;
    const bOrder = order[b.namePlural as keyof typeof order] || 999;
    
    return aOrder - bOrder;
  });

  // Temporary: Always show debugger for now
  return (
    <NavigationDrawerSection>
      <NavigationDrawerAnimatedCollapseWrapper>
        <NavigationDrawerSectionTitle
          label="HVAC Objects"
          onClick={() => toggleNavigationSection()}
        />
      </NavigationDrawerAnimatedCollapseWrapper>
      {isNavigationSectionOpen && (
        <>
          <HvacObjectsDebugger />
          {sortedHvacObjectMetadataItems.map((objectMetadataItem) => (
            <NavigationDrawerItemForObjectMetadataItem
              key={`hvac-navigation-drawer-item-${objectMetadataItem.id}`}
              objectMetadataItem={objectMetadataItem}
            />
          ))}
        </>
      )}
    </NavigationDrawerSection>
  );
};
