import { Test, TestingModule } from '@nestjs/testing';
import { HvacEquipmentResolver } from './hvac-equipment.resolver';
import { HvacApiIntegrationService } from '../services/hvac-api-integration.service';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';
import { CreateHvacEquipmentInput, HvacEquipmentFilterInput, UpdateHvacEquipmentInput, ScheduleHvacMaintenanceInput } from '../graphql-types/hvac-equipment.types';
import { HvacApiNotFoundError } from '../exceptions/hvac-api.exceptions';
import { Logger } from '@nestjs/common';

// Mock services
const mockHvacApiIntegrationService = {
  getEquipment: jest.fn(),
  getEquipmentById: jest.fn(),
  createActualEquipment: jest.fn(),
  updateActualEquipment: jest.fn(),
  deleteActualEquipment: jest.fn(),
  getMaintenanceHistoryForEquipment: jest.fn(),
  scheduleActualMaintenance: jest.fn(),
  fetchEquipmentNeedingService: jest.fn(),
  fetchEquipmentWithExpiringWarranties: jest.fn(),
};

const mockHvacConfigService = {
  isHvacFeatureEnabled: jest.fn(() => true), // Default to true for most tests
  getHvacApiConfig: jest.fn(() => ({
    url: 'http://testhvac.api',
    apiKey: 'testkey',
    version: 'v1',
    timeout: 30000,
  })),
};

describe('HvacEquipmentResolver', () => {
  let resolver: HvacEquipmentResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HvacEquipmentResolver,
        { provide: HvacApiIntegrationService, useValue: mockHvacApiIntegrationService },
        { provide: HvacConfigService, useValue: mockHvacConfigService },
        // Logger can be mocked or provided if its absence causes issues
        { provide: Logger, useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() } },
      ],
    }).compile();

    resolver = module.get<HvacEquipmentResolver>(HvacEquipmentResolver);

    // Reset mocks before each test
    jest.clearAllMocks();
    mockHvacConfigService.isHvacFeatureEnabled.mockReturnValue(true); // Reset to default
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getHvacEquipments', () => {
    it('should return equipment list and total', async () => {
      const mockResponse = { equipment: [{ id: 'eq1', name: 'Unit 1' }], total: 1 };
      mockHvacApiIntegrationService.getEquipment.mockResolvedValue(mockResponse);
      const filters: HvacEquipmentFilterInput = { customerId: 'cust1' };
      const result = await resolver.getHvacEquipments(filters, 1, 10);
      expect(result).toEqual(mockResponse);
      expect(mockHvacApiIntegrationService.getEquipment).toHaveBeenCalledWith(filters, 10, 0); // page 1, limit 10 -> offset 0
    });

    it('should throw error if feature is disabled', async () => {
      mockHvacConfigService.isHvacFeatureEnabled.mockReturnValue(false);
      await expect(resolver.getHvacEquipments({}, 1, 10)).rejects.toThrow("HVAC feature 'inventory' is not enabled.");
    });
  });

  describe('getHvacEquipmentById', () => {
    it('should return equipment if found', async () => {
      const mockEquipment = { id: 'eq1', name: 'Unit 1' };
      mockHvacApiIntegrationService.getEquipmentById.mockResolvedValue(mockEquipment);
      const result = await resolver.getHvacEquipmentById('eq1');
      expect(result).toEqual(mockEquipment);
      expect(mockHvacApiIntegrationService.getEquipmentById).toHaveBeenCalledWith('eq1');
    });

    it('should return null if not found (service returns null)', async () => {
      mockHvacApiIntegrationService.getEquipmentById.mockResolvedValue(null);
      const result = await resolver.getHvacEquipmentById('unknown');
      expect(result).toBeNull();
    });
  });

  describe('createHvacEquipment', () => {
    it('should create and return equipment', async () => {
      const input: CreateHvacEquipmentInput = { name: 'New Unit', customerId: 'cust1', type: 'AIR_CONDITIONING' as any, brand: 'TestBrand', model: 'T1000', serialNumber: 'SN123', installationDate: new Date() };
      const mockCreatedEquipment = { id: 'eq-new', ...input };
      mockHvacApiIntegrationService.createActualEquipment.mockResolvedValue(mockCreatedEquipment);

      const result = await resolver.createHvacEquipment(input);
      expect(result).toEqual(mockCreatedEquipment);
      expect(mockHvacApiIntegrationService.createActualEquipment).toHaveBeenCalledWith(input);
    });
  });

  describe('updateHvacEquipment', () => {
    it('should update and return equipment', async () => {
      const input: UpdateHvacEquipmentInput = { id: 'eq1', name: 'Updated Unit Name' };
      const mockUpdatedEquipment = { id: 'eq1', name: 'Updated Unit Name', customerId: 'cust1' /* other fields */ };
      // For update, the service might fetch the current and then merge, or API does.
      // Here, we just mock the return of the update operation.
      mockHvacApiIntegrationService.updateActualEquipment.mockResolvedValue(mockUpdatedEquipment);
      // Mock getEquipmentById if the resolver's placeholder logic for update uses it.
      // However, the resolver was updated to directly call updateActualEquipment.

      const result = await resolver.updateHvacEquipment(input);
      expect(result).toEqual(mockUpdatedEquipment);
      expect(mockHvacApiIntegrationService.updateActualEquipment).toHaveBeenCalledWith(input.id, input);
    });
  });

  describe('deleteHvacEquipment', () => {
    it('should return true on successful deletion', async () => {
      mockHvacApiIntegrationService.deleteActualEquipment.mockResolvedValue(true);
      const result = await resolver.deleteHvacEquipment('eq1');
      expect(result).toBe(true);
      expect(mockHvacApiIntegrationService.deleteActualEquipment).toHaveBeenCalledWith('eq1');
    });
  });

  describe('scheduleHvacMaintenance', () => {
    it('should schedule maintenance and return the record', async () => {
      const input: ScheduleHvacMaintenanceInput = { equipmentId: 'eq1', scheduledDate: new Date(), type: 'maintenance' as any, description: 'Annual check', priority: 'MEDIUM' as any};
      const mockMaintenanceRecord = { id: 'maint1', ...input };
      mockHvacApiIntegrationService.scheduleActualMaintenance.mockResolvedValue(mockMaintenanceRecord);

      const result = await resolver.scheduleHvacMaintenance(input);
      expect(result).toEqual(mockMaintenanceRecord);
      expect(mockHvacApiIntegrationService.scheduleActualMaintenance).toHaveBeenCalledWith(input);
    });
  });

  // TODO: Add tests for:
  // - getHvacEquipmentMaintenanceHistory
  // - getHvacEquipmentNeedingService
  // - getHvacEquipmentWithExpiringWarranties
  // - Cases where HvacApiIntegrationService throws specific errors (e.g., HvacApiNotFoundError)
  // - Validation pipe integration (if not covered by e2e/request-level tests)
});
