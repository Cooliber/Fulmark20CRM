import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { Injectable, UseGuards, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';
import { HvacApiIntegrationService } from '../services/hvac-api-integration.service';
import {
  HvacCommunicationType,
  HvacCommunicationListResponse,
  HvacCommunicationStatsType,
  HvacAIInsightsType,
  HvacCommunicationStatusEnum, // For the update status mutation
} from '../graphql-types/hvac-communication.types';
import {
  HvacCommunicationFilterInput,
  CreateHvacCommunicationInput,
} from '../graphql-types/hvac-communication.types'; // Re-using the same file

@Resolver(() => HvacCommunicationType)
@Injectable()
@UseGuards(WorkspaceAuthGuard)
export class HvacCommunicationResolver {
  private readonly logger = new Logger(HvacCommunicationResolver.name);

  constructor(
    private readonly hvacConfigService: HvacConfigService,
    private readonly hvacApiService: HvacApiIntegrationService,
  ) {}

  private checkFeatureEnabled(feature: keyof ReturnType<HvacConfigService['getHvacFeatureFlags']>) {
    // Assuming 'customer360' or a more specific 'communicationManagement' flag
    const featureToCheck = feature || 'customer360';
    if (!this.hvacConfigService.isHvacFeatureEnabled(featureToCheck)) {
      const errorMessage = `HVAC feature '${featureToCheck}' is not enabled.`;
      this.logger.warn(errorMessage);
      throw new Error(errorMessage); // Consider ForbiddenException
    }
  }

  @Query(() => HvacCommunicationListResponse, { name: 'hvacCommunications' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getHvacCommunications(
    @Args('filters', { type: () => HvacCommunicationFilterInput, nullable: true }) filters?: HvacCommunicationFilterInput,
    @Args('page', { type: () => Int, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit?: number,
  ): Promise<HvacCommunicationListResponse> {
    this.checkFeatureEnabled('customer360'); // Replace with a more specific flag if available
    try {
      this.logger.debug(`Fetching HVAC communications with filters: ${JSON.stringify(filters)}, page: ${page}, limit: ${limit}`);
      // Placeholder: HvacApiIntegrationService needs a method for this
      this.logger.warn(`getCommunications not yet implemented in HvacApiIntegrationService. Returning empty response.`);
      return { communications: [], total: 0 };
      // const result = await this.hvacApiService.getCommunications(filters, page, limit);
      // return result;
    } catch (error) {
      this.logger.error('Error fetching HVAC communications:', error.message, error.stack);
      throw error;
    }
  }

  @Query(() => HvacCommunicationType, { name: 'hvacCommunication', nullable: true })
  async getHvacCommunicationById(@Args('id', { type: () => ID }) id: string): Promise<HvacCommunicationType | null> {
    this.checkFeatureEnabled('customer360');
    try {
      this.logger.debug(`Fetching HVAC communication by ID: ${id}`);
      // Placeholder
      this.logger.warn(`getCommunicationById not yet implemented in HvacApiIntegrationService. Returning null for ID: ${id}.`);
      return null;
      // const communication = await this.hvacApiService.getCommunicationById(id);
      // return communication;
    } catch (error) {
      this.logger.error(`Error fetching HVAC communication by ID ${id}:`, error.message, error.stack);
      throw error;
    }
  }

  @Query(() => HvacCommunicationStatsType, { name: 'hvacCommunicationStats', nullable: true })
  async getHvacCommunicationStats(
    @Args('customerId', { type: () => ID }) customerId: string,
  ): Promise<HvacCommunicationStatsType | null> {
    this.checkFeatureEnabled('aiInsights'); // Or customer360
    try {
      this.logger.debug(`Fetching HVAC communication stats for customer ID: ${customerId}`);
      // Placeholder
      this.logger.warn(`getCommunicationStats not yet implemented in HvacApiIntegrationService. Returning null for customer: ${customerId}.`);
      return null;
      // const stats = await this.hvacApiService.getCommunicationStats(customerId);
      // return stats;
    } catch (error) {
      this.logger.error(`Error fetching HVAC communication stats for customer ${customerId}:`, error.message, error.stack);
      throw error;
    }
  }

  @Query(() => [HvacCommunicationType], { name: 'hvacCommunicationTimeline', nullable: 'itemsAndList' })
  async getHvacCommunicationTimeline(
    @Args('customerId', { type: () => ID }) customerId: string,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit?: number,
  ): Promise<HvacCommunicationType[] | null> {
    this.checkFeatureEnabled('customer360');
    try {
      this.logger.debug(`Fetching HVAC communication timeline for customer ID: ${customerId}, limit: ${limit}`);
      // Placeholder
      this.logger.warn(`getCommunicationTimeline not yet implemented in HvacApiIntegrationService. Returning empty array for customer: ${customerId}.`);
      return [];
      // const timeline = await this.hvacApiService.getCommunicationTimeline(customerId, limit);
      // return timeline;
    } catch (error) {
      this.logger.error(`Error fetching HVAC communication timeline for customer ${customerId}:`, error.message, error.stack);
      throw error;
    }
  }

  @Query(() => [HvacCommunicationType], { name: 'searchHvacCommunications', nullable: 'itemsAndList' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async searchHvacCommunications(
    @Args('query') query: string,
    @Args('customerId', { type: () => ID, nullable: true }) customerId?: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit?: number,
  ): Promise<HvacCommunicationType[] | null> {
    this.checkFeatureEnabled('semanticSearch');
    try {
      this.logger.debug(`Searching HVAC communications with query: "${query}", customerId: ${customerId}, limit: ${limit}`);
      // Placeholder
      this.logger.warn(`searchCommunications not yet implemented in HvacApiIntegrationService. Returning empty array.`);
      return [];
      // const results = await this.hvacApiService.searchCommunications(query, customerId, limit);
      // return results;
    } catch (error) {
      this.logger.error(`Error searching HVAC communications with query "${query}":`, error.message, error.stack);
      throw error;
    }
  }

  @Mutation(() => HvacCommunicationType, { name: 'createHvacCommunication' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createHvacCommunication(
    @Args('input') input: CreateHvacCommunicationInput,
  ): Promise<HvacCommunicationType> {
    this.checkFeatureEnabled('customer360'); // Or a specific communication creation flag
    try {
      this.logger.log(`Attempting to create HVAC communication: ${JSON.stringify(input)}`);
      // Placeholder
      this.logger.warn(`createCommunication not yet fully implemented in HvacApiIntegrationService or resolver. Using placeholder logic.`);
      const placeholderCommunication = {
        id: 'comm-temp-id-' + Date.now(),
        timestamp: new Date(),
        status: HvacCommunicationStatusEnum.SENT,
        participants: input.participants.map(p => ({ ...p, id: 'participant-' + Math.random()})),
        attachments: input.attachments?.map(a => ({...a, id: 'attach-' + Math.random(), uploadedAt: new Date() })) || [],
        tags: input.tags || [],
        priority: input.priority || HvacCommunicationPriorityEnum.MEDIUM,
        ...input,
      };
      return placeholderCommunication as HvacCommunicationType;
      // const newCommunication = await this.hvacApiService.createCommunication(input);
      // return newCommunication;
    } catch (error) {
      this.logger.error(`Error creating HVAC communication:`, error.message, error.stack);
      throw error;
    }
  }

  @Mutation(() => HvacAIInsightsType, { name: 'processHvacEmailWithAI', nullable: true })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async processHvacEmailWithAI(
    @Args('emailContent') emailContent: string,
    @Args('customerId', { type: () => ID }) customerId: string,
  ): Promise<HvacAIInsightsType | null> {
    this.checkFeatureEnabled('aiInsights');
    try {
      this.logger.log(`Processing email with AI for customer ID: ${customerId}`);
      // Placeholder
      this.logger.warn(`processEmailWithAI not yet implemented in HvacApiIntegrationService. Returning null.`);
      return null;
      // const insights = await this.hvacApiService.processEmailWithAI(emailContent, customerId);
      // return insights;
    } catch (error) {
      this.logger.error(`Error processing email with AI for customer ${customerId}:`, error.message, error.stack);
      throw error;
    }
  }

  @Mutation(() => HvacCommunicationType, { name: 'updateHvacCommunicationStatus', nullable: true })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateHvacCommunicationStatus(
    @Args('communicationId', { type: () => ID }) communicationId: string,
    @Args('status', { type: () => HvacCommunicationStatusEnum }) status: HvacCommunicationStatusEnum,
  ): Promise<HvacCommunicationType | null> {
    this.checkFeatureEnabled('customer360');
    try {
      this.logger.log(`Updating status for communication ID: ${communicationId} to ${status}`);
      // Placeholder
      this.logger.warn(`updateCommunicationStatus not yet implemented in HvacApiIntegrationService. Returning null.`);
      // const updatedCommunication = await this.hvacApiService.updateCommunicationStatus(communicationId, status);
      // return updatedCommunication;
      // Simulating a fetch and update:
      const placeholderCurrentComm = await this.getHvacCommunicationById(communicationId);
      if (placeholderCurrentComm) {
        (placeholderCurrentComm as any).status = status;
         return placeholderCurrentComm;
      }
      return null;

    } catch (error) {
      this.logger.error(`Error updating status for communication ${communicationId}:`, error.message, error.stack);
      throw error;
    }
  }
}
