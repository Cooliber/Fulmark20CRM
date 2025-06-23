import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { HvacApiIntegrationService, HvacServiceTicketData } from '../services/hvac-api-integration.service';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';

// GraphQL Types
import { ObjectType, Field, InputType, Int } from '@nestjs/graphql';

@ObjectType()
export class HvacServiceTicketType {
  @Field(() => ID)
  id: string;

  @Field()
  ticketNumber: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  status: string;

  @Field()
  priority: string;

  @Field()
  serviceType: string;

  @Field({ nullable: true })
  customerId?: string;

  @Field({ nullable: true })
  technicianId?: string;

  @Field(() => [String], { nullable: true })
  equipmentIds?: string[];

  @Field({ nullable: true })
  scheduledDate?: Date;

  @Field({ nullable: true })
  estimatedCost?: number;

  @Field({ nullable: true })
  serviceAddress?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class CreateHvacServiceTicketInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  status: string;

  @Field()
  priority: string;

  @Field()
  serviceType: string;

  @Field({ nullable: true })
  customerId?: string;

  @Field({ nullable: true })
  technicianId?: string;

  @Field(() => [String], { nullable: true })
  equipmentIds?: string[];

  @Field({ nullable: true })
  scheduledDate?: Date;

  @Field({ nullable: true })
  estimatedCost?: number;

  @Field({ nullable: true })
  serviceAddress?: string;
}

@InputType()
export class UpdateHvacServiceTicketInput {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  priority?: string;

  @Field({ nullable: true })
  serviceType?: string;

  @Field({ nullable: true })
  customerId?: string;

  @Field({ nullable: true })
  technicianId?: string;

  @Field(() => [String], { nullable: true })
  equipmentIds?: string[];

  @Field({ nullable: true })
  scheduledDate?: Date;

  @Field({ nullable: true })
  estimatedCost?: number;

  @Field({ nullable: true })
  serviceAddress?: string;
}

@ObjectType()
export class HvacServiceTicketsConnection {
  @Field(() => [HvacServiceTicketType])
  edges: HvacServiceTicketType[];

  @Field(() => Int)
  totalCount: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}

@Resolver(() => HvacServiceTicketType)
@Injectable()
@UseGuards(WorkspaceAuthGuard)
export class HvacServiceTicketResolver {
  constructor(
    private readonly hvacApiService: HvacApiIntegrationService,
    private readonly hvacConfigService: HvacConfigService,
  ) {}

  @Query(() => HvacServiceTicketsConnection, { name: 'hvacServiceTickets' })
  async getHvacServiceTickets(
    @Args('first', { type: () => Int, defaultValue: 20 }) first: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<HvacServiceTicketsConnection> {
    // Check if HVAC features are enabled
    if (!this.hvacConfigService.isHvacFeatureEnabled('scheduling')) {
      throw new Error('HVAC service tickets feature is not enabled');
    }

    const tickets = await this.hvacApiService.getServiceTickets(first, offset);
    
    return {
      edges: tickets.map(this.mapToGraphQLType),
      totalCount: tickets.length, // In a real implementation, you'd get this from the API
      hasNextPage: tickets.length === first,
      hasPreviousPage: offset > 0,
    };
  }

  @Query(() => HvacServiceTicketType, { name: 'hvacServiceTicket', nullable: true })
  async getHvacServiceTicket(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<HvacServiceTicketType | null> {
    const ticket = await this.hvacApiService.getServiceTicketById(id);
    
    if (!ticket) {
      return null;
    }

    return this.mapToGraphQLType(ticket);
  }

  @Mutation(() => HvacServiceTicketType, { name: 'createHvacServiceTicket' })
  async createHvacServiceTicket(
    @Args('input') input: CreateHvacServiceTicketInput,
  ): Promise<HvacServiceTicketType> {
    // Check if HVAC features are enabled
    if (!this.hvacConfigService.isHvacFeatureEnabled('scheduling')) {
      throw new Error('HVAC service tickets feature is not enabled');
    }

    const ticketData: HvacServiceTicketData = {
      ...input,
      // Generate ticket number if not provided
      ticketNumber: this.generateTicketNumber(),
      // Convert string address to object if provided
      serviceAddress: input.serviceAddress ? this.parseAddressString(input.serviceAddress) : undefined,
    };

    const createdTicket = await this.hvacApiService.createServiceTicket(ticketData);
    
    return this.mapToGraphQLType(createdTicket);
  }

  @Mutation(() => HvacServiceTicketType, { name: 'updateHvacServiceTicket' })
  async updateHvacServiceTicket(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateHvacServiceTicketInput,
  ): Promise<HvacServiceTicketType> {
    const updateData = {
      ...input,
      // Convert string address to object if provided
      serviceAddress: input.serviceAddress ? this.parseAddressString(input.serviceAddress) : undefined,
    };

    const updatedTicket = await this.hvacApiService.updateServiceTicket(id, updateData);

    return this.mapToGraphQLType(updatedTicket);
  }

  private mapToGraphQLType(ticket: HvacServiceTicketData): HvacServiceTicketType {
    return {
      id: ticket.id || '',
      ticketNumber: ticket.ticketNumber || '',
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      serviceType: ticket.serviceType,
      customerId: ticket.customerId,
      technicianId: ticket.technicianId,
      equipmentIds: ticket.equipmentIds,
      scheduledDate: ticket.scheduledDate,
      estimatedCost: ticket.estimatedCost,
      serviceAddress: ticket.serviceAddress ? JSON.stringify(ticket.serviceAddress) : undefined,
      createdAt: new Date(), // In a real implementation, this would come from the API
      updatedAt: new Date(), // In a real implementation, this would come from the API
    };
  }

  private parseAddressString(addressString: string): { street?: string; city?: string; state?: string; postalCode?: string; country?: string } {
    // Simple address parsing - in a real implementation, you might use a more sophisticated parser
    // Expected format: "Street, City, State PostalCode, Country" or variations
    try {
      const parts = addressString.split(',').map(part => part.trim());

      if (parts.length >= 2) {
        return {
          street: parts[0] || undefined,
          city: parts[1] || undefined,
          state: parts[2] || undefined,
          postalCode: parts[3] || undefined,
          country: parts[4] || 'Poland', // Default to Poland for HVAC business
        };
      } else {
        // If parsing fails, treat the entire string as street address
        return {
          street: addressString,
          country: 'Poland',
        };
      }
    } catch (error) {
      // Fallback: treat entire string as street address
      return {
        street: addressString,
        country: 'Poland',
      };
    }
  }

  private generateTicketNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `HVAC-${timestamp}-${random}`.toUpperCase();
  }
}
