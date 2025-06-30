import { Test, TestingModule } from '@nestjs/testing';
import { HttpService, HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config'; // Assuming TwentyConfigService uses this or similar
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse, AxiosRequestHeaders } from 'axios';

import { HvacApiIntegrationService } from './hvac-api-integration.service';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { HvacSentryService } from './hvac-sentry.service';
import {
  HvacApiNotFoundError,
  HvacApiServerError,
  HvacApiTimeoutError,
  HvacApiUnauthorizedError,
  HvacApiBadRequestError,
} from '../exceptions/hvac-api.exceptions';
import { CreateHvacEquipmentInput, HvacEquipmentTypeEnum } from '../graphql-types/hvac-equipment.types'; // For example input
import { Logger } from '@nestjs/common';


// Mock HvacSentryService
class MockHvacSentryService {
  async monitorHVACApiOperation<T>(name: string, endpoint: string, operation: () => Promise<T>): Promise<T> {
    return operation();
  }
}

describe('HvacApiIntegrationService', () => {
  let service: HvacApiIntegrationService;
  let httpService: HttpService;
  // HvacConfigService is used internally by the service, so we don't mock it directly here unless testing HvacConfigService itself.
  // We mock TwentyConfigService which is a dependency of HvacConfigService.

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        HvacApiIntegrationService,
        HvacConfigService, // Real HvacConfigService
        {
          provide: TwentyConfigService, // Mock its dependency
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'HVAC_API_URL') return 'http://fakehvacapi.com';
              if (key === 'HVAC_API_KEY') return 'fakekey';
              if (key === 'HVAC_API_VERSION') return 'v1';
              if (key === 'HVAC_API_TIMEOUT') return 5000;
              return null;
            }),
          },
        },
        { provide: HvacSentryService, useClass: MockHvacSentryService },
        { provide: Logger, useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() } },
      ],
    }).compile();

    service = module.get<HvacApiIntegrationService>(HvacApiIntegrationService);
    httpService = module.get<HttpService>(HttpService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('performOptimizedRequest', () => {
    it('should return data on successful GET request', async () => {
      const mockData = { id: '1', name: 'Test Item' };
      const axiosResponse: AxiosResponse = {
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as AxiosRequestHeaders },
      };
      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(axiosResponse));

      const { data, metrics } = await (service as any).performOptimizedRequest('GET', '/test-success');
      expect(data).toEqual(mockData);
      expect(metrics.cacheHit).toBe(false);
      expect(metrics.retryCount).toBe(0);
      expect(httpService.get).toHaveBeenCalledWith('http://fakehvacapi.com/api/v1/test-success', expect.anything());
    });

    it('should use cache on subsequent GET requests', async () => {
      const mockData = { id: '1', name: 'Cached Item' };
      const axiosResponse: AxiosResponse = {data: mockData, status: 200, statusText: 'OK', headers: {}, config: { headers: {} as AxiosRequestHeaders }};
      const httpGetSpy = jest.spyOn(httpService, 'get').mockReturnValueOnce(of(axiosResponse));

      await (service as any).performOptimizedRequest('GET', '/test-caching'); // First call
      const { data, metrics } = await (service as any).performOptimizedRequest('GET', '/test-caching'); // Second call

      expect(data).toEqual(mockData);
      expect(metrics.cacheHit).toBe(true);
      expect(httpGetSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw HvacApiNotFoundError on 404', async () => {
      const error: Partial<AxiosError> = {isAxiosError: true, response: {data: { message: 'Not Found' }, status: 404, statusText: 'Not Found', headers: {}, config: { headers: {} as AxiosRequestHeaders }}};
      jest.spyOn(httpService, 'get').mockReturnValueOnce(throwError(() => error as AxiosError));

      await expect((service as any).performOptimizedRequest('GET', '/notfound')).rejects.toThrow(HvacApiNotFoundError);
    });

    it('should throw HvacApiUnauthorizedError on 401', async () => {
      const error: Partial<AxiosError> = {isAxiosError: true, response: {data: { message: 'Unauthorized' }, status: 401, statusText: 'Unauthorized', headers: {}, config: { headers: {} as AxiosRequestHeaders }}};
      jest.spyOn(httpService, 'get').mockReturnValueOnce(throwError(() => error as AxiosError));
      await expect((service as any).performOptimizedRequest('GET', '/unauthorized')).rejects.toThrow(HvacApiUnauthorizedError);
    });

    it('should throw HvacApiTimeoutError on request timeout (ECONNABORTED)', async () => {
      const error: Partial<AxiosError> = {isAxiosError: true, code: 'ECONNABORTED', message: 'timeout of 5000ms exceeded'};
      jest.spyOn(httpService, 'get').mockReturnValueOnce(throwError(() => error as AxiosError));
      await expect((service as any).performOptimizedRequest('GET', '/timeout-test')).rejects.toThrow(HvacApiTimeoutError);
    });

    it('should retry failed requests up to MAX_RETRIES for server errors', async () => {
      const error: Partial<AxiosError> = {isAxiosError: true, response: {data: { message: 'Server Error' }, status: 500, statusText: 'Server Error', headers: {}, config: { headers: {} as AxiosRequestHeaders } }};
      const maxRetries = (service as any).MAX_RETRIES;
      const httpGetSpy = jest.spyOn(httpService, 'get');
      for (let i = 0; i <= maxRetries; i++) {
         httpGetSpy.mockReturnValueOnce(throwError(() => error as AxiosError));
      }

      await expect((service as any).performOptimizedRequest('GET', '/retry-test')).rejects.toThrow(HvacApiServerError);
      expect(httpGetSpy).toHaveBeenCalledTimes(maxRetries + 1);
    }, 15000); // Increased timeout for retry test
  });

  describe('getCustomerById', () => {
    it('should return customer data when API returns 200', async () => {
      const mockCustomer = { id: 'cust1', name: 'Customer One' };
      jest.spyOn(service as any, 'performOptimizedRequest').mockResolvedValueOnce({
        data: mockCustomer,
        metrics: { cacheHit: false, responseTime: 100, retryCount: 0, endpoint: '/customers/cust1'}
      });

      const customer = await service.getCustomerById('cust1');
      expect(customer).toEqual(mockCustomer);
      expect((service as any).performOptimizedRequest).toHaveBeenCalledWith("GET", "/customers/cust1");
    });

    it('should return null when performOptimizedRequest throws HvacApiNotFoundError', async () => {
      jest.spyOn(service as any, 'performOptimizedRequest').mockRejectedValueOnce(new HvacApiNotFoundError('customer'));
      const customer = await service.getCustomerById('unknown');
      expect(customer).toBeNull();
    });

    it('should re-throw other HvacApiExceptions from performOptimizedRequest', async () => {
      jest.spyOn(service as any, 'performOptimizedRequest').mockRejectedValueOnce(new HvacApiServerError('Internal error'));
      await expect(service.getCustomerById('errorId')).rejects.toThrow(HvacApiServerError);
    });
  });

  describe('getCommunicationsList', () => {
    it('should fetch communications with filters and pagination from API', async () => {
      const mockCommData = [{ id: 'comm1', subject: 'Test Email' }];
      // Assume API returns this structure, or HvacApiIntegrationService maps to it
      const mockApiResponse = { data: mockCommData, totalCount: 5 };

      jest.spyOn(service as any, 'performOptimizedRequest').mockResolvedValueOnce({
        data: mockApiResponse,
        metrics: { cacheHit: false, responseTime: 100, retryCount: 0, endpoint: '/communications' }
      });

      const filters = { customerId: 'cust123', type: 'EMAIL' };
      const result = await service.getCommunicationsList(filters as any, 10, 0);

      expect((service as any).performOptimizedRequest).toHaveBeenCalledWith(
        'GET',
        '/communications',
        undefined,
        expect.objectContaining({
          customerId: 'cust123',
          type: 'EMAIL',
          limit: 10,
          offset: 0
        })
      );
      expect(result.communications).toEqual(mockCommData);
      expect(result.total).toEqual(5);
    });

    it('should handle empty communication list from API', async () => {
      const mockApiResponse = { data: [], totalCount: 0 };
      jest.spyOn(service as any, 'performOptimizedRequest').mockResolvedValueOnce({
        data: mockApiResponse,
        metrics: { cacheHit: false, responseTime: 50, retryCount: 0, endpoint: '/communications' }
      });

      const result = await service.getCommunicationsList({} as any, 10, 0);
      expect(result.communications).toEqual([]);
      expect(result.total).toEqual(0);
    });

    it('should throw an error if performOptimizedRequest fails', async () => {
      jest.spyOn(service as any, 'performOptimizedRequest').mockRejectedValueOnce(new HvacApiServerError('API failure'));
      await expect(service.getCommunicationsList({} as any, 10, 0)).rejects.toThrow(HvacApiServerError);
    });
  });

  // TODO: Add similar describe blocks and tests for other HvacApiIntegrationService methods:
  // - getEquipment (with filters and pagination)
  // - createActualEquipment, updateActualEquipment, deleteActualEquipment
  // - getMaintenanceHistoryForEquipment, scheduleActualMaintenance
  // - fetchEquipmentNeedingService, fetchEquipmentWithExpiringWarranties
  // - getCommunicationDetailsById, createActualCommunicationRecord, etc.
  // - All ServiceTicket methods
  // - All Contract methods
  // - getCustomerInsights
});
