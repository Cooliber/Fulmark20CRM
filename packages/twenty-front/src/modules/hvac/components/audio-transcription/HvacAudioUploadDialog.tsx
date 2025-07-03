import styled from '@emotion/styled';
import React, { useCallback, useRef, useState } from 'react';
import { IconAlertTriangle, IconCheck, IconFile, IconUpload, IconX } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';

const StyledModalContent = styled.div`
  padding: 24px;
  width: 500px;
  max-width: 90vw;
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const StyledUploadArea = styled.div<{ isDragOver: boolean; hasFile: boolean }>`
  border: 2px dashed ${({ theme, isDragOver, hasFile }) => 
    hasFile ? theme.color.green : 
    isDragOver ? theme.accent.primary : theme.border.color.medium};
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  background: ${({ theme, isDragOver }) => 
    isDragOver ? theme.background.transparent.light : theme.background.secondary};
  transition: all 0.2s ease;
  cursor: pointer;
  margin-bottom: 20px;
  
  &:hover {
    border-color: ${({ theme }) => theme.accent.primary};
    background: ${({ theme }) => theme.background.transparent.light};
  }
`;

const StyledUploadIcon = styled.div<{ hasFile: boolean }>`
  margin-bottom: 16px;
  color: ${({ theme, hasFile }) => hasFile ? theme.color.green : theme.font.color.tertiary};
  
  svg {
    width: 48px;
    height: 48px;
  }
`;

const StyledUploadText = styled.div`
  .primary-text {
    font-size: 16px;
    font-weight: 600;
    color: ${({ theme }) => theme.font.color.primary};
    margin-bottom: 8px;
  }
  
  .secondary-text {
    font-size: 14px;
    color: ${({ theme }) => theme.font.color.tertiary};
    margin-bottom: 16px;
  }
  
  .supported-formats {
    font-size: 12px;
    color: ${({ theme }) => theme.font.color.light};
  }
`;

const StyledFileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: ${({ theme }) => theme.background.primary};
  border-radius: 8px;
  margin-bottom: 20px;
  
  .file-icon {
    color: ${({ theme }) => theme.accent.primary};
  }
  
  .file-details {
    flex: 1;
    
    .file-name {
      font-weight: 600;
      color: ${({ theme }) => theme.font.color.primary};
      margin-bottom: 4px;
    }
    
    .file-meta {
      font-size: 12px;
      color: ${({ theme }) => theme.font.color.tertiary};
    }
  }
  
  .remove-button {
    color: ${({ theme }) => theme.font.color.tertiary};
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      background: ${({ theme }) => theme.background.tertiary};
      color: ${({ theme }) => theme.font.color.primary};
    }
  }
`;

const StyledActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const StyledError = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: ${({ theme }) => theme.background.danger};
  border: 1px solid ${({ theme }) => theme.border.color.danger};
  border-radius: 8px;
  margin-bottom: 16px;
  
  .error-icon {
    color: ${({ theme }) => theme.font.color.danger};
  }
  
  .error-text {
    font-size: 14px;
    color: ${({ theme }) => theme.font.color.danger};
  }
`;

export type HvacAudioUploadDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => Promise<void>;
  customerId?: string;
  loading?: boolean;
};

export const HvacAudioUploadDialog = ({
  isOpen,
  onClose,
  onFileUpload,
  customerId,
  loading = false,
}: HvacAudioUploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = ['m4a', 'mp3', 'wav', 'flac', 'aac'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const validateFile = useCallback((file: File): string | null => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension || !supportedFormats.includes(extension)) {
      return `Nieobsługiwany format pliku. Obsługiwane formaty: ${supportedFormats.join(', ')}`;
    }
    
    if (file.size > maxFileSize) {
      return `Plik jest za duży. Maksymalny rozmiar: 50MB`;
    }
    
    return null;
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    setSelectedFile(file);
  }, [validateFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    
    try {
      await onFileUpload(selectedFile);
      setSelectedFile(null);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Błąd podczas przesyłania pliku');
    }
  }, [selectedFile, onFileUpload]);

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const renderUploadArea = () => (
    <StyledUploadArea
      isDragOver={isDragOver}
      hasFile={!!selectedFile}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleUploadClick}
    >
      <StyledUploadIcon hasFile={!!selectedFile}>
        {selectedFile ? <IconCheck /> : <IconUpload />}
      </StyledUploadIcon>
      
      <StyledUploadText>
        <div className="primary-text">
          {selectedFile ? 'Plik gotowy do przesłania' : 'Przeciągnij plik audio lub kliknij, aby wybrać'}
        </div>
        <div className="secondary-text">
          {selectedFile ? selectedFile.name : 'Wybierz plik audio do transkrypcji'}
        </div>
        <div className="supported-formats">
          Obsługiwane formaty: {supportedFormats.join(', ')} (max 50MB)
        </div>
      </StyledUploadText>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={supportedFormats.map(format => `.${format}`).join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
    </StyledUploadArea>
  );

  const renderFileInfo = () => {
    if (!selectedFile) return null;

    return (
      <StyledFileInfo>
        <div className="file-icon">
          <IconFile size={24} />
        </div>
        <div className="file-details">
          <div className="file-name">{selectedFile.name}</div>
          <div className="file-meta">
            {formatFileSize(selectedFile.size)} • {selectedFile.type}
          </div>
        </div>
        <div className="remove-button" onClick={handleRemoveFile}>
          <IconX size={20} />
        </div>
      </StyledFileInfo>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <StyledError>
        <div className="error-icon">
          <IconAlertTriangle size={20} />
        </div>
        <div className="error-text">{error}</div>
      </StyledError>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <StyledModalContent>
        <StyledHeader>
          <H3Title title="Prześlij plik audio" />
          <Button
            Icon={IconX}
            onClick={onClose}
            variant="tertiary"
            size="small"
          />
        </StyledHeader>

        {renderError()}
        {renderUploadArea()}
        {renderFileInfo()}

        <StyledActions>
          <Button
            title="Anuluj"
            onClick={onClose}
            variant="secondary"
            size="medium"
            disabled={loading}
          />
          <Button
            title={loading ? "Przetwarzanie..." : "Prześlij i transkrybuj"}
            onClick={handleUpload}
            variant="primary"
            size="medium"
            disabled={!selectedFile || loading}
          />
        </StyledActions>
      </StyledModalContent>
    </Modal>
  );
};
