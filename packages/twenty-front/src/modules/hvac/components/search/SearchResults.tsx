/**
 * Search Results Component
 * "Pasja rodzi profesjonalizm" - Professional Search Results Display
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Functional components only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 */

import React, { useCallback } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

// Styled Components
const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ResultCard = styled(motion.div)`
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
  justify-content: space-between;
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
  line-height: 1.3;
`;

const ResultMeta = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
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
  font-weight: 500;
`;

const ResultDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.font.color.secondary};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: 14px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: 14px;
`;

// Types
export interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  relevanceScore: number;
  metadata?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  query: string;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
}

// Helper functions
const formatScore = (score: number): string => {
  return `${Math.round(score * 100)}%`;
};

const getTypeColor = (type: string): string => {
  const typeColors: Record<string, string> = {
    'SERVICE_TICKET': '#3b82f6',
    'CUSTOMER': '#10b981',
    'EQUIPMENT': '#f59e0b',
    'MAINTENANCE': '#8b5cf6',
    'MANUAL': '#ef4444',
    'KNOWLEDGE_BASE': '#06b6d4',
  };
  return typeColors[type] || '#6b7280';
};

// Main Component
export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  loading,
  query,
  onResultClick,
  className = '',
}) => {
  // Event handler for result click
  const handleResultClick = useCallback((result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    }
  }, [onResultClick]);

  // Loading state
  if (loading) {
    return (
      <ResultsContainer className={className}>
        <LoadingSpinner>
          <i className="pi pi-spin pi-spinner mr-2" />
          Wyszukiwanie...
        </LoadingSpinner>
      </ResultsContainer>
    );
  }

  // Empty state
  if (!loading && results.length === 0 && query) {
    return (
      <ResultsContainer className={className}>
        <EmptyState>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <div style={{ fontWeight: '500', marginBottom: '8px' }}>
            Brak wyników dla zapytania "{query}"
          </div>
          <div style={{ fontSize: '12px' }}>
            Spróbuj użyć innych słów kluczowych lub sprawdź pisownię
          </div>
        </EmptyState>
      </ResultsContainer>
    );
  }

  // Results display
  return (
    <ResultsContainer className={className}>
      {results.map((result, index) => (
        <ResultCard
          key={result.id}
          onClick={() => handleResultClick(result)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <ResultHeader>
            <ResultTitle>{result.title}</ResultTitle>
            <ResultMeta>
              <ResultType style={{ backgroundColor: `${getTypeColor(result.type)}20`, color: getTypeColor(result.type) }}>
                {result.type.replace('_', ' ')}
              </ResultType>
              <ResultScore>{formatScore(result.relevanceScore)}</ResultScore>
            </ResultMeta>
          </ResultHeader>
          <ResultDescription>{result.description}</ResultDescription>
        </ResultCard>
      ))}
    </ResultsContainer>
  );
};

// Component display name
SearchResults.displayName = 'SearchResults';
