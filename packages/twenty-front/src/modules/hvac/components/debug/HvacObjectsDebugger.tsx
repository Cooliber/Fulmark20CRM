/**
 * HVAC Objects Debugger
 * "Pasja rodzi profesjonalizm" - Debug HVAC Object Integration
 * 
 * Temporary component to debug why HVAC objects don't appear in navigation
 * This component shows all object metadata items and filters to help identify issues
 */

import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import React from 'react';
import styled from '@emotion/styled';

const StyledDebugContainer = styled.div`
  padding: ${({ theme }) => theme.spacing(4)};
  background: ${({ theme }) => theme.background.secondary};
  border-radius: ${({ theme }) => theme.border.radius.md};
  margin: ${({ theme }) => theme.spacing(4)};
  font-family: monospace;
  font-size: 12px;
`;

const StyledSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
`;

const StyledTitle = styled.h3`
  color: ${({ theme }) => theme.font.color.primary};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledObjectItem = styled.div<{ isHvac?: boolean }>`
  padding: ${({ theme }) => theme.spacing(1)};
  margin: ${({ theme }) => theme.spacing(1)} 0;
  background: ${({ theme, isHvac }) => 
    isHvac ? theme.color.green25 : theme.background.primary};
  border-left: 3px solid ${({ theme, isHvac }) => 
    isHvac ? theme.color.green : theme.border.color.light};
  border-radius: ${({ theme }) => theme.border.radius.sm};
`;

const StyledProperty = styled.div`
  margin: 2px 0;
  color: ${({ theme }) => theme.font.color.secondary};
`;

const StyledValue = styled.span<{ highlight?: boolean }>`
  color: ${({ theme, highlight }) => 
    highlight ? theme.color.blue : theme.font.color.primary};
  font-weight: ${({ highlight }) => highlight ? 'bold' : 'normal'};
`;

// HVAC object names we're looking for
const HVAC_OBJECT_NAMES = [
  'hvacEquipment',
  'hvacServiceTickets', 
  'hvacTechnicians',
  'hvacMaintenanceRecords'
];

export const HvacObjectsDebugger: React.FC = () => {
  const { objectMetadataItems } = useObjectMetadataItems();
  const { activeNonSystemObjectMetadataItems } = useFilteredObjectMetadataItems();

  // Filter for HVAC objects
  const hvacObjects = objectMetadataItems.filter(item => 
    HVAC_OBJECT_NAMES.includes(item.namePlural) ||
    item.namePlural.toLowerCase().includes('hvac') ||
    item.nameSingular.toLowerCase().includes('hvac')
  );

  const activeHvacObjects = activeNonSystemObjectMetadataItems.filter(item => 
    HVAC_OBJECT_NAMES.includes(item.namePlural) ||
    item.namePlural.toLowerCase().includes('hvac') ||
    item.nameSingular.toLowerCase().includes('hvac')
  );

  return (
    <StyledDebugContainer>
      <StyledTitle>🔍 HVAC Objects Debug Information</StyledTitle>
      
      <StyledSection>
        <StyledTitle>📊 Summary</StyledTitle>
        <StyledProperty>
          Total Object Metadata Items: <StyledValue highlight>{objectMetadataItems.length}</StyledValue>
        </StyledProperty>
        <StyledProperty>
          Active Non-System Objects: <StyledValue highlight>{activeNonSystemObjectMetadataItems.length}</StyledValue>
        </StyledProperty>
        <StyledProperty>
          HVAC Objects Found (All): <StyledValue highlight>{hvacObjects.length}</StyledValue>
        </StyledProperty>
        <StyledProperty>
          HVAC Objects Found (Active): <StyledValue highlight>{activeHvacObjects.length}</StyledValue>
        </StyledProperty>
      </StyledSection>

      <StyledSection>
        <StyledTitle>🎯 Expected HVAC Objects</StyledTitle>
        {HVAC_OBJECT_NAMES.map(name => {
          const found = objectMetadataItems.find(item => item.namePlural === name);
          const isActive = activeNonSystemObjectMetadataItems.find(item => item.namePlural === name);
          
          return (
            <StyledProperty key={name}>
              {name}: <StyledValue highlight={!!found}>
                {found ? '✅ Found' : '❌ Missing'}
              </StyledValue>
              {found && (
                <>
                  {' | Active: '}
                  <StyledValue highlight={!!isActive}>
                    {isActive ? '✅ Yes' : '❌ No'}
                  </StyledValue>
                  {' | System: '}
                  <StyledValue highlight={!found.isSystem}>
                    {found.isSystem ? '❌ Yes' : '✅ No'}
                  </StyledValue>
                </>
              )}
            </StyledProperty>
          );
        })}
      </StyledSection>

      <StyledSection>
        <StyledTitle>📋 All HVAC Objects Details</StyledTitle>
        {hvacObjects.length === 0 ? (
          <StyledProperty>❌ No HVAC objects found in metadata</StyledProperty>
        ) : (
          hvacObjects.map(item => (
            <StyledObjectItem key={item.id} isHvac>
              <StyledProperty>
                <strong>{item.namePlural}</strong> ({item.nameSingular})
              </StyledProperty>
              <StyledProperty>
                ID: <StyledValue>{item.id}</StyledValue>
              </StyledProperty>
              <StyledProperty>
                Standard ID: <StyledValue>{item.standardId}</StyledValue>
              </StyledProperty>
              <StyledProperty>
                Active: <StyledValue highlight={item.isActive}>
                  {item.isActive ? '✅ Yes' : '❌ No'}
                </StyledValue>
              </StyledProperty>
              <StyledProperty>
                System: <StyledValue highlight={!item.isSystem}>
                  {item.isSystem ? '❌ Yes' : '✅ No'}
                </StyledValue>
              </StyledProperty>
              <StyledProperty>
                Label: <StyledValue>{item.labelPlural}</StyledValue>
              </StyledProperty>
              <StyledProperty>
                Icon: <StyledValue>{item.icon}</StyledValue>
              </StyledProperty>
            </StyledObjectItem>
          ))
        )}
      </StyledSection>

      <StyledSection>
        <StyledTitle>🔍 Sample Non-HVAC Objects (for comparison)</StyledTitle>
        {activeNonSystemObjectMetadataItems.slice(0, 3).map(item => (
          <StyledObjectItem key={item.id}>
            <StyledProperty>
              <strong>{item.namePlural}</strong> ({item.nameSingular})
            </StyledProperty>
            <StyledProperty>
              Active: <StyledValue highlight>{item.isActive ? 'Yes' : 'No'}</StyledValue>
            </StyledProperty>
            <StyledProperty>
              System: <StyledValue highlight>{item.isSystem ? 'Yes' : 'No'}</StyledValue>
            </StyledProperty>
          </StyledObjectItem>
        ))}
      </StyledSection>

      <StyledSection>
        <StyledTitle>🚨 Potential Issues</StyledTitle>
        <StyledProperty>
          1. HVAC objects not synced to database yet
        </StyledProperty>
        <StyledProperty>
          2. HVAC objects marked as system objects
        </StyledProperty>
        <StyledProperty>
          3. HVAC objects not active
        </StyledProperty>
        <StyledProperty>
          4. Workspace sync not completed
        </StyledProperty>
        <StyledProperty>
          5. HVAC module not properly registered
        </StyledProperty>
      </StyledSection>
    </StyledDebugContainer>
  );
};
