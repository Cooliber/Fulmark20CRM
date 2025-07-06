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
import React from 'react';
// Placeholder icons
const IconCalendar = () => <span>📅</span>;
const IconSearch = () => <span>🔍</span>;
const IconTicket = () => <span>🎫</span>;
const IconTool = () => <span>🔧</span>;

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
          <div className="bg-white rounded-lg shadow-sm border p-4 h-full">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="flex items-center justify-center w-12 h-12 rounded"
                style={{
                  backgroundColor: `${stat.color}20`,
                  color: stat.color
                }}
              >
                <stat.icon size={24} />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
