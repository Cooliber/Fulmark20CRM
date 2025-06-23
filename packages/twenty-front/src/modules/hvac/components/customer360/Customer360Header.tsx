/**
 * Customer 360 Header Component
 * "Pasja rodzi profesjonalizm" - Customer header with Polish business context
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
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import { Avatar } from 'primereact/avatar';
import { Badge } from 'primereact/badge';
import { Tooltip } from 'primereact/tooltip';

// HVAC monitoring
import { trackHVACUserAction } from '../../index';

// Types
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  nip?: string;
  regon?: string;
  address?: string;
  status: 'active' | 'inactive' | 'prospect' | 'vip';
  totalValue: number;
  lifetimeValue: number;
  satisfactionScore: number;
}

interface Customer360HeaderProps {
  customer: Customer;
  onClose?: () => void;
  onRefresh?: () => void;
  onEdit?: () => void;
}

// Status configuration
const statusConfig = {
  active: { label: 'Aktywny', severity: 'success' as const, icon: 'pi-check-circle' },
  inactive: { label: 'Nieaktywny', severity: 'secondary' as const, icon: 'pi-pause' },
  prospect: { label: 'Potencjalny', severity: 'info' as const, icon: 'pi-eye' },
  vip: { label: 'VIP', severity: 'warning' as const, icon: 'pi-star' },
};

export const Customer360Header: React.FC<Customer360HeaderProps> = ({
  customer,
  onClose,
  onRefresh,
  onEdit,
}) => {
  // Handle action clicks with tracking
  const handleActionClick = (action: string, callback?: () => void) => {
    trackHVACUserAction(
      `customer360_header_${action}`,
      'CUSTOMER_360',
      { customerId: customer.id, action }
    );
    
    callback?.();
  };

  // Get customer initials for avatar
  const getCustomerInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format currency for Polish locale
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get status configuration
  const statusInfo = statusConfig[customer.status];

  return (
    <Card className="mb-4">
      <div className="flex justify-content-between align-items-start">
        {/* Left side - Customer info */}
        <div className="flex align-items-start gap-4">
          {/* Avatar */}
          <Avatar
            label={getCustomerInitials(customer.name)}
            size="xlarge"
            shape="circle"
            className="bg-primary text-white font-bold"
          />

          {/* Customer details */}
          <div className="flex-1">
            {/* Name and status */}
            <div className="flex align-items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-900 m-0">
                {customer.name}
              </h2>
              <Badge
                value={statusInfo.label}
                severity={statusInfo.severity}
                className={`pi ${statusInfo.icon}`}
              />
            </div>

            {/* Contact information */}
            <div className="flex flex-wrap gap-2 mb-3">
              {customer.email && (
                <Chip
                  label={customer.email}
                  icon="pi pi-envelope"
                  className="p-chip-outlined"
                />
              )}
              {customer.phone && (
                <Chip
                  label={customer.phone}
                  icon="pi pi-phone"
                  className="p-chip-outlined"
                />
              )}
            </div>

            {/* Polish business identifiers */}
            <div className="flex flex-wrap gap-2 mb-3">
              {customer.nip && (
                <Chip
                  label={`NIP: ${customer.nip}`}
                  className="p-chip-outlined"
                  data-pr-tooltip="Numer Identyfikacji Podatkowej"
                />
              )}
              {customer.regon && (
                <Chip
                  label={`REGON: ${customer.regon}`}
                  className="p-chip-outlined"
                  data-pr-tooltip="Rejestr Gospodarki Narodowej"
                />
              )}
            </div>

            {/* Address */}
            {customer.address && (
              <div className="flex align-items-center gap-2 text-600">
                <i className="pi pi-map-marker" />
                <span>{customer.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Actions and metrics */}
        <div className="flex flex-column align-items-end gap-3">
          {/* Action buttons */}
          <div className="flex gap-2">
            {onEdit && (
              <Button
                icon="pi pi-pencil"
                label="Edytuj"
                className="p-button-outlined p-button-sm"
                onClick={() => handleActionClick('edit', onEdit)}
                data-pr-tooltip="Edytuj dane klienta"
              />
            )}
            {onRefresh && (
              <Button
                icon="pi pi-refresh"
                className="p-button-outlined p-button-sm"
                onClick={() => handleActionClick('refresh', onRefresh)}
                data-pr-tooltip="Odśwież dane"
              />
            )}
            {onClose && (
              <Button
                icon="pi pi-times"
                className="p-button-outlined p-button-sm"
                onClick={() => handleActionClick('close', onClose)}
                data-pr-tooltip="Zamknij"
              />
            )}
          </div>

          {/* Quick metrics */}
          <div className="text-right">
            <div className="text-sm text-600 mb-1">Wartość całkowita</div>
            <div className="text-xl font-bold text-primary">
              {formatCurrency(customer.totalValue)}
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-600 mb-1">Wartość życiowa</div>
            <div className="text-lg font-semibold text-900">
              {formatCurrency(customer.lifetimeValue)}
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-600 mb-1">Ocena satysfakcji</div>
            <div className="flex align-items-center gap-1">
              <span className="text-lg font-semibold">
                {customer.satisfactionScore.toFixed(1)}
              </span>
              <i className="pi pi-star-fill text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip component */}
      <Tooltip target="[data-pr-tooltip]" />
    </Card>
  );
};
