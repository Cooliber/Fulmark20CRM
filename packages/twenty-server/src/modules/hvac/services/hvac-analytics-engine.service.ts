/**
 * HVAC Analytics Engine Service
 * "Pasja rodzi profesjonalizm" - Professional data-driven insights
 *
 * Advanced analytics for Polish HVAC business intelligence
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

interface AnalyticsQuery {
  metric: string;
  dimensions: string[];
  filters: AnalyticsFilter[];
  timeRange: TimeRange;
  aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min' | 'percentile';
  groupBy?: string[];
}

interface AnalyticsResult {
  metric: string;
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  breakdown: Record<string, number>;
  insights: string[];
  recommendations: string[];
}

interface PredictiveModel {
  modelType:
    | 'equipment_failure'
    | 'demand_forecast'
    | 'customer_churn'
    | 'energy_optimization';
  accuracy: number;
  lastTrained: Date;
  features: string[];
  predictions: Prediction[];
}

interface BusinessMetrics {
  revenue: RevenueMetrics;
  operations: OperationalMetrics;
  customer: CustomerMetrics;
  technician: TechnicianMetrics;
  equipment: EquipmentMetrics;
  market: MarketMetrics;
}

@Injectable()
export class HvacAnalyticsEngineService {
  private readonly logger = new Logger(HvacAnalyticsEngineService.name);
  private readonly models = new Map<string, PredictiveModel>();

  constructor(private readonly configService: ConfigService) {
    this.initializePredictiveModels();
  }

  /**
   * Real-time business metrics dashboard for Polish HVAC market
   */
  async getBusinessMetrics(): Promise<BusinessMetrics> {
    const [revenue, operations, customer, technician, equipment, market] =
      await Promise.all([
        this.calculateRevenueMetrics(),
        this.calculateOperationalMetrics(),
        this.calculateCustomerMetrics(),
        this.calculateTechnicianMetrics(),
        this.calculateEquipmentMetrics(),
        this.calculateMarketMetrics(),
      ]);

    return { revenue, operations, customer, technician, equipment, market };
  }

  /**
   * Advanced customer analytics with Polish market insights
   */
  async analyzeCustomerBehavior(): Promise<CustomerAnalytics> {
    const customerData = await this.getCustomerData();

    return {
      segmentation: await this.performCustomerSegmentation(customerData),
      lifetimeValue: await this.calculateCustomerLifetimeValue(customerData),
      churnPrediction: await this.predictCustomerChurn(customerData),
      seasonalPatterns: await this.analyzeSeasonalPatterns(customerData),
      servicePreferences: await this.analyzeServicePreferences(customerData),
      geographicDistribution:
        await this.analyzeGeographicDistribution(customerData),
      polishMarketInsights:
        await this.generatePolishMarketInsights(customerData),
    };
  }

  /**
   * Equipment performance analytics and predictive maintenance
   */
  async analyzeEquipmentPerformance(): Promise<EquipmentAnalytics> {
    const equipmentData = await this.getEquipmentData();

    return {
      healthScores: await this.calculateEquipmentHealthScores(equipmentData),
      failurePredictions: await this.predictEquipmentFailures(equipmentData),
      maintenanceOptimization:
        await this.optimizeMaintenanceSchedules(equipmentData),
      energyEfficiency: await this.analyzeEnergyEfficiency(equipmentData),
      complianceStatus: await this.checkComplianceStatus(equipmentData),
      replacementRecommendations:
        await this.generateReplacementRecommendations(equipmentData),
      costAnalysis: await this.analyzeMaintenanceCosts(equipmentData),
    };
  }

  /**
   * Technician performance and optimization analytics
   */
  async analyzeTechnicianPerformance(): Promise<TechnicianAnalytics> {
    const technicianData = await this.getTechnicianData();

    return {
      performanceScores: await this.calculatePerformanceScores(technicianData),
      skillAnalysis: await this.analyzeSkillDistribution(technicianData),
      routeOptimization: await this.analyzeRouteEfficiency(technicianData),
      customerSatisfaction:
        await this.analyzeCustomerSatisfactionByTechnician(technicianData),
      trainingNeeds: await this.identifyTrainingNeeds(technicianData),
      workloadBalance: await this.analyzeWorkloadDistribution(technicianData),
      certificationTracking: await this.trackCertifications(technicianData),
    };
  }

  /**
   * Market intelligence for Polish HVAC sector
   */
  async generateMarketIntelligence(): Promise<MarketIntelligence> {
    return {
      competitiveAnalysis: await this.analyzeCompetitiveLandscape(),
      marketTrends: await this.identifyMarketTrends(),
      regulatoryImpact: await this.analyzeRegulatoryImpact(),
      seasonalDemand: await this.forecastSeasonalDemand(),
      pricingOptimization: await this.optimizePricing(),
      expansionOpportunities: await this.identifyExpansionOpportunities(),
      technologyAdoption: await this.analyzeTechnologyAdoption(),
    };
  }

  /**
   * Predictive analytics for business planning
   */
  async generatePredictiveInsights(): Promise<PredictiveInsights> {
    const models = Array.from(this.models.values());

    return {
      demandForecast: await this.forecastDemand(),
      revenueProjection: await this.projectRevenue(),
      equipmentFailures: await this.predictFailures(),
      staffingNeeds: await this.forecastStaffingNeeds(),
      inventoryOptimization: await this.optimizeInventory(),
      customerChurn: await this.predictChurn(),
      marketOpportunities: await this.identifyOpportunities(),
      modelAccuracy: this.calculateModelAccuracy(models),
    };
  }

  /**
   * Custom analytics queries with natural language processing
   */
  async executeCustomQuery(query: string): Promise<AnalyticsResult> {
    // Parse natural language query into structured analytics query
    const structuredQuery = await this.parseNaturalLanguageQuery(query);

    // Execute the query
    const result = await this.executeAnalyticsQuery(structuredQuery);

    // Generate insights and recommendations
    const insights = await this.generateInsights(result, structuredQuery);
    const recommendations = await this.generateRecommendations(
      result,
      structuredQuery,
    );

    return {
      ...result,
      insights,
      recommendations,
    };
  }

  /**
   * Automated report generation
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async generateDailyReport(): Promise<void> {
    try {
      const report = await this.compileDailyAnalyticsReport();

      await this.distributeReport(report, 'daily');

      this.logger.log('Daily analytics report generated and distributed');
    } catch (error) {
      this.logger.error('Failed to generate daily analytics report', error);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async generateWeeklyReport(): Promise<void> {
    try {
      const report = await this.compileWeeklyAnalyticsReport();

      await this.distributeReport(report, 'weekly');

      this.logger.log('Weekly analytics report generated and distributed');
    } catch (error) {
      this.logger.error('Failed to generate weekly analytics report', error);
    }
  }

  /**
   * Real-time anomaly detection
   */
  async detectAnomalies(): Promise<Anomaly[]> {
    const metrics = await this.getCurrentMetrics();
    const anomalies: Anomaly[] = [];

    for (const metric of metrics) {
      const historicalData = await this.getHistoricalData(metric.name);
      const anomaly = await this.detectMetricAnomaly(metric, historicalData);

      if (anomaly) {
        anomalies.push(anomaly);
      }
    }

    // Alert on critical anomalies
    const criticalAnomalies = anomalies.filter(
      (a) => a.severity === 'critical',
    );

    if (criticalAnomalies.length > 0) {
      await this.alertOnCriticalAnomalies(criticalAnomalies);
    }

    return anomalies;
  }

  private async calculateRevenueMetrics(): Promise<RevenueMetrics> {
    const currentMonth = await this.getCurrentMonthRevenue();
    const previousMonth = await this.getPreviousMonthRevenue();
    const yearToDate = await this.getYearToDateRevenue();

    return {
      currentMonth,
      previousMonth,
      monthOverMonthGrowth:
        ((currentMonth - previousMonth) / previousMonth) * 100,
      yearToDate,
      averageTicketValue: await this.getAverageTicketValue(),
      revenueByService: await this.getRevenueByServiceType(),
      seasonalTrends: await this.getSeasonalRevenueTrends(),
      forecastNextMonth: await this.forecastNextMonthRevenue(),
    };
  }

  private async performCustomerSegmentation(
    customerData: any[],
  ): Promise<CustomerSegmentation> {
    // RFM Analysis (Recency, Frequency, Monetary)
    const rfmScores = customerData.map((customer) => ({
      customerId: customer.id,
      recency: this.calculateRecency(customer.lastServiceDate),
      frequency: this.calculateFrequency(customer.serviceHistory),
      monetary: this.calculateMonetaryValue(customer.totalSpent),
    }));

    // K-means clustering for segmentation
    const segments = await this.performKMeansClustering(rfmScores, 5);

    return {
      segments: segments.map((segment) => ({
        name: this.getSegmentName(segment),
        size: segment.customers.length,
        characteristics: this.getSegmentCharacteristics(segment),
        recommendations: this.getSegmentRecommendations(segment),
      })),
      totalCustomers: customerData.length,
      segmentationAccuracy: await this.calculateSegmentationAccuracy(segments),
    };
  }

  private async predictEquipmentFailures(
    equipmentData: any[],
  ): Promise<FailurePrediction[]> {
    const model = this.models.get('equipment_failure');

    if (!model) {
      throw new Error('Equipment failure prediction model not available');
    }

    const predictions: FailurePrediction[] = [];

    for (const equipment of equipmentData) {
      const features = this.extractEquipmentFeatures(equipment);
      const failureProbability = await this.predictWithModel(model, features);

      if (failureProbability > 0.7) {
        // High risk threshold
        predictions.push({
          equipmentId: equipment.id,
          failureProbability,
          predictedFailureDate: this.calculatePredictedFailureDate(
            equipment,
            failureProbability,
          ),
          recommendedActions: this.getRecommendedActions(
            equipment,
            failureProbability,
          ),
          estimatedCost: this.estimateMaintenanceCost(equipment),
        });
      }
    }

    return predictions.sort(
      (a, b) => b.failureProbability - a.failureProbability,
    );
  }

  private async initializePredictiveModels(): Promise<void> {
    // Initialize machine learning models for various predictions
    const modelConfigs = [
      {
        type: 'equipment_failure',
        features: [
          'age',
          'usage_hours',
          'maintenance_history',
          'error_frequency',
        ],
      },
      {
        type: 'demand_forecast',
        features: [
          'season',
          'weather',
          'historical_demand',
          'economic_indicators',
        ],
      },
      {
        type: 'customer_churn',
        features: [
          'service_frequency',
          'satisfaction_score',
          'payment_history',
          'complaints',
        ],
      },
      {
        type: 'energy_optimization',
        features: [
          'usage_patterns',
          'weather',
          'building_characteristics',
          'tariff_structure',
        ],
      },
    ];

    for (const config of modelConfigs) {
      const model = await this.loadOrTrainModel(config);

      this.models.set(config.type, model);
    }

    this.logger.log('Predictive models initialized successfully');
  }

  private getSegmentName(segment: any): string {
    // Business logic to name segments based on characteristics
    if (
      segment.avgRecency < 30 &&
      segment.avgFrequency > 4 &&
      segment.avgMonetary > 5000
    ) {
      return 'VIP Customers';
    } else if (segment.avgRecency < 60 && segment.avgFrequency > 2) {
      return 'Loyal Customers';
    } else if (segment.avgRecency > 180) {
      return 'At-Risk Customers';
    } else if (segment.avgMonetary < 1000) {
      return 'Budget Customers';
    } else {
      return 'Regular Customers';
    }
  }
}

// Supporting interfaces
interface CustomerAnalytics {
  segmentation: CustomerSegmentation;
  lifetimeValue: CustomerLifetimeValue;
  churnPrediction: ChurnPrediction;
  seasonalPatterns: SeasonalPattern[];
  servicePreferences: ServicePreference[];
  geographicDistribution: GeographicDistribution;
  polishMarketInsights: PolishMarketInsight[];
}

interface EquipmentAnalytics {
  healthScores: EquipmentHealthScore[];
  failurePredictions: FailurePrediction[];
  maintenanceOptimization: MaintenanceOptimization;
  energyEfficiency: EnergyEfficiencyAnalysis;
  complianceStatus: ComplianceStatus[];
  replacementRecommendations: ReplacementRecommendation[];
  costAnalysis: CostAnalysis;
}

interface TechnicianAnalytics {
  performanceScores: TechnicianPerformanceScore[];
  skillAnalysis: SkillAnalysis;
  routeOptimization: RouteOptimization;
  customerSatisfaction: CustomerSatisfactionAnalysis;
  trainingNeeds: TrainingNeed[];
  workloadBalance: WorkloadAnalysis;
  certificationTracking: CertificationTracking[];
}

interface RevenueMetrics {
  currentMonth: number;
  previousMonth: number;
  monthOverMonthGrowth: number;
  yearToDate: number;
  averageTicketValue: number;
  revenueByService: Record<string, number>;
  seasonalTrends: SeasonalTrend[];
  forecastNextMonth: number;
}
