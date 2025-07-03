export type AudioTranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type AudioTranscriptionMetadata = {
  customerId?: string;
  emailId?: string;
  technicianId?: string;
  timestamp: string;
  fileSize: number;
  audioFormat: string;
  sampleRate?: number;
  channels?: number;
};

export type AudioAIInsights = {
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  summary: string;
  actionItems: string[];
  customerIssues: string[];
};

export type AudioTranscriptionResult = {
  id: string;
  originalFileName: string;
  transcriptionText: string;
  confidence: number;
  language: string;
  duration: number;
  processingTime: number;
  status: AudioTranscriptionStatus;
  metadata: AudioTranscriptionMetadata;
  aiInsights?: AudioAIInsights;
};

export type AudioTranscriptionStats = {
  totalTranscriptions: number;
  successfulTranscriptions: number;
  failedTranscriptions: number;
  averageConfidence: number;
  averageProcessingTime: number;
  supportedFormats: string[];
  languages: string[];
};

export type AudioTranscriptionSearchFilters = {
  customerId?: string;
  technicianId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchText?: string;
  limit?: number;
  offset?: number;
};

export type AudioTranscriptionSearchResponse = {
  transcriptions: AudioTranscriptionResult[];
  totalCount: number;
  hasMore: boolean;
};

export type ProcessAudioTranscriptionInput = {
  filePath: string;
  originalFileName: string;
  customerId?: string;
  emailId?: string;
  technicianId?: string;
};

// GraphQL response types
export type HvacAudioMetadataType = {
  customerId?: string;
  emailId?: string;
  technicianId?: string;
  timestamp: string;
  fileSize: number;
  audioFormat: string;
  sampleRate?: number;
  channels?: number;
};

export type HvacAIInsightsType = {
  sentiment: string;
  urgency: string;
  keywords: string[];
  summary: string;
  actionItems: string[];
  customerIssues: string[];
};

export type HvacAudioTranscriptionType = {
  id: string;
  originalFileName: string;
  transcriptionText: string;
  confidence: number;
  language: string;
  duration: number;
  processingTime: number;
  status: string;
  metadata: HvacAudioMetadataType;
  aiInsights?: HvacAIInsightsType;
};

export type HvacTranscriptionSearchResponseType = {
  transcriptions: HvacAudioTranscriptionType[];
  totalCount: number;
  hasMore: boolean;
};

// Utility types for component props
export type AudioTranscriptionCardProps = {
  transcription: AudioTranscriptionResult;
  onPlayAudio: (id: string) => void;
  onViewDetails: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export type AudioUploadDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => Promise<void>;
  customerId?: string;
  loading?: boolean;
  maxFileSize?: number;
  supportedFormats?: string[];
};

export type AudioTranscriptionPanelProps = {
  customerId?: string;
  onTranscriptionComplete?: (result: AudioTranscriptionResult) => void;
  onError?: (error: string) => void;
  autoLoad?: boolean;
  showUploadButton?: boolean;
  showRecordButton?: boolean;
};

// Audio recording types
export type AudioRecordingState = {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob?: Blob;
  audioUrl?: string;
};

export type AudioRecorderProps = {
  onRecordingComplete: (audioBlob: Blob) => void;
  onError?: (error: string) => void;
  maxDuration?: number;
  sampleRate?: number;
  channels?: number;
};

// Audio playback types
export type AudioPlayerState = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
};

export type AudioPlayerProps = {
  audioUrl: string;
  autoPlay?: boolean;
  controls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
};

// Email integration types
export type EmailAudioAttachment = {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  audioUrl: string;
  transcriptionId?: string;
  transcriptionStatus?: AudioTranscriptionStatus;
};

export type EmailWithAudioAttachments = {
  id: string;
  subject: string;
  from: string;
  receivedAt: string;
  audioAttachments: EmailAudioAttachment[];
  customerId?: string;
};

// Analytics types
export type AudioTranscriptionAnalytics = {
  totalTranscriptions: number;
  transcriptionsToday: number;
  transcriptionsThisWeek: number;
  transcriptionsThisMonth: number;
  averageConfidence: number;
  averageProcessingTime: number;
  topKeywords: Array<{
    keyword: string;
    count: number;
  }>;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  urgencyDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  languageDistribution: Array<{
    language: string;
    count: number;
  }>;
  formatDistribution: Array<{
    format: string;
    count: number;
  }>;
};

// Error types
export type AudioTranscriptionError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  transcriptionId?: string;
  timestamp: string;
};

// Configuration types
export type AudioTranscriptionConfig = {
  maxFileSize: number;
  supportedFormats: string[];
  maxDuration: number;
  sampleRate: number;
  channels: number;
  language: string;
  confidenceThreshold: number;
  enableAIInsights: boolean;
  enableKeywordExtraction: boolean;
  enableSentimentAnalysis: boolean;
  enableUrgencyDetection: boolean;
};
