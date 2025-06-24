import { Resolver, Query, Mutation, Args, ID, Int, Parent, ResolveField } from '@nestjs/graphql';
import { Injectable, UseGuards, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';
import { HvacApiIntegrationService, HvacServiceTicketData } from '../services/hvac-api-integration.service'; // HvacServiceTicketData might need update
import {
  HvacServiceTicketType,
  HvacServiceTicketListResponse,
  HvacServiceTicketStatusEnum, // Import Enum
  HvacServiceTicketPriorityEnum, // Import Enum
} from '../graphql-types/hvac-service-ticket.types';
import {
  HvacServiceTicketFilterInput,
  CreateHvacServiceTicketInput,
  UpdateHvacServiceTicketInput,
} from '../graphql-types/hvac-service-ticket.types';
import { HvacCustomerType } from '../graphql-types/hvac-customer.types';
import { HvacEquipmentType } from '../graphql-types/hvac-equipment.types';

@Resolver(() => HvacServiceTicketType)
@Injectable()
@UseGuards(WorkspaceAuthGuard)
export class HvacServiceTicketResolver {
  private readonly logger = new Logger(HvacServiceTicketResolver.name);

  constructor(
    private readonly hvacConfigService: HvacConfigService,
    private readonly hvacApiService: HvacApiIntegrationService,
  ) {}

  private checkFeatureEnabled(featureKey: keyof ReturnType<HvacConfigService['getHvacFeatureFlags']>) {
    const feature = featureKey || 'scheduling'; // Default to 'scheduling' if no specific key
    if (!this.hvacConfigService.isHvacFeatureEnabled(feature)) {
      const errorMessage = `HVAC feature '${feature}' is not enabled.`;
      this.logger.warn(errorMessage);
      throw new Error(errorMessage); // Consider ForbiddenException for GraphQL
    }
  }

  @Query(() => HvacServiceTicketListResponse, { name: 'hvacServiceTickets' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getHvacServiceTickets(
    @Args('filters', { type: () => HvacServiceTicketFilterInput, nullable: true }) filters?: HvacServiceTicketFilterInput,
    @Args('page', { type: () => Int, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit?: number,
  ): Promise<HvacServiceTicketListResponse> {
    this.checkFeatureEnabled('scheduling');
    try {
      this.logger.debug(`Fetching HVAC service tickets with filters: ${JSON.stringify(filters)}, page: ${page}, limit: ${limit}`);

      // TODO: HvacApiIntegrationService.getServiceTickets needs to be updated to accept filters and return total count.
      // For now, the existing service method is called, which might not support full filtering.
      const serviceTicketsFromApi = await this.hvacApiService.getServiceTickets(limit, (page - 1) * limit);

      this.logger.warn(`hvacApiService.getServiceTickets may not fully support provided filters or pagination correctly yet. Current result count: ${serviceTicketsFromApi.length}`);

      // Mapping to GraphQL type. Assumes HvacServiceTicketData is compatible or can be cast.
      // Ideally, the service layer or this resolver would perform a proper mapping.
      const tickets = serviceTicketsFromApi.map(ticket => this.mapServiceDataToGqlType(ticket));

      return {
        tickets: tickets,
        total: tickets.length, // This should be the actual total count from the API/service.
      };
    } catch (error) {
      this.logger.error('Error fetching HVAC service tickets:', error.message, error.stack);
      throw error;
    }
  }

  @Query(() => HvacServiceTicketType, { name: 'hvacServiceTicket', nullable: true })
  async getHvacServiceTicketById(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<HvacServiceTicketType | null> {
    this.checkFeatureEnabled('scheduling');
    try {
      this.logger.debug(`Fetching HVAC service ticket by ID: ${id}`);
      const ticketData = await this.hvacApiService.getServiceTicketById(id);
      if (!ticketData) return null;
      return this.mapServiceDataToGqlType(ticketData);
    } catch (error) {
      this.logger.error(`Error fetching HVAC service ticket by ID ${id}:`, error.message, error.stack);
      throw error; // Or handle as per specific requirements (e.g., return null on NotFoundError)
    }
  }

  @Mutation(() => HvacServiceTicketType, { name: 'createHvacServiceTicket' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createHvacServiceTicket(
    @Args('input') input: CreateHvacServiceTicketInput,
  ): Promise<HvacServiceTicketType> {
    this.checkFeatureEnabled('scheduling');
    try {
      this.logger.log(`Attempting to create HVAC service ticket: ${JSON.stringify(input)}`);
      // TODO: HvacApiIntegrationService.createServiceTicket needs to accept an object similar to CreateHvacServiceTicketInput.
      // The current service method takes HvacServiceTicketData which might differ.
      // A mapping or service method update is required.
      const ticketDataForApi: Partial<HvacServiceTicketData> = { // Map input to HvacServiceTicketData
        ...input,
        // ticketNumber: this.generateTicketNumber(), // Generation should happen in service or API
        // serviceAddress: input.serviceAddress ? this.parseAddressString(input.serviceAddress) : undefined,
      };

      const newTicketData = await this.hvacApiService.createServiceTicket(ticketDataForApi as HvacServiceTicketData);
      this.logger.log(`Successfully created HVAC service ticket: ${newTicketData.id}`);
      return this.mapServiceDataToGqlType(newTicketData);
    } catch (error) {
      this.logger.error(`Error creating HVAC service ticket:`, error.message, error.stack);
      throw error;
    }
  }

  @Mutation(() => HvacServiceTicketType, { name: 'updateHvacServiceTicket' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateHvacServiceTicket(
    @Args('input') input: UpdateHvacServiceTicketInput,
  ): Promise<HvacServiceTicketType> {
    this.checkFeatureEnabled('scheduling');
    try {
      const { id, ...updateData } = input;
      this.logger.log(`Attempting to update HVAC service ticket ID: ${id} with data: ${JSON.stringify(updateData)}`);

      // TODO: HvacApiIntegrationService.updateServiceTicket needs to accept (id, Partial<InputType>)
      // A mapping or service method update is required.
      const ticketDataForApi: Partial<HvacServiceTicketData> = {
        ...updateData,
        // serviceAddress: updateData.serviceAddress ? this.parseAddressString(updateData.serviceAddress) : undefined,
      };

      const updatedTicketData = await this.hvacApiService.updateServiceTicket(id, ticketDataForApi);
      this.logger.log(`Successfully updated HVAC service ticket: ${updatedTicketData.id}`);
      return this.mapServiceDataToGqlType(updatedTicketData);
    } catch (error) {
      this.logger.error(`Error updating HVAC service ticket ${input.id}:`, error.message, error.stack);
      throw error;
    }
  }

  @Mutation(() => Boolean, { name: 'deleteHvacServiceTicket' })
  async deleteHvacServiceTicket(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    this.checkFeatureEnabled('scheduling');
    try {
      this.logger.log(`Attempting to delete HVAC service ticket ID: ${id}`);
      // TODO: HvacApiIntegrationService needs a deleteServiceTicket(id) method.
      this.logger.warn(`deleteServiceTicket not yet implemented in HvacApiIntegrationService for ID: ${id}. Simulating success.`);
      // await this.hvacApiService.deleteServiceTicket(id);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting HVAC service ticket ${id}:`, error.message, error.stack);
      return false; // Or rethrow error based on requirements
    }
  }

  // --- Field Resolvers ---
  @ResolveField('customer', () => HvacCustomerType, { nullable: true })
  async getCustomer(@Parent() serviceTicket: HvacServiceTicketType): Promise<HvacCustomerType | null> {
    this.logger.debug(`Resolving customer for service ticket ID: ${serviceTicket.id}, customer ID: ${serviceTicket.customerId}`);
    if (!serviceTicket.customerId) return null;
    try {
      // Assumes HvacApiIntegrationService.getCustomerById can be used and returns a compatible type.
      const customerData = await this.hvacApiService.getCustomerById(serviceTicket.customerId);
      // TODO: Map customerData to HvacCustomerType if necessary.
      return customerData as any;
    } catch (error) {
      this.logger.error(`Error resolving customer for service ticket ${serviceTicket.id}: ${error.message}`);
      return null;
    }
  }

  @ResolveField('equipment', () => HvacEquipmentType, { nullable: true })
  async getEquipment(@Parent() serviceTicket: HvacServiceTicketType): Promise<HvacEquipmentType | null> {
    this.logger.debug(`Resolving equipment for service ticket ID: ${serviceTicket.id}, equipment ID: ${serviceTicket.equipmentId}`);
    if (!serviceTicket.equipmentId) return null;
    try {
      // Assumes HvacApiIntegrationService.getEquipmentById can be used.
      const equipmentData = await this.hvacApiService.getEquipmentById(serviceTicket.equipmentId);
      // TODO: Map equipmentData to HvacEquipmentType if necessary.
      return equipmentData as any;
    } catch (error) {
      this.logger.error(`Error resolving equipment for service ticket ${serviceTicket.id}: ${error.message}`);
      return null;
    }
  }

  // Helper to map data from HvacApiIntegrationService to GraphQL HvacServiceTicketType
  // This should ideally be more robust or the service should return closer types.
  private mapServiceDataToGqlType(ticketData: HvacServiceTicketData): HvacServiceTicketType {
    // Basic mapping, assuming HvacServiceTicketData structure from HvacApiIntegrationService
    // and HvacServiceTicketType from graphql-types.
    // This will need careful alignment.
    return {
      id: ticketData.id || 'temp-id', // Ensure ID is present
      customerId: ticketData.customerId || 'unknown-cust-id',
      equipmentId: ticketData.equipmentId,
      title: ticketData.title,
      description: ticketData.description,
      status: ticketData.status as HvacServiceTicketStatusEnum, // Cast, ensure service returns valid enum string
      priority: ticketData.priority as HvacServiceTicketPriorityEnum, // Cast
      assignedTechnicianId: ticketData.technicianId,
      scheduledDate: ticketData.scheduledDate ? new Date(ticketData.scheduledDate) : undefined,
      completedDate: ticketData.completedDate ? new Date(ticketData.completedDate) : undefined, // Assuming completedDate is in HvacServiceTicketData
      estimatedCost: ticketData.estimatedCost || 0,
      actualCost: ticketData.actualCost, // Assuming actualCost is in HvacServiceTicketData
      serviceType: ticketData.serviceType,
      // Assuming createdAt and updatedAt are not directly in HvacServiceTicketData and would be set by API or DB
      // If they are, map them: new Date(ticketData.createdAt), new Date(ticketData.updatedAt)
      // For now, using placeholders or omitting if not critical for this phase.
      createdAt: new Date(), // Placeholder
      updatedAt: new Date(), // Placeholder
      // customer and equipment are handled by field resolvers
    };
  }
}
