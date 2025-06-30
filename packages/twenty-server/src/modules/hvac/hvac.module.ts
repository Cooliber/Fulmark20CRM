import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { HvacConfigModule } from 'src/engine/core-modules/hvac-config/hvac-config.module';

import { HvacSentryModule } from './hvac-sentry.module';

import { HvacHealthController } from './controllers/hvac-health.controller';
import { HvacProductionMonitoringController } from './controllers/hvac-production-monitoring.controller';
import { HvacSemanticSearchResolver } from './resolvers/hvac-semantic-search.resolver';
import { HvacServiceTicketResolver } from './resolvers/hvac-service-ticket.resolver';
import { HvacAlertNotificationService } from './services/hvac-alert-notification.service';
import { HvacApiIntegrationService } from './services/hvac-api-integration.service';
import { HvacCacheManagerService } from './services/hvac-cache-manager.service';
import { HvacCircuitBreakerService } from './services/hvac-circuit-breaker.service';
import { HvacDataSyncService } from './services/hvac-data-sync.service';
import { HvacDatabaseOptimizerService } from './services/hvac-database-optimizer.service';
import { HvacDispatchService } from './services/hvac-dispatch.service';
import { HvacErrorHandlerService } from './services/hvac-error-handler.service';
import { HvacMetricsService } from './services/hvac-metrics.service';
import { HvacPreventiveMaintenanceService } from './services/hvac-preventive-maintenance.service';
import { HvacProductionMonitoringService } from './services/hvac-production-monitoring.service';
import { HvacRedisCacheService } from './services/hvac-redis-cache.service';
import { HvacSchedulingEngineService } from './services/hvac-scheduling-engine.service';
import { HvacSentryService } from './services/hvac-sentry.service';
import { HvacWeaviateService } from './services/hvac-weaviate.service';

@Module({
  imports: [
    HvacConfigModule,
    HvacSentryModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [HvacHealthController, HvacProductionMonitoringController],
  providers: [
    // Core Services
    HvacSentryService,
    HvacCacheManagerService,
    HvacRedisCacheService,
    HvacApiIntegrationService,
    HvacWeaviateService,
    HvacDataSyncService,

    // Resilience Services
    HvacCircuitBreakerService,
    HvacErrorHandlerService,

    // Performance Services
    HvacDatabaseOptimizerService,
    HvacMetricsService,

    // Business Logic Services
    HvacSchedulingEngineService,
    HvacDispatchService,
    HvacPreventiveMaintenanceService,

    // Monitoring Services
    HvacProductionMonitoringService,
    HvacAlertNotificationService,

    // Resolvers
    HvacServiceTicketResolver,
    HvacSemanticSearchResolver,
  ],
  exports: [
    // Core Services
    HvacSentryService,
    HvacCacheManagerService,
    HvacRedisCacheService,
    HvacApiIntegrationService,
    HvacWeaviateService,
    HvacDataSyncService,

    // Resilience Services
    HvacCircuitBreakerService,
    HvacErrorHandlerService,

    // Performance Services
    HvacDatabaseOptimizerService,
    HvacMetricsService,

    // Business Logic Services
    HvacSchedulingEngineService,
    HvacDispatchService,
    HvacPreventiveMaintenanceService,

    // Monitoring Services
    HvacProductionMonitoringService,
    HvacAlertNotificationService,
  ],
})
export class HvacModule {}
