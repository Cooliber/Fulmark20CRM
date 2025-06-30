import { Resolver, Query, Mutation, Args, ID, Int, Parent, ResolveField } from '@nestjs/graphql';
import { Injectable, UseGuards, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';
import { HvacApiIntegrationService } from '../services/hvac-api-integration.service';
import {
  HvacContractType,
  HvacContractListResponse,
} from '../graphql-types/hvac-contract.types';
import {
  HvacContractFilterInput,
  CreateHvacContractInput,
  UpdateHvacContractInput,
} from '../graphql-types/hvac-contract.types';
import { HvacCustomerType } from '../graphql-types/hvac-customer.types';

@Resolver(() => HvacContractType)
@Injectable()
@UseGuards(WorkspaceAuthGuard)
export class HvacContractResolver {
  private readonly logger = new Logger(HvacContractResolver.name);

  constructor(
    private readonly hvacConfigService: HvacConfigService,
    private readonly hvacApiService: HvacApiIntegrationService,
  ) {}

  private checkFeatureEnabled() {
    // Assuming a general 'customer360' or a specific 'contractManagement' feature flag
    if (!this.hvacConfigService.isHvacFeatureEnabled('customer360')) {
      const errorMessage = `HVAC feature 'contractManagement' (or 'customer360') is not enabled.`;
      this.logger.warn(errorMessage);
      throw new Error(errorMessage); // Consider ForbiddenException
    }
  }

  @Query(() => HvacContractListResponse, { name: 'hvacContracts' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getHvacContracts(
    @Args('filters', { type: () => HvacContractFilterInput, nullable: true }) filters?: HvacContractFilterInput,
    @Args('page', { type: () => Int, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit?: number,
  ): Promise<HvacContractListResponse> {
    this.checkFeatureEnabled();
    try {
      this.logger.debug(`Fetching HVAC contracts with filters: ${JSON.stringify(filters)}, page: ${page}, limit: ${limit}`);
      const result = await this.hvacApiService.getContractsList(filters, limit, (page - 1) * limit);
      return {
        contracts: result.contracts as HvacContractType[], // Assuming service returns compatible type
        total: result.total,
      };
    } catch (error) {
      this.logger.error('Error fetching HVAC contracts:', error.message, error.stack);
      throw error;
    }
  }

  @Query(() => HvacContractType, { name: 'hvacContract', nullable: true })
  async getHvacContractById(@Args('id', { type: () => ID }) id: string): Promise<HvacContractType | null> {
    this.checkFeatureEnabled();
    try {
      this.logger.debug(`Fetching HVAC contract by ID: ${id}`);
      const contractData = await this.hvacApiService.getContractDetailsById(id);
      if (!contractData) {
        return null;
      }
      return contractData as HvacContractType; // Assuming service returns compatible type
    } catch (error) {
      this.logger.error(`Error fetching HVAC contract by ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HvacApiNotFoundError) return null;
      throw error;
    }
  }

  @Mutation(() => HvacContractType, { name: 'createHvacContract' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createHvacContract(
    @Args('input') input: CreateHvacContractInput,
  ): Promise<HvacContractType> {
    this.checkFeatureEnabled();
    try {
      this.logger.log(`Attempting to create HVAC contract: ${JSON.stringify(input)}`);
      const newContractData = await this.hvacApiService.createActualContractRecord(input);
      return newContractData as HvacContractType; // Assuming service returns compatible type
    } catch (error) {
      this.logger.error(`Error creating HVAC contract:`, error.message, error.stack);
      throw error;
    }
  }

  @Mutation(() => HvacContractType, { name: 'updateHvacContract', nullable: true })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateHvacContract(
    @Args('input') input: UpdateHvacContractInput,
  ): Promise<HvacContractType | null> {
    this.checkFeatureEnabled();
    try {
      this.logger.log(`Attempting to update HVAC contract ID: ${input.id}`);
      const { id, ...updateData } = input;
      const updatedContractData = await this.hvacApiService.updateActualContractRecord(id, updateData as UpdateHvacContractInput);
      return updatedContractData as HvacContractType; // Assuming service returns compatible type
    } catch (error) {
      this.logger.error(`Error updating HVAC contract ${input.id}: ${error.message}`, error.stack);
      if (error instanceof HvacApiNotFoundError) return null;
      throw error;
    }
  }

  @Mutation(() => Boolean, { name: 'deleteHvacContract', nullable: true })
  async deleteHvacContract(@Args('id', { type: () => ID }) id: string): Promise<boolean | null> {
    this.checkFeatureEnabled();
    try {
      this.logger.log(`Attempting to delete HVAC contract ID: ${id}`);
      const success = await this.hvacApiService.deleteActualContractRecord(id);
      return success;
    } catch (error) {
      this.logger.error(`Error deleting HVAC contract ${id}: ${error.message}`, error.stack);
      if (error instanceof HvacApiNotFoundError) return null;
      throw error;
    }
  }

  // --- Field Resolver for Customer ---
  @ResolveField('customer', () => HvacCustomerType, { nullable: true })
  async getCustomer(@Parent() contract: HvacContractType): Promise<HvacCustomerType | null> {
    this.logger.debug(`Resolving customer for contract ID: ${contract.id}, customer ID: ${contract.customerId}`);
    if (!contract.customerId) return null;
    try {
      const customer = await this.hvacApiService.getCustomerById(contract.customerId);
      return customer as HvacCustomerType; // Assuming service returns HvacCustomer compatible with HvacCustomerType
    } catch (error) {
      this.logger.error(`Error resolving customer for contract ${contract.id}: ${error.message}`);
      // Do not throw an error from a field resolver if the field is nullable.
      // If customer not found (HvacApiNotFoundError from getCustomerById), it will return null.
      if (error instanceof HvacApiNotFoundError) return null;
      // For other errors, it might be appropriate to let them propagate if they are unexpected
      // or return null if partial data is acceptable.
      // For now, returning null for any error during field resolution.
      return null;
    }
  }
}
