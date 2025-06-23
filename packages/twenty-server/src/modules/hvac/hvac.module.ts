import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HvacConfigModule } from 'src/engine/core-modules/hvac-config/hvac-config.module';
import { HvacSentryModule } from './hvac-sentry.module';

// Entities
import { HvacServiceTicketWorkspaceEntity } from './standard-objects/hvac-service-ticket.workspace-entity';
import { HvacTechnicianWorkspaceEntity } from './standard-objects/hvac-technician.workspace-entity';
import { HvacEquipmentWorkspaceEntity } from './standard-objects/hvac-equipment.workspace-entity';
import { HvacMaintenanceRecordWorkspaceEntity } from './standard-objects/hvac-maintenance-record.workspace-entity';

// Services
import { HvacApiIntegrationService } from './services/hvac-api-integration.service';
import { HvacWeaviateService } from './services/hvac-weaviate.service';
import { HvacDataSyncService } from './services/hvac-data-sync.service';
import { HvacSchedulingEngineService } from './services/hvac-scheduling-engine.service';
import { HvacDispatchService } from './services/hvac-dispatch.service';
import { HvacPreventiveMaintenanceService } from './services/hvac-preventive-maintenance.service';

// Resolvers
import { HvacServiceTicketResolver } from './resolvers/hvac-service-ticket.resolver';
import { HvacSemanticSearchResolver } from './resolvers/hvac-semantic-search.resolver';

// Controllers
import { HvacHealthController } from './controllers/hvac-health.controller';

@Module({
  imports: [
    HvacConfigModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([
      HvacServiceTicketWorkspaceEntity,
      HvacTechnicianWorkspaceEntity,
      HvacEquipmentWorkspaceEntity,
      HvacMaintenanceRecordWorkspaceEntity,
    ], 'workspace'),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [
    HvacHealthController,
  ],
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
