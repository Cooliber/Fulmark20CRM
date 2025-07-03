/**
 * HVAC Audio Transcription Types
 * "Pasja rodzi profesjonalizm" - Professional audio processing for HVAC
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript without 'any' types
 * - Comprehensive type definitions
 */

// Audio file types supported
export type AudioFileType = 
  | 'audio/wav' 
  | 'audio/mp3' 
  | 'audio/m4a' 
  | 'audio/ogg' 
  | 'audio/webm';

// Audio quality levels
export type AudioQuality = 'low' | 'medium' | 'high' | 'lossless';

// Transcription languages supported (Polish market focus)
export type TranscriptionLanguage = 'pl-PL' | 'en-US' | 'de-DE' | 'cs-CZ' | 'sk-SK';

// Transcription confidence levels
export type ConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

// Audio source types in HVAC context
export type AudioSourceType = 
  | 'phone_call' 
  | 'voice_memo' 
  | 'field_recording' 
  | 'customer_interview' 
  | 'technician_report' 
  | 'equipment_sound';

// Base audio file interface
export interface AudioFile {
  id: string;
  filename: string;
  fileType: AudioFileType;
  fileSize: number; // in bytes
  duration: number; // in seconds
  quality: AudioQuality;
  uploadedAt: Date;
  uploadedBy: string;
  sourceType: AudioSourceType;
  metadata?: AudioMetadata;
}

// Audio metadata
export interface AudioMetadata {
  sampleRate?: number;
  bitRate?: number;
  channels?: number;
  codec?: string;
  recordedAt?: Date;
  recordedBy?: string;
  location?: string;
  equipment?: string;
  customerId?: string;
  serviceTicketId?: string;
}

// Transcription request
export interface TranscriptionRequest {
  audioFileId: string;
  language: TranscriptionLanguage;
  enablePunctuation: boolean;
  enableSpeakerDiarization: boolean;
  customVocabulary?: string[];
  hvacTermsEnabled: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// Transcription result
export interface TranscriptionResult {
  id: string;
  audioFileId: string;
  text: string;
  confidence: number; // 0-1
  language: TranscriptionLanguage;
  processingTime: number; // in milliseconds
  createdAt: Date;
  segments?: TranscriptionSegment[];
  speakers?: SpeakerInfo[];
  hvacTerms?: HvacTermExtraction[];
  summary?: string;
  actionItems?: string[];
}

// Transcription segment (for detailed analysis)
export interface TranscriptionSegment {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
  confidence: number;
  speakerId?: string;
  isHvacRelated: boolean;
  detectedTerms?: string[];
}

// Speaker information (for multi-speaker scenarios)
export interface SpeakerInfo {
  id: string;
  label: string; // e.g., "Speaker 1", "Customer", "Technician"
  role?: 'customer' | 'technician' | 'manager' | 'unknown';
  segments: string[]; // segment IDs
  totalSpeakingTime: number; // in seconds
}

// HVAC-specific term extraction
export interface HvacTermExtraction {
  term: string;
  category: HvacTermCategory;
  confidence: number;
  context: string;
  timestamp: number; // when in audio
  relevanceScore: number;
}

// HVAC term categories
export type HvacTermCategory = 
  | 'equipment' 
  | 'problem' 
  | 'solution' 
  | 'part' 
  | 'measurement' 
  | 'brand' 
  | 'model' 
  | 'location' 
  | 'action';

// Audio processing status
export type AudioProcessingStatus = 
  | 'uploaded' 
  | 'queued' 
  | 'processing' 
  | 'transcribing' 
  | 'analyzing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

// Audio processing job
export interface AudioProcessingJob {
  id: string;
  audioFileId: string;
  status: AudioProcessingStatus;
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  estimatedTimeRemaining?: number; // in seconds
  transcriptionId?: string;
}

// Audio search capabilities
export interface AudioSearchQuery {
  text?: string;
  speaker?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  sourceType?: AudioSourceType;
  customerId?: string;
  serviceTicketId?: string;
  hvacTerms?: string[];
  confidenceThreshold?: number;
}

// Audio search result
export interface AudioSearchResult {
  audioFile: AudioFile;
  transcription: TranscriptionResult;
  matchedSegments: TranscriptionSegment[];
  relevanceScore: number;
  highlightedText: string;
}

// Audio analytics
export interface AudioAnalytics {
  totalFiles: number;
  totalDuration: number; // in seconds
  averageConfidence: number;
  languageDistribution: Record<TranscriptionLanguage, number>;
  sourceTypeDistribution: Record<AudioSourceType, number>;
  topHvacTerms: Array<{
    term: string;
    frequency: number;
    category: HvacTermCategory;
  }>;
  processingStats: {
    averageProcessingTime: number;
    successRate: number;
    errorRate: number;
  };
}

// Audio configuration
export interface AudioConfig {
  maxFileSize: number; // in bytes
  supportedFormats: AudioFileType[];
  defaultLanguage: TranscriptionLanguage;
  enableAutoLanguageDetection: boolean;
  retentionPeriod: number; // in days
  enableHvacTermExtraction: boolean;
  customVocabulary: string[];
  qualityThreshold: number; // minimum confidence
}

// Export all types for easy importing
export type {
  AudioFile,
  AudioMetadata,
  TranscriptionRequest,
  TranscriptionResult,
  TranscriptionSegment,
  SpeakerInfo,
  HvacTermExtraction,
  AudioProcessingJob,
  AudioSearchQuery,
  AudioSearchResult,
  AudioAnalytics,
  AudioConfig,
};
