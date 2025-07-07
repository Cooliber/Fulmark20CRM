import { CustomerAPIService, customerAPIService } from './CustomerAPIService';
import { trackHVACUserAction } from '../index';

// Mock trackHVACUserAction
jest.mock('../index', () => ({
  trackHVACUserAction: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = jest.fn();

const mockLogger = {
    warn: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

describe('CustomerAPIService', () => {
  let serviceInstance: CustomerAPIService;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
    (fetch as jest.Mock).mockClear();

    // Create a new instance for each test to ensure isolation if needed,
    // or use the singleton `customerAPIService` and reset its state if it has any.
    // For this service, its main state is the cache.
    serviceInstance = new CustomerAPIService();
    // Assign mock logger, similar to how it's done in the service file itself for the prototype
    (serviceInstance as any).logger = mockLogger;

    // Clear the cache of the service instance if it's not a new one each time
     serviceInstance['cache'].clear(); // Accessing private member for test reset

  });

  describe('fetchGraphQL', () => {
    it('should make a POST request with correct headers and body', async () => {
      const query = 'query Test { test }';
      const variables = { id: '1' };
      const mockToken = 'test-token';
      localStorageMock.setItem('twenty_session_token', mockToken);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { test: 'success' } }),
      });

      await serviceInstance['fetchGraphQL'](query, variables); // Accessing private method for specific test

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/graphql'), // Checks if CRM_GRAPHQL_URL is used
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`,
          },
          body: JSON.stringify({ query, variables }),
        }),
      );
    });

    it('should throw an error if response is not ok', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        text: async () => 'Internal Server Error',
      });
      await expect(serviceInstance['fetchGraphQL']('query {}')).rejects.toThrow('GraphQL API call failed: 500 Server Error - Internal Server Error');
    });

    it('should throw an error if GraphQL result contains errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ errors: [{ message: 'GraphQL error' }] }),
      });
      await expect(serviceInstance['fetchGraphQL']('query {}')).rejects.toThrow('GraphQL query failed: [{"message":"GraphQL error"}]');
    });
  });

  describe('getCustomers', () => {
    it('should fetch and return customers', async () => {
      const mockCustomers = [{ id: '1', name: 'Customer 1' }];
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { hvacCustomers: mockCustomers } }),
      });
      const customers = await serviceInstance.getCustomers();
      expect(customers).toEqual(mockCustomers);
      expect(fetch).toHaveBeenCalledTimes(1);
      // Optionally, check query string if it's static and important
    });
  });

  describe('getCustomerById', () => {
    it('should fetch and return a customer by ID', async () => {
      const mockCustomer = { id: '1', name: 'Customer 1' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { hvacCustomer: mockCustomer } }),
      });
      const customer = await serviceInstance.getCustomerById('1');
      expect(customer).toEqual(mockCustomer);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

     it('should return null if customer is not found (GraphQL returns null)', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { hvacCustomer: null } }),
      });
      const customer = await serviceInstance.getCustomerById('non-existent');
      expect(customer).toBeNull();
    });
  });

  describe('updateCustomer', () => {
    it('should send update mutation and return updated customer', async () => {
      const customerId = '1';
      const updates = { name: 'Updated Name' };
      const mockUpdatedCustomer = { id: customerId, name: 'Updated Name', email: 'test@example.com' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { updateHvacCustomer: mockUpdatedCustomer } }),
      });

      const result = await serviceInstance.updateCustomer(customerId, updates);
      expect(result).toEqual(mockUpdatedCustomer);
      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: expect.stringContaining(`UpdateHvacCustomerInput!`)
        })
      );
      // Check cache invalidation (simplified check)
      // This requires making the cache accessible or testing its effects indirectly
      const cacheKeyPart = customerId;
      const listCacheKeyPart = 'hvacCustomers';
      let hasInvalidatedSpecific = false;
      let hasInvalidatedList = false;
      const originalDelete = serviceInstance['cache'].delete;
      serviceInstance['cache'].delete = (key: string) => {
        if (key.includes(cacheKeyPart)) hasInvalidatedSpecific = true;
        if (key.includes(listCacheKeyPart)) hasInvalidatedList = true;
        return originalDelete.call(serviceInstance['cache'], key);
      };

      // Re-run to check invalidation (or spy on invalidateCustomerCache if made public/testable)
      // For this test, we'll assume it's called. A more robust test would spy on it.
      // This simplified check above is just for demonstration if direct spy is not straightforward.
      // Resetting the mock for the next call within this test if needed, or use separate tests.
       (fetch as jest.Mock).mockResolvedValueOnce({ // Mock fetch again for the cache test call
        ok: true,
        json: async () => ({ data: { updateHvacCustomer: mockUpdatedCustomer } }),
      });
      await serviceInstance.updateCustomer(customerId, updates); // Call again
      // Assert that invalidateCustomerCache was effectively called
      // This is tricky without direct spy. The above delete mock is a way.
      // expect(hasInvalidatedSpecific).toBe(true); // This test setup for cache is a bit manual
      // expect(hasInvalidatedList).toBe(true);
       serviceInstance['cache'].delete = originalDelete; // Restore original delete
    });
  });

  describe('Cache Logic', () => {
    it('should cache data on successful GET requests and return cached data', async () => {
        const customerId = 'cachedCust';
        const mockCustomer = { id: customerId, name: 'Cached Customer' };
         (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { hvacCustomer: mockCustomer } }),
        });

        // First call - should fetch and cache
        await serviceInstance.getCustomerById(customerId);
        expect(fetch).toHaveBeenCalledTimes(1);

        // Second call - should return from cache
        const cachedResult = await serviceInstance.getCustomerById(customerId);
        expect(cachedResult).toEqual(mockCustomer);
        expect(fetch).toHaveBeenCalledTimes(1); // Fetch not called again

        // Verify cache content (optional, internal detail)
        const cacheKey = `customer_hvacCustomer_${JSON.stringify({id: customerId})}`; // Approximate key
        // A more robust way would be to spy on cache.set and cache.get
    });

    it('should invalidate cache for a customer after update', async () => {
        const customerId = 'custToUpdate';
        const initialCustomer = { id: customerId, name: 'Initial Name', email: 'initial@example.com' };
        const updatedCustomerData = { name: 'Updated Name Via Test' };
        const finalUpdatedCustomer = {...initialCustomer, ...updatedCustomerData};

        // Prime the cache
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { hvacCustomer: initialCustomer } }),
        });
        await serviceInstance.getCustomerById(customerId);
        expect(fetch).toHaveBeenCalledTimes(1);


        // Call updateCustomer
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { updateHvacCustomer: finalUpdatedCustomer } }),
        });
        await serviceInstance.updateCustomer(customerId, updatedCustomerData);
        expect(fetch).toHaveBeenCalledTimes(2); // Called for get and then for update

        // Try to get the customer again - should fetch from API as cache should be invalid
        (fetch as jest.Mock).mockResolvedValueOnce({ // Mock fetch for the re-fetch
            ok: true,
            json: async () => ({ data: { hvacCustomer: finalUpdatedCustomer } }), // API returns newest
        });
        const customerAfterUpdate = await serviceInstance.getCustomerById(customerId);
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(customerAfterUpdate).toEqual(finalUpdatedCustomer);
    });
  });

});
