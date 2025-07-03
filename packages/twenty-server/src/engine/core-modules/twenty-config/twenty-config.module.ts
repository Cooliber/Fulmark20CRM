import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import {
  ConfigVariables,
  validate,
} from 'src/engine/core-modules/twenty-config/config-variables';
import { CONFIG_VARIABLES_INSTANCE_TOKEN } from 'src/engine/core-modules/twenty-config/constants/config-variables-instance-tokens.constants';
import { DatabaseConfigModule } from 'src/engine/core-modules/twenty-config/drivers/database-config.module';
import { EnvironmentConfigDriver } from 'src/engine/core-modules/twenty-config/drivers/environment-config.driver';
import { ConfigurableModuleClass } from 'src/engine/core-modules/twenty-config/twenty-config.module-definition';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

@Global()
@Module({})
export class TwentyConfigModule extends ConfigurableModuleClass {
  static forRoot(): DynamicModule {
    const isConfigVariablesInDbEnabled =
      process.env.IS_CONFIG_VARIABLES_IN_DB_ENABLED !== 'false';

    const imports = [
      ConfigModule.forRoot({
        isGlobal: true,
        expandVariables: true,
        validate,
        envFilePath: (() => {
          const paths = ['.env'];
          if (process.env.NODE_ENV) {
            paths.push(`.env.${process.env.NODE_ENV}`); // e.g., .env.development, .env.production, .env.test
          }
          // Ensure .env.test is loaded and takes precedence if NODE_ENV is 'test'
          // The default behavior of providing an array is that later files override earlier ones.
          // So, if NODE_ENV=test, paths would be ['.env', '.env.test'], .env.test values override .env
          // If NODE_ENV=development, paths would be ['.env', '.env.development']
          return paths;
        })(),
      }),
    ];

    if (isConfigVariablesInDbEnabled) {
      imports.push(DatabaseConfigModule.forRoot());
    }

    return {
      module: TwentyConfigModule,
      imports,
      providers: [
        TwentyConfigService,
        EnvironmentConfigDriver,
        {
          provide: CONFIG_VARIABLES_INSTANCE_TOKEN,
          useValue: new ConfigVariables(),
        },
      ],
      exports: [TwentyConfigService],
    };
  }
}
