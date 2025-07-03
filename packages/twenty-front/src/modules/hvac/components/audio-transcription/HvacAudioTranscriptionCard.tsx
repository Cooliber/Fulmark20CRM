import styled from '@emotion/styled';
// Replaced @tabler/icons-react with twenty-ui/display for bundle optimization
import { IconCalendar, IconEye, IconPlayerPlay, IconMicrophone } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { AudioTranscriptionResult } from '../../types/hvac-audio.types';

const StyledCard = styled(Card)`
  padding: 20px;
  margin-bottom: 16px;
  border-left: 4px solid ${({ theme }) => theme.accent.primary};
  
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

const StyledFileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  .filename {
    font-weight: 600;
    color: ${({ theme }) => theme.font.color.primary};
    font-size: 16px;
  }
  
  .metadata {
    display: flex;
    gap: 12px;
    align-items: center;
    font-size: 12px;
    color: ${({ theme }) => theme.font.color.tertiary};
    
    .metadata-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
`;

const StyledActions = styled.div`
  display: flex;
  gap: 8px;
`;

const StyledTranscriptionText = styled.div`
  background: ${({ theme }) => theme.background.secondary};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.font.color.primary};
  max-height: 120px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.background.tertiary};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border.color.medium};
    border-radius: 2px;
  }
`;

const StyledInsights = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

const StyledConfidenceBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  
  .confidence-label {
    font-size: 12px;
    color: ${({ theme }) => theme.font.color.tertiary};
    min-width: 60px;
  }
  
  .confidence-bar {
    flex: 1;
    height: 6px;
    background: ${({ theme }) => theme.background.tertiary};
    border-radius: 3px;
    overflow: hidden;
    
    .confidence-fill {
      height: 100%;
      background: ${({ confidence }: { confidence: number }) => 
        confidence > 0.8 ? '#10B981' : 
        confidence > 0.6 ? '#F59E0B' : '#EF4444'};
      transition: width 0.3s ease;
    }
  }
  
  .confidence-value {
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.font.color.primary};
    min-width: 40px;
    text-align: right;
  }
`;

const StyledKeywords = styled.div`
  margin-top: 12px;
  
  .keywords-label {
    font-size: 12px;
    color: ${({ theme }) => theme.font.color.tertiary};
    margin-bottom: 8px;
  }
  
  .keywords-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
`;

export type HvacAudioTranscriptionCardProps = {
  transcription: AudioTranscriptionResult;
  onPlayAudio: (id: string) => void;
  onViewDetails: (id: string) => void;
};

export const HvacAudioTranscriptionCard = ({
  transcription,
  onPlayAudio,
  onViewDetails,
}: HvacAudioTranscriptionCardProps) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive': return '#10B981';
      case 'negative': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const renderConfidenceBar = () => (
    <StyledConfidenceBar confidence={transcription.confidence}>
      <div className="confidence-label">Pewność:</div>
      <div className="confidence-bar">
        <div 
          className="confidence-fill" 
          style={{ width: `${transcription.confidence * 100}%` }}
        />
      </div>
      <div className="confidence-value">
        {Math.round(transcription.confidence * 100)}%
      </div>
    </StyledConfidenceBar>
  );

  const renderInsights = () => {
    if (!transcription.aiInsights) return null;

    const { sentiment, urgency, summary } = transcription.aiInsights;

    return (
      <StyledInsights>
        <Chip
          label={`Nastrój: ${sentiment}`}
          color={getSentimentColor(sentiment)}
          size="small"
        />
        <Chip
          label={`Pilność: ${urgency}`}
          color={getUrgencyColor(urgency)}
          size="small"
        />
        {summary && (
          <div style={{ 
            fontSize: '12px', 
            color: '#6B7280', 
            fontStyle: 'italic',
            marginTop: '4px',
            width: '100%'
          }}>
            {summary}
          </div>
        )}
      </StyledInsights>
    );
  };

  const renderKeywords = () => {
    if (!transcription.aiInsights?.keywords?.length) return null;

    return (
      <StyledKeywords>
        <div className="keywords-label">Słowa kluczowe:</div>
        <div className="keywords-list">
          {transcription.aiInsights.keywords.map((keyword, index) => (
            <Chip
              key={index}
              label={keyword}
              color="#E5E7EB"
              size="small"
            />
          ))}
        </div>
      </StyledKeywords>
    );
  };

  return (
    <StyledCard>
      <StyledHeader>
        <StyledFileInfo>
          <div className="filename">{transcription.originalFileName}</div>
          <div className="metadata">
            <div className="metadata-item">
              <IconCalendar size={12} />
              {formatDuration(transcription.duration)}
            </div>
            <div className="metadata-item">
              <IconMicrophone size={12} />
              {formatFileSize(transcription.metadata.fileSize)}
            </div>
            <div className="metadata-item">
              <IconEye size={12} />
              {transcription.processingTime}ms
            </div>
          </div>
        </StyledFileInfo>
        
        <StyledActions>
          <Button
            title="Odtwórz"
            Icon={IconPlayerPlay}
            onClick={() => onPlayAudio(transcription.id)}
            variant="secondary"
            size="small"
          />
          <Button
            title="Szczegóły"
            Icon={IconEye}
            onClick={() => onViewDetails(transcription.id)}
            variant="secondary"
            size="small"
          />
        </StyledActions>
      </StyledHeader>

      {renderConfidenceBar()}

      <StyledTranscriptionText>
        {transcription.transcriptionText || 'Brak transkrypcji'}
      </StyledTranscriptionText>

      {renderInsights()}
      {renderKeywords()}
    </StyledCard>
  );
};
