/**
 * HVAC Dashboard Component
 * "Pasja rodzi profesjonalizm" - Professional dashboard for HVAC
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript without 'any' types
 * - Max 150 lines per component
 * - Functional components only
 */

import React from 'react';
import { Card } from 'twenty-ui/layout';
import { IconApps } from 'twenty-ui/display';

export interface HvacDashboardProps {
  className?: string;
  variant?: 'quotes' | 'finances' | 'inventory' | 'main';
  onActionSelect?: (action: string) => void;
}

/**
 * HVAC Dashboard Component
 * Placeholder implementation for main dashboard functionality
 */
export const HvacDashboard: React.FC<HvacDashboardProps> = ({
  className = '',
  variant = 'main',
  onActionSelect,
}) => {
  const getTitle = () => {
    switch (variant) {
      case 'quotes':
        return 'Dashboard Wycen HVAC';
      case 'finances':
        return 'Dashboard Finansów HVAC';
      case 'inventory':
        return 'Dashboard Magazynu HVAC';
      default:
        return 'Dashboard HVAC';
    }
  };

  const getDescription = () => {
    switch (variant) {
      case 'quotes':
        return 'Moduł zarządzania wycenami jest w trakcie implementacji.';
      case 'finances':
        return 'Moduł zarządzania finansami jest w trakcie implementacji.';
      case 'inventory':
        return 'Moduł zarządzania magazynem jest w trakcie implementacji.';
      default:
        return 'Główny dashboard HVAC jest w trakcie implementacji.';
    }
  };

  const getMetrics = () => {
    switch (variant) {
      case 'quotes':
        return [
          { label: 'Wyceny aktywne', value: '24', color: '#3b82f6' },
          { label: 'Oczekujące', value: '8', color: '#f59e0b' },
          { label: 'Zatwierdzone', value: '16', color: '#10b981' },
        ];
      case 'finances':
        return [
          { label: 'Przychody miesiąc', value: '€32,450', color: '#10b981' },
          { label: 'Należności', value: '€8,230', color: '#f59e0b' },
          { label: 'Marża', value: '28%', color: '#3b82f6' },
        ];
      case 'inventory':
        return [
          { label: 'Pozycje magazynowe', value: '156', color: '#3b82f6' },
          { label: 'Niski stan', value: '12', color: '#ef4444' },
          { label: 'Wartość magazynu', value: '€45,600', color: '#10b981' },
        ];
      default:
        return [
          { label: 'Aktywne zlecenia', value: '23', color: '#3b82f6' },
          { label: 'Klienci', value: '156', color: '#10b981' },
          { label: 'Przychody', value: '€32,450', color: '#8b5cf6' },
        ];
    }
  };

  return (
    <div className={`hvac-dashboard ${className}`}>
      <Card>
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            <IconApps />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
            {getTitle()}
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            {getDescription()}
          </p>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px', 
            marginTop: '24px' 
          }}>
            {getMetrics().map((metric, index) => (
              <div 
                key={index}
                style={{ 
                  padding: '16px', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px' 
                }}
              >
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: metric.color, 
                  marginBottom: '8px' 
                }}>
                  {metric.value}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '8px' 
          }}>
            <p style={{ 
              fontSize: '14px', 
              color: '#374151', 
              margin: 0 
            }}>
              🚀 Funkcje w przygotowaniu: Wykresy w czasie rzeczywistym, 
              automatyzacja procesów, integracja IoT, raporty AI
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
