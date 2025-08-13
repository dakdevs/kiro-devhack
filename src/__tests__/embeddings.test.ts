import { describe, it, expect, vi, beforeEach } from 'vitest';
import { embed4B, embedOne4B } from '~/embeddings';

// Mock the OpenAI client
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      embeddings: {
        create: vi.fn()
      }
    }))
  };
});

// Mock the server config
vi.mock('~/config/server-config', () => ({
  serverConfig: {
    embeddings: {
      dashscope: {
        apiKey: 'test-api-key',
        baseUrl: 'https://test-dashscope.com/v1',
        modelName: 'text-embedding-v3',
      },
    },
  },
}));

describe('Embeddings', () => {
  const mockEmbeddingsCreate = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the OpenAI client instance
    const { default: OpenAI } = require('openai');
    OpenAI.mockImplementation(() => ({
      embeddings: {
        create: mockEmbeddingsCreate
      }
    }));
  });

  describe('embedOne4B', () => {
    it('should generate embedding for single text', async () => {
      const mockEmbedding = new Array(2560).fill(0).map(() => Math.random());
      
      mockEmbeddingsCreate.mockResolvedValueOnce({
        data: [{ embedding: mockEmbedding }]
      });

      const result = await embedOne4B('test text');

      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-v3',
        input: 'test text',
        encoding_format: 'float'
      });
      
      expect(result).toEqual(mockEmbedding);
      expect(result).toHaveLength(2560);
    });

    it('should handle empty text input', async () => {
      const mockEmbedding = new Array(2560).fill(0);
      
      mockEmbeddingsCreate.mockResolvedValueOnce({
        data: [{ embedding: mockEmbedding }]
      });

      const result = await embedOne4B('');

      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-v3',
        input: '',
        encoding_format: 'float'
      });
      
      expect(result).toEqual(mockEmbedding);
    });

    it('should handle very long text input', async () => {
      const longText = 'a'.repeat(10000);
      const mockEmbedding = new Array(2560).fill(0.1);
      
      mockEmbeddingsCreate.mockResolvedValueOnce({
        data: [{ embedding: mockEmbedding }]
      });

      const result = await embedOne4B(longText);

      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-v3',
        input: longText,
        encoding_format: 'float'
      });
      
      expect(result).toEqual(mockEmbedding);
    });

    it('should handle API errors with retry', async () => {
      mockEmbeddingsCreate
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          data: [{ embedding: new Array(2560).fill(0.1) }]
        });

      const result = await embedOne4B('test text');

      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2560);
    });

    it('should handle rate limit errors with exponential backoff', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      
      mockEmbeddingsCreate
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          data: [{ embedding: new Array(2560).fill(0.1) }]
        });

      const startTime = Date.now();
      const result = await embedOne4B('test text');
      const endTime = Date.now();

      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(2560);
      // Should have some delay due to exponential backoff
      expect(endTime - startTime).toBeGreaterThan(100);
    });

    it('should throw error after max retries', async () => {
      mockEmbeddingsCreate.mockRejectedValue(new Error('Persistent API Error'));

      await expect(embedOne4B('test text')).rejects.toThrow('Persistent API Error');
      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    it('should handle malformed API response', async () => {
      mockEmbeddingsCreate.mockResolvedValueOnce({
        data: [] // Empty data array
      });

      await expect(embedOne4B('test text')).rejects.toThrow();
    });

    it('should handle API response with wrong embedding dimensions', async () => {
      mockEmbeddingsCreate.mockResolvedValueOnce({
        data: [{ embedding: new Array(100).fill(0.1) }] // Wrong dimensions
      });

      const result = await embedOne4B('test text');
      expect(result).toHaveLength(100); // Should still return what API provides
    });
  });

  describe('embed4B', () => {
    it('should generate embeddings for multiple texts', async () => {
      const mockEmbeddings = [
        new Array(2560).fill(0.1),
        new Array(2560).fill(0.2),
        new Array(2560).fill(0.3)
      ];
      
      mockEmbeddingsCreate.mockResolvedValueOnce({
        data: mockEmbeddings.map(embedding => ({ embedding }))
      });

      const texts = ['text 1', 'text 2', 'text 3'];
      const result = await embed4B(texts);

      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-v3',
        input: texts,
        encoding_format: 'float'
      });
      
      expect(result).toEqual(mockEmbeddings);
      expect(result).toHaveLength(3);
      result.forEach(embedding => {
        expect(embedding).toHaveLength(2560);
      });
    });

    it('should handle empty input array', async () => {
      const result = await embed4B([]);
      
      expect(mockEmbeddingsCreate).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle single text in array', async () => {
      const mockEmbedding = new Array(2560).fill(0.5);
      
      mockEmbeddingsCreate.mockResolvedValueOnce({
        data: [{ embedding: mockEmbedding }]
      });

      const result = await embed4B(['single text']);

      expect(result).toEqual([mockEmbedding]);
      expect(result[0]).toHaveLength(2560);
    });

    it('should handle large batch of texts', async () => {
      const texts = Array.from({ length: 100 }, (_, i) => `text ${i}`);
      const mockEmbeddings = texts.map(() => new Array(2560).fill(0.1));
      
      mockEmbeddingsCreate.mockResolvedValueOnce({
        data: mockEmbeddings.map(embedding => ({ embedding }))
      });

      const result = await embed4B(texts);

      expect(result).toHaveLength(100);
      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-v3',
        input: texts,
        encoding_format: 'float'
      });
    });

    it('should handle mixed content types in batch', async () => {
      const texts = [
        'Short text',
        'A much longer text that contains multiple sentences and various punctuation marks!',
        '',
        '123 numbers and symbols @#$%',
        'Unicode text: 你好世界 🌍'
      ];
      
      const mockEmbeddings = texts.map(() => new Array(2560).fill(0.1));
      
      mockEmbeddingsCreate.mockResolvedValueOnce({
        data: mockEmbeddings.map(embedding => ({ embedding }))
      });

      const result = await embed4B(texts);

      expect(result).toHaveLength(5);
      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-v3',
        input: texts,
        encoding_format: 'float'
      });
    });

    it('should handle API errors in batch processing', async () => {
      const texts = ['text 1', 'text 2'];
      
      mockEmbeddingsCreate
        .mockRejectedValueOnce(new Error('Batch API Error'))
        .mockResolvedValueOnce({
          data: [
            { embedding: new Array(2560).fill(0.1) },
            { embedding: new Array(2560).fill(0.2) }
          ]
        });

      const result = await embed4B(texts);

      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should handle mismatched response length', async () => {
      const texts = ['text 1', 'text 2', 'text 3'];
      
      mockEmbeddingsCreate.mockResolvedValueOnce({
        data: [
          { embedding: new Array(2560).fill(0.1) },
          { embedding: new Array(2560).fill(0.2) }
          // Missing third embedding
        ]
      });

      await expect(embed4B(texts)).rejects.toThrow();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      
      mockEmbeddingsCreate
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce({
          data: [{ embedding: new Array(2560).fill(0.1) }]
        });

      const result = await embedOne4B('test text');
      expect(result).toHaveLength(2560);
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Invalid API key');
      (authError as any).status = 401;
      
      mockEmbeddingsCreate.mockRejectedValue(authError);

      await expect(embedOne4B('test text')).rejects.toThrow('Invalid API key');
    });

    it('should handle server errors', async () => {
      const serverError = new Error('Internal server error');
      (serverError as any).status = 500;
      
      mockEmbeddingsCreate
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({
          data: [{ embedding: new Array(2560).fill(0.1) }]
        });

      const result = await embedOne4B('test text');
      expect(result).toHaveLength(2560);
    });
  });
});