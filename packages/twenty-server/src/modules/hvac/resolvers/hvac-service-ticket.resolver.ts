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

      this.logger.debug(`Fetching HVAC service tickets with filters: ${JSON.stringify(filters)}, page: ${page}, limit: ${limit}`);

      const result = await this.hvacApiService.getServiceTicketsList(filters, limit, (page - 1) * limit);

      return {
        tickets: result.tickets.map(ticket => this.mapServiceDataToGqlType(ticket)),
        total: result.total,
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
      const ticketData = await this.hvacApiService.getServiceTicketDetailsById(id);
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
      this.logger.log(`Attempting to create HVAC service ticket: ${JSON.stringify(input)}`);
      const newTicketData = await this.hvacApiService.createActualServiceTicketRecord(input);
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

      const updatedTicketData = await this.hvacApiService.updateActualServiceTicketRecord(id, updateData as UpdateHvacServiceTicketInput); // input still contains id here, service should ignore it in payload
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
      this.logger.log(`Attempting to delete HVAC service ticket ID: ${id}`);
      await this.hvacApiService.deleteActualServiceTicketRecord(id);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting HVAC service ticket ${id}:`, error.message, error.stack);
      throw error;
    }
  }

  // --- Field Resolvers ---
  @ResolveField('customer', () => HvacCustomerType, { nullable: true })
  async getCustomer(@Parent() serviceTicket: HvacServiceTicketType): Promise<HvacCustomerType | null> {
    this.logger.debug(`Resolving customer for service ticket ID: ${serviceTicket.id}, customer ID: ${serviceTicket.customerId}`);
    if (!serviceTicket.customerId) return null;
    try {
      const customerData = await this.hvacApiService.getCustomerById(serviceTicket.customerId);
      return customerData as HvacCustomerType;
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
      const equipmentData = await this.hvacApiService.getEquipmentById(serviceTicket.equipmentId);
      return equipmentData as HvacEquipmentType;
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
      title: ticketData.title, // Ensure this field exists on HvacServiceTicketData
      description: ticketData.description,
      status: ticketData.status as HvacServiceTicketStatusEnum,
      priority: ticketData.priority as HvacServiceTicketPriorityEnum,
      assignedTechnicianId: ticketData.technicianId,
      scheduledDate: ticketData.scheduledDate ? new Date(ticketData.scheduledDate) : undefined,
      completedDate: ticketData.completedDate ? new Date(ticketData.completedDate) : undefined,
      estimatedCost: ticketData.estimatedCost || 0,
      actualCost: ticketData.actualCost,
      serviceType: ticketData.serviceType,
      // Ensure HvacServiceTicketData includes createdAt and updatedAt or handle them appropriately
      createdAt: (ticketData as any).createdAt ? new Date((ticketData as any).createdAt) : new Date(), // Placeholder if not on type
      updatedAt: (ticketData as any).updatedAt ? new Date((ticketData as any).updatedAt) : new Date(), // Placeholder if not on type
    };
  }
}
