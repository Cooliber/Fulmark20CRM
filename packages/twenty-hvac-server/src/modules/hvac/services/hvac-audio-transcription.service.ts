import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

import { HvacCacheManagerService } from './hvac-cache-manager.service';
import { HvacCircuitBreakerService } from './hvac-circuit-breaker.service';
import { HVACErrorContext, HvacSentryService } from './hvac-sentry.service';
import { HvacWeaviateService, HvacSemanticDocument } from './hvac-weaviate.service';

export type AudioTranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type AudioTranscriptionResult = {
  id: string;
  originalFileName: string;
  transcriptionText: string;
  confidence: number;
  language: string;
  duration: number;
  processingTime: number;
  status: AudioTranscriptionStatus;
  metadata: {
    customerId?: string;
    emailId?: string;
    technicianId?: string;
    timestamp: Date;
    fileSize: number;
    audioFormat: string;
    sampleRate?: number;
    channels?: number;
  };
  aiInsights?: {
    sentiment: 'positive' | 'neutral' | 'negative';
    urgency: 'low' | 'medium' | 'high' | 'critical';
    keywords: string[];
    summary: string;
    actionItems: string[];
    customerIssues: string[];
  };
};

export type NvidiaSTTResponse = {
  transcription: string;
  confidence: number;
  duration: number;
  language: string;
  metadata: {
    sampleRate: number;
    channels: number;
    format: string;
  };
};

@Injectable()
export class HvacAudioTranscriptionService {
  private readonly logger = new Logger(HvacAudioTranscriptionService.name);
  private readonly nvidiaSTTConfig: {
    host: string;
    port: number;
    apiKey: string;
    model: string;
    language: string;
    timeout: number;
    maxFileSize: string;
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: HvacCacheManagerService,
    private readonly circuitBreakerService: HvacCircuitBreakerService,
    private readonly sentryService: HvacSentryService,
    private readonly weaviateService: HvacWeaviateService,
  ) {
    this.nvidiaSTTConfig = {
      host: this.configService.get('NVIDIA_NEMO_HOST', '192.168.0.179'),
      port: this.configService.get('NVIDIA_NEMO_PORT', 1234),
      apiKey: this.configService.get('NVIDIA_NEMO_API_KEY', ''),
      model: this.configService.get('NVIDIA_NEMO_MODEL', 'fastconformer_pl'),
      language: this.configService.get('NVIDIA_NEMO_LANGUAGE', 'pl'),
      timeout: this.configService.get('NVIDIA_NEMO_TIMEOUT', 60000),
      maxFileSize: this.configService.get('NVIDIA_NEMO_MAX_FILE_SIZE', '50MB'),
    };
  }

  /**
   * Process M4A audio file and return transcription with AI insights
   */
  async processAudioFile(
    filePath: string,
    metadata: {
      customerId?: string;
      emailId?: string;
      technicianId?: string;
      originalFileName: string;
    },
  ): Promise<AudioTranscriptionResult> {
    const transcriptionId = this.generateTranscriptionId();
    const startTime = Date.now();

    try {
      this.logger.log(`Starting audio transcription for file: ${metadata.originalFileName}`);

      // Validate file
      await this.validateAudioFile(filePath);

      // Check cache first
      const cacheKey = this.generateCacheKey(filePath);
      const cachedResult = await this.cacheService.get<AudioTranscriptionResult>(cacheKey);
      if (cachedResult) {
        this.logger.log(`Returning cached transcription for: ${metadata.originalFileName}`);
        return cachedResult;
      }

      // Process with NVIDIA NeMo STT
      const sttResult = await this.circuitBreakerService.execute(
        'NVIDIA_STT',
        () => this.transcribeWithNvidiaSTT(filePath),
        {
          fallbackFunction: () => this.fallbackTranscription(filePath),
        },
      );

      // Generate AI insights
      const aiInsights = await this.generateAIInsights(
        sttResult.transcription,
        metadata.customerId,
      );

      // Create result
      const result: AudioTranscriptionResult = {
        id: transcriptionId,
        originalFileName: metadata.originalFileName,
        transcriptionText: sttResult.transcription,
        confidence: sttResult.confidence,
        language: sttResult.language,
        duration: sttResult.duration,
        processingTime: Date.now() - startTime,
        status: 'completed',
        metadata: {
          customerId: metadata.customerId,
          emailId: metadata.emailId,
          technicianId: metadata.technicianId,
          timestamp: new Date(),
          fileSize: fs.statSync(filePath).size,
          audioFormat: path.extname(filePath).toLowerCase(),
          sampleRate: sttResult.metadata.sampleRate,
          channels: sttResult.metadata.channels,
        },
        aiInsights,
      };

      // Cache result
      await this.cacheService.set(cacheKey, result, { ttl: 86400 }); // 24 hours

      // Index in Weaviate for semantic search
      await this.indexTranscriptionInWeaviate(result);

      this.logger.log(`Audio transcription completed for: ${metadata.originalFileName}`);
      return result;

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.TRANSCRIPTION_ANALYSIS,
        {
          transcriptionId,
          fileName: metadata.originalFileName,
          customerId: metadata.customerId,
        },
      );

      const failedResult: AudioTranscriptionResult = {
        id: transcriptionId,
        originalFileName: metadata.originalFileName,
        transcriptionText: '',
        confidence: 0,
        language: 'pl',
        duration: 0,
        processingTime: Date.now() - startTime,
        status: 'failed',
        metadata: {
          customerId: metadata.customerId,
          emailId: metadata.emailId,
          technicianId: metadata.technicianId,
          timestamp: new Date(),
          fileSize: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
          audioFormat: path.extname(filePath).toLowerCase(),
        },
      };

      this.logger.error(`Audio transcription failed for: ${metadata.originalFileName}`, error);
      return failedResult;
    }
  }

  /**
   * Transcribe audio using NVIDIA NeMo STT
   */
  private async transcribeWithNvidiaSTT(filePath: string): Promise<NvidiaSTTResponse> {
    const url = `http://${this.nvidiaSTTConfig.host}:${this.nvidiaSTTConfig.port}/v1/transcribe`;
    
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(filePath));
    formData.append('model', this.nvidiaSTTConfig.model);
    formData.append('language', this.nvidiaSTTConfig.language);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.nvidiaSTTConfig.apiKey}`,
        ...formData.getHeaders(),
      },
      body: formData,
      signal: AbortSignal.timeout(this.nvidiaSTTConfig.timeout),
    });

    if (!response.ok) {
      throw new Error(`NVIDIA STT API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return {
      transcription: result.text || '',
      confidence: result.confidence || 0.8,
      duration: result.duration || 0,
      language: result.language || 'pl',
      metadata: {
        sampleRate: result.metadata?.sample_rate || 16000,
        channels: result.metadata?.channels || 1,
        format: result.metadata?.format || 'm4a',
      },
    };
  }

  /**
   * Fallback transcription when NVIDIA STT is unavailable
   */
  private async fallbackTranscription(filePath: string): Promise<NvidiaSTTResponse> {
    this.logger.warn(`Using fallback transcription for: ${filePath}`);
    
    return {
      transcription: '[Transkrypcja niedostępna - serwis STT offline]',
      confidence: 0.1,
      duration: 0,
      language: 'pl',
      metadata: {
        sampleRate: 16000,
        channels: 1,
        format: 'm4a',
      },
    };
  }

  /**
   * Generate AI insights from transcription text
   */
  private async generateAIInsights(
    transcriptionText: string,
    customerId?: string,
  ): Promise<AudioTranscriptionResult['aiInsights']> {
    if (!transcriptionText || transcriptionText.length < 10) {
      return undefined;
    }

    try {
      // Simple keyword extraction and sentiment analysis
      const keywords = this.extractKeywords(transcriptionText);
      const sentiment = this.analyzeSentiment(transcriptionText);
      const urgency = this.analyzeUrgency(transcriptionText);
      const summary = this.generateSummary(transcriptionText);
      const actionItems = this.extractActionItems(transcriptionText);
      const customerIssues = this.extractCustomerIssues(transcriptionText);

      return {
        sentiment,
        urgency,
        keywords,
        summary,
        actionItems,
        customerIssues,
      };
    } catch (error) {
      this.logger.error('Error generating AI insights:', error);
      return undefined;
    }
  }

  /**
   * Validate audio file before processing
   */
  private async validateAudioFile(filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    const maxSize = this.parseFileSize(this.nvidiaSTTConfig.maxFileSize);
    
    if (stats.size > maxSize) {
      throw new Error(`Audio file too large: ${stats.size} bytes (max: ${maxSize} bytes)`);
    }

    const ext = path.extname(filePath).toLowerCase();
    const supportedFormats = ['.m4a', '.mp3', '.wav', '.flac'];
    
    if (!supportedFormats.includes(ext)) {
      throw new Error(`Unsupported audio format: ${ext}`);
    }
  }

  /**
   * Index transcription in Weaviate for semantic search
   */
  private async indexTranscriptionInWeaviate(result: AudioTranscriptionResult): Promise<void> {
    try {
      const document: HvacSemanticDocument = {
        content: result.transcriptionText,
        title: `Audio Transcription - ${result.originalFileName}`,
        type: 'transcription',
        metadata: {
          customerId: result.metadata.customerId,
          technicianId: result.metadata.technicianId,
          timestamp: result.metadata.timestamp,
          source: 'audio_transcription',
          language: result.language,
          confidence: result.confidence,
          duration: result.duration,
          audioFormat: result.metadata.audioFormat,
          transcriptionId: result.id,
        },
      };

      await this.weaviateService.indexDocument(document);
      this.logger.log(`Indexed transcription in Weaviate: ${result.id}`);
    } catch (error) {
      this.logger.error('Error indexing transcription in Weaviate:', error);
    }
  }

  // Helper methods
  private generateTranscriptionId(): string {
    return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(filePath: string): string {
    const stats = fs.statSync(filePath);
    return `audio_transcription_${path.basename(filePath)}_${stats.size}_${stats.mtime.getTime()}`;
  }

  private parseFileSize(sizeStr: string): number {
    const units = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (!match) return 50 * 1024 * 1024; // Default 50MB
    return parseFloat(match[1]) * units[match[2].toUpperCase() as keyof typeof units];
  }

  private extractKeywords(text: string): string[] {
    const hvacKeywords = [
      'klimatyzacja', 'wentylacja', 'ogrzewanie', 'chłodzenie', 'serwis', 'naprawa',
      'montaż', 'konserwacja', 'filtr', 'pompa', 'sprężarka', 'awaria', 'usterka',
      'temperatura', 'wilgotność', 'wydajność', 'efektywność', 'LG', 'Daikin',
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    return hvacKeywords.filter(keyword => 
      words.some(word => word.includes(keyword))
    );
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['dobrze', 'świetnie', 'zadowolony', 'działa', 'sprawnie'];
    const negativeWords = ['źle', 'awaria', 'problem', 'usterka', 'nie działa', 'zepsuty'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  private analyzeUrgency(text: string): 'low' | 'medium' | 'high' | 'critical' {
    const urgentWords = ['pilne', 'natychmiast', 'awaria', 'krytyczne', 'nie działa'];
    const lowerText = text.toLowerCase();
    
    const urgentCount = urgentWords.filter(word => lowerText.includes(word)).length;
    
    if (urgentCount >= 2) return 'critical';
    if (urgentCount === 1) return 'high';
    if (lowerText.includes('szybko') || lowerText.includes('wcześnie')) return 'medium';
    return 'low';
  }

  private generateSummary(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 2).join('. ').trim() + (sentences.length > 2 ? '...' : '');
  }

  private extractActionItems(text: string): string[] {
    const actionWords = ['sprawdź', 'wymień', 'napraw', 'zainstaluj', 'skontaktuj'];
    const sentences = text.split(/[.!?]+/);
    
    return sentences
      .filter(sentence => 
        actionWords.some(action => sentence.toLowerCase().includes(action))
      )
      .map(sentence => sentence.trim())
      .slice(0, 3);
  }

  private extractCustomerIssues(text: string): string[] {
    const issueWords = ['problem', 'usterka', 'awaria', 'nie działa', 'hałas', 'przeciek'];
    const sentences = text.split(/[.!?]+/);
    
    return sentences
      .filter(sentence => 
        issueWords.some(issue => sentence.toLowerCase().includes(issue))
      )
      .map(sentence => sentence.trim())
      .slice(0, 3);
  }
}
