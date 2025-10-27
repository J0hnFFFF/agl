import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.CI = 'true';

// Mock user home directory for tests
const testHomeDir = path.join(os.tmpdir(), 'agl-cli-test-home');

beforeAll(async () => {
  // Create test home directory
  await fs.ensureDir(testHomeDir);
});

afterAll(async () => {
  // Clean up test home directory
  await fs.remove(testHomeDir);
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Extend Jest matchers
expect.extend({
  toBeValidPath(received: string) {
    const pass = typeof received === 'string' && path.isAbsolute(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid absolute path`
          : `expected ${received} to be a valid absolute path`,
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidPath(): R;
    }
  }
}
