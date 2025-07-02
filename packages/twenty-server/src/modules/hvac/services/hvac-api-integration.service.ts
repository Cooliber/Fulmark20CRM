import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HvacMaintenanceRecordWorkspaceEntity } from 'src/modules/hvac/standard-objects/hvac-maintenance-record.workspace-entity';

interface ExternalApiConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  conditions: string;
  forecast: WeatherForecast[];
}

interface WeatherForecast {
  date: Date;
  temperature: { min: number; max: number };
  conditions: string;
  hvacDemandPrediction: number;
}

interface IoTDeviceData {
  deviceId: string;
  timestamp: Date;
  temperature?: number;
  humidity?: number;
  energyConsumption?: number;
  operatingMode?: string;
  alerts?: string[];
}



/**
 * HVAC API Integration Service
 * "Pasja rodzi profesjonalizm" - Professional external API integration
 *
 * Handles integration with external APIs for HVAC operations
 * Weather services, IoT platforms, accounting systems, and more
 * Optimized for Polish market and TwentyCRM integration
 */
@Injectable()
export class HvacApiIntegrationService {
  private readonly logger = new Logger(HvacApiIntegrationService.name);
  private readonly weatherApiConfig: ExternalApiConfig;
  private readonly iotApiConfig: ExternalApiConfig;
  private readonly accountingApiConfig: ExternalApiConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.weatherApiConfig = {
      baseUrl:
        this.configService.get('WEATHER_API_BASE_URL') ||
        'https://api.openweathermap.org/data/2.5',
      apiKey: this.configService.get('WEATHER_API_KEY') || '',
      timeout: 10000,
      retryAttempts: 3,
    };

    this.iotApiConfig = {
      baseUrl: this.configService.get('IOT_API_BASE_URL') || '',
      apiKey: this.configService.get('IOT_API_KEY') || '',
      timeout: 15000,
      retryAttempts: 2,
    };

    this.accountingApiConfig = {
      baseUrl: this.configService.get('ACCOUNTING_API_BASE_URL') || '',
      apiKey: this.configService.get('ACCOUNTING_API_KEY') || '',
      timeout: 20000,
      retryAttempts: 3,
    };
  }

  /**
   * Get maintenance records from external systems
   */
  async getMaintenanceRecords(): Promise<
    HvacMaintenanceRecordWorkspaceEntity[]
  > {
    try {
      this.logger.log('Fetching maintenance records from external API');

      // Mock implementation - would integrate with actual external system
      return [];
    } catch (error) {
      this.logger.error('Failed to fetch maintenance records', error);
      throw error;
    }
  }

  /**
   * Create maintenance record in external systems
   */
  async createMaintenanceRecord(
    record: HvacMaintenanceRecordWorkspaceEntity,
  ): Promise<HvacMaintenanceRecordWorkspaceEntity> {
    try {
      this.logger.log(`Creating maintenance record: ${record.title}`);

      // Mock implementation - would integrate with actual external system
      return record;
    } catch (error) {
      this.logger.error('Failed to create maintenance record', error);
      throw error;
    }
  }

  /**
   * Get weather data for HVAC demand prediction
   * Integrates with Polish weather services
   */
  async getWeatherData(city = 'Warsaw'): Promise<WeatherData> {
    try {
      this.logger.log(`Fetching weather data for ${city}`);

      const { data } = await firstValueFrom(
        this.httpService.get(`${this.weatherApiConfig.baseUrl}/weather`, {
          params: {
            q: city,
            appid: this.weatherApiConfig.apiKey,
            units: 'metric',
          },
        }),
      );

      const forecastResponse = await firstValueFrom(
        this.httpService.get(`${this.weatherApiConfig.baseUrl}/forecast`, {
          params: {
            q: city,
            appid: this.weatherApiConfig.apiKey,
            units: 'metric',
          },
        }),
      );

      const forecast = forecastResponse.data.list.map((item: any) => ({
        date: new Date(item.dt * 1000),
        temperature: { min: item.main.temp_min, max: item.main.temp_max },
        conditions: item.weather[0].description,
        hvacDemandPrediction: this.calculateHvacDemand(item.main.temp),
      }));

      return {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        conditions: data.weather[0].description,
        forecast,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch weather data for ${city}`, error);
      throw new Error(`Weather API integration failed: ${error.message}`);
    }
  }

  /**
   * Sync data with IoT devices
   * Supports Polish HVAC manufacturers (Vaillant, Viessmann, Bosch)
   */
  async syncIoTDeviceData(deviceId: string): Promise<IoTDeviceData> {
    try {
      this.logger.log(`Syncing IoT device data for ${deviceId}`);

      const { data } = await firstValueFrom(
        this.httpService.get(`${this.iotApiConfig.baseUrl}/devices/${deviceId}`),
      );

      return data;
    } catch (error) {
      this.logger.error(
        `Failed to sync IoT device data for ${deviceId}`,
        error,
      );
      throw new Error(`IoT API integration failed: ${error.message}`);
    }
  }

  private calculateHvacDemand(temperature: number): number {
    // Simplified demand calculation
    if (temperature < 10) {
      return 0.9; // High heating demand
    } else if (temperature > 25) {
      return 0.8; // High cooling demand
    } else {
      return 0.3; // Low demand
    }
  }
}
