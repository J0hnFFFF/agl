import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { ConfigManager } from '../../src/utils/config';

describe('ConfigManager', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `agl-test-${Date.now()}`);
    await fs.ensureDir(testDir);

    // Save and change to test directory
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Mock home directory
    jest.spyOn(os, 'homedir').mockReturnValue(testDir);
  });

  afterEach(async () => {
    // Restore original directory
    process.chdir(originalCwd);

    // Clean up test directory
    await fs.remove(testDir);

    // Restore mocks
    jest.restoreAllMocks();
  });

  describe('init', () => {
    it('should create local config file with initial data', async () => {
      const initialData = {
        projectName: 'test-project',
        template: 'web',
      };

      await ConfigManager.init(initialData, false);

      const configPath = path.join(testDir, '.agl.yml');
      expect(await fs.pathExists(configPath)).toBe(true);

      const config = await ConfigManager.getAll(false);
      expect(config.projectName).toBe('test-project');
      expect(config.template).toBe('web');
    });

    it('should create global config file when global flag is true', async () => {
      const initialData = {
        apiKey: 'test-api-key',
      };

      await ConfigManager.init(initialData, true);

      const globalConfigPath = path.join(testDir, '.agl', 'config.yml');
      expect(await fs.pathExists(globalConfigPath)).toBe(true);

      const config = await ConfigManager.getAll(true);
      expect(config.apiKey).toBe('test-api-key');
    });

    it('should create parent directories if they do not exist', async () => {
      const initialData = { test: 'value' };

      await ConfigManager.init(initialData, true);

      const globalDir = path.join(testDir, '.agl');
      expect(await fs.pathExists(globalDir)).toBe(true);
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      await ConfigManager.init(
        {
          projectName: 'test-project',
          apiKey: 'local-key',
          nested: {
            value: 'nested-value',
            deep: {
              value: 'deep-value',
            },
          },
        },
        false,
      );
    });

    it('should get top-level configuration value', async () => {
      const value = await ConfigManager.get('projectName', false);
      expect(value).toBe('test-project');
    });

    it('should get nested configuration value', async () => {
      const value = await ConfigManager.get('nested.value', false);
      expect(value).toBe('nested-value');
    });

    it('should get deeply nested configuration value', async () => {
      const value = await ConfigManager.get('nested.deep.value', false);
      expect(value).toBe('deep-value');
    });

    it('should return undefined for non-existent key', async () => {
      const value = await ConfigManager.get('nonexistent', false);
      expect(value).toBeUndefined();
    });

    it('should return undefined for non-existent nested key', async () => {
      const value = await ConfigManager.get('nested.nonexistent', false);
      expect(value).toBeUndefined();
    });
  });

  describe('set', () => {
    beforeEach(async () => {
      await ConfigManager.init({ projectName: 'test-project' }, false);
    });

    it('should set top-level configuration value', async () => {
      await ConfigManager.set('apiKey', 'new-api-key', false);

      const value = await ConfigManager.get('apiKey', false);
      expect(value).toBe('new-api-key');
    });

    it('should set nested configuration value', async () => {
      await ConfigManager.set('nested.value', 'nested-value', false);

      const value = await ConfigManager.get('nested.value', false);
      expect(value).toBe('nested-value');
    });

    it('should set deeply nested configuration value', async () => {
      await ConfigManager.set('deep.nested.value', 'deep-value', false);

      const value = await ConfigManager.get('deep.nested.value', false);
      expect(value).toBe('deep-value');
    });

    it('should update existing configuration value', async () => {
      await ConfigManager.set('projectName', 'updated-project', false);

      const value = await ConfigManager.get('projectName', false);
      expect(value).toBe('updated-project');
    });

    it('should preserve other configuration values when setting', async () => {
      await ConfigManager.set('newKey', 'new-value', false);

      const projectName = await ConfigManager.get('projectName', false);
      expect(projectName).toBe('test-project');
    });
  });

  describe('getMerged', () => {
    it('should merge global and local configuration', async () => {
      // Create global config
      await ConfigManager.init(
        {
          apiKey: 'global-api-key',
          apiBaseUrl: 'https://global.api.agl.dev',
        },
        true,
      );

      // Create local config
      await ConfigManager.init(
        {
          projectName: 'test-project',
          apiKey: 'local-api-key', // Should override global
        },
        false,
      );

      const merged = await ConfigManager.getMerged();

      expect(merged.apiKey).toBe('local-api-key'); // Local overrides global
      expect(merged.apiBaseUrl).toBe('https://global.api.agl.dev'); // From global
      expect(merged.projectName).toBe('test-project'); // From local
    });

    it('should return local config when global does not exist', async () => {
      await ConfigManager.init({ projectName: 'test-project' }, false);

      const merged = await ConfigManager.getMerged();

      expect(merged.projectName).toBe('test-project');
    });

    it('should return global config when local does not exist', async () => {
      await ConfigManager.init({ apiKey: 'global-key' }, true);

      const merged = await ConfigManager.getMerged();

      expect(merged.apiKey).toBe('global-key');
    });

    it('should return empty object when no config exists', async () => {
      const merged = await ConfigManager.getMerged();

      expect(merged).toEqual({});
    });
  });

  describe('getAll', () => {
    it('should get all local configuration', async () => {
      const data = {
        projectName: 'test-project',
        template: 'web',
        apiKey: 'local-key',
      };

      await ConfigManager.init(data, false);

      const config = await ConfigManager.getAll(false);

      expect(config).toEqual(data);
    });

    it('should get all global configuration', async () => {
      const data = {
        apiKey: 'global-key',
        apiBaseUrl: 'https://api.agl.dev',
      };

      await ConfigManager.init(data, true);

      const config = await ConfigManager.getAll(true);

      expect(config).toEqual(data);
    });

    it('should return empty object when config does not exist', async () => {
      const config = await ConfigManager.getAll(false);

      expect(config).toEqual({});
    });
  });

  describe('validate', () => {
    it('should validate valid configuration', () => {
      const config = {
        projectName: 'test-project',
        template: 'web',
        apiKey: 'valid-api-key',
        apiBaseUrl: 'https://api.agl.dev',
      };

      const result = ConfigManager.validate(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid API URL format', () => {
      const config = {
        apiBaseUrl: 'not-a-valid-url',
      };

      const result = ConfigManager.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('apiBaseUrl must be a valid URL');
    });

    it('should detect invalid emotion service URL', () => {
      const config = {
        emotionServiceUrl: 'invalid-url',
      };

      const result = ConfigManager.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('emotionServiceUrl must be a valid URL');
    });

    it('should detect invalid dialogue service URL', () => {
      const config = {
        dialogueServiceUrl: 'invalid-url',
      };

      const result = ConfigManager.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('dialogueServiceUrl must be a valid URL');
    });

    it('should detect invalid memory service URL', () => {
      const config = {
        memoryServiceUrl: 'invalid-url',
      };

      const result = ConfigManager.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('memoryServiceUrl must be a valid URL');
    });

    it('should allow empty configuration', () => {
      const config = {};

      const result = ConfigManager.validate(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect multiple validation errors', () => {
      const config = {
        apiBaseUrl: 'invalid-url',
        emotionServiceUrl: 'invalid-url',
        dialogueServiceUrl: 'invalid-url',
      };

      const result = ConfigManager.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
    });
  });

  describe('error handling', () => {
    it('should handle corrupted YAML file gracefully', async () => {
      const configPath = path.join(testDir, '.agl.yml');
      await fs.writeFile(configPath, 'invalid: yaml: content: [[[');

      const config = await ConfigManager.getAll(false);

      expect(config).toEqual({});
    });

    it('should handle permission errors gracefully', async () => {
      // This test is platform-specific and might not work on all systems
      if (process.platform !== 'win32') {
        const configPath = path.join(testDir, '.agl.yml');
        await fs.writeFile(configPath, 'test: value');
        await fs.chmod(configPath, 0o000); // Remove all permissions

        const config = await ConfigManager.getAll(false);

        expect(config).toEqual({});

        // Restore permissions for cleanup
        await fs.chmod(configPath, 0o644);
      }
    });
  });
});
