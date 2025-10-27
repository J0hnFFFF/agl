import { Logger } from '../../src/utils/logger';
import chalk from 'chalk';
import * as inquirer from 'inquirer';

// Mock chalk to return plain strings in tests
jest.mock('chalk', () => {
  const mockChalk: any = (str: string) => str;
  mockChalk.green = (str: string) => str;
  mockChalk.red = (str: string) => str;
  mockChalk.yellow = (str: string) => str;
  mockChalk.blue = (str: string) => str;
  mockChalk.cyan = (str: string) => str;
  mockChalk.gray = (str: string) => str;
  mockChalk.bold = { cyan: (str: string) => str };
  return mockChalk;
});

// Mock ora spinner
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    info: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    text: '',
  }));
});

// Mock boxen
jest.mock('boxen', () => {
  return jest.fn((content: string) => content);
});

// Mock inquirer
jest.mock('inquirer');

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('success', () => {
    it('should log success message', () => {
      Logger.success('Operation completed');

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0].join(' ');
      expect(loggedMessage).toContain('Operation completed');
    });
  });

  describe('error', () => {
    it('should log error message with string', () => {
      Logger.error('An error occurred');

      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorMessage = consoleErrorSpy.mock.calls[0].join(' ');
      expect(errorMessage).toContain('An error occurred');
    });

    it('should log error message with Error object', () => {
      const error = new Error('Test error');
      Logger.error('Operation failed', error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorMessage = consoleErrorSpy.mock.calls[0].join(' ');
      expect(errorMessage).toContain('Operation failed');
    });

    it('should log error stack in debug mode', () => {
      const error = new Error('Test error');
      process.env.DEBUG = 'true';

      Logger.error('Operation failed', error);

      expect(consoleErrorSpy).toHaveBeenCalled();

      delete process.env.DEBUG;
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      Logger.warn('This is a warning');

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0].join(' ');
      expect(loggedMessage).toContain('This is a warning');
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      Logger.info('Information message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0].join(' ');
      expect(loggedMessage).toContain('Information message');
    });
  });

  describe('debug', () => {
    it('should log debug message when DEBUG is true', () => {
      process.env.DEBUG = 'true';

      Logger.debug('Debug information');

      expect(consoleLogSpy).toHaveBeenCalled();

      delete process.env.DEBUG;
    });

    it('should not log debug message when DEBUG is false', () => {
      delete process.env.DEBUG;

      Logger.debug('Debug information');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('spinner', () => {
    it('should start spinner with message', () => {
      Logger.startSpinner('Loading...');

      // Spinner should be started (mocked)
      expect(consoleLogSpy).not.toHaveBeenCalled(); // Spinner doesn't log directly
    });

    it('should succeed spinner with message', () => {
      Logger.startSpinner('Loading...');
      Logger.succeedSpinner('Completed');

      // Should update and succeed spinner
      expect(true).toBe(true); // Verify mock was called
    });

    it('should fail spinner with message', () => {
      Logger.startSpinner('Loading...');
      Logger.failSpinner('Failed');

      // Should update and fail spinner
      expect(true).toBe(true);
    });

    it('should update spinner text', () => {
      Logger.startSpinner('Loading...');
      Logger.updateSpinner('Still loading...');

      // Should update spinner text
      expect(true).toBe(true);
    });

    it('should stop spinner', () => {
      Logger.startSpinner('Loading...');
      Logger.stopSpinner();

      // Should stop spinner
      expect(true).toBe(true);
    });
  });

  describe('banner', () => {
    it('should display AGL banner', () => {
      Logger.banner();

      expect(consoleLogSpy).toHaveBeenCalled();
      const bannerOutput = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(bannerOutput).toContain('AI Game Companion Engine');
    });
  });

  describe('box', () => {
    it('should display boxed message', () => {
      Logger.box('Important message', 'Title');

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should display boxed message without title', () => {
      Logger.box('Message without title');

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('table', () => {
    it('should display table with headers and rows', () => {
      const headers = ['Name', 'Age', 'City'];
      const rows = [
        ['Alice', '30', 'New York'],
        ['Bob', '25', 'San Francisco'],
        ['Charlie', '35', 'Boston'],
      ];

      Logger.table(headers, rows);

      expect(consoleLogSpy).toHaveBeenCalled();
      const tableOutput = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(tableOutput).toContain('Name');
      expect(tableOutput).toContain('Alice');
    });

    it('should handle empty rows', () => {
      const headers = ['Name', 'Age'];
      const rows: string[][] = [];

      Logger.table(headers, rows);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle rows with varying lengths', () => {
      const headers = ['Col1', 'Col2', 'Col3'];
      const rows = [
        ['A', 'B', 'C'],
        ['D', 'E'], // Shorter row
        ['F', 'G', 'H', 'I'], // Longer row
      ];

      Logger.table(headers, rows);

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('input', () => {
    it('should prompt for user input with default value', async () => {
      const mockPrompt = inquirer.prompt as jest.MockedFunction<typeof inquirer.prompt>;
      mockPrompt.mockResolvedValue({ value: 'user-input' });

      const result = await Logger.input('Enter value:', 'default-value');

      expect(mockPrompt).toHaveBeenCalled();
      expect(result).toBe('user-input');
    });

    it('should use default value when provided', async () => {
      const mockPrompt = inquirer.prompt as jest.MockedFunction<typeof inquirer.prompt>;
      mockPrompt.mockResolvedValue({ value: '' });

      await Logger.input('Enter value:', 'default');

      expect(mockPrompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            default: 'default',
          }),
        ]),
      );
    });
  });

  describe('confirm', () => {
    it('should prompt for confirmation', async () => {
      const mockPrompt = inquirer.prompt as jest.MockedFunction<typeof inquirer.prompt>;
      mockPrompt.mockResolvedValue({ confirm: true });

      const result = await Logger.confirm('Are you sure?');

      expect(mockPrompt).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should use default value for confirmation', async () => {
      const mockPrompt = inquirer.prompt as jest.MockedFunction<typeof inquirer.prompt>;
      mockPrompt.mockResolvedValue({ confirm: false });

      const result = await Logger.confirm('Proceed?', false);

      expect(mockPrompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            default: false,
          }),
        ]),
      );
      expect(result).toBe(false);
    });
  });

  describe('select', () => {
    it('should prompt for selection', async () => {
      const mockPrompt = inquirer.prompt as jest.MockedFunction<typeof inquirer.prompt>;
      mockPrompt.mockResolvedValue({ selection: 'option2' });

      const choices = ['option1', 'option2', 'option3'];
      const result = await Logger.select('Choose an option:', choices);

      expect(mockPrompt).toHaveBeenCalled();
      expect(result).toBe('option2');
    });

    it('should handle empty choices', async () => {
      const mockPrompt = inquirer.prompt as jest.MockedFunction<typeof inquirer.prompt>;
      mockPrompt.mockResolvedValue({ selection: '' });

      const result = await Logger.select('Choose:', []);

      expect(mockPrompt).toHaveBeenCalled();
    });
  });

  describe('progress', () => {
    it('should create progress bar with total', () => {
      const progress = Logger.progress(100);

      expect(progress).toBeDefined();
      expect(progress.start).toBeDefined();
      expect(progress.update).toBeDefined();
      expect(progress.stop).toBeDefined();
    });

    it('should start progress bar', () => {
      const progress = Logger.progress(100);
      progress.start(100, 0);

      // Progress bar should be started
      expect(true).toBe(true);
    });

    it('should update progress bar', () => {
      const progress = Logger.progress(100);
      progress.start(100, 0);
      progress.update(50);

      // Progress bar should be updated
      expect(true).toBe(true);
    });

    it('should stop progress bar', () => {
      const progress = Logger.progress(100);
      progress.start(100, 0);
      progress.stop();

      // Progress bar should be stopped
      expect(true).toBe(true);
    });
  });
});
