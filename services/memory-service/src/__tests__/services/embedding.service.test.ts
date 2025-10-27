import { EmbeddingService } from '../../services/embedding.service';

// Mock OpenAI module
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      embeddings: {
        create: mockCreate,
      },
    };
  });
});

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmbeddingService();
  });

  describe('generateEmbedding', () => {
    it('should generate embedding for text', async () => {
      const mockEmbedding = new Array(1536).fill(0).map((_, i) => i / 1536);
      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding, index: 0, object: 'embedding' }],
        model: 'text-embedding-3-small',
        object: 'list',
        usage: { prompt_tokens: 10, total_tokens: 10 },
      });

      const result = await service.generateEmbedding('Test memory content');

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'Test memory content',
      });
      expect(result).toEqual(mockEmbedding);
      expect(result).toHaveLength(1536);
    });

    it('should handle OpenAI API errors', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      await expect(service.generateEmbedding('Test')).rejects.toThrow();
    });

    it('should handle empty text', async () => {
      const mockEmbedding = new Array(1536).fill(0);
      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding, index: 0, object: 'embedding' }],
        model: 'text-embedding-3-small',
        object: 'list',
        usage: { prompt_tokens: 0, total_tokens: 0 },
      });

      const result = await service.generateEmbedding('');

      expect(result).toHaveLength(1536);
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate similarity between identical vectors', () => {
      const vec1 = [1, 2, 3, 4];
      const vec2 = [1, 2, 3, 4];

      const similarity = service.cosineSimilarity(vec1, vec2);

      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should calculate similarity between orthogonal vectors', () => {
      const vec1 = [1, 0, 0, 0];
      const vec2 = [0, 1, 0, 0];

      const similarity = service.cosineSimilarity(vec1, vec2);

      expect(similarity).toBeCloseTo(0.0, 5);
    });

    it('should calculate similarity between opposite vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [-1, -2, -3];

      const similarity = service.cosineSimilarity(vec1, vec2);

      expect(similarity).toBeCloseTo(-1.0, 5);
    });

    it('should calculate similarity between partially similar vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [2, 3, 4];

      const similarity = service.cosineSimilarity(vec1, vec2);

      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should handle vectors with different dimensions', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2];

      expect(() => service.cosineSimilarity(vec1, vec2)).toThrow();
    });
  });

  describe('generateEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      const mockEmbeddings = [
        new Array(1536).fill(0).map((_, i) => i / 1536),
        new Array(1536).fill(0).map((_, i) => (i + 1) / 1536),
      ];

      mockCreate.mockResolvedValue({
        data: [
          { embedding: mockEmbeddings[0], index: 0, object: 'embedding' },
          { embedding: mockEmbeddings[1], index: 1, object: 'embedding' },
        ],
        model: 'text-embedding-3-small',
        object: 'list',
        usage: { prompt_tokens: 20, total_tokens: 20 },
      });

      const texts = ['Memory 1', 'Memory 2'];
      const results = await service.generateEmbeddings(texts);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: texts,
      });
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockEmbeddings[0]);
      expect(results[1]).toEqual(mockEmbeddings[1]);
    });

    it('should handle errors in batch generation', async () => {
      mockCreate.mockRejectedValue(new Error('Batch error'));

      await expect(service.generateEmbeddings(['test1', 'test2'])).rejects.toThrow();
    });
  });

  describe('getDimension', () => {
    it('should return the embedding dimension', () => {
      expect(service.getDimension()).toBe(1536);
    });
  });
});
