import { Injectable, Logger } from '@nestjs/common';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';

// Weaviate v4 client types - will be dynamically imported
interface WeaviateClient {
  collections: any;
  schema: any;
  data: any;
  graphql: any;
  misc: any;
}

export interface HvacSemanticDocument {
  id?: string;
  content: string;
  title: string;
  type: 'service_report' | 'maintenance_log' | 'customer_note' | 'equipment_manual' | 'email' | 'transcription';
  metadata: {
    customerId?: string;
    equipmentId?: string;
    technicianId?: string;
    ticketId?: string;
    timestamp: Date;
    source: string;
    language?: string;
    [key: string]: any;
  };
}

export interface HvacSemanticSearchQuery {
  query: string;
  type?: string[];
  customerId?: string;
  equipmentId?: string;
  limit?: number;
  certainty?: number;
  where?: any;
}

export interface HvacSemanticSearchResult {
  id: string;
  content: string;
  title: string;
  type: string;
  score: number;
  metadata: any;
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
                      do: async () => ({ data: { Get: {} } })
                    }),
                    do: async () => ({ data: { Get: {} } })
                  })
                }),
                do: async () => ({ data: { Get: {} } })
              })
            })
          })
        },
        schema: {
          classGetter: () => ({
            withClassName: () => ({
              do: async () => null
            })
          }),
          classCreator: () => ({
            withClass: () => ({
              do: async () => ({ class: this.className })
            })
          })
        },
        data: {
          creator: () => ({
            withClassName: () => ({
              withProperties: () => ({
                do: async () => ({ id: 'mock-id-' + Date.now() })
              })
            })
          }),
          getterById: () => ({
            withClassName: () => ({
              withId: () => ({
                do: async () => null
              })
            })
          }),
          deleter: () => ({
            withClassName: () => ({
              withId: () => ({
                do: async () => true
              })
            })
          })
        },
        graphql: {
          get: () => ({
            withClassName: () => ({
              withFields: () => ({
                withNearText: () => ({
                  withLimit: () => ({
                    withWhere: () => ({
                      do: async () => ({ data: { Get: { [this.className]: [] } } })
                    }),
                    do: async () => ({ data: { Get: { [this.className]: [] } } })
                  })
                }),
                do: async () => ({ data: { Get: { [this.className]: [] } } })
              })
            })
          }),
          aggregate: () => ({
            withClassName: () => ({
              withFields: () => ({
                do: async () => ({ data: { Aggregate: { [this.className]: [{ meta: { count: 0 } }] } } })
              })
            })
          })
        },
        misc: {
          liveChecker: () => ({
            do: async () => true
          })
        }
      } as WeaviateClient;

      this.isInitialized = true;
      this.logger.log(`Mock Weaviate client initialized for ${config.scheme}://${config.host}:${config.port}`);
      this.logger.warn('Using mock Weaviate client - install weaviate-client package for full functionality');

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
      const exists = await client.schema
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
    await client.schema.classCreator().withClass(classDefinition).do();
    this.logger.log(`Created Weaviate schema for class: ${this.className}`);
  }

  async insertDocument(document: HvacSemanticDocument): Promise<string> {
    try {
      await this.ensureSchema();
      const client = await this.initializeClient();

      const result = await client.data
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

  async searchDocuments(query: HvacSemanticSearchQuery): Promise<HvacSemanticSearchResult[]> {
    try {
      await this.ensureSchema();
      const client = await this.initializeClient();

      let searchBuilder = client.graphql
        .get()
        .withClassName(this.className)
        .withFields('content title type customerId equipmentId technicianId ticketId timestamp source language metadata _additional { certainty distance }')
        .withNearText({ concepts: [query.query] })
        .withLimit(query.limit || 10);

      // Add certainty threshold
      if (query.certainty) {
        searchBuilder = searchBuilder.withNearText({ 
          concepts: [query.query],
          certainty: query.certainty 
        });
      }

      // Add where filters
      if (query.type && query.type.length > 0) {
        searchBuilder = searchBuilder.withWhere({
          path: ['type'],
          operator: 'Equal',
          valueText: query.type[0], // For simplicity, using first type
        });
      }

      if (query.customerId) {
        searchBuilder = searchBuilder.withWhere({
          path: ['customerId'],
          operator: 'Equal',
          valueText: query.customerId,
        });
      }

      if (query.equipmentId) {
        searchBuilder = searchBuilder.withWhere({
          path: ['equipmentId'],
          operator: 'Equal',
          valueText: query.equipmentId,
        });
      }

      const result = await searchBuilder.do();

      if (!result.data?.Get?.[this.className]) {
        return [];
      }

      return result.data.Get[this.className].map((item: any) => ({
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
      const result = await client.data
        .getterById()
        .withClassName(this.className)
        .withId(id)
        .do();

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        content: result.properties.content,
        title: result.properties.title,
        type: result.properties.type,
        score: 1.0,
        metadata: {
          customerId: result.properties.customerId,
          equipmentId: result.properties.equipmentId,
          technicianId: result.properties.technicianId,
          ticketId: result.properties.ticketId,
          timestamp: result.properties.timestamp,
          source: result.properties.source,
          language: result.properties.language,
          ...result.properties.metadata,
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
      await client.data
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
      const result = await client.graphql
        .aggregate()
        .withClassName(this.className)
        .withFields('meta { count }')
        .do();

      return result.data?.Aggregate?.[this.className]?.[0]?.meta?.count || 0;
    } catch (error) {
      this.logger.error('Failed to get document count from Weaviate', error);
      return 0;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const client = await this.initializeClient();
      await client.misc.liveChecker().do();
      return true;
    } catch (error) {
      this.logger.error('Weaviate health check failed', error);
      return false;
    }
  }
}
