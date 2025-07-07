/**
 * HVAC Technician Productivity Tracker
 * "Pasja rodzi profesjonalizm" - Professional Technician Performance Tracking
 * 
 * Features:
 * - Individual technician performance metrics
 * - Productivity trends and analysis
 * - Skill development tracking
 * - Performance benchmarking
 * - Goal setting and achievement tracking
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
// REMOVED: Heavy PrimeReact imports - Bundle size optimization (~400KB)
// Replaced with TwentyCRM native components
import { Button } from 'twenty-ui/input';
// import { Card } from 'primereact/card';
// import { Chart } from 'primereact/chart';
// import { Knob } from 'primereact/knob';
// import { ProgressBar } from 'primereact/progressbar';
// import { DataTable } from 'primereact/datatable';
// import { Column } from 'primereact/column';
// import { Badge } from 'primereact/badge';
// import { Tag } from 'primereact/tag';
// import { Chip } from 'primereact/chip';
// import { Toast } from 'primereact/toast';
// import { TabView, TabPanel } from 'primereact/tabview';
// import { Avatar } from 'primereact/avatar';
// import { Rating } from 'primereact/rating';
// import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Divider } from 'primereact/divider';
import { classNames } from 'primereact/utils';

// Types
interface TechnicianMetrics {
  id: string;
  name: string;
  avatar?: string;
  jobsCompleted: number;
  jobsAssigned: number;
  averageJobTime: number;
  customerRating: number;
  efficiency: number;
  revenue: number;
  hoursWorked: number;
  skills: TechnicianSkill[];
  certifications: string[];
  goals: TechnicianGoal[];
  performance: PerformanceHistory[];
}

interface TechnicianSkill {
  name: string;
  level: number; // 1-5
  category: 'HVAC' | 'ELECTRICAL' | 'PLUMBING' | 'SAFETY' | 'CUSTOMER_SERVICE';
  lastAssessed: Date;
}

interface TechnicianGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: Date;
  status: 'ON_TRACK' | 'AT_RISK' | 'ACHIEVED' | 'MISSED';
}

interface PerformanceHistory {
  date: Date;
  jobsCompleted: number;
  efficiency: number;
  customerRating: number;
  revenue: number;
}

export const HvacTechnicianProductivity: React.FC = () => {
  // Refs
  const toast = useRef<Toast>(null);

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [technicians, setTechnicians] = useState<TechnicianMetrics[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    new Date(),
  ]);
  const [loading, setLoading] = useState(false);

  // Chart data
  const [performanceChart, setPerformanceChart] = useState<any>({});
  const [skillsChart, setSkillsChart] = useState<any>({});
  const [comparisonChart, setComparisonChart] = useState<any>({});

  // Mock data initialization
  useEffect(() => {
    const mockTechnicians: TechnicianMetrics[] = [
      {
        id: 'tech-1',
        name: 'Jan Kowalski',
        jobsCompleted: 45,
        jobsAssigned: 48,
        averageJobTime: 110,
        customerRating: 4.8,
        efficiency: 94,
        revenue: 14400,
        hoursWorked: 168,
        skills: [
          { name: 'Klimatyzacja', level: 5, category: 'HVAC', lastAssessed: new Date() },
          { name: 'Wentylacja', level: 4, category: 'HVAC', lastAssessed: new Date() },
          { name: 'Elektryka', level: 3, category: 'ELECTRICAL', lastAssessed: new Date() },
          { name: 'Obsługa klienta', level: 5, category: 'CUSTOMER_SERVICE', lastAssessed: new Date() },
        ],
        certifications: ['EPA 608', 'OSHA 10', 'HVAC Excellence'],
        goals: [
          {
            id: 'goal-1',
            title: 'Ukończ 50 zleceń w miesiącu',
            target: 50,
            current: 45,
            unit: 'zleceń',
            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            status: 'ON_TRACK',
          },
          {
            id: 'goal-2',
            title: 'Osiągnij 95% efektywności',
            target: 95,
            current: 94,
            unit: '%',
            deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            status: 'ON_TRACK',
          },
        ],
        performance: [
          { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), jobsCompleted: 8, efficiency: 92, customerRating: 4.7, revenue: 2560 },
          { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), jobsCompleted: 9, efficiency: 94, customerRating: 4.8, revenue: 2880 },
          { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), jobsCompleted: 7, efficiency: 93, customerRating: 4.8, revenue: 2240 },
          { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), jobsCompleted: 10, efficiency: 95, customerRating: 4.9, revenue: 3200 },
          { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), jobsCompleted: 6, efficiency: 91, customerRating: 4.6, revenue: 1920 },
          { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), jobsCompleted: 5, efficiency: 96, customerRating: 5.0, revenue: 1600 },
        ],
      },
      {
        id: 'tech-2',
        name: 'Anna Nowak',
        jobsCompleted: 38,
        jobsAssigned: 42,
        averageJobTime: 125,
        customerRating: 4.7,
        efficiency: 91,
        revenue: 12160,
        hoursWorked: 165,
        skills: [
          { name: 'Pompy ciepła', level: 5, category: 'HVAC', lastAssessed: new Date() },
          { name: 'Systemy grzewcze', level: 4, category: 'HVAC', lastAssessed: new Date() },
          { name: 'Hydraulika', level: 3, category: 'PLUMBING', lastAssessed: new Date() },
          { name: 'Bezpieczeństwo', level: 5, category: 'SAFETY', lastAssessed: new Date() },
        ],
        certifications: ['EPA 608', 'Local Building Code'],
        goals: [
          {
            id: 'goal-3',
            title: 'Zwiększ efektywność do 93%',
            target: 93,
            current: 91,
            unit: '%',
            deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            status: 'AT_RISK',
          },
        ],
        performance: [
          { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), jobsCompleted: 6, efficiency: 89, customerRating: 4.6, revenue: 1920 },
          { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), jobsCompleted: 7, efficiency: 91, customerRating: 4.7, revenue: 2240 },
          { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), jobsCompleted: 5, efficiency: 90, customerRating: 4.7, revenue: 1600 },
          { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), jobsCompleted: 8, efficiency: 92, customerRating: 4.8, revenue: 2560 },
          { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), jobsCompleted: 6, efficiency: 91, customerRating: 4.7, revenue: 1920 },
          { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), jobsCompleted: 6, efficiency: 93, customerRating: 4.8, revenue: 1920 },
        ],
      },
    ];

    setTechnicians(mockTechnicians);
    setSelectedTechnician(mockTechnicians[0].id);
  }, []);

  // Initialize charts
  useEffect(() => {
    if (technicians.length === 0 || !selectedTechnician) return;

    const selectedTech = technicians.find(t => t.id === selectedTechnician);
    if (!selectedTech) return;

    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#ffffff';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#9ca3af';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#374151';

    // Performance trend chart
    const performanceData = {
      labels: selectedTech.performance.map(p => p.date.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Zlecenia',
          data: selectedTech.performance.map(p => p.jobsCompleted),
          fill: false,
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          tension: 0.4,
          yAxisID: 'y',
        },
        {
          label: 'Efektywność (%)',
          data: selectedTech.performance.map(p => p.efficiency),
          fill: false,
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    };

    const performanceOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
        y: {
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    };

    // Skills radar chart
    const skillsData = {
      labels: selectedTech.skills.map(s => s.name),
      datasets: [
        {
          label: 'Poziom umiejętności',
          data: selectedTech.skills.map(s => s.level),
          fill: true,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: '#3b82f6',
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#3b82f6',
        },
      ],
    };

    const skillsOptions = {
      maintainAspectRatio: false,
      aspectRatio: 1,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        r: {
          angleLines: {
            color: surfaceBorder,
          },
          grid: {
            color: surfaceBorder,
          },
          pointLabels: {
            color: textColorSecondary,
          },
          ticks: {
            color: textColorSecondary,
            backdropColor: 'transparent',
          },
          min: 0,
          max: 5,
        },
      },
    };

    // Comparison chart
    const comparisonData = {
      labels: technicians.map(t => t.name),
      datasets: [
        {
          label: 'Efektywność (%)',
          data: technicians.map(t => t.efficiency),
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6',
          borderWidth: 1,
        },
        {
          label: 'Ocena klientów',
          data: technicians.map(t => t.customerRating * 20), // Scale to 100
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          borderWidth: 1,
        },
      ],
    };

    const comparisonOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
      },
    };

    setPerformanceChart({ data: performanceData, options: performanceOptions });
    setSkillsChart({ data: skillsData, options: skillsOptions });
    setComparisonChart({ data: comparisonData, options: comparisonOptions });
  }, [technicians, selectedTechnician]);

  // Technician options for dropdown
  const technicianOptions = technicians.map(tech => ({
    label: tech.name,
    value: tech.id,
  }));

  // Get selected technician data
  const selectedTechData = technicians.find(t => t.id === selectedTechnician);

  // Goal status template
  const goalStatusTemplate = (goal: TechnicianGoal) => {
    const statusConfig = {
      ON_TRACK: { label: 'Na dobrej drodze', severity: 'success' },
      AT_RISK: { label: 'Zagrożone', severity: 'warning' },
      ACHIEVED: { label: 'Osiągnięte', severity: 'success' },
      MISSED: { label: 'Nieosiągnięte', severity: 'danger' },
    }[goal.status];

    return <Tag value={statusConfig.label} severity={statusConfig.severity as any} />;
  };

  // Goal progress template
  const goalProgressTemplate = (goal: TechnicianGoal) => {
    const progress = Math.min((goal.current / goal.target) * 100, 100);
    return (
      <div className="flex align-items-center gap-2">
        <ProgressBar value={progress} className="w-8rem" style={{ height: '0.5rem' }} />
        <span className="text-white text-sm">
          {goal.current}/{goal.target} {goal.unit}
        </span>
      </div>
    );
  };

  // Skill level template
  const skillLevelTemplate = (skill: TechnicianSkill) => {
    return (
      <div className="flex align-items-center gap-2">
        <Rating value={skill.level} readOnly stars={5} cancel={false} />
        <span className="text-white text-sm">{skill.level}/5</span>
      </div>
    );
  };

  // Skill category template
  const skillCategoryTemplate = (skill: TechnicianSkill) => {
    const categoryConfig = {
      HVAC: { label: 'HVAC', color: 'blue' },
      ELECTRICAL: { label: 'Elektryka', color: 'yellow' },
      PLUMBING: { label: 'Hydraulika', color: 'cyan' },
      SAFETY: { label: 'Bezpieczeństwo', color: 'red' },
      CUSTOMER_SERVICE: { label: 'Obsługa klienta', color: 'green' },
    }[skill.category];

    return (
      <Chip
        label={categoryConfig.label}
        className={`bg-${categoryConfig.color}-100 text-${categoryConfig.color}-800 text-xs`}
      />
    );
  };

  return (
    <div className="hvac-technician-productivity">
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex justify-content-between align-items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Produktywność Techników</h2>
        
        <div className="flex gap-2">
          <Dropdown
            value={selectedTechnician}
            options={technicianOptions}
            onChange={(e) => setSelectedTechnician(e.value)}
            placeholder="Wybierz technika"
            className="w-12rem"
          />
          <Calendar
            value={dateRange}
            onChange={(e) => setDateRange(e.value as [Date, Date])}
            selectionMode="range"
            readOnlyInput
            showIcon
            placeholder="Wybierz okres"
          />
        </div>
      </div>

      {/* Technician Overview */}
      {selectedTechData && (
        <Card className="mb-6 bg-gray-800 border-gray-700">
          <div className="flex align-items-center gap-4 mb-4">
            <Avatar
              label={selectedTechData.name.split(' ').map(n => n[0]).join('')}
              size="xlarge"
              shape="circle"
              className="bg-blue-500"
            />
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">
                {selectedTechData.name}
              </h3>
              <div className="flex gap-2 mb-2">
                {selectedTechData.certifications.map((cert, index) => (
                  <Chip key={index} label={cert} className="text-xs bg-green-100 text-green-800" />
                ))}
              </div>
              <div className="flex align-items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {selectedTechData.jobsCompleted}
                  </div>
                  <div className="text-xs text-gray-400">Ukończone</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {selectedTechData.efficiency}%
                  </div>
                  <div className="text-xs text-gray-400">Efektywność</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {selectedTechData.customerRating.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-400">Ocena</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {selectedTechData.revenue.toLocaleString('pl-PL')} PLN
                  </div>
                  <div className="text-xs text-gray-400">Przychód</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Analytics Tabs */}
      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        <TabPanel header="Wydajność" leftIcon="pi pi-chart-line">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Trend wydajności</h3>
              <Chart 
                type="line" 
                data={performanceChart.data} 
                options={performanceChart.options}
                style={{ height: '300px' }}
              />
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Porównanie z zespołem</h3>
              <Chart 
                type="bar" 
                data={comparisonChart.data} 
                options={comparisonChart.options}
                style={{ height: '300px' }}
              />
            </Card>
          </div>
        </TabPanel>

        <TabPanel header="Umiejętności" leftIcon="pi pi-star">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Profil umiejętności</h3>
              <Chart 
                type="radar" 
                data={skillsChart.data} 
                options={skillsChart.options}
                style={{ height: '300px' }}
              />
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-white font-semibold mb-4">Szczegóły umiejętności</h3>
              {selectedTechData && (
                <DataTable
                  value={selectedTechData.skills}
                  className="p-datatable-sm"
                  emptyMessage="Brak danych o umiejętnościach"
                >
                  <Column field="name" header="Umiejętność" />
                  <Column field="category" header="Kategoria" body={skillCategoryTemplate} />
                  <Column field="level" header="Poziom" body={skillLevelTemplate} />
                  <Column 
                    field="lastAssessed" 
                    header="Ostatnia ocena"
                    body={(skill) => skill.lastAssessed.toLocaleDateString('pl-PL')}
                  />
                </DataTable>
              )}
            </Card>
          </div>
        </TabPanel>

        <TabPanel header="Cele" leftIcon="pi pi-flag">
          <Card className="bg-gray-800 border-gray-700">
            <h3 className="text-white font-semibold mb-4">Cele i osiągnięcia</h3>
            {selectedTechData && selectedTechData.goals.length > 0 ? (
              <DataTable
                value={selectedTechData.goals}
                className="p-datatable-sm"
                emptyMessage="Brak celów"
              >
                <Column field="title" header="Cel" />
                <Column field="progress" header="Postęp" body={goalProgressTemplate} />
                <Column field="status" header="Status" body={goalStatusTemplate} />
                <Column 
                  field="deadline" 
                  header="Termin"
                  body={(goal) => goal.deadline.toLocaleDateString('pl-PL')}
                />
              </DataTable>
            ) : (
              <div className="text-center py-8">
                <i className="pi pi-flag text-gray-400 text-4xl mb-3" />
                <div className="text-gray-400 mb-4">
                  Brak zdefiniowanych celów dla tego technika
                </div>
                <Button
                  label="Dodaj cel"
                  icon="pi pi-plus"
                  className="p-button-outlined"
                />
              </div>
            )}
          </Card>
        </TabPanel>
      </TabView>
    </div>
  );
};
