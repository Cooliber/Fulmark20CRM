/**
 * Search Stats Component
 * "Pasja rodzi profesjonalizm" - Professional Search Statistics Display
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Functional components only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 */

import React from 'react';
import styled from '@emotion/styled';
import { IconServer as IconDatabase } from 'twenty-ui/display';

// Styled Components
const StatsContainer = styled.div`
  display: flex;
  gap: 16px;
  padding: 12px;
  background: ${({ theme }) => theme.background.secondary};
  border-radius: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.font.color.tertiary};
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
`;

const StatusIndicator = styled.span<{ isHealthy: boolean }>`
  color: ${({ isHealthy }) => isHealthy ? '#22c55e' : '#ef4444'};
  font-weight: 500;
`;

// Types
interface SearchStatsData {
  totalDocuments: number;
  lastSync: string;
  totalSynced: number;
  errors: number;
  isRunning: boolean;
  weaviateHealth: boolean;
  hvacApiHealth: boolean;
}

interface SearchResultData {
  source: string;
  executionTime: number;
  totalCount?: number;
}

interface SearchStatsProps {
  stats: SearchStatsData;
  searchResult?: SearchResultData;
  className?: string;
}

// Helper functions
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Nieznana';
  }
};

const getHealthStatus = (isHealthy: boolean): string => {
  return isHealthy ? '✅' : '❌';
};

// Main Component
export const SearchStats: React.FC<SearchStatsProps> = ({
  stats,
  searchResult,
  className = '',
}) => {
  return (
    <StatsContainer className={className}>
      <StatItem>
        <IconDatabase size={12} />
        <span>Dokumenty: {stats.totalDocuments.toLocaleString('pl-PL')}</span>
      </StatItem>
      
      <StatItem>
        <span>Ostatnia sync: {formatDate(stats.lastSync)}</span>
      </StatItem>
      
      <StatItem>
        <span>Zsynchronizowane: {stats.totalSynced.toLocaleString('pl-PL')}</span>
      </StatItem>
      
      {stats.errors > 0 && (
        <StatItem>
          <StatusIndicator isHealthy={false}>
            Błędy: {stats.errors}
          </StatusIndicator>
        </StatItem>
      )}
      
      <StatItem>
        <span>Status: </span>
        <StatusIndicator isHealthy={stats.weaviateHealth}>
          {getHealthStatus(stats.weaviateHealth)} Weaviate
        </StatusIndicator>
        <span> | </span>
        <StatusIndicator isHealthy={stats.hvacApiHealth}>
          {getHealthStatus(stats.hvacApiHealth)} API
        </StatusIndicator>
      </StatItem>
      
      {stats.isRunning && (
        <StatItem>
          <StatusIndicator isHealthy={true}>
            🔄 Synchronizacja w toku
          </StatusIndicator>
        </StatItem>
      )}
      
      {searchResult && (
        <>
          <StatItem>
            <span>Źródło: {searchResult.source}</span>
          </StatItem>
          <StatItem>
            <span>Czas: {searchResult.executionTime}ms</span>
          </StatItem>
          {searchResult.totalCount !== undefined && (
            <StatItem>
              <span>Wyniki: {searchResult.totalCount}</span>
            </StatItem>
          )}
        </>
      )}
    </StatsContainer>
  );
};

// Component display name
SearchStats.displayName = 'SearchStats';
