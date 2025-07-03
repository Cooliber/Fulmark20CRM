/**
 * HVAC Customer 360 Hooks
 * "Pasja rodzi profesjonalizm" - Professional Customer 360 view for HVAC
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript without 'any' types
 * - Max 150 lines per component
 * - Event handlers over useEffect
 */

import { useCallback, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';

// Customer 360 data structure
export interface Customer360Data {
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    nip?: string;
    regon?: string;
    address?: string;
    status: 'active' | 'inactive' | 'prospect' | 'vip';
    totalValue: number;
    lifetimeValue: number;
    satisfactionScore: number;
    createdAt: string;
    updatedAt: string;
  };
  insights?: {
    financialMetrics: {
      totalRevenue: number;
      lifetimeValue: number;
      averageOrderValue: number;
      monthlyRecurringRevenue: number;
    };
    riskIndicators: {
      churnRisk: number;
      paymentRisk: number;
      satisfactionTrend: number;
    };
    behaviorMetrics: {
      serviceFrequency: number;
      responseTime: number;
      issueResolutionRate: number;
    };
  };
  equipment: HvacEquipmentItem[];
  tickets: HvacServiceTicketItem[];
  communications: CommunicationItem[];
  contracts: ContractItem[];
}

// Supporting interfaces
export interface HvacEquipmentItem {
  id: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  installationDate: string;
  warrantyExpiry?: string;
  status: 'active' | 'maintenance' | 'retired';
}

export interface HvacServiceTicketItem {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  createdAt: string;
  completedAt?: string;
}

export interface CommunicationItem {
  id: string;
  type: 'email' | 'phone' | 'sms' | 'meeting';
  subject: string;
  date: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'replied';
}

export interface ContractItem {
  id: string;
  type: 'maintenance' | 'service' | 'installation';
  startDate: string;
  endDate: string;
  value: number;
  status: 'active' | 'expired' | 'cancelled';
}

// Hook options
export interface UseCustomer360Options {
  autoLoad?: boolean;
  enableCache?: boolean;
  refreshInterval?: number;
  onError?: (error: Error) => void;
  onDataLoaded?: (data: Customer360Data) => void;
}

// Hook return type
export interface UseCustomer360Return {
  data: Customer360Data | null;
  loading: boolean;
  error: Error | null;
  refreshCustomerData: () => Promise<void>;
  clearError: () => void;
  updateCustomer: (updates: Partial<Customer360Data['customer']>) => Promise<void>;
}

/**
 * Main Customer 360 hook
 */
export const useCustomer360 = (
  customerId: string,
  options: UseCustomer360Options = {}
): UseCustomer360Return => {
  const {
    autoLoad = true,
    enableCache = true,
    refreshInterval,
    onError,
    onDataLoaded,
  } = options;

  const [data, setData] = useState<Customer360Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Mock data for development
  const mockCustomer360Data: Customer360Data = {
    customer: {
      id: customerId,
      name: 'Firma HVAC Sp. z o.o.',
      email: 'kontakt@firmahvac.pl',
      phone: '+48 123 456 789',
      nip: '1234567890',
      regon: '123456789',
      address: 'ul. Przykładowa 123, 00-001 Warszawa',
      status: 'active',
      totalValue: 125000,
      lifetimeValue: 450000,
      satisfactionScore: 8.5,
      createdAt: '2023-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    insights: {
      financialMetrics: {
        totalRevenue: 125000,
        lifetimeValue: 450000,
        averageOrderValue: 5200,
        monthlyRecurringRevenue: 8500,
      },
      riskIndicators: {
        churnRisk: 0.15,
        paymentRisk: 0.05,
        satisfactionTrend: 0.85,
      },
      behaviorMetrics: {
        serviceFrequency: 12,
        responseTime: 2.5,
        issueResolutionRate: 0.95,
      },
    },
    equipment: [
      {
        id: 'eq-1',
        type: 'Heat Pump',
        brand: 'Vaillant',
        model: 'aroTHERM plus VWL 125/6 A',
        serialNumber: 'VWL125-2023-001',
        installationDate: '2023-03-15T10:00:00Z',
        warrantyExpiry: '2026-03-15T10:00:00Z',
        status: 'active',
      },
    ],
    tickets: [
      {
        id: 'ticket-1',
        title: 'Przegląd roczny pompy ciepła',
        description: 'Rutynowy przegląd i konserwacja pompy ciepła Vaillant',
        status: 'completed',
        priority: 'medium',
        createdAt: '2024-01-10T09:00:00Z',
        completedAt: '2024-01-10T15:30:00Z',
      },
    ],
    communications: [
      {
        id: 'comm-1',
        type: 'email',
        subject: 'Potwierdzenie wizyty serwisowej',
        date: '2024-01-09T14:30:00Z',
        direction: 'outbound',
        status: 'read',
      },
    ],
    contracts: [
      {
        id: 'contract-1',
        type: 'maintenance',
        startDate: '2023-03-15T10:00:00Z',
        endDate: '2025-03-15T10:00:00Z',
        value: 24000,
        status: 'active',
      },
    ],
  };

  const loadCustomerData = useCallback(async () => {
    if (!customerId) return;

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setData(mockCustomer360Data);
      onDataLoaded?.(mockCustomer360Data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load customer data');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [customerId, onError, onDataLoaded]);

  const refreshCustomerData = useCallback(async () => {
    await loadCustomerData();
  }, [loadCustomerData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateCustomer = useCallback(async (updates: Partial<Customer360Data['customer']>) => {
    if (!data) return;

    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setData(prev => prev ? {
        ...prev,
        customer: { ...prev.customer, ...updates }
      } : null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update customer');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [data, onError]);

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad && customerId) {
      loadCustomerData();
    }
  }, [autoLoad, customerId, loadCustomerData]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval && customerId) {
      const interval = setInterval(loadCustomerData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, customerId, loadCustomerData]);

  return {
    data,
    loading,
    error,
    refreshCustomerData,
    clearError,
    updateCustomer,
  };
};

/**
 * Customer list hook for managing multiple customers
 */
export const useCustomerList = (filters?: {
  status?: string;
  search?: string;
  limit?: number;
}) => {
  const [customers, setCustomers] = useState<Customer360Data['customer'][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock customer list
      const mockCustomers: Customer360Data['customer'][] = [
        {
          id: 'cust-1',
          name: 'Firma HVAC Sp. z o.o.',
          email: 'kontakt@firmahvac.pl',
          phone: '+48 123 456 789',
          status: 'active',
          totalValue: 125000,
          lifetimeValue: 450000,
          satisfactionScore: 8.5,
          createdAt: '2023-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      setCustomers(mockCustomers);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load customers');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return {
    customers,
    loading,
    error,
    refetch: loadCustomers,
  };
};
