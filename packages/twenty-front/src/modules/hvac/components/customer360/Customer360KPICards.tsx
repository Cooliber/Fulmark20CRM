/**
 * Customer 360 KPI Cards Component
 * "Pasja rodzi profesjonalizm" - Key Performance Indicators with Polish formatting
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
import { Knob } from 'primereact/knob';
import { ProgressBar } from 'primereact/progressbar';
import { motion } from 'framer-motion';

// Types
interface Customer {
  totalValue: number;
  lifetimeValue: number;
  satisfactionScore: number;
}

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

interface Customer360KPICardsProps {
  customer: Customer;
  insights?: Insights;
}

export const Customer360KPICards: React.FC<Customer360KPICardsProps> = ({
  customer,
  insights,
}) => {
  // Format currency for Polish locale
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Get color based on value ranges
  const getSatisfactionColor = (score: number): string => {
    if (score >= 4.0) return '#22c55e'; // green
    if (score >= 3.0) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getRiskColor = (risk: number): string => {
    if (risk <= 0.2) return '#22c55e'; // green (low risk)
    if (risk <= 0.5) return '#f59e0b'; // yellow (medium risk)
    return '#ef4444'; // red (high risk)
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.3,
      },
    }),
  };

  return (
    <div className="grid mb-4">
      {/* Total Revenue */}
      <motion.div
        className="col-12 md:col-6 lg:col-3"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <Card className="text-center h-full">
          <div className="text-2xl font-bold text-primary mb-2">
            {formatCurrency(customer.totalValue)}
          </div>
          <div className="text-sm text-600">Przychód roczny</div>
          <div className="mt-2">
            <i className="pi pi-chart-line text-primary text-xl" />
          </div>
        </Card>
      </motion.div>

      {/* Lifetime Value */}
      <motion.div
        className="col-12 md:col-6 lg:col-3"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <Card className="text-center h-full">
          <div className="text-2xl font-bold text-green-500 mb-2">
            {formatCurrency(customer.lifetimeValue)}
          </div>
          <div className="text-sm text-600">Wartość życiowa</div>
          <div className="mt-2">
            <i className="pi pi-wallet text-green-500 text-xl" />
          </div>
        </Card>
      </motion.div>

      {/* Customer Satisfaction */}
      <motion.div
        className="col-12 md:col-6 lg:col-3"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={2}
      >
        <Card className="text-center h-full">
          <div className="mb-3">
            <Knob
              value={customer.satisfactionScore * 20} // Convert 0-5 scale to 0-100
              size={80}
              valueColor={getSatisfactionColor(customer.satisfactionScore)}
              rangeColor="#e5e7eb"
              textColor="#374151"
              strokeWidth={8}
              showValue={false}
            />
          </div>
          <div className="text-lg font-bold mb-1">
            {customer.satisfactionScore.toFixed(1)}/5.0
          </div>
          <div className="text-sm text-600">Satysfakcja klienta</div>
        </Card>
      </motion.div>

      {/* Average Order Value */}
      <motion.div
        className="col-12 md:col-6 lg:col-3"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={3}
      >
        <Card className="text-center h-full">
          <div className="text-2xl font-bold text-blue-500 mb-2">
            {insights ? formatCurrency(insights.financialMetrics.averageOrderValue) : '---'}
          </div>
          <div className="text-sm text-600">Średnia wartość zamówienia</div>
          <div className="mt-2">
            <i className="pi pi-shopping-cart text-blue-500 text-xl" />
          </div>
        </Card>
      </motion.div>

      {/* Risk Indicators Row */}
      {insights && (
        <>
          {/* Churn Risk */}
          <motion.div
            className="col-12 md:col-6"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <Card>
              <div className="flex justify-content-between align-items-center mb-3">
                <span className="font-semibold">Ryzyko utraty klienta</span>
                <span className="text-sm font-bold">
                  {formatPercentage(insights.riskIndicators.churnRisk)}
                </span>
              </div>
              <ProgressBar
                value={insights.riskIndicators.churnRisk * 100}
                color={getRiskColor(insights.riskIndicators.churnRisk)}
                style={{ height: '8px' }}
              />
              <div className="text-xs text-600 mt-2">
                {insights.riskIndicators.churnRisk <= 0.2 ? 'Niskie ryzyko' :
                 insights.riskIndicators.churnRisk <= 0.5 ? 'Średnie ryzyko' : 'Wysokie ryzyko'}
              </div>
            </Card>
          </motion.div>

          {/* Payment Risk */}
          <motion.div
            className="col-12 md:col-6"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={5}
          >
            <Card>
              <div className="flex justify-content-between align-items-center mb-3">
                <span className="font-semibold">Ryzyko płatności</span>
                <span className="text-sm font-bold">
                  {formatPercentage(insights.riskIndicators.paymentRisk)}
                </span>
              </div>
              <ProgressBar
                value={insights.riskIndicators.paymentRisk * 100}
                color={getRiskColor(insights.riskIndicators.paymentRisk)}
                style={{ height: '8px' }}
              />
              <div className="text-xs text-600 mt-2">
                {insights.riskIndicators.paymentRisk <= 0.2 ? 'Niskie ryzyko' :
                 insights.riskIndicators.paymentRisk <= 0.5 ? 'Średnie ryzyko' : 'Wysokie ryzyko'}
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
};
