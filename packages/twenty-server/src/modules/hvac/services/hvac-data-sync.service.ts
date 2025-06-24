import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';
import { HvacApiIntegrationService } from './hvac-api-integration.service';
import { HvacSemanticDocument, HvacWeaviateService } from './hvac-weaviate.service';

export interface SyncStatus {
  lastSync: Date;
  totalSynced: number;
  errors: string[];
  isRunning: boolean;
}

export interface SyncMetrics {
  customers: {
    total: number;
    synced: number;
    errors: number;
  };
  serviceTickets: {
    total: number;
    synced: number;
    errors: number;
  };
  equipment: {
    total: number;
    synced: number;
    errors: number;
  };
  documents: {
    total: number;
    synced: number;
    errors: number;
  };
}

@Injectable()
export class HvacDataSyncService {
  private readonly logger = new Logger(HvacDataSyncService.name);
  private syncStatus: SyncStatus = {
    lastSync: new Date(),
    totalSynced: 0,
    errors: [],
    isRunning: false,
  };

  constructor(
    private readonly hvacApiService: HvacApiIntegrationService,
    private readonly weaviateService: HvacWeaviateService,
    private readonly hvacConfigService: HvacConfigService,
  ) {}

  // Run sync every hour with performance optimization
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledSync() {
    if (!this.hvacConfigService.isHvacFeatureEnabled('semanticSearch')) {
      this.logger.debug('Semantic search disabled, skipping scheduled sync');
      return;
    }

    // Check if sync is already running
    if (this.syncStatus.isRunning) {
      this.logger.warn('Sync already running, skipping scheduled sync');
      return;
    }

    // Check system load before starting sync
    const performanceConfig = this.hvacConfigService.getPerformanceConfig();
    if (this.shouldSkipSyncDueToLoad(performanceConfig)) {
      this.logger.warn('High system load detected, postponing sync');
      return;
    }

    this.logger.log('Starting scheduled HVAC data sync');
    await this.performFullSync();
  }

  private shouldSkipSyncDueToLoad(performanceConfig: any): boolean {
    // Simple load check - in production this would check actual system metrics
    const currentHour = new Date().getHours();
    // Skip during peak hours (9-17) if configured
    return performanceConfig.skipSyncDuringPeakHours && currentHour >= 9 && currentHour <= 17;
  }

  async performFullSync(): Promise<SyncMetrics> {
    if (this.syncStatus.isRunning) {
      throw new Error('Sync is already running');
    }

    this.syncStatus.isRunning = true;
    this.syncStatus.errors = [];
    const startTime = Date.now();

    const metrics: SyncMetrics = {
      customers: { total: 0, synced: 0, errors: 0 },
      serviceTickets: { total: 0, synced: 0, errors: 0 },
      equipment: { total: 0, synced: 0, errors: 0 },
      documents: { total: 0, synced: 0, errors: 0 },
    };

    try {
      this.logger.log('Starting full HVAC data sync');

      // Sync service tickets to semantic search
      await this.syncServiceTickets(metrics);

      // Sync equipment data
      await this.syncEquipment(metrics);

      // Sync customer data
      await this.syncCustomers(metrics);

      this.syncStatus.lastSync = new Date();
      this.syncStatus.totalSynced = 
        metrics.customers.synced + 
        metrics.serviceTickets.synced + 
        metrics.equipment.synced + 
        metrics.documents.synced;

      const duration = Date.now() - startTime;
      this.logger.log(`Full sync completed in ${duration}ms. Synced ${this.syncStatus.totalSynced} items`);

    } catch (error) {
      this.logger.error('Full sync failed', error);
      this.syncStatus.errors.push(`Full sync failed: ${error.message}`);
      throw error;
    } finally {
      this.syncStatus.isRunning = false;
    }

    return metrics;
  }

  private async syncServiceTickets(metrics: SyncMetrics): Promise<void> {
    try {
      this.logger.log('Syncing service tickets to semantic search');

      // Get service tickets from HVAC API with pagination
      let offset = 0;
      const batchSize = 50; // Smaller batches for better performance
      let hasMore = true;

      while (hasMore) {
        const tickets = await this.hvacApiService.getServiceTickets(batchSize, offset);

        if (tickets.length === 0) {
          hasMore = false;
          break;
        }

        metrics.serviceTickets.total += tickets.length;

        // Process tickets in parallel batches
        const batchPromises = tickets.map(async (ticket) => {
          try {
            // Create semantic document for service ticket
            const document: HvacSemanticDocument = {
              content: `${ticket.title}\n\n${ticket.description || ''}\n\nStatus: ${ticket.status}\nPriority: ${ticket.priority}\nService Type: ${ticket.serviceType}`,
              title: `Service Ticket: ${ticket.ticketNumber || ticket.title}`,
              type: 'service_report',
              metadata: {
                customerId: ticket.customerId,
                technicianId: ticket.technicianId,
                ticketId: ticket.id,
                timestamp: ticket.scheduledDate || new Date(),
                source: 'twenty_crm_service_ticket',
                language: 'pl',
                status: ticket.status,
                priority: ticket.priority,
                serviceType: ticket.serviceType,
                estimatedCost: ticket.estimatedCost,
              },
            };

            await this.weaviateService.insertDocument(document);
            return { success: true, ticketId: ticket.id };
          } catch (error) {
            this.logger.error(`Failed to sync service ticket ${ticket.id}`, error);
            this.syncStatus.errors.push(`Service ticket ${ticket.id}: ${error.message}`);
            return { success: false, ticketId: ticket.id, error };
          }
        });

        // Wait for batch to complete
        const results = await Promise.allSettled(batchPromises);

        // Count successes and failures
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.success) {
            metrics.serviceTickets.synced++;
          } else {
            metrics.serviceTickets.errors++;
          }
        });

        this.logger.debug(`Processed batch: ${results.length} tickets, offset: ${offset}`);

        offset += batchSize;

        // Add small delay between batches to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));

        // Stop if we got less than the batch size (last page)
        if (tickets.length < batchSize) {
          hasMore = false;
        }
      }

      this.logger.log(`Synced ${metrics.serviceTickets.synced}/${metrics.serviceTickets.total} service tickets`);
    } catch (error) {
      this.logger.error('Failed to sync service tickets', error);
      throw error;
    }
  }

  private async syncEquipment(metrics: SyncMetrics): Promise<void> {
    try {
      this.logger.log('Syncing equipment to semantic search');
      
      // Get equipment from HVAC API
      const equipment = await this.hvacApiService.getEquipment(100, 0);
      metrics.equipment.total = equipment.length;

      for (const item of equipment) {
        try {
          // Create semantic document for equipment
          const document: HvacSemanticDocument = {
            content: `Equipment: ${item.name}\nType: ${item.type}\nStatus: ${item.status}\nLast Maintenance: ${item.lastMaintenance || 'N/A'}\nNext Maintenance: ${item.nextMaintenance || 'N/A'}`,
            title: `Equipment: ${item.name}`,
            type: 'equipment_manual',
            metadata: {
              equipmentId: item.id,
              timestamp: item.lastMaintenance || new Date(),
              source: 'twenty_crm_equipment',
              language: 'pl',
              equipmentType: item.type,
              status: item.status,
              lastMaintenance: item.lastMaintenance,
              nextMaintenance: item.nextMaintenance,
            },
          };

          await this.weaviateService.insertDocument(document);
          metrics.equipment.synced++;
        } catch (error) {
          this.logger.error(`Failed to sync equipment ${item.id}`, error);
          metrics.equipment.errors++;
          this.syncStatus.errors.push(`Equipment ${item.id}: ${error.message}`);
        }
      }

      this.logger.log(`Synced ${metrics.equipment.synced}/${metrics.equipment.total} equipment items`);
    } catch (error) {
      this.logger.error('Failed to sync equipment', error);
      throw error;
    }
  }

  private async syncCustomers(metrics: SyncMetrics): Promise<void> {
    try {
      this.logger.log('Syncing customers to semantic search');
      
      // Get customers from HVAC API
      const customers = await this.hvacApiService.getCustomers(100, 0);
      metrics.customers.total = customers.length;

      for (const customer of customers) {
        try {
          // Create semantic document for customer
          const document: HvacSemanticDocument = {
            content: `Customer: ${customer.name}\nEmail: ${customer.email || 'N/A'}\nPhone: ${customer.phone || 'N/A'}\nAddress: ${customer.address ? `${customer.address.street}, ${customer.address.city}` : 'N/A'}\nProperties: ${customer.properties?.length || 0}`,
            title: `Customer: ${customer.name}`,
            type: 'customer_note',
            metadata: {
              customerId: customer.id,
              timestamp: new Date(),
              source: 'twenty_crm_customer',
              language: 'pl',
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              propertiesCount: customer.properties?.length || 0,
            },
          };

          await this.weaviateService.insertDocument(document);
          metrics.customers.synced++;
        } catch (error) {
          this.logger.error(`Failed to sync customer ${customer.id}`, error);
          metrics.customers.errors++;
          this.syncStatus.errors.push(`Customer ${customer.id}: ${error.message}`);
        }
      }

      this.logger.log(`Synced ${metrics.customers.synced}/${metrics.customers.total} customers`);
    } catch (error) {
      this.logger.error('Failed to sync customers', error);
      throw error;
    }
  }

  async syncSingleDocument(type: string, id: string, content: string, metadata: any): Promise<string> {
    try {
      const document: HvacSemanticDocument = {
        content,
        title: `${type}: ${metadata.title || id}`,
        type: type as any,
        metadata: {
          ...metadata,
          timestamp: new Date(),
          source: 'twenty_crm_manual',
          language: 'pl',
        },
      };

      const documentId = await this.weaviateService.insertDocument(document);
      this.logger.log(`Manually synced document: ${documentId}`);
      return documentId;
    } catch (error) {
      this.logger.error(`Failed to sync single document`, error);
      throw error;
    }
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  async forceSyncStop(): Promise<void> {
    if (this.syncStatus.isRunning) {
      this.logger.warn('Force stopping sync process');
      this.syncStatus.isRunning = false;
      this.syncStatus.errors.push('Sync force stopped');
    }
  }

  async getSemanticSearchStats(): Promise<any> {
    try {
      const documentCount = await this.weaviateService.getDocumentCount();
      const weaviateHealth = await this.weaviateService.checkHealth();
      const hvacApiHealth = await this.hvacApiService.checkApiHealth();

      return {
        totalDocuments: documentCount,
        lastSync: this.syncStatus.lastSync,
        totalSynced: this.syncStatus.totalSynced,
        errors: this.syncStatus.errors.length,
        isRunning: this.syncStatus.isRunning,
        services: {
          weaviate: weaviateHealth,
          hvacApi: hvacApiHealth,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get semantic search stats', error);
      throw error;
    }
  }
}
