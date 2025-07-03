/**
 * Search Header Component
 * "Pasja rodzi profesjonalizm" - Professional Search Header
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Functional components only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 */

import React, { useCallback } from 'react';
import styled from '@emotion/styled';
import { IconSearch, IconRefresh } from 'twenty-ui/display';
import { IconServer as IconDatabase } from 'twenty-ui/display';

// Styled Components
const SearchHeaderContainer = styled.div`
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
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Types
interface SearchHeaderProps {
  query: string;
  useWeaviate: boolean;
  syncLoading: boolean;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onToggleWeaviate: () => void;
  onSync: () => void;
}

// Main Component
export const SearchHeader: React.FC<SearchHeaderProps> = ({
  query,
  useWeaviate,
  syncLoading,
  onQueryChange,
  onSearch,
  onToggleWeaviate,
  onSync,
}) => {
  // Event handlers - Following Twenty CRM cursor rules
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    onQueryChange(newQuery);
  }, [onQueryChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(query);
    }
  }, [query, onSearch]);

  const handleWeaviateToggle = useCallback(() => {
    onToggleWeaviate();
  }, [onToggleWeaviate]);

  const handleSyncClick = useCallback(() => {
    onSync();
  }, [onSync]);

  return (
    <SearchHeaderContainer>
      <SearchInputContainer>
        <SearchIcon size={16} />
        <SearchInput
          type="text"
          placeholder="Szukaj w dokumentach HVAC... (np. 'konserwacja kotła', 'awaria klimatyzacji')"
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
        />
      </SearchInputContainer>
      
      <FilterButton onClick={handleWeaviateToggle}>
        <IconDatabase size={16} />
        {useWeaviate ? 'Weaviate' : 'API'}
      </FilterButton>
      
      <FilterButton onClick={handleSyncClick} disabled={syncLoading}>
        <IconRefresh size={16} />
        {syncLoading ? 'Synchronizacja...' : 'Synchronizuj'}
      </FilterButton>
    </SearchHeaderContainer>
  );
};

// Component display name
SearchHeader.displayName = 'SearchHeader';
