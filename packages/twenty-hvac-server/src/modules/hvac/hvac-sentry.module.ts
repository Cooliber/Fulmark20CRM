import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HvacSentryService } from './services/hvac-sentry.service';

/**
 * HVAC Sentry Module
 * Provides HVAC-specific error tracking and monitoring capabilities
 * "Pasja rodzi profesjonalizm"
 */
@Module({
  imports: [ConfigModule],
  providers: [HvacSentryService],
  exports: [HvacSentryService],
})
export class HvacSentryModule {}
