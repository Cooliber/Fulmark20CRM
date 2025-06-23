import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { HvacApiIntegrationService, HvacSearchQuery, HvacSearchResult } from '../services/hvac-api-integration.service';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';
import { HvacWeaviateService, HvacSemanticSearchQuery } from '../services/hvac-weaviate.service';
import { HvacDataSyncService } from '../services/hvac-data-sync.service';

// GraphQL Types
import { ObjectType, Field, InputType, Int } from '@nestjs/graphql';

@ObjectType()
export class HvacSearchResultType {
  @Field()
  id: string;

  @Field()
  type: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  relevanceScore: number;

  @Field()
  metadata: string; // JSON string of metadata
}

@InputType()
export class HvacSearchFiltersInput {
  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  customerId?: string;

  @Field({ nullable: true })
  equipmentId?: string;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;
}

@InputType()
export class HvacSemanticSearchInput {
  @Field()
  query: string;

  @Field(() => HvacSearchFiltersInput, { nullable: true })
  filters?: HvacSearchFiltersInput;

  @Field(() => Int, { defaultValue: 20 })
  limit?: number;

  @Field(() => Int, { defaultValue: 0 })
  offset?: number;
}

@ObjectType()
export class HvacSemanticSearchResponse {
  @Field(() => [HvacSearchResultType])
  results: HvacSearchResultType[];

  @Field(() => Int)
  totalCount: number;

  @Field()
  query: string;

  @Field()
  executionTime: number; // in milliseconds

  @Field()
  source: string; // 'weaviate' or 'hvac_api'
}

@ObjectType()
export class HvacSyncStatusType {
  @Field()
  lastSync: Date;

  @Field(() => Int)
  totalSynced: number;

  @Field(() => [String])
  errors: string[];

  @Field()
  isRunning: boolean;
}

@ObjectType()
export class HvacSemanticStatsType {
  @Field(() => Int)
  totalDocuments: number;

  @Field()
  lastSync: Date;

  @Field(() => Int)
  totalSynced: number;

  @Field(() => Int)
  errors: number;

  @Field()
  isRunning: boolean;

  @Field()
  weaviateHealth: boolean;

  @Field()
  hvacApiHealth: boolean;
}

@Resolver()
@Injectable()
@UseGuards(WorkspaceAuthGuard)
export class HvacSemanticSearchResolver {
  constructor(
    private readonly hvacApiService: HvacApiIntegrationService,
    private readonly hvacConfigService: HvacConfigService,
    private readonly weaviateService: HvacWeaviateService,
    private readonly dataSyncService: HvacDataSyncService,
  ) {}

  @Query(() => HvacSemanticSearchResponse, { name: 'hvacSemanticSearch' })
  async performHvacSemanticSearch(
    @Args('input') input: HvacSemanticSearchInput,
    @Args('useWeaviate', { defaultValue: true }) useWeaviate: boolean,
  ): Promise<HvacSemanticSearchResponse> {
    // Check if semantic search feature is enabled
    if (!this.hvacConfigService.isHvacFeatureEnabled('semanticSearch')) {
      throw new Error('HVAC semantic search feature is not enabled');
    }

    const startTime = Date.now();

    let results: HvacSearchResultType[] = [];
    let source = 'hvac_api';

    if (useWeaviate) {
      try {
        // Use Weaviate for semantic search
        const weaviateQuery: HvacSemanticSearchQuery = {
          query: input.query,
          limit: input.limit || 20,
          certainty: 0.7, // Minimum certainty threshold
        };

        // Add filters
        if (input.filters?.type) {
          weaviateQuery.type = [input.filters.type];
        }
        if (input.filters?.customerId) {
          weaviateQuery.customerId = input.filters.customerId;
        }
        if (input.filters?.equipmentId) {
          weaviateQuery.equipmentId = input.filters.equipmentId;
        }

        const weaviateResults = await this.weaviateService.searchDocuments(weaviateQuery);

        results = weaviateResults.map(result => ({
          id: result.id,
          type: result.type,
          title: result.title,
          description: result.content.substring(0, 200) + '...',
          relevanceScore: result.score,
          metadata: JSON.stringify(result.metadata),
        }));

        source = 'weaviate';
      } catch (error) {
        // Fallback to HVAC API if Weaviate fails
        console.warn('Weaviate search failed, falling back to HVAC API:', error);
        useWeaviate = false;
      }
    }

    if (!useWeaviate) {
      // Fallback to HVAC API search
      const searchQuery: HvacSearchQuery = {
        query: input.query,
        limit: input.limit || 20,
        offset: input.offset || 0,
      };

      // Add filters if provided
      if (input.filters) {
        searchQuery.filters = {
          type: input.filters.type,
          customerId: input.filters.customerId,
          equipmentId: input.filters.equipmentId,
        };

        if (input.filters.startDate && input.filters.endDate) {
          searchQuery.filters.dateRange = {
            start: input.filters.startDate,
            end: input.filters.endDate,
          };
        }
      }

      const searchResults = await this.hvacApiService.performSemanticSearch(searchQuery);
      results = searchResults.map(this.mapToGraphQLType);
    }

    const executionTime = Date.now() - startTime;

    return {
      results,
      totalCount: results.length,
      query: input.query,
      executionTime,
      source,
    };
  }

  @Query(() => [String], { name: 'hvacSearchSuggestions' })
  async getHvacSearchSuggestions(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
  ): Promise<string[]> {
    // Check if semantic search feature is enabled
    if (!this.hvacConfigService.isHvacFeatureEnabled('semanticSearch')) {
      throw new Error('HVAC semantic search feature is not enabled');
    }

    // This would typically call a suggestions endpoint on your HVAC API
    // For now, we'll return some common HVAC search suggestions
    const commonSuggestions = [
      'boiler maintenance',
      'air conditioning repair',
      'heating system installation',
      'ventilation cleaning',
      'thermostat replacement',
      'emergency HVAC service',
      'annual maintenance contract',
      'energy efficiency audit',
    ];

    return commonSuggestions
      .filter(suggestion => suggestion.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit);
  }

  @Query(() => HvacSemanticStatsType, { name: 'hvacSemanticSearchStats' })
  async getHvacSemanticSearchStats(): Promise<HvacSemanticStatsType> {
    if (!this.hvacConfigService.isHvacFeatureEnabled('semanticSearch')) {
      throw new Error('HVAC semantic search feature is not enabled');
    }

    const stats = await this.dataSyncService.getSemanticSearchStats();

    return {
      totalDocuments: stats.totalDocuments,
      lastSync: stats.lastSync,
      totalSynced: stats.totalSynced,
      errors: stats.errors,
      isRunning: stats.isRunning,
      weaviateHealth: stats.services.weaviate,
      hvacApiHealth: stats.services.hvacApi,
    };
  }

  @Query(() => HvacSyncStatusType, { name: 'hvacSyncStatus' })
  async getHvacSyncStatus(): Promise<HvacSyncStatusType> {
    const status = this.dataSyncService.getSyncStatus();

    return {
      lastSync: status.lastSync,
      totalSynced: status.totalSynced,
      errors: status.errors,
      isRunning: status.isRunning,
    };
  }

  @Mutation(() => Boolean, { name: 'triggerHvacDataSync' })
  async triggerHvacDataSync(): Promise<boolean> {
    if (!this.hvacConfigService.isHvacFeatureEnabled('semanticSearch')) {
      throw new Error('HVAC semantic search feature is not enabled');
    }

    try {
      await this.dataSyncService.performFullSync();
      return true;
    } catch (error) {
      throw new Error(`Failed to trigger data sync: ${error.message}`);
    }
  }

  @Mutation(() => String, { name: 'addHvacDocument' })
  async addHvacDocument(
    @Args('type') type: string,
    @Args('content') content: string,
    @Args('title') title: string,
    @Args('metadata') metadata: string,
  ): Promise<string> {
    if (!this.hvacConfigService.isHvacFeatureEnabled('semanticSearch')) {
      throw new Error('HVAC semantic search feature is not enabled');
    }

    try {
      const parsedMetadata = JSON.parse(metadata);
      const documentId = await this.dataSyncService.syncSingleDocument(
        type,
        title,
        content,
        { title, ...parsedMetadata }
      );
      return documentId;
    } catch (error) {
      throw new Error(`Failed to add document: ${error.message}`);
    }
  }

  private mapToGraphQLType(result: HvacSearchResult): HvacSearchResultType {
    return {
      id: result.id,
      type: result.type,
      title: result.title,
      description: result.description,
      relevanceScore: result.relevanceScore,
      metadata: JSON.stringify(result.metadata),
    };
  }
}
