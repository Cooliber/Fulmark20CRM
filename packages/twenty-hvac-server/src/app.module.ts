/**
 * HVAC Server Application Module
 * "Pasja rodzi profesjonalizm" - Professional HVAC System
 * 
 * Main application module for the HVAC backend server
 * Integrates all HVAC modules and provides core functionality
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

// HVAC Modules
import { HvacModule } from './modules/hvac/hvac.module';
import { HvacConfigModule } from './config/hvac-config/hvac-config.module';
import { HvacHealthModule } from './modules/hvac/health/hvac-health.module';

// Configuration
import { HvacGraphQLConfig } from './config/graphql.config';
import { HvacDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    // Core Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.development'],
      cache: true,
    }),

    // GraphQL Configuration
    GraphQLModule.forRootAsync<YogaDriverConfig>({
      driver: YogaDriver,
      useClass: HvacGraphQLConfig,
    }),

    // Cache Configuration with Redis
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
          },
          password: process.env.REDIS_PASSWORD,
          database: parseInt(process.env.HVAC_REDIS_DB || '2'),
          // keyPrefix: 'hvac:', // Removed - not supported in this Redis client version
        }),
        ttl: parseInt(process.env.HVAC_CACHE_TTL || '3600') * 1000, // Convert to milliseconds
      }),
    }),

    // Scheduling and Events
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Health Checks
    TerminusModule,

    // HVAC Configuration
    HvacConfigModule,

    // Main HVAC Module
    HvacModule,

    // HVAC Health Module
    HvacHealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  constructor() {
    console.log('🔥 HVAC Server Module Initialized');
    console.log('💪 "Pasja rodzi profesjonalizm" - Professional HVAC System');
    console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Port: ${process.env.PORT || 3002}`);
  }
}