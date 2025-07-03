import styled from '@emotion/styled';
import { IconMicrophone } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { H3Title, IconPlayerPause, IconUpload } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { Card } from 'twenty-ui/layout';
import { useHvacAudioTranscription } from '../../hooks/useHvacAudioTranscription';
import { AudioTranscriptionResult } from '../../types/hvac-audio.types';
import { HvacAudioTranscriptionCard } from './HvacAudioTranscriptionCard';
import { HvacAudioUploadDialog } from './HvacAudioUploadDialog';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const StyledActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const StyledTranscriptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  overflow-y: auto;
`;

const StyledEmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: ${({ theme }) => theme.font.color.tertiary};
  
  svg {
    margin-bottom: 16px;
    color: ${({ theme }) => theme.font.color.light};
  }
`;

const StyledStats = styled.div`
  display: flex;
  gap: 20px;
  padding: 16px;
  background: ${({ theme }) => theme.background.secondary};
  border-radius: 8px;
  margin-bottom: 20px;
`;

const StyledStatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: ${({ theme }) => theme.font.color.primary};
  }
  
  .stat-label {
    font-size: 12px;
    color: ${({ theme }) => theme.font.color.tertiary};
    margin-top: 4px;
  }
`;

export type HvacAudioTranscriptionPanelProps = {
  customerId?: string;
  onTranscriptionComplete?: (result: AudioTranscriptionResult) => void;
};

export const HvacAudioTranscriptionPanel = ({
  customerId,
  onTranscriptionComplete,
}: HvacAudioTranscriptionPanelProps) => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const {
    transcriptions,
    loading,
    error,
    stats,
    processAudioFile,
    searchTranscriptions,
    clearError,
  } = useHvacAudioTranscription({
    customerId,
    autoLoad: true,
    onTranscriptionComplete,
  });

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const result = await processAudioFile(file, {
        customerId,
        originalFileName: file.name,
      });
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete(result);
      }
      
      setShowUploadDialog(false);
    } catch (error) {
      console.error('Error processing audio file:', error);
    }
  }, [processAudioFile, customerId, onTranscriptionComplete]);

  const handleStartRecording = useCallback(() => {
    // TODO: Implement live recording functionality
    setIsRecording(true);
  }, []);

  const handleStopRecording = useCallback(() => {
    // TODO: Implement stop recording and process
    setIsRecording(false);
  }, []);

  const renderStats = () => (
    <StyledStats>
      <StyledStatItem>
        <div className="stat-value">{stats?.totalTranscriptions || 0}</div>
        <div className="stat-label">Transkrypcje</div>
      </StyledStatItem>
      <StyledStatItem>
        <div className="stat-value">{stats?.successfulTranscriptions || 0}</div>
        <div className="stat-label">Udane</div>
      </StyledStatItem>
      <StyledStatItem>
        <div className="stat-value">{stats?.averageConfidence ? `${Math.round(stats.averageConfidence * 100)}%` : '0%'}</div>
        <div className="stat-label">Pewność</div>
      </StyledStatItem>
      <StyledStatItem>
        <div className="stat-value">{stats?.averageProcessingTime ? `${Math.round(stats.averageProcessingTime / 1000)}s` : '0s'}</div>
        <div className="stat-label">Czas</div>
      </StyledStatItem>
    </StyledStats>
  );

  const renderEmptyState = () => (
    <StyledEmptyState>
      <IconMicrophone size={48} />
      <H3Title title="Brak transkrypcji audio" />
      <p>Prześlij plik audio M4A lub nagraj nową wiadomość, aby rozpocząć transkrypcję.</p>
      <Button
        title="Prześlij plik audio"
        Icon={IconUpload}
        onClick={() => setShowUploadDialog(true)}
        variant="primary"
        size="medium"
      />
    </StyledEmptyState>
  );

  const renderTranscriptionList = () => (
    <StyledTranscriptionList>
      {transcriptions.map((transcription) => (
        <HvacAudioTranscriptionCard
          key={transcription.id}
          transcription={transcription}
          onPlayAudio={(id) => {
            // TODO: Implement audio playback
            console.log('Play audio:', id);
          }}
          onViewDetails={(id) => {
            // TODO: Implement details view
            console.log('View details:', id);
          }}
        />
      ))}
    </StyledTranscriptionList>
  );

  if (error) {
    return (
      <Card>
        <StyledContainer>
          <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
            <p>Błąd podczas ładowania transkrypcji: {error}</p>
            <Button
              title="Spróbuj ponownie"
              onClick={clearError}
              variant="secondary"
              size="small"
            />
          </div>
        </StyledContainer>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <StyledContainer>
          <StyledHeader>
            <H3Title title="Transkrypcje Audio" />
            <StyledActionButtons>
              <Button
                title={isRecording ? "Zatrzymaj nagrywanie" : "Nagraj audio"}
                Icon={isRecording ? IconPlayerPause : IconMicrophone}
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                variant={isRecording ? "secondary" : "primary"}
                size="small"
                disabled={loading}
              />
              <Button
                title="Prześlij plik"
                Icon={IconUpload}
                onClick={() => setShowUploadDialog(true)}
                variant="secondary"
                size="small"
                disabled={loading}
              />
            </StyledActionButtons>
          </StyledHeader>

          {stats && renderStats()}

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              Ładowanie transkrypcji...
            </div>
          ) : transcriptions.length === 0 ? (
            renderEmptyState()
          ) : (
            renderTranscriptionList()
          )}
        </StyledContainer>
      </Card>

      {showUploadDialog && (
        <HvacAudioUploadDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onFileUpload={handleFileUpload}
          customerId={customerId}
          loading={loading}
        />
      )}
    </>
  );
};
