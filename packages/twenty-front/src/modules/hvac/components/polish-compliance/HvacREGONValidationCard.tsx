import styled from '@emotion/styled';
import { IconCheck, IconUsers, IconX } from 'twenty-ui/display';

// Removed unused imports - using PrimeReact components instead
import { REGONValidationResult } from '../../types/hvac-polish-compliance.types';

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

const StyledREGONDisplay = styled.div`
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
    margin-bottom: 8px;
  }
  
  .employee-count {
    color: ${({ theme }) => theme.font.color.tertiary};
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const StyledPKDCodes = styled.div`
  margin-bottom: 16px;
  
  .pkd-label {
    font-size: 12px;
    color: ${({ theme }) => theme.font.color.tertiary};
    margin-bottom: 8px;
    font-weight: 600;
  }
  
  .pkd-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
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

export type HvacREGONValidationCardProps = {
  validation: REGONValidationResult;
  showDetails?: boolean;
};

export const HvacREGONValidationCard = ({
  validation,
  showDetails = true,
}: HvacREGONValidationCardProps) => {
  const getEmployeeCountLabel = (employeeCount?: string): string => {
    switch (employeeCount) {
      case '0': return 'Brak pracowników';
      case '1-9': return '1-9 pracowników';
      case '10-49': return '10-49 pracowników';
      case '50-249': return '50-249 pracowników';
      case '250+': return '250+ pracowników';
      default: return employeeCount || 'Nieznana liczba pracowników';
    }
  };

  const getPKDDescription = (pkdCode: string): string => {
    // Simplified PKD code descriptions for HVAC-related codes
    const pkdDescriptions: Record<string, string> = {
      '43.22.Z': 'Roboty instalacyjne wodno-kanalizacyjne, cieplne, gazowe i klimatyzacyjne',
      '43.21.Z': 'Roboty instalacyjne elektryczne',
      '33.12.Z': 'Naprawa i konserwacja maszyn',
      '33.20.Z': 'Instalowanie maszyn przemysłowych',
      '46.74.Z': 'Sprzedaż hurtowa wyrobów metalowych, sprzętu instalacyjnego',
      '47.52.Z': 'Sprzedaż detaliczna wyrobów metalowych, farb i szkła',
    };

    return pkdDescriptions[pkdCode] || pkdCode;
  };

  const renderCompanyInfo = () => {
    if (!validation.companyName && !validation.address && !validation.employeeCount) return null;

    return (
      <StyledCompanyInfo>
        {validation.companyName && (
          <div className="company-name">
            <IconUsers size={16} />
            {validation.companyName}
          </div>
        )}
        {validation.address && (
          <div className="company-address">
            <IconUsers size={14} />
            {validation.address}
          </div>
        )}
        {validation.employeeCount && (
          <div className="employee-count">
            <IconUsers size={14} />
            {getEmployeeCountLabel(validation.employeeCount)}
          </div>
        )}
      </StyledCompanyInfo>
    );
  };

  const renderPKDCodes = () => {
    if (!validation.pkd?.length || !showDetails) return null;

    return (
      <StyledPKDCodes>
        <div className="pkd-label">Kody PKD (działalność):</div>
        <div className="pkd-list">
          {validation.pkd.map((pkdCode, index) => (
            <Chip
              key={index}
              label={getPKDDescription(pkdCode)}
              color="#E5E7EB"
              size="small"
            />
          ))}
        </div>
      </StyledPKDCodes>
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
        {validation.isValid && ' • Dane z rejestru REGON (GUS)'}
      </StyledMetadata>
    );
  };

  return (
    <StyledCard isValid={validation.isValid}>
      <StyledHeader>
        <H4Title title="Walidacja REGON" />
        <StyledStatusIcon isValid={validation.isValid}>
          {validation.isValid ? <IconCheck size={24} /> : <IconX size={24} />}
        </StyledStatusIcon>
      </StyledHeader>

      <StyledREGONDisplay>
        {validation.formatted}
      </StyledREGONDisplay>

      {renderCompanyInfo()}
      {renderPKDCodes()}
      {renderError()}
      {renderMetadata()}
    </StyledCard>
  );
};
