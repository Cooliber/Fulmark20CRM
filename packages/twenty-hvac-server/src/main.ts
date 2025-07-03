/**
 * HVAC Server Bootstrap
 * "Pasja rodzi profesjonalizm" - Professional HVAC System
 * 
 * Main entry point for the HVAC backend server
 * Runs on port 3002 by default
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
const compression = require('compression');
const helmet = require('helmet');
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('HvacBootstrap');
  
  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
      cors: true,
    });

    // Get configuration service
    const configService = app.get(ConfigService);
    const port = configService.get('PORT', 3002);
    const host = configService.get('HOST', '0.0.0.0');
    const nodeEnv = configService.get('NODE_ENV', 'development');

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }));

    // Compression middleware
    app.use(compression());

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // API prefix
    app.setGlobalPrefix('api/hvac');

    // CORS configuration
    app.enableCors({
      origin: configService.get('CORS_ORIGIN') || true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    // Swagger documentation (only in development)
    if (nodeEnv !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('HVAC API')
        .setDescription('Professional HVAC Management System API - "Pasja rodzi profesjonalizm"')
        .setVersion('1.0')
        .addTag('hvac', 'HVAC Operations')
        .addTag('customers', 'Customer Management')
        .addTag('equipment', 'Equipment Management')
        .addTag('service-tickets', 'Service Ticket Management')
        .addTag('analytics', 'Analytics and Reporting')
        .addBearerAuth()
        .build();
      
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/hvac/docs', app, document, {
        customSiteTitle: 'HVAC API Documentation',
        customfavIcon: '/favicon.ico',
        customCss: '.swagger-ui .topbar { display: none }',
      });
    }

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.log('SIGTERM received, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('SIGINT received, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });

    // Start the server
    await app.listen(port, host);
    
    logger.log('🔥 HVAC Server Successfully Started!');
    logger.log(`💪 "Pasja rodzi profesjonalizm" - Professional HVAC System`);
    logger.log(`🚀 Server running on: http://${host}:${port}`);
    logger.log(`📚 API Documentation: http://${host}:${port}/api/hvac/docs`);
    logger.log(`🌐 GraphQL Playground: http://${host}:${port}/graphql`);
    logger.log(`🏥 Health Check: http://${host}:${port}/api/hvac/health`);
    logger.log(`🌍 Environment: ${nodeEnv}`);
    
  } catch (error) {
    logger.error('❌ Failed to start HVAC server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('UnhandledRejection');
  logger.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new Logger('UncaughtException');
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();