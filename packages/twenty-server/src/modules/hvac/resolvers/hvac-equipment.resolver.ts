import { Resolver, Query, Mutation, Args, ID, Int, Float } from '@nestjs/graphql';
import { Injectable, UseGuards, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';
import { HvacApiIntegrationService, HvacEquipmentSummary } from '../services/hvac-api-integration.service'; // Assuming HvacEquipmentSummary is the type returned by service for lists
import {
  HvacEquipmentType,
  HvacMaintenanceRecordType,
  HvacEquipmentListResponse,
} from '../graphql-types/hvac-equipment.types';
import {
  HvacEquipmentFilterInput,
  CreateHvacEquipmentInput,
  UpdateHvacEquipmentInput,
  ScheduleHvacMaintenanceInput,
} from '../graphql-types/hvac-equipment.types'; // Re-using the same file for inputs for now
import { HvacEquipment as HvacEquipmentInterface, MaintenanceRecord as HvacMaintenanceRecordInterface } from '../services/EquipmentAPIService.types'; // Hypothetical import for service return types if different

@Resolver(() => HvacEquipmentType)
@Injectable()
@UseGuards(WorkspaceAuthGuard)
export class HvacEquipmentResolver {
  private readonly logger = new Logger(HvacEquipmentResolver.name);

  constructor(
    private readonly hvacConfigService: HvacConfigService,
    private readonly hvacApiService: HvacApiIntegrationService,
  ) {}

  private checkFeatureEnabled(feature: keyof ReturnType<HvacConfigService['getHvacFeatureFlags']>) {
    if (!this.hvacConfigService.isHvacFeatureEnabled(feature)) {
      const errorMessage = `HVAC feature '${feature}' is not enabled.`;
      this.logger.warn(errorMessage);
      throw new Error(errorMessage); // Consider throwing ForbiddenException
    }
  }

  // Assuming HvacApiIntegrationService returns HvacEquipmentSummary for lists and full HvacEquipmentInterface for single items.
  // We might need mappers if GraphQL types differ significantly from service return types.

  @Query(() => HvacEquipmentListResponse, { name: 'hvacEquipments' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getHvacEquipments(
    @Args('filters', { type: () => HvacEquipmentFilterInput, nullable: true }) filters?: HvacEquipmentFilterInput,
    @Args('page', { type: () => Int, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit?: number,
  ): Promise<HvacEquipmentListResponse> {
    this.checkFeatureEnabled('inventory'); // Assuming 'inventory' or similar feature flag

    try {
      this.logger.debug(`Fetching HVAC equipments with filters: ${JSON.stringify(filters)}, page: ${page}, limit: ${limit}`);
      // Note: The HvacApiIntegrationService.getEquipment currently returns HvacEquipmentSummary[]
      // We need to align this. For now, let's assume it can be adapted or returns enough info.
      // Or, HvacApiIntegrationService.getEquipment needs to be updated to support filtering and pagination as well
      // and return a structure like { equipment: [], total: number }

      // Placeholder: Adapt HvacApiIntegrationService.getEquipment or add a new method
      // For now, this won't directly map to a paginated/filtered result from the current HvacApiIntegrationService.getEquipment
      const equipmentSummaries = await this.hvacApiService.getEquipment(limit, (page -1) * limit);

      this.logger.debug(`Fetching HVAC equipments with filters: ${JSON.stringify(filters)}, page: ${page}, limit: ${limit}`);

      const result = await this.hvacApiService.getEquipment(filters, limit, (page - 1) * limit);

      // Assuming HvacEquipmentSummary[] is compatible enough with HvacEquipmentType[]
      // or that a field resolver on HvacEquipmentType would fetch more details if needed.
      return {
        equipment: result.equipment as any[], // Cast if HvacEquipmentSummary and HvacEquipmentType differ
        total: result.total,
      };
    } catch (error) {
      this.logger.error('Error fetching HVAC equipments:', error.message, error.stack);
      throw error;
    }
  }

  @Query(() => HvacEquipmentType, { name: 'hvacEquipment', nullable: true })
  async getHvacEquipmentById(@Args('id', { type: () => ID }) id: string): Promise<HvacEquipmentType | null> {
    this.checkFeatureEnabled('inventory');
    try {
      this.logger.debug(`Fetching HVAC equipment by ID: ${id}`);
      const equipment = await this.hvacApiService.getEquipmentById(id);
      // Assuming HvacEquipmentSummary can be cast or mapped to HvacEquipmentType
      return equipment as unknown as HvacEquipmentType;
    } catch (error) {
      this.logger.error(`Error fetching HVAC equipment by ID ${id}:`, error.message, error.stack);
      throw error;
    }
  }

  @Query(() => [HvacMaintenanceRecordType], { name: 'hvacEquipmentMaintenanceHistory', nullable: 'itemsAndList' })
  async getHvacEquipmentMaintenanceHistory(
    @Args('equipmentId', { type: () => ID }) equipmentId: string,
  ): Promise<HvacMaintenanceRecordType[] | null> {
    this.checkFeatureEnabled('maintenance');
    try {
      this.logger.debug(`Fetching maintenance history for equipment ID: ${equipmentId}`);
      // Assuming HvacApiIntegrationService will have a method like getMaintenanceHistoryForEquipment
      // const history = await this.hvacApiService.getMaintenanceHistoryForEquipment(equipmentId);
      // Placeholder:
      this.logger.debug(`Fetching maintenance history for equipment ID: ${equipmentId}`);
      const history = await this.hvacApiService.getMaintenanceHistoryForEquipment(equipmentId);
      return history as HvacMaintenanceRecordType[]; // Assuming MaintenanceRecord from service is compatible
    } catch (error) {
      this.logger.error(`Error fetching maintenance history for equipment ${equipmentId}:`, error.message, error.stack);
      throw error;
    }
  }

  @Query(() => [HvacEquipmentType], { name: 'hvacEquipmentNeedingService', nullable: 'itemsAndList' })
  async getHvacEquipmentNeedingService(): Promise<HvacEquipmentType[] | null> {
    this.checkFeatureEnabled('maintenance'); // Or a specific flag
    try {
      this.logger.debug('Fetching HVAC equipment needing service.');
      this.logger.debug('Fetching HVAC equipment needing service.');
      const equipment = await this.hvacApiService.fetchEquipmentNeedingService();
      return equipment as HvacEquipmentType[]; // Assuming HvacEquipmentSummary is compatible
    } catch (error) {
      this.logger.error('Error fetching HVAC equipment needing service:', error.message, error.stack);
      throw error;
    }
  }

  @Query(() => [HvacEquipmentType], { name: 'hvacEquipmentWithExpiringWarranties', nullable: 'itemsAndList' })
  async getHvacEquipmentWithExpiringWarranties(
    @Args('days', { type: () => Int, defaultValue: 30 }) days: number,
  ): Promise<HvacEquipmentType[] | null> {
    this.checkFeatureEnabled('inventory');
    try {
      this.logger.debug(`Fetching HVAC equipment with warranties expiring in ${days} days.`);
      this.logger.debug(`Fetching HVAC equipment with warranties expiring in ${days} days.`);
      const equipment = await this.hvacApiService.fetchEquipmentWithExpiringWarranties(days);
      return equipment as HvacEquipmentType[]; // Assuming HvacEquipmentSummary is compatible
    } catch (error) {
      this.logger.error(`Error fetching HVAC equipment with expiring warranties:`, error.message, error.stack);
      throw error;
    }
  }

  @Mutation(() => HvacEquipmentType, { name: 'createHvacEquipment' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createHvacEquipment(
    @Args('input') input: CreateHvacEquipmentInput,
  ): Promise<HvacEquipmentType> {
    this.checkFeatureEnabled('inventory');
    try {
      this.logger.log(`Attempting to create HVAC equipment with input: ${JSON.stringify(input)}`);
      this.logger.log(`Attempting to create HVAC equipment with input: ${JSON.stringify(input)}`);
      const newEquipment = await this.hvacApiService.createActualEquipment(input);
      // Assuming HvacEquipmentSummary returned by service is compatible enough for HvacEquipmentType response
      // or specific fields are guaranteed.
      return newEquipment as HvacEquipmentType;
    } catch (error) {
      this.logger.error(`Error creating HVAC equipment:`, error.message, error.stack);
      throw error;
    }
  }

  @Mutation(() => HvacEquipmentType, { name: 'updateHvacEquipment' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateHvacEquipment(
    @Args('input') input: UpdateHvacEquipmentInput,
  ): Promise<HvacEquipmentType> {
    this.checkFeatureEnabled('inventory');
    try {
      this.logger.log(`Attempting to update HVAC equipment with ID: ${input.id}`);
      this.logger.log(`Attempting to update HVAC equipment with ID: ${input.id}`);
      const updatedEquipment = await this.hvacApiService.updateActualEquipment(input.id, input);
      return updatedEquipment as HvacEquipmentType;
    } catch (error) {
      this.logger.error(`Error updating HVAC equipment ${input.id}:`, error.message, error.stack);
      throw error;
    }
  }

  @Mutation(() => Boolean, { name: 'deleteHvacEquipment' })
  async deleteHvacEquipment(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    this.checkFeatureEnabled('inventory');
    try {
      this.logger.log(`Attempting to delete HVAC equipment with ID: ${id}`);
      this.logger.log(`Attempting to delete HVAC equipment with ID: ${id}`);
      await this.hvacApiService.deleteActualEquipment(id);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting HVAC equipment ${id}:`, error.message, error.stack);
      // Depending on API contract, you might want to return false or throw the error
      // For GraphQL, throwing the error is often preferred so client can see it.
      throw error;
    }
  }

  @Mutation(() => HvacMaintenanceRecordType, { name: 'scheduleHvacMaintenance' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async scheduleHvacMaintenance(
    @Args('input') input: ScheduleHvacMaintenanceInput,
  ): Promise<HvacMaintenanceRecordType> {
    this.checkFeatureEnabled('maintenance');
    try {
      this.logger.log(`Attempting to schedule maintenance: ${JSON.stringify(input)}`);
      this.logger.log(`Attempting to schedule maintenance: ${JSON.stringify(input)}`);
      const newMaintenanceRecord = await this.hvacApiService.scheduleActualMaintenance(input);
      // Assuming MaintenanceRecord from service is compatible with HvacMaintenanceRecordType
      return newMaintenanceRecord as HvacMaintenanceRecordType;
    } catch (error) {
      this.logger.error(`Error scheduling maintenance:`, error.message, error.stack);
      throw error;
    }
  }
}
