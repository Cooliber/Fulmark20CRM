/**
 * HVAC Integration Hub Service
 * "Pasja rodzi profesjonalizm" - Professional integration ecosystem
 * 
 * Central hub for all external integrations and IoT connectivity
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

interface IoTDevice {
  deviceId: string;
  deviceType: 'thermostat' | 'sensor' | 'controller' | 'meter';
  location: string;
  customerId: string;
  lastSeen: Date;
  status: 'online' | 'offline' | 'maintenance';
  firmware: string;
  manufacturer: string;
  model: string;
}

interface IoTSensorData {
  deviceId: string;
  timestamp: Date;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  airQuality?: number;
  energyConsumption?: number;
  operatingMode?: string;
  errorCodes?: string[];
}

interface MobileAppIntegration {
  appType: 'technician' | 'customer' | 'manager';
  userId: string;
  deviceToken: string;
  platform: 'ios' | 'android';
  appVersion: string;
  lastActive: Date;
}

interface AccountingSystemIntegration {
  systemType: 'ifirma' | 'wfirma' | 'fakturownia' | 'sap' | 'custom';
  apiEndpoint: string;
  credentials: EncryptedCredentials;
  syncEnabled: boolean;
  lastSync: Date;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class HvacIntegrationHubService {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(HvacIntegrationHubService.name);
  private readonly connectedDevices = new Map<string, IoTDevice>();
  private readonly mobileConnections = new Map<string, MobileAppIntegration>();

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * IoT Device Management for Polish HVAC equipment
   */
  async registerIoTDevice(device: IoTDevice): Promise<void> {
    // Validate device against Polish HVAC standards
    await this.validateDeviceCompliance(device);
    
    this.connectedDevices.set(device.deviceId, device);
    
    // Set up real-time monitoring
    await this.setupDeviceMonitoring(device);
    
    // Notify relevant stakeholders
    this.eventEmitter.emit('iot.device.registered', {
      deviceId: device.deviceId,
      customerId: device.customerId,
      deviceType: device.deviceType,
    });

    this.logger.log(`IoT device registered: ${device.deviceId} for customer ${device.customerId}`);
  }

  async processIoTSensorData(data: IoTSensorData): Promise<void> {
    const device = this.connectedDevices.get(data.deviceId);
    if (!device) {
      this.logger.warn(`Received data from unknown device: ${data.deviceId}`);
      return;
    }

    // Validate and normalize sensor data
    const normalizedData = await this.normalizeSensorData(data);
    
    // Check for anomalies and alerts
    const alerts = await this.analyzeForAnomalies(normalizedData, device);
    
    // Store data for analytics
    await this.storeSensorData(normalizedData);
    
    // Real-time updates to connected clients
    this.broadcastSensorUpdate(normalizedData, device);
    
    // Process alerts if any
    if (alerts.length > 0) {
      await this.processDeviceAlerts(alerts, device);
    }
  }

  /**
   * Mobile App Integration for Technicians and Customers
   */
  async registerMobileApp(integration: MobileAppIntegration): Promise<void> {
    this.mobileConnections.set(integration.userId, integration);
    
    // Send welcome notification
    await this.sendPushNotification(integration.deviceToken, {
      title: 'Witamy w aplikacji HVAC',
      body: 'Aplikacja została pomyślnie połączona z systemem',
      data: { type: 'welcome' },
    });

    this.logger.log(`Mobile app registered for user: ${integration.userId}`);
  }

  async sendTechnicianNotification(technicianId: string, notification: TechnicianNotification): Promise<void> {
    const mobileApp = this.mobileConnections.get(technicianId);
    if (!mobileApp || mobileApp.appType !== 'technician') {
      this.logger.warn(`No mobile app found for technician: ${technicianId}`);
      return;
    }

    await this.sendPushNotification(mobileApp.deviceToken, {
      title: notification.title,
      body: notification.message,
      data: {
        type: 'service_assignment',
        ticketId: notification.ticketId,
        priority: notification.priority,
        customerAddress: notification.customerAddress,
      },
    });

    // Also send via WebSocket for real-time updates
    this.server.to(`technician_${technicianId}`).emit('notification', notification);
  }

  /**
   * Polish Accounting Systems Integration
   */
  async integrateAccountingSystem(config: AccountingSystemIntegration): Promise<void> {
    try {
      // Test connection
      await this.testAccountingConnection(config);
      
      // Set up automatic invoice sync
      await this.setupInvoiceSync(config);
      
      // Configure tax compliance for Polish regulations
      await this.configurePolishTaxCompliance(config);
      
      this.logger.log(`Accounting system integrated: ${config.systemType}`);
    } catch (error) {
      this.logger.error(`Failed to integrate accounting system: ${config.systemType}`, error);
      throw error;
    }
  }

  async syncInvoiceData(serviceTicketId: string): Promise<void> {
    const accountingConfigs = await this.getActiveAccountingIntegrations();
    
    for (const config of accountingConfigs) {
      try {
        const invoiceData = await this.prepareInvoiceData(serviceTicketId);
        await this.sendInvoiceToAccountingSystem(invoiceData, config);
        
        this.logger.log(`Invoice synced to ${config.systemType} for ticket: ${serviceTicketId}`);
      } catch (error) {
        this.logger.error(`Failed to sync invoice to ${config.systemType}`, error);
      }
    }
  }

  /**
   * Smart Home Integration (Google Home, Alexa, Apple HomeKit)
   */
  async integrateSmartHome(customerId: string, platform: SmartHomePlatform): Promise<void> {
    const customerDevices = Array.from(this.connectedDevices.values())
      .filter(device => device.customerId === customerId);

    for (const device of customerDevices) {
      await this.exposeDeviceToSmartHome(device, platform);
    }

    this.logger.log(`Smart home integration completed for customer: ${customerId} on ${platform}`);
  }

  /**
   * Weather Service Integration for Predictive Maintenance
   */
  async integrateWeatherService(): Promise<void> {
    // Integration with Polish weather services (IMGW-PIB)
    const weatherData = await this.fetchPolishWeatherData();
    
    // Analyze impact on HVAC systems
    const maintenanceRecommendations = await this.analyzeWeatherImpact(weatherData);
    
    // Send proactive notifications
    await this.sendWeatherBasedNotifications(maintenanceRecommendations);
  }

  /**
   * Energy Management Integration
   */
  async integrateEnergyManagement(customerId: string): Promise<void> {
    // Integration with Polish energy providers (PGE, Tauron, Enea, Energa)
    const energyData = await this.fetchCustomerEnergyData(customerId);
    
    // Optimize HVAC schedules based on energy tariffs
    const optimizedSchedules = await this.optimizeEnergyConsumption(energyData);
    
    // Apply optimizations to connected devices
    await this.applyEnergyOptimizations(customerId, optimizedSchedules);
  }

  /**
   * Real-time Communication Hub
   */
  private broadcastSensorUpdate(data: IoTSensorData, device: IoTDevice): void {
    // Broadcast to customer dashboard
    this.server.to(`customer_${device.customerId}`).emit('sensor_update', {
      deviceId: device.deviceId,
      location: device.location,
      data: data,
      timestamp: data.timestamp,
    });

    // Broadcast to technician apps if device needs attention
    if (this.requiresTechnicianAttention(data)) {
      this.server.to('technicians').emit('device_alert', {
        deviceId: device.deviceId,
        customerId: device.customerId,
        alertType: 'maintenance_required',
        data: data,
      });
    }
  }

  private async validateDeviceCompliance(device: IoTDevice): Promise<void> {
    // Check against Polish HVAC regulations and EU standards
    const complianceChecks = [
      this.checkEUEnergyLabel(device),
      this.checkPolishSafetyStandards(device),
      this.checkFGasCompliance(device),
      this.checkCEMarking(device),
    ];

    const results = await Promise.allSettled(complianceChecks);
    const failures = results.filter(result => result.status === 'rejected');

    if (failures.length > 0) {
      throw new Error(`Device compliance validation failed: ${failures.map(f => f.reason).join(', ')}`);
    }
  }

  private async analyzeForAnomalies(data: IoTSensorData, device: IoTDevice): Promise<DeviceAlert[]> {
    const alerts: DeviceAlert[] = [];

    // Temperature anomaly detection
    if (data.temperature !== undefined) {
      if (data.temperature > 35 || data.temperature < -10) {
        alerts.push({
          type: 'temperature_anomaly',
          severity: 'high',
          message: `Unusual temperature reading: ${data.temperature}°C`,
          deviceId: device.deviceId,
          timestamp: data.timestamp,
        });
      }
    }

    // Energy consumption anomaly
    if (data.energyConsumption !== undefined) {
      const historicalAverage = await this.getHistoricalEnergyAverage(device.deviceId);
      if (data.energyConsumption > historicalAverage * 1.5) {
        alerts.push({
          type: 'energy_spike',
          severity: 'medium',
          message: `Energy consumption 50% above average`,
          deviceId: device.deviceId,
          timestamp: data.timestamp,
        });
      }
    }

    // Error code detection
    if (data.errorCodes && data.errorCodes.length > 0) {
      alerts.push({
        type: 'error_code',
        severity: 'high',
        message: `Device error codes: ${data.errorCodes.join(', ')}`,
        deviceId: device.deviceId,
        timestamp: data.timestamp,
      });
    }

    return alerts;
  }

  private async sendPushNotification(deviceToken: string, notification: PushNotification): Promise<void> {
    // Implementation would use Firebase Cloud Messaging or Apple Push Notification Service
    // This is a placeholder for the actual implementation
    this.logger.debug(`Sending push notification to ${deviceToken}`, notification);
  }

  private requiresTechnicianAttention(data: IoTSensorData): boolean {
    return !!(data.errorCodes && data.errorCodes.length > 0) ||
           (data.temperature !== undefined && (data.temperature > 35 || data.temperature < -10));
  }
}

// Supporting interfaces
interface TechnicianNotification {
  title: string;
  message: string;
  ticketId: string;
  priority: string;
  customerAddress: string;
}

interface PushNotification {
  title: string;
  body: string;
  data: Record<string, any>;
}

interface DeviceAlert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  deviceId: string;
  timestamp: Date;
}

type SmartHomePlatform = 'google_home' | 'alexa' | 'apple_homekit' | 'samsung_smartthings';

interface EncryptedCredentials {
  encryptedData: string;
  keyId: string;
}
