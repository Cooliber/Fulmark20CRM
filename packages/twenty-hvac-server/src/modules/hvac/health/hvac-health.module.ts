/**
 * HVAC Health Module
 * "Pasja rodzi profesjonalizm" - Professional HVAC Health Monitoring
 * 
 * Provides HVAC health indicators for integration with Twenty's health system
 */

import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HvacHealthIndicator } from './hvac.health';
import { HvacModule } from '../hvac.module';

@Module({
  imports: [
    TerminusModule,
    HvacModule, // Import HVAC module for services
  ],
  providers: [
    HvacHealthIndicator,
  ],
  exports: [
    HvacHealthIndicator,
  ],
})
export class HvacHealthModule {}
