import { Resolver, Query, Mutation, Args, ID, Int, Float } from '@nestjs/graphql';
import { Injectable, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { HvacConfigService } from '../../../config/hvac-config/hvac-config.service';
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
} from '../graphql-types/hvac-equipment.types';
import { HvacApiNotFoundError } from '../exceptions/hvac-api.exceptions';
// Removed hypothetical import as service should align with GraphQL types

@Resolver(() => HvacEquipmentType)
@Injectable()
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
      // The service method getEquipment is expected to handle offset calculation correctly.
      const result = await this.hvacApiService.getEquipment(filters, limit, (page - 1) * limit);

      return {
        // Assuming HvacEquipmentSummary from service is compatible with HvacEquipmentType
        equipment: result.equipment as HvacEquipmentType[],
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
      if (!equipment) return null;
      // Assuming HvacEquipmentSummary from service is compatible with HvacEquipmentType
      return equipment as HvacEquipmentType;
    } catch (error) {
      this.logger.error(`Error fetching HVAC equipment by ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HvacApiNotFoundError) return null;
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
      const history = await this.hvacApiService.getMaintenanceHistoryForEquipment(equipmentId);
      // Assuming MaintenanceRecord from service is compatible with HvacMaintenanceRecordType
      return history as HvacMaintenanceRecordType[];
    } catch (error) {
      this.logger.error(`Error fetching maintenance history for equipment ${equipmentId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [HvacEquipmentType], { name: 'hvacEquipmentNeedingService', nullable: 'itemsAndList' })
  async getHvacEquipmentNeedingService(): Promise<HvacEquipmentType[] | null> {
    this.checkFeatureEnabled('maintenance'); // Or a specific flag
    try {
      this.logger.debug('Fetching HVAC equipment needing service.');
      const equipment = await this.hvacApiService.fetchEquipmentNeedingService();
      // Assuming HvacEquipmentSummary from service is compatible with HvacEquipmentType
      return equipment as HvacEquipmentType[];
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
      const equipment = await this.hvacApiService.fetchEquipmentWithExpiringWarranties(days);
      // Assuming HvacEquipmentSummary from service is compatible with HvacEquipmentType
      return equipment as HvacEquipmentType[];
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
      const newEquipment = await this.hvacApiService.createActualEquipment(input);
      // Assuming HvacEquipmentSummary from service is compatible with HvacEquipmentType
      return newEquipment as HvacEquipmentType;
    } catch (error) {
      this.logger.error(`Error creating HVAC equipment:`, error.message, error.stack);
      throw error;
    }
  }

  @Mutation(() => HvacEquipmentType, { name: 'updateHvacEquipment', nullable: true })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateHvacEquipment(
    @Args('input') input: UpdateHvacEquipmentInput,
  ): Promise<HvacEquipmentType | null> {
    this.checkFeatureEnabled('inventory');
    try {
      this.logger.log(`Attempting to update HVAC equipment with ID: ${input.id}`);
      const { id, ...updateData } = input;
      const updatedEquipment = await this.hvacApiService.updateActualEquipment(id, updateData);
      // Assuming HvacEquipmentSummary from service is compatible with HvacEquipmentType
      return updatedEquipment as HvacEquipmentType;
    } catch (error) {
      this.logger.error(`Error updating HVAC equipment ${input.id}: ${error.message}`, error.stack);
      if (error instanceof HvacApiNotFoundError) return null;
      throw error;
    }
  }

  @Mutation(() => Boolean, { name: 'deleteHvacEquipment', nullable: true })
  async deleteHvacEquipment(@Args('id', { type: () => ID }) id: string): Promise<boolean | null> {
    this.checkFeatureEnabled('inventory');
    try {
      this.logger.log(`Attempting to delete HVAC equipment with ID: ${id}`);
      const success = await this.hvacApiService.deleteActualEquipment(id);
      return success;
    } catch (error) {
      this.logger.error(`Error deleting HVAC equipment ${id}: ${error.message}`, error.stack);
      if (error instanceof HvacApiNotFoundError) return null;
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
      const newMaintenanceRecord = await this.hvacApiService.scheduleActualMaintenance(input);
      // Assuming MaintenanceRecord from service is compatible with HvacMaintenanceRecordType
      return newMaintenanceRecord as HvacMaintenanceRecordType;
    } catch (error) {
      this.logger.error(`Error scheduling maintenance:`, error.message, error.stack);
      throw error;
    }
  }
}
