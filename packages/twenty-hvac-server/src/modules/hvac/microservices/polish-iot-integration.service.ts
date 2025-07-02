/**
 * Polish HVAC IoT Integration Hub
 * "Pasja rodzi profesjonalizm" - Professional IoT integration for Polish HVAC manufacturers
 * 
 * Connects with major Polish HVAC manufacturers (Vaillant, Viessmann, Bosch)
 * and implements real-time equipment monitoring and diagnostics
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

import { HvacCircuitBreakerService } from '../services/hvac-circuit-breaker.service';
import { HvacErrorHandlerService } from '../services/hvac-error-handler.service';
import { HvacMetricsService } from '../services/hvac-metrics.service';
import { HvacRedisCacheService } from '../services/hvac-redis-cache.service';

// Polish HVAC Manufacturer Interfaces
export interface PolishManufacturerConfig {
  manufacturer: 'Vaillant' | 'Viessmann' | 'Bosch' | 'Junkers' | 'Buderus';
  apiEndpoint: string;
  apiKey: string;
  protocol: 'REST' | 'MQTT' | 'WebSocket' | 'Modbus' | 'BACnet';
  region: 'poland' | 'eu_central';
  supportedModels: string[];
  certifications: string[]; // Polish/EU certifications
}

export interface IoTDeviceData {
  deviceId: string;
  manufacturer: PolishManufacturerConfig['manufacturer'];
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  lastCommunication: Date;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  location: {
    address: string;
    city: string;
    voivodeship: string; // Polish administrative division
    postalCode: string;
    coordinates?: { lat: number; lng: number };
  };
  sensors: IoTSensorReading[];
  diagnostics: DeviceDiagnostics;
  energyData: EnergyConsumptionData;
  complianceStatus: PolishComplianceStatus;
}

export interface IoTSensorReading {
  sensorId: string;
  sensorType: 'temperature' | 'pressure' | 'humidity' | 'flow' | 'energy' | 'vibration' | 'air_quality';
  value: number;
  unit: string;
  timestamp: Date;
  quality: 'good' | 'uncertain' | 'bad';
  alarmStatus: 'normal' | 'warning' | 'alarm' | 'critical';
  calibrationDate?: Date;
}

export interface DeviceDiagnostics {
  systemHealth: number; // 0-100%
  errorCodes: string[];
  warningCodes: string[];
  operatingHours: number;
  cycleCount: number;
  maintenanceRequired: boolean;
  nextMaintenanceDate: Date;
  performanceMetrics: {
    efficiency: number;
    reliability: number;
    availability: number;
  };
}

export interface EnergyConsumptionData {
  currentPower: number; // kW
  dailyConsumption: number; // kWh
  monthlyConsumption: number; // kWh
  yearlyConsumption: number; // kWh
  peakDemand: number; // kW
  powerFactor: number;
  energyClass: 'A+++' | 'A++' | 'A+' | 'A' | 'B' | 'C' | 'D';
  co2Emissions: number; // kg CO2/year
  costEstimate: {
    daily: number; // PLN
    monthly: number; // PLN
    yearly: number; // PLN
  };
}

export interface PolishComplianceStatus {
  ceMarking: boolean;
  polishStandards: string[]; // PN-EN standards
  euRegulations: string[]; // EU regulations
  energyLabel: string;
  noiseLevel: number; // dB
  refrigerantType?: string;
  refrigerantGWP?: number; // Global Warming Potential
  lastInspectionDate?: Date;
  nextInspectionDate?: Date;
  certificationExpiry?: Date;
}

export interface RealTimeAlert {
  alertId: string;
  deviceId: string;
  alertType: 'maintenance' | 'error' | 'efficiency' | 'safety' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  messagePolish: string; // Polish translation
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  actionRequired: string[];
  estimatedImpact: {
    downtime: number; // minutes
    cost: number; // PLN
    energyLoss: number; // kWh
  };
}

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/hvac-iot'
})
export class PolishIoTIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(PolishIoTIntegrationService.name);
  
  @WebSocketServer()
  private server: Server;

  private readonly manufacturerConfigs = new Map<string, PolishManufacturerConfig>();
  private readonly connectedDevices = new Map<string, IoTDeviceData>();
  private readonly activeAlerts = new Map<string, RealTimeAlert>();
  
  // Polling intervals for different manufacturers (in milliseconds)
  private readonly POLLING_INTERVALS = {
    Vaillant: 30000,    // 30 seconds
    Viessmann: 45000,   // 45 seconds
    Bosch: 30000,       // 30 seconds
    Junkers: 60000,     // 60 seconds
    Buderus: 45000      // 45 seconds
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly circuitBreakerService: HvacCircuitBreakerService,
    private readonly errorHandlerService: HvacErrorHandlerService,
    private readonly metricsService: HvacMetricsService,
    private readonly cacheService: HvacRedisCacheService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initializeManufacturerConfigs();
    await this.startDeviceDiscovery();
    await this.startRealTimeMonitoring();
    
    this.logger.log('Polish HVAC IoT Integration Hub initialized');
  }

  /**
   * Initialize configurations for Polish HVAC manufacturers
   */
  private async initializeManufacturerConfigs(): Promise<void> {
    const manufacturers: PolishManufacturerConfig[] = [
      {
        manufacturer: 'Vaillant',
        apiEndpoint: this.configService.get('VAILLANT_API_ENDPOINT', 'https://api.vaillant.pl/v1'),
        apiKey: this.configService.get('VAILLANT_API_KEY', ''),
        protocol: 'REST',
        region: 'poland',
        supportedModels: ['ecoTEC', 'ecoVIT', 'aroTHERM', 'flexoTHERM'],
        certifications: ['CE', 'PN-EN 14511', 'PN-EN 12309', 'ErP']
      },
      {
        manufacturer: 'Viessmann',
        apiEndpoint: this.configService.get('VIESSMANN_API_ENDPOINT', 'https://api.viessmann.pl/v1'),
        apiKey: this.configService.get('VIESSMANN_API_KEY', ''),
        protocol: 'REST',
        region: 'poland',
        supportedModels: ['Vitocal', 'Vitodens', 'Vitocrossal', 'Vitoligno'],
        certifications: ['CE', 'PN-EN 14511', 'PN-EN 303', 'Keymark']
      },
      {
        manufacturer: 'Bosch',
        apiEndpoint: this.configService.get('BOSCH_API_ENDPOINT', 'https://api.bosch-thermotechnology.pl/v1'),
        apiKey: this.configService.get('BOSCH_API_KEY', ''),
        protocol: 'REST',
        region: 'poland',
        supportedModels: ['Compress', 'Condens', 'Solid', 'Logano'],
        certifications: ['CE', 'PN-EN 14511', 'PN-EN 303', 'EHPA']
      },
      {
        manufacturer: 'Junkers',
        apiEndpoint: this.configService.get('JUNKERS_API_ENDPOINT', 'https://api.junkers.pl/v1'),
        apiKey: this.configService.get('JUNKERS_API_KEY', ''),
        protocol: 'REST',
        region: 'poland',
        supportedModels: ['Cerapur', 'Ceraclass', 'Suprapur'],
        certifications: ['CE', 'PN-EN 14511', 'PN-EN 483']
      },
      {
        manufacturer: 'Buderus',
        apiEndpoint: this.configService.get('BUDERUS_API_ENDPOINT', 'https://api.buderus.pl/v1'),
        apiKey: this.configService.get('BUDERUS_API_KEY', ''),
        protocol: 'REST',
        region: 'poland',
        supportedModels: ['Logatherm', 'Logano', 'Logamax'],
        certifications: ['CE', 'PN-EN 14511', 'PN-EN 303']
      }
    ];

    for (const config of manufacturers) {
      this.manufacturerConfigs.set(config.manufacturer, config);
      this.logger.log(`Configured ${config.manufacturer} integration`, {
        endpoint: config.apiEndpoint,
        models: config.supportedModels.length,
        certifications: config.certifications.length
      });
    }
  }

  /**
   * Discover IoT devices from all configured manufacturers
   */
  private async startDeviceDiscovery(): Promise<void> {
    this.logger.log('Starting device discovery for Polish HVAC manufacturers');

    for (const [manufacturer, config] of this.manufacturerConfigs.entries()) {
      try {
        await this.circuitBreakerService.execute(
          `IOT_DISCOVERY_${manufacturer}`,
          async () => {
            const devices = await this.discoverDevicesForManufacturer(config);
            
            for (const device of devices) {
              this.connectedDevices.set(device.deviceId, device);
              
              // Cache device data
              const cacheKey = this.cacheService.generateKey('EQUIPMENT', `iot_device:${device.deviceId}`);
              await this.cacheService.set(cacheKey, device, {
                ttl: 300, // 5 minutes
                tags: ['iot', 'device', manufacturer.toLowerCase()]
              });
            }

            this.logger.log(`Discovered ${devices.length} devices for ${manufacturer}`);
            this.metricsService.recordMetric(`iot_devices_${manufacturer.toLowerCase()}`, devices.length);
          },
          {
            fallbackFunction: async () => {
              this.logger.warn(`Device discovery failed for ${manufacturer}, using cached data`);
              return [];
            }
          }
        );

      } catch (error) {
        const hvacError = this.errorHandlerService.createIoTDeviceError(
          `Device discovery failed for ${manufacturer}`,
          error as Error,
          manufacturer
        );
        
        this.logger.error(`Device discovery error for ${manufacturer}`, hvacError);
      }
    }

    this.logger.log(`Total devices discovered: ${this.connectedDevices.size}`);
  }

  /**
   * Start real-time monitoring for all connected devices
   */
  private async startRealTimeMonitoring(): Promise<void> {
    this.logger.log('Starting real-time monitoring for connected devices');

    // Start monitoring for each manufacturer with their specific polling interval
    for (const [manufacturer, config] of this.manufacturerConfigs.entries()) {
      const interval = this.POLLING_INTERVALS[manufacturer];
      
      setInterval(async () => {
        await this.monitorManufacturerDevices(config);
      }, interval);

      this.logger.log(`Started monitoring for ${manufacturer} with ${interval}ms interval`);
    }

    // Start alert processing
    setInterval(async () => {
      await this.processAlerts();
    }, 10000); // Process alerts every 10 seconds
  }

  /**
   * Discover devices for a specific manufacturer
   */
   private async discoverDevicesForManufacturer(config: PolishManufacturerConfig): Promise<IoTDeviceData[]> {
    // Simulate device discovery - in production, this would call actual manufacturer APIs
    const mockDevices: IoTDeviceData[] = [];

    for (let i = 0; i < 3; i++) {
      const deviceId = `${config.manufacturer.toLowerCase()}_device_${i + 1}`;
      const device: IoTDeviceData = {
        deviceId,
        manufacturer: config.manufacturer,
        model: config.supportedModels[i % config.supportedModels.length],
        serialNumber: `SN${Date.now()}${i}`,
        firmwareVersion: '2.1.0',
        lastCommunication: new Date(),
        status: 'online',
        location: {
          address: `ul. Testowa ${i + 1}`,
          city: ['Warsaw', 'Krakow', 'Gdansk'][i % 3],
          voivodeship: ['mazowieckie', 'małopolskie', 'pomorskie'][i % 3],
          postalCode: `0${i + 1}-000`,
          coordinates: { lat: 52.2297 + i * 0.1, lng: 21.0122 + i * 0.1 }
        },
        sensors: this.generateMockSensorData(deviceId),
        diagnostics: this.generateMockDiagnostics(),
        energyData: this.generateMockEnergyData(),
        complianceStatus: this.generateMockComplianceStatus(config)
      };

      mockDevices.push(device);
    }

    return mockDevices;
  }

  /**
   * Monitor devices for a specific manufacturer
   */
  private async monitorManufacturerDevices(config: PolishManufacturerConfig): Promise<void> {
    const manufacturerDevices = Array.from(this.connectedDevices.values())
      .filter(device => device.manufacturer === config.manufacturer);

    for (const device of manufacturerDevices) {
      try {
        await this.circuitBreakerService.executeForEquipmentType(
          'IOT_DEVICE',
          async () => {
            // Update device data
            const updatedDevice = await this.updateDeviceData(device);
            this.connectedDevices.set(device.deviceId, updatedDevice);

            // Check for alerts
            const alerts = this.checkDeviceAlerts(updatedDevice);
            for (const alert of alerts) {
              await this.processAlert(alert);
            }

            // Emit real-time updates via WebSocket
            this.server.emit('device-update', {
              deviceId: device.deviceId,
              data: updatedDevice,
              timestamp: new Date()
            });

            // Update metrics
            this.metricsService.recordMetric(`device_${device.deviceId}_health`, updatedDevice.diagnostics.systemHealth);
          }
        );

      } catch (error) {
        this.logger.error(`Failed to monitor device ${device.deviceId}`, error);

        // Mark device as offline if communication fails
        device.status = 'error';
        device.lastCommunication = new Date();
      }
    }
  }

  /**
   * Update device data with latest readings
   */
  private async updateDeviceData(device: IoTDeviceData): Promise<IoTDeviceData> {
    // Simulate real-time data updates
    const updatedDevice = { ...device };

    // Update sensor readings
    updatedDevice.sensors = this.generateMockSensorData(device.deviceId);
    updatedDevice.lastCommunication = new Date();

    // Update diagnostics
    updatedDevice.diagnostics = {
      ...device.diagnostics,
      systemHealth: Math.max(0, device.diagnostics.systemHealth + (Math.random() - 0.5) * 5),
      operatingHours: device.diagnostics.operatingHours + 0.1
    };

    // Update energy data
    updatedDevice.energyData = {
      ...device.energyData,
      currentPower: Math.max(0, device.energyData.currentPower + (Math.random() - 0.5) * 2),
      dailyConsumption: device.energyData.dailyConsumption + Math.random() * 0.1
    };

    return updatedDevice;
  }

  /**
   * Check device for alerts
   */
  private checkDeviceAlerts(device: IoTDeviceData): RealTimeAlert[] {
    const alerts: RealTimeAlert[] = [];

    // Check system health
    if (device.diagnostics.systemHealth < 70) {
      alerts.push({
        alertId: `health_${device.deviceId}_${Date.now()}`,
        deviceId: device.deviceId,
        alertType: 'maintenance',
        severity: device.diagnostics.systemHealth < 50 ? 'high' : 'medium',
        message: `System health below threshold: ${device.diagnostics.systemHealth}%`,
        messagePolish: `Kondycja systemu poniżej progu: ${device.diagnostics.systemHealth}%`,
        timestamp: new Date(),
        acknowledged: false,
        actionRequired: ['Schedule maintenance inspection', 'Check system components'],
        estimatedImpact: {
          downtime: 120,
          cost: 500,
          energyLoss: 10
        }
      });
    }

    // Check sensor alarms
    for (const sensor of device.sensors) {
      if (sensor.alarmStatus === 'critical') {
        alerts.push({
          alertId: `sensor_${sensor.sensorId}_${Date.now()}`,
          deviceId: device.deviceId,
          alertType: 'error',
          severity: 'critical',
          message: `Critical sensor alarm: ${sensor.sensorType} = ${sensor.value} ${sensor.unit}`,
          messagePolish: `Krytyczny alarm czujnika: ${sensor.sensorType} = ${sensor.value} ${sensor.unit}`,
          timestamp: new Date(),
          acknowledged: false,
          actionRequired: ['Immediate technician dispatch', 'System shutdown if necessary'],
          estimatedImpact: {
            downtime: 240,
            cost: 1000,
            energyLoss: 25
          }
        });
      }
    }

    return alerts;
  }

  /**
   * Process and handle alerts
   */
  private async processAlert(alert: RealTimeAlert): Promise<void> {
    // Store alert
    this.activeAlerts.set(alert.alertId, alert);

    // Cache alert
    const cacheKey = this.cacheService.generateKey('ALERTS', alert.alertId);
    await this.cacheService.set(cacheKey, alert, {
      ttl: 3600, // 1 hour
      tags: ['alert', alert.deviceId, alert.alertType]
    });

    // Emit alert via WebSocket
    this.server.emit('alert', alert);

    // Emit event for other services
    this.eventEmitter.emit('iot.alert.created', alert);

    // Log alert
    this.logger.warn(`IoT Alert: ${alert.message}`, {
      alertId: alert.alertId,
      deviceId: alert.deviceId,
      severity: alert.severity
    });

    // Update metrics
    this.metricsService.incrementCounter(`iot_alerts_${alert.severity}`);
  }

  /**
   * Process all active alerts
   */
  private async processAlerts(): Promise<void> {
    const now = Date.now();
    const alertsToEscalate: RealTimeAlert[] = [];

    for (const alert of this.activeAlerts.values()) {
      // Check if alert needs escalation (unacknowledged for > 30 minutes)
      if (!alert.acknowledged && (now - alert.timestamp.getTime()) > 30 * 60 * 1000) {
        alertsToEscalate.push(alert);
      }
    }

    for (const alert of alertsToEscalate) {
      await this.escalateAlert(alert);
    }
  }

  /**
   * Escalate unacknowledged alerts
   */
  private async escalateAlert(alert: RealTimeAlert): Promise<void> {
    this.logger.error(`Escalating unacknowledged alert: ${alert.alertId}`);

    // Emit escalation event
    this.eventEmitter.emit('iot.alert.escalated', {
      ...alert,
      escalatedAt: new Date()
    });

    // Update metrics
    this.metricsService.incrementCounter('iot_alerts_escalated');
  }

  // Mock data generation methods
  private generateMockSensorData(deviceId: string): IoTSensorReading[] {
    const sensorTypes: IoTSensorReading['sensorType'][] = [
      'temperature', 'pressure', 'humidity', 'flow', 'energy'
    ];

    return sensorTypes.map(type => ({
      sensorId: `${deviceId}_${type}`,
      sensorType: type,
      value: this.generateSensorValue(type),
      unit: this.getSensorUnit(type),
      timestamp: new Date(),
      quality: 'good',
      alarmStatus: Math.random() > 0.95 ? 'warning' : 'normal',
      calibrationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    }));
  }

  private generateSensorValue(type: IoTSensorReading['sensorType']): number {
    switch (type) {
      case 'temperature': return 20 + Math.random() * 15; // 20-35°C
      case 'pressure': return 1 + Math.random() * 2; // 1-3 bar
      case 'humidity': return 40 + Math.random() * 30; // 40-70%
      case 'flow': return 5 + Math.random() * 10; // 5-15 l/min
      case 'energy': return 1000 + Math.random() * 2000; // 1-3 kW
      default: return Math.random() * 100;
    }
  }

  private getSensorUnit(type: IoTSensorReading['sensorType']): string {
    switch (type) {
      case 'temperature': return '°C';
      case 'pressure': return 'bar';
      case 'humidity': return '%';
      case 'flow': return 'l/min';
      case 'energy': return 'kW';
      default: return 'unit';
    }
  }

  private generateMockDiagnostics(): DeviceDiagnostics {
    return {
      systemHealth: 80 + Math.random() * 20, // 80-100%
      errorCodes: [],
      warningCodes: Math.random() > 0.8 ? ['W001'] : [],
      operatingHours: Math.floor(Math.random() * 10000),
      cycleCount: Math.floor(Math.random() * 1000),
      maintenanceRequired: Math.random() > 0.9,
      nextMaintenanceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      performanceMetrics: {
        efficiency: 85 + Math.random() * 10, // 85-95%
        reliability: 90 + Math.random() * 10, // 90-100%
        availability: 95 + Math.random() * 5 // 95-100%
      }
    };
  }

  private generateMockEnergyData(): EnergyConsumptionData {
    const currentPower = 1 + Math.random() * 3; // 1-4 kW
    return {
      currentPower,
      dailyConsumption: currentPower * 8, // 8 hours operation
      monthlyConsumption: currentPower * 8 * 30,
      yearlyConsumption: currentPower * 8 * 365,
      peakDemand: currentPower * 1.2,
      powerFactor: 0.85 + Math.random() * 0.1,
      energyClass: 'A++',
      co2Emissions: currentPower * 8 * 365 * 0.8, // kg CO2/year
      costEstimate: {
        daily: currentPower * 8 * 0.6, // 0.6 PLN/kWh
        monthly: currentPower * 8 * 30 * 0.6,
        yearly: currentPower * 8 * 365 * 0.6
      }
    };
  }

  private generateMockComplianceStatus(config: PolishManufacturerConfig): PolishComplianceStatus {
    return {
      ceMarking: true,
      polishStandards: ['PN-EN 14511', 'PN-EN 12309'],
      euRegulations: ['ErP 2009/125/EC', 'F-Gas 517/2014'],
      energyLabel: 'A++',
      noiseLevel: 35 + Math.random() * 10, // 35-45 dB
      refrigerantType: 'R32',
      refrigerantGWP: 675,
      lastInspectionDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
      nextInspectionDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
      certificationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    };
  }

  // Public API methods

  /**
   * Get all connected devices
   */
  async getConnectedDevices(): Promise<IoTDeviceData[]> {
    return Array.from(this.connectedDevices.values());
  }

  /**
   * Get device by ID
   */
  async getDeviceById(deviceId: string): Promise<IoTDeviceData | null> {
    return this.connectedDevices.get(deviceId) || null;
  }

  /**
   * Get devices by manufacturer
   */
  async getDevicesByManufacturer(manufacturer: PolishManufacturerConfig['manufacturer']): Promise<IoTDeviceData[]> {
    return Array.from(this.connectedDevices.values())
      .filter(device => device.manufacturer === manufacturer);
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<RealTimeAlert[]> {
    return Array.from(this.activeAlerts.values())
      .filter(alert => !alert.resolvedAt);
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    this.activeAlerts.set(alertId, alert);

    // Emit acknowledgment event
    this.eventEmitter.emit('iot.alert.acknowledged', alert);

    this.logger.log(`Alert acknowledged: ${alertId}`);
    return true;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.resolvedAt = new Date();
    this.activeAlerts.set(alertId, alert);

    // Emit resolution event
    this.eventEmitter.emit('iot.alert.resolved', alert);

    this.logger.log(`Alert resolved: ${alertId}`);
    return true;
  }

  /**
   * Get IoT integration statistics
   */
  async getIntegrationStats(): Promise<{
    totalDevices: number;
    devicesByManufacturer: Record<string, number>;
    onlineDevices: number;
    activeAlerts: number;
    averageSystemHealth: number;
  }> {
    const devices = Array.from(this.connectedDevices.values());
    const devicesByManufacturer: Record<string, number> = {};

    for (const device of devices) {
      devicesByManufacturer[device.manufacturer] = (devicesByManufacturer[device.manufacturer] || 0) + 1;
    }

    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const activeAlerts = Array.from(this.activeAlerts.values()).filter(a => !a.resolvedAt).length;
    const averageSystemHealth = devices.reduce((sum, d) => sum + d.diagnostics.systemHealth, 0) / devices.length || 0;

    return {
      totalDevices: devices.length,
      devicesByManufacturer,
      onlineDevices,
      activeAlerts,
      averageSystemHealth: Math.round(averageSystemHealth)
    };
  }
}
