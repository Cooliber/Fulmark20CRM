import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HvacConfigModule } from 'src/engine/core-modules/hvac-config/hvac-config.module';

import { HvacSentryModule } from './hvac-sentry.module';

import { HvacHealthController } from './controllers/hvac-health.controller';
import { HvacSemanticSearchResolver } from './resolvers/hvac-semantic-search.resolver';
import { HvacServiceTicketResolver } from './resolvers/hvac-service-ticket.resolver';
import { HvacApiIntegrationService } from './services/hvac-api-integration.service';
import { HvacDataSyncService } from './services/hvac-data-sync.service';
import { HvacDispatchService } from './services/hvac-dispatch.service';
import { HvacPreventiveMaintenanceService } from './services/hvac-preventive-maintenance.service';
import { HvacSchedulingEngineService } from './services/hvac-scheduling-engine.service';
import { HvacWeaviateService } from './services/hvac-weaviate.service';
import { HvacEquipmentWorkspaceEntity } from './standard-objects/hvac-equipment.workspace-entity';
import { HvacMaintenanceRecordWorkspaceEntity } from './standard-objects/hvac-maintenance-record.workspace-entity';
import { HvacServiceTicketWorkspaceEntity } from './standard-objects/hvac-service-ticket.workspace-entity';
import { HvacTechnicianWorkspaceEntity } from './standard-objects/hvac-technician.workspace-entity';

@Module({
  imports: [
    HvacConfigModule,
    HvacSentryModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature(
      [
        HvacServiceTicketWorkspaceEntity,
        HvacTechnicianWorkspaceEntity,
        HvacEquipmentWorkspaceEntity,
        HvacMaintenanceRecordWorkspaceEntity,
      ],
      'workspace',
    ),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [HvacHealthController],
  providers: [
    // Services
    HvacApiIntegrationService,
    HvacWeaviateService,
    HvacDataSyncService,
    HvacSchedulingEngineService,
    HvacDispatchService,
    HvacPreventiveMaintenanceService,

    // Resolvers
    HvacServiceTicketResolver,
    HvacSemanticSearchResolver,
  ],
  exports: [
    HvacApiIntegrationService,
    HvacWeaviateService,
    HvacDataSyncService,
    HvacSchedulingEngineService,
    HvacDispatchService,
    HvacPreventiveMaintenanceService,
  ],
})
export class HvacModule {}
