/**
 * Customer Data Flow Service - Kompleksowy przepływ danych klientów HVAC
 * "Pasja rodzi profesjonalizm" - Profesjonalny system zarządzania przepływem danych
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript with no 'any' types
 * - Proper error handling
 * - Performance monitoring integration
 * - Dual data model: Supabase (structured) + Weaviate (semantic)
 */

import { trackHVACUserAction } from '../index';

// Customer Data Flow Types
export interface CustomerDataFlow {
  id: string;
  customerId: string;
  stage: CustomerStage;
  status: FlowStatus;
  priority: Priority;
  assignedTo?: string;
  estimatedValue: number;
  probability: number;
  nextAction: string;
  nextActionDate: Date;
  source: CustomerSource;
  tags: string[];
  metadata: CustomerFlowMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerFlowMetadata {
  leadScore: number;
  engagementLevel: 'low' | 'medium' | 'high' | 'very_high';
  communicationPreference: 'email' | 'phone' | 'sms' | 'whatsapp' | 'meeting';
  lastInteraction: Date;
  interactionCount: number;
  responseTime: number; // average response time in hours
  seasonality: string[]; // preferred seasons for HVAC work
  budgetRange: {
    min: number;
    max: number;
    currency: 'PLN';
  };
  decisionMakers: string[];
  competitors: string[];
  painPoints: string[];
  requirements: HVACRequirement[];
}

export interface HVACRequirement {
  type: 'installation' | 'maintenance' | 'repair' | 'consultation' | 'emergency';
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: number;
  timeline: string;
  technicalSpecs?: Record<string, unknown>;
}

export type CustomerStage = 
  | 'lead' 
  | 'qualified_lead' 
  | 'opportunity' 
  | 'proposal_sent' 
  | 'negotiation' 
  | 'won' 
  | 'lost' 
  | 'customer' 
  | 'inactive';

export type FlowStatus = 
  | 'new' 
  | 'contacted' 
  | 'qualified' 
  | 'proposal_prepared' 
  | 'proposal_sent' 
  | 'follow_up_needed' 
  | 'negotiating' 
  | 'closed_won' 
  | 'closed_lost' 
  | 'on_hold';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type CustomerSource = 
  | 'website' 
  | 'referral' 
  | 'social_media' 
  | 'advertising' 
  | 'cold_call' 
  | 'trade_show' 
  | 'partner' 
  | 'existing_customer';

// Data Sync Configuration
export interface DataSyncConfig {
  supabaseUrl: string;
  supabaseKey: string;
  weaviateUrl: string;
  weaviateKey: string;
  syncInterval: number; // in milliseconds
  batchSize: number;
  retryAttempts: number;
}

// Semantic Data Structure for Weaviate
export interface CustomerSemanticData {
  customerId: string;
  content: string;
  type: 'profile' | 'interaction' | 'requirement' | 'feedback' | 'note';
  sentiment: number; // -1 to 1
  topics: string[];
  entities: string[];
  language: 'pl' | 'en';
  confidence: number;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

/**
 * Customer Data Flow Service Class
 * Zarządza przepływem danych między Supabase (structured) a Weaviate (semantic)
 */
export class CustomerDataFlowService {
  private baseURL: string;
  private cache: Map<string, { data: unknown; timestamp: number }>;
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes for real-time data
  private syncQueue: CustomerDataFlow[] = [];
  private isProcessing = false;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_HVAC_API_URL || 'http://localhost:8000';
    this.cache = new Map();
  }

  /**
   * Make API call with error handling and performance tracking
   */
  private async makeAPICall<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; status: number }> {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_HVAC_API_KEY || ''}`,
          ...options.headers,
        },
        ...options,
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      trackHVACUserAction('customer_flow_api_success', 'API_SUCCESS', {
        endpoint,
        duration,
        status: response.status,
      });

      return { data, status: response.status };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      trackHVACUserAction('customer_flow_api_error', 'API_ERROR', {
        endpoint,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Get customer data flow by ID
   */
  async getCustomerFlow(customerId: string): Promise<CustomerDataFlow> {
    const cacheKey = `customer_flow_${customerId}`;
    const cached = this.getCachedData<CustomerDataFlow>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await this.makeAPICall<CustomerDataFlow>(
      `/api/v1/customer-flow/${customerId}`
    );

    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Update customer flow stage
   */
  async updateCustomerStage(
    customerId: string, 
    stage: CustomerStage, 
    metadata?: Partial<CustomerFlowMetadata>
  ): Promise<CustomerDataFlow> {
    const updateData = {
      stage,
      metadata,
      updatedAt: new Date(),
    };

    const response = await this.makeAPICall<CustomerDataFlow>(
      `/api/v1/customer-flow/${customerId}/stage`,
      {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      }
    );

    // Invalidate cache
    this.invalidateCache(`customer_flow_${customerId}`);

    // Sync to semantic database
    await this.syncToSemantic(response.data);

    trackHVACUserAction('customer_stage_updated', 'CUSTOMER_FLOW', {
      customerId,
      oldStage: stage,
      newStage: response.data.stage,
      estimatedValue: response.data.estimatedValue,
    });

    return response.data;
  }

  /**
   * Get customer flow pipeline
   */
  async getFlowPipeline(filters?: {
    stage?: CustomerStage;
    status?: FlowStatus;
    assignedTo?: string;
    priority?: Priority;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{ flows: CustomerDataFlow[]; total: number; analytics: FlowAnalytics }> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await this.makeAPICall<{
      flows: CustomerDataFlow[];
      total: number;
      analytics: FlowAnalytics;
    }>(`/api/v1/customer-flow/pipeline?${queryParams.toString()}`);

    return response.data;
  }

  /**
   * Create new customer flow
   */
  async createCustomerFlow(flowData: Omit<CustomerDataFlow, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerDataFlow> {
    const response = await this.makeAPICall<CustomerDataFlow>('/api/v1/customer-flow', {
      method: 'POST',
      body: JSON.stringify(flowData),
    });

    // Sync to semantic database
    await this.syncToSemantic(response.data);

    trackHVACUserAction('customer_flow_created', 'CUSTOMER_FLOW', {
      customerId: response.data.customerId,
      stage: response.data.stage,
      estimatedValue: response.data.estimatedValue,
      source: response.data.source,
    });

    return response.data;
  }

  /**
   * Sync customer data to semantic database (Weaviate)
   */
  private async syncToSemantic(flow: CustomerDataFlow): Promise<void> {
    try {
      const semanticData: CustomerSemanticData = {
        customerId: flow.customerId,
        content: this.generateSemanticContent(flow),
        type: 'profile',
        sentiment: this.calculateSentiment(flow),
        topics: this.extractTopics(flow),
        entities: this.extractEntities(flow),
        language: 'pl',
        confidence: 0.95,
        timestamp: new Date(),
        metadata: {
          stage: flow.stage,
          status: flow.status,
          priority: flow.priority,
          estimatedValue: flow.estimatedValue,
          probability: flow.probability,
        },
      };

      await this.makeAPICall('/api/v1/semantic/customer', {
        method: 'POST',
        body: JSON.stringify(semanticData),
      });

      trackHVACUserAction('customer_semantic_sync', 'DATA_SYNC', {
        customerId: flow.customerId,
        type: semanticData.type,
        confidence: semanticData.confidence,
      });

    } catch (error) {
      console.error('Failed to sync to semantic database:', error);
      // Don't throw - semantic sync is not critical for main flow
    }
  }

  /**
   * Generate semantic content for Weaviate
   */
  private generateSemanticContent(flow: CustomerDataFlow): string {
    const parts = [
      `Klient w etapie: ${flow.stage}`,
      `Status: ${flow.status}`,
      `Priorytet: ${flow.priority}`,
      `Szacowana wartość: ${flow.estimatedValue} PLN`,
      `Prawdopodobieństwo: ${flow.probability}%`,
      `Źródło: ${flow.source}`,
      `Następna akcja: ${flow.nextAction}`,
    ];

    if (flow.metadata.painPoints.length > 0) {
      parts.push(`Problemy klienta: ${flow.metadata.painPoints.join(', ')}`);
    }

    if (flow.metadata.requirements.length > 0) {
      const requirements = flow.metadata.requirements
        .map(req => `${req.type}: ${req.description}`)
        .join('; ');
      parts.push(`Wymagania: ${requirements}`);
    }

    return parts.join('. ');
  }

  /**
   * Calculate sentiment based on flow data
   */
  private calculateSentiment(flow: CustomerDataFlow): number {
    let sentiment = 0;

    // Positive indicators
    if (flow.stage === 'won' || flow.stage === 'customer') sentiment += 0.5;
    if (flow.status === 'closed_won') sentiment += 0.3;
    if (flow.probability > 70) sentiment += 0.2;
    if (flow.metadata.engagementLevel === 'high' || flow.metadata.engagementLevel === 'very_high') sentiment += 0.2;

    // Negative indicators
    if (flow.stage === 'lost') sentiment -= 0.5;
    if (flow.status === 'closed_lost') sentiment -= 0.3;
    if (flow.probability < 30) sentiment -= 0.2;
    if (flow.metadata.engagementLevel === 'low') sentiment -= 0.2;

    return Math.max(-1, Math.min(1, sentiment));
  }

  /**
   * Extract topics from flow data
   */
  private extractTopics(flow: CustomerDataFlow): string[] {
    const topics = [flow.stage, flow.status, flow.source];
    
    flow.metadata.requirements.forEach(req => {
      topics.push(req.type);
    });

    flow.tags.forEach(tag => {
      topics.push(tag);
    });

    return [...new Set(topics)];
  }

  /**
   * Extract entities from flow data
   */
  private extractEntities(flow: CustomerDataFlow): string[] {
    const entities = [];
    
    if (flow.assignedTo) entities.push(flow.assignedTo);
    
    flow.metadata.decisionMakers.forEach(dm => {
      entities.push(dm);
    });

    flow.metadata.competitors.forEach(comp => {
      entities.push(comp);
    });

    return entities;
  }

  /**
   * Cache management
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private invalidateCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// Flow Analytics Interface
export interface FlowAnalytics {
  totalFlows: number;
  stageDistribution: Record<CustomerStage, number>;
  statusDistribution: Record<FlowStatus, number>;
  averageTimeInStage: Record<CustomerStage, number>; // in days
  conversionRates: Record<string, number>; // stage transitions
  totalValue: number;
  averageValue: number;
  winRate: number;
  topSources: Array<{ source: CustomerSource; count: number; value: number }>;
  monthlyTrends: Array<{ month: string; flows: number; value: number }>;
}

// Export singleton instance
export const customerDataFlowService = new CustomerDataFlowService();
