import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

export interface HvacCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  properties?: HvacProperty[];
}

export interface HvacProperty {
  id: string;
  address: string;
  propertyType: string;
  equipmentList: HvacEquipmentSummary[];
}

export interface HvacEquipmentSummary {
  id: string;
  name: string;
  type: string;
  status: string;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

export interface HvacServiceTicketData {
  id?: string;
  ticketNumber?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  serviceType: string;
  customerId?: string;
  technicianId?: string;
  equipmentIds?: string[];
  scheduledDate?: Date;
  estimatedCost?: number;
  serviceAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface HvacSearchQuery {
  query: string;
  filters?: {
    type?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
    customerId?: string;
    equipmentId?: string;
  };
  limit?: number;
  offset?: number;
}

export interface HvacSearchResult {
  id: string;
  type: 'customer' | 'ticket' | 'equipment' | 'maintenance';
  title: string;
  description: string;
  relevanceScore: number;
  metadata: Record<string, any>;
}

@Injectable()
export class HvacApiIntegrationService {
  private readonly logger = new Logger(HvacApiIntegrationService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly hvacConfigService: HvacConfigService,
  ) {}

  private getApiHeaders() {
    const config = this.hvacConfigService.getHvacApiConfig();
    return {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private getApiUrl(endpoint: string): string {
    const config = this.hvacConfigService.getHvacApiConfig();
    return `${config.url}/api/${config.version}${endpoint}`;
  }

  // Customer Management
  async getCustomers(limit = 50, offset = 0): Promise<HvacCustomer[]> {
    try {
      const url = this.getApiUrl('/customers');
      const response: AxiosResponse<{ customers: HvacCustomer[] }> = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getApiHeaders(),
          params: { limit, offset },
        }),
      );

      return response.data.customers || [];
    } catch (error) {
      this.logger.error('Failed to fetch customers from HVAC API', error);
      throw new Error('Failed to fetch customers');
    }
  }

  async getCustomerById(customerId: string): Promise<HvacCustomer | null> {
    try {
      const url = this.getApiUrl(`/customers/${customerId}`);
      const response: AxiosResponse<HvacCustomer> = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getApiHeaders(),
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch customer ${customerId} from HVAC API`, error);
      return null;
    }
  }

  async createCustomer(customerData: Partial<HvacCustomer>): Promise<HvacCustomer> {
    try {
      const url = this.getApiUrl('/customers');
      const response: AxiosResponse<HvacCustomer> = await firstValueFrom(
        this.httpService.post(url, customerData, {
          headers: this.getApiHeaders(),
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to create customer in HVAC API', error);
      throw new Error('Failed to create customer');
    }
  }

  // Service Ticket Management
  async getServiceTickets(limit = 50, offset = 0): Promise<HvacServiceTicketData[]> {
    try {
      const url = this.getApiUrl('/tickets');
      const response: AxiosResponse<{ tickets: HvacServiceTicketData[] }> = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getApiHeaders(),
          params: { limit, offset },
        }),
      );

      return response.data.tickets || [];
    } catch (error) {
      this.logger.error('Failed to fetch service tickets from HVAC API', error);
      throw new Error('Failed to fetch service tickets');
    }
  }

  async getServiceTicketById(ticketId: string): Promise<HvacServiceTicketData | null> {
    try {
      const url = this.getApiUrl(`/tickets/${ticketId}`);
      const response: AxiosResponse<HvacServiceTicketData> = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getApiHeaders(),
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch service ticket ${ticketId} from HVAC API`, error);
      return null;
    }
  }

  async createServiceTicket(ticketData: HvacServiceTicketData): Promise<HvacServiceTicketData> {
    try {
      const url = this.getApiUrl('/tickets');
      const response: AxiosResponse<HvacServiceTicketData> = await firstValueFrom(
        this.httpService.post(url, ticketData, {
          headers: this.getApiHeaders(),
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to create service ticket in HVAC API', error);
      throw new Error('Failed to create service ticket');
    }
  }

  async updateServiceTicket(ticketId: string, ticketData: Partial<HvacServiceTicketData>): Promise<HvacServiceTicketData> {
    try {
      const url = this.getApiUrl(`/tickets/${ticketId}`);
      const response: AxiosResponse<HvacServiceTicketData> = await firstValueFrom(
        this.httpService.put(url, ticketData, {
          headers: this.getApiHeaders(),
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update service ticket ${ticketId} in HVAC API`, error);
      throw new Error('Failed to update service ticket');
    }
  }

  // Equipment Management
  async getEquipment(limit = 50, offset = 0): Promise<HvacEquipmentSummary[]> {
    try {
      const url = this.getApiUrl('/equipment');
      const response: AxiosResponse<{ equipment: HvacEquipmentSummary[] }> = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getApiHeaders(),
          params: { limit, offset },
        }),
      );

      return response.data.equipment || [];
    } catch (error) {
      this.logger.error('Failed to fetch equipment from HVAC API', error);
      throw new Error('Failed to fetch equipment');
    }
  }

  async getEquipmentById(equipmentId: string): Promise<HvacEquipmentSummary | null> {
    try {
      const url = this.getApiUrl(`/equipment/${equipmentId}`);
      const response: AxiosResponse<HvacEquipmentSummary> = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getApiHeaders(),
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch equipment ${equipmentId} from HVAC API`, error);
      return null;
    }
  }

  // Semantic Search Integration
  async performSemanticSearch(searchQuery: HvacSearchQuery): Promise<HvacSearchResult[]> {
    try {
      const url = this.getApiUrl('/search');
      const response: AxiosResponse<{ results: HvacSearchResult[] }> = await firstValueFrom(
        this.httpService.post(url, searchQuery, {
          headers: this.getApiHeaders(),
        }),
      );

      return response.data.results || [];
    } catch (error) {
      this.logger.error('Failed to perform semantic search in HVAC API', error);
      throw new Error('Failed to perform semantic search');
    }
  }

  // AI Insights Integration
  async getCustomerInsights(customerId: string): Promise<any> {
    try {
      const url = this.getApiUrl(`/customers/${customerId}/insights`);
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getApiHeaders(),
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch customer insights for ${customerId} from HVAC API`, error);
      throw new Error('Failed to fetch customer insights');
    }
  }

  // Health Check
  async checkApiHealth(): Promise<boolean> {
    try {
      const config = this.hvacConfigService.getHvacApiConfig();
      const url = `${config.url}/health`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getApiHeaders(),
          timeout: 5000,
        }),
      );

      return response.status === 200;
    } catch (error) {
      this.logger.error('HVAC API health check failed', error);
      return false;
    }
  }
}
