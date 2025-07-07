import styled from '@emotion/styled';
import { IconBolt, IconMail, IconMap, IconPhone, IconWorld } from 'twenty-ui/display';

import { Button } from 'twenty-ui/input';
import { PolishEnergyProvider } from '../../types/hvac-polish-compliance.types';

const StyledCard = styled(Card)<{ compact?: boolean }>`
  padding: ${({ compact }) => compact ? '16px' : '20px'};
  border-left: 4px solid #3B82F6;
  
  &:hover {
    box-shadow: ${({ theme }) => theme.boxShadow.light};
    transform: translateY(-1px);
    transition: all 0.2s ease;
  }
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const StyledProviderName = styled.div<{ compact?: boolean }>`
  font-size: ${({ compact }) => compact ? '16px' : '18px'};
  font-weight: 600;
  color: ${({ theme }) => theme.font.color.primary};
  margin-bottom: 4px;
`;

const StyledProviderCode = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: ${({ theme }) => theme.font.color.tertiary};
  background: ${({ theme }) => theme.background.secondary};
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
`;

const StyledRegions = styled.div`
  margin-bottom: 16px;
  
  .regions-label {
    font-size: 12px;
    color: ${({ theme }) => theme.font.color.tertiary};
    margin-bottom: 8px;
    font-weight: 600;
  }
  
  .regions-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
`;

const StyledServices = styled.div`
  margin-bottom: 16px;
  
  .services-label {
    font-size: 12px;
    color: ${({ theme }) => theme.font.color.tertiary};
    margin-bottom: 8px;
    font-weight: 600;
  }
  
  .services-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
`;

const StyledContactInfo = styled.div<{ compact?: boolean }>`
  display: ${({ compact }) => compact ? 'none' : 'flex'};
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  
  .contact-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: ${({ theme }) => theme.font.color.tertiary};
    
    a {
      color: ${({ theme }) => theme.accent.primary};
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

const StyledActions = styled.div<{ compact?: boolean }>`
  display: ${({ compact }) => compact ? 'none' : 'flex'};
  gap: 8px;
  justify-content: flex-end;
`;

export type HvacEnergyProviderCardProps = {
  provider: PolishEnergyProvider;
  compact?: boolean;
  onSelect?: (provider: PolishEnergyProvider) => void;
  onViewDetails?: (provider: PolishEnergyProvider) => void;
};

export const HvacEnergyProviderCard = ({
  provider,
  compact = false,
  onSelect,
  onViewDetails,
}: HvacEnergyProviderCardProps) => {
  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'electricity': return '⚡';
      case 'gas': return '🔥';
      case 'renewable': return '🌱';
      case 'heat': return '🌡️';
      default: return '🔌';
    }
  };

  const getServiceLabel = (service: string): string => {
    switch (service) {
      case 'electricity': return 'Energia elektryczna';
      case 'gas': return 'Gaz ziemny';
      case 'renewable': return 'Energia odnawialna';
      case 'heat': return 'Ciepło systemowe';
      default: return service;
    }
  };

  const getRegionLabel = (region: string): string => {
    const regionLabels: Record<string, string> = {
      'mazowieckie': 'Mazowieckie',
      'śląskie': 'Śląskie',
      'wielkopolskie': 'Wielkopolskie',
      'małopolskie': 'Małopolskie',
      'lubelskie': 'Lubelskie',
      'podlaskie': 'Podlaskie',
      'warmińsko-mazurskie': 'Warmińsko-mazurskie',
      'zachodniopomorskie': 'Zachodniopomorskie',
      'lubuskie': 'Lubuskie',
      'pomorskie': 'Pomorskie',
      'kujawsko-pomorskie': 'Kujawsko-pomorskie',
      'opolskie': 'Opolskie',
    };

    return regionLabels[region] || region;
  };

  const renderRegions = () => (
    <StyledRegions>
      <div className="regions-label">
        <IconMap size={12} style={{ marginRight: '4px' }} />
        Obsługiwane województwa:
      </div>
      <div className="regions-list">
        {provider.regions.map((region, index) => (
          <Chip
            key={index}
            label={getRegionLabel(region)}
            color="#E5E7EB"
            size="small"
          />
        ))}
      </div>
    </StyledRegions>
  );

  const renderServices = () => (
    <StyledServices>
      <div className="services-label">
        <IconBolt size={12} style={{ marginRight: '4px' }} />
        Usługi:
      </div>
      <div className="services-list">
        {provider.services.map((service, index) => (
          <Chip
            key={index}
            label={`${getServiceIcon(service)} ${getServiceLabel(service)}`}
            color="#DBEAFE"
            size="small"
          />
        ))}
      </div>
    </StyledServices>
  );

  const renderContactInfo = () => (
    <StyledContactInfo compact={compact}>
      <div className="contact-item">
        <IconPhone size={14} />
        <a href={`tel:${provider.contactInfo.phone}`}>
          {provider.contactInfo.phone}
        </a>
      </div>
      <div className="contact-item">
        <IconMail size={14} />
        <a href={`mailto:${provider.contactInfo.email}`}>
          {provider.contactInfo.email}
        </a>
      </div>
      <div className="contact-item">
        <IconWorld size={14} />
        <a href={provider.contactInfo.website} target="_blank" rel="noopener noreferrer">
          {provider.contactInfo.website}
        </a>
      </div>
    </StyledContactInfo>
  );

  const renderActions = () => (
    <StyledActions compact={compact}>
      {onViewDetails && (
        <Button
          title="Szczegóły"
          onClick={() => onViewDetails(provider)}
          variant="secondary"
          size="small"
        />
      )}
      {onSelect && (
        <Button
          title="Wybierz"
          onClick={() => onSelect(provider)}
          variant="primary"
          size="small"
        />
      )}
    </StyledActions>
  );

  return (
    <StyledCard compact={compact}>
      <StyledHeader>
        <div>
          <StyledProviderName compact={compact}>
            {provider.name}
          </StyledProviderName>
          <StyledProviderCode>
            {provider.code}
          </StyledProviderCode>
        </div>
      </StyledHeader>

      {renderRegions()}
      {renderServices()}
      {renderContactInfo()}
      {renderActions()}
    </StyledCard>
  );
};
