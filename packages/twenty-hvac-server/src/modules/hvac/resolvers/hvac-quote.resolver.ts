import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { HvacConfigService } from '../../../config/hvac-config/hvac-config.service';
import { HvacApiIntegrationService } from '../services/hvac-api-integration.service';
import {
  HvacQuote,
  CreateHvacQuoteInput,
  UpdateHvacQuoteInput,
  HvacQuoteListResponse,
  HvacQuoteFilterInput,
} from '../graphql-types/hvac-quote.types';
import { HvacApiNotFoundError } from '../exceptions/hvac-api.exceptions';

@Resolver(() => HvacQuote)
export class HvacQuoteResolver {
  private readonly logger = new Logger(HvacQuoteResolver.name);

  constructor(
    private readonly hvacConfigService: HvacConfigService,
    private readonly hvacApiService: HvacApiIntegrationService,
  ) {}

  // TODO: Add a feature flag check for HVAC quote management, e.g., 'hvacQuotes'
  // if (!this.hvacConfigService.isHvacFeatureEnabled('hvacQuotes')) {
  //   this.logger.warn('HVAC quote feature is not enabled.');
  //   throw new Error('Feature not enabled for HVAC quotes.');
  // }

  @Query(() => HvacQuote, { name: 'hvacQuote', nullable: true })
  async getHvacQuoteById(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<HvacQuote | null> {
    this.logger.log(`Fetching HVAC quote with id: ${id}`);
    try {
      const quote = await this.hvacApiService.getQuoteDetailsById(id);
      if (!quote) {
        // HvacApiIntegrationService.getQuoteDetailsById should handle this by returning null
        // or throwing HvacApiNotFoundError which is then caught here or by a global filter.
        this.logger.warn(`HVAC quote with id ${id} not found.`);
        return null;
      }
      return quote;
    } catch (error) {
      this.logger.error(`Error fetching HVAC quote ${id}: ${error.message}`, error.stack);
      if (error instanceof HvacApiNotFoundError) {
        return null;
      }
      throw error;
    }
  }

  @Query(() => HvacQuoteListResponse, { name: 'hvacQuotes', nullable: true })
  async getHvacQuotes(
    @Args('filters', { type: () => HvacQuoteFilterInput, nullable: true }) filters?: HvacQuoteFilterInput,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit?: number,
  ): Promise<HvacQuoteListResponse | null> {
    this.logger.log(`Fetching HVAC quotes with filters: ${JSON.stringify(filters)}, page: ${page}, limit: ${limit}`);
    try {
      // The service method getQuotesList is expected to handle offset calculation
      const offset = page && limit ? (page - 1) * limit : 0;
      const result = await this.hvacApiService.getQuotesList(filters, limit, offset);
      return {
        quotes: result.quotes,
        total: result.total,
        page: page || 1,
        limit: limit || 0, // if limit is 0 or undefined, it means all items (service should handle)
      };
    } catch (error) {
      this.logger.error(`Error fetching HVAC quotes: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => HvacQuote, { name: 'createHvacQuote' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createHvacQuote(
    @Args('input') input: CreateHvacQuoteInput,
  ): Promise<HvacQuote> {
    this.logger.log(`Attempting to create HVAC quote with input: ${JSON.stringify(input)}`);
    try {
      const newQuote = await this.hvacApiService.createActualQuoteRecord(input);
      this.logger.log(`Successfully created HVAC quote: ${newQuote.id}`);
      return newQuote;
    } catch (error) {
      this.logger.error(`Error creating HVAC quote: ${error.message}`, error.stack, input);
      throw error;
    }
  }

  @Mutation(() => HvacQuote, { name: 'updateHvacQuote', nullable: true })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateHvacQuote(
    @Args('input') input: UpdateHvacQuoteInput,
  ): Promise<HvacQuote | null> {
    this.logger.log(`Attempting to update HVAC quote with id: ${input.id}`);
    try {
      const { id, ...updateData } = input;
      const updatedQuote = await this.hvacApiService.updateActualQuoteRecord(id, updateData as UpdateHvacQuoteInput);
      // updateActualQuoteRecord should throw HvacApiNotFoundError if not found.
      this.logger.log(`Successfully updated HVAC quote: ${updatedQuote.id}`);
      return updatedQuote;
    } catch (error) {
      this.logger.error(`Error updating HVAC quote ${input.id}: ${error.message}`, error.stack, input);
      if (error instanceof HvacApiNotFoundError) {
        return null; // Or let error propagate
      }
      throw error;
    }
  }

  @Mutation(() => Boolean, { name: 'deleteHvacQuote', nullable: true })
  async deleteHvacQuote(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean | null> {
    this.logger.log(`Attempting to delete HVAC quote with id: ${id}`);
    try {
      const success = await this.hvacApiService.deleteActualQuoteRecord(id);
      if (success) {
        this.logger.log(`Successfully deleted HVAC quote: ${id}`);
      } else {
        // This path implies the service method returned false instead of throwing an error for "not found"
        this.logger.warn(`Failed to delete HVAC quote or quote not found: ${id}`);
        return false; // Explicitly return false if service indicates non-success without error
      }
      return true;
    } catch (error) {
      this.logger.error(`Error deleting HVAC quote ${id}: ${error.message}`, error.stack);
      if (error instanceof HvacApiNotFoundError) {
        return null; // Standard way to indicate "not found" for a delete that expects an ID
      }
      throw error;
    }
  }
}
