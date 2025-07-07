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
import { Button } from 'twenty-ui/input';
import { IconRefresh, IconAlertTriangle } from 'twenty-ui/display';
import styled from '@emotion/styled';

// HVAC monitoring
import { addHVACBreadcrumb, reportHVACMessage } from '../../config/sentry.config';

// Styled components for TwentyCRM design
const StyledOfflineMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing(3)};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
  background-color: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  color: ${({ theme }) => theme.font.color.primary};
`;

const StyledMessageContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
`;

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

  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

        // Show success message if was offline
        if (!prev.isOnline) {
          setToastMessage('Połączenie z internetem zostało przywrócone.');
          setTimeout(() => setToastMessage(null), 3000);

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

        // Show warning message
        setToastMessage('Utracono połączenie z internetem.');
        setTimeout(() => setToastMessage(null), 5000);

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
        setToastMessage('Nadal brak połączenia z internetem.');
        setTimeout(() => setToastMessage(null), 3000);
      });
  };

  return (
    <>
      {/* Toast message */}
      {toastMessage && (
        <StyledToastContainer>
          <StyledOfflineMessage>
            <StyledMessageContent>
              <IconAlertTriangle size={16} />
              <span>{toastMessage}</span>
            </StyledMessageContent>
          </StyledOfflineMessage>
        </StyledToastContainer>
      )}

      {/* Offline message */}
      {!networkState.isOnline && showOfflineMessage && (
        <StyledOfflineMessage>
          <StyledMessageContent>
            <IconAlertTriangle size={16} />
            <span>{offlineMessage}</span>
          </StyledMessageContent>
          <Button
            title="Sprawdź połączenie"
            Icon={IconRefresh}
            variant="secondary"
            size="small"
            onClick={handleRetryConnection}
          />
        </StyledOfflineMessage>
      )}

      {children}
    </>
  );
};
