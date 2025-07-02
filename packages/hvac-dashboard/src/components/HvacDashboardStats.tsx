/**
 * HVAC Dashboard Stats Component
 * "Pasja rodzi profesjonalizm" - Dashboard statistics cards
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import { motion } from 'framer-motion';
import { Card } from 'primereact/card';
import React from 'react';
import { IconCalendar, IconSearch, IconTag as IconTicket, IconTool } from 'twenty-ui/display';

// Types
interface StatItem {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface HvacDashboardStatsProps {
  className?: string;
}

// Mock statistics data
const mockStats: StatItem[] = [
  {
    label: 'Aktywne Zgłoszenia',
    value: '12',
    icon: IconTicket,
    color: '#3b82f6',
  },
  {
    label: 'Zaplanowane Wizyty',
    value: '8',
    icon: IconCalendar,
    color: '#8b5cf6',
  },
  {
    label: 'Sprzęt w Serwisie',
    value: '3',
    icon: IconTool,
    color: '#f59e0b',
  },
  {
    label: 'Dokumenty w Bazie',
    value: '1,247',
    icon: IconSearch,
    color: '#10b981',
  },
];

export const HvacDashboardStats: React.FC<HvacDashboardStatsProps> = ({
  className = 'mb-4',
}) => {
  return (
    <div className={`grid ${className}`}>
      {mockStats.map((stat, index) => (
        <motion.div
          key={index}
          className="col-12 md:col-6 lg:col-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="h-full">
            <div className="flex align-items-center gap-3">
              {/* Icon */}
              <div
                className="flex align-items-center justify-content-center w-3rem h-3rem border-round"
                style={{
                  backgroundColor: `${stat.color}20`,
                  color: stat.color
                }}
              >
                <stat.icon size={24} />
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <div className="text-2xl font-bold text-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-600">
                  {stat.label}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
