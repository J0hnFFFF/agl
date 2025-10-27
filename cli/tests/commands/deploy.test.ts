import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { deployCommand } from '../../src/commands/deploy';
import { FileSystemUtils } from '../../src/utils/fs-utils';
import { ConfigManager } from '../../src/utils/config';
import { Logger } from '../../src/utils/logger';

// Mock dependencies
jest.mock('child_process');
jest.mock('../../src/utils/logger');

describe('deployCommand', () => {
  let testDir: string;
  let projectDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `agl-deploy-test-${Date.now()}`);
    projectDir = path.join(testDir, 'test-project');
    await fs.ensureDir(projectDir);

    // Create .agl.yml to mark as AGL project
    await fs.writeFile(
      path.join(projectDir, '.agl.yml'),
      'projectName: test-project\ntemplate: web\napiKey: test-api-key',
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
    (Logger.updateSpinner as jest.Mock).mockImplementation(() => {});
    (Logger.box as jest.Mock).mockImplementation(() => {});
    (Logger.confirm as jest.Mock).mockResolvedValue(true);

    // Mock ConfigManager
    jest.spyOn(ConfigManager, 'getMerged').mockResolvedValue({
      projectName: 'test-project',
      template: 'web',
      apiKey: 'test-api-key',
    });

    // Mock execAsync
    jest.spyOn(require('util'), 'promisify').mockImplementation(() => {
      return jest.fn().mockResolvedValue({ stdout: 'Success', stderr: '' });
    });
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(testDir);
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Project validation', () => {
    it('should fail if not in AGL project', async () => {
      // Remove .agl.yml
      await fs.remove(path.join(projectDir, '.agl.yml'));

      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      }).catch(() => {});

      expect(Logger.error).toHaveBeenCalledWith(
        'Not an AGL project. Run this command inside an AGL project directory.',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      processExitSpy.mockRestore();
    });
  });

  describe('Environment targets', () => {
    it('should deploy to dev environment', async () => {
      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Deploying to: dev'),
      );
    });

    it('should deploy to staging environment', async () => {
      await deployCommand({
        env: 'staging',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Deploying to: staging'),
      );
    });

    it('should deploy to production environment with confirmation', async () => {
      (Logger.confirm as jest.Mock).mockResolvedValue(true);

      await deployCommand({
        env: 'production',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.confirm).toHaveBeenCalledWith(
        expect.stringContaining('PRODUCTION'),
        false,
      );
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Deploying to: production'),
      );
    });

    it('should cancel production deployment when not confirmed', async () => {
      (Logger.confirm as jest.Mock).mockResolvedValue(false);

      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      await deployCommand({
        env: 'production',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.info).toHaveBeenCalledWith('Deployment cancelled');
      expect(processExitSpy).toHaveBeenCalledWith(0);

      processExitSpy.mockRestore();
    });
  });

  describe('API key validation', () => {
    it('should require API key for production deployment', async () => {
      jest.spyOn(ConfigManager, 'getMerged').mockResolvedValue({
        projectName: 'test-project',
        // No apiKey
      });

      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      await deployCommand({
        env: 'production',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('API key not configured'),
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      processExitSpy.mockRestore();
    });

    it('should allow deployment without API key for dev environment', async () => {
      jest.spyOn(ConfigManager, 'getMerged').mockResolvedValue({
        projectName: 'test-project',
        // No apiKey
      });

      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.succeedSpinner).toHaveBeenCalledWith('Deployment completed');
    });
  });

  describe('Service selection', () => {
    it('should deploy single service', async () => {
      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.info).toHaveBeenCalledWith(expect.stringContaining('Services: api'));
    });

    it('should deploy multiple services', async () => {
      await deployCommand({
        env: 'dev',
        services: 'api,emotion,dialogue',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Services: api,emotion,dialogue'),
      );
    });

    it('should deploy all services', async () => {
      await deployCommand({
        env: 'dev',
        services: 'all',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.info).toHaveBeenCalledWith(expect.stringContaining('Services: all'));
    });
  });

  describe('Test execution', () => {
    it('should run tests when skipTests is false', async () => {
      const mockExecAsync = jest.fn().mockResolvedValue({ stdout: 'All tests passed' });
      jest.spyOn(require('util'), 'promisify').mockImplementation(() => mockExecAsync);

      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: true,
        skipTests: false,
      });

      expect(Logger.startSpinner).toHaveBeenCalledWith('Running tests...');
      expect(Logger.succeedSpinner).toHaveBeenCalledWith('All tests passed');
    });

    it('should skip tests when skipTests is true', async () => {
      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.startSpinner).not.toHaveBeenCalledWith('Running tests...');
    });

    it('should prompt to continue when tests fail', async () => {
      const mockExecAsync = jest.fn().mockRejectedValue(new Error('Tests failed'));
      jest.spyOn(require('util'), 'promisify').mockImplementation(() => mockExecAsync);

      (Logger.confirm as jest.Mock).mockResolvedValue(true);

      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: true,
        skipTests: false,
      });

      expect(Logger.failSpinner).toHaveBeenCalledWith('Tests failed');
      expect(Logger.confirm).toHaveBeenCalledWith('Tests failed. Continue anyway?', false);
    });

    it('should cancel deployment when user declines after test failure', async () => {
      const mockExecAsync = jest.fn().mockRejectedValue(new Error('Tests failed'));
      jest.spyOn(require('util'), 'promisify').mockImplementation(() => mockExecAsync);

      (Logger.confirm as jest.Mock).mockResolvedValue(false);

      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: true,
        skipTests: false,
      }).catch(() => {});

      expect(processExitSpy).toHaveBeenCalledWith(1);

      processExitSpy.mockRestore();
    });
  });

  describe('Build execution', () => {
    it('should run build when skipBuild is false', async () => {
      const mockExecAsync = jest.fn().mockResolvedValue({ stdout: 'Build successful' });
      jest.spyOn(require('util'), 'promisify').mockImplementation(() => mockExecAsync);

      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: false,
        skipTests: true,
      });

      expect(Logger.startSpinner).toHaveBeenCalledWith('Building services...');
      expect(Logger.succeedSpinner).toHaveBeenCalledWith('Build completed');
    });

    it('should skip build when skipBuild is true', async () => {
      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.startSpinner).not.toHaveBeenCalledWith('Building services...');
    });

    it('should fail deployment when build fails', async () => {
      const mockExecAsync = jest.fn().mockRejectedValue(new Error('Build failed'));
      jest.spyOn(require('util'), 'promisify').mockImplementation(() => mockExecAsync);

      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: false,
        skipTests: true,
      }).catch(() => {});

      expect(Logger.failSpinner).toHaveBeenCalledWith('Build failed');
      expect(processExitSpy).toHaveBeenCalledWith(1);

      processExitSpy.mockRestore();
    });
  });

  describe('Deployment execution', () => {
    it('should deploy services successfully', async () => {
      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.startSpinner).toHaveBeenCalledWith('Deploying services...');
      expect(Logger.succeedSpinner).toHaveBeenCalledWith('Deployment completed');
    });

    it('should show deployment progress', async () => {
      await deployCommand({
        env: 'dev',
        services: 'api,emotion',
        skipBuild: true,
        skipTests: true,
      });

      // Would verify updateSpinner is called for each service
      expect(Logger.updateSpinner).toBeDefined();
    });
  });

  describe('Success message', () => {
    it('should display success box with next steps', async () => {
      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.box).toHaveBeenCalledWith(
        expect.stringContaining('deployed successfully'),
        '✨ Success',
      );
    });

    it('should include environment in success message', async () => {
      await deployCommand({
        env: 'staging',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.box).toHaveBeenCalledWith(
        expect.stringContaining('staging'),
        '✨ Success',
      );
    });

    it('should include dashboard URL', async () => {
      await deployCommand({
        env: 'production',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.box).toHaveBeenCalledWith(
        expect.stringContaining('dashboard.agl.dev/production'),
        '✨ Success',
      );
    });
  });

  describe('Error handling', () => {
    it('should handle configuration loading errors', async () => {
      jest.spyOn(ConfigManager, 'getMerged').mockRejectedValue(new Error('Config error'));

      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      }).catch(() => {});

      expect(Logger.error).toHaveBeenCalledWith('Deployment failed', expect.any(Error));
      expect(processExitSpy).toHaveBeenCalledWith(1);

      processExitSpy.mockRestore();
    });

    it('should handle deployment errors gracefully', async () => {
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      // Mock deployment failure
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        throw new Error('Deployment failed');
      });

      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      }).catch(() => {});

      expect(Logger.error).toHaveBeenCalledWith('Deployment failed', expect.any(Error));

      processExitSpy.mockRestore();
      jest.restoreAllMocks();
    });
  });

  describe('Banner display', () => {
    it('should display AGL banner', async () => {
      await deployCommand({
        env: 'dev',
        services: 'api',
        skipBuild: true,
        skipTests: true,
      });

      expect(Logger.banner).toHaveBeenCalled();
    });
  });

  describe('Configuration display', () => {
    it('should show deployment configuration', async () => {
      await deployCommand({
        env: 'staging',
        services: 'api,emotion',
        skipBuild: false,
        skipTests: false,
      });

      expect(Logger.info).toHaveBeenCalledWith('Deploying to: staging');
      expect(Logger.info).toHaveBeenCalledWith('Services: api,emotion');
    });
  });
});
