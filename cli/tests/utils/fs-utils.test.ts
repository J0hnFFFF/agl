import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { FileSystemUtils } from '../../src/utils/fs-utils';

describe('FileSystemUtils', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `agl-fs-test-${Date.now()}`);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('validateProjectName', () => {
    it('should validate valid project names', () => {
      const validNames = [
        'my-project',
        'my_project',
        'myproject123',
        'my-awesome-game',
        '@scope/my-project',
      ];

      for (const name of validNames) {
        const result = FileSystemUtils.validateProjectName(name);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it('should reject project names with invalid characters', () => {
      const result = FileSystemUtils.validateProjectName('My Project!');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject project names starting with dot', () => {
      const result = FileSystemUtils.validateProjectName('.myproject');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject project names starting with underscore', () => {
      const result = FileSystemUtils.validateProjectName('_myproject');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty project names', () => {
      const result = FileSystemUtils.validateProjectName('');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject project names that are too long', () => {
      const longName = 'a'.repeat(215); // npm package name limit is 214
      const result = FileSystemUtils.validateProjectName(longName);
      expect(result.valid).toBe(false);
    });

    it('should reject reserved npm package names', () => {
      const reservedNames = ['node_modules', 'favicon.ico'];

      for (const name of reservedNames) {
        const result = FileSystemUtils.validateProjectName(name);
        expect(result.valid).toBe(false);
      }
    });
  });

  describe('isDirectoryEmpty', () => {
    it('should return true for empty directory', async () => {
      const emptyDir = path.join(testDir, 'empty');
      await fs.ensureDir(emptyDir);

      const isEmpty = await FileSystemUtils.isDirectoryEmpty(emptyDir);
      expect(isEmpty).toBe(true);
    });

    it('should return false for directory with files', async () => {
      const dirWithFiles = path.join(testDir, 'with-files');
      await fs.ensureDir(dirWithFiles);
      await fs.writeFile(path.join(dirWithFiles, 'test.txt'), 'content');

      const isEmpty = await FileSystemUtils.isDirectoryEmpty(dirWithFiles);
      expect(isEmpty).toBe(false);
    });

    it('should return false for directory with subdirectories', async () => {
      const dirWithSubdir = path.join(testDir, 'with-subdir');
      await fs.ensureDir(path.join(dirWithSubdir, 'subdir'));

      const isEmpty = await FileSystemUtils.isDirectoryEmpty(dirWithSubdir);
      expect(isEmpty).toBe(false);
    });

    it('should return true for non-existent directory', async () => {
      const nonExistent = path.join(testDir, 'non-existent');

      const isEmpty = await FileSystemUtils.isDirectoryEmpty(nonExistent);
      expect(isEmpty).toBe(true);
    });

    it('should ignore hidden files when checking emptiness', async () => {
      const dirWithHidden = path.join(testDir, 'with-hidden');
      await fs.ensureDir(dirWithHidden);
      await fs.writeFile(path.join(dirWithHidden, '.hidden'), 'content');

      const isEmpty = await FileSystemUtils.isDirectoryEmpty(dirWithHidden);
      expect(isEmpty).toBe(true); // Should ignore .hidden files
    });
  });

  describe('ensureEmptyDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const newDir = path.join(testDir, 'new-dir');

      await FileSystemUtils.ensureEmptyDirectory(newDir);

      expect(await fs.pathExists(newDir)).toBe(true);
      expect(await FileSystemUtils.isDirectoryEmpty(newDir)).toBe(true);
    });

    it('should clear directory if it exists and has files', async () => {
      const existingDir = path.join(testDir, 'existing');
      await fs.ensureDir(existingDir);
      await fs.writeFile(path.join(existingDir, 'test.txt'), 'content');

      await FileSystemUtils.ensureEmptyDirectory(existingDir, true);

      expect(await fs.pathExists(existingDir)).toBe(true);
      expect(await FileSystemUtils.isDirectoryEmpty(existingDir)).toBe(true);
    });

    it('should throw error if directory exists and overwrite is false', async () => {
      const existingDir = path.join(testDir, 'existing');
      await fs.ensureDir(existingDir);
      await fs.writeFile(path.join(existingDir, 'test.txt'), 'content');

      await expect(
        FileSystemUtils.ensureEmptyDirectory(existingDir, false),
      ).rejects.toThrow();
    });

    it('should not throw if directory exists but is empty', async () => {
      const emptyDir = path.join(testDir, 'empty');
      await fs.ensureDir(emptyDir);

      await expect(
        FileSystemUtils.ensureEmptyDirectory(emptyDir, false),
      ).resolves.not.toThrow();
    });
  });

  describe('createFile', () => {
    it('should create file with content', async () => {
      const filePath = path.join(testDir, 'test.txt');
      const content = 'test content';

      await FileSystemUtils.createFile(filePath, content);

      expect(await fs.pathExists(filePath)).toBe(true);
      const readContent = await fs.readFile(filePath, 'utf-8');
      expect(readContent).toBe(content);
    });

    it('should create parent directories if they do not exist', async () => {
      const filePath = path.join(testDir, 'nested', 'dir', 'test.txt');
      const content = 'test content';

      await FileSystemUtils.createFile(filePath, content);

      expect(await fs.pathExists(filePath)).toBe(true);
    });

    it('should overwrite existing file', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fs.writeFile(filePath, 'old content');

      await FileSystemUtils.createFile(filePath, 'new content');

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('new content');
    });
  });

  describe('writeJSON', () => {
    it('should write JSON file with proper formatting', async () => {
      const filePath = path.join(testDir, 'test.json');
      const data = { name: 'test', version: '1.0.0', nested: { value: 123 } };

      await FileSystemUtils.writeJSON(filePath, data);

      expect(await fs.pathExists(filePath)).toBe(true);
      const readData = await fs.readJson(filePath);
      expect(readData).toEqual(data);
    });

    it('should create parent directories if they do not exist', async () => {
      const filePath = path.join(testDir, 'nested', 'test.json');
      const data = { test: 'value' };

      await FileSystemUtils.writeJSON(filePath, data);

      expect(await fs.pathExists(filePath)).toBe(true);
    });
  });

  describe('copyTemplate', () => {
    let templateDir: string;
    let targetDir: string;

    beforeEach(async () => {
      templateDir = path.join(testDir, 'template');
      targetDir = path.join(testDir, 'target');

      // Create template structure
      await fs.ensureDir(templateDir);
      await fs.writeFile(
        path.join(templateDir, 'file.txt'),
        'Hello <%= name %>!',
      );
      await fs.writeFile(
        path.join(templateDir, 'config.json'),
        '{"project": "<%= project %>"}',
      );
      await fs.ensureDir(path.join(templateDir, 'subdir'));
      await fs.writeFile(
        path.join(templateDir, 'subdir', 'nested.txt'),
        'Version: <%= version %>',
      );
    });

    it('should copy and render template files', async () => {
      const variables = { name: 'World', project: 'test-project', version: '1.0.0' };

      await FileSystemUtils.copyTemplate(templateDir, targetDir, variables);

      // Check file exists and content is rendered
      const fileContent = await fs.readFile(path.join(targetDir, 'file.txt'), 'utf-8');
      expect(fileContent).toBe('Hello World!');

      const configContent = await fs.readFile(path.join(targetDir, 'config.json'), 'utf-8');
      expect(configContent).toBe('{"project": "test-project"}');

      const nestedContent = await fs.readFile(
        path.join(targetDir, 'subdir', 'nested.txt'),
        'utf-8',
      );
      expect(nestedContent).toBe('Version: 1.0.0');
    });

    it('should preserve directory structure', async () => {
      await FileSystemUtils.copyTemplate(templateDir, targetDir, {});

      expect(await fs.pathExists(path.join(targetDir, 'subdir'))).toBe(true);
    });

    it('should handle binary files correctly', async () => {
      // Create a mock binary file
      const binaryContent = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header
      await fs.writeFile(path.join(templateDir, 'image.png'), binaryContent);

      await FileSystemUtils.copyTemplate(templateDir, targetDir, {});

      const copiedContent = await fs.readFile(path.join(targetDir, 'image.png'));
      expect(Buffer.compare(copiedContent, binaryContent)).toBe(0);
    });
  });

  describe('findFileUp', () => {
    beforeEach(async () => {
      // Create nested directory structure
      await fs.ensureDir(path.join(testDir, 'a', 'b', 'c'));
      await fs.writeFile(path.join(testDir, 'a', 'target.txt'), 'content');
    });

    it('should find file in parent directory', async () => {
      const startDir = path.join(testDir, 'a', 'b', 'c');
      process.chdir(startDir);

      const found = await FileSystemUtils.findFileUp('target.txt');
      expect(found).toBe(path.join(testDir, 'a', 'target.txt'));
    });

    it('should return null if file not found', async () => {
      process.chdir(testDir);

      const found = await FileSystemUtils.findFileUp('non-existent.txt');
      expect(found).toBeNull();
    });

    it('should find file in current directory', async () => {
      await fs.writeFile(path.join(testDir, 'current.txt'), 'content');
      process.chdir(testDir);

      const found = await FileSystemUtils.findFileUp('current.txt');
      expect(found).toBe(path.join(testDir, 'current.txt'));
    });
  });

  describe('getProjectRoot', () => {
    it('should find project root with .agl.yml', async () => {
      await fs.ensureDir(path.join(testDir, 'project', 'src'));
      await fs.writeFile(path.join(testDir, 'project', '.agl.yml'), 'test: value');

      process.chdir(path.join(testDir, 'project', 'src'));

      const root = await FileSystemUtils.getProjectRoot();
      expect(root).toBe(path.join(testDir, 'project'));
    });

    it('should return null if not in AGL project', async () => {
      process.chdir(testDir);

      const root = await FileSystemUtils.getProjectRoot();
      expect(root).toBeNull();
    });
  });

  describe('isAGLProject', () => {
    it('should return true if .agl.yml exists', async () => {
      await fs.writeFile(path.join(testDir, '.agl.yml'), 'test: value');
      process.chdir(testDir);

      const isProject = await FileSystemUtils.isAGLProject();
      expect(isProject).toBe(true);
    });

    it('should return false if .agl.yml does not exist', async () => {
      process.chdir(testDir);

      const isProject = await FileSystemUtils.isAGLProject();
      expect(isProject).toBe(false);
    });
  });

  describe('getAllFiles', () => {
    beforeEach(async () => {
      // Create directory structure with files
      await fs.ensureDir(path.join(testDir, 'a', 'b'));
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testDir, 'a', 'file2.txt'), 'content2');
      await fs.writeFile(path.join(testDir, 'a', 'b', 'file3.txt'), 'content3');
    });

    it('should get all files recursively', async () => {
      const files = await FileSystemUtils['getAllFiles'](testDir);

      expect(files).toHaveLength(3);
      expect(files).toContain(path.join(testDir, 'file1.txt'));
      expect(files).toContain(path.join(testDir, 'a', 'file2.txt'));
      expect(files).toContain(path.join(testDir, 'a', 'b', 'file3.txt'));
    });

    it('should return empty array for empty directory', async () => {
      const emptyDir = path.join(testDir, 'empty');
      await fs.ensureDir(emptyDir);

      const files = await FileSystemUtils['getAllFiles'](emptyDir);

      expect(files).toHaveLength(0);
    });
  });

  describe('isTextFile', () => {
    it('should identify text files correctly', () => {
      const textFiles = [
        'file.txt',
        'script.js',
        'style.css',
        'README.md',
        'package.json',
        'config.yml',
        'Component.tsx',
      ];

      for (const file of textFiles) {
        expect(FileSystemUtils['isTextFile'](file)).toBe(true);
      }
    });

    it('should identify binary files correctly', () => {
      const binaryFiles = [
        'image.png',
        'photo.jpg',
        'video.mp4',
        'archive.zip',
        'font.ttf',
        'music.mp3',
      ];

      for (const file of binaryFiles) {
        expect(FileSystemUtils['isTextFile'](file)).toBe(false);
      }
    });
  });
});
