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
      // Placeholder: HvacApiIntegrationService needs a method like getContracts(filters, page, limit)
      this.logger.warn(`getContracts not yet implemented in HvacApiIntegrationService. Returning empty response.`);
      // const result = await this.hvacApiService.getContracts(filters, page, limit);
      // return result;
      return { contracts: [], total: 0 };
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
      this.logger.warn(`getContractById not yet implemented in HvacApiIntegrationService. Returning null for ID: ${id}.`);
      // const contract = await this.hvacApiService.getContractById(id);
      // return contract;
      return null;
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
      this.logger.warn(`createContract not yet fully implemented in HvacApiIntegrationService or resolver. Using placeholder logic.`);
      const placeholderContract = {
        id: 'contract-temp-id-' + Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...input,
      };
      return placeholderContract as any; // Cast needed as not all fields of HvacContractType are in input
      // const newContract = await this.hvacApiService.createContract(input);
      // return newContract;
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
      this.logger.warn(`updateContract not yet fully implemented in HvacApiIntegrationService or resolver. Using placeholder logic for ID: ${input.id}.`);
      const placeholderUpdatedContract = {
        id: input.id,
        createdAt: new Date(), // Should be fetched from existing if not updated
        updatedAt: new Date(),
        // Simulate fetching existing and merging
        customerId: input.customerId || 'placeholder-cust-id',
        type: input.type || HvacContractTypeEnum.SERVICE,
        startDate: input.startDate || new Date(),
        endDate: input.endDate || new Date(),
        value: input.value === undefined ? 1000 : input.value,
        status: input.status || HvacContractStatusEnum.ACTIVE,
        terms: input.terms,
        contractNumber: input.contractNumber
      };
      return placeholderUpdatedContract as any; // Cast needed
      // const updatedContract = await this.hvacApiService.updateContract(input.id, input);
      // return updatedContract;
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
      this.logger.warn(`deleteContract not yet implemented in HvacApiIntegrationService for ID: ${id}. Simulating success.`);
      // await this.hvacApiService.deleteContract(id);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting HVAC contract ${id}:`, error.message, error.stack);
      return false;
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
