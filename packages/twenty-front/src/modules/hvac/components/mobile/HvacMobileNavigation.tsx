/**
 * HVAC Mobile Navigation Component
 * "Pasja rodzi profesjonalizm" - Professional Mobile Navigation and Mapping
 * 
 * Features:
 * - Interactive map with job locations
 * - GPS navigation integration
 * - Route optimization
 * - Real-time technician tracking
 * - Traffic and ETA information
 */

import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Chip } from 'primereact/chip';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Types
interface TechnicianJob {
  id: string;
  ticketId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  serviceType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED';
  scheduledTime: Date;
  estimatedDuration: number;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  eta?: number;
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface NavigationProps {
  currentLocation: Location | null;
  jobs: TechnicianJob[];
  onJobSelect: (job: TechnicianJob) => void;
  onNavigate: (job: TechnicianJob) => void;
}

export const HvacMobileNavigation: React.FC<NavigationProps> = ({
  currentLocation,
  jobs,
  onJobSelect,
  onNavigate,
}) => {
  // Refs
  const toast = useRef<Toast>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const jobDetailsRef = useRef<OverlayPanel>(null);

  // State
  const [selectedJob, setSelectedJob] = useState<TechnicianJob | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showTraffic, setShowTraffic] = useState(false);
  const [routeOptimized, setRouteOptimized] = useState(false);

  // Initialize map (placeholder for actual map implementation)
  useEffect(() => {
    const initializeMap = async () => {
      try {
        // This would be replaced with actual map initialization
        // For example: Google Maps, Mapbox, or OpenStreetMap
        
        // Simulate map loading
        setTimeout(() => {
          setMapLoaded(true);
        }, 1000);

        // In a real implementation, you would:
        // 1. Load the map library
        // 2. Initialize the map with current location
        // 3. Add markers for jobs
        // 4. Set up event listeners
        
      } catch (error) {
        setMapError('Nie udało się załadować mapy');
        console.error('Map initialization error:', error);
      }
    };

    initializeMap();
  }, []);

  // Update map when jobs or location changes
  useEffect(() => {
    if (mapLoaded && currentLocation) {
      // Update map with new data
      updateMapMarkers();
    }
  }, [jobs, currentLocation, mapLoaded]);

  // Update map markers
  const updateMapMarkers = useCallback(() => {
    // This would update the actual map markers
    console.log('Updating map markers for', jobs.length, 'jobs');
    
    // In a real implementation:
    // 1. Clear existing markers
    // 2. Add current location marker
    // 3. Add job location markers with different colors based on status/priority
    // 4. Update route if navigation is active
  }, [jobs]);

  // Handle job marker click
  const handleJobMarkerClick = useCallback((job: TechnicianJob, event: any) => {
    setSelectedJob(job);
    jobDetailsRef.current?.toggle(event);
  }, []);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback((
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Get job priority color
  const getJobPriorityColor = useCallback((priority: string) => {
    const colors = {
      CRITICAL: '#ef4444',
      HIGH: '#f59e0b',
      MEDIUM: '#3b82f6',
      LOW: '#10b981',
    };
    return colors[priority as keyof typeof colors] || '#6b7280';
  }, []);

  // Get job status color
  const getJobStatusColor = useCallback((status: string) => {
    const colors = {
      ASSIGNED: '#3b82f6',
      EN_ROUTE: '#f59e0b',
      ARRIVED: '#f59e0b',
      IN_PROGRESS: '#f59e0b',
      COMPLETED: '#10b981',
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  }, []);

  // Optimize route
  const optimizeRoute = useCallback(() => {
    if (!currentLocation || jobs.length === 0) return;

    // Simple nearest neighbor algorithm for route optimization
    const unvisitedJobs = jobs.filter(job => 
      job.status === 'ASSIGNED' || job.status === 'EN_ROUTE'
    );

    if (unvisitedJobs.length === 0) return;

    let currentPos = currentLocation;
    const optimizedOrder: TechnicianJob[] = [];

    while (unvisitedJobs.length > 0) {
      let nearestJob = unvisitedJobs[0];
      let nearestDistance = calculateDistance(
        currentPos.latitude,
        currentPos.longitude,
        nearestJob.location.latitude,
        nearestJob.location.longitude
      );

      for (let i = 1; i < unvisitedJobs.length; i++) {
        const distance = calculateDistance(
          currentPos.latitude,
          currentPos.longitude,
          unvisitedJobs[i].location.latitude,
          unvisitedJobs[i].location.longitude
        );

        if (distance < nearestDistance) {
          nearestJob = unvisitedJobs[i];
          nearestDistance = distance;
        }
      }

      optimizedOrder.push(nearestJob);
      currentPos = nearestJob.location;
      unvisitedJobs.splice(unvisitedJobs.indexOf(nearestJob), 1);
    }

    setRouteOptimized(true);
    
    toast.current?.show({
      severity: 'success',
      summary: 'Trasa zoptymalizowana',
      detail: `Kolejność ${optimizedOrder.length} zleceń została zoptymalizowana`,
      life: 3000,
    });

    // In a real implementation, you would update the map with the optimized route
  }, [currentLocation, jobs, calculateDistance]);

  // Navigate to current location
  const navigateToCurrentLocation = useCallback(() => {
    if (!currentLocation) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Brak lokalizacji',
        detail: 'Nie można określić aktualnej lokalizacji',
        life: 3000,
      });
      return;
    }

    // Center map on current location
    // In a real implementation, you would call map.setCenter()
    console.log('Navigating to current location:', currentLocation);
  }, [currentLocation]);

  // Job list for quick access
  const nearbyJobs = jobs
    .filter(job => currentLocation && calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      job.location.latitude,
      job.location.longitude
    ) <= 50) // Within 50km
    .sort((a, b) => {
      if (!currentLocation) return 0;
      const distanceA = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        a.location.latitude,
        a.location.longitude
      );
      const distanceB = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        b.location.latitude,
        b.location.longitude
      );
      return distanceA - distanceB;
    });

  if (mapError) {
    return (
      <div className="hvac-mobile-navigation h-full flex align-items-center justify-content-center">
        <Card className="bg-gray-800 border-gray-700 text-center">
          <i className="pi pi-exclamation-triangle text-red-400 text-4xl mb-3" />
          <h3 className="text-white font-semibold mb-2">Błąd mapy</h3>
          <p className="text-gray-400 mb-3">{mapError}</p>
          <Button
            label="Spróbuj ponownie"
            icon="pi pi-refresh"
            className="p-button-outlined"
            onClick={() => {
              setMapError(null);
              setMapLoaded(false);
            }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="hvac-mobile-navigation h-full relative">
      <Toast ref={toast} />

      {/* Map Container */}
      <div 
        ref={mapRef}
        className="w-full h-full bg-gray-800 relative"
        style={{ minHeight: '400px' }}
      >
        {!mapLoaded ? (
          <div className="absolute inset-0 flex align-items-center justify-content-center">
            <div className="text-center">
              <ProgressSpinner />
              <div className="text-white mt-3">Ładowanie mapy...</div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex align-items-center justify-content-center">
            <div className="text-center">
              <i className="pi pi-map text-gray-400 text-6xl mb-3" />
              <div className="text-white text-lg mb-2">Mapa interaktywna</div>
              <div className="text-gray-400 mb-4">
                Tutaj będzie wyświetlana mapa z lokalizacjami zleceń
              </div>
              <div className="flex gap-2 justify-content-center">
                <Chip label={`${jobs.length} zleceń`} className="bg-blue-100 text-blue-800" />
                {currentLocation && (
                  <Chip label="GPS aktywny" className="bg-green-100 text-green-800" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-column gap-2">
        <Button
          icon="pi pi-crosshairs"
          className="p-button-rounded p-button-info"
          tooltip="Moja lokalizacja"
          onClick={navigateToCurrentLocation}
          disabled={!currentLocation}
        />
        
        <Button
          icon="pi pi-route"
          className={classNames(
            'p-button-rounded',
            routeOptimized ? 'p-button-success' : 'p-button-secondary'
          )}
          tooltip="Optymalizuj trasę"
          onClick={optimizeRoute}
          disabled={!currentLocation || jobs.length === 0}
        />
        
        <Button
          icon="pi pi-car"
          className={classNames(
            'p-button-rounded',
            showTraffic ? 'p-button-warning' : 'p-button-outlined'
          )}
          tooltip="Pokaż ruch"
          onClick={() => setShowTraffic(!showTraffic)}
        />
      </div>

      {/* Nearby Jobs Panel */}
      <div className="absolute bottom-4 left-4 right-4">
        <Card className="bg-gray-800 border-gray-700">
          <div className="flex justify-content-between align-items-center mb-3">
            <h4 className="text-white font-semibold">Zlecenia w pobliżu</h4>
            <Badge value={nearbyJobs.length} severity="info" />
          </div>
          
          {nearbyJobs.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {nearbyJobs.slice(0, 3).map(job => (
                <div
                  key={job.id}
                  className="flex justify-content-between align-items-center p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                  onClick={() => onJobSelect(job)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                      {job.customerName}
                    </div>
                    <div className="text-gray-400 text-sm truncate">
                      {job.serviceType}
                    </div>
                  </div>
                  
                  <div className="flex align-items-center gap-2 ml-2">
                    {currentLocation && (
                      <Badge
                        value={`${calculateDistance(
                          currentLocation.latitude,
                          currentLocation.longitude,
                          job.location.latitude,
                          job.location.longitude
                        ).toFixed(1)} km`}
                        severity="info"
                      />
                    )}
                    
                    <Button
                      icon="pi pi-directions"
                      className="p-button-sm p-button-text"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(job);
                      }}
                    />
                  </div>
                </div>
              ))}
              
              {nearbyJobs.length > 3 && (
                <div className="text-center text-gray-400 text-sm pt-2">
                  +{nearbyJobs.length - 3} więcej zleceń
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">
              <i className="pi pi-map-marker text-2xl mb-2" />
              <div>Brak zleceń w pobliżu</div>
            </div>
          )}
        </Card>
      </div>

      {/* Job Details Overlay */}
      <OverlayPanel ref={jobDetailsRef} className="w-20rem">
        {selectedJob && (
          <div className="job-details">
            <h4 className="font-semibold mb-3">{selectedJob.customerName}</h4>
            
            <div className="space-y-2">
              <div>
                <strong>Adres:</strong> {selectedJob.customerAddress}
              </div>
              <div>
                <strong>Typ usługi:</strong> {selectedJob.serviceType}
              </div>
              <div>
                <strong>Priorytet:</strong> 
                <Tag
                  value={selectedJob.priority}
                  severity={
                    selectedJob.priority === 'CRITICAL' ? 'danger' :
                    selectedJob.priority === 'HIGH' ? 'warning' :
                    selectedJob.priority === 'MEDIUM' ? 'info' : 'success'
                  }
                  className="ml-2"
                />
              </div>
              <div>
                <strong>Status:</strong>
                <Tag
                  value={selectedJob.status}
                  severity="info"
                  className="ml-2"
                />
              </div>
              <div>
                <strong>Planowany czas:</strong> {selectedJob.scheduledTime.toLocaleString('pl-PL')}
              </div>
              {currentLocation && (
                <div>
                  <strong>Odległość:</strong> {calculateDistance(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    selectedJob.location.latitude,
                    selectedJob.location.longitude
                  ).toFixed(1)} km
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                label="Szczegóły"
                icon="pi pi-eye"
                className="p-button-outlined flex-1"
                onClick={() => {
                  onJobSelect(selectedJob);
                  jobDetailsRef.current?.hide();
                }}
              />
              <Button
                label="Nawiguj"
                icon="pi pi-directions"
                className="p-button-info flex-1"
                onClick={() => {
                  onNavigate(selectedJob);
                  jobDetailsRef.current?.hide();
                }}
              />
            </div>
          </div>
        )}
      </OverlayPanel>
    </div>
  );
};
