import fs from 'fs-extra';
import path from 'path';
import ejs from 'ejs';
import validateNpmPackageName from 'validate-npm-package-name';

/**
 * Filesystem utilities for CLI
 */
export class FileSystemUtils {
  /**
   * Check if directory is empty
   */
  static async isDirectoryEmpty(dirPath: string): Promise<boolean> {
    if (!(await fs.pathExists(dirPath))) {
      return true;
    }

    const files = await fs.readdir(dirPath);
    return files.length === 0;
  }

  /**
   * Ensure directory exists and is empty, or ask for confirmation
   */
  static async ensureEmptyDirectory(dirPath: string, force: boolean = false): Promise<boolean> {
    if (await fs.pathExists(dirPath)) {
      const isEmpty = await this.isDirectoryEmpty(dirPath);
      if (!isEmpty && !force) {
        return false;
      }
      if (!isEmpty && force) {
        await fs.emptyDir(dirPath);
      }
    } else {
      await fs.ensureDir(dirPath);
    }
    return true;
  }

  /**
   * Copy template directory with EJS rendering
   */
  static async copyTemplate(
    templateDir: string,
    targetDir: string,
    variables: Record<string, any>,
  ): Promise<void> {
    await fs.ensureDir(targetDir);

    const files = await this.getAllFiles(templateDir);

    for (const file of files) {
      const relativePath = path.relative(templateDir, file);
      const targetPath = path.join(targetDir, relativePath);

      // Ensure target directory exists
      await fs.ensureDir(path.dirname(targetPath));

      // Check if file should be rendered as template
      if (this.isTextFile(file)) {
        const content = await fs.readFile(file, 'utf-8');
        try {
          const rendered = ejs.render(content, variables);
          await fs.writeFile(targetPath, rendered, 'utf-8');
        } catch (error) {
          // If EJS rendering fails, just copy the file
          await fs.copy(file, targetPath);
        }
      } else {
        // Binary file, just copy
        await fs.copy(file, targetPath);
      }
    }
  }

  /**
   * Get all files recursively in directory
   */
  static async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    async function traverse(currentPath: string) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }

    await traverse(dirPath);
    return files;
  }

  /**
   * Check if file is a text file (for template rendering)
   */
  static isTextFile(filePath: string): boolean {
    const textExtensions = [
      '.ts',
      '.js',
      '.tsx',
      '.jsx',
      '.json',
      '.yml',
      '.yaml',
      '.md',
      '.txt',
      '.html',
      '.css',
      '.scss',
      '.sass',
      '.cs',
      '.cpp',
      '.h',
      '.hpp',
      '.sh',
      '.bat',
      '.env',
      '.gitignore',
      '.eslintrc',
      '.prettierrc',
    ];

    const ext = path.extname(filePath).toLowerCase();
    return textExtensions.includes(ext);
  }

  /**
   * Validate project name
   */
  static validateProjectName(name: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check npm package name validity
    const npmValidation = validateNpmPackageName(name);
    if (!npmValidation.validForNewPackages) {
      errors.push(...(npmValidation.errors || []), ...(npmValidation.warnings || []));
    }

    // Additional checks
    if (name.length > 214) {
      errors.push('Project name must be less than 214 characters');
    }

    if (name.startsWith('.') || name.startsWith('_')) {
      errors.push('Project name cannot start with . or _');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Find file in current and parent directories
   */
  static async findFileUp(fileName: string, startDir: string = process.cwd()): Promise<string | null> {
    let currentDir = startDir;

    while (true) {
      const filePath = path.join(currentDir, fileName);
      if (await fs.pathExists(filePath)) {
        return filePath;
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        // Reached root directory
        return null;
      }

      currentDir = parentDir;
    }
  }

  /**
   * Check if running inside an AGL project
   */
  static async isAGLProject(dir: string = process.cwd()): Promise<boolean> {
    const configFile = await this.findFileUp('.agl.yml', dir);
    return configFile !== null;
  }

  /**
   * Get project root directory
   */
  static async getProjectRoot(dir: string = process.cwd()): Promise<string | null> {
    const configFile = await this.findFileUp('.agl.yml', dir);
    return configFile ? path.dirname(configFile) : null;
  }

  /**
   * Create file with content
   */
  static async createFile(filePath: string, content: string): Promise<void> {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Read JSON file with error handling
   */
  static async readJSON<T = any>(filePath: string): Promise<T | null> {
    try {
      return await fs.readJSON(filePath);
    } catch {
      return null;
    }
  }

  /**
   * Write JSON file with formatting
   */
  static async writeJSON(filePath: string, data: any): Promise<void> {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJSON(filePath, data, { spaces: 2 });
  }
}
