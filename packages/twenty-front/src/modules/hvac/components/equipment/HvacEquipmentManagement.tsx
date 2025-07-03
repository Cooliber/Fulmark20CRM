/**
 * HVAC Equipment Management Component
 * "Pasja rodzi profesjonalizm" - Professional equipment management for HVAC
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript without 'any' types
 * - Max 150 lines per component
 * - Functional components only
 */

import React from 'react';
import { Card } from 'twenty-ui/layout';
import { IconBuildingSkyscraper } from 'twenty-ui/display';

export interface HvacEquipmentManagementProps {
  className?: string;
  customerId?: string;
  onEquipmentSelect?: (equipmentId: string) => void;
}

/**
 * HVAC Equipment Management Component
 * Placeholder implementation for equipment management functionality
 */
export const HvacEquipmentManagement: React.FC<HvacEquipmentManagementProps> = ({
  className = '',
  customerId,
  onEquipmentSelect,
}) => {
  return (
    <div className={`hvac-equipment-management ${className}`}>
      <Card>
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            <IconBuildingSkyscraper />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
            Zarządzanie Sprzętem HVAC
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            Moduł zarządzania sprzętem HVAC jest w trakcie implementacji.
          </p>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px', 
            marginTop: '24px' 
          }}>
            <div style={{ 
              padding: '16px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px' 
            }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#3b82f6', 
                marginBottom: '8px' 
              }}>
                12
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Urządzenia aktywne
              </div>
            </div>
            <div style={{ 
              padding: '16px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px' 
            }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#f59e0b', 
                marginBottom: '8px' 
              }}>
                3
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Wymagają serwisu
              </div>
            </div>
            <div style={{ 
              padding: '16px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px' 
            }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#10b981', 
                marginBottom: '8px' 
              }}>
                95%
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Sprawność systemu
              </div>
            </div>
          </div>
          {customerId && (
            <p style={{ 
              marginTop: '16px', 
              fontSize: '12px', 
              color: '#9ca3af' 
            }}>
              Klient ID: {customerId}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
