import { DynamicModule, Global, Module } from '@nestjs/common'; // Removed ConsoleLogger import
import { ProductionJsonLogger } from './production-json.logger'; // Import new logger

import { LoggerDriverType } from 'src/engine/core-modules/logger/interfaces';
import { LOGGER_DRIVER } from 'src/engine/core-modules/logger/logger.constants';
import {
  ASYNC_OPTIONS_TYPE,
  ConfigurableModuleClass,
  OPTIONS_TYPE,
} from 'src/engine/core-modules/logger/logger.module-definition';
import { LoggerService } from 'src/engine/core-modules/logger/logger.service';

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule extends ConfigurableModuleClass {
  static forRoot(options: typeof OPTIONS_TYPE): DynamicModule {
    const provider = {
      provide: LOGGER_DRIVER,
      useValue:
        options.type === LoggerDriverType.CONSOLE
          ? new ProductionJsonLogger(undefined, { logLevels: options.logLevels })
          : undefined,
    };
    const dynamicModule = super.forRoot(options);

    return {
      ...dynamicModule,
      providers: [...(dynamicModule.providers ?? []), provider],
    };
  }

  static forRootAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    const provider = {
      provide: LOGGER_DRIVER,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useFactory: async (...args: any[]) => {
        const config = await options?.useFactory?.(...args);

        if (!config) {
          return null;
        }

        const logLevels = config.logLevels ?? [];

        const logger =
          config?.type === LoggerDriverType.CONSOLE
            ? new ProductionJsonLogger(undefined, { logLevels })
            : undefined;

        // logger?.setLogLevels(logLevels); // Constructor of ProductionJsonLogger now handles this

        return logger;
      },
      inject: options.inject || [],
    };
    const dynamicModule = super.forRootAsync(options);

    return {
      ...dynamicModule,
      providers: [...(dynamicModule.providers ?? []), provider],
    };
  }
}
