/**
 * HVAC Maintenance Dashboard Component
 * "Pasja rodzi profesjonalizm" - Professional maintenance dashboard for HVAC
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript without 'any' types
 * - Max 150 lines per component
 * - Functional components only
 */

import React from 'react';
import { Card } from 'twenty-ui/layout';
import { IconClockHour8 } from 'twenty-ui/display';

export interface HvacMaintenanceDashboardProps {
  className?: string;
  equipmentId?: string;
  onMaintenanceSelect?: (maintenanceId: string) => void;
}

/**
 * HVAC Maintenance Dashboard Component
 * Placeholder implementation for maintenance dashboard functionality
 */
export const HvacMaintenanceDashboard: React.FC<HvacMaintenanceDashboardProps> = ({
  className = '',
  equipmentId,
  onMaintenanceSelect,
}) => {
  return (
    <div className={`hvac-maintenance-dashboard ${className}`}>
      <Card>
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            <IconClockHour8 />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
            Dashboard Konserwacji HVAC
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            Moduł dashboard konserwacji jest w trakcie implementacji.
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
                color: '#10b981', 
                marginBottom: '8px' 
              }}>
                15
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Przeglądy wykonane
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
                5
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Zaplanowane na dziś
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
                color: '#ef4444', 
                marginBottom: '8px' 
              }}>
                2
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Przeterminowane
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
                color: '#8b5cf6', 
                marginBottom: '8px' 
              }}>
                98%
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Skuteczność konserwacji
              </div>
            </div>
          </div>
          {equipmentId && (
            <p style={{ 
              marginTop: '16px', 
              fontSize: '12px', 
              color: '#9ca3af' 
            }}>
              Sprzęt ID: {equipmentId}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
