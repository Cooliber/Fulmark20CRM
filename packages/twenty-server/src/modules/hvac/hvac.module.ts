import { Module } from '@nestjs/common';

import { HvacAnalyticsModule } from 'src/modules/hvac/analytics/hvac-analytics.module';
import { HvacCommonModule } from 'src/modules/hvac/common/hvac-common.module';
import { HvacEquipmentManagerModule } from 'src/modules/hvac/equipment-manager/hvac-equipment-manager.module';
import { HvacIntegrationHubModule } from 'src/modules/hvac/integration-hub/hvac-integration-hub.module';
import { HvacMaintenanceManagerModule } from 'src/modules/hvac/maintenance-manager/hvac-maintenance-manager.module';
import { HvacSchedulingEngineModule } from 'src/modules/hvac/scheduling-engine/hvac-scheduling-engine.module';
import { HvacServiceTicketManagerModule } from 'src/modules/hvac/service-ticket-manager/hvac-service-ticket-manager.module';
import { HvacController } from './hvac.controller';

/**
 * HVAC Module for TwentyCRM
 * "Pasja rodzi profesjonalizm" - Professional HVAC CRM Integration
 
 * Comprehensive HVAC management system integrated with TwentyCRM
 * Features: Service Tickets, Equipment Management, Maintenance Scheduling,
 * Analytics, IoT Integration, and Polish Market Compliance
 */
@Module({
  imports: [
    HvacCommonModule,
    HvacServiceTicketManagerModule,
    HvacEquipmentManagerModule,
    HvacMaintenanceManagerModule,
    HvacSchedulingEngineModule,
    HvacAnalyticsModule,
    HvacIntegrationHubModule,
  ],
  controllers: [HvacController],
  providers: [],
  exports: [],
})
export class HvacModule {}
