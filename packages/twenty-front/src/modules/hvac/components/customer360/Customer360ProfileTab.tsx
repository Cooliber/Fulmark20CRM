/**
 * Customer 360 Profile Tab Component
 * "Pasja rodzi profesjonalizm" - Customer profile with Polish business data
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React, { useState, useCallback } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Badge } from 'primereact/badge';
import { ProgressBar } from 'primereact/progressbar';

// HVAC services and hooks
import {
  trackHVACUserAction,
  Customer,
  CustomerStatus,
  CustomerType,
  useCustomerValidation
} from '../../index';

interface Customer360ProfileTabProps {
  customer: Customer;
  onUpdate?: () => void;
}

// Status options for dropdown
const statusOptions = [
  { label: 'Aktywny', value: CustomerStatus.ACTIVE },
  { label: 'Nieaktywny', value: CustomerStatus.INACTIVE },
  { label: 'Potencjalny', value: CustomerStatus.PROSPECT },
  { label: 'VIP', value: CustomerStatus.VIP },
  { label: 'Zawieszony', value: CustomerStatus.SUSPENDED },
  { label: 'Zarchiwizowany', value: CustomerStatus.ARCHIVED },
];

// Customer type options
const customerTypeOptions = [
  { label: 'Osoba fizyczna', value: CustomerType.INDIVIDUAL },
  { label: 'Firma', value: CustomerType.COMPANY },
  { label: 'Instytucja rządowa', value: CustomerType.GOVERNMENT },
  { label: 'Organizacja non-profit', value: CustomerType.NON_PROFIT },
];

export const Customer360ProfileTab: React.FC<Customer360ProfileTabProps> = ({
  customer,
  onUpdate,
}) => {
  // State for edit mode
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(customer);
  const [saving, setSaving] = useState(false);

  // Customer validation hook
  const {
    validateField,
    calculateHealthScore,
    suggestImprovements,
  } = useCustomerValidation({
    validateNIP: true,
    validateREGON: true,
    validateAddress: true,
    realTimeValidation: true,
  });

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit - reset data
      setEditData(customer);
    } else {
      // Start edit - track action
      trackHVACUserAction(
        'customer360_profile_edit_start',
        'CUSTOMER_360',
        { customerId: customer.id }
      );
    }
    setEditMode(!editMode);
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Track save action
      trackHVACUserAction(
        'customer360_profile_save',
        'CUSTOMER_360',
        { customerId: customer.id, changes: editData }
      );

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEditMode(false);
      onUpdate?.();
      
    } catch (error) {
      console.error('Failed to save customer data:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof Customer, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));

    // Real-time validation for critical fields
    if (field === 'nip' || field === 'regon' || field === 'email') {
      validateField(field, value);
    }
  };

  // Calculate customer health score
  const healthScore = calculateHealthScore(customer);

  // Get improvement suggestions
  const improvements = suggestImprovements(customer);

  // Format address for display
  const formatAddress = (address: any): string => {
    if (typeof address === 'string') return address;
    if (!address) return 'Brak';

    const parts = [
      address.street,
      address.city,
      address.postalCode,
      address.voivodeship
    ].filter(Boolean);

    return parts.join(', ') || 'Brak';
  };

  return (
    <div className="grid">
      {/* Basic Information */}
      <div className="col-12 md:col-8">
        <Card title="Dane podstawowe">
          <div className="grid">
            <div className="col-12 md:col-6">
              <div className="field">
                <label className="font-semibold">Nazwa firmy</label>
                {editMode ? (
                  <InputText
                    value={editData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <div className="mt-1">{customer.name}</div>
                )}
              </div>

              <div className="field">
                <label className="font-semibold">Email</label>
                {editMode ? (
                  <InputText
                    value={editData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full"
                    type="email"
                  />
                ) : (
                  <div className="mt-1">{customer.email || 'Brak'}</div>
                )}
              </div>

              <div className="field">
                <label className="font-semibold">Telefon</label>
                {editMode ? (
                  <InputText
                    value={editData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <div className="mt-1">{customer.phone || 'Brak'}</div>
                )}
              </div>
            </div>

            <div className="col-12 md:col-6">
              <div className="field">
                <label className="font-semibold">NIP</label>
                {editMode ? (
                  <InputText
                    value={editData.nip || ''}
                    onChange={(e) => handleInputChange('nip', e.target.value)}
                    className="w-full"
                    placeholder="1234567890"
                  />
                ) : (
                  <div className="mt-1">{customer.nip || 'Brak'}</div>
                )}
              </div>

              <div className="field">
                <label className="font-semibold">REGON</label>
                {editMode ? (
                  <InputText
                    value={editData.regon || ''}
                    onChange={(e) => handleInputChange('regon', e.target.value)}
                    className="w-full"
                    placeholder="123456789"
                  />
                ) : (
                  <div className="mt-1">{customer.regon || 'Brak'}</div>
                )}
              </div>

              <div className="field">
                <label className="font-semibold">Status</label>
                {editMode ? (
                  <Dropdown
                    value={editData.status}
                    options={statusOptions}
                    onChange={(e) => handleInputChange('status', e.value)}
                    className="w-full"
                  />
                ) : (
                  <div className="mt-1">
                    {statusOptions.find(opt => opt.value === customer.status)?.label}
                  </div>
                )}
              </div>
            </div>

            <div className="col-12">
              <div className="field">
                <label className="font-semibold">Adres</label>
                {editMode ? (
                  <InputTextarea
                    value={formatAddress(editData.address)}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full"
                    rows={3}
                    placeholder="ul. Przykładowa 123, 00-001 Warszawa"
                  />
                ) : (
                  <div className="mt-1">{formatAddress(customer.address)}</div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-content-end gap-2 mt-4">
            {editMode ? (
              <>
                <Button
                  label="Anuluj"
                  icon="pi pi-times"
                  className="p-button-outlined"
                  onClick={handleEditToggle}
                  disabled={saving}
                />
                <Button
                  label="Zapisz"
                  icon="pi pi-check"
                  onClick={handleSave}
                  loading={saving}
                />
              </>
            ) : (
              <Button
                label="Edytuj"
                icon="pi pi-pencil"
                className="p-button-outlined"
                onClick={handleEditToggle}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="col-12 md:col-4">
        <Card title="Informacje dodatkowe">
          {/* Customer Health Score */}
          <div className="field">
            <label className="font-semibold">Ocena zdrowia klienta</label>
            <div className="mt-2">
              <ProgressBar
                value={healthScore}
                className="mb-2"
                style={{ height: '8px' }}
              />
              <div className="flex justify-content-between align-items-center">
                <span className="text-sm">{healthScore}%</span>
                <Badge
                  value={healthScore >= 80 ? 'Doskonały' : healthScore >= 60 ? 'Dobry' : healthScore >= 40 ? 'Średni' : 'Wymaga uwagi'}
                  severity={healthScore >= 80 ? 'success' : healthScore >= 60 ? 'info' : healthScore >= 40 ? 'warning' : 'danger'}
                />
              </div>
            </div>
          </div>

          <div className="field">
            <label className="font-semibold">Data utworzenia</label>
            <div className="mt-1">{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('pl-PL') : 'Brak'}</div>
          </div>

          <div className="field">
            <label className="font-semibold">Ostatni kontakt</label>
            <div className="mt-1">{customer.lastContactDate ? new Date(customer.lastContactDate).toLocaleDateString('pl-PL') : 'Brak'}</div>
          </div>

          <div className="field">
            <label className="font-semibold">Typ klienta</label>
            <div className="mt-1">
              {customerTypeOptions.find(opt => opt.value === customer.customerType)?.label || 'Nieokreślony'}
            </div>
          </div>

          <div className="field">
            <label className="font-semibold">Wartość całkowita</label>
            <div className="mt-1">{customer.totalValue ? `${customer.totalValue.toLocaleString('pl-PL')} PLN` : 'Brak'}</div>
          </div>
        </Card>

        {/* Improvement Suggestions */}
        {improvements.length > 0 && (
          <Card title="Sugestie ulepszeń" className="mt-3">
            <div className="flex flex-column gap-2">
              {improvements.slice(0, 3).map((suggestion, index) => (
                <Message
                  key={index}
                  severity="info"
                  text={suggestion}
                  className="w-full"
                />
              ))}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card title="Szybkie akcje" className="mt-3">
          <div className="flex flex-column gap-2">
            <Button
              label="Nowe zgłoszenie"
              icon="pi pi-plus"
              className="p-button-outlined w-full"
              onClick={() => trackHVACUserAction('quick_action_new_ticket', 'CUSTOMER_360', { customerId: customer.id })}
            />
            <Button
              label="Wyślij email"
              icon="pi pi-envelope"
              className="p-button-outlined w-full"
              onClick={() => trackHVACUserAction('quick_action_send_email', 'CUSTOMER_360', { customerId: customer.id })}
            />
            <Button
              label="Zaplanuj wizytę"
              icon="pi pi-calendar"
              className="p-button-outlined w-full"
              onClick={() => trackHVACUserAction('quick_action_schedule_visit', 'CUSTOMER_360', { customerId: customer.id })}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};
