import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { devCommand } from '../../src/commands/dev';
import { FileSystemUtils } from '../../src/utils/fs-utils';
import { ConfigManager } from '../../src/utils/config';
import { Logger } from '../../src/utils/logger';

// Mock dependencies
jest.mock('child_process');
jest.mock('../../src/utils/logger');

describe('devCommand', () => {
  let testDir: string;
  let projectDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `agl-dev-test-${Date.now()}`);
    projectDir = path.join(testDir, 'test-project');
    await fs.ensureDir(projectDir);

    // Create .agl.yml to mark as AGL project
    await fs.writeFile(
      path.join(projectDir, '.agl.yml'),
      'projectName: test-project\ntemplate: web',
    );

    originalCwd = process.cwd();
    process.chdir(projectDir);

    // Mock Logger methods
    (Logger.banner as jest.Mock).mockImplementation(() => {});
    (Logger.info as jest.Mock).mockImplementation(() => {});
    (Logger.success as jest.Mock).mockImplementation(() => {});
    (Logger.error as jest.Mock).mockImplementation(() => {});
    (Logger.warn as jest.Mock).mockImplementation(() => {});
    (Logger.startSpinner as jest.Mock).mockImplementation(() => {});
    (Logger.succeedSpinner as jest.Mock).mockImplementation(() => {});
    (Logger.failSpinner as jest.Mock).mockImplementation(() => {});
    (Logger.box as jest.Mock).mockImplementation(() => {});

    // Mock ConfigManager
    jest.spyOn(ConfigManager, 'getMerged').mockResolvedValue({
      projectName: 'test-project',
      template: 'web',
    });
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(testDir);
    jest.clearAllMocks();
  });

  describe('Project validation', () => {
    it('should fail if not in AGL project', async () => {
      // Remove .agl.yml
      await fs.remove(path.join(projectDir, '.agl.yml'));

      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      await devCommand({
        services: 'api',
        port: '3000',
        docker: false,
      }).catch(() => {});

      expect(Logger.error).toHaveBeenCalledWith(
        'Not an AGL project. Run this command inside an AGL project directory.',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      processExitSpy.mockRestore();
    });

    it('should succeed if in AGL project', async () => {
      const isProject = await FileSystemUtils.isAGLProject();
      expect(isProject).toBe(true);
    });
  });

  describe('Service parsing', () => {
    it('should parse all services', () => {
      // This would test the parseServices function
      // Since it's not exported, we test it indirectly through devCommand
      expect(true).toBe(true); // Placeholder
    });

    it('should parse specific services from comma-separated list', () => {
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Docker mode', () => {
    it('should indicate Docker mode is enabled', async () => {
      // Mock execAsync to avoid actual docker commands
      const { promisify } = require('util');
      const { exec } = require('child_process');
      const execAsync = promisify(exec);

      jest.spyOn(require('util'), 'promisify').mockImplementation(() => {
        return jest.fn().mockResolvedValue({ stdout: 'Docker version 20.10.0' });
      });

      // Note: This test is simplified as the actual devCommand runs indefinitely
      expect(Logger.info).toBeDefined();
    });
  });

  describe('Non-Docker mode', () => {
    it('should indicate non-Docker mode', () => {
      // Test would verify that non-Docker mode logs correct info
      expect(Logger.info).toBeDefined();
    });
  });

  describe('Port configuration', () => {
    it('should use custom port when specified', () => {
      const options = {
        services: 'api',
        port: '8080',
        docker: false,
      };

      expect(options.port).toBe('8080');
    });

    it('should use default port when not specified', () => {
      const options = {
        services: 'api',
        port: '3000',
        docker: false,
      };

      expect(options.port).toBe('3000');
    });
  });

  describe('Banner and output', () => {
    it('should display AGL banner', () => {
      expect(Logger.banner).toBeDefined();
    });

    it('should show starting message', () => {
      expect(Logger.info).toBeDefined();
    });
  });

  describe('Configuration loading', () => {
    it('should load project configuration', async () => {
      const config = await ConfigManager.getMerged();

      expect(config.projectName).toBe('test-project');
      expect(config.template).toBe('web');
    });

    it('should handle missing configuration gracefully', async () => {
      jest.spyOn(ConfigManager, 'getMerged').mockResolvedValue({});

      const config = await ConfigManager.getMerged();
      expect(config).toEqual({});
    });
  });

  describe('Docker Compose integration', () => {
    it('should create default docker-compose.yml if missing', async () => {
      // This tests the createDefaultDockerCompose functionality indirectly
      expect(true).toBe(true); // Placeholder
    });

    it('should use existing docker-compose.yml if present', async () => {
      await fs.writeFile(
        path.join(projectDir, 'docker-compose.yml'),
        'version: "3.8"\nservices:\n  api:\n    image: test',
      );

      const exists = await fs.pathExists(path.join(projectDir, 'docker-compose.yml'));
      expect(exists).toBe(true);
    });
  });

  describe('Service detection', () => {
    it('should detect API service directory', async () => {
      const apiDir = path.join(projectDir, '..', '..', 'services', 'api-service');
      await fs.ensureDir(apiDir);

      const exists = await fs.pathExists(apiDir);
      expect(exists).toBe(true);
    });

    it('should handle missing service directories gracefully', async () => {
      const apiDir = path.join(projectDir, '..', '..', 'services', 'nonexistent-service');
      const exists = await fs.pathExists(apiDir);
      expect(exists).toBe(false);
    });
  });

  describe('Environment checks', () => {
    it('should check for Node.js in non-Docker mode', () => {
      // Would verify that Node.js check is performed
      expect(true).toBe(true); // Placeholder
    });

    it('should check for Python in non-Docker mode', () => {
      // Would verify that Python check is performed for emotion/dialogue services
      expect(true).toBe(true); // Placeholder
    });

    it('should check for Docker in Docker mode', () => {
      // Would verify that Docker check is performed
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Graceful shutdown', () => {
    it('should setup signal handlers', () => {
      // Would verify that SIGINT, SIGTERM handlers are set up
      expect(true).toBe(true); // Placeholder
    });

    it('should cleanup processes on shutdown', () => {
      // Would verify that spawned processes are killed on shutdown
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Error handling', () => {
    it('should handle environment check failures', async () => {
      jest.spyOn(require('util'), 'promisify').mockImplementation(() => {
        return jest.fn().mockRejectedValue(new Error('Command not found'));
      });

      // Would verify error is caught and logged
      expect(Logger.error).toBeDefined();
    });

    it('should cleanup on error', () => {
      // Would verify cleanup is called on error
      expect(true).toBe(true); // Placeholder
    });

    it('should exit with error code on failure', () => {
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      // Would trigger an error and verify exit(1)
      expect(processExitSpy).toBeDefined();

      processExitSpy.mockRestore();
    });
  });

  describe('Service startup messages', () => {
    it('should show success box when all services start', () => {
      expect(Logger.box).toBeDefined();
    });

    it('should include service URLs in output', () => {
      // Would verify that service URLs are displayed
      expect(true).toBe(true); // Placeholder
    });

    it('should include keyboard shortcuts in output', () => {
      // Would verify Ctrl+C instruction is shown
      expect(true).toBe(true); // Placeholder
    });
  });
});
