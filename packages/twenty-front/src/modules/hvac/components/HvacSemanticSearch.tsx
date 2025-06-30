/**
 * HVAC Semantic Search Component - Refactored
 * "Pasja rodzi profesjonalizm" - Professional Search Interface
 *
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Functional components only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 */

import { gql, useMutation, useQuery } from '@apollo/client';
import styled from '@emotion/styled';
import React, { useCallback, useState } from 'react';

// HVAC Search Components
import { IconDatabase, IconRefresh } from '@tabler/icons-react';
import { SearchHeader } from './search/SearchHeader';
import { type SearchResult } from './search/SearchResults';

// HVAC Performance Monitoring
import { useHVACDebouncedPerformance } from '../hooks/useHVACPerformanceMonitoring';

// GraphQL Queries
const HVAC_SEMANTIC_SEARCH = gql`
  query HvacSemanticSearch($input: HvacSemanticSearchInput!, $useWeaviate: Boolean = true) {
    hvacSemanticSearch(input: $input, useWeaviate: $useWeaviate) {
      results {
        id
        type
        title
        description
        relevanceScore
        metadata
      }
      totalCount
      query
      executionTime
      source
    }
  }
`;

const HVAC_SEARCH_SUGGESTIONS = gql`
  query HvacSearchSuggestions($query: String!, $limit: Int = 5) {
    hvacSearchSuggestions(query: $query, limit: $limit)
  }
`;

const HVAC_SEMANTIC_STATS = gql`
  query HvacSemanticSearchStats {
    hvacSemanticSearchStats {
      totalDocuments
      lastSync
      totalSynced
      errors
      isRunning
      weaviateHealth
      hvacApiHealth
    }
  }
`;

const TRIGGER_HVAC_SYNC = gql`
  mutation TriggerHvacDataSync {
    triggerHvacDataSync
  }
`;

// Styled Components
const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: ${({ theme }) => theme.background.primary};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border.color.medium};
`;

// Types
interface SearchFilters {
  type?: string;
  customerId?: string;
  equipmentId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface HvacSemanticSearchProps {
  onResultClick?: (result: SearchResult) => void;
  defaultQuery?: string;
  showStats?: boolean;
}

export const HvacSemanticSearch: React.FC<HvacSemanticSearchProps> = ({
  onResultClick,
  defaultQuery = '',
  showStats = true,
}) => {
  const [query, setQuery] = useState(defaultQuery);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [useWeaviate, setUseWeaviate] = useState(true);

  // Performance monitoring
  const { debouncedMeasure } = useHVACDebouncedPerformance();

  // GraphQL hooks
  const { data: searchData, loading: searchLoading, refetch: refetchSearch } = useQuery(
    HVAC_SEMANTIC_SEARCH,
    {
      variables: {
        input: {
          query: query || 'maintenance',
          filters,
          limit: 20,
        },
        useWeaviate,
      },
      skip: !query,
    }
  );

  const { data: statsData, refetch: refetchStats } = useQuery(HVAC_SEMANTIC_STATS, {
    skip: !showStats,
    pollInterval: 30000, // Poll every 30 seconds
  });

  const [triggerSync, { loading: syncLoading }] = useMutation(TRIGGER_HVAC_SYNC, {
    onCompleted: () => {
      refetchStats();
      if (query) {
        refetchSearch();
      }
    },
  });

  // Event handlers - Following Twenty CRM cursor rules
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    await debouncedMeasure(
      'semantic_search',
      'SEMANTIC_SEARCH',
      async () => {
        await refetchSearch({
          input: {
            query: searchQuery,
            filters,
            limit: 20,
          },
          useWeaviate,
        });
      },
      300, // 300ms debounce
      { query: searchQuery.substring(0, 50), useWeaviate }
    );
  }, [filters, useWeaviate, refetchSearch, debouncedMeasure]);

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const handleToggleWeaviate = useCallback(() => {
    setUseWeaviate(prev => !prev);
  }, []);

  const handleSync = useCallback(() => {
    triggerSync();
  }, [triggerSync]);

  const handleResultClick = useCallback((result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    }
  }, [onResultClick]);

  // Data extraction
  const results = searchData?.hvacSemanticSearch?.results || [];
  const stats = statsData?.hvacSemanticSearchStats;
  const searchResult = searchData?.hvacSemanticSearch;

  return (
    <SearchContainer>
      <SearchHeader
        query={query}
        useWeaviate={useWeaviate}
        syncLoading={syncLoading}
        onQueryChange={handleQueryChange}
        onSearch={handleSearch}
        onToggleWeaviate={handleToggleWeaviate}
        onSync={handleSync}
      />

      {showStats && stats && (
        <SearchStats
          stats={stats}
          searchResult={searchResult}
        />
      )}

      <SearchResults
        results={results}
        loading={searchLoading}
        query={query}
        onResultClick={handleResultClick}
      />
    </SearchContainer>
  );
};
