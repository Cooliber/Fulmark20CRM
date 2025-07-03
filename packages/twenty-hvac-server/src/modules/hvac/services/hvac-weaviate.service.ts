import { Injectable, Logger } from '@nestjs/common';

import { HvacConfigService } from '../../../config/hvac-config/hvac-config.service';

// Weaviate v4 client types - will be dynamically imported
// Note: Using 'unknown' here is acceptable as this is a mock implementation
// for a third-party library that will be dynamically imported at runtime.
// The actual Weaviate client types are complex and would require importing
// the entire Weaviate SDK, which we want to avoid for optional functionality.
interface WeaviateClient {
  collections: unknown;
  schema: unknown;
  data: unknown;
  graphql: unknown;
  misc: unknown;
}

interface WeaviateQueryResult {
  data?: {
    Get?: {
      [className: string]: WeaviateDocument[];
    };
  };
}

interface WeaviateDocument {
  content: string;
  title: string;
  type: string;
  customerId?: string;
  equipmentId?: string;
  technicianId?: string;
  ticketId?: string;
  timestamp?: string;
  source?: string;
  language?: string;
  metadata: Record<string, unknown>;
  _additional?: {
    id?: string;
    certainty?: number;
    distance?: number;
  };
}

interface WeaviateFilter {
  path: string[];
  operator: string;
  valueText?: string;
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
}

interface WeaviateClassConfig {
  class: string;
  description?: string;
  properties: WeaviateProperty[];
  vectorizer?: string;
  moduleConfig?: Record<string, unknown>;
}

interface WeaviateProperty {
  name: string;
  dataType: string[];
  description?: string;
  moduleConfig?: Record<string, unknown>;
}

export interface HvacSemanticDocument {
  id?: string;
  content: string;
  title: string;
  type:
    | 'service_report'
    | 'maintenance_log'
    | 'customer_note'
    | 'equipment_manual'
    | 'email'
    | 'transcription';
  metadata: {
    customerId?: string;
    equipmentId?: string;
    technicianId?: string;
    ticketId?: string;
    timestamp: Date;
    source: string;
    language?: string;
    [key: string]: unknown;
  };
}

export interface HvacSemanticSearchQuery {
  query: string;
  type?: string[];
  customerId?: string;
  equipmentId?: string;
  limit?: number;
  certainty?: number;
  where?: WeaviateFilter;
}

export interface HvacSemanticSearchResult {
  id: string;
  content: string;
  title: string;
  type: string;
  score: number;
  metadata: Record<string, unknown>;
  _additional?: {
    certainty?: number;
    distance?: number;
  };
}

@Injectable()
export class HvacWeaviateService {
  private readonly logger = new Logger(HvacWeaviateService.name);
  private client: WeaviateClient | null = null;
  private readonly className = 'HvacDocument';
  private isInitialized = false;

  constructor(private readonly hvacConfigService: HvacConfigService) {
    // Initialize client lazily
  }

  private async initializeClient(): Promise<WeaviateClient> {
    if (this.client && this.isInitialized) {
      return this.client;
    }

    try {
      const config = this.hvacConfigService.getWeaviateConfig();

      // For now, create a mock client that logs operations
      // This will be replaced with actual Weaviate v4 client when available
      this.client = {
        collections: {
          get: () => ({
            withClassName: () => ({
              withFields: () => ({
                withNearText: () => ({
                  withLimit: () => ({
                    withWhere: () => ({
                      do: async () => ({ data: { Get: {} } }),
                    }),
                    do: async () => ({ data: { Get: {} } }),
                  }),
                }),
                do: async () => ({ data: { Get: {} } }),
              }),
            }),
          }),
        },
        schema: {
          classGetter: () => ({
            withClassName: () => ({
              do: async () => null,
            }),
          }),
          classCreator: () => ({
            withClass: () => ({
              do: async () => ({ class: this.className }),
            }),
          }),
        },
        data: {
          creator: () => ({
            withClassName: () => ({
              withProperties: () => ({
                do: async () => ({ id: 'mock-id-' + Date.now() }),
              }),
            }),
          }),
          getterById: () => ({
            withClassName: () => ({
              withId: () => ({
                do: async () => null,
              }),
            }),
          }),
          deleter: () => ({
            withClassName: () => ({
              withId: () => ({
                do: async () => true,
              }),
            }),
          }),
        },
        graphql: {
          get: () => ({
            withClassName: () => ({
              withFields: () => ({
                withNearText: () => ({
                  withLimit: () => ({
                    withWhere: () => ({
                      do: async () => ({
                        data: { Get: { [this.className]: [] } },
                      }),
                    }),
                    do: async () => ({
                      data: { Get: { [this.className]: [] } },
                    }),
                  }),
                }),
                do: async () => ({ data: { Get: { [this.className]: [] } } }),
              }),
            }),
          }),
          aggregate: () => ({
            withClassName: () => ({
              withFields: () => ({
                do: async () => ({
                  data: {
                    Aggregate: { [this.className]: [{ meta: { count: 0 } }] },
                  },
                }),
              }),
            }),
          }),
        },
        misc: {
          liveChecker: () => ({
            do: async () => true,
          }),
        },
      } as WeaviateClient;

      this.isInitialized = true;
      this.logger.log(
        `Mock Weaviate client initialized for ${config.scheme}://${config.host}:${config.port}`,
      );
      this.logger.warn(
        'Using mock Weaviate client - install weaviate-client package for full functionality',
      );

      return this.client;
    } catch (error) {
      this.logger.error('Failed to initialize Weaviate client', error);
      throw new Error('Weaviate client initialization failed');
    }
  }

  async ensureSchema(): Promise<void> {
    try {
      const client = await this.initializeClient();

      // Check if class exists
      // Type assertion for mock Weaviate client - using unknown for third-party library
      const exists = await (
        client.schema as unknown as {
          classGetter: () => {
            withClassName: (name: string) => {
              do: () => Promise<boolean>;
            };
          };
        }
      )
        .classGetter()
        .withClassName(this.className)
        .do();

      if (!exists) {
        await this.createSchema();
      }
    } catch (error) {
      this.logger.warn('Class does not exist, creating schema...', error);
      await this.createSchema();
    }
  }

  private async createSchema(): Promise<void> {
    const classDefinition = {
      class: this.className,
      description: 'HVAC documents for semantic search',
      vectorizer: 'text2vec-transformers',
      moduleConfig: {
        'text2vec-transformers': {
          poolingStrategy: 'masked_mean',
          vectorizeClassName: false,
        },
      },
      properties: [
        {
          name: 'content',
          dataType: ['text'],
          description: 'Main content of the document',
          moduleConfig: {
            'text2vec-transformers': {
              skip: false,
              vectorizePropertyName: false,
            },
          },
        },
        {
          name: 'title',
          dataType: ['string'],
          description: 'Title of the document',
          moduleConfig: {
            'text2vec-transformers': {
              skip: false,
              vectorizePropertyName: false,
            },
          },
        },
        {
          name: 'type',
          dataType: ['string'],
          description: 'Type of document',
        },
        {
          name: 'customerId',
          dataType: ['string'],
          description: 'Associated customer ID',
        },
        {
          name: 'equipmentId',
          dataType: ['string'],
          description: 'Associated equipment ID',
        },
        {
          name: 'technicianId',
          dataType: ['string'],
          description: 'Associated technician ID',
        },
        {
          name: 'ticketId',
          dataType: ['string'],
          description: 'Associated service ticket ID',
        },
        {
          name: 'timestamp',
          dataType: ['date'],
          description: 'Document timestamp',
        },
        {
          name: 'source',
          dataType: ['string'],
          description: 'Source of the document',
        },
        {
          name: 'language',
          dataType: ['string'],
          description: 'Document language',
        },
        {
          name: 'metadata',
          dataType: ['object'],
          description: 'Additional metadata',
        },
      ],
    };

    const client = await this.initializeClient();

    const schema = client.schema as {
      classCreator: () => {
        withClass: (config: WeaviateClassConfig) => {
          do: () => Promise<void>;
        };
      };
    };

    await schema.classCreator().withClass(classDefinition).do();
    this.logger.log(`Created Weaviate schema for class: ${this.className}`);
  }

  async insertDocument(document: HvacSemanticDocument): Promise<string> {
    try {
      await this.ensureSchema();
      const client = await this.initializeClient();

      const result = await (
        client.data as unknown as {
          creator: () => {
            withClassName: (name: string) => {
              withProperties: (props: Record<string, unknown>) => {
                do: () => Promise<{ id: string }>;
              };
            };
          };
        }
      )
        .creator()
        .withClassName(this.className)
        .withProperties({
          content: document.content,
          title: document.title,
          type: document.type,
          customerId: document.metadata.customerId,
          equipmentId: document.metadata.equipmentId,
          technicianId: document.metadata.technicianId,
          ticketId: document.metadata.ticketId,
          timestamp: document.metadata.timestamp.toISOString(),
          source: document.metadata.source,
          language: document.metadata.language || 'pl',
          metadata: document.metadata,
        })
        .do();

      this.logger.log(`Inserted document with ID: ${result.id}`);

      return result.id;
    } catch (error) {
      this.logger.error('Failed to insert document into Weaviate', error);
      throw new Error('Failed to insert document');
    }
  }

  async searchDocuments(
    query: HvacSemanticSearchQuery,
  ): Promise<HvacSemanticSearchResult[]> {
    try {
      await this.ensureSchema();
      const client = await this.initializeClient();

      const searchBuilder = (
        client.graphql as unknown as {
          get: () => {
            withClassName: (name: string) => {
              withFields: (fields: string) => {
                withNearText: (query: { concepts: string[] }) => {
                  withLimit: (limit: number) => {
                    withWhere: (filter: WeaviateFilter) => {
                      do: () => Promise<WeaviateQueryResult>;
                    };
                    do: () => Promise<WeaviateQueryResult>;
                  };
                  do: () => Promise<WeaviateQueryResult>;
                };
                withLimit: (limit: number) => {
                  withWhere: (filter: WeaviateFilter) => {
                    do: () => Promise<WeaviateQueryResult>;
                  };
                  do: () => Promise<WeaviateQueryResult>;
                };
                withWhere: (filter: WeaviateFilter) => {
                  do: () => Promise<WeaviateQueryResult>;
                };
                do: () => Promise<WeaviateQueryResult>;
              };
            };
          };
        }
      )
        .get()
        .withClassName(this.className)
        .withFields(
          'content title type customerId equipmentId technicianId ticketId timestamp source language metadata _additional { certainty distance }',
        )
        .withNearText({ concepts: [query.query] })
        .withLimit(query.limit || 10);

      // Note: Advanced filtering temporarily disabled due to complex type system
      // This is a mock implementation that will be replaced with actual Weaviate client
      // TODO: Implement proper filtering when Weaviate v4 client is available

      const result = await searchBuilder.do();

      if (!result.data?.Get?.[this.className]) {
        return [];
      }

      return result.data.Get[this.className].map((item: WeaviateDocument) => ({
        id: item._additional?.id || '',
        content: item.content,
        title: item.title,
        type: item.type,
        score: item._additional?.certainty || 0,
        metadata: {
          customerId: item.customerId,
          equipmentId: item.equipmentId,
          technicianId: item.technicianId,
          ticketId: item.ticketId,
          timestamp: item.timestamp,
          source: item.source,
          language: item.language,
          ...item.metadata,
        },
        _additional: item._additional,
      }));
    } catch (error) {
      this.logger.error('Failed to search documents in Weaviate', error);
      throw new Error('Failed to search documents');
    }
  }

  async getDocumentById(id: string): Promise<HvacSemanticSearchResult | null> {
    try {
      const client = await this.initializeClient();
      const result = await (
        client.data as unknown as {
          getterById: () => {
            withClassName: (name: string) => {
              withId: (id: string) => {
                do: () => Promise<{
                  id: string;
                  properties: Record<string, unknown>;
                } | null>;
              };
            };
          };
        }
      )
        .getterById()
        .withClassName(this.className)
        .withId(id)
        .do();

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        content: result.properties.content as string,
        title: result.properties.title as string,
        type: result.properties.type as string,
        score: 1.0,
        metadata: {
          customerId: result.properties.customerId as string,
          equipmentId: result.properties.equipmentId as string,
          technicianId: result.properties.technicianId as string,
          ticketId: result.properties.ticketId as string,
          timestamp: result.properties.timestamp as string,
          source: result.properties.source as string,
          language: result.properties.language as string,
          ...(result.properties.metadata as Record<string, unknown>),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get document ${id} from Weaviate`, error);

      return null;
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    try {
      const client = await this.initializeClient();

      await (
        client.data as unknown as {
          deleter: () => {
            withClassName: (name: string) => {
              withId: (id: string) => {
                do: () => Promise<void>;
              };
            };
          };
        }
      )
        .deleter()
        .withClassName(this.className)
        .withId(id)
        .do();

      this.logger.log(`Deleted document with ID: ${id}`);

      return true;
    } catch (error) {
      this.logger.error(`Failed to delete document ${id} from Weaviate`, error);

      return false;
    }
  }

  async getDocumentCount(): Promise<number> {
    try {
      const client = await this.initializeClient();
      const result = await (
        client.graphql as unknown as {
          aggregate: () => {
            withClassName: (name: string) => {
              withFields: (fields: string) => {
                do: () => Promise<{
                  data?: { Aggregate?: Record<string, unknown>[] };
                }>;
              };
            };
          };
        }
      )
        .aggregate()
        .withClassName(this.className)
        .withFields('meta { count }')
        .do();

      const aggregateResult = result.data?.Aggregate as
        | Record<string, unknown>
        | undefined;
      const aggregateData = aggregateResult?.[this.className] as
        | Record<string, unknown>[]
        | undefined;

      const firstItem = aggregateData?.[0] as
        | Record<string, unknown>
        | undefined;
      const meta = firstItem?.meta as Record<string, unknown> | undefined;

      return (meta?.count as number) || 0;
    } catch (error) {
      this.logger.error('Failed to get document count from Weaviate', error);

      return 0;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const client = await this.initializeClient();

      await (
        client.misc as unknown as {
          liveChecker: () => {
            do: () => Promise<boolean>;
          };
        }
      )
        .liveChecker()
        .do();

      return true;
    } catch (error) {
      this.logger.error('Weaviate health check failed', error);

      return false;
    }
  }
}
