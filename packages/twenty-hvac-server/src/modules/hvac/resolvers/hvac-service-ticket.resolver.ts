import { Injectable, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { Args, ID, Int, Mutation, Parent, Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { HvacConfigService } from '../../../config/hvac-config/hvac-config.service';
import { HvacApiNotFoundError } from '../exceptions/hvac-api.exceptions';
import { HvacCustomerType } from '../graphql-types/hvac-customer.types';
import { HvacEquipmentType } from '../graphql-types/hvac-equipment.types';
import {
    CreateHvacServiceTicketInput,
    HvacServiceTicketFilterInput,
    HvacServiceTicketListResponse,
    HvacServiceTicketType,
    UpdateHvacServiceTicketInput
} from '../graphql-types/hvac-service-ticket.types';
import { HvacApiIntegrationService } from '../services/hvac-api-integration.service'; // HvacServiceTicketData might need update

// Initialize PubSub
// For a production application, this should be configured as a provider
// and potentially use a different engine like RedisPubSub.
const pubSub = new PubSub();
const SERVICE_TICKET_UPDATED_EVENT = 'hvacServiceTicketUpdated';

@Resolver(() => HvacServiceTicketType)
@Injectable()
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

    this.logger.log(`Fetching HVAC service tickets with filters: ${JSON.stringify(filters)}, page: ${page}, limit: ${limit}`);
    try {
      const serviceTicketsData = await this.hvacApiService.getServiceTickets(filters);
      this.logger.log(`Successfully fetched ${serviceTicketsData.length} HVAC service tickets`);

      // Apply pagination manually since API doesn't support it yet
      const startIndex = ((page || 1) - 1) * (limit || 20);
      const endIndex = startIndex + (limit || 20);
      const paginatedTickets = serviceTicketsData.slice(startIndex, endIndex);

      return {
        tickets: paginatedTickets.map(ticket => this.mapServiceDataToGqlType(ticket)),
        total: serviceTicketsData.length,
      };
    } catch (error) {
      this.logger.error(`Error fetching HVAC service tickets: ${error.message}`, error.stack);
      throw error;
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
  private mapServiceDataToGqlType(ticket: any): HvacServiceTicketType {
    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      serviceType: ticket.serviceType,
      customerId: ticket.customerId,
      equipmentId: ticket.equipmentId,
      technicianId: ticket.technicianId,
      scheduledDate: ticket.scheduledDate,
      completedDate: ticket.completedDate,
      estimatedDuration: ticket.estimatedDuration,
      actualDuration: ticket.actualDuration,
      estimatedCost: ticket.cost || 0, // Add missing estimatedCost field
      cost: ticket.cost,
      notes: ticket.notes,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    } as HvacServiceTicketType;
  }

  @Query(() => HvacServiceTicketType, { name: 'hvacServiceTicket', nullable: true })
  async getHvacServiceTicketById(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<HvacServiceTicketType | null> {
    this.checkFeatureEnabled('scheduling');
    try {
      this.logger.debug(`Fetching HVAC service ticket by ID: ${id}`);
      const ticketData = await this.hvacApiService.getServiceTicketDetailsById(id);
      if (!ticketData) {
        return null;
      }
      return this.mapServiceDataToGqlType(ticketData);
    } catch (error) {
      this.logger.error(`Error fetching HVAC service ticket by ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HvacApiNotFoundError) return null;
      throw error;
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
      const newTicketData = await this.hvacApiService.createActualServiceTicketRecord(input);
      this.logger.log(`Successfully created HVAC service ticket: ${newTicketData.id}`);
      return this.mapServiceDataToGqlType(newTicketData);
    } catch (error) {
      this.logger.error(`Error creating HVAC service ticket:`, error.message, error.stack);
      throw error;
    }
  }

  @Mutation(() => HvacServiceTicketType, { name: 'updateHvacServiceTicket', nullable: true })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateHvacServiceTicket(
    @Args('input') input: UpdateHvacServiceTicketInput,
  ): Promise<HvacServiceTicketType | null> {
    this.checkFeatureEnabled('scheduling');
    try {
      const { id, ...updateData } = input;
      this.logger.log(`Attempting to update HVAC service ticket ID: ${id} with data: ${JSON.stringify(updateData)}`);
      const updatedTicketDataFromService = await this.hvacApiService.updateActualServiceTicketRecord(id, updateData as UpdateHvacServiceTicketInput);
      const updatedTicketGql = this.mapServiceDataToGqlType(updatedTicketDataFromService);
      this.logger.log(`Successfully updated HVAC service ticket: ${updatedTicketGql.id}`);

      // Publish the update event
      pubSub.publish(`${SERVICE_TICKET_UPDATED_EVENT}_${id}`, { [SERVICE_TICKET_UPDATED_EVENT]: updatedTicketGql });
      // Also publish for a generic event if needed, e.g., for a list view update
      // pubSub.publish(SERVICE_TICKET_UPDATED_EVENT_GENERIC, { hvacServiceTicketGenericUpdate: updatedTicketGql });

      return updatedTicketGql;
    } catch (error) {
      this.logger.error(`Error updating HVAC service ticket ${input.id}: ${error.message}`, error.stack);
      if (error instanceof HvacApiNotFoundError) return null;
      throw error;
    }
  }

  @Mutation(() => Boolean, { name: 'deleteHvacServiceTicket', nullable: true })
  async deleteHvacServiceTicket(@Args('id', { type: () => ID }) id: string): Promise<boolean | null> {
    this.checkFeatureEnabled('scheduling');
    try {
      this.logger.log(`Attempting to delete HVAC service ticket ID: ${id}`);
      const success = await this.hvacApiService.deleteActualServiceTicketRecord(id);
      return success;
    } catch (error) {
      this.logger.error(`Error deleting HVAC service ticket ${id}: ${error.message}`, error.stack);
      if (error instanceof HvacApiNotFoundError) return null;
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
      if (!customerData) return null;
      return customerData as HvacCustomerType; // Assuming HvacCustomer is compatible
    } catch (error) {
      this.logger.error(`Error resolving customer for service ticket ${serviceTicket.id}: ${error.message}`);
      if (error instanceof HvacApiNotFoundError) return null;
      // For other errors, let them propagate or return null based on desired behavior for field resolvers
      return null;
    }
  }

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
      if (!equipmentData) return null;
      return equipmentData as HvacEquipmentType; // Assuming HvacEquipmentSummary is compatible
    } catch (error) {
      this.logger.error(`Error resolving equipment for service ticket ${serviceTicket.id}: ${error.message}`);
      if (error instanceof HvacApiNotFoundError) return null;
      return null;
    }
  }

  // --- Subscription ---
  @Subscription(() => HvacServiceTicketType, {
    name: SERVICE_TICKET_UPDATED_EVENT,
    filter: (payload, variables) => {
      // Only send the update to subscribers interested in this specific ticket
      return payload[SERVICE_TICKET_UPDATED_EVENT].id === variables.ticketId;
    },
    resolve: (payload) => {
      // The payload is what was published. The structure should match HvacServiceTicketType.
      return payload[SERVICE_TICKET_UPDATED_EVENT];
    },
  })
  hvacServiceTicketUpdatedSubscribe(@Args('ticketId', { type: () => ID }) ticketId: string) {
    this.checkFeatureEnabled('scheduling'); // Or a real-time specific flag
    this.logger.log(`Client subscribed to updates for HVAC service ticket ID: ${ticketId}`);
    // The string here must match the one used in pubSub.publish()
    return pubSub.asyncIterator(`${SERVICE_TICKET_UPDATED_EVENT}_${ticketId}`);
  }


}
