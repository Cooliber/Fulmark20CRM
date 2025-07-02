/**
 * AdvancedAnalyticsDashboardSimple - Simplified Analytics Dashboard
 * "Pasja rodzi profesjonalizm" - Bundle Size Optimized Version
 * 
 * This is a simplified version that removes heavy PrimeReact dependencies
 * to reduce bundle size while maintaining core functionality
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from 'twenty-ui/input';
import { IconRefresh, IconChartCandle } from 'twenty-ui/display';
import { HvacCard } from '../ui/HvacNativeComponents';

// HVAC services and hooks
import { useCustomerDataFlow } from '../../hooks/useCustomerDataFlow';
import { useQuoteManagement } from '../../hooks/useQuoteManagement';
import { usePipelineAnalytics } from '../../hooks/usePipelineAnalytics';
import { trackHVACUserAction } from '../../index';

interface AdvancedAnalyticsDashboardProps {
  className?: string;
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  className = '',
}) => {
  // State for filters
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  // Hooks for data
  const {
    analytics: flowAnalytics,
    loading: flowLoading,
    loadAnalytics: loadFlowAnalytics,
  } = useCustomerDataFlow({
    autoLoad: false,
  });

  const {
    analytics: quoteAnalytics,
    loading: quoteLoading,
    loadAnalytics: loadQuoteAnalytics,
  } = useQuoteManagement({
    autoLoad: false,
  });

  const {
    analytics: pipelineAnalytics,
    loading: pipelineLoading,
    loadAnalytics: loadPipelineAnalytics,
  } = usePipelineAnalytics({
    autoLoad: false,
  });

  // Time range options
  const timeRangeOptions = [
    { label: 'Ostatnie 7 dni', value: '7d' },
    { label: 'Ostatnie 30 dni', value: '30d' },
    { label: 'Ostatnie 90 dni', value: '90d' },
    { label: 'Ostatni rok', value: '1y' },
  ];

  const handleTimeRangeChange = useCallback((value: string) => {
    setSelectedTimeRange(value);
    trackHVACUserAction('analytics_time_range_changed', 'UI_INTERACTION', {
      timeRange: value,
    });
  }, []);

  const loadAnalytics = useCallback(async () => {
    const dateRange = getDateRangeFromSelection(selectedTimeRange);
    
    try {
      await Promise.all([
        loadFlowAnalytics(),
        loadQuoteAnalytics(),
        loadPipelineAnalytics(),
      ]);
      
      trackHVACUserAction('analytics_data_loaded', 'DATA_OPERATION', {
        timeRange: selectedTimeRange,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }, [selectedTimeRange, loadFlowAnalytics, loadQuoteAnalytics, loadPipelineAnalytics]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const getDateRangeFromSelection = (range: string) => {
    const now = new Date();
    const days = parseInt(range.replace(/\D/g, '')) || 30;
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return { from, to: now };
  };

  const isLoading = flowLoading || quoteLoading || pipelineLoading;

  return (
    <div className={`advanced-analytics-dashboard ${className}`}>
      {/* Dashboard Header */}
      <HvacCard className="dashboard-header mb-4">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
              Dashboard Analityczny HVAC
            </h2>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Zaawansowana analiza przepływu klientów, ofert i pipeline'u danych
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <select
              value={selectedTimeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                background: 'white'
              }}
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <Button
              Icon={IconRefresh}
              onClick={loadAnalytics}
              isLoading={isLoading}
              title="Odśwież dane"
              variant="tertiary"
            />
          </div>
        </div>
      </HvacCard>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <HvacCard>
          <div style={{ textAlign: 'center' }}>
            <IconChartCandle size={32} style={{ color: '#3b82f6', marginBottom: '0.5rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 'bold' }}>
              {flowAnalytics?.totalCustomers || 0}
            </h3>
            <p style={{ margin: 0, color: '#6b7280' }}>Łączna liczba klientów</p>
          </div>
        </HvacCard>

        <HvacCard>
          <div style={{ textAlign: 'center' }}>
            <IconChartCandle size={32} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 'bold' }}>
              {quoteAnalytics?.totalQuotes || 0}
            </h3>
            <p style={{ margin: 0, color: '#6b7280' }}>Łączna liczba ofert</p>
          </div>
        </HvacCard>

        <HvacCard>
          <div style={{ textAlign: 'center' }}>
            <IconChartCandle size={32} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 'bold' }}>
              {pipelineAnalytics?.conversionRate || 0}%
            </h3>
            <p style={{ margin: 0, color: '#6b7280' }}>Współczynnik konwersji</p>
          </div>
        </HvacCard>

        <HvacCard>
          <div style={{ textAlign: 'center' }}>
            <IconChartCandle size={32} style={{ color: '#ef4444', marginBottom: '0.5rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 'bold' }}>
              {quoteAnalytics?.averageValue || 0} PLN
            </h3>
            <p style={{ margin: 0, color: '#6b7280' }}>Średnia wartość oferty</p>
          </div>
        </HvacCard>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <HvacCard title="Przepływ klientów w czasie">
          <div style={{ 
            height: '300px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#f9fafb',
            borderRadius: '0.5rem',
            color: '#6b7280'
          }}>
            {isLoading ? 'Ładowanie danych...' : 'Wykres przepływu klientów'}
          </div>
        </HvacCard>

        <HvacCard title="Status ofert">
          <div style={{ 
            height: '300px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#f9fafb',
            borderRadius: '0.5rem',
            color: '#6b7280'
          }}>
            {isLoading ? 'Ładowanie danych...' : 'Wykres statusu ofert'}
          </div>
        </HvacCard>
      </div>

      {/* Recent Activity */}
      <HvacCard title="Ostatnia aktywność">
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          color: '#6b7280'
        }}>
          {isLoading ? 'Ładowanie aktywności...' : 'Brak ostatniej aktywności'}
        </div>
      </HvacCard>
    </div>
  );
};

// Export with the same name for easy replacement
export default AdvancedAnalyticsDashboard;
