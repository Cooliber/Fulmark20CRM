import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import styled from '@emotion/styled';
import { IconSearch, IconFilter, IconRefresh } from 'twenty-ui/display';

// Note: IconDatabase is not available in twenty-ui, using IconServer as alternative
import { IconServer as IconDatabase } from 'twenty-ui/display';

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

const SearchHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  gap: 12px;
`;

const SearchInputContainer = styled.div`
  position: relative;
  flex: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: 6px;
  background: ${({ theme }) => theme.background.secondary};
  color: ${({ theme }) => theme.font.color.primary};
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.blue};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.color.blue}20;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.font.color.tertiary};
  }
`;

const SearchIcon = styled(IconSearch)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.font.color.tertiary};
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: 6px;
  background: ${({ theme }) => theme.background.secondary};
  color: ${({ theme }) => theme.font.color.secondary};
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => theme.background.tertiary};
  }
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 16px;
  padding: 12px;
  background: ${({ theme }) => theme.background.secondary};
  border-radius: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.font.color.tertiary};
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ResultCard = styled.div`
  padding: 16px;
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.light};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.color.blue};
    box-shadow: 0 2px 8px ${({ theme }) => theme.color.blue}20;
  }
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
`;

const ResultTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.font.color.primary};
  flex: 1;
`;

const ResultType = styled.span`
  padding: 4px 8px;
  background: ${({ theme }) => theme.color.blue}20;
  color: ${({ theme }) => theme.color.blue};
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
`;

const ResultScore = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.font.color.tertiary};
`;

const ResultDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.font.color.secondary};
  line-height: 1.4;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: ${({ theme }) => theme.font.color.tertiary};
`;

// Types
interface SearchFilters {
  type?: string;
  customerId?: string;
  equipmentId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  relevanceScore: number;
  metadata: string;
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

  // Enhanced search with 300ms debouncing for performance optimization
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for 300ms debouncing
    const newTimeout = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery.trim()) {
        refetchSearch({
          input: {
            query: searchQuery,
            filters,
            limit: 20,
          },
          useWeaviate,
        });
      }
    }, 300);

    setSearchTimeout(newTimeout);
  }, [filters, useWeaviate, refetchSearch, searchTimeout]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleResultClick = useCallback((result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    }
  }, [onResultClick]);

  const handleSyncTrigger = useCallback(() => {
    triggerSync();
  }, [triggerSync]);

  const results = searchData?.hvacSemanticSearch?.results || [];
  const stats = statsData?.hvacSemanticSearchStats;

  return (
    <SearchContainer>
      <SearchHeader>
        <SearchInputContainer>
          <SearchIcon size={16} />
          <SearchInput
            type="text"
            placeholder="Szukaj w dokumentach HVAC... (np. 'konserwacja kotła', 'awaria klimatyzacji')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch(query);
              }
            }}
          />
        </SearchInputContainer>
        
        <FilterButton onClick={() => setUseWeaviate(!useWeaviate)}>
          <IconDatabase size={16} />
          {useWeaviate ? 'Weaviate' : 'API'}
        </FilterButton>
        
        <FilterButton onClick={handleSyncTrigger} disabled={syncLoading}>
          <IconRefresh size={16} />
          {syncLoading ? 'Synchronizacja...' : 'Synchronizuj'}
        </FilterButton>
      </SearchHeader>

      {showStats && stats && (
        <StatsContainer>
          <StatItem>
            <IconDatabase size={12} />
            Dokumenty: {stats.totalDocuments}
          </StatItem>
          <StatItem>
            Ostatnia sync: {new Date(stats.lastSync).toLocaleString('pl-PL')}
          </StatItem>
          <StatItem>
            Status: {stats.weaviateHealth ? '✅ Weaviate' : '❌ Weaviate'} | {stats.hvacApiHealth ? '✅ API' : '❌ API'}
          </StatItem>
          {searchData?.hvacSemanticSearch && (
            <StatItem>
              Źródło: {searchData.hvacSemanticSearch.source} | Czas: {searchData.hvacSemanticSearch.executionTime}ms
            </StatItem>
          )}
        </StatsContainer>
      )}

      <ResultsContainer>
        {searchLoading && (
          <LoadingSpinner>
            Wyszukiwanie...
          </LoadingSpinner>
        )}

        {!searchLoading && results.length === 0 && query && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Brak wyników dla zapytania "{query}"
          </div>
        )}

        {!searchLoading && results.map((result: SearchResult) => (
          <ResultCard key={result.id} onClick={() => handleResultClick(result)}>
            <ResultHeader>
              <ResultTitle>{result.title}</ResultTitle>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <ResultType>{result.type}</ResultType>
                <ResultScore>{Math.round(result.relevanceScore * 100)}%</ResultScore>
              </div>
            </ResultHeader>
            <ResultDescription>{result.description}</ResultDescription>
          </ResultCard>
        ))}
      </ResultsContainer>
    </SearchContainer>
  );
};
