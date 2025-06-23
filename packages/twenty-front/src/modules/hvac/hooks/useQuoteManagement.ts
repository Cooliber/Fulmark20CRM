/**
 * useQuoteManagement Hook - Zarządzanie ofertami HVAC
 * "Pasja rodzi profesjonalizm" - Profesjonalny hook do quote management
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Event handlers over useEffect
 * - Proper TypeScript typing
 * - Performance optimization
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  quoteManagementService,
  Quote,
  QuoteStatus,
  QuoteTemplate,
  QuoteAnalytics,
  HVACCategory,
  Priority,
} from '../services/QuoteManagementService';
import { trackHVACUserAction } from '../index';

// Hook state interface
interface UseQuoteManagementState {
  quotes: Quote[];
  selectedQuote: Quote | null;
  templates: QuoteTemplate[];
  analytics: QuoteAnalytics | null;
  loading: boolean;
  error: string | null;
  total: number;
  filters: QuoteFilters;
}

// Filter interface
interface QuoteFilters {
  status?: QuoteStatus;
  customerId?: string;
  assignedTo?: string;
  category?: HVACCategory;
  priority?: Priority;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Hook options
interface UseQuoteManagementOptions {
  autoLoad?: boolean;
  enableRealTimeUpdates?: boolean;
  refreshInterval?: number; // in milliseconds
  onQuoteCreated?: (quote: Quote) => void;
  onQuoteUpdated?: (quote: Quote) => void;
  onStatusChanged?: (quoteId: string, oldStatus: QuoteStatus, newStatus: QuoteStatus) => void;
  onError?: (error: Error) => void;
}

// Hook return type
interface UseQuoteManagementReturn {
  // State
  quotes: Quote[];
  selectedQuote: Quote | null;
  templates: QuoteTemplate[];
  analytics: QuoteAnalytics | null;
  loading: boolean;
  error: string | null;
  total: number;
  filters: QuoteFilters;

  // Quote operations
  loadQuotes: (filters?: QuoteFilters, page?: number, limit?: number) => Promise<void>;
  createQuote: (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>) => Promise<Quote>;
  updateQuote: (quoteId: string, updates: Partial<Quote>) => Promise<Quote>;
  updateStatus: (quoteId: string, status: QuoteStatus, reason?: string) => Promise<Quote>;
  selectQuote: (quote: Quote | null) => void;
  duplicateQuote: (quoteId: string) => Promise<Quote>;

  // Template operations
  loadTemplates: (category?: HVACCategory) => Promise<void>;
  generateFromTemplate: (templateId: string, customerId: string, variables: Record<string, unknown>) => Promise<Quote>;

  // Filter operations
  setFilters: (filters: Partial<QuoteFilters>) => void;
  clearFilters: () => void;
  applyQuickFilter: (type: 'pending' | 'sent' | 'accepted' | 'expired' | 'high_value') => void;

  // Analytics operations
  loadAnalytics: (filters?: Partial<QuoteFilters>) => Promise<void>;
  getStatusMetrics: (status: QuoteStatus) => StatusMetrics;
  getCategoryMetrics: (category: HVACCategory) => CategoryMetrics;

  // Utility functions
  calculateQuoteValue: (quote: Quote) => QuoteValueCalculation;
  getQuoteAge: (quote: Quote) => number; // days
  isQuoteExpired: (quote: Quote) => boolean;
  refreshQuotes: () => Promise<void>;
  clearError: () => void;
}

// Metrics interfaces
interface StatusMetrics {
  count: number;
  totalValue: number;
  averageValue: number;
  percentage: number;
}

interface CategoryMetrics {
  count: number;
  totalValue: number;
  averageValue: number;
  winRate: number;
}

interface QuoteValueCalculation {
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  profitMargin: number;
  profitAmount: number;
}

/**
 * Quote management hook with comprehensive quote operations
 * Implements HVAC CRM quote lifecycle management
 */
export const useQuoteManagement = (
  options: UseQuoteManagementOptions = {}
): UseQuoteManagementReturn => {
  const {
    autoLoad = true,
    enableRealTimeUpdates = false,
    refreshInterval = 60000, // 1 minute
    onQuoteCreated,
    onQuoteUpdated,
    onStatusChanged,
    onError,
  } = options;

  // State management
  const [state, setState] = useState<UseQuoteManagementState>({
    quotes: [],
    selectedQuote: null,
    templates: [],
    analytics: null,
    loading: false,
    error: null,
    total: 0,
    filters: {},
  });

  const abortControllerRef = useRef<AbortController>();
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  // Load quotes with filters and pagination
  const loadQuotes = useCallback(async (
    filters: QuoteFilters = {},
    page = 1,
    limit = 20
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null, filters }));

    try {
      trackHVACUserAction('quote_load_started', 'QUOTE_MANAGEMENT', {
        filters,
        page,
        limit,
      });

      const result = await quoteManagementService.getQuotes(filters, page, limit);

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setState(prev => ({
        ...prev,
        quotes: result.quotes,
        total: result.total,
        loading: false,
      }));

      trackHVACUserAction('quote_load_success', 'QUOTE_MANAGEMENT', {
        count: result.quotes.length,
        total: result.total,
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));

      trackHVACUserAction('quote_load_error', 'QUOTE_MANAGEMENT', {
        error: errorMessage,
      });
    }
  }, [onError]);

  // Create new quote
  const createQuote = useCallback(async (
    quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<Quote> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const newQuote = await quoteManagementService.createQuote(quoteData);

      // Refresh quotes
      await loadQuotes(state.filters);

      onQuoteCreated?.(newQuote);

      return newQuote;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [loadQuotes, state.filters, onQuoteCreated, onError]);

  // Update quote
  const updateQuote = useCallback(async (
    quoteId: string,
    updates: Partial<Quote>
  ): Promise<Quote> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const updatedQuote = await quoteManagementService.updateQuote(quoteId, updates);

      // Update quote in state
      setState(prev => ({
        ...prev,
        quotes: prev.quotes.map(quote => 
          quote.id === quoteId ? updatedQuote : quote
        ),
        selectedQuote: prev.selectedQuote?.id === quoteId 
          ? updatedQuote 
          : prev.selectedQuote,
        loading: false,
      }));

      onQuoteUpdated?.(updatedQuote);

      return updatedQuote;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [onQuoteUpdated, onError]);

  // Update quote status
  const updateStatus = useCallback(async (
    quoteId: string,
    status: QuoteStatus,
    reason?: string
  ): Promise<Quote> => {
    const oldQuote = state.quotes.find(q => q.id === quoteId);
    const oldStatus = oldQuote?.status;

    try {
      const updatedQuote = await quoteManagementService.updateQuoteStatus(quoteId, status, reason);

      // Update quote in state
      setState(prev => ({
        ...prev,
        quotes: prev.quotes.map(quote => 
          quote.id === quoteId ? updatedQuote : quote
        ),
        selectedQuote: prev.selectedQuote?.id === quoteId 
          ? updatedQuote 
          : prev.selectedQuote,
      }));

      if (oldStatus && oldStatus !== status) {
        onStatusChanged?.(quoteId, oldStatus, status);
      }

      return updatedQuote;

    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to update quote status'));
      throw error;
    }
  }, [state.quotes, onStatusChanged, onError]);

  // Select quote
  const selectQuote = useCallback((quote: Quote | null) => {
    setState(prev => ({ ...prev, selectedQuote: quote }));
    
    if (quote) {
      trackHVACUserAction('quote_selected', 'QUOTE_MANAGEMENT', {
        quoteId: quote.id,
        status: quote.status,
        totalAmount: quote.totalAmount,
      });
    }
  }, []);

  // Duplicate quote
  const duplicateQuote = useCallback(async (quoteId: string): Promise<Quote> => {
    const originalQuote = state.quotes.find(q => q.id === quoteId);
    if (!originalQuote) {
      throw new Error('Quote not found');
    }

    const duplicateData = {
      ...originalQuote,
      title: `${originalQuote.title} (Kopia)`,
      status: 'draft' as QuoteStatus,
      sentAt: undefined,
      acceptedAt: undefined,
      rejectedAt: undefined,
      rejectionReason: undefined,
    };

    // Remove fields that shouldn't be duplicated
    delete (duplicateData as any).id;
    delete (duplicateData as any).quoteNumber;
    delete (duplicateData as any).createdAt;
    delete (duplicateData as any).updatedAt;

    return createQuote(duplicateData);
  }, [state.quotes, createQuote]);

  // Load templates
  const loadTemplates = useCallback(async (category?: HVACCategory) => {
    try {
      const templates = await quoteManagementService.getTemplates(category);
      setState(prev => ({ ...prev, templates }));
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to load templates'));
    }
  }, [onError]);

  // Generate from template
  const generateFromTemplate = useCallback(async (
    templateId: string,
    customerId: string,
    variables: Record<string, unknown>
  ): Promise<Quote> => {
    try {
      const newQuote = await quoteManagementService.generateFromTemplate(
        templateId,
        customerId,
        variables
      );

      // Refresh quotes
      await loadQuotes(state.filters);

      onQuoteCreated?.(newQuote);

      return newQuote;

    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to generate quote from template'));
      throw error;
    }
  }, [loadQuotes, state.filters, onQuoteCreated, onError]);

  // Set filters
  const setFilters = useCallback((newFilters: Partial<QuoteFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters };
    loadQuotes(updatedFilters);
  }, [state.filters, loadQuotes]);

  // Clear filters
  const clearFilters = useCallback(() => {
    loadQuotes({});
  }, [loadQuotes]);

  // Apply quick filters
  const applyQuickFilter = useCallback((type: 'pending' | 'sent' | 'accepted' | 'expired' | 'high_value') => {
    const now = new Date();

    switch (type) {
      case 'pending':
        setFilters({ status: 'pending_review' });
        break;
      
      case 'sent':
        setFilters({ status: 'sent' });
        break;
      
      case 'accepted':
        setFilters({ status: 'accepted' });
        break;
      
      case 'expired':
        setFilters({ status: 'expired' });
        break;
      
      case 'high_value':
        // This would need to be implemented on the backend
        // For now, we'll just track the action
        trackHVACUserAction('high_value_filter_applied', 'QUOTE_MANAGEMENT', {});
        break;
    }

    trackHVACUserAction('quick_filter_applied', 'QUOTE_MANAGEMENT', { type });
  }, [setFilters]);

  // Load analytics
  const loadAnalytics = useCallback(async (filters?: Partial<QuoteFilters>) => {
    try {
      const analytics = await quoteManagementService.getAnalytics(filters);
      setState(prev => ({ ...prev, analytics }));
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to load analytics'));
    }
  }, [onError]);

  // Get status metrics
  const getStatusMetrics = useCallback((status: QuoteStatus): StatusMetrics => {
    if (!state.analytics) {
      return { count: 0, totalValue: 0, averageValue: 0, percentage: 0 };
    }

    const count = state.analytics.statusDistribution[status] || 0;
    const totalValue = state.quotes
      .filter(q => q.status === status)
      .reduce((sum, q) => sum + q.totalAmount, 0);

    return {
      count,
      totalValue,
      averageValue: count > 0 ? totalValue / count : 0,
      percentage: state.analytics.totalQuotes > 0 ? (count / state.analytics.totalQuotes) * 100 : 0,
    };
  }, [state.analytics, state.quotes]);

  // Get category metrics
  const getCategoryMetrics = useCallback((category: HVACCategory): CategoryMetrics => {
    if (!state.analytics) {
      return { count: 0, totalValue: 0, averageValue: 0, winRate: 0 };
    }

    const count = state.analytics.categoryDistribution[category] || 0;
    const categoryQuotes = state.quotes.filter(q => 
      q.items.some(item => item.category === category)
    );
    
    const totalValue = categoryQuotes.reduce((sum, q) => sum + q.totalAmount, 0);
    const wonQuotes = categoryQuotes.filter(q => q.status === 'accepted').length;

    return {
      count,
      totalValue,
      averageValue: count > 0 ? totalValue / count : 0,
      winRate: count > 0 ? (wonQuotes / count) * 100 : 0,
    };
  }, [state.analytics, state.quotes]);

  // Calculate quote value
  const calculateQuoteValue = useCallback((quote: Quote): QuoteValueCalculation => {
    const netAmount = quote.totalAmountNet;
    const vatAmount = quote.totalVAT;
    const totalAmount = quote.totalAmount;
    const profitMargin = quote.metadata.profitMargin;
    const profitAmount = netAmount * (profitMargin / 100);

    return {
      netAmount,
      vatAmount,
      totalAmount,
      profitMargin,
      profitAmount,
    };
  }, []);

  // Get quote age in days
  const getQuoteAge = useCallback((quote: Quote): number => {
    const now = new Date();
    const created = new Date(quote.createdAt);
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  // Check if quote is expired
  const isQuoteExpired = useCallback((quote: Quote): boolean => {
    const now = new Date();
    const validUntil = new Date(quote.validUntil);
    return now > validUntil;
  }, []);

  // Refresh quotes
  const refreshQuotes = useCallback(async () => {
    await loadQuotes(state.filters);
  }, [loadQuotes, state.filters]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-load quotes on mount
  useEffect(() => {
    if (autoLoad) {
      loadQuotes();
      loadTemplates();
    }
  }, [autoLoad, loadQuotes, loadTemplates]);

  // Real-time updates
  useEffect(() => {
    if (enableRealTimeUpdates) {
      refreshIntervalRef.current = setInterval(() => {
        refreshQuotes();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [enableRealTimeUpdates, refreshInterval, refreshQuotes]);

  return {
    // State
    quotes: state.quotes,
    selectedQuote: state.selectedQuote,
    templates: state.templates,
    analytics: state.analytics,
    loading: state.loading,
    error: state.error,
    total: state.total,
    filters: state.filters,

    // Quote operations
    loadQuotes,
    createQuote,
    updateQuote,
    updateStatus,
    selectQuote,
    duplicateQuote,

    // Template operations
    loadTemplates,
    generateFromTemplate,

    // Filter operations
    setFilters,
    clearFilters,
    applyQuickFilter,

    // Analytics operations
    loadAnalytics,
    getStatusMetrics,
    getCategoryMetrics,

    // Utility functions
    calculateQuoteValue,
    getQuoteAge,
    isQuoteExpired,
    refreshQuotes,
    clearError,
  };
};
