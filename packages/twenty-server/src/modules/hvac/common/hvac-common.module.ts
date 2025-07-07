import { Module } from '@nestjs/common';

import { HvacCacheService } from 'src/modules/hvac/common/services/hvac-cache.service';
import { HvacConfigService } from 'src/modules/hvac/common/services/hvac-config.service';
import { HvacMetricsService } from 'src/modules/hvac/common/services/hvac-metrics.service';
import { HvacValidationService } from 'src/modules/hvac/common/services/hvac-validation.service';

/**
 * HVAC Common Module
 * "Pasja rodzi profesjonalizm" - Shared HVAC services and utilities
 * 
 * Provides common services, standard objects, and utilities
 * used across all HVAC modules in TwentyCRM
 */
@Module({
  providers: [
    HvacConfigService,
    HvacCacheService,
    HvacMetricsService,
    HvacValidationService,
  ],
  exports: [
    HvacConfigService,
    HvacCacheService,
    HvacMetricsService,
    HvacValidationService,
  ],
})
export class HvacCommonModule {}
