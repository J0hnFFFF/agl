import axios from 'axios';
import { statusCommand } from '../../src/commands/status';
import { ConfigManager } from '../../src/utils/config';
import { Logger } from '../../src/utils/logger';

// Mock dependencies
jest.mock('axios');
jest.mock('../../src/utils/logger');
jest.mock('../../src/utils/config');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('statusCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Logger methods
    (Logger.info as jest.Mock).mockImplementation(() => {});
    (Logger.success as jest.Mock).mockImplementation(() => {});
    (Logger.warn as jest.Mock).mockImplementation(() => {});
    (Logger.error as jest.Mock).mockImplementation(() => {});
    (Logger.startSpinner as jest.Mock).mockImplementation(() => {});
    (Logger.succeedSpinner as jest.Mock).mockImplementation(() => {});
    (Logger.failSpinner as jest.Mock).mockImplementation(() => {});
    (Logger.table as jest.Mock).mockImplementation(() => {});
    (Logger.debug as jest.Mock).mockImplementation(() => {});

    // Mock ConfigManager
    (ConfigManager.getMerged as jest.Mock).mockResolvedValue({
      apiBaseUrl: 'http://localhost:3000',
      emotionServiceUrl: 'http://localhost:8000',
      dialogueServiceUrl: 'http://localhost:8001',
      memoryServiceUrl: 'http://localhost:3002',
    });
  });

  describe('All services online', () => {
    it('should report all services as online', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'healthy' },
      });

      await statusCommand({ verbose: false });

      expect(Logger.succeedSpinner).toHaveBeenCalledTimes(4); // 4 services
      expect(Logger.success).toHaveBeenCalledWith(
        expect.stringContaining('All services are online'),
      );
    });

    it('should display service status table', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'healthy' },
      });

      await statusCommand({ verbose: false });

      expect(Logger.table).toHaveBeenCalledWith(
        ['Service', 'Status', 'URL'],
        expect.arrayContaining([
          expect.arrayContaining(['API Service', '✓ Online', 'http://localhost:3000']),
          expect.arrayContaining(['Emotion Service', '✓ Online', 'http://localhost:8000']),
          expect.arrayContaining(['Dialogue Service', '✓ Online', 'http://localhost:8001']),
          expect.arrayContaining(['Memory Service', '✓ Online', 'http://localhost:3002']),
        ]),
      );
    });
  });

  describe('Some services offline', () => {
    it('should report some services as offline', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ status: 200, data: { status: 'healthy' } }) // API
        .mockRejectedValueOnce(new Error('Connection refused')) // Emotion
        .mockResolvedValueOnce({ status: 200, data: { status: 'healthy' } }) // Dialogue
        .mockRejectedValueOnce(new Error('Connection refused')); // Memory

      await statusCommand({ verbose: false });

      expect(Logger.succeedSpinner).toHaveBeenCalledTimes(2);
      expect(Logger.failSpinner).toHaveBeenCalledTimes(2);
      expect(Logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Some services are offline'),
      );
    });

    it('should show correct counts in summary', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ status: 200, data: { status: 'healthy' } }) // API online
        .mockRejectedValueOnce(new Error('Connection refused')) // Emotion offline
        .mockRejectedValueOnce(new Error('Connection refused')) // Dialogue offline
        .mockRejectedValueOnce(new Error('Connection refused')); // Memory offline

      await statusCommand({ verbose: false });

      expect(Logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('(1/4 online)'),
      );
    });
  });

  describe('All services offline', () => {
    it('should report all services as offline', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      await statusCommand({ verbose: false });

      expect(Logger.failSpinner).toHaveBeenCalledTimes(4);
      expect(Logger.error).toHaveBeenCalledWith('All services are offline');
    });
  });

  describe('Unhealthy services', () => {
    it('should report service as unhealthy when status is not 200', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ status: 503, data: { error: 'Service unavailable' } }) // API unhealthy
        .mockResolvedValueOnce({ status: 200, data: { status: 'healthy' } }) // Emotion ok
        .mockResolvedValueOnce({ status: 500, data: { error: 'Internal error' } }) // Dialogue error
        .mockResolvedValueOnce({ status: 200, data: { status: 'healthy' } }); // Memory ok

      await statusCommand({ verbose: false });

      expect(Logger.failSpinner).toHaveBeenCalledWith(
        expect.stringContaining('API Service: ✗ Unhealthy (503)'),
      );
      expect(Logger.failSpinner).toHaveBeenCalledWith(
        expect.stringContaining('Dialogue Service: ✗ Unhealthy (500)'),
      );
      expect(Logger.succeedSpinner).toHaveBeenCalledTimes(2);
    });
  });

  describe('Health endpoints', () => {
    it('should use correct health endpoint for API service', async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} });

      await statusCommand({ verbose: false });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/metrics/health',
        expect.any(Object),
      );
    });

    it('should use correct health endpoint for other services', async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} });

      await statusCommand({ verbose: false });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/health',
        expect.any(Object),
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8001/health',
        expect.any(Object),
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3002/health',
        expect.any(Object),
      );
    });
  });

  describe('Timeout', () => {
    it('should use 5 second timeout for health checks', async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} });

      await statusCommand({ verbose: false });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timeout: 5000,
        }),
      );
    });
  });

  describe('Verbose mode', () => {
    it('should display response data in verbose mode', async () => {
      const healthData = {
        status: 'healthy',
        uptime: 12345,
        version: '1.0.0',
      };

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: healthData,
      });

      await statusCommand({ verbose: true });

      expect(Logger.debug).toHaveBeenCalledWith(
        JSON.stringify(healthData, null, 2),
      );
    });

    it('should display error messages in verbose mode', async () => {
      const error = new Error('Connection timeout');

      mockedAxios.get.mockRejectedValue(error);

      await statusCommand({ verbose: true });

      expect(Logger.debug).toHaveBeenCalledWith('Connection timeout');
    });

    it('should not display extra info in non-verbose mode', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'healthy' },
      });

      await statusCommand({ verbose: false });

      expect(Logger.debug).not.toHaveBeenCalled();
    });
  });

  describe('Configuration fallback', () => {
    it('should use default URLs when config is empty', async () => {
      (ConfigManager.getMerged as jest.Mock).mockResolvedValue({});

      mockedAxios.get.mockResolvedValue({ status: 200, data: {} });

      await statusCommand({ verbose: false });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/metrics/health',
        expect.any(Object),
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/health',
        expect.any(Object),
      );
    });

    it('should use custom URLs from config', async () => {
      (ConfigManager.getMerged as jest.Mock).mockResolvedValue({
        apiBaseUrl: 'https://api.example.com',
        emotionServiceUrl: 'https://emotion.example.com',
        dialogueServiceUrl: 'https://dialogue.example.com',
        memoryServiceUrl: 'https://memory.example.com',
      });

      mockedAxios.get.mockResolvedValue({ status: 200, data: {} });

      await statusCommand({ verbose: false });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/metrics/health',
        expect.any(Object),
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://emotion.example.com/health',
        expect.any(Object),
      );
    });
  });

  describe('Error handling', () => {
    it('should handle config loading errors', async () => {
      (ConfigManager.getMerged as jest.Mock).mockRejectedValue(
        new Error('Failed to load config'),
      );

      await expect(statusCommand({ verbose: false })).rejects.toThrow();

      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to check service status',
        expect.any(Error),
      );
    });

    it('should continue checking other services if one fails', async () => {
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Connection refused')) // API fails
        .mockResolvedValueOnce({ status: 200, data: {} }) // Emotion succeeds
        .mockResolvedValueOnce({ status: 200, data: {} }) // Dialogue succeeds
        .mockResolvedValueOnce({ status: 200, data: {} }); // Memory succeeds

      await statusCommand({ verbose: false });

      expect(mockedAxios.get).toHaveBeenCalledTimes(4); // All services checked
      expect(Logger.succeedSpinner).toHaveBeenCalledTimes(3);
      expect(Logger.failSpinner).toHaveBeenCalledTimes(1);
    });
  });

  describe('Process exit', () => {
    let processExitSpy: jest.SpyInstance;

    beforeEach(() => {
      processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    });

    afterEach(() => {
      processExitSpy.mockRestore();
    });

    it('should not exit on successful health checks', async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} });

      await statusCommand({ verbose: false });

      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should not exit when services are offline', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      await statusCommand({ verbose: false });

      // Status command should report but not exit
      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });
});
