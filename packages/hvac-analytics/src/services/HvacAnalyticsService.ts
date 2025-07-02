/**
 * HVAC Analytics Service
 * "Pasja rodzi profesjonalizm" - Professional Analytics Data Management
 * 
 * Features:
 * - Performance metrics calculation
 * - Trend analysis and forecasting
 * - Report generation
 * - Real-time data processing
 * - Benchmark comparisons
 */


// Removed Effect library dependency - using Promise-based approach instead

// Types
export interface ServicePlannerMetrics {
  totalJobs: number;
  completedJobs: number;
  averageJobDuration: number;
  customerSatisfaction: number;
  technicianUtilization: number;
  routeEfficiency: number;
  costPerJob: number;
  revenuePerJob: number;
  firstTimeFixRate: number;
  emergencyResponseTime: number;
}

export interface TechnicianPerformance {
  id: string;
  name: string;
  jobsCompleted: number;
  averageJobTime: number;
  customerRating: number;
  efficiency: number;
  revenue: number;
  skills: TechnicianSkill[];
  certifications: string[];
  goals: TechnicianGoal[];
  performance: PerformanceHistory[];
}

export interface TechnicianSkill {
  name: string;
  level: number;
  category: 'HVAC' | 'ELECTRICAL' | 'PLUMBING' | 'SAFETY' | 'CUSTOMER_SERVICE';
  lastAssessed: Date;
}

export interface TechnicianGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: Date;
  status: 'ON_TRACK' | 'AT_RISK' | 'ACHIEVED' | 'MISSED';
}

export interface PerformanceHistory {
  date: Date;
  jobsCompleted: number;
  efficiency: number;
  customerRating: number;
  revenue: number;
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface BenchmarkData {
  metric: string;
  current: number;
  industry: number;
  best: number;
  unit: string;
}

export interface AnalyticsFilters {
  dateRange: [Date, Date];
  technicianIds?: string[];
  serviceTypes?: string[];
  regions?: string[];
}

export interface ReportConfig {
  type: 'performance' | 'financial' | 'satisfaction' | 'predictive' | 'comprehensive' | 'excel';
  format: 'PDF' | 'EXCEL' | 'CSV';
  filters: AnalyticsFilters;
  includeCharts: boolean;
  includeRawData: boolean;
}

// Service Implementation
export class HvacAnalyticsService {
  private static instance: HvacAnalyticsService;

  public static getInstance(): HvacAnalyticsService {
    if (!HvacAnalyticsService.instance) {
      HvacAnalyticsService.instance = new HvacAnalyticsService();
    }
    return HvacAnalyticsService.instance;
  }

  // Get service planner metrics
  public async getServicePlannerMetrics(filters: AnalyticsFilters): Promise<ServicePlannerMetrics> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        totalJobs: 245,
        completedJobs: 228,
        averageJobDuration: 125,
        customerSatisfaction: 4.6,
        technicianUtilization: 87,
        routeEfficiency: 92,
        costPerJob: 180,
        revenuePerJob: 320,
        firstTimeFixRate: 89,
        emergencyResponseTime: 18,
      };
    } catch (error) {
      throw new Error(`Failed to fetch service planner metrics: ${error}`);
    }
  }

  // Get technician performance data
  public async getTechnicianPerformance(filters: AnalyticsFilters): Promise<TechnicianPerformance[]> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      return [
        {
          id: 'tech-1',
          name: 'Jan Kowalski',
          jobsCompleted: 45,
          averageJobTime: 110,
          customerRating: 4.8,
          efficiency: 94,
          revenue: 14400,
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
          averageJobTime: 125,
          customerRating: 4.7,
          efficiency: 91,
          revenue: 12160,
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
    } catch (error) {
      throw new Error(`Failed to fetch technician performance: ${error}`);
    }
  }

  // Get performance alerts
  public async getPerformanceAlerts(): Promise<PerformanceAlert[]> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));

      return [
        {
          id: 'alert-1',
          metric: 'Czas odpowiedzi na awarie',
          severity: 'WARNING',
          message: 'Czas odpowiedzi przekroczył cel o 3 minuty',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          acknowledged: false,
        },
        {
          id: 'alert-2',
          metric: 'Wykorzystanie techników',
          severity: 'INFO',
          message: 'Wykorzystanie techników osiągnęło optymalny poziom',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          acknowledged: true,
        },
      ];
    } catch (error) {
      throw new Error(`Failed to fetch performance alerts: ${error}`);
    }
  }

  // Get benchmark data
  public async getBenchmarkData(): Promise<BenchmarkData[]> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      return [
        {
          metric: 'Czas odpowiedzi',
          current: 18,
          industry: 25,
          best: 12,
          unit: 'min',
        },
        {
          metric: 'Pierwsza naprawa',
          current: 89,
          industry: 82,
          best: 95,
          unit: '%',
        },
        {
          metric: 'Zadowolenie klientów',
          current: 4.6,
          industry: 4.2,
          best: 4.8,
          unit: '/5',
        },
        {
          metric: 'Efektywność tras',
          current: 92,
          industry: 85,
          best: 96,
          unit: '%',
        },
      ];
    } catch (error) {
      throw new Error(`Failed to fetch benchmark data: ${error}`);
    }
  }

  // Generate report
  public async generateReport(config: ReportConfig): Promise<Blob> {
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create mock PDF blob
      const content = `HVAC Analytics Report - ${config.type}\nGenerated: ${new Date().toLocaleString('pl-PL')}`;
      return new Blob([content], { type: 'application/pdf' });
    } catch (error) {
      throw new Error(`Failed to generate report: ${error}`);
    }
  }

  // Acknowledge alert
  public async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log(`Alert ${alertId} acknowledged`);
    } catch (error) {
      throw new Error(`Failed to acknowledge alert: ${error}`);
    }
  }

  // Calculate efficiency trends
  public calculateEfficiencyTrends(data: PerformanceHistory[]): number[] {
    try {
      if (data.length < 2) return [];

      const trends: number[] = [];
      for (let i = 1; i < data.length; i++) {
        const current = data[i].efficiency;
        const previous = data[i - 1].efficiency;
        const trend = ((current - previous) / previous) * 100;
        trends.push(trend);
      }

      return trends;
    } catch (error) {
      throw new Error(`Failed to calculate efficiency trends: ${error}`);
    }
  }

  // Predict future performance
  public predictPerformance(historicalData: PerformanceHistory[], daysAhead: number): PerformanceHistory[] {
    try {
      if (historicalData.length < 3) {
        throw new Error('Insufficient data for prediction');
      }

      const predictions: PerformanceHistory[] = [];
      const lastData = historicalData[historicalData.length - 1];

      // Simple linear trend prediction
      const efficiencyTrend = this.calculateLinearTrend(historicalData.map(d => d.efficiency));
      const jobsTrend = this.calculateLinearTrend(historicalData.map(d => d.jobsCompleted));
      const ratingTrend = this.calculateLinearTrend(historicalData.map(d => d.customerRating));
      const revenueTrend = this.calculateLinearTrend(historicalData.map(d => d.revenue));

      for (let i = 1; i <= daysAhead; i++) {
        const futureDate = new Date(lastData.date.getTime() + i * 24 * 60 * 60 * 1000);
        predictions.push({
          date: futureDate,
          jobsCompleted: Math.max(0, Math.round(lastData.jobsCompleted + jobsTrend * i)),
          efficiency: Math.max(0, Math.min(100, lastData.efficiency + efficiencyTrend * i)),
          customerRating: Math.max(1, Math.min(5, lastData.customerRating + ratingTrend * i)),
          revenue: Math.max(0, lastData.revenue + revenueTrend * i),
        });
      }

      return predictions;
    } catch (error) {
      throw new Error(`Failed to predict performance: ${error}`);
    }
  }

  // Helper method for linear trend calculation
  private calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices 0, 1, 2, ..., n-1
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
    const sumX2 = values.reduce((sum, _, index) => sum + index * index, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }
}

// Export singleton instance
export const hvacAnalyticsService = HvacAnalyticsService.getInstance();
