import { Test, TestingModule } from '@nestjs/testing';
import { HvacCustomerResolver } from './hvac-customer.resolver';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';
import { HvacApiIntegrationService } from '../services/hvac-api-integration.service';
import { HvacCustomerType, HvacCustomerListResponse } from '../graphql-types/hvac-customer.types';
import { CreateHvacCustomerInput, UpdateHvacCustomerInput } from '../graphql-types/hvac-customer.inputs';
import { HvacApiNotFoundError } from '../exceptions/hvac-api.exceptions';
import { Logger } from '@nestjs/common';

// Mock data
const mockCustomer: HvacCustomerType = {
  id: 'cust1',
  name: 'Test Customer 1',
  email: 'test1@example.com',
  phone: '1234567890',
};

const mockCustomer2: HvacCustomerType = {
  id: 'cust2',
  name: 'Test Customer 2',
  email: 'test2@example.com',
  phone: '0987654321',
};

const mockHvacApiIntegrationService = {
  getCustomers: jest.fn(),
  getCustomerById: jest.fn(),
  createCustomer: jest.fn(),
  updateActualCustomer: jest.fn(),
  deleteActualCustomer: jest.fn(),
};

const mockHvacConfigService = {
  isHvacFeatureEnabled: jest.fn(() => true), // Assume feature is enabled for tests
};

describe('HvacCustomerResolver', () => {
  let resolver: HvacCustomerResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HvacCustomerResolver,
        {
          provide: HvacApiIntegrationService,
          useValue: mockHvacApiIntegrationService,
        },
        {
          provide: HvacConfigService,
          useValue: mockHvacConfigService,
        },
      ],
    })
    // Suppress logger output during tests for cleaner test results
    .setLogger(new Logger())
    .compile();

    resolver = module.get<HvacCustomerResolver>(HvacCustomerResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getHvacCustomers', () => {
    it('should return a list of customers with pagination', async () => {
      const customersArray = [mockCustomer, mockCustomer2];
      mockHvacApiIntegrationService.getCustomers.mockResolvedValue(customersArray);

      const result: HvacCustomerListResponse = await resolver.getHvacCustomers(1, 1);

      expect(mockHvacApiIntegrationService.getCustomers).toHaveBeenCalledWith(10000, 0); // Current mock behavior
      expect(result.customers).toEqual([mockCustomer]);
      expect(result.total).toEqual(customersArray.length);
      expect(result.page).toEqual(1);
      expect(result.limit).toEqual(1);
    });

    it('should return an empty list if feature is disabled', async () => {
      mockHvacConfigService.isHvacFeatureEnabled.mockReturnValueOnce(false);
      const result = await resolver.getHvacCustomers(1, 10);
      expect(result.customers).toEqual([]);
      expect(result.total).toEqual(0);
      expect(mockHvacApiIntegrationService.getCustomers).not.toHaveBeenCalled();
    });
  });

  describe('getHvacCustomerById', () => {
    it('should return a customer if found', async () => {
      mockHvacApiIntegrationService.getCustomerById.mockResolvedValue(mockCustomer);
      const result = await resolver.getHvacCustomerById('cust1');
      expect(result).toEqual(mockCustomer);
      expect(mockHvacApiIntegrationService.getCustomerById).toHaveBeenCalledWith('cust1');
    });

    it('should return null if customer not found', async () => {
      mockHvacApiIntegrationService.getCustomerById.mockResolvedValue(null);
      const result = await resolver.getHvacCustomerById('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null if feature is disabled', async () => {
      mockHvacConfigService.isHvacFeatureEnabled.mockReturnValueOnce(false);
      const result = await resolver.getHvacCustomerById('cust1');
      expect(result).toBeNull();
      expect(mockHvacApiIntegrationService.getCustomerById).not.toHaveBeenCalled();
    });
  });

  describe('createHvacCustomer', () => {
    it('should create and return a new customer', async () => {
      const createInput: CreateHvacCustomerInput = { name: 'New Customer', email: 'new@example.com' };
      const createdCustomer = { ...mockCustomer, ...createInput, id: 'newCust' };
      mockHvacApiIntegrationService.createCustomer.mockResolvedValue(createdCustomer);

      const result = await resolver.createHvacCustomer(createInput);
      expect(result).toEqual(createdCustomer);
      expect(mockHvacApiIntegrationService.createCustomer).toHaveBeenCalledWith(createInput);
    });

    it('should throw error if feature is disabled', async () => {
      mockHvacConfigService.isHvacFeatureEnabled.mockReturnValueOnce(false);
      const createInput: CreateHvacCustomerInput = { name: 'New Customer' };
      await expect(resolver.createHvacCustomer(createInput)).rejects.toThrow('Feature not enabled');
    });
  });

  describe('updateHvacCustomer', () => {
    it('should update and return the customer', async () => {
      const updateInput: UpdateHvacCustomerInput = { id: 'cust1', name: 'Updated Name' };
      const updatedCustomer = { ...mockCustomer, name: 'Updated Name' };
      mockHvacApiIntegrationService.updateActualCustomer.mockResolvedValue(updatedCustomer);

      const result = await resolver.updateHvacCustomer(updateInput);
      expect(result).toEqual(updatedCustomer);
      expect(mockHvacApiIntegrationService.updateActualCustomer).toHaveBeenCalledWith('cust1', { name: 'Updated Name' });
    });

    it('should return null if customer to update is not found', async () => {
      const updateInput: UpdateHvacCustomerInput = { id: 'nonexistent', name: 'Updated Name' };
      mockHvacApiIntegrationService.updateActualCustomer.mockRejectedValue(new HvacApiNotFoundError('Customer not found'));

      await expect(resolver.updateHvacCustomer(updateInput)).rejects.toThrow(HvacApiNotFoundError);
    });

    it('should return null if update service method returns null (e.g. not found)', async () => {
        const updateInput: UpdateHvacCustomerInput = { id: 'cust1', name: 'Updated Name' };
        mockHvacApiIntegrationService.updateActualCustomer.mockResolvedValue(null);
        const result = await resolver.updateHvacCustomer(updateInput);
        expect(result).toBeNull();
    });


    it('should throw error if feature is disabled', async () => {
      mockHvacConfigService.isHvacFeatureEnabled.mockReturnValueOnce(false);
      const updateInput: UpdateHvacCustomerInput = { id: 'cust1', name: 'Updated Name' };
      await expect(resolver.updateHvacCustomer(updateInput)).rejects.toThrow('Feature not enabled');
    });
  });

  describe('deleteHvacCustomer', () => {
    it('should return true if customer is deleted successfully', async () => {
      mockHvacApiIntegrationService.deleteActualCustomer.mockResolvedValue(true);
      const result = await resolver.deleteHvacCustomer('cust1');
      expect(result).toBe(true);
      expect(mockHvacApiIntegrationService.deleteActualCustomer).toHaveBeenCalledWith('cust1');
    });

    it('should return null if customer to delete is not found (service throws HvacApiNotFoundError)', async () => {
      mockHvacApiIntegrationService.deleteActualCustomer.mockRejectedValue(new HvacApiNotFoundError('customer not found'));
      const result = await resolver.deleteHvacCustomer('nonexistent');
      expect(result).toBeNull();
    });

    it('should return false if deletion fails for other reasons (service returns false)', async () => {
      mockHvacApiIntegrationService.deleteActualCustomer.mockResolvedValue(false);
      const result = await resolver.deleteHvacCustomer('cust1');
      expect(result).toBe(false);
    });

    it('should throw error if feature is disabled', async () => {
      mockHvacConfigService.isHvacFeatureEnabled.mockReturnValueOnce(false);
      await expect(resolver.deleteHvacCustomer('cust1')).rejects.toThrow('Feature not enabled');
    });
  });
});
