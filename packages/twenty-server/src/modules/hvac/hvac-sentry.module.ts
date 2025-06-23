import { Module } from '@nestjs/common';
import { HvacSentryService } from './services/hvac-sentry.service';
import { TwentyConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';

/**
 * HVAC Sentry Module
 * Provides HVAC-specific error tracking and monitoring capabilities
 * "Pasja rodzi profesjonalizm"
 */
@Module({
  imports: [TwentyConfigModule],
  providers: [HvacSentryService],
  exports: [HvacSentryService],
})
export class HvacSentryModule {}
