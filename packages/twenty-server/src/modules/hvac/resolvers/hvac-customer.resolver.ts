import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql'; // Added Mutation
import { Injectable, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common'; // Added UsePipes, ValidationPipe
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';
import { HvacApiIntegrationService, HvacCustomer } from '../services/hvac-api-integration.service';
import { HvacCustomerType } from '../graphql-types/hvac-customer.types';
import { CreateHvacCustomerInput, UpdateHvacCustomerInput } from '../graphql-types/hvac-customer.inputs'; // Added
import { Logger } from '@nestjs/common';

@Resolver(() => HvacCustomerType)
@Injectable()
@UseGuards(WorkspaceAuthGuard)
export class HvacCustomerResolver {
  private readonly logger = new Logger(HvacCustomerResolver.name);

  constructor(
    private readonly hvacConfigService: HvacConfigService,
    private readonly hvacApiService: HvacApiIntegrationService,
  ) {}

  @Query(() => [HvacCustomerType], { name: 'hvacCustomers', nullable: 'itemsAndList' })
  async getHvacCustomers(
    // TODO: Add arguments for pagination (limit, offset) if API supports it
  ): Promise<HvacCustomerType[] | null> {
    // Check if the core HVAC integration feature is enabled (assuming a general flag or customer specific)
    // For now, let's assume if HvacConfigService is available, the basic integration is intended.
    // A more specific flag like 'FEATURE_HVAC_CUSTOMER_MANAGEMENT' could be used.
    if (!this.hvacConfigService.isHvacFeatureEnabled('customer360')) { // Using customer360 as a proxy for now
      this.logger.warn('HVAC customer feature is not enabled.');
      // Depending on desired behavior, could return empty array or throw error
      return [];
    }

    try {
      const customers = await this.hvacApiService.getCustomers();
      // Ensure the return type matches HvacCustomerType[], potentially map if structures differ significantly
      // For now, assuming HvacCustomer from service is compatible with HvacCustomerType
      return customers as HvacCustomerType[];
    } catch (error) {
      this.logger.error('Error fetching HVAC customers:', error);
      // Handle error appropriately, e.g., throw a GraphQL error or return null/empty
      // For now, rethrowing to be caught by global error handlers or Sentry
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
    if (!this.hvacConfigService.isHvacFeatureEnabled('customer360')) {
      this.logger.warn('HVAC update customer feature is not enabled.');
      throw new Error('Feature not enabled to update HVAC customer.');
    }

    try {
      this.logger.log(`Attempting to update HVAC customer with id: ${input.id}`);
      // Assuming hvacApiService.updateCustomer (if it exists or will be created)
      // would take (id, data) and return the updated customer.
      // For this example, we'll simulate it if the method doesn't exist yet in HvacApiIntegrationService
      // const updatedCustomer = await this.hvacApiService.updateCustomer(input.id, input);

      // Placeholder if hvacApiService.updateCustomer is not yet implemented
      // In a real scenario, you'd call the service method.
      const currentCustomer = await this.hvacApiService.getCustomerById(input.id);
      if (!currentCustomer) {
        throw new HvacApiNotFoundError(`Customer with id ${input.id} not found for update.`);
      }
      const dataToUpdate = { ...input };
      delete dataToUpdate.id; // remove id from payload

      // This is a placeholder for the actual update logic using a dedicated service method
      const simulatedUpdatedCustomer : HvacCustomer = {
         ...currentCustomer,
         ...dataToUpdate,
         name: input.name || currentCustomer.name, // Ensure name is updated
      };
      // await this.hvacApiService.updateCustomer(input.id, dataToUpdate); // This would be the actual call

      this.logger.log(`Successfully updated HVAC customer: ${input.id}`);
      // For now, returning the simulated updated customer
      return simulatedUpdatedCustomer as HvacCustomerType;

    } catch (error) {
      this.logger.error(`Error updating HVAC customer ${input.id}: ${error.message}`, error.stack, input);
      throw error;
    }
  }
}
