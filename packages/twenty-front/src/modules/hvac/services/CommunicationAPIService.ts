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
  private readonly CRM_GRAPHQL_URL = process.env.NEXT_PUBLIC_SERVER_URL
    ? `${process.env.NEXT_PUBLIC_SERVER_URL}/graphql`
    : 'http://localhost:3001/graphql';

  private cache: Map<string, { data: unknown; timestamp: number }>;
  private readonly CACHE_TTL = 3 * 60 * 1000; // 3 minutes for real-time communication

  constructor() {
    this.cache = new Map();
    if (!process.env.NEXT_PUBLIC_SERVER_URL) {
      console.warn('NEXT_PUBLIC_SERVER_URL is not set for CommunicationAPIService. Defaulting to http://localhost:3001 for GraphQL.');
    }
  }

  private async fetchGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const startTime = Date.now();
    let operationName = 'UnknownGraphQLOperation';
    try {
        const match = query.match(/(query|mutation)\s+(\w+)/);
        if (match && match[2]) {
            operationName = match[2];
        }

        const response = await fetch(this.CRM_GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // TODO: Add Authorization header if required
            },
            body: JSON.stringify({ query, variables }),
        });

        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorBody = await response.text();
            trackHVACUserAction('communication_graphql_api_error', 'API_ERROR', { operationName, variables, duration, status: response.status, error: `GraphQL API call failed: ${response.status} ${response.statusText} - ${errorBody}` });
            throw new Error(`GraphQL API call failed: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const result = await response.json();
        if (result.errors) {
            trackHVACUserAction('communication_graphql_query_error', 'API_ERROR', { operationName, variables, duration, errors: result.errors });
            throw new Error(`GraphQL query failed: ${JSON.stringify(result.errors)}`);
        }

        trackHVACUserAction('communication_graphql_api_success', 'API_SUCCESS', { operationName, variables, duration, status: response.status });
        return result.data;

    } catch (error) {
        const duration = Date.now() - startTime;
        trackHVACUserAction('communication_graphql_fetch_exception', 'API_ERROR', { operationName, variables, duration, error: error instanceof Error ? error.message : 'Unknown fetch exception' });
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
    limit = 20,
  ): Promise<{ communications: Communication[]; total: number }> {
    const cacheKey = `communications_${JSON.stringify(filters)}_${page}_${limit}`;
    const cached = this.getCachedData<{ communications: Communication[]; total: number }>(cacheKey);
    if (cached) {
      trackHVACUserAction('communication_cache_hit', 'API_CACHE', { filters, page, limit });
      return cached;
    }

    const GET_HVAC_COMMUNICATIONS_QUERY = `
      query GetHvacCommunications($filters: HvacCommunicationFilterInput, $page: Int, $limit: Int) {
        hvacCommunications(filters: $filters, page: $page, limit: $limit) {
          communications {
            id customerId type direction subject content timestamp status priority
            # participants { id name email role } # Requires HvacParticipantType to be fully defined
            # attachments { id name type size url uploadedAt } # Requires HvacAttachmentType
            # metadata { source channel } # Requires HvacCommunicationMetadataType
            # aiInsights { sentiment summary } # Requires HvacAIInsightsType
            tags
          }
          total
        }
      }
    `;
    const response = await this.fetchGraphQL<{ hvacCommunications: { communications: Communication[]; total: number } }>(
      GET_HVAC_COMMUNICATIONS_QUERY, { filters, page, limit }
    );

    const responseData = response.hvacCommunications || { communications: [], total: 0 };
    this.setCachedData(cacheKey, responseData);
    return responseData;
  }

  async getCommunicationById(communicationId: string): Promise<Communication | null> {
    const cacheKey = `communication_${communicationId}`;
    const cached = this.getCachedData<Communication>(cacheKey);
    if (cached) return cached;

    const GET_HVAC_COMMUNICATION_BY_ID_QUERY = `
      query GetHvacCommunication($id: ID!) {
        hvacCommunication(id: $id) {
          id customerId type direction subject content timestamp status priority tags
          # Expand with participants, attachments, metadata, aiInsights as needed and defined in GQL type
        }
      }
    `;
    const response = await this.fetchGraphQL<{ hvacCommunication: Communication | null }>(
      GET_HVAC_COMMUNICATION_BY_ID_QUERY, { id: communicationId }
    );

    if (response.hvacCommunication) {
      this.setCachedData(cacheKey, response.hvacCommunication);
    }
    return response.hvacCommunication;
  }

  async createCommunication(communicationData: CreateCommunicationRequest): Promise<Communication> {
    const CREATE_HVAC_COMMUNICATION_MUTATION = `
      mutation CreateHvacCommunication($input: CreateHvacCommunicationInput!) {
        createHvacCommunication(input: $input) {
          id customerId type direction subject timestamp status priority
          # Expand as needed
        }
      }
    `;
    const response = await this.fetchGraphQL<{ createHvacCommunication: Communication }>(
      CREATE_HVAC_COMMUNICATION_MUTATION, { input: communicationData }
    );

    this.invalidateCache('communications_');
    if (communicationData.customerId) {
      this.invalidateCache(`customer_${communicationData.customerId}_communications`);
    }
    trackHVACUserAction('communication_created_graphql', 'COMMUNICATION', { communicationId: response.createHvacCommunication.id });
    return response.createHvacCommunication;
  }

  async getCommunicationStats(customerId: string): Promise<CommunicationStats | null> {
    const cacheKey = `communication_stats_${customerId}`;
    const cached = this.getCachedData<CommunicationStats>(cacheKey);
    if (cached) return cached;

    const GET_HVAC_COMMUNICATION_STATS_QUERY = `
      query GetHvacCommunicationStats($customerId: ID!) {
        hvacCommunicationStats(customerId: $customerId) {
          total
          # byType { type count } # Requires HvacCommunicationStatsByType to be defined
          # byDirection { direction count }
          # byStatus { status count }
          # sentimentDistribution { sentiment count }
          avgResponseTime
          # recentActivity { id subject timestamp }
        }
      }
    `;
    // Note: The HvacCommunicationStatsType in backend needs to be fully defined for this to work.
    // The query above is simplified.
    try {
        const response = await this.fetchGraphQL<{ hvacCommunicationStats: CommunicationStats | null }>(
        GET_HVAC_COMMUNICATION_STATS_QUERY, { customerId }
        );
        if (response.hvacCommunicationStats) {
        this.setCachedData(cacheKey, response.hvacCommunicationStats);
        }
        return response.hvacCommunicationStats;
    } catch (error) {
        trackHVACUserAction('get_comm_stats_graphql_error', 'API_ERROR', { customerId, error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
    }
  }

  async processEmailWithAI(emailContent: string, customerId: string): Promise<AIInsights | null> {
    const PROCESS_EMAIL_MUTATION = `
      mutation ProcessHvacEmailWithAI($emailContent: String!, $customerId: ID!) {
        processHvacEmailWithAI(emailContent: $emailContent, customerId: $customerId) {
          sentiment sentimentScore topics urgency actionItems summary language confidence
        }
      }
    `;
    try {
        const response = await this.fetchGraphQL<{ processHvacEmailWithAI: AIInsights | null }>(
        PROCESS_EMAIL_MUTATION, { emailContent, customerId }
        );
        trackHVACUserAction('email_ai_processed_graphql', 'AI_PROCESSING', { customerId, sentiment: response.processHvacEmailWithAI?.sentiment });
        return response.processHvacEmailWithAI;
    } catch (error) {
        trackHVACUserAction('process_email_ai_graphql_error', 'API_ERROR', { customerId, error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
    }
  }

  async getCommunicationTimeline(customerId: string, limit = 50): Promise<Communication[]> {
    const cacheKey = `communication_timeline_${customerId}_${limit}`;
    const cached = this.getCachedData<Communication[]>(cacheKey);
    if (cached) return cached;

    const GET_COMMUNICATION_TIMELINE_QUERY = `
      query GetHvacCommunicationTimeline($customerId: ID!, $limit: Int) {
        hvacCommunicationTimeline(customerId: $customerId, limit: $limit) {
          id type direction subject content timestamp status priority
        }
      }
    `;
    try {
        const response = await this.fetchGraphQL<{ hvacCommunicationTimeline: Communication[] }>(
        GET_COMMUNICATION_TIMELINE_QUERY, { customerId, limit }
        );
        const timeline = response.hvacCommunicationTimeline || [];
        this.setCachedData(cacheKey, timeline);
        return timeline;
    } catch (error) {
        trackHVACUserAction('get_comm_timeline_graphql_error', 'API_ERROR', { customerId, error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
    }
  }

  async searchCommunications(query: string, customerId?: string, limit = 20): Promise<Communication[]> {
    // This cache key might become very large if query is long. Consider hashing or truncating.
    const cacheKey = `communication_search_${query}_${customerId}_${limit}`;
    // Caching search results can be tricky due to variability; use with caution or short TTL.
    // const cached = this.getCachedData<Communication[]>(cacheKey);
    // if (cached) return cached;

    const SEARCH_COMMUNICATIONS_QUERY = `
      query SearchHvacCommunications($query: String!, $customerId: ID, $limit: Int) {
        searchHvacCommunications(query: $query, customerId: $customerId, limit: $limit) {
          id type direction subject content timestamp status priority
        }
      }
    `;
    try {
        const response = await this.fetchGraphQL<{ searchHvacCommunications: Communication[] }>(
        SEARCH_COMMUNICATIONS_QUERY, { query, customerId, limit }
        );
        const results = response.searchHvacCommunications || [];
        // this.setCachedData(cacheKey, results); // Use caching for search if appropriate
        trackHVACUserAction('communication_search_graphql', 'SEMANTIC_SEARCH', { queryLength: query.length, resultCount: results.length });
        return results;
    } catch (error) {
        trackHVACUserAction('search_comms_graphql_error', 'API_ERROR', { queryLength: query.length, error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
    }
  }

  async updateCommunicationStatus(communicationId: string, status: Communication['status']): Promise<Communication | null> {
    const UPDATE_COMM_STATUS_MUTATION = `
      mutation UpdateHvacCommunicationStatus($communicationId: ID!, $status: String!) { # Status should be HvacCommunicationStatusEnum ideally
        updateHvacCommunicationStatus(communicationId: $communicationId, status: $status) {
          id status timestamp
        }
      }
    `;
    try {
        const response = await this.fetchGraphQL<{ updateHvacCommunicationStatus: Communication | null }>(
        UPDATE_COMM_STATUS_MUTATION, { communicationId, status }
        );

        this.invalidateCache('communications_');
        this.invalidateCache(`communication_${communicationId}`);
        if (response.updateHvacCommunicationStatus?.customerId) {
            this.invalidateCache(`customer_${response.updateHvacCommunicationStatus.customerId}_communications`);
        }
        return response.updateHvacCommunicationStatus;
    } catch (error) {
        trackHVACUserAction('update_comm_status_graphql_error', 'API_ERROR', { communicationId, status, error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
    }
  }
}

// Export singleton instance
export const communicationAPIService = new CommunicationAPIService();
