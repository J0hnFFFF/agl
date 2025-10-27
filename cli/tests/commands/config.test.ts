import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { configCommand } from '../../src/commands/config';
import { ConfigManager } from '../../src/utils/config';
import { Logger } from '../../src/utils/logger';

// Mock Logger
jest.mock('../../src/utils/logger');

describe('configCommand', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `agl-config-test-${Date.now()}`);
    await fs.ensureDir(testDir);

    originalCwd = process.cwd();
    process.chdir(testDir);

    // Mock home directory
    jest.spyOn(os, 'homedir').mockReturnValue(testDir);

    // Mock Logger methods
    (Logger.info as jest.Mock).mockImplementation(() => {});
    (Logger.success as jest.Mock).mockImplementation(() => {});
    (Logger.warn as jest.Mock).mockImplementation(() => {});
    (Logger.error as jest.Mock).mockImplementation(() => {});
    (Logger.table as jest.Mock).mockImplementation(() => {});

    // Mock console.log for get command
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(testDir);
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('set command', () => {
    it('should set local configuration value', async () => {
      await ConfigManager.init({ projectName: 'test-project' }, false);

      await configCommand({
        set: 'apiKey=test-api-key-123',
        global: false,
      });

      const config = await ConfigManager.getAll(false);
      expect(config.apiKey).toBe('test-api-key-123');

      expect(Logger.success).toHaveBeenCalledWith(
        expect.stringContaining('Configuration updated: apiKey = test-api-key-123'),
      );
      expect(Logger.info).toHaveBeenCalledWith('Scope: local');
    });

    it('should set global configuration value', async () => {
      await configCommand({
        set: 'apiKey=global-api-key',
        global: true,
      });

      const config = await ConfigManager.getAll(true);
      expect(config.apiKey).toBe('global-api-key');

      expect(Logger.info).toHaveBeenCalledWith('Scope: global');
    });

    it('should set nested configuration value', async () => {
      await ConfigManager.init({}, false);

      await configCommand({
        set: 'nested.value=test-value',
        global: false,
      });

      const value = await ConfigManager.get('nested.value', false);
      expect(value).toBe('test-value');
    });

    it('should handle values with equals sign', async () => {
      await ConfigManager.init({}, false);

      await configCommand({
        set: 'apiUrl=https://api.example.com?key=value',
        global: false,
      });

      const value = await ConfigManager.get('apiUrl', false);
      expect(value).toBe('https://api.example.com?key=value');
    });

    it('should reject invalid set format without equals sign', async () => {
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      await configCommand({
        set: 'invalidformat',
        global: false,
      });

      expect(Logger.error).toHaveBeenCalledWith(
        'Invalid format. Use: --set key=value',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      processExitSpy.mockRestore();
    });

    it('should reject set with empty key', async () => {
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      await configCommand({
        set: '=value',
        global: false,
      });

      expect(Logger.error).toHaveBeenCalledWith(
        'Invalid format. Use: --set key=value',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      processExitSpy.mockRestore();
    });

    it('should reject set with empty value', async () => {
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      await configCommand({
        set: 'key=',
        global: false,
      });

      expect(Logger.error).toHaveBeenCalledWith(
        'Invalid format. Use: --set key=value',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      processExitSpy.mockRestore();
    });
  });

  describe('get command', () => {
    beforeEach(async () => {
      await ConfigManager.init(
        {
          projectName: 'test-project',
          apiKey: 'local-api-key',
          nested: {
            value: 'nested-value',
          },
        },
        false,
      );
    });

    it('should get configuration value', async () => {
      await configCommand({
        get: 'apiKey',
        global: false,
      });

      expect(console.log).toHaveBeenCalledWith('local-api-key');
    });

    it('should get nested configuration value', async () => {
      await configCommand({
        get: 'nested.value',
        global: false,
      });

      expect(console.log).toHaveBeenCalledWith('nested-value');
    });

    it('should warn for non-existent key', async () => {
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      await configCommand({
        get: 'nonexistent',
        global: false,
      });

      expect(Logger.warn).toHaveBeenCalledWith(
        'Configuration key not found: nonexistent',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      processExitSpy.mockRestore();
    });

    it('should get from global config when global flag is true', async () => {
      await ConfigManager.init({ apiKey: 'global-key' }, true);

      await configCommand({
        get: 'apiKey',
        global: true,
      });

      expect(console.log).toHaveBeenCalledWith('global-key');
    });
  });

  describe('list command', () => {
    beforeEach(async () => {
      await ConfigManager.init(
        {
          projectName: 'test-project',
          template: 'web',
          apiKey: 'test-api-key',
          apiBaseUrl: 'https://api.agl.dev',
        },
        false,
      );
    });

    it('should list all local configuration', async () => {
      await configCommand({
        list: true,
        global: false,
      });

      expect(Logger.info).toHaveBeenCalledWith('Configuration (merged):');
      expect(Logger.table).toHaveBeenCalledWith(
        ['Key', 'Value'],
        expect.arrayContaining([
          ['projectName', 'test-project'],
          ['template', 'web'],
          ['apiKey', 'test-api-key'],
          ['apiBaseUrl', 'https://api.agl.dev'],
        ]),
      );
    });

    it('should list global configuration when global flag is true', async () => {
      await ConfigManager.init({ apiKey: 'global-key' }, true);

      await configCommand({
        list: true,
        global: true,
      });

      expect(Logger.info).toHaveBeenCalledWith('Configuration (global):');
      expect(Logger.table).toHaveBeenCalledWith(
        ['Key', 'Value'],
        expect.arrayContaining([['apiKey', 'global-key']]),
      );
    });

    it('should show message when no configuration exists', async () => {
      // Remove config file
      const configPath = path.join(testDir, '.agl.yml');
      if (await fs.pathExists(configPath)) {
        await fs.remove(configPath);
      }

      await configCommand({
        list: true,
        global: false,
      });

      expect(Logger.info).toHaveBeenCalledWith('No configuration found');
    });

    it('should truncate long values to 50 characters', async () => {
      const longValue = 'a'.repeat(100);
      await ConfigManager.set('longKey', longValue, false);

      await configCommand({
        list: true,
        global: false,
      });

      expect(Logger.table).toHaveBeenCalledWith(
        ['Key', 'Value'],
        expect.arrayContaining([['longKey', longValue.substring(0, 50)]]),
      );
    });

    it('should handle object values', async () => {
      await ConfigManager.set('objectKey', { nested: 'value' }, false);

      await configCommand({
        list: true,
        global: false,
      });

      expect(Logger.table).toHaveBeenCalledWith(
        ['Key', 'Value'],
        expect.arrayContaining([['objectKey', expect.stringContaining('nested')]]),
      );
    });
  });

  describe('help message', () => {
    it('should show help when no options specified', async () => {
      await configCommand({});

      expect(Logger.info).toHaveBeenCalledWith('AGL Configuration Management');
      expect(Logger.info).toHaveBeenCalledWith('Usage:');
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('agl config --set key=value'),
      );
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('agl config --get key'),
      );
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('agl config --list'),
      );
    });

    it('should show examples', async () => {
      await configCommand({});

      expect(Logger.info).toHaveBeenCalledWith('Examples:');
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('agl config --set apiKey=your-key'),
      );
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('agl config --get apiKey'),
      );
    });
  });

  describe('scope precedence', () => {
    it('should set local config when global flag is false', async () => {
      await configCommand({
        set: 'apiKey=local-key',
        global: false,
      });

      const localConfig = await ConfigManager.getAll(false);
      const globalConfig = await ConfigManager.getAll(true);

      expect(localConfig.apiKey).toBe('local-key');
      expect(globalConfig.apiKey).toBeUndefined();
    });

    it('should set global config when global flag is true', async () => {
      await configCommand({
        set: 'apiKey=global-key',
        global: true,
      });

      const globalConfig = await ConfigManager.getAll(true);
      expect(globalConfig.apiKey).toBe('global-key');
    });

    it('should get local config by default', async () => {
      await ConfigManager.init({ apiKey: 'local-key' }, false);
      await ConfigManager.init({ apiKey: 'global-key' }, true);

      await configCommand({
        get: 'apiKey',
        global: false,
      });

      expect(console.log).toHaveBeenCalledWith('local-key');
    });

    it('should list merged config by default', async () => {
      await ConfigManager.init({ projectName: 'test', apiKey: 'local' }, false);
      await ConfigManager.init({ apiKey: 'global', apiBaseUrl: 'https://api.agl.dev' }, true);

      await configCommand({
        list: true,
        global: false,
      });

      // Should show merged config (local overrides global)
      expect(Logger.table).toHaveBeenCalledWith(
        ['Key', 'Value'],
        expect.arrayContaining([
          ['apiKey', 'local'], // Local overrides global
          ['apiBaseUrl', 'https://api.agl.dev'], // From global
          ['projectName', 'test'], // From local
        ]),
      );
    });
  });

  describe('Error handling', () => {
    it('should handle config loading errors', async () => {
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      // Create invalid YAML file
      await fs.writeFile(path.join(testDir, '.agl.yml'), 'invalid: yaml: [[[');

      await configCommand({
        get: 'anyKey',
        global: false,
      });

      expect(Logger.error).toHaveBeenCalledWith(
        'Configuration operation failed',
        expect.any(Error),
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      processExitSpy.mockRestore();
    });

    it('should handle file write errors gracefully', async () => {
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      // Mock ConfigManager.set to throw error
      jest.spyOn(ConfigManager, 'set').mockRejectedValue(new Error('Write failed'));

      await configCommand({
        set: 'key=value',
        global: false,
      });

      expect(Logger.error).toHaveBeenCalledWith(
        'Configuration operation failed',
        expect.any(Error),
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      processExitSpy.mockRestore();
    });
  });

  describe('Special characters', () => {
    it('should handle keys with special characters', async () => {
      await ConfigManager.init({}, false);

      await configCommand({
        set: 'my-special_key.nested=value',
        global: false,
      });

      const value = await ConfigManager.get('my-special_key.nested', false);
      expect(value).toBe('value');
    });

    it('should handle values with spaces', async () => {
      await ConfigManager.init({}, false);

      await configCommand({
        set: 'description=This is a description with spaces',
        global: false,
      });

      const value = await ConfigManager.get('description', false);
      expect(value).toBe('This is a description with spaces');
    });

    it('should handle URLs as values', async () => {
      await ConfigManager.init({}, false);

      await configCommand({
        set: 'apiUrl=https://api.example.com:8080/v1/endpoint?key=value&other=data',
        global: false,
      });

      const value = await ConfigManager.get('apiUrl', false);
      expect(value).toBe('https://api.example.com:8080/v1/endpoint?key=value&other=data');
    });
  });
});
