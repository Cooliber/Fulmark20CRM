import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import { HvacAudioTranscriptionService, AudioTranscriptionResult } from './hvac-audio-transcription.service';
import { HvacCacheManagerService } from './hvac-cache-manager.service';
import { HVACErrorContext, HvacSentryService } from './hvac-sentry.service';
import { HvacWeaviateService, HvacSemanticDocument } from './hvac-weaviate.service';

export type EmailAttachment = {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
  cid?: string;
};

export type ProcessedAttachment = {
  id: string;
  originalFilename: string;
  contentType: string;
  size: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  processingResult?: {
    type: 'audio_transcription' | 'document_analysis' | 'image_analysis';
    data: AudioTranscriptionResult | Record<string, unknown>;
  };
  error?: string;
  processedAt: Date;
};

export type EmailProcessingResult = {
  emailId: string;
  customerId?: string;
  totalAttachments: number;
  processedAttachments: ProcessedAttachment[];
  audioTranscriptions: AudioTranscriptionResult[];
  processingTime: number;
  status: 'completed' | 'partial' | 'failed';
};

@Injectable()
export class HvacEmailAttachmentProcessorService {
  private readonly logger = new Logger(HvacEmailAttachmentProcessorService.name);
  private readonly tempDir: string;
  private readonly supportedAudioFormats = ['.m4a', '.mp3', '.wav', '.flac', '.aac'];
  private readonly supportedDocumentFormats = ['.pdf', '.doc', '.docx', '.txt'];
  private readonly supportedImageFormats = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];

  constructor(
    private readonly configService: ConfigService,
    private readonly audioTranscriptionService: HvacAudioTranscriptionService,
    private readonly cacheService: HvacCacheManagerService,
    private readonly sentryService: HvacSentryService,
    private readonly weaviateService: HvacWeaviateService,
  ) {
    this.tempDir = this.configService.get('HVAC_TEMP_DIR', '/tmp/hvac-attachments');
    this.ensureTempDirectory();
  }

  /**
   * Process all attachments from an email
   */
  async processEmailAttachments(
    emailId: string,
    attachments: EmailAttachment[],
    metadata: {
      customerId?: string;
      fromEmail?: string;
      subject?: string;
      receivedAt?: Date;
    },
  ): Promise<EmailProcessingResult> {
    const startTime = Date.now();
    const processedAttachments: ProcessedAttachment[] = [];
    const audioTranscriptions: AudioTranscriptionResult[] = [];

    try {
      this.logger.log(`Processing ${attachments.length} attachments for email: ${emailId}`);

      // Process each attachment
      for (const attachment of attachments) {
        try {
          const processed = await this.processAttachment(
            attachment,
            emailId,
            metadata.customerId,
          );
          
          processedAttachments.push(processed);

          // Collect audio transcriptions
          if (processed.processingResult?.type === 'audio_transcription') {
            audioTranscriptions.push(processed.processingResult.data as AudioTranscriptionResult);
          }

        } catch (error) {
          this.logger.error(`Error processing attachment ${attachment.filename}:`, error);
          
          processedAttachments.push({
            id: this.generateAttachmentId(),
            originalFilename: attachment.filename,
            contentType: attachment.contentType,
            size: attachment.size,
            processingStatus: 'failed',
            error: error.message,
            processedAt: new Date(),
          });
        }
      }

      // Index email with attachments in Weaviate
      await this.indexEmailWithAttachments(emailId, metadata, processedAttachments, audioTranscriptions);

      const result: EmailProcessingResult = {
        emailId,
        customerId: metadata.customerId,
        totalAttachments: attachments.length,
        processedAttachments,
        audioTranscriptions,
        processingTime: Date.now() - startTime,
        status: this.determineProcessingStatus(processedAttachments),
      };

      this.logger.log(`Email attachment processing completed for: ${emailId}`);
      return result;

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.EMAIL_PROCESSING,
        {
          emailId,
          customerId: metadata.customerId,
          attachmentCount: attachments.length,
        },
      );

      throw error;
    }
  }

  /**
   * Process individual attachment
   */
  private async processAttachment(
    attachment: EmailAttachment,
    emailId: string,
    customerId?: string,
  ): Promise<ProcessedAttachment> {
    const attachmentId = this.generateAttachmentId();
    const fileExtension = path.extname(attachment.filename).toLowerCase();

    // Check if we should process this attachment
    if (!this.shouldProcessAttachment(attachment)) {
      return {
        id: attachmentId,
        originalFilename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.size,
        processingStatus: 'skipped',
        processedAt: new Date(),
      };
    }

    try {
      // Save attachment to temp file
      const tempFilePath = await this.saveAttachmentToTemp(attachment, attachmentId);

      let processingResult: ProcessedAttachment['processingResult'];

      // Process based on file type
      if (this.supportedAudioFormats.includes(fileExtension)) {
        processingResult = await this.processAudioAttachment(
          tempFilePath,
          attachment.filename,
          emailId,
          customerId,
        );
      } else if (this.supportedDocumentFormats.includes(fileExtension)) {
        processingResult = await this.processDocumentAttachment(
          tempFilePath,
          attachment.filename,
          customerId,
        );
      } else if (this.supportedImageFormats.includes(fileExtension)) {
        processingResult = await this.processImageAttachment(
          tempFilePath,
          attachment.filename,
          customerId,
        );
      }

      // Clean up temp file
      await this.cleanupTempFile(tempFilePath);

      return {
        id: attachmentId,
        originalFilename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.size,
        processingStatus: 'completed',
        processingResult,
        processedAt: new Date(),
      };

    } catch (error) {
      this.logger.error(`Error processing attachment ${attachment.filename}:`, error);
      
      return {
        id: attachmentId,
        originalFilename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.size,
        processingStatus: 'failed',
        error: error.message,
        processedAt: new Date(),
      };
    }
  }

  /**
   * Process audio attachment (M4A, MP3, etc.)
   */
  private async processAudioAttachment(
    filePath: string,
    filename: string,
    emailId: string,
    customerId?: string,
  ): Promise<ProcessedAttachment['processingResult']> {
    this.logger.log(`Processing audio attachment: ${filename}`);

    const transcriptionResult = await this.audioTranscriptionService.processAudioFile(
      filePath,
      {
        originalFileName: filename,
        customerId,
        emailId,
      },
    );

    return {
      type: 'audio_transcription',
      data: transcriptionResult,
    };
  }

  /**
   * Process document attachment (PDF, DOC, etc.)
   */
  private async processDocumentAttachment(
    filePath: string,
    filename: string,
    customerId?: string,
  ): Promise<ProcessedAttachment['processingResult']> {
    this.logger.log(`Processing document attachment: ${filename}`);

    // For now, just return basic info
    // In the future, this could extract text, analyze content, etc.
    return {
      type: 'document_analysis',
      data: {
        filename,
        size: fs.statSync(filePath).size,
        processed: true,
        extractedText: '', // Would extract text from document
        summary: '', // Would generate summary
      },
    };
  }

  /**
   * Process image attachment (JPG, PNG, etc.)
   */
  private async processImageAttachment(
    filePath: string,
    filename: string,
    customerId?: string,
  ): Promise<ProcessedAttachment['processingResult']> {
    this.logger.log(`Processing image attachment: ${filename}`);

    // For now, just return basic info
    // In the future, this could use OCR, image analysis, etc.
    return {
      type: 'image_analysis',
      data: {
        filename,
        size: fs.statSync(filePath).size,
        processed: true,
        ocrText: '', // Would extract text from image
        analysis: '', // Would analyze image content
      },
    };
  }

  /**
   * Save attachment to temporary file
   */
  private async saveAttachmentToTemp(
    attachment: EmailAttachment,
    attachmentId: string,
  ): Promise<string> {
    const fileExtension = path.extname(attachment.filename);
    const tempFileName = `${attachmentId}${fileExtension}`;
    const tempFilePath = path.join(this.tempDir, tempFileName);

    await fs.promises.writeFile(tempFilePath, attachment.content);
    return tempFilePath;
  }

  /**
   * Clean up temporary file
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      this.logger.warn(`Failed to cleanup temp file ${filePath}:`, error);
    }
  }

  /**
   * Check if attachment should be processed
   */
  private shouldProcessAttachment(attachment: EmailAttachment): boolean {
    const fileExtension = path.extname(attachment.filename).toLowerCase();
    const allSupportedFormats = [
      ...this.supportedAudioFormats,
      ...this.supportedDocumentFormats,
      ...this.supportedImageFormats,
    ];

    // Check file extension
    if (!allSupportedFormats.includes(fileExtension)) {
      return false;
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (attachment.size > maxSize) {
      return false;
    }

    return true;
  }

  /**
   * Index email with attachments in Weaviate
   */
  private async indexEmailWithAttachments(
    emailId: string,
    metadata: {
      customerId?: string;
      fromEmail?: string;
      subject?: string;
      receivedAt?: Date;
    },
    processedAttachments: ProcessedAttachment[],
    audioTranscriptions: AudioTranscriptionResult[],
  ): Promise<void> {
    try {
      // Create summary of email with attachments
      const attachmentSummary = processedAttachments
        .map(att => `${att.originalFilename} (${att.processingStatus})`)
        .join(', ');

      const transcriptionSummary = audioTranscriptions
        .map(trans => trans.transcriptionText)
        .join(' ');

      const content = [
        `Email: ${metadata.subject || 'No subject'}`,
        `From: ${metadata.fromEmail || 'Unknown'}`,
        `Attachments: ${attachmentSummary}`,
        transcriptionSummary ? `Transcriptions: ${transcriptionSummary}` : '',
      ].filter(Boolean).join('\n');

      const document: HvacSemanticDocument = {
        content,
        title: `Email with Attachments - ${metadata.subject || emailId}`,
        type: 'email',
        metadata: {
          customerId: metadata.customerId,
          timestamp: metadata.receivedAt || new Date(),
          source: 'email_with_attachments',
          emailId,
          attachmentCount: processedAttachments.length,
          audioTranscriptionCount: audioTranscriptions.length,
          fromEmail: metadata.fromEmail,
          subject: metadata.subject,
        },
      };

      await this.weaviateService.indexDocument(document);
      this.logger.log(`Indexed email with attachments in Weaviate: ${emailId}`);

    } catch (error) {
      this.logger.error('Error indexing email with attachments in Weaviate:', error);
    }
  }

  /**
   * Determine overall processing status
   */
  private determineProcessingStatus(
    processedAttachments: ProcessedAttachment[],
  ): 'completed' | 'partial' | 'failed' {
    const completed = processedAttachments.filter(att => att.processingStatus === 'completed').length;
    const failed = processedAttachments.filter(att => att.processingStatus === 'failed').length;
    const total = processedAttachments.length;

    if (completed === total) return 'completed';
    if (completed > 0) return 'partial';
    return 'failed';
  }

  /**
   * Ensure temp directory exists
   */
  private ensureTempDirectory(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Generate unique attachment ID
   */
  private generateAttachmentId(): string {
    return `att_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
}
