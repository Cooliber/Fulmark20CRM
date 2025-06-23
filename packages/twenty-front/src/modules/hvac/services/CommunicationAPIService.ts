/**
 * Communication API Service - HVAC Communication Management
 * "Pasja rodzi profesjonalizm" - Professional communication tracking service
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript with no 'any' types
 * - Proper error handling
 * - Performance monitoring integration
 */

import { trackHVACUserAction } from '../index';

// Communication types and interfaces
export interface Communication {
  id: string;
  customerId: string;
  type: 'email' | 'phone' | 'sms' | 'meeting' | 'note' | 'document';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  participants: Participant[];
  attachments: Attachment[];
  metadata: CommunicationMetadata;
  aiInsights?: AIInsights;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'customer' | 'technician' | 'manager' | 'support';
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface CommunicationMetadata {
  source: string;
  channel: string;
  deviceInfo?: string;
  location?: string;
  referenceId?: string;
  threadId?: string;
}

export interface AIInsights {
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  topics: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  actionItems: string[];
  summary: string;
  language: string;
  confidence: number;
}

export interface CommunicationFilter {
  customerId?: string;
  type?: Communication['type'];
  direction?: Communication['direction'];
  status?: Communication['status'];
  priority?: Communication['priority'];
  dateFrom?: Date;
  dateTo?: Date;
  hasAIInsights?: boolean;
  sentiment?: AIInsights['sentiment'];
  tags?: string[];
}

export interface CreateCommunicationRequest {
  customerId: string;
  type: Communication['type'];
  direction: Communication['direction'];
  subject?: string;
  content: string;
  participants: Omit<Participant, 'id'>[];
  attachments?: Omit<Attachment, 'id' | 'uploadedAt'>[];
  metadata: CommunicationMetadata;
  tags?: string[];
  priority?: Communication['priority'];
}

export interface CommunicationStats {
  total: number;
  byType: Record<Communication['type'], number>;
  byDirection: Record<Communication['direction'], number>;
  byStatus: Record<Communication['status'], number>;
  avgResponseTime: number;
  sentimentDistribution: Record<AIInsights['sentiment'], number>;
  recentActivity: Communication[];
}

/**
 * Communication API Service Class
 * Handles all communication-related API operations with AI insights
 */
export class CommunicationAPIService {
  private baseURL: string;
  private cache: Map<string, { data: unknown; timestamp: number }>;
  private readonly CACHE_TTL = 3 * 60 * 1000; // 3 minutes for real-time communication

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

      trackHVACUserAction('communication_api_success', 'API_SUCCESS', {
        endpoint,
        duration,
        status: response.status,
      });

      return { data, status: response.status };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      trackHVACUserAction('communication_api_error', 'API_ERROR', {
        endpoint,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
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

  /**
   * Get communications with filtering and pagination
   */
  async getCommunications(
    filters: CommunicationFilter = {},
    page = 1,
    limit = 20
  ): Promise<{ communications: Communication[]; total: number }> {
    const cacheKey = `communications_${JSON.stringify(filters)}_${page}_${limit}`;
    const cached = this.getCachedData<{ communications: Communication[]; total: number }>(cacheKey);
    
    if (cached) {
      trackHVACUserAction('communication_cache_hit', 'API_CACHE', { filters, page, limit });
      return cached;
    }

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      ),
    });

    const response = await this.makeAPICall<{ communications: Communication[]; total: number }>(
      `/api/v1/communications?${queryParams.toString()}`
    );

    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Get communication by ID
   */
  async getCommunicationById(communicationId: string): Promise<Communication> {
    const cacheKey = `communication_${communicationId}`;
    const cached = this.getCachedData<Communication>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await this.makeAPICall<Communication>(`/api/v1/communications/${communicationId}`);
    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Create new communication
   */
  async createCommunication(communicationData: CreateCommunicationRequest): Promise<Communication> {
    const response = await this.makeAPICall<Communication>('/api/v1/communications', {
      method: 'POST',
      body: JSON.stringify(communicationData),
    });

    // Invalidate relevant caches
    this.invalidateCache('communications_');
    this.invalidateCache(`customer_${communicationData.customerId}`);

    trackHVACUserAction('communication_created', 'COMMUNICATION', {
      communicationId: response.data.id,
      customerId: communicationData.customerId,
      type: communicationData.type,
      direction: communicationData.direction,
    });

    return response.data;
  }

  /**
   * Get communication statistics for customer
   */
  async getCommunicationStats(customerId: string): Promise<CommunicationStats> {
    const cacheKey = `communication_stats_${customerId}`;
    const cached = this.getCachedData<CommunicationStats>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await this.makeAPICall<CommunicationStats>(
      `/api/v1/communications/stats/${customerId}`
    );

    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Process email with AI insights
   */
  async processEmailWithAI(emailContent: string, customerId: string): Promise<AIInsights> {
    const response = await this.makeAPICall<AIInsights>('/api/v1/communications/ai-process', {
      method: 'POST',
      body: JSON.stringify({
        content: emailContent,
        customerId,
        language: 'pl', // Polish language processing
      }),
    });

    trackHVACUserAction('email_ai_processed', 'AI_PROCESSING', {
      customerId,
      contentLength: emailContent.length,
      sentiment: response.data.sentiment,
      urgency: response.data.urgency,
    });

    return response.data;
  }

  /**
   * Get communication timeline for customer
   */
  async getCommunicationTimeline(
    customerId: string,
    limit = 50
  ): Promise<Communication[]> {
    const cacheKey = `communication_timeline_${customerId}_${limit}`;
    const cached = this.getCachedData<Communication[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await this.makeAPICall<Communication[]>(
      `/api/v1/communications/timeline/${customerId}?limit=${limit}`
    );

    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Search communications with semantic search
   */
  async searchCommunications(
    query: string,
    customerId?: string,
    limit = 20
  ): Promise<Communication[]> {
    const queryParams = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      ...(customerId && { customerId }),
    });

    const response = await this.makeAPICall<Communication[]>(
      `/api/v1/communications/search?${queryParams.toString()}`
    );

    trackHVACUserAction('communication_search', 'SEMANTIC_SEARCH', {
      query: query.substring(0, 20), // First 20 chars for privacy
      customerId,
      resultCount: response.data.length,
    });

    return response.data;
  }

  /**
   * Update communication status
   */
  async updateCommunicationStatus(
    communicationId: string,
    status: Communication['status']
  ): Promise<Communication> {
    const response = await this.makeAPICall<Communication>(
      `/api/v1/communications/${communicationId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );

    // Invalidate relevant caches
    this.invalidateCache('communications_');
    this.invalidateCache(`communication_${communicationId}`);

    return response.data;
  }
}

// Export singleton instance
export const communicationAPIService = new CommunicationAPIService();
