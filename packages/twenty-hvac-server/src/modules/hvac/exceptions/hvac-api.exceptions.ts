export class HvacApiException extends Error {
  constructor(message: string, public readonly status?: number, public readonly details?: any) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class HvacApiUnauthorizedError extends HvacApiException {
  constructor(details?: any) {
    super('HVAC API Unauthorized: Invalid or missing API key.', 401, details);
  }
}

export class HvacApiForbiddenError extends HvacApiException {
  constructor(details?: any) {
    super('HVAC API Forbidden: Access to the requested resource is forbidden.', 403, details);
  }
}

export class HvacApiNotFoundError extends HvacApiException {
  constructor(resource: string = 'Resource', details?: any) {
    super(`HVAC API Not Found: ${resource} not found.`, 404, details);
  }
}

export class HvacApiBadRequestError extends HvacApiException {
  constructor(message: string = 'Bad request to HVAC API.', details?: any) {
    super(`HVAC API Bad Request: ${message}`, 400, details);
  }
}

export class HvacApiServerError extends HvacApiException {
  constructor(message: string = 'HVAC API encountered an internal server error.', status: number = 500, details?: any) {
    super(message, status, details);
  }
}

export class HvacApiTimeoutError extends HvacApiException {
  constructor(details?: any) {
    super('HVAC API request timed out.', 408, details);
  }
}

export class HvacApiNetworkError extends HvacApiException {
  constructor(message: string = 'A network error occurred while communicating with the HVAC API.', details?: any) {
    super(message, undefined, details); // No specific HTTP status for network errors like ECONNREFUSED
  }
}
