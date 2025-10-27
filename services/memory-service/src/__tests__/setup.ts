// Test setup and global mocks

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.QDRANT_HOST = 'localhost';
process.env.QDRANT_PORT = '6333';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.PORT = '3002';

// Extend Jest timeout for integration tests
jest.setTimeout(10000);

// Global test utilities
global.console = {
  ...console,
  // Suppress error logs in tests unless needed
  error: jest.fn(),
  warn: jest.fn(),
};
