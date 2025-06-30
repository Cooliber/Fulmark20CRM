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
      // Assuming result.contracts are compatible with HvacContractType or need mapping
      return {
        contracts: result.contracts.map(c => this.mapContractDataToGqlType(c)),
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
      // Placeholder
      this.logger.debug(`Fetching HVAC contract by ID: ${id}`);
      const contractData = await this.hvacApiService.getContractDetailsById(id);
      if (!contractData) return null;
      return this.mapContractDataToGqlType(contractData);
    } catch (error) {
      this.logger.error(`Error fetching HVAC contract by ID ${id}:`, error.message, error.stack);
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
      // Placeholder
      this.logger.log(`Attempting to create HVAC contract: ${JSON.stringify(input)}`);
      const newContractData = await this.hvacApiService.createActualContractRecord(input);
      return this.mapContractDataToGqlType(newContractData);
    } catch (error) {
      this.logger.error(`Error creating HVAC contract:`, error.message, error.stack);
      throw error;
    }
  }

  @Mutation(() => HvacContractType, { name: 'updateHvacContract' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateHvacContract(
    @Args('input') input: UpdateHvacContractInput,
  ): Promise<HvacContractType> {
    this.checkFeatureEnabled();
    try {
      this.logger.log(`Attempting to update HVAC contract ID: ${input.id}`);
      // Placeholder
      this.logger.log(`Attempting to update HVAC contract ID: ${input.id}`);
      const { id, ...updateData } = input;
      const updatedContractData = await this.hvacApiService.updateActualContractRecord(id, updateData as UpdateHvacContractInput);
      return this.mapContractDataToGqlType(updatedContractData);
    } catch (error) {
      this.logger.error(`Error updating HVAC contract ${input.id}:`, error.message, error.stack);
      throw error;
    }
  }

  @Mutation(() => Boolean, { name: 'deleteHvacContract' })
  async deleteHvacContract(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    this.checkFeatureEnabled();
    try {
      this.logger.log(`Attempting to delete HVAC contract ID: ${id}`);
      // Placeholder
      this.logger.log(`Attempting to delete HVAC contract ID: ${id}`);
      await this.hvacApiService.deleteActualContractRecord(id);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting HVAC contract ${id}:`, error.message, error.stack);
      throw error; // Or return false based on requirements
    }
  }

  // --- Field Resolver for Customer ---
  @ResolveField('customer', () => HvacCustomerType, { nullable: true })
  async getCustomer(@Parent() contract: HvacContractType): Promise<HvacCustomerType | null> {
    this.logger.debug(`Resolving customer for contract ID: ${contract.id}, customer ID: ${contract.customerId}`);
    if (!contract.customerId) return null;
    try {
      // Assuming HvacApiIntegrationService has a method to get customer by ID
      // This might also call another resolver or service if customer data is managed within Twenty itself.
      const customer = await this.hvacApiService.getCustomerById(contract.customerId);
      return customer as any; // Cast needed as HvacCustomer might differ from HvacCustomerType
    } catch (error) {
      this.logger.error(`Error resolving customer for contract ${contract.id}: ${error.message}`);
      return null;
    }
  }
}
