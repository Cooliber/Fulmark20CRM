/**
 * useCommunicationTimeline Hook - HVAC Communication Timeline Management
 * "Pasja rodzi profesjonalizm" - Professional communication timeline hook
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Event handlers over useEffect
 * - Proper TypeScript typing
 * - Performance optimization
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  communicationAPIService,
  Communication,
  CommunicationFilter,
  CreateCommunicationRequest,
  CommunicationStats,
  AIInsights,
} from '../services/CommunicationAPIService';
import { trackHVACUserAction } from '../index';

// Hook state interface
interface UseCommunicationTimelineState {
  communications: Communication[];
  loading: boolean;
  error: string | null;
  total: number;
  stats: CommunicationStats | null;
  selectedCommunication: Communication | null;
  searchResults: Communication[];
  searchLoading: boolean;
}

// Hook options
interface UseCommunicationTimelineOptions {
  customerId: string;
  autoLoad?: boolean;
  enableRealTimeUpdates?: boolean;
  onError?: (error: Error) => void;
  onCommunicationCreated?: (communication: Communication) => void;
  onAIInsightsGenerated?: (insights: AIInsights) => void;
}

// Hook return type
interface UseCommunicationTimelineReturn {
  // State
  communications: Communication[];
  loading: boolean;
  error: string | null;
  total: number;
  stats: CommunicationStats | null;
  selectedCommunication: Communication | null;
  searchResults: Communication[];
  searchLoading: boolean;

  // Communication operations
  loadCommunications: (filters?: CommunicationFilter, page?: number, limit?: number) => Promise<void>;
  loadTimeline: (limit?: number) => Promise<void>;
  createCommunication: (communicationData: CreateCommunicationRequest) => Promise<Communication>;
  selectCommunication: (communication: Communication | null) => void;

  // Search operations
  searchCommunications: (query: string, limit?: number) => Promise<void>;
  clearSearch: () => void;

  // AI operations
  processEmailWithAI: (emailContent: string) => Promise<AIInsights>;

  // Stats operations
  loadStats: () => Promise<void>;

  // Utility functions
  refreshCommunications: () => Promise<void>;
  updateCommunicationStatus: (communicationId: string, status: Communication['status']) => Promise<void>;
  clearError: () => void;
}

/**
 * Communication timeline hook with AI insights and real-time updates
 * Implements HVAC CRM communication standards
 */
export const useCommunicationTimeline = (
  options: UseCommunicationTimelineOptions
): UseCommunicationTimelineReturn => {
  const {
    customerId,
    autoLoad = true,
    enableRealTimeUpdates = false,
    onError,
    onCommunicationCreated,
    onAIInsightsGenerated,
  } = options;

  // State management
  const [state, setState] = useState<UseCommunicationTimelineState>({
    communications: [],
    loading: false,
    error: null,
    total: 0,
    stats: null,
    selectedCommunication: null,
    searchResults: [],
    searchLoading: false,
  });

  const abortControllerRef = useRef<AbortController>();
  const currentFiltersRef = useRef<CommunicationFilter>({});
  const realTimeIntervalRef = useRef<NodeJS.Timeout>();

  // Load communications with filters and pagination
  const loadCommunications = useCallback(async (
    filters: CommunicationFilter = {},
    page = 1,
    limit = 20
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    currentFiltersRef.current = filters;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Add customerId to filters
      const finalFilters = { ...filters, customerId };

      trackHVACUserAction('communication_load_started', 'COMMUNICATION', {
        filters: finalFilters,
        page,
        limit,
      });

      const result = await communicationAPIService.getCommunications(finalFilters, page, limit);

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setState(prev => ({
        ...prev,
        communications: result.communications,
        total: result.total,
        loading: false,
      }));

      trackHVACUserAction('communication_load_success', 'COMMUNICATION', {
        count: result.communications.length,
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

      trackHVACUserAction('communication_load_error', 'COMMUNICATION', {
        error: errorMessage,
      });
    }
  }, [customerId, onError]);

  // Load communication timeline
  const loadTimeline = useCallback(async (limit = 50) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const timeline = await communicationAPIService.getCommunicationTimeline(customerId, limit);

      setState(prev => ({
        ...prev,
        communications: timeline,
        total: timeline.length,
        loading: false,
      }));

      trackHVACUserAction('communication_timeline_loaded', 'COMMUNICATION', {
        customerId,
        count: timeline.length,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [customerId, onError]);

  // Create new communication
  const createCommunication = useCallback(async (
    communicationData: CreateCommunicationRequest
  ): Promise<Communication> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const newCommunication = await communicationAPIService.createCommunication(communicationData);

      // Refresh communications
      await loadCommunications(currentFiltersRef.current);

      onCommunicationCreated?.(newCommunication);

      return newCommunication;

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
  }, [loadCommunications, onCommunicationCreated, onError]);

  // Select communication
  const selectCommunication = useCallback((communication: Communication | null) => {
    setState(prev => ({ ...prev, selectedCommunication: communication }));
    
    if (communication) {
      trackHVACUserAction('communication_selected', 'COMMUNICATION', {
        communicationId: communication.id,
        type: communication.type,
        direction: communication.direction,
      });
    }
  }, []);

  // Search communications
  const searchCommunications = useCallback(async (query: string, limit = 20) => {
    setState(prev => ({ ...prev, searchLoading: true, error: null }));

    try {
      const results = await communicationAPIService.searchCommunications(query, customerId, limit);

      setState(prev => ({
        ...prev,
        searchResults: results,
        searchLoading: false,
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        searchLoading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [customerId, onError]);

  // Clear search
  const clearSearch = useCallback(() => {
    setState(prev => ({ ...prev, searchResults: [], searchLoading: false }));
  }, []);

  // Process email with AI
  const processEmailWithAI = useCallback(async (emailContent: string): Promise<AIInsights> => {
    try {
      const insights = await communicationAPIService.processEmailWithAI(emailContent, customerId);
      
      onAIInsightsGenerated?.(insights);
      
      return insights;

    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to process email with AI'));
      throw error;
    }
  }, [customerId, onAIInsightsGenerated, onError]);

  // Load communication stats
  const loadStats = useCallback(async () => {
    try {
      const stats = await communicationAPIService.getCommunicationStats(customerId);

      setState(prev => ({
        ...prev,
        stats,
      }));

    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to load communication stats'));
    }
  }, [customerId, onError]);

  // Refresh communications
  const refreshCommunications = useCallback(async () => {
    await loadCommunications(currentFiltersRef.current);
  }, [loadCommunications]);

  // Update communication status
  const updateCommunicationStatus = useCallback(async (
    communicationId: string,
    status: Communication['status']
  ) => {
    try {
      const updatedCommunication = await communicationAPIService.updateCommunicationStatus(
        communicationId,
        status
      );

      // Update communication in state
      setState(prev => ({
        ...prev,
        communications: prev.communications.map(comm => 
          comm.id === communicationId ? updatedCommunication : comm
        ),
        selectedCommunication: prev.selectedCommunication?.id === communicationId 
          ? updatedCommunication 
          : prev.selectedCommunication,
      }));

    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to update communication status'));
    }
  }, [onError]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-load communications on mount
  useEffect(() => {
    if (autoLoad) {
      loadTimeline();
      loadStats();
    }
  }, [autoLoad, loadTimeline, loadStats]);

  // Real-time updates
  useEffect(() => {
    if (enableRealTimeUpdates) {
      realTimeIntervalRef.current = setInterval(() => {
        refreshCommunications();
      }, 30000); // Refresh every 30 seconds

      return () => {
        if (realTimeIntervalRef.current) {
          clearInterval(realTimeIntervalRef.current);
        }
      };
    }
  }, [enableRealTimeUpdates, refreshCommunications]);

  return {
    // State
    communications: state.communications,
    loading: state.loading,
    error: state.error,
    total: state.total,
    stats: state.stats,
    selectedCommunication: state.selectedCommunication,
    searchResults: state.searchResults,
    searchLoading: state.searchLoading,

    // Communication operations
    loadCommunications,
    loadTimeline,
    createCommunication,
    selectCommunication,

    // Search operations
    searchCommunications,
    clearSearch,

    // AI operations
    processEmailWithAI,

    // Stats operations
    loadStats,

    // Utility functions
    refreshCommunications,
    updateCommunicationStatus,
    clearError,
  };
};
