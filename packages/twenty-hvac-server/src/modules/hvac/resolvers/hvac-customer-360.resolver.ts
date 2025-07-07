import { Resolver, Query, Args, ID, Parent, ResolveField, Int } from '@nestjs/graphql';
import { Injectable, UseGuards, Logger } from '@nestjs/common';
import { HvacConfigService } from '../../../config/hvac-config/hvac-config.service';
import { HvacApiIntegrationService } from '../services/hvac-api-integration.service';

import { HvacCustomer360Type, HvacCustomerInsightsType } from '../graphql-types/hvac-customer-360.types';
import { HvacCustomerType } from '../graphql-types/hvac-customer.types';
import { HvacEquipmentListResponse, HvacEquipmentFilterInput } from '../graphql-types/hvac-equipment.types';
import { HvacCommunicationListResponse, HvacCommunicationFilterInput } from '../graphql-types/hvac-communication.types';
import { HvacServiceTicketListResponse, HvacServiceTicketFilterInput } from '../graphql-types/hvac-service-ticket.types';
import { HvacContractListResponse, HvacContractFilterInput } from '../graphql-types/hvac-contract.types';

@Resolver(() => HvacCustomer360Type)
@Injectable()
export class HvacCustomer360Resolver {
  private readonly logger = new Logger(HvacCustomer360Resolver.name);

  constructor(
    private readonly hvacConfigService: HvacConfigService,
    private readonly hvacApiService: HvacApiIntegrationService,
    // Note: We might need to inject other resolvers if we want to call their query methods directly,
    // but it's often cleaner to have HvacApiIntegrationService handle all external data fetching.
    // For field resolvers below, we'll assume HvacApiIntegrationService has or will have the necessary methods.
  ) {}

  private checkFeatureEnabled() {
    if (!this.hvacConfigService.isHvacFeatureEnabled('customer360')) {
      const errorMessage = `HVAC feature 'customer360' is not enabled.`;
      this.logger.warn(errorMessage);
      throw new Error(errorMessage); // Consider ForbiddenException
    }
  }

  @Query(() => HvacCustomer360Type, { name: 'hvacCustomer360', nullable: true })
  async getHvacCustomer360(
    @Args('customerId', { type: () => ID }) customerId: string,
  ): Promise<Partial<HvacCustomer360Type> | null> {
    this.checkFeatureEnabled();
    this.logger.debug(`Fetching Customer360 data for customer ID: ${customerId}`);

    // The main query will fetch the core customer data.
    // Other fields (equipment, communications, etc.) will be resolved by their respective @ResolveField methods.
    try {
      const customer = await this.hvacApiService.getCustomerById(customerId);
      if (!customer) {
        this.logger.warn(`Customer not found for Customer360 view with ID: ${customerId}`);
        return null;
      }
      // We return a partial object containing the customer.
      // The GraphQL engine will then call field resolvers for other parts of HvacCustomer360Type.
      // We pass the full customer object fetched here to field resolvers via @Parent().
      return { customer: customer as any };
    } catch (error) {
      this.logger.error(`Error fetching core customer data for Customer360 (ID: ${customerId}):`, error.message, error.stack);
      throw error;
    }
  }

  // --- Field Resolvers for HvacCustomer360Type ---

  @ResolveField('customer', () => HvacCustomerType)
  async resolveCustomer(@Parent() customer360: Partial<HvacCustomer360Type>): Promise<HvacCustomerType> {
    // The 'customer' object is already populated by the main hvacCustomer360 query.
    // This resolver ensures it's correctly typed and returned.
    // If customer was just an ID in the parent, here we would fetch it.
    this.logger.debug(`Resolving 'customer' field for Customer360 (ID: ${customer360.customer?.id})`);
    return customer360.customer as HvacCustomerType;
  }

  @ResolveField('insights', () => HvacCustomerInsightsType, { nullable: true })
  async resolveInsights(@Parent() customer360: Partial<HvacCustomer360Type>): Promise<HvacCustomerInsightsType | null> {
    const customerId = customer360.customer?.id;
    if (!customerId) return null;
    const customerId = customer360.customer?.id;
    if (!customerId) return null;
    this.logger.debug(`Resolving 'insights' for Customer360 (ID: ${customerId})`);
    try {
      const insights = await this.hvacApiService.getCustomerInsights(customerId);
      // Assuming HvacCustomerInsights from service is compatible with HvacCustomerInsightsType
      return insights as HvacCustomerInsightsType;
    } catch (error) {
      this.logger.error(`Error resolving insights for customer ${customerId}:`, error.message);
      return null; // Or rethrow, depending on desired error handling for partial data
    }
  }

  @ResolveField('equipment', () => HvacEquipmentListResponse)
  async resolveEquipment(
    @Parent() customer360: Partial<HvacCustomer360Type>,
    @Args('filters', { type: () => HvacEquipmentFilterInput, nullable: true }) filters?: HvacEquipmentFilterInput,
    @Args('page', { type: () => Int, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit?: number,
  ): Promise<HvacEquipmentListResponse> {
    const customerId = customer360.customer?.id;
    if (!customerId) return { equipment: [], total: 0 };
    this.logger.debug(`Resolving 'equipment' for Customer360 (ID: ${customerId}) with filters: ${JSON.stringify(filters)}`);

    const combinedFilters = { ...(filters || {}), customerId };
    // Placeholder: HvacApiIntegrationService needs a method for this that supports filters and pagination
    this.logger.debug(`Resolving 'equipment' for Customer360 (ID: ${customerId}) with filters: ${JSON.stringify(filters)}, page: ${page}, limit: ${limit}`);
    const result = await this.hvacApiService.getEquipment(
        { ...(filters || {}), customerId }, // Ensure customerId is part of the filters passed to service
        limit,
        (page - 1) * limit
    );
    return { equipment: result.equipment as any[], total: result.total };
  }

  @ResolveField('communications', () => HvacCommunicationListResponse)
  async resolveCommunications(
    @Parent() customer360: Partial<HvacCustomer360Type>,
    @Args('filters', { type: () => HvacCommunicationFilterInput, nullable: true }) filters?: HvacCommunicationFilterInput,
    @Args('page', { type: () => Int, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit?: number,
  ): Promise<HvacCommunicationListResponse> {
    const customerId = customer360.customer?.id;
    if (!customerId) return { communications: [], total: 0 };
    this.logger.debug(`Resolving 'communications' for Customer360 (ID: ${customerId}) with filters: ${JSON.stringify(filters)}, page: ${page}, limit: ${limit}`);

    const result = await this.hvacApiService.getCommunicationsList(
        { ...(filters || {}), customerId },
        limit,
        (page - 1) * limit
    );
    return { communications: result.communications as any[], total: result.total };
  }

  @ResolveField('serviceTickets', () => HvacServiceTicketListResponse)
  async resolveServiceTickets(
    @Parent() customer360: Partial<HvacCustomer360Type>,
    @Args('filters', { type: () => HvacServiceTicketFilterInput, nullable: true }) filters?: HvacServiceTicketFilterInput,
    @Args('page', { type: () => Int, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit?: number,
  ): Promise<HvacServiceTicketListResponse> {
    const customerId = customer360.customer?.id;
    if (!customerId) return { tickets: [], total: 0 };
    this.logger.debug(`Resolving 'serviceTickets' for Customer360 (ID: ${customerId}) with filters: ${JSON.stringify(filters)}, page: ${page}, limit: ${limit}`);

    const result = await this.hvacApiService.getServiceTicketsList(
        { ...(filters || {}), customerId },
        limit,
        (page - 1) * limit
    );
    // Assuming HvacServiceTicketResolver has a mapServiceDataToGqlType or similar if needed
    // For now, direct cast, but ensure service returns data compatible with HvacServiceTicketType
    return { tickets: result.tickets.map(t => (this as any).mapServiceTicketDataToGqlType ? (this as any).mapServiceTicketDataToGqlType(t) : t) as any[], total: result.total };
  }

  @ResolveField('contracts', () => HvacContractListResponse)
  async resolveContracts(
    @Parent() customer360: Partial<HvacCustomer360Type>,
    @Args('filters', { type: () => HvacContractFilterInput, nullable: true }) filters?: HvacContractFilterInput,
    @Args('page', { type: () => Int, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit?: number,
  ): Promise<HvacContractListResponse> {
    const customerId = customer360.customer?.id;
    if (!customerId) return { contracts: [], total: 0 };
    this.logger.debug(`Resolving 'contracts' for Customer360 (ID: ${customerId}) with filters: ${JSON.stringify(filters)}, page: ${page}, limit: ${limit}`);

    const result = await this.hvacApiService.getContractsList(
        { ...(filters || {}), customerId },
        limit,
        (page - 1) * limit
    );
    // Assuming HvacContractResolver has a mapContractDataToGqlType or similar if needed
    return { contracts: result.contracts.map(c => (this as any).mapContractDataToGqlType ? (this as any).mapContractDataToGqlType(c) : c) as any[], total: result.total };
  }
}
