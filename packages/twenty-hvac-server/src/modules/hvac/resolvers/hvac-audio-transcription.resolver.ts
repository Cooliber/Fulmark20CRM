import { Injectable, Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { HvacConfigService } from '../../../config/hvac-config/hvac-config.service';
import { HvacPermissionsGuard, RequireHvacRead, RequireHvacWrite } from '../guards/hvac-permissions.guard';
import { HvacAudioTranscriptionService, AudioTranscriptionResult } from '../services/hvac-audio-transcription.service';
import { HVACErrorContext, HvacSentryService } from '../services/hvac-sentry.service';

// GraphQL Input Types
@InputType()
export class HvacAudioTranscriptionInput {
  @Field()
  filePath: string;

  @Field()
  originalFileName: string;

  @Field(() => ID, { nullable: true })
  customerId?: string;

  @Field(() => ID, { nullable: true })
  emailId?: string;

  @Field(() => ID, { nullable: true })
  technicianId?: string;
}

@InputType()
export class HvacTranscriptionSearchInput {
  @Field({ nullable: true })
  customerId?: string;

  @Field({ nullable: true })
  technicianId?: string;

  @Field({ nullable: true })
  dateFrom?: string;

  @Field({ nullable: true })
  dateTo?: string;

  @Field({ nullable: true })
  searchText?: string;

  @Field({ defaultValue: 20 })
  limit?: number;

  @Field({ defaultValue: 0 })
  offset?: number;
}

// GraphQL Object Types
@ObjectType('HvacAudioMetadata')
export class HvacAudioMetadataType {
  @Field(() => ID, { nullable: true })
  customerId?: string;

  @Field(() => ID, { nullable: true })
  emailId?: string;

  @Field(() => ID, { nullable: true })
  technicianId?: string;

  @Field()
  timestamp: string;

  @Field()
  fileSize: number;

  @Field()
  audioFormat: string;

  @Field({ nullable: true })
  sampleRate?: number;

  @Field({ nullable: true })
  channels?: number;
}

@ObjectType('HvacAIInsights')
export class HvacAIInsightsType {
  @Field()
  sentiment: string;

  @Field()
  urgency: string;

  @Field(() => [String])
  keywords: string[];

  @Field()
  summary: string;

  @Field(() => [String])
  actionItems: string[];

  @Field(() => [String])
  customerIssues: string[];
}

@ObjectType('HvacAudioTranscription')
export class HvacAudioTranscriptionType {
  @Field(() => ID)
  id: string;

  @Field()
  originalFileName: string;

  @Field()
  transcriptionText: string;

  @Field()
  confidence: number;

  @Field()
  language: string;

  @Field()
  duration: number;

  @Field()
  processingTime: number;

  @Field()
  status: string;

  @Field(() => HvacAudioMetadataType)
  metadata: HvacAudioMetadataType;

  @Field(() => HvacAIInsightsType, { nullable: true })
  aiInsights?: HvacAIInsightsType;
}

@ObjectType('HvacTranscriptionSearchResponse')
export class HvacTranscriptionSearchResponseType {
  @Field(() => [HvacAudioTranscriptionType])
  transcriptions: HvacAudioTranscriptionType[];

  @Field()
  totalCount: number;

  @Field()
  hasMore: boolean;
}

@Resolver()
@Injectable()
@UseGuards(HvacPermissionsGuard)
export class HvacAudioTranscriptionResolver {
  private readonly logger = new Logger(HvacAudioTranscriptionResolver.name);

  constructor(
    private readonly hvacConfigService: HvacConfigService,
    private readonly audioTranscriptionService: HvacAudioTranscriptionService,
    private readonly sentryService: HvacSentryService,
  ) {}

  /**
   * Process audio file and return transcription with AI insights
   */
  @Mutation(() => HvacAudioTranscriptionType, { name: 'processHvacAudioTranscription' })
  @RequireHvacWrite()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async processAudioTranscription(
    @Args('input') input: HvacAudioTranscriptionInput,
  ): Promise<HvacAudioTranscriptionType> {
    this.checkFeatureEnabled('audioTranscription');

    try {
      this.logger.log(`Processing audio transcription for file: ${input.originalFileName}`);

      const result = await this.audioTranscriptionService.processAudioFile(
        input.filePath,
        {
          customerId: input.customerId,
          emailId: input.emailId,
          technicianId: input.technicianId,
          originalFileName: input.originalFileName,
        },
      );

      return this.mapToGraphQLType(result);

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.TRANSCRIPTION_ANALYSIS,
        {
          fileName: input.originalFileName,
          customerId: input.customerId,
        },
      );

      this.logger.error(`Error processing audio transcription for ${input.originalFileName}:`, error.message, error.stack);
      throw error;
    }
  }

  /**
   * Get transcription by ID
   */
  @Query(() => HvacAudioTranscriptionType, { name: 'hvacAudioTranscription', nullable: true })
  @RequireHvacRead()
  async getAudioTranscription(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<HvacAudioTranscriptionType | null> {
    this.checkFeatureEnabled('audioTranscription');

    try {
      // This would typically fetch from database
      // For now, return null as we don't have persistence layer implemented
      this.logger.log(`Fetching audio transcription with ID: ${id}`);
      return null;

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.TRANSCRIPTION_ANALYSIS,
        { transcriptionId: id },
      );

      this.logger.error(`Error fetching audio transcription ${id}:`, error.message, error.stack);
      throw error;
    }
  }

  /**
   * Search transcriptions with filters
   */
  @Query(() => HvacTranscriptionSearchResponseType, { name: 'searchHvacAudioTranscriptions' })
  @RequireHvacRead()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async searchAudioTranscriptions(
    @Args('input') input: HvacTranscriptionSearchInput,
  ): Promise<HvacTranscriptionSearchResponseType> {
    this.checkFeatureEnabled('audioTranscription');

    try {
      this.logger.log(`Searching audio transcriptions with filters:`, input);

      // This would typically search in database
      // For now, return empty results as we don't have persistence layer implemented
      return {
        transcriptions: [],
        totalCount: 0,
        hasMore: false,
      };

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.TRANSCRIPTION_ANALYSIS,
        { searchInput: input },
      );

      this.logger.error(`Error searching audio transcriptions:`, error.message, error.stack);
      throw error;
    }
  }

  /**
   * Get transcription statistics
   */
  @Query(() => String, { name: 'hvacAudioTranscriptionStats' })
  @RequireHvacRead()
  async getTranscriptionStats(): Promise<string> {
    this.checkFeatureEnabled('audioTranscription');

    try {
      // This would typically return real statistics
      // For now, return basic stats
      const stats = {
        totalTranscriptions: 0,
        successfulTranscriptions: 0,
        failedTranscriptions: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        supportedFormats: ['m4a', 'mp3', 'wav', 'flac'],
        languages: ['pl'],
      };

      return JSON.stringify(stats);

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.TRANSCRIPTION_ANALYSIS,
        {},
      );

      this.logger.error(`Error getting transcription stats:`, error.message, error.stack);
      throw error;
    }
  }

  /**
   * Check if feature is enabled
   */
  private checkFeatureEnabled(feature: string): void {
    if (!this.hvacConfigService.isHvacFeatureEnabled(feature)) {
      throw new Error(`HVAC ${feature} feature is not enabled`);
    }
  }

  /**
   * Map internal result to GraphQL type
   */
  private mapToGraphQLType(result: AudioTranscriptionResult): HvacAudioTranscriptionType {
    return {
      id: result.id,
      originalFileName: result.originalFileName,
      transcriptionText: result.transcriptionText,
      confidence: result.confidence,
      language: result.language,
      duration: result.duration,
      processingTime: result.processingTime,
      status: result.status,
      metadata: {
        customerId: result.metadata.customerId,
        emailId: result.metadata.emailId,
        technicianId: result.metadata.technicianId,
        timestamp: result.metadata.timestamp.toISOString(),
        fileSize: result.metadata.fileSize,
        audioFormat: result.metadata.audioFormat,
        sampleRate: result.metadata.sampleRate,
        channels: result.metadata.channels,
      },
      aiInsights: result.aiInsights ? {
        sentiment: result.aiInsights.sentiment,
        urgency: result.aiInsights.urgency,
        keywords: result.aiInsights.keywords,
        summary: result.aiInsights.summary,
        actionItems: result.aiInsights.actionItems,
        customerIssues: result.aiInsights.customerIssues,
      } : undefined,
    };
  }
}
