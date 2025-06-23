/**
 * HVAC Dashboard Placeholder Component
 * "Pasja rodzi profesjonalizm" - Placeholder for upcoming features
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React from 'react';
import { Button } from 'primereact/button';
import { IconTool } from 'twenty-ui/display';
import { IconGauge as IconChartBar } from 'twenty-ui/display';

// HVAC Monitoring
import { trackHVACUserAction } from '../../index';

// Types
interface HvacDashboardPlaceholderProps {
  type: 'equipment' | 'analytics';
  title: string;
  description: string;
  icon?: React.ComponentType<{ size: number; className?: string; style?: React.CSSProperties }>;
  actionLabel?: string;
  onAction?: () => void;
}

// Icon mapping
const iconMap = {
  equipment: IconTool,
  analytics: IconChartBar,
};

// Action mapping for tracking
const actionMap = {
  equipment: 'notify_equipment_availability',
  analytics: 'notify_analytics_availability',
};

// Context mapping for tracking
const contextMap = {
  equipment: 'EQUIPMENT_MANAGEMENT' as const,
  analytics: 'CUSTOMER_360' as const,
};

export const HvacDashboardPlaceholder: React.FC<HvacDashboardPlaceholderProps> = ({
  type,
  title,
  description,
  icon,
  actionLabel = 'Powiadom o dostępności',
  onAction,
}) => {
  // Get appropriate icon
  const IconComponent = icon || iconMap[type];

  // Handle action click with tracking
  const handleActionClick = () => {
    trackHVACUserAction(actionMap[type], contextMap[type]);
    onAction?.();
  };

  return (
    <div className="text-center p-6">
      {/* Icon */}
      <div className="mb-4">
        <IconComponent 
          size={64} 
          className="text-400" 
          style={{ opacity: 0.3 }} 
        />
      </div>

      {/* Title */}
      <h3 className="text-900 font-semibold mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-600 mb-4">
        {description}
      </p>

      {/* Action Button */}
      <Button
        label={actionLabel}
        icon={type === 'equipment' ? 'pi pi-bell' : 'pi pi-chart-line'}
        className="p-button-outlined"
        onClick={handleActionClick}
      />
    </div>
  );
};
