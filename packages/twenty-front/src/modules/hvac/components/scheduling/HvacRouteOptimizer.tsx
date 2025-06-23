/**
 * HVAC Route Optimizer Component
 * "Pasja rodzi profesjonalizm" - Professional Route Optimization
 * 
 * Features:
 * - Route optimization algorithms
 * - Traffic analysis
 * - Time and distance calculations
 * - Fuel cost optimization
 * - Real-time route adjustments
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { Chip } from 'primereact/chip';
import { Timeline } from 'primereact/timeline';
import { Knob } from 'primereact/knob';
import { classNames } from 'primereact/utils';

// Types
interface RouteOptimization {
  id: string;
  technicianId: string;
  technicianName: string;
  jobs: OptimizedJob[];
  totalDistance: number;
  totalTime: number;
  fuelCost: number;
  efficiency: number;
  optimizedAt: Date;
}

interface OptimizedJob {
  id: string;
  customerName: string;
  address: string;
  scheduledTime: Date;
  estimatedDuration: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  distance: number;
  travelTime: number;
  order: number;
}

export const HvacRouteOptimizer: React.FC = () => {
  // Refs
  const toast = useRef<Toast>(null);

  // State
  const [optimizations, setOptimizations] = useState<RouteOptimization[]>([]);
  const [selectedOptimization, setSelectedOptimization] = useState<RouteOptimization | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockOptimizations: RouteOptimization[] = [
      {
        id: 'opt-1',
        technicianId: 'tech-1',
        technicianName: 'Jan Kowalski',
        jobs: [
          {
            id: 'job-1',
            customerName: 'Firma ABC',
            address: 'ul. Przykładowa 123',
            scheduledTime: new Date(),
            estimatedDuration: 120,
            priority: 'HIGH',
            distance: 5.2,
            travelTime: 15,
            order: 1,
          },
          {
            id: 'job-2',
            customerName: 'Firma XYZ',
            address: 'ul. Testowa 456',
            scheduledTime: new Date(),
            estimatedDuration: 90,
            priority: 'MEDIUM',
            distance: 3.8,
            travelTime: 12,
            order: 2,
          },
        ],
        totalDistance: 25.4,
        totalTime: 480,
        fuelCost: 45.50,
        efficiency: 92,
        optimizedAt: new Date(),
      },
    ];

    setOptimizations(mockOptimizations);
    setSelectedOptimization(mockOptimizations[0]);
  }, []);

  // Optimize routes
  const handleOptimizeRoutes = useCallback(async () => {
    try {
      setOptimizing(true);
      
      // Simulate optimization process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.current?.show({
        severity: 'success',
        summary: 'Trasy zoptymalizowane',
        detail: 'Wszystkie trasy zostały pomyślnie zoptymalizowane',
        life: 3000,
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd optymalizacji',
        detail: 'Nie udało się zoptymalizować tras',
        life: 3000,
      });
    } finally {
      setOptimizing(false);
    }
  }, []);

  // Priority template
  const priorityTemplate = (job: OptimizedJob) => {
    const severity = {
      CRITICAL: 'danger',
      HIGH: 'warning',
      MEDIUM: 'info',
      LOW: 'success',
    }[job.priority] || 'info';

    return <Badge value={job.priority} severity={severity as any} />;
  };

  // Distance template
  const distanceTemplate = (job: OptimizedJob) => {
    return `${job.distance.toFixed(1)} km`;
  };

  // Travel time template
  const travelTimeTemplate = (job: OptimizedJob) => {
    return `${job.travelTime} min`;
  };

  return (
    <div className="hvac-route-optimizer">
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex justify-content-between align-items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Optymalizacja Tras</h2>
        
        <div className="flex gap-2">
          <Button
            label="Optymalizuj wszystkie"
            icon="pi pi-route"
            className="p-button-success"
            onClick={handleOptimizeRoutes}
            loading={optimizing}
          />
          <Button
            label="Ustawienia"
            icon="pi pi-cog"
            className="p-button-outlined p-button-secondary"
          />
        </div>
      </div>

      {/* Optimization Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <div className="text-center">
            <h4 className="text-white mb-3">Efektywność</h4>
            <Knob
              value={selectedOptimization?.efficiency || 0}
              size={80}
              strokeWidth={8}
              valueColor="#10b981"
              rangeColor="#374151"
              textColor="#ffffff"
            />
            <div className="text-sm text-gray-400 mt-2">
              {selectedOptimization?.efficiency || 0}% efektywności
            </div>
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex justify-content-between align-items-center">
            <div>
              <div className="text-gray-400 text-sm mb-1">Łączny dystans</div>
              <div className="text-2xl font-bold text-blue-400">
                {selectedOptimization?.totalDistance.toFixed(1) || 0} km
              </div>
            </div>
            <i className="pi pi-map text-blue-400 text-3xl" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex justify-content-between align-items-center">
            <div>
              <div className="text-gray-400 text-sm mb-1">Łączny czas</div>
              <div className="text-2xl font-bold text-purple-400">
                {Math.round((selectedOptimization?.totalTime || 0) / 60)} h
              </div>
            </div>
            <i className="pi pi-clock text-purple-400 text-3xl" />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex justify-content-between align-items-center">
            <div>
              <div className="text-gray-400 text-sm mb-1">Koszt paliwa</div>
              <div className="text-2xl font-bold text-green-400">
                {selectedOptimization?.fuelCost.toFixed(2) || 0} PLN
              </div>
            </div>
            <i className="pi pi-dollar text-green-400 text-3xl" />
          </div>
        </Card>
      </div>

      {/* Technician Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route List */}
        <Card className="bg-gray-800 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Zoptymalizowane trasy
          </h3>
          
          <DataTable
            value={optimizations}
            className="p-datatable-sm"
            emptyMessage="Brak zoptymalizowanych tras"
            loading={loading}
            selectionMode="single"
            selection={selectedOptimization}
            onSelectionChange={(e) => setSelectedOptimization(e.value)}
          >
            <Column field="technicianName" header="Technik" />
            <Column 
              field="jobs" 
              header="Zlecenia"
              body={(opt) => opt.jobs.length}
            />
            <Column 
              field="totalDistance" 
              header="Dystans"
              body={(opt) => `${opt.totalDistance.toFixed(1)} km`}
            />
            <Column 
              field="totalTime" 
              header="Czas"
              body={(opt) => `${Math.round(opt.totalTime / 60)} h`}
            />
            <Column 
              field="efficiency" 
              header="Efektywność"
              body={(opt) => `${opt.efficiency}%`}
            />
          </DataTable>
        </Card>

        {/* Route Details */}
        <Card className="bg-gray-800 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Szczegóły trasy: {selectedOptimization?.technicianName}
          </h3>
          
          {selectedOptimization ? (
            <div>
              {/* Route Timeline */}
              <Timeline
                value={selectedOptimization.jobs}
                align="alternate"
                className="customized-timeline mb-4"
                marker={(item) => (
                  <span className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1 bg-blue-500">
                    {item.order}
                  </span>
                )}
                content={(item, index) => (
                  <Card className="bg-gray-700 border-gray-600">
                    <div className="flex justify-content-between align-items-start">
                      <div>
                        <h4 className="text-white font-medium">{item.customerName}</h4>
                        <p className="text-gray-300 text-sm">{item.address}</p>
                        <div className="flex gap-2 mt-2">
                          {priorityTemplate(item)}
                          <Chip label={`${item.estimatedDuration} min`} className="text-xs" />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">
                          {item.scheduledTime.toLocaleTimeString('pl-PL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {distanceTemplate(item)} • {travelTimeTemplate(item)}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              />

              {/* Route Summary */}
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="text-white font-medium mb-3">Podsumowanie trasy</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 text-sm">Łączny dystans</div>
                    <div className="text-white font-medium">
                      {selectedOptimization.totalDistance.toFixed(1)} km
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Łączny czas</div>
                    <div className="text-white font-medium">
                      {Math.round(selectedOptimization.totalTime / 60)} h
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Koszt paliwa</div>
                    <div className="text-white font-medium">
                      {selectedOptimization.fuelCost.toFixed(2)} PLN
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Efektywność</div>
                    <div className="text-white font-medium">
                      {selectedOptimization.efficiency}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="pi pi-route text-gray-400 text-4xl mb-3" />
              <div className="text-gray-400">
                Wybierz trasę z listy aby zobaczyć szczegóły
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
