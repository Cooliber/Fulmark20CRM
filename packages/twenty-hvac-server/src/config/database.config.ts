/**
 * HVAC Database Configuration
 * "Pasja rodzi profesjonalizm" - Professional Database Setup
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class HvacDatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    return {
      type: 'postgres',
      host: this.configService.get('DATABASE_HOST', 'localhost'),
      port: this.configService.get('DATABASE_PORT', 5432),
      username: this.configService.get('DATABASE_USERNAME', 'twenty'),
      password: this.configService.get('DATABASE_PASSWORD', 'twenty'),
      database: this.configService.get('DATABASE_NAME', 'twenty_hvac'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: !isProduction, // Only in development
      logging: !isProduction ? ['query', 'error'] : ['error'],
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      extra: {
        max: 20, // Maximum number of connections
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
      retryAttempts: 3,
      retryDelay: 3000,
    };
  }
}