import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';
import isObject from 'lodash.isobject';

@Injectable()
export class ProductionJsonLogger extends ConsoleLogger {
  constructor(context?: string, options: { timestamp?: boolean, logLevels?: LogLevel[] } = {}) {
    super(context || '', { ...options, timestamp: options.timestamp ?? true });
    if (options.logLevels) {
      this.setLogLevels(options.logLevels);
    }
  }

  protected printMessages(
    messages: unknown[],
    context = '',
    logLevel: LogLevel = 'log',
    writeStreamType?: 'stdout' | 'stderr',
  ) {
    if (process.env.NODE_ENV === 'production') {
      messages.forEach((message) => {
        const formattedLogLevel = logLevel.toUpperCase().padStart(7, ' ');
        const logObject: Record<string, any> = {
          timestamp: this.getTimestamp(),
          level: formattedLogLevel.trim(),
          context: context || this.context || 'Application',
        };

        if (typeof message === 'string') {
          logObject.message = message;
        } else if (isObject(message) && message !== null) {
          // If message is an object, spread its properties.
          // Handle Error objects specifically to get stack and proper message.
          if (message instanceof Error) {
            logObject.message = message.message;
            logObject.stack = message.stack;
            // Merge other error properties if any
            Object.assign(logObject, { ...message });
          } else {
            // If it's a simple object, try to find a 'message' property or use the object itself
            if ((message as any).message && typeof (message as any).message === 'string') {
                logObject.message = (message as any).message;
                delete (message as any).message; // Avoid duplicating message
                logObject.details = message;
            } else {
                logObject.details = message; // Put the whole object under details
            }
          }
        } else {
          logObject.message = String(message);
        }

        // Add remaining messages as additional details if they exist
        const additionalMessages = messages.slice(messages.indexOf(message) + 1);
        if (additionalMessages.length > 0) {
            if (!logObject.details) logObject.details = {};
            additionalMessages.forEach((addMsg, index) => {
                if (typeof addMsg === 'string') {
                    logObject.details[`param_${index}`] = addMsg;
                } else if (isObject(addMsg) && addMsg !== null) {
                    Object.assign(logObject.details, addMsg);
                } else {
                    logObject.details[`param_${index}`] = String(addMsg);
                }
            });
        }


        const output = JSON.stringify(logObject);
        process[writeStreamType ?? 'stdout'].write(`${output}\n`);
      });
    } else {
      // Fallback to default ConsoleLogger behavior for non-production environments
      super.printMessages(messages, context, logLevel, writeStreamType);
    }
  }

  // Override individual log level methods to ensure they call the modified printMessages
  log(message: any, context?: string, ...optionalParams: [...any, string?]) {
    // In NestJS ConsoleLogger, context might be passed as the last argument if not provided initially.
    // This standardizes it.
    const localContext = optionalParams.length > 0 && typeof optionalParams[optionalParams.length -1] === 'string' ? optionalParams.pop() as string : context || this.context;
    super.log(message, localContext, ...optionalParams);
  }

  error(message: any, stack?: string, context?: string, ...optionalParams: [...any, string?]) {
    const localContext = optionalParams.length > 0 && typeof optionalParams[optionalParams.length -1] === 'string' ? optionalParams.pop() as string : context || this.context;
    // For errors, the 'stack' might be the second argument if message is not an Error object
    // The base ConsoleLogger handles this logic, so we can call super.error.
    // Our printMessages will then format it.
    if (message instanceof Error) {
        super.error(message.message, message.stack, localContext, ...optionalParams);
    } else {
        super.error(message, stack, localContext, ...optionalParams);
    }
  }

  warn(message: any, context?: string, ...optionalParams: [...any, string?]) {
    const localContext = optionalParams.length > 0 && typeof optionalParams[optionalParams.length -1] === 'string' ? optionalParams.pop() as string : context || this.context;
    super.warn(message, localContext, ...optionalParams);
  }

  debug(message: any, context?: string, ...optionalParams: [...any, string?]) {
    const localContext = optionalParams.length > 0 && typeof optionalParams[optionalParams.length -1] === 'string' ? optionalParams.pop() as string : context || this.context;
    super.debug(message, localContext, ...optionalParams);
  }

  verbose(message: any, context?: string, ...optionalParams: [...any, string?]) {
    const localContext = optionalParams.length > 0 && typeof optionalParams[optionalParams.length -1] === 'string' ? optionalParams.pop() as string : context || this.context;
    super.verbose(message, localContext, ...optionalParams);
  }
}
