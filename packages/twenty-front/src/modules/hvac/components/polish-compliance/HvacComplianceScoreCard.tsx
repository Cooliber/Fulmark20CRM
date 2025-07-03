import styled from '@emotion/styled';
import { IconAlertTriangle, IconCheck } from 'twenty-ui/display';

import { ComplianceCheckResult } from '../../types/hvac-polish-compliance.types';

const StyledCard = styled(Card)<{ score: number }>`
  padding: 20px;
  border-left: 4px solid ${({ score }) => 
    score >= 90 ? '#10B981' : 
    score >= 70 ? '#F59E0B' : 
    score >= 50 ? '#F97316' : '#EF4444'};
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const StyledScoreDisplay = styled.div<{ score: number }>`
  text-align: center;
  margin-bottom: 20px;
  
  .score-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: conic-gradient(
      ${({ score }) => 
        score >= 90 ? '#10B981' : 
        score >= 70 ? '#F59E0B' : 
        score >= 50 ? '#F97316' : '#EF4444'} ${({ score }) => score * 3.6}deg,
      ${({ theme }) => theme.background.tertiary} 0deg
    );
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    position: relative;
    
    &::before {
      content: '';
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: ${({ theme }) => theme.background.primary};
      position: absolute;
    }
    
    .score-text {
      position: relative;
      z-index: 1;
      font-size: 24px;
      font-weight: 700;
      color: ${({ theme }) => theme.font.color.primary};
    }
  }
  
  .score-label {
    font-size: 14px;
    color: ${({ theme }) => theme.font.color.tertiary};
    margin-bottom: 8px;
  }
  
  .score-description {
    font-size: 16px;
    font-weight: 600;
    color: ${({ score, theme }) => 
      score >= 90 ? '#10B981' : 
      score >= 70 ? '#F59E0B' : 
      score >= 50 ? '#F97316' : '#EF4444'};
  }
`;

const StyledValidationStatus = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
  
  .validation-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 6px;
    background: ${({ theme }) => theme.background.secondary};
    font-size: 14px;
    
    &.valid {
      color: #10B981;
      background: #ECFDF5;
    }
    
    &.invalid {
      color: #EF4444;
      background: #FEF2F2;
    }
    
    &.missing {
      color: #6B7280;
      background: #F9FAFB;
    }
  }
`;

const StyledRecommendations = styled.div`
  .recommendations-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.font.color.primary};
  }
  
  .recommendations-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .recommendation-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px;
    border-radius: 6px;
    background: ${({ theme }) => theme.background.secondary};
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s ease;
    
    &:hover {
      background: ${({ theme }) => theme.background.tertiary};
    }
    
    .recommendation-icon {
      margin-top: 2px;
      flex-shrink: 0;
    }
    
    .recommendation-text {
      color: ${({ theme }) => theme.font.color.primary};
      line-height: 1.4;
    }
  }
`;

const StyledCertifications = styled.div`
  margin-top: 16px;
  
  .certifications-header {
    font-size: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.font.color.primary};
    margin-bottom: 8px;
  }
  
  .certifications-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .certification-item {
    padding: 4px 8px;
    background: #DBEAFE;
    color: #1E40AF;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
`;

export type HvacComplianceScoreCardProps = {
  complianceCheck: ComplianceCheckResult;
  onRecommendationClick?: (recommendation: string) => void;
};

export const HvacComplianceScoreCard = ({
  complianceCheck,
  onRecommendationClick,
}: HvacComplianceScoreCardProps) => {
  const getScoreDescription = (score: number): string => {
    if (score >= 90) return 'Doskonała zgodność';
    if (score >= 70) return 'Dobra zgodność';
    if (score >= 50) return 'Częściowa zgodność';
    return 'Wymaga poprawy';
  };

  const getValidationIcon = (isValid?: boolean) => {
    if (isValid === true) return <IconCheck size={16} />;
    if (isValid === false) return <IconAlertTriangle size={16} />;
    return <IconCheck size={16} />;
  };

  const getValidationClass = (isValid?: boolean): string => {
    if (isValid === true) return 'valid';
    if (isValid === false) return 'invalid';
    return 'missing';
  };

  const getValidationLabel = (isValid?: boolean, label: string): string => {
    if (isValid === true) return `${label} ✓`;
    if (isValid === false) return `${label} ✗`;
    return `${label} -`;
  };

  const renderValidationStatus = () => (
    <StyledValidationStatus>
      <div className={`validation-item ${getValidationClass(complianceCheck.nip?.isValid)}`}>
        {getValidationIcon(complianceCheck.nip?.isValid)}
        {getValidationLabel(complianceCheck.nip?.isValid, 'NIP')}
      </div>
      <div className={`validation-item ${getValidationClass(complianceCheck.regon?.isValid)}`}>
        {getValidationIcon(complianceCheck.regon?.isValid)}
        {getValidationLabel(complianceCheck.regon?.isValid, 'REGON')}
      </div>
      <div className={`validation-item ${getValidationClass(!!complianceCheck.energyProvider)}`}>
        {getValidationIcon(!!complianceCheck.energyProvider)}
        {getValidationLabel(!!complianceCheck.energyProvider, 'Dostawca energii')}
      </div>
      <div className={`validation-item ${getValidationClass(!!complianceCheck.hvacCertifications?.length)}`}>
        {getValidationIcon(!!complianceCheck.hvacCertifications?.length)}
        {getValidationLabel(!!complianceCheck.hvacCertifications?.length, 'Certyfikaty HVAC')}
      </div>
    </StyledValidationStatus>
  );

  const renderRecommendations = () => (
    <StyledRecommendations>
      <div className="recommendations-header">
        <IconCheck size={16} />
        Rekomendacje
      </div>
      <div className="recommendations-list">
        {complianceCheck.recommendations.map((recommendation, index) => (
          <div
            key={index}
            className="recommendation-item"
            onClick={() => onRecommendationClick?.(recommendation)}
          >
            <div className="recommendation-icon">
              <IconCheck size={14} />
            </div>
            <div className="recommendation-text">
              {recommendation}
            </div>
          </div>
        ))}
      </div>
    </StyledRecommendations>
  );

  const renderCertifications = () => {
    if (!complianceCheck.hvacCertifications?.length) return null;

    return (
      <StyledCertifications>
        <div className="certifications-header">Certyfikaty HVAC:</div>
        <div className="certifications-list">
          {complianceCheck.hvacCertifications.map((cert, index) => (
            <div key={index} className="certification-item">
              {cert}
            </div>
          ))}
        </div>
      </StyledCertifications>
    );
  };

  return (
    <StyledCard score={complianceCheck.complianceScore}>
      <StyledHeader>
        <H4Title title="Ocena zgodności z przepisami" />
      </StyledHeader>

      <StyledScoreDisplay score={complianceCheck.complianceScore}>
        <div className="score-circle">
          <div className="score-text">
            {Math.round(complianceCheck.complianceScore)}%
          </div>
        </div>
        <div className="score-label">Ogólna ocena zgodności</div>
        <div className="score-description">
          {getScoreDescription(complianceCheck.complianceScore)}
        </div>
      </StyledScoreDisplay>

      {renderValidationStatus()}
      {renderRecommendations()}
      {renderCertifications()}
    </StyledCard>
  );
};
