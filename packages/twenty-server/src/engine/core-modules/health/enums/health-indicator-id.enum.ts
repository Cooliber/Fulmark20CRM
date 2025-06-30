import { registerEnumType } from '@nestjs/graphql';

export enum HealthIndicatorId {
  database = 'database',
  redis = 'redis',
  worker = 'worker',
  connectedAccount = 'connectedAccount',
  app = 'app',
  hvac = 'hvac',
}

registerEnumType(HealthIndicatorId, {
  name: 'HealthIndicatorId',
});
