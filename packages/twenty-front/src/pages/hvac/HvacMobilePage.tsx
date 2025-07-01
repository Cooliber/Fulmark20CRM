/**
 * HVAC Mobile Page
 * "Pasja rodzi profesjonalizm" - Professional HVAC Mobile Interface
 *
 * Mobile-optimized page for field technicians including:
 * - Mobile dashboard for technicians
 * - Job cards and work orders
 * - Offline synchronization
 * - Field reporting tools
 * - GPS tracking and navigation
 */

import React, { Suspense, useState, useCallback, useRef, useEffect } from 'react';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { PageBody } from '@/ui/layout/page/components/PageBody';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { IconPhone, IconMapPin, IconWifi, IconWifiOff } from 'twenty-ui';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';

// HVAC Components - Using lazy loading for performance
import { 
  HvacMobileDashboard,
  HVACErrorBoundary,
  useHVACPerformanceMonitoring,
  trackHVACUserAction
} from '~/modules/hvac';

// Loading component
const MobileSkeleton = () => (
  <div className="space-y-4">
    <div className="bg-gray-100 rounded-lg h-32 animate-pulse"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-gray-100 rounded-lg h-48 animate-pulse"></div>
      <div className="bg-gray-100 rounded-lg h-48 animate-pulse"></div>
    </div>
    <div className="bg-gray-100 rounded-lg h-64 animate-pulse"></div>
  </div>
);

export const HvacMobilePage: React.FC = () => {
  // Refs
  const toast = useRef<Toast>(null);

  // State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  // Performance monitoring
  const { getMetrics } = useHVACPerformanceMonitoring({
    enableMetrics: true,
    performanceThreshold: 300,
  });

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.current?.show({
        severity: 'warn',
        summary: 'Tryb offline',
        detail: 'Aplikacja działa w trybie offline. Dane będą zsynchronizowane po przywróceniu połączenia.',
        life: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle sync
  const handleSync = useCallback(async () => {
    if (!isOnline) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Brak połączenia',
        detail: 'Synchronizacja wymaga połączenia z internetem',
        life: 3000,
      });
      return;
    }

    setSyncStatus('syncing');
    
    trackHVACUserAction('mobile_sync', 'MOBILE', {
      timestamp: new Date().toISOString(),
      isOnline,
    });

    try {
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSyncStatus('idle');
      toast.current?.show({
        severity: 'success',
        summary: 'Zsynchronizowano',
        detail: 'Dane zostały pomyślnie zsynchronizowane',
        life: 3000,
      });
    } catch (error) {
      setSyncStatus('error');
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd synchronizacji',
        detail: 'Nie udało się zsynchronizować danych',
        life: 5000,
      });
    }
  }, [isOnline]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    trackHVACUserAction('mobile_refresh', 'MOBILE', {
      timestamp: new Date().toISOString(),
      isOnline,
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.current?.show({
        severity: 'success',
        summary: 'Odświeżono',
        detail: 'Interfejs mobilny został zaktualizowany',
        life: 3000,
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się odświeżyć interfejsu',
        life: 5000,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [isOnline]);

  return (
    <PageContainer>
      <Toast ref={toast} />
      
      <PageHeader title="Mobilny HVAC" Icon={IconPhone}>
        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <>
                <IconWifi size={16} className="text-green-500" />
                <span className="text-green-600">Online</span>
              </>
            ) : (
              <>
                <IconWifiOff size={16} className="text-red-500" />
                <span className="text-red-600">Offline</span>
              </>
            )}
          </div>

          {/* Sync status */}
          {syncStatus === 'syncing' && (
            <Badge value="Synchronizacja..." severity="info" />
          )}
          
          <div className="flex gap-2">
            <Button
              icon="pi pi-sync"
              label="Synchronizuj"
              className="p-button-outlined p-button-sm"
              onClick={handleSync}
              loading={syncStatus === 'syncing'}
              disabled={!isOnline}
            />
            
            <Button
              icon="pi pi-refresh"
              label="Odśwież"
              className="p-button-outlined p-button-sm"
              onClick={handleRefresh}
              loading={isRefreshing}
            />
          </div>
        </div>
      </PageHeader>
      
      <PageBody>
        {/* Offline warning */}
        {!isOnline && (
          <Message 
            severity="warn" 
            text="Aplikacja działa w trybie offline. Niektóre funkcje mogą być ograniczone."
            className="mb-4"
          />
        )}

        {/* Sync error */}
        {syncStatus === 'error' && (
          <Message 
            severity="error" 
            text="Wystąpił błąd podczas synchronizacji. Spróbuj ponownie."
            className="mb-4"
          />
        )}

        <HVACErrorBoundary>
          <Suspense fallback={<MobileSkeleton />}>
            <HvacMobileDashboard />
          </Suspense>
        </HVACErrorBoundary>
      </PageBody>
    </PageContainer>
  );
};
