/**
 * Customer 360 Error State Component
 * "Pasja rodzi profesjonalizm" - Professional error handling
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

interface Customer360ErrorStateProps {
  error: string;
  onRetry: () => void;
  onClearError: () => void;
}

export const Customer360ErrorState: React.FC<Customer360ErrorStateProps> = ({
  error,
  onRetry,
  onClearError,
}) => {
  return (
    <Card className="customer-360-error p-4">
      <div className="text-center">
        {/* Error Icon */}
        <div className="mb-4">
          <i 
            className="pi pi-exclamation-triangle text-6xl text-red-500" 
            style={{ fontSize: '4rem' }}
          />
        </div>

        {/* Error Message */}
        <Message 
          severity="error" 
          text={error} 
          className="w-full mb-4"
        />

        {/* Error Details */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-700 mb-2">
            Nie udało się załadować danych klienta
          </h3>
          <p className="text-600 mb-3">
            Wystąpił problem podczas pobierania informacji z systemu HVAC. 
            Sprawdź połączenie internetowe i spróbuj ponownie.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-content-center flex-wrap">
          <Button 
            label="Spróbuj ponownie" 
            icon="pi pi-refresh"
            onClick={onRetry}
            className="p-button-primary"
          />
          <Button 
            label="Wyczyść błąd" 
            icon="pi pi-times"
            onClick={onClearError}
            className="p-button-outlined p-button-secondary"
          />
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-gray-50 border-round">
          <p className="text-sm text-600 mb-2">
            <strong>Możliwe przyczyny:</strong>
          </p>
          <ul className="text-sm text-600 text-left list-none p-0 m-0">
            <li className="mb-1">
              <i className="pi pi-circle-fill text-xs mr-2" />
              Brak połączenia z internetem
            </li>
            <li className="mb-1">
              <i className="pi pi-circle-fill text-xs mr-2" />
              Serwer HVAC jest niedostępny
            </li>
            <li className="mb-1">
              <i className="pi pi-circle-fill text-xs mr-2" />
              Błąd autoryzacji
            </li>
            <li className="mb-1">
              <i className="pi pi-circle-fill text-xs mr-2" />
              Klient nie istnieje w systemie
            </li>
          </ul>
        </div>

        {/* Contact Support */}
        <div className="mt-4">
          <p className="text-sm text-500">
            Jeśli problem się powtarza, skontaktuj się z działem IT
          </p>
        </div>
      </div>
    </Card>
  );
};
