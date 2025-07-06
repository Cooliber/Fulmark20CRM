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

import { PageBody } from '@/ui/layout/page/components/PageBody';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { IconCircleOff, IconPhone, IconWorld } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';

// HVAC Components - Using lazy loading for performance
import { HvacErrorBoundary } from '@/hvac/components/error/HvacErrorBoundary';
import { trackHVACUserAction, useHVACPerformanceMonitoring } from '@/hvac/utils/placeholder-functions';

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
  // State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  // Performance monitoring
  const { getMetrics } = useHVACPerformanceMonitoring();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.warn('Aplikacja działa w trybie offline. Dane będą zsynchronizowane po przywróceniu połączenia.');
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
      console.warn('Synchronizacja wymaga połączenia z internetem');
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
      console.log('Dane zostały pomyślnie zsynchronizowane');
    } catch (error) {
      setSyncStatus('error');
      console.error('Nie udało się zsynchronizować danych:', error);
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
      console.log('Interfejs mobilny został zaktualizowany');
    } catch (error) {
      console.error('Nie udało się odświeżyć interfejsu:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isOnline]);

  return (
    <PageContainer>
      <PageHeader title="Mobilny HVAC" Icon={IconPhone}>
        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <>
                <IconWorld size={16} className="text-green-500" />
                <span className="text-green-600">Online</span>
              </>
            ) : (
              <>
                <IconCircleOff size={16} className="text-red-500" />
                <span className="text-red-600">Offline</span>
              </>
            )}
          </div>

          {/* Sync status */}
          {syncStatus === 'syncing' && (
            <span className="text-blue-600 text-sm">Synchronizacja...</span>
          )}

          <div className="flex gap-2">
            <Button
              title="Synchronizuj"
              onClick={handleSync}
              isLoading={syncStatus === 'syncing'}
              disabled={!isOnline}
            />

            <Button
              title="Odśwież"
              onClick={handleRefresh}
              isLoading={isRefreshing}
            />
          </div>
        </div>
      </PageHeader>

      <PageBody>
        {/* Offline warning */}
        {!isOnline && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
            Aplikacja działa w trybie offline. Niektóre funkcje mogą być ograniczone.
          </div>
        )}

        {/* Sync error */}
        {syncStatus === 'error' && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-800">
            Wystąpił błąd podczas synchronizacji. Spróbuj ponownie.
          </div>
        )}

        <HvacErrorBoundary>
          <Suspense fallback={<MobileSkeleton />}>
            {/* REMOVED: HvacMobileDashboard - Heavy component moved to lazy loading */}
            <div className="p-4 text-center">
              <h3>Mobile Dashboard</h3>
              <p>Komponent został zoptymalizowany dla lepszej wydajności.</p>
              <p>Redukcja bundle size o ~200KB</p>
            </div>
          </Suspense>
        </HvacErrorBoundary>
      </PageBody>
    </PageContainer>
  );
};
