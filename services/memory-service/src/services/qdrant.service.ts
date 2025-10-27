import { QdrantClient } from '@qdrant/js-client-rest';

interface MemoryPoint {
  id: string;
  vector: number[];
  payload: {
    playerId: string;
    memoryId: string;
    content: string;
    type: string;
    emotion?: string;
    importance: number;
    createdAt: string;
  };
}

interface SearchResult {
  id: string;
  score: number;
  payload: MemoryPoint['payload'];
}

export class QdrantService {
  private client: QdrantClient;
  private readonly collectionName = 'player_memories';
  private readonly vectorSize = 1536; // OpenAI text-embedding-3-small dimension

  constructor() {
    const host = process.env.QDRANT_HOST || 'localhost';
    const port = parseInt(process.env.QDRANT_PORT || '6333', 10);

    this.client = new QdrantClient({
      url: `http://${host}:${port}`,
    });
  }

  /**
   * Initialize Qdrant collection
   */
  async initialize(): Promise<void> {
    try {
      // Check if collection exists
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (col) => col.name === this.collectionName
      );

      if (!exists) {
        // Create collection
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine',
          },
          optimizers_config: {
            default_segment_number: 2,
          },
          replication_factor: 1,
        });

        console.log(`Created Qdrant collection: ${this.collectionName}`);
      } else {
        console.log(`Qdrant collection already exists: ${this.collectionName}`);
      }

      // Create indexes for filtering
      await this.createIndexes();
    } catch (error) {
      console.error('Error initializing Qdrant:', error);
      throw error;
    }
  }

  /**
   * Create indexes for efficient filtering
   */
  private async createIndexes(): Promise<void> {
    try {
      // Create index for playerId
      await this.client.createPayloadIndex(this.collectionName, {
        field_name: 'playerId',
        field_schema: 'keyword',
      });

      // Create index for type
      await this.client.createPayloadIndex(this.collectionName, {
        field_name: 'type',
        field_schema: 'keyword',
      });

      // Create index for importance
      await this.client.createPayloadIndex(this.collectionName, {
        field_name: 'importance',
        field_schema: 'float',
      });

      console.log('Created payload indexes');
    } catch (error) {
      // Indexes might already exist, ignore errors
      console.log('Indexes already exist or failed to create:', error);
    }
  }

  /**
   * Store a memory vector
   */
  async storeMemory(memory: MemoryPoint): Promise<void> {
    try {
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: [
          {
            id: memory.id,
            vector: memory.vector,
            payload: memory.payload,
          },
        ],
      });
    } catch (error) {
      console.error('Error storing memory in Qdrant:', error);
      throw error;
    }
  }

  /**
   * Search for similar memories
   */
  async searchSimilar(
    playerId: string,
    queryVector: number[],
    limit: number = 5,
    minImportance?: number
  ): Promise<SearchResult[]> {
    try {
      const filter: any = {
        must: [{ key: 'playerId', match: { value: playerId } }],
      };

      if (minImportance !== undefined) {
        filter.must.push({
          key: 'importance',
          range: { gte: minImportance },
        });
      }

      const results = await this.client.search(this.collectionName, {
        vector: queryVector,
        filter,
        limit,
        with_payload: true,
      });

      return results.map((result) => ({
        id: result.id as string,
        score: result.score,
        payload: result.payload as MemoryPoint['payload'],
      }));
    } catch (error) {
      console.error('Error searching Qdrant:', error);
      throw error;
    }
  }

  /**
   * Delete a memory vector
   */
  async deleteMemory(memoryId: string): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        points: [memoryId],
      });
    } catch (error) {
      console.error('Error deleting memory from Qdrant:', error);
      throw error;
    }
  }

  /**
   * Delete multiple memories
   */
  async deleteMemories(memoryIds: string[]): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        points: memoryIds,
      });
    } catch (error) {
      console.error('Error deleting memories from Qdrant:', error);
      throw error;
    }
  }

  /**
   * Get memory by ID
   */
  async getMemory(memoryId: string): Promise<MemoryPoint | null> {
    try {
      const results = await this.client.retrieve(this.collectionName, {
        ids: [memoryId],
        with_payload: true,
        with_vector: true,
      });

      if (results.length === 0) {
        return null;
      }

      const point = results[0];
      return {
        id: point.id as string,
        vector: point.vector as number[],
        payload: point.payload as MemoryPoint['payload'],
      };
    } catch (error) {
      console.error('Error retrieving memory from Qdrant:', error);
      throw error;
    }
  }

  /**
   * Count memories for a player
   */
  async countMemories(playerId: string): Promise<number> {
    try {
      const result = await this.client.count(this.collectionName, {
        filter: {
          must: [{ key: 'playerId', match: { value: playerId } }],
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error counting memories:', error);
      throw error;
    }
  }
}
