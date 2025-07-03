import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { Injectable, UseGuards, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { HvacConfigService } from '../../../config/hvac-config/hvac-config.service';
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
  UpdateHvacCommunicationInput, // Added
} from '../graphql-types/hvac-communication.types';
import { HvacApiNotFoundError } from '../exceptions/hvac-api.exceptions';

@Resolver(() => HvacCommunicationType)
@Injectable()
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
      const result = await this.hvacApiService.getCommunicationsList(filters, limit, (page - 1) * limit);
      return {
        communications: result.communications as any[], // Cast if necessary
        total: result.total,
      };
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
      const communication = await this.hvacApiService.getCommunicationDetailsById(id);
      return communication;
    } catch (error) {
      this.logger.error(`Error fetching HVAC communication by ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HvacApiNotFoundError) return null;
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
      const stats = await this.hvacApiService.getCommunicationStatistics(customerId);
      return stats;
    } catch (error) {
      this.logger.error(`Error fetching HVAC communication stats for customer ${customerId}:`, error.message, error.stack);
      if (error instanceof HvacApiNotFoundError) return null;
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
      const timeline = await this.hvacApiService.getCommunicationTimelineForCustomer(customerId, limit);
      return timeline;
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
      const results = await this.hvacApiService.searchCustomerCommunications(query, customerId, limit);
      return results;
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
      const newCommunication = await this.hvacApiService.createActualCommunicationRecord(input);
      return newCommunication;
    } catch (error) {
      this.logger.error(`Error creating HVAC communication:`, error.message, error.stack);
      throw error;
    }
  }

  @Mutation(() => HvacCommunicationType, { name: 'updateHvacCommunication', nullable: true })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateHvacCommunication(
    @Args('input') input: UpdateHvacCommunicationInput,
  ): Promise<HvacCommunicationType | null> {
    this.checkFeatureEnabled('customer360');
    this.logger.log(`Attempting to update HVAC communication with id: ${input.id}`);
    try {
      const { id, ...updateData } = input;
      const updatedComm = await this.hvacApiService.updateActualCommunicationRecord(id, updateData);
      this.logger.log(`Successfully updated HVAC communication: ${updatedComm.id}`);
      return updatedComm;
    } catch (error) {
      this.logger.error(`Error updating HVAC communication ${input.id}: ${error.message}`, error.stack, input);
      if (error instanceof HvacApiNotFoundError) return null;
      throw error;
    }
  }

  @Mutation(() => Boolean, { name: 'deleteHvacCommunication', nullable: true })
  async deleteHvacCommunication(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean | null> {
    this.checkFeatureEnabled('customer360');
    this.logger.log(`Attempting to delete HVAC communication with id: ${id}`);
    try {
      const success = await this.hvacApiService.deleteActualCommunicationRecord(id);
      this.logger.log(`Successfully deleted HVAC communication: ${id} - Success: ${success}`);
      return success;
    } catch (error) {
      this.logger.error(`Error deleting HVAC communication ${id}: ${error.message}`, error.stack);
      if (error instanceof HvacApiNotFoundError) return null;
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
      const insights = await this.hvacApiService.processEmailContentWithAI(emailContent, customerId);
      return insights;
    } catch (error) {
      this.logger.error(`Error processing email with AI for customer ${customerId}:`, error.message, error.stack);
      if (error instanceof HvacApiNotFoundError) return null;
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
      const updatedCommunication = await this.hvacApiService.updateStatusForCommunication(communicationId, status as string);
      return updatedCommunication;
    } catch (error) {
      this.logger.error(`Error updating status for communication ${communicationId}:`, error.message, error.stack);
      if (error instanceof HvacApiNotFoundError) return null;
      throw error;
    }
  }
}
