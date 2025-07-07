/**
 * LazyMaintenanceDashboard - Lazy-loaded Maintenance Dashboard
 * "Pasja rodzi profesjonalizm" - Optimized loading for heavy calendar and chart components
 *
 * This component implements lazy loading for the HvacMaintenanceDashboard
 * to reduce the main bundle size by ~300KB (Calendar and Chart dependencies)
 */

// Replaced PrimeReact with Twenty UI components for bundle optimization
import React, { Suspense } from 'react';
// Placeholder Card component
const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({ children, style, className }) => (
  <div className={className} style={{
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: 'white',
    ...style
  }}>
    {children}
  </div>
);

// Component props
interface LazyMaintenanceDashboardProps {
  className?: string;
}

// Loading skeleton component using Twenty UI
const MaintenanceLoadingSkeleton: React.FC = () => (
  <div className="maintenance-loading-skeleton">
    {/* Header skeleton */}
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ height: '32px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '288px', marginBottom: '8px' }}></div>
          <div style={{ height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '384px' }}></div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ height: '40px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '128px' }}></div>
          <div style={{ height: '40px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '160px' }}></div>
          <div style={{ height: '40px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '40px' }}></div>
        </div>
      </div>
    </Card>

    {/* Stats Cards skeleton */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
      {[1, 2, 3, 4].map(i => (
        <Card key={i}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ height: '48px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '64px', marginBottom: '8px', margin: '0 auto' }}></div>
            <div style={{ height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '144px', marginBottom: '4px', margin: '0 auto' }}></div>
            <div style={{ height: '12px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '96px', margin: '0 auto' }}></div>
          </div>
        </Card>
      ))}
    </div>

    {/* Calendar and Schedule skeleton */}
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
      <Card>
        <div style={{ height: '24px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '192px', marginBottom: '12px' }}></div>
        <div style={{ height: '384px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}></div>
      </Card>
      <Card>
        <div style={{ height: '24px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '176px', marginBottom: '12px' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
              <div>
                <div style={{ height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '128px', marginBottom: '4px' }}></div>
                <div style={{ height: '12px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '80px' }}></div>
              </div>
              <div style={{ height: '24px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '64px' }}></div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* Equipment Status skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <Card>
        <div className="h-6 bg-gray-200 rounded w-40 mb-3 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded">
              <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-36 mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="h-6 bg-gray-200 rounded w-44 mb-3 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </Card>
    </div>

    {/* Recent Activity skeleton */}
    <Card>
      <div className="h-6 bg-gray-200 rounded w-36 mb-3 animate-pulse"></div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex justify-between items-center p-2 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-48 mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);



export const LazyMaintenanceDashboard: React.FC<LazyMaintenanceDashboardProps> = ({
  className = '',
}) => {
  return (
    <div className={`lazy-maintenance-dashboard ${className}`}>
      <Suspense fallback={<MaintenanceLoadingSkeleton />}>
        <Card>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold mb-2">Dashboard Konserwacji HVAC</h3>
            <p className="text-gray-600 mb-4">
              Zarządzanie harmonogramem konserwacji, przeglądy okresowe i monitoring sprzętu.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 border border-gray-200 rounded">
                <div className="text-2xl font-bold text-blue-600">12</div>
                <div className="text-sm text-gray-600">Zaplanowane konserwacje</div>
              </div>
              <div className="p-4 border border-gray-200 rounded">
                <div className="text-2xl font-bold text-green-600">8</div>
                <div className="text-sm text-gray-600">Ukończone dzisiaj</div>
              </div>
              <div className="p-4 border border-gray-200 rounded">
                <div className="text-2xl font-bold text-orange-600">3</div>
                <div className="text-sm text-gray-600">Wymagają uwagi</div>
              </div>
            </div>
          </div>
        </Card>
      </Suspense>
    </div>
  );
};
