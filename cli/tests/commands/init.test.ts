import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { initCommand } from '../../src/commands/init';
import { ConfigManager } from '../../src/utils/config';
import { Logger } from '../../src/utils/logger';

// Mock Logger to avoid console output
jest.mock('../../src/utils/logger');

describe('initCommand', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `agl-init-test-${Date.now()}`);
    await fs.ensureDir(testDir);

    originalCwd = process.cwd();
    process.chdir(testDir);

    // Mock Logger methods
    (Logger.banner as jest.Mock).mockImplementation(() => {});
    (Logger.info as jest.Mock).mockImplementation(() => {});
    (Logger.success as jest.Mock).mockImplementation(() => {});
    (Logger.startSpinner as jest.Mock).mockImplementation(() => {});
    (Logger.succeedSpinner as jest.Mock).mockImplementation(() => {});
    (Logger.failSpinner as jest.Mock).mockImplementation(() => {});
    (Logger.warn as jest.Mock).mockImplementation(() => {});
    (Logger.box as jest.Mock).mockImplementation(() => {});
    (Logger.input as jest.Mock).mockResolvedValue('test-project');
    (Logger.confirm as jest.Mock).mockResolvedValue(true);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(testDir);
    jest.clearAllMocks();
  });

  describe('Web template', () => {
    it('should create web project with all necessary files', async () => {
      await initCommand('test-web-project', {
        template: 'web',
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(testDir, 'test-web-project');

      // Check essential files exist
      expect(await fs.pathExists(path.join(projectDir, 'package.json'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, 'tsconfig.json'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, 'index.html'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, 'src', 'main.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, '.gitignore'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, 'README.md'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, '.agl.yml'))).toBe(true);
    });

    it('should have correct package.json content', async () => {
      await initCommand('test-web-project', {
        template: 'web',
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(testDir, 'test-web-project');
      const packageJson = await fs.readJson(path.join(projectDir, 'package.json'));

      expect(packageJson.name).toBe('test-web-project');
      expect(packageJson.dependencies).toHaveProperty('@agl/web-sdk');
      expect(packageJson.scripts).toHaveProperty('dev');
      expect(packageJson.scripts).toHaveProperty('build');
    });

    it('should have correct tsconfig.json content', async () => {
      await initCommand('test-web-project', {
        template: 'web',
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(testDir, 'test-web-project');
      const tsConfig = await fs.readJson(path.join(projectDir, 'tsconfig.json'));

      expect(tsConfig.compilerOptions.target).toBe('ES2020');
      expect(tsConfig.compilerOptions.module).toBe('ESNext');
      expect(tsConfig.compilerOptions.strict).toBe(true);
    });

    it('should have AGL client initialization in main.ts', async () => {
      await initCommand('test-web-project', {
        template: 'web',
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(testDir, 'test-web-project');
      const mainTs = await fs.readFile(path.join(projectDir, 'src', 'main.ts'), 'utf-8');

      expect(mainTs).toContain('AGLClient');
      expect(mainTs).toContain('aglClient.emotion.analyze');
      expect(mainTs).toContain('aglClient.dialogue.generate');
    });

    it('should include .gitignore with proper entries', async () => {
      await initCommand('test-web-project', {
        template: 'web',
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(testDir, 'test-web-project');
      const gitignore = await fs.readFile(path.join(projectDir, '.gitignore'), 'utf-8');

      expect(gitignore).toContain('node_modules/');
      expect(gitignore).toContain('dist/');
      expect(gitignore).toContain('.env');
      expect(gitignore).toContain('.agl.yml');
    });
  });

  describe('Unity template', () => {
    it('should create Unity project with C# files', async () => {
      await initCommand('test-unity-project', {
        template: 'unity',
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(testDir, 'test-unity-project');

      expect(await fs.pathExists(path.join(projectDir, 'Assets', 'Scripts', 'AGLManager.cs'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, 'README.md'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, '.gitignore'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, '.agl.yml'))).toBe(true);
    });

    it('should have correct AGLManager.cs content', async () => {
      await initCommand('test-unity-project', {
        template: 'unity',
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(testDir, 'test-unity-project');
      const aglManager = await fs.readFile(
        path.join(projectDir, 'Assets', 'Scripts', 'AGLManager.cs'),
        'utf-8',
      );

      expect(aglManager).toContain('using AGL;');
      expect(aglManager).toContain('public class AGLManager : MonoBehaviour');
      expect(aglManager).toContain('AGLClient');
      expect(aglManager).toContain('AnalyzeEmotion');
    });

    it('should have Unity-specific .gitignore', async () => {
      await initCommand('test-unity-project', {
        template: 'unity',
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(testDir, 'test-unity-project');
      const gitignore = await fs.readFile(path.join(projectDir, '.gitignore'), 'utf-8');

      expect(gitignore).toContain('[Ll]ibrary/');
      expect(gitignore).toContain('[Tt]emp/');
      expect(gitignore).toContain('*.csproj');
      expect(gitignore).toContain('.agl.yml');
    });
  });

  describe('Unreal template', () => {
    it('should create Unreal project with C++ files', async () => {
      await initCommand('test-unreal-project', {
        template: 'unreal',
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(testDir, 'test-unreal-project');

      expect(
        await fs.pathExists(
          path.join(projectDir, 'Source', 'test-unreal-project', 'AGLManager.h'),
        ),
      ).toBe(true);
      expect(
        await fs.pathExists(
          path.join(projectDir, 'Source', 'test-unreal-project', 'AGLManager.cpp'),
        ),
      ).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, 'README.md'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, '.gitignore'))).toBe(true);
    });

    it('should have correct AGLManager.h content', async () => {
      await initCommand('test-unreal-project', {
        template: 'unreal',
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(testDir, 'test-unreal-project');
      const aglManagerH = await fs.readFile(
        path.join(projectDir, 'Source', 'test-unreal-project', 'AGLManager.h'),
        'utf-8',
      );

      expect(aglManagerH).toContain('#pragma once');
      expect(aglManagerH).toContain('UCLASS()');
      expect(aglManagerH).toContain('AAGLManager : public AActor');
      expect(aglManagerH).toContain('UAGLClient');
    });

    it('should have correct AGLManager.cpp content', async () => {
      await initCommand('test-unreal-project', {
        template: 'unreal',
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(testDir, 'test-unreal-project');
      const aglManagerCpp = await fs.readFile(
        path.join(projectDir, 'Source', 'test-unreal-project', 'AGLManager.cpp'),
        'utf-8',
      );

      expect(aglManagerCpp).toContain('#include "AGLManager.h"');
      expect(aglManagerCpp).toContain('AGLClient = MakeShared<UAGLClient>');
      expect(aglManagerCpp).toContain('AnalyzeEmotion');
    });

    it('should have Unreal-specific .gitignore', async () => {
      await initCommand('test-unreal-project', {
        template: 'unreal',
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(testDir, 'test-unreal-project');
      const gitignore = await fs.readFile(path.join(projectDir, '.gitignore'), 'utf-8');

      expect(gitignore).toContain('Binaries/');
      expect(gitignore).toContain('Intermediate/');
      expect(gitignore).toContain('*.sln');
      expect(gitignore).toContain('.agl.yml');
    });
  });

  describe('Configuration', () => {
    it('should initialize AGL configuration', async () => {
      await initCommand('test-project', {
        template: 'web',
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(testDir, 'test-project');
      process.chdir(projectDir);

      const config = await ConfigManager.getAll(false);

      expect(config.projectName).toBe('test-project');
      expect(config.template).toBe('web');
      expect(config.createdAt).toBeDefined();
    });
  });

  describe('Custom path', () => {
    it('should create project in custom path', async () => {
      const customPath = path.join(testDir, 'custom-location');
      await fs.ensureDir(customPath);

      await initCommand('test-project', {
        template: 'web',
        path: customPath,
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(customPath, 'test-project');
      expect(await fs.pathExists(projectDir)).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, 'package.json'))).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should reject invalid project names', async () => {
      await expect(
        initCommand('Invalid Name!', {
          template: 'web',
          skipInstall: true,
          skipGit: true,
        }),
      ).rejects.toThrow();
    });

    it('should reject empty project names', async () => {
      (Logger.input as jest.Mock).mockResolvedValue('');

      await expect(
        initCommand(undefined, {
          template: 'web',
          skipInstall: true,
          skipGit: true,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Overwrite protection', () => {
    it('should prompt when directory exists and is not empty', async () => {
      const projectDir = path.join(testDir, 'existing-project');
      await fs.ensureDir(projectDir);
      await fs.writeFile(path.join(projectDir, 'existing-file.txt'), 'content');

      (Logger.confirm as jest.Mock).mockResolvedValue(false);

      await expect(
        initCommand('existing-project', {
          template: 'web',
          skipInstall: true,
          skipGit: true,
        }),
      ).rejects.toThrow();

      expect(Logger.confirm).toHaveBeenCalledWith(
        expect.stringContaining('already exists'),
        false,
      );
    });

    it('should overwrite when user confirms', async () => {
      const projectDir = path.join(testDir, 'existing-project');
      await fs.ensureDir(projectDir);
      await fs.writeFile(path.join(projectDir, 'existing-file.txt'), 'content');

      (Logger.confirm as jest.Mock).mockResolvedValue(true);

      await initCommand('existing-project', {
        template: 'web',
        skipInstall: true,
        skipGit: true,
      });

      expect(await fs.pathExists(path.join(projectDir, 'package.json'))).toBe(true);
    });
  });

  describe('Git initialization', () => {
    it('should skip git initialization when skipGit is true', async () => {
      await initCommand('test-project', {
        template: 'web',
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(testDir, 'test-project');
      const gitDir = path.join(projectDir, '.git');

      expect(await fs.pathExists(gitDir)).toBe(false);
    });
  });

  describe('Dependency installation', () => {
    it('should skip npm install when skipInstall is true', async () => {
      await initCommand('test-project', {
        template: 'web',
        skipInstall: true,
        skipGit: true,
      });

      const projectDir = path.join(testDir, 'test-project');
      const nodeModules = path.join(projectDir, 'node_modules');

      expect(await fs.pathExists(nodeModules)).toBe(false);
    });
  });

  describe('Success message', () => {
    it('should display success message with next steps', async () => {
      await initCommand('test-project', {
        template: 'web',
        skipInstall: true,
        skipGit: true,
      });

      expect(Logger.box).toHaveBeenCalledWith(
        expect.stringContaining('created successfully'),
        '✨ Success',
      );
    });
  });
});
