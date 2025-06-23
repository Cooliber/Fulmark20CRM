/**
 * Quote Management Service - System zarządzania ofertami HVAC
 * "Pasja rodzi profesjonalizm" - Profesjonalny system tworzenia i zarządzania ofert
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript with no 'any' types
 * - Proper error handling
 * - Performance monitoring integration
 * - Polish business compliance (VAT, NIP, REGON)
 */

import { trackHVACUserAction } from '../index';

// Quote Management Types
export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  customerNIP?: string;
  customerREGON?: string;
  title: string;
  description: string;
  status: QuoteStatus;
  priority: Priority;
  validUntil: Date;
  totalAmount: number;
  totalAmountNet: number;
  totalVAT: number;
  vatRate: number;
  currency: 'PLN';
  items: QuoteItem[];
  terms: QuoteTerms;
  metadata: QuoteMetadata;
  templateId?: string;
  assignedTo: string;
  approvedBy?: string;
  approvedAt?: Date;
  sentAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteItem {
  id: string;
  type: 'service' | 'product' | 'labor' | 'material';
  name: string;
  description: string;
  category: HVACCategory;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  vatRate: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  specifications?: Record<string, unknown>;
  warranty?: WarrantyInfo;
  deliveryTime?: string;
  notes?: string;
}

export interface QuoteTerms {
  paymentTerms: string;
  paymentMethod: PaymentMethod[];
  deliveryTerms: string;
  warrantyTerms: string;
  validityPeriod: number; // days
  advancePayment?: number; // percentage
  retentionPeriod?: number; // days
  penaltyClause?: string;
  additionalTerms?: string[];
}

export interface QuoteMetadata {
  source: 'manual' | 'template' | 'ai_generated' | 'imported';
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  estimatedDuration: number; // hours
  riskLevel: 'low' | 'medium' | 'high';
  competitorAnalysis?: CompetitorInfo[];
  profitMargin: number; // percentage
  costBreakdown: CostBreakdown;
  technicalRequirements: string[];
  specialRequirements: string[];
  seasonalFactors: string[];
}

export interface WarrantyInfo {
  period: number; // months
  type: 'manufacturer' | 'service' | 'extended';
  coverage: string[];
  conditions: string[];
}

export interface CompetitorInfo {
  name: string;
  estimatedPrice: number;
  strengths: string[];
  weaknesses: string[];
}

export interface CostBreakdown {
  materials: number;
  labor: number;
  equipment: number;
  overhead: number;
  profit: number;
  contingency: number;
}

export type QuoteStatus = 
  | 'draft' 
  | 'pending_review' 
  | 'approved' 
  | 'sent' 
  | 'viewed' 
  | 'accepted' 
  | 'rejected' 
  | 'expired' 
  | 'cancelled';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type HVACCategory = 
  | 'klimatyzacja' 
  | 'wentylacja' 
  | 'ogrzewanie' 
  | 'chłodzenie' 
  | 'automatyka' 
  | 'serwis' 
  | 'konserwacja' 
  | 'projektowanie' 
  | 'montaż' 
  | 'inne';

export type PaymentMethod = 
  | 'transfer' 
  | 'cash' 
  | 'card' 
  | 'leasing' 
  | 'installments' 
  | 'barter';

// Quote Template
export interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  category: HVACCategory;
  isActive: boolean;
  defaultItems: Omit<QuoteItem, 'id' | 'totalPrice'>[];
  defaultTerms: QuoteTerms;
  defaultMetadata: Partial<QuoteMetadata>;
  variables: TemplateVariable[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date';
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: unknown;
  options?: string[]; // for select type
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'required';
  value: unknown;
  message: string;
}

// Quote Analytics
export interface QuoteAnalytics {
  totalQuotes: number;
  statusDistribution: Record<QuoteStatus, number>;
  categoryDistribution: Record<HVACCategory, number>;
  averageValue: number;
  totalValue: number;
  winRate: number;
  averageResponseTime: number; // hours
  conversionFunnel: ConversionFunnel;
  monthlyTrends: MonthlyTrend[];
  topPerformers: TopPerformer[];
}

export interface ConversionFunnel {
  draft: number;
  sent: number;
  viewed: number;
  accepted: number;
  rejected: number;
}

export interface MonthlyTrend {
  month: string;
  quotes: number;
  value: number;
  winRate: number;
}

export interface TopPerformer {
  assignedTo: string;
  quotesCount: number;
  totalValue: number;
  winRate: number;
}

/**
 * Quote Management Service Class
 * Zarządza tworzeniem, edycją i śledzeniem ofert HVAC
 */
export class QuoteManagementService {
  private baseURL: string;
  private cache: Map<string, { data: unknown; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

      trackHVACUserAction('quote_api_success', 'API_SUCCESS', {
        endpoint,
        duration,
        status: response.status,
      });

      return { data, status: response.status };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      trackHVACUserAction('quote_api_error', 'API_ERROR', {
        endpoint,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Get quotes with filtering and pagination
   */
  async getQuotes(filters?: {
    status?: QuoteStatus;
    customerId?: string;
    assignedTo?: string;
    category?: HVACCategory;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  }, page = 1, limit = 20): Promise<{ quotes: Quote[]; total: number }> {
    const cacheKey = `quotes_${JSON.stringify(filters)}_${page}_${limit}`;
    const cached = this.getCachedData<{ quotes: Quote[]; total: number }>(cacheKey);
    
    if (cached) {
      trackHVACUserAction('quote_cache_hit', 'API_CACHE', { filters, page, limit });
      return cached;
    }

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters || {}).filter(([_, value]) => value !== undefined)
      ),
    });

    const response = await this.makeAPICall<{ quotes: Quote[]; total: number }>(
      `/api/v1/quotes?${queryParams.toString()}`
    );

    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Get quote by ID
   */
  async getQuoteById(quoteId: string): Promise<Quote> {
    const cacheKey = `quote_${quoteId}`;
    const cached = this.getCachedData<Quote>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await this.makeAPICall<Quote>(`/api/v1/quotes/${quoteId}`);
    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Create new quote
   */
  async createQuote(quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>): Promise<Quote> {
    // Calculate totals
    const calculatedData = this.calculateQuoteTotals(quoteData);

    const response = await this.makeAPICall<Quote>('/api/v1/quotes', {
      method: 'POST',
      body: JSON.stringify(calculatedData),
    });

    // Invalidate relevant caches
    this.invalidateCache('quotes_');

    trackHVACUserAction('quote_created', 'QUOTE_MANAGEMENT', {
      quoteId: response.data.id,
      customerId: response.data.customerId,
      totalAmount: response.data.totalAmount,
      category: response.data.items[0]?.category,
    });

    return response.data;
  }

  /**
   * Update quote
   */
  async updateQuote(quoteId: string, updates: Partial<Quote>): Promise<Quote> {
    // Recalculate totals if items changed
    const calculatedUpdates = updates.items 
      ? this.calculateQuoteTotals(updates as Quote)
      : updates;

    const response = await this.makeAPICall<Quote>(`/api/v1/quotes/${quoteId}`, {
      method: 'PUT',
      body: JSON.stringify(calculatedUpdates),
    });

    // Invalidate relevant caches
    this.invalidateCache('quotes_');
    this.invalidateCache(`quote_${quoteId}`);

    trackHVACUserAction('quote_updated', 'QUOTE_MANAGEMENT', {
      quoteId,
      changes: Object.keys(updates),
    });

    return response.data;
  }

  /**
   * Update quote status
   */
  async updateQuoteStatus(quoteId: string, status: QuoteStatus, reason?: string): Promise<Quote> {
    const updateData: Record<string, unknown> = { status };
    
    if (status === 'sent') {
      updateData.sentAt = new Date();
    } else if (status === 'accepted') {
      updateData.acceptedAt = new Date();
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = reason;
    }

    const response = await this.makeAPICall<Quote>(`/api/v1/quotes/${quoteId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });

    // Invalidate relevant caches
    this.invalidateCache('quotes_');
    this.invalidateCache(`quote_${quoteId}`);

    trackHVACUserAction('quote_status_updated', 'QUOTE_MANAGEMENT', {
      quoteId,
      oldStatus: status,
      newStatus: response.data.status,
      reason,
    });

    return response.data;
  }

  /**
   * Generate quote from template
   */
  async generateFromTemplate(
    templateId: string, 
    customerId: string, 
    variables: Record<string, unknown>
  ): Promise<Quote> {
    const response = await this.makeAPICall<Quote>('/api/v1/quotes/from-template', {
      method: 'POST',
      body: JSON.stringify({
        templateId,
        customerId,
        variables,
      }),
    });

    trackHVACUserAction('quote_generated_from_template', 'QUOTE_MANAGEMENT', {
      templateId,
      customerId,
      quoteId: response.data.id,
    });

    return response.data;
  }

  /**
   * Get quote templates
   */
  async getTemplates(category?: HVACCategory): Promise<QuoteTemplate[]> {
    const cacheKey = `templates_${category || 'all'}`;
    const cached = this.getCachedData<QuoteTemplate[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const queryParams = category ? `?category=${category}` : '';
    const response = await this.makeAPICall<QuoteTemplate[]>(
      `/api/v1/quote-templates${queryParams}`
    );

    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Get quote analytics
   */
  async getAnalytics(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    assignedTo?: string;
    category?: HVACCategory;
  }): Promise<QuoteAnalytics> {
    const cacheKey = `quote_analytics_${JSON.stringify(filters)}`;
    const cached = this.getCachedData<QuoteAnalytics>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await this.makeAPICall<QuoteAnalytics>(
      `/api/v1/quotes/analytics?${queryParams.toString()}`
    );

    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Calculate quote totals
   */
  private calculateQuoteTotals(quote: Partial<Quote>): Partial<Quote> {
    if (!quote.items) return quote;

    let totalAmountNet = 0;
    let totalVAT = 0;

    quote.items.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice;
      const discount = item.discount || 0;
      const discountAmount = item.discountType === 'percentage' 
        ? itemTotal * (discount / 100)
        : discount;
      
      const netAmount = itemTotal - discountAmount;
      const vatAmount = netAmount * (item.vatRate / 100);

      item.totalPrice = netAmount + vatAmount;
      totalAmountNet += netAmount;
      totalVAT += vatAmount;
    });

    return {
      ...quote,
      totalAmountNet,
      totalVAT,
      totalAmount: totalAmountNet + totalVAT,
    };
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

// Export singleton instance
export const quoteManagementService = new QuoteManagementService();
