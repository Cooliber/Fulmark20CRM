/**
 * Customer 360 Analytics Tab Component
 * "Pasja rodzi profesjonalizm" - Customer analytics and insights
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { Button } from 'primereact/button';

// HVAC monitoring
import { trackHVACUserAction } from '../../index';

// Types
interface Insights {
  financialMetrics: {
    totalRevenue: number;
    lifetimeValue: number;
    averageOrderValue: number;
  };
  riskIndicators: {
    churnRisk: number;
    paymentRisk: number;
  };
}

interface Customer360AnalyticsTabProps {
  customerId: string;
  insights?: Insights;
}

export const Customer360AnalyticsTab: React.FC<Customer360AnalyticsTabProps> = ({
  customerId,
  insights,
}) => {
  // Mock chart data
  const revenueChartData = {
    labels: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze'],
    datasets: [
      {
        label: 'Przychód (PLN)',
        data: [12000, 15000, 18000, 22000, 25000, 28000],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const serviceChartData = {
    labels: ['Klimatyzacja', 'Wentylacja', 'Ogrzewanie', 'Konserwacja'],
    datasets: [
      {
        data: [45, 25, 20, 10],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  // Handle analytics actions
  const handleAnalyticsAction = (action: string) => {
    trackHVACUserAction(
      `customer360_analytics_${action}`,
      'CUSTOMER_360',
      { customerId, action }
    );
    
    console.log(`Analytics action: ${action}`);
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid">
      {/* Analytics Actions */}
      <div className="col-12">
        <Card title="Raporty i analizy" className="mb-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              label="Generuj raport"
              icon="pi pi-file-pdf"
              onClick={() => handleAnalyticsAction('generate_report')}
            />
            <Button
              label="Eksportuj dane"
              icon="pi pi-download"
              className="p-button-outlined"
              onClick={() => handleAnalyticsAction('export_data')}
            />
            <Button
              label="Ustawienia analityki"
              icon="pi pi-cog"
              className="p-button-outlined"
              onClick={() => handleAnalyticsAction('settings')}
            />
          </div>
        </Card>
      </div>

      {/* Revenue Chart */}
      <div className="col-12 md:col-8">
        <Card title="Przychód w czasie">
          <div style={{ height: '300px' }}>
            <Chart
              type="line"
              data={revenueChartData}
              options={chartOptions}
            />
          </div>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="col-12 md:col-4">
        <Card title="Kluczowe metryki">
          {insights ? (
            <div className="flex flex-column gap-3">
              <div>
                <div className="text-sm text-600">Całkowity przychód</div>
                <div className="text-xl font-bold text-primary">
                  {formatCurrency(insights.financialMetrics.totalRevenue)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-600">Wartość życiowa</div>
                <div className="text-xl font-bold text-green-500">
                  {formatCurrency(insights.financialMetrics.lifetimeValue)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-600">Średnia wartość zamówienia</div>
                <div className="text-xl font-bold text-blue-500">
                  {formatCurrency(insights.financialMetrics.averageOrderValue)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-600">Ryzyko utraty</div>
                <div className="text-xl font-bold text-orange-500">
                  {(insights.riskIndicators.churnRisk * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-600">
              Ładowanie metryk...
            </div>
          )}
        </Card>
      </div>

      {/* Service Distribution */}
      <div className="col-12 md:col-6">
        <Card title="Rozkład usług">
          <div style={{ height: '250px' }}>
            <Chart
              type="doughnut"
              data={serviceChartData}
              options={chartOptions}
            />
          </div>
        </Card>
      </div>

      {/* Predictions */}
      <div className="col-12 md:col-6">
        <Card title="Predykcje AI">
          <div className="flex flex-column gap-3">
            <div className="p-3 border-round bg-blue-50">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-chart-line text-blue-500" />
                <span className="font-semibold">Prognoza przychodów</span>
              </div>
              <p className="text-sm text-600 m-0">
                Przewidywany przychód w następnym kwartale: {formatCurrency(85000)}
              </p>
            </div>
            
            <div className="p-3 border-round bg-green-50">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-calendar text-green-500" />
                <span className="font-semibold">Następny serwis</span>
              </div>
              <p className="text-sm text-600 m-0">
                Rekomendowany termin przeglądu: 15.08.2025
              </p>
            </div>
            
            <div className="p-3 border-round bg-orange-50">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-exclamation-triangle text-orange-500" />
                <span className="font-semibold">Ostrzeżenie</span>
              </div>
              <p className="text-sm text-600 m-0">
                Zwiększone ryzyko awarii systemu klimatyzacji
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
