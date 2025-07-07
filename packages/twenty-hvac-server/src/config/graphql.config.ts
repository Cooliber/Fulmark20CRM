/**
 * HVAC GraphQL Configuration
 * "Pasja rodzi profesjonalizm" - Professional GraphQL Setup
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { YogaDriverConfig } from '@graphql-yoga/nestjs';
import { join } from 'path';

@Injectable()
export class HvacGraphQLConfig implements GqlOptionsFactory {
  constructor(private configService: ConfigService) {}

  createGqlOptions(): YogaDriverConfig {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    return {
      typePaths: ['./**/*.graphql'],
      definitions: {
        path: join(process.cwd(), 'src/graphql.ts'),
        outputAs: 'class',
      },
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,

      introspection: !isProduction,
      context: ({ request, reply }) => ({
        req: request,
        res: reply,
      }),
      cors: {
        origin: this.configService.get('CORS_ORIGIN') || '*',
        credentials: true,
      },
      graphiql: !isProduction ? {
        title: 'HVAC GraphQL API',
        // settings: {
        //   'request.credentials': 'include',
        // }, // Removed - not supported in this GraphQL Yoga version
      } : false,
    };
  }
}