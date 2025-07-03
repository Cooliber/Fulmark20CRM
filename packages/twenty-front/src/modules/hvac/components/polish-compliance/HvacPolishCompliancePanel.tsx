import styled from '@emotion/styled';
import { useCallback, useState } from 'react';
import { IconAlertTriangle, IconCheck, IconSearch } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { useHvacPolishCompliance } from '../../hooks/useHvacPolishCompliance';
import { HvacComplianceScoreCard } from './HvacComplianceScoreCard';
import { HvacEnergyProviderCard } from './HvacEnergyProviderCard';
import { HvacNIPValidationCard } from './HvacNIPValidationCard';
import { HvacREGONValidationCard } from './HvacREGONValidationCard';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const StyledValidationSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StyledInputGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 16px;
  
  .input-container {
    flex: 1;
  }
  
  .button-container {
    flex-shrink: 0;
  }
`;

const StyledComplianceOverview = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StyledEnergyProviders = styled.div`
  margin-top: 20px;
`;

const StyledProviderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

export type HvacPolishCompliancePanelProps = {
  customerId?: string;
  companyData?: {
    nip?: string;
    regon?: string;
    region?: string;
    hvacLicenses?: string[];
  };
  onComplianceUpdate?: (score: number) => void;
};

export const HvacPolishCompliancePanel = ({
  customerId,
  companyData,
  onComplianceUpdate,
}: HvacPolishCompliancePanelProps) => {
  const [nipInput, setNipInput] = useState(companyData?.nip || '');
  const [regonInput, setRegonInput] = useState(companyData?.regon || '');
  const [regionInput, setRegionInput] = useState(companyData?.region || '');

  const {
    nipValidation,
    regonValidation,
    energyProvider,
    energyProviders,
    complianceCheck,
    loading,
    error,
    validateNIP,
    validateREGON,
    getEnergyProvider,
    performComplianceCheck,
    clearError,
  } = useHvacPolishCompliance({
    onError: (error) => {
      console.error('Polish compliance error:', error);
    },
  });

  const handleNIPValidation = useCallback(async () => {
    if (!nipInput.trim()) return;
    await validateNIP(nipInput.trim());
  }, [nipInput, validateNIP]);

  const handleREGONValidation = useCallback(async () => {
    if (!regonInput.trim()) return;
    await validateREGON(regonInput.trim());
  }, [regonInput, validateREGON]);

  const handleEnergyProviderSearch = useCallback(async () => {
    if (!regionInput.trim()) return;
    await getEnergyProvider(regionInput.trim());
  }, [regionInput, getEnergyProvider]);

  const handleComplianceCheck = useCallback(async () => {
    const result = await performComplianceCheck({
      nip: nipInput.trim() || undefined,
      regon: regonInput.trim() || undefined,
      region: regionInput.trim() || undefined,
      hvacLicenses: companyData?.hvacLicenses,
    });

    if (result && onComplianceUpdate) {
      onComplianceUpdate(result.complianceScore);
    }
  }, [nipInput, regonInput, regionInput, companyData?.hvacLicenses, performComplianceCheck, onComplianceUpdate]);

  const renderValidationInputs = () => (
    <Card>
      <div style={{ padding: '20px' }}>
        <H3Title title="Walidacja danych firmy" />
        
        <StyledInputGroup>
          <div className="input-container">
            <TextInput
              label="Numer NIP"
              value={nipInput}
              onChange={(value) => setNipInput(value)}
              placeholder="123-456-78-90"
              fullWidth
            />
          </div>
          <div className="button-container">
            <Button
              title="Sprawdź NIP"
              Icon={IconSearch}
              onClick={handleNIPValidation}
              variant="secondary"
              size="medium"
              disabled={!nipInput.trim() || loading}
            />
          </div>
        </StyledInputGroup>

        <StyledInputGroup>
          <div className="input-container">
            <TextInput
              label="Numer REGON"
              value={regonInput}
              onChange={(value) => setRegonInput(value)}
              placeholder="123456789"
              fullWidth
            />
          </div>
          <div className="button-container">
            <Button
              title="Sprawdź REGON"
              Icon={IconSearch}
              onClick={handleREGONValidation}
              variant="secondary"
              size="medium"
              disabled={!regonInput.trim() || loading}
            />
          </div>
        </StyledInputGroup>

        <StyledInputGroup>
          <div className="input-container">
            <TextInput
              label="Region / Województwo"
              value={regionInput}
              onChange={(value) => setRegionInput(value)}
              placeholder="mazowieckie"
              fullWidth
            />
          </div>
          <div className="button-container">
            <Button
              title="Znajdź dostawcę"
              Icon={IconBuilding}
              onClick={handleEnergyProviderSearch}
              variant="secondary"
              size="medium"
              disabled={!regionInput.trim() || loading}
            />
          </div>
        </StyledInputGroup>

        <Button
          title="Sprawdź zgodność"
          Icon={IconCheck}
          onClick={handleComplianceCheck}
          variant="primary"
          size="medium"
          disabled={loading}
          fullWidth
        />
      </div>
    </Card>
  );

  const renderValidationResults = () => (
    <StyledValidationSection>
      {nipValidation && (
        <HvacNIPValidationCard validation={nipValidation} />
      )}
      
      {regonValidation && (
        <HvacREGONValidationCard validation={regonValidation} />
      )}
    </StyledValidationSection>
  );

  const renderComplianceOverview = () => {
    if (!complianceCheck) return null;

    return (
      <StyledComplianceOverview>
        <div>
          <HvacComplianceScoreCard 
            complianceCheck={complianceCheck}
            onRecommendationClick={(recommendation) => {
              console.log('Recommendation clicked:', recommendation);
            }}
          />
        </div>
        
        {energyProvider && (
          <div>
            <HvacEnergyProviderCard provider={energyProvider} />
          </div>
        )}
      </StyledComplianceOverview>
    );
  };

  const renderEnergyProviders = () => {
    if (!energyProviders.length) return null;

    return (
      <StyledEnergyProviders>
        <H3Title title="Dostępni dostawcy energii" />
        <StyledProviderGrid>
          {energyProviders.map((provider) => (
            <HvacEnergyProviderCard
              key={provider.code}
              provider={provider}
              compact
            />
          ))}
        </StyledProviderGrid>
      </StyledEnergyProviders>
    );
  };

  if (error) {
    return (
      <Card>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <IconAlertTriangle size={48} color="#EF4444" />
          <H3Title title="Błąd sprawdzania zgodności" />
          <p style={{ color: '#6B7280', marginBottom: '16px' }}>{error}</p>
          <Button
            title="Spróbuj ponownie"
            onClick={clearError}
            variant="secondary"
            size="medium"
          />
        </div>
      </Card>
    );
  }

  return (
    <StyledContainer>
      <StyledHeader>
        <H3Title title="Zgodność z polskimi przepisami" />
      </StyledHeader>

      {renderValidationInputs()}
      {renderValidationResults()}
      {renderComplianceOverview()}
      {renderEnergyProviders()}
    </StyledContainer>
  );
};
