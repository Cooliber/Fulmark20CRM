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

// Replaced PrimeReact with SOTA HvacIconBridge system for bundle optimization
import React from 'react';
import { HvacAnalyticsIcon, HvacEquipmentIcon } from './icons/HvacIconBridge';
const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${className || ''}`}
  >
    {children}
  </button>
);

// HVAC Monitoring - Placeholder function
const trackHVACUserAction = (action: string, context: string, data?: Record<string, unknown>) => {
  console.log('HVAC User Action:', { action, context, data });
};

// Types
interface HvacDashboardPlaceholderProps {
  type: 'equipment' | 'analytics';
  title: string;
  description: string;
  icon?: React.ComponentType<{ size: number; className?: string; style?: React.CSSProperties }>;
  actionLabel?: string;
  onAction?: () => void;
}

// Icon mapping - Using SOTA HvacIconBridge system
const iconMap = {
  equipment: HvacEquipmentIcon,
  analytics: HvacAnalyticsIcon,
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
        className="p-button-outlined"
        onClick={handleActionClick}
      >
        {actionLabel}
      </Button>
    </div>
  );
};
