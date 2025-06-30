import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { Injectable, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';
import { HvacApiIntegrationService, HvacCustomer } from '../services/hvac-api-integration.service';
import { HvacCustomerType, HvacCustomerListResponse } from '../graphql-types/hvac-customer.types';
import { CreateHvacCustomerInput, UpdateHvacCustomerInput } from '../graphql-types/hvac-customer.inputs';
import { Logger } from '@nestjs/common';
import { HvacApiNotFoundError } from '../exceptions/hvac-api.exceptions';

@Resolver(() => HvacCustomerType)
@Injectable()
@UseGuards(WorkspaceAuthGuard)
export class HvacCustomerResolver {
  private readonly logger = new Logger(HvacCustomerResolver.name);

  constructor(
    private readonly hvacConfigService: HvacConfigService,
    private readonly hvacApiService: HvacApiIntegrationService,
  ) {}

  @Query(() => HvacCustomerListResponse, { name: 'hvacCustomers', nullable: true })
  async getHvacCustomers(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit: number,
  ): Promise<HvacCustomerListResponse | null> {
    if (!this.hvacConfigService.isHvacFeatureEnabled('customer360')) {
      this.logger.warn('HVAC customer feature is not enabled.');
      return { customers: [], total: 0, page, limit };
    }

    try {
      // TODO: Optimize pagination. Currently, this fetches ALL customers then paginates in memory.
      // The hvacApiService.getCustomers method should ideally support API-level pagination
      // and return a total count for true server-side pagination.
      // For now, limit and offset are passed to the service, but the service itself doesn't return total.
      // This implementation will show the pagination arguments in GraphQL but won't be efficient.
      const offset = (page - 1) * limit;
      const allCustomers = await this.hvacApiService.getCustomers(10000, 0); // Fetching a large number for now

      const paginatedCustomers = allCustomers.slice(offset, offset + limit);
      const totalCustomers = allCustomers.length; // This is the total of fetched, not necessarily absolute total from API

      return {
        customers: paginatedCustomers as HvacCustomerType[],
        total: totalCustomers,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Error fetching HVAC customers:', error);
      throw error;
    }
  }

  @Query(() => HvacCustomerType, { name: 'hvacCustomer', nullable: true })
  async getHvacCustomerById(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<HvacCustomerType | null> {
    if (!this.hvacConfigService.isHvacFeatureEnabled('customer360')) {
      this.logger.warn('HVAC customer feature is not enabled.');
      return null;
    }

    try {
      const customer = await this.hvacApiService.getCustomerById(id);
      if (!customer) {
        return null;
      }
      return customer as HvacCustomerType;
    } catch (error) {
      this.logger.error(`Error fetching HVAC customer with id ${id}:`, error);
      throw error;
    }
  }

  // TODO: Add Mutations for creating, updating, deleting HVAC customers if needed
  @Mutation(() => HvacCustomerType, { name: 'createHvacCustomer' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true })) // Apply validation pipe
  async createHvacCustomer(
    @Args('input') input: CreateHvacCustomerInput,
  ): Promise<HvacCustomerType> {
    if (!this.hvacConfigService.isHvacFeatureEnabled('customer360')) { // Or a more specific feature flag
      this.logger.warn('HVAC create customer feature is not enabled.');
      // Or throw ForbiddenException
      throw new Error('Feature not enabled to create HVAC customer.');
    }

    try {
      this.logger.log(`Attempting to create HVAC customer with input: ${JSON.stringify(input)}`);
      // The HvacCustomer type from hvacApiService.createCustomer might be slightly different
      // from HvacCustomerType if there are GraphQL specific transformations.
      // For now, assume they are compatible or HvacCustomerType is a superset.
      const newCustomer = await this.hvacApiService.createCustomer(input);
      this.logger.log(`Successfully created HVAC customer: ${newCustomer.id}`);
      return newCustomer as HvacCustomerType;
    } catch (error) {
      this.logger.error(`Error creating HVAC customer: ${error.message}`, error.stack, input);
      // The hvacApiService should throw specific HvacApiExceptions.
      // These can be caught by a GraphQL error filter globally or handled here.
      throw error; // Re-throw to be handled by NestJS GraphQL error handling
    }
  }

  @Mutation(() => HvacCustomerType, { name: 'updateHvacCustomer', nullable: true })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateHvacCustomer(
    @Args('input') input: UpdateHvacCustomerInput,
  ): Promise<HvacCustomerType | null> {
    if (!this.hvacConfigService.isHvacFeatureEnabled('customer360')) { // Or a more specific feature flag
      this.logger.warn('HVAC update customer feature is not enabled.');
      throw new Error('Feature not enabled to update HVAC customer.');
    }

    try {
      this.logger.log(`Attempting to update HVAC customer with id: ${input.id}`);
      const { id, ...updateData } = input;
      const updatedCustomer = await this.hvacApiService.updateActualCustomer(id, updateData);
      if (!updatedCustomer) {
        // This case should ideally be handled by hvacApiService throwing HvacApiNotFoundError
        // which would then be processed by GraphQL error filters.
        // However, if updateActualCustomer can return null on "not found" for some reason:
        this.logger.warn(`HVAC customer with id ${id} not found for update, or update failed.`);
        return null;
      }
      this.logger.log(`Successfully updated HVAC customer: ${updatedCustomer.id}`);
      return updatedCustomer as HvacCustomerType;
    } catch (error) {
      this.logger.error(`Error updating HVAC customer ${input.id}: ${error.message}`, error.stack, input);
      // HvacApiIntegrationService should throw specific errors like HvacApiNotFoundError
      // which will be handled by NestJS/GraphQL error filters.
      throw error;
    }
  }

  @Mutation(() => Boolean, { name: 'deleteHvacCustomer', nullable: true })
  async deleteHvacCustomer(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean | null> {
    if (!this.hvacConfigService.isHvacFeatureEnabled('customer360')) { // Or a more specific feature flag
      this.logger.warn('HVAC delete customer feature is not enabled.');
      throw new Error('Feature not enabled to delete HVAC customer.');
    }

    try {
      this.logger.log(`Attempting to delete HVAC customer with id: ${id}`);
      const success = await this.hvacApiService.deleteActualCustomer(id);
      if (success) {
        this.logger.log(`Successfully deleted HVAC customer: ${id}`);
      } else {
        // This path should ideally not be hit if deleteActualCustomer throws on failure
        // or HvacApiNotFoundError for not found.
        this.logger.warn(`Failed to delete HVAC customer or customer not found: ${id}`);
      }
      return success;
    } catch (error) {
      this.logger.error(`Error deleting HVAC customer ${id}: ${error.message}`, error.stack);
      // HvacApiIntegrationService should throw specific errors like HvacApiNotFoundError
      // which will be handled by NestJS/GraphQL error filters.
      // If it's a not found error, GraphQL might expect null or a specific error response.
      if (error instanceof HvacApiNotFoundError) {
        return null; // Or let the error propagate to be formatted by GraphQL error handler
      }
      throw error;
    }
  }
}
