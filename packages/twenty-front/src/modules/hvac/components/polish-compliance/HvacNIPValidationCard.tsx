import styled from '@emotion/styled';
import { IconCheck, IconX } from 'twenty-ui/display';

// Removed unused imports - using PrimeReact components instead
import { NIPValidationResult } from '../../types/hvac-polish-compliance.types';

const StyledCard = styled(Card)<{ isValid: boolean }>`
  padding: 20px;
  border-left: 4px solid ${({ isValid }) => isValid ? '#10B981' : '#EF4444'};
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const StyledStatusIcon = styled.div<{ isValid: boolean }>`
  color: ${({ isValid }) => isValid ? '#10B981' : '#EF4444'};
`;

const StyledNIPDisplay = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.font.color.primary};
  margin-bottom: 12px;
`;

const StyledCompanyInfo = styled.div`
  margin-bottom: 16px;
  
  .company-name {
    font-weight: 600;
    color: ${({ theme }) => theme.font.color.primary};
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .company-address {
    color: ${({ theme }) => theme.font.color.tertiary};
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const StyledStatusInfo = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const StyledError = styled.div`
  color: ${({ theme }) => theme.font.color.danger};
  font-size: 14px;
  margin-top: 8px;
  padding: 8px;
  background: ${({ theme }) => theme.background.danger};
  border-radius: 6px;
`;

const StyledMetadata = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.font.color.light};
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.border.color.light};
`;

export type HvacNIPValidationCardProps = {
  validation: NIPValidationResult;
  showDetails?: boolean;
};

export const HvacNIPValidationCard = ({
  validation,
  showDetails = true,
}: HvacNIPValidationCardProps) => {
  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#F59E0B';
      case 'suspended': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status?: string): string => {
    switch (status) {
      case 'active': return 'Aktywny';
      case 'inactive': return 'Nieaktywny';
      case 'suspended': return 'Zawieszony';
      default: return 'Nieznany';
    }
  };

  const renderCompanyInfo = () => {
    if (!validation.companyName && !validation.address) return null;

    return (
      <StyledCompanyInfo>
        {validation.companyName && (
          <div className="company-name">
            <IconCheck size={16} />
            {validation.companyName}
          </div>
        )}
        {validation.address && (
          <div className="company-address">
            <IconCheck size={14} />
            {validation.address}
          </div>
        )}
      </StyledCompanyInfo>
    );
  };

  const renderStatusInfo = () => {
    if (!showDetails) return null;

    return (
      <StyledStatusInfo>
        {validation.status && (
          <Chip
            label={`Status: ${getStatusLabel(validation.status)}`}
            color={getStatusColor(validation.status)}
            size="small"
          />
        )}
        {validation.vatPayer !== undefined && (
          <Chip
            label={validation.vatPayer ? 'Płatnik VAT' : 'Nie płaci VAT'}
            color={validation.vatPayer ? '#10B981' : '#6B7280'}
            size="small"
          />
        )}
      </StyledStatusInfo>
    );
  };

  const renderError = () => {
    if (!validation.error) return null;

    return (
      <StyledError>
        {validation.error}
      </StyledError>
    );
  };

  const renderMetadata = () => {
    if (!showDetails) return null;

    return (
      <StyledMetadata>
        Sprawdzono: {new Date().toLocaleString('pl-PL')}
        {validation.isValid && ' • Dane z rejestru VAT'}
      </StyledMetadata>
    );
  };

  return (
    <StyledCard isValid={validation.isValid}>
      <StyledHeader>
        <H4Title title="Walidacja NIP" />
        <StyledStatusIcon isValid={validation.isValid}>
          {validation.isValid ? <IconCheck size={24} /> : <IconX size={24} />}
        </StyledStatusIcon>
      </StyledHeader>

      <StyledNIPDisplay>
        {validation.formatted}
      </StyledNIPDisplay>

      {renderCompanyInfo()}
      {renderStatusInfo()}
      {renderError()}
      {renderMetadata()}
    </StyledCard>
  );
};
