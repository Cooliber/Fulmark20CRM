import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HvacConfigService } from './hvac-config.service';

@Module({
  imports: [ConfigModule],
  providers: [HvacConfigService],
  exports: [HvacConfigService],
})
export class HvacConfigModule {}
