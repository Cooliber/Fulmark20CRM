
import { Controller, Get, Param } from '@nestjs/common';

@Controller('hvac')
export class HvacController {
  @Get('devices/:id')
  getDeviceData(@Param('id') id: string) {
    return {
      deviceId: id,
      timestamp: new Date(),
      temperature: 21.5,
      humidity: 45,
      energyConsumption: 2.3,
      operatingMode: 'heating',
      alerts: [],
    };
  }
}
