/**
 * HVAC Network Monitor Component
 * "Pasja rodzi profesjonalizm" - Network connectivity monitoring and offline handling
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';

// HVAC monitoring
import { addHVACBreadcrumb, reportHVACMessage } from '../../config/sentry.config';

// Types
interface HVACNetworkMonitorProps {
  children: ReactNode;
  showOfflineMessage?: boolean;
  offlineMessage?: string;
  onNetworkChange?: (isOnline: boolean) => void;
}

interface NetworkState {
  isOnline: boolean;
  wasOffline: boolean;
  connectionType?: string;
  effectiveType?: string;
}

export const HVACNetworkMonitor: React.FC<HVACNetworkMonitorProps> = ({
  children,
  showOfflineMessage = true,
  offlineMessage = 'Brak połączenia z internetem. Niektóre funkcje mogą być niedostępne.',
  onNetworkChange,
}) => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: navigator.onLine,
    wasOffline: false,
  });

  const toastRef = React.useRef<Toast>(null);

  // Handle network status changes
  useEffect(() => {
    const handleOnline = () => {
      setNetworkState(prev => {
        const newState = {
          ...prev,
          isOnline: true,
          wasOffline: prev.wasOffline || !prev.isOnline,
        };

        // Track network restoration
        addHVACBreadcrumb(
          'Network connection restored',
          'network_monitor',
          'info',
          { previouslyOffline: prev.wasOffline }
        );

        // Show success toast if was offline
        if (!prev.isOnline) {
          toastRef.current?.show({
            severity: 'success',
            summary: 'Połączenie przywrócone',
            detail: 'Połączenie z internetem zostało przywrócone.',
            life: 3000,
          });

          reportHVACMessage(
            'Network connection restored',
            'info',
            'PERFORMANCE',
            { wasOffline: prev.wasOffline }
          );
        }

        onNetworkChange?.(true);
        return newState;
      });
    };

    const handleOffline = () => {
      setNetworkState(prev => {
        const newState = {
          ...prev,
          isOnline: false,
          wasOffline: true,
        };

        // Track network loss
        addHVACBreadcrumb(
          'Network connection lost',
          'network_monitor',
          'warning'
        );

        // Show warning toast
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Brak połączenia',
          detail: 'Utracono połączenie z internetem.',
          life: 5000,
        });

        reportHVACMessage(
          'Network connection lost',
          'warning',
          'PERFORMANCE'
        );

        onNetworkChange?.(false);
        return newState;
      });
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get connection info if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      setNetworkState(prev => ({
        ...prev,
        connectionType: connection.type,
        effectiveType: connection.effectiveType,
      }));

      const handleConnectionChange = () => {
        setNetworkState(prev => ({
          ...prev,
          connectionType: connection.type,
          effectiveType: connection.effectiveType,
        }));

        addHVACBreadcrumb(
          'Network connection type changed',
          'network_monitor',
          'info',
          {
            connectionType: connection.type,
            effectiveType: connection.effectiveType,
          }
        );
      };

      connection.addEventListener('change', handleConnectionChange);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onNetworkChange]);

  // Handle retry connection
  const handleRetryConnection = () => {
    addHVACBreadcrumb(
      'User requested connection retry',
      'network_monitor',
      'info'
    );

    // Force a network check by trying to fetch a small resource
    fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' })
      .then(() => {
        if (!navigator.onLine) {
          // Manually trigger online event if fetch succeeds but navigator.onLine is false
          window.dispatchEvent(new Event('online'));
        }
      })
      .catch(() => {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Sprawdzanie połączenia',
          detail: 'Nadal brak połączenia z internetem.',
          life: 3000,
        });
      });
  };

  return (
    <>
      <Toast ref={toastRef} position="top-right" />
      
      {/* Offline message */}
      {!networkState.isOnline && showOfflineMessage && (
        <Message
          severity="warn"
          className="w-full mb-3"
          content={
            <div className="flex justify-content-between align-items-center w-full">
              <span>{offlineMessage}</span>
              <Button
                label="Sprawdź połączenie"
                icon="pi pi-refresh"
                size="small"
                className="p-button-outlined p-button-sm"
                onClick={handleRetryConnection}
              />
            </div>
          }
        />
      )}

      {children}
    </>
  );
};
