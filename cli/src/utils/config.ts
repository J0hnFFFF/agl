import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'yaml';

interface AGLConfig {
  apiKey?: string;
  apiBaseUrl?: string;
  emotionServiceUrl?: string;
  dialogueServiceUrl?: string;
  memoryServiceUrl?: string;
  defaultLanguage?: string;
  defaultPersona?: string;
  [key: string]: any;
}

/**
 * Configuration management for AGL CLI
 */
export class ConfigManager {
  private static globalConfigPath = path.join(os.homedir(), '.agl', 'config.yml');
  private static localConfigPath = path.join(process.cwd(), '.agl.yml');

  /**
   * Get configuration value
   */
  static async get(key: string, global: boolean = false): Promise<any> {
    const config = await this.load(global);
    return this.getNestedValue(config, key);
  }

  /**
   * Set configuration value
   */
  static async set(key: string, value: any, global: boolean = false): Promise<void> {
    const config = await this.load(global);
    this.setNestedValue(config, key, value);
    await this.save(config, global);
  }

  /**
   * Load configuration
   */
  static async load(global: boolean = false): Promise<AGLConfig> {
    const configPath = global ? this.globalConfigPath : this.localConfigPath;

    if (!(await fs.pathExists(configPath))) {
      return {};
    }

    try {
      const content = await fs.readFile(configPath, 'utf-8');
      return yaml.parse(content) || {};
    } catch (error) {
      throw new Error(`Failed to load configuration from ${configPath}: ${error}`);
    }
  }

  /**
   * Save configuration
   */
  static async save(config: AGLConfig, global: boolean = false): Promise<void> {
    const configPath = global ? this.globalConfigPath : this.localConfigPath;

    // Ensure directory exists
    await fs.ensureDir(path.dirname(configPath));

    try {
      const content = yaml.stringify(config);
      await fs.writeFile(configPath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save configuration to ${configPath}: ${error}`);
    }
  }

  /**
   * Check if local configuration exists
   */
  static async hasLocalConfig(): Promise<boolean> {
    return fs.pathExists(this.localConfigPath);
  }

  /**
   * Check if global configuration exists
   */
  static async hasGlobalConfig(): Promise<boolean> {
    return fs.pathExists(this.globalConfigPath);
  }

  /**
   * Initialize configuration with defaults
   */
  static async init(options: Partial<AGLConfig> = {}, global: boolean = false): Promise<void> {
    const defaultConfig: AGLConfig = {
      apiBaseUrl: 'http://localhost:3000',
      emotionServiceUrl: 'http://localhost:8000',
      dialogueServiceUrl: 'http://localhost:8001',
      memoryServiceUrl: 'http://localhost:3002',
      defaultLanguage: 'en',
      defaultPersona: 'cheerful',
      ...options,
    };

    await this.save(defaultConfig, global);
  }

  /**
   * Get all configuration as object
   */
  static async getAll(global: boolean = false): Promise<AGLConfig> {
    return this.load(global);
  }

  /**
   * Merge local and global configuration
   */
  static async getMerged(): Promise<AGLConfig> {
    const global = await this.load(true);
    const local = await this.load(false);
    return { ...global, ...local };
  }

  /**
   * Delete configuration
   */
  static async delete(global: boolean = false): Promise<void> {
    const configPath = global ? this.globalConfigPath : this.localConfigPath;
    if (await fs.pathExists(configPath)) {
      await fs.remove(configPath);
    }
  }

  /**
   * Validate configuration
   */
  static validate(config: AGLConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields for production
    if (config.apiKey && !this.isValidApiKey(config.apiKey)) {
      errors.push('Invalid API key format');
    }

    if (config.apiBaseUrl && !this.isValidUrl(config.apiBaseUrl)) {
      errors.push('Invalid API base URL');
    }

    if (config.emotionServiceUrl && !this.isValidUrl(config.emotionServiceUrl)) {
      errors.push('Invalid emotion service URL');
    }

    if (config.dialogueServiceUrl && !this.isValidUrl(config.dialogueServiceUrl)) {
      errors.push('Invalid dialogue service URL');
    }

    if (config.memoryServiceUrl && !this.isValidUrl(config.memoryServiceUrl)) {
      errors.push('Invalid memory service URL');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }

  /**
   * Set nested value in object using dot notation
   */
  private static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((curr, key) => {
      if (!curr[key]) {
        curr[key] = {};
      }
      return curr[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Validate API key format
   */
  private static isValidApiKey(key: string): boolean {
    // Simple validation - at least 32 characters
    return typeof key === 'string' && key.length >= 32;
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
