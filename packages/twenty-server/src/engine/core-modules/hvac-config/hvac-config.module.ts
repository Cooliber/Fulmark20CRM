import { Module } from '@nestjs/common';
import { HvacConfigService } from './hvac-config.service';
import { TwentyConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';

@Module({
  imports: [TwentyConfigModule],
  providers: [HvacConfigService],
  exports: [HvacConfigService],
})
export class HvacConfigModule {}
