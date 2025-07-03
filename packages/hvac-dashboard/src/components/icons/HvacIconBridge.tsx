/**
 * HVAC Icon Bridge System - SOTA Implementation
 * "Pasja rodzi profesjonalizm" - Kreatywne rozwiązanie problemów z importami
 *
 * Ten system zapewnia:
 * - Bezpośrednie importy z @tabler/icons-react (jak TwentyCRM)
 * - Type-safe interface zgodny z TwentyCRM patterns
 * - Centralized icon management
 * - Future-proof architecture
 * - Performance optimization
 */

import {
    IconAlertCircle,
    IconAlertTriangle,
    IconApps,
    IconBolt,
    IconBuildingSkyscraper,
    IconCalendar,
    IconCalendarEvent,
    IconCar,
    IconChartBar,
    IconChartCandle,
    IconCheck,
    IconCircleCheck as IconCheckCircle,
    IconCircleOff,
    IconClipboardCheck,
    IconClock,
    IconClockHour8,
    IconDroplet,
    IconFileText,
    IconFlame,
    IconGauge,
    IconHome,
    IconInfoCircle,
    IconMail,
    IconMap,
    IconMapPin,
    IconPhone,
    IconRefresh,
    IconReportAnalytics,
    IconSearch,
    IconSettings,
    IconShield,
    IconSnowflake,
    IconTag,
    IconTarget,
    IconThermometer,
    IconTicket,
    IconTool,
    IconTools,
    IconTrendingUp,
    IconUserCheck,
    IconUsers,
    IconWind,
    IconWorld,
    IconTool as IconWrench,
    IconX,
    IconCircleX as IconXCircle,
} from '@tabler/icons-react';
import React from 'react';

// HVAC-Specific Icon Types
export type HvacIconName =
  | 'overview' | 'search' | 'tickets' | 'equipment' | 'maintenance' | 'analytics'
  | 'dashboard' | 'building' | 'calendar' | 'users' | 'reports' | 'alert'
  | 'success' | 'error' | 'refresh' | 'map' | 'phone' | 'mail' | 'clock'
  | 'network' | 'offline' | 'chart' | 'ticket' | 'gauge' | 'wrench'
  | 'heating' | 'cooling' | 'temperature' | 'ventilation' | 'electrical'
  | 'water' | 'safety' | 'target' | 'trending' | 'analytics-report'
  | 'checklist' | 'tools' | 'home' | 'vehicle' | 'location' | 'event'
  | 'time' | 'technician' | 'warning' | 'info' | 'check-circle' | 'x-circle';

// Icon Props Interface (compatible with TwentyCRM patterns and @tabler/icons-react)
export interface HvacIconProps {
  size?: number | string;
  color?: string;
  stroke?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

// HVAC Icon Mapping - Centralized Management
export const HVAC_ICON_MAP: Record<HvacIconName, React.ComponentType<any>> = {
  // Dashboard & Navigation
  overview: IconChartCandle,
  search: IconSearch,
  tickets: IconTag,
  equipment: IconTool,
  maintenance: IconSettings,
  analytics: IconApps,
  dashboard: IconApps,

  // Core Business Icons
  building: IconBuildingSkyscraper,
  calendar: IconCalendar,
  users: IconUsers,
  reports: IconFileText,

  // Status & Feedback Icons
  alert: IconAlertCircle,
  success: IconCheck,
  error: IconX,
  refresh: IconRefresh,
  warning: IconAlertTriangle,
  info: IconInfoCircle,
  'check-circle': IconCheckCircle,
  'x-circle': IconXCircle,

  // Communication & Location
  map: IconMap,
  phone: IconPhone,
  mail: IconMail,
  clock: IconClock,
  network: IconWorld,
  offline: IconCircleOff,
  location: IconMapPin,

  // HVAC-Specific Icons
  chart: IconChartBar,
  ticket: IconTicket,
  gauge: IconGauge,
  wrench: IconWrench,
  heating: IconFlame,
  cooling: IconSnowflake,
  temperature: IconThermometer,
  ventilation: IconWind,
  electrical: IconBolt,
  water: IconDroplet,
  safety: IconShield,

  // Analytics & Performance
  target: IconTarget,
  trending: IconTrendingUp,
  'analytics-report': IconReportAnalytics,
  checklist: IconClipboardCheck,

  // Operations
  tools: IconTools,
  home: IconHome,
  vehicle: IconCar,
  event: IconCalendarEvent,
  time: IconClockHour8,
  technician: IconUserCheck,
};

// HVAC Icon Component - Main Interface
export interface HvacIconComponentProps extends HvacIconProps {
  name: HvacIconName;
  title?: string;
  'aria-label'?: string;
}

/**
 * HvacIcon - Główny komponent ikon HVAC
 * Zapewnia type-safe interface i centralized management
 */
export const HvacIcon: React.FC<HvacIconComponentProps> = ({
  name,
  size = 24,
  color = 'currentColor',
  stroke = 2,
  className,
  style,
  title,
  'aria-label': ariaLabel,
  ...props
}) => {
  const IconComponent = HVAC_ICON_MAP[name];

  if (!IconComponent) {
    console.warn(`HVAC Icon "${name}" not found. Using fallback icon.`);
    return <IconAlertCircle size={size} color={color} stroke={stroke} className={className} style={style} />;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      stroke={stroke}
      className={className}
      style={style}
      {...props}
    />
  );
};

// Convenience Exports for Common Icons
export const HvacOverviewIcon = (props: HvacIconProps) => <HvacIcon name="overview" {...props} />;
export const HvacSearchIcon = (props: HvacIconProps) => <HvacIcon name="search" {...props} />;
export const HvacTicketsIcon = (props: HvacIconProps) => <HvacIcon name="tickets" {...props} />;
export const HvacEquipmentIcon = (props: HvacIconProps) => <HvacIcon name="equipment" {...props} />;
export const HvacMaintenanceIcon = (props: HvacIconProps) => <HvacIcon name="maintenance" {...props} />;
export const HvacAnalyticsIcon = (props: HvacIconProps) => <HvacIcon name="analytics" {...props} />;

// Performance Optimization - Preload Critical Icons
export const preloadCriticalHvacIcons = () => {
  // Icons are already imported, so they're available immediately
  console.log('HVAC Critical icons preloaded successfully');
};

// Icon Validation Utility
export const isValidHvacIcon = (name: string): name is HvacIconName => {
  return name in HVAC_ICON_MAP;
};

// Export all for easy access
export { HVAC_ICON_MAP as HvacIcons };

// Default export
export default HvacIcon;