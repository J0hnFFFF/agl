import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config';

interface ConfigOptions {
  set?: string;
  get?: string;
  list?: boolean;
  global?: boolean;
}

/**
 * Manage AGL configuration
 */
export async function configCommand(options: ConfigOptions): Promise<void> {
  try {
    const isGlobal = options.global || false;

    // Set configuration value
    if (options.set) {
      const [key, ...valueParts] = options.set.split('=');
      const value = valueParts.join('=');

      if (!key || !value) {
        Logger.error('Invalid format. Use: --set key=value');
        process.exit(1);
      }

      await ConfigManager.set(key.trim(), value.trim(), isGlobal);
      Logger.success(`Configuration updated: ${key} = ${value}`);
      Logger.info(`Scope: ${isGlobal ? 'global' : 'local'}`);
      return;
    }

    // Get configuration value
    if (options.get) {
      const value = await ConfigManager.get(options.get, isGlobal);
      if (value === undefined) {
        Logger.warn(`Configuration key not found: ${options.get}`);
        process.exit(1);
      }
      console.log(value);
      return;
    }

    // List all configuration
    if (options.list) {
      const config = isGlobal
        ? await ConfigManager.getAll(true)
        : await ConfigManager.getMerged();

      if (Object.keys(config).length === 0) {
        Logger.info('No configuration found');
        return;
      }

      Logger.info(`Configuration (${isGlobal ? 'global' : 'merged'}):`);
      console.log();

      const rows = Object.entries(config).map(([key, value]) => {
        const valueStr = typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
        return [key, valueStr.substring(0, 50)];
      });

      Logger.table(['Key', 'Value'], rows);
      return;
    }

    // If no options specified, show help
    Logger.info('AGL Configuration Management');
    console.log();
    Logger.info('Usage:');
    Logger.info('  agl config --set key=value     Set configuration value');
    Logger.info('  agl config --get key            Get configuration value');
    Logger.info('  agl config --list               List all configuration');
    Logger.info('  agl config --global            Use global configuration');
    console.log();
    Logger.info('Examples:');
    Logger.info('  agl config --set apiKey=your-key');
    Logger.info('  agl config --get apiKey');
    Logger.info('  agl config --list --global');
  } catch (error: any) {
    Logger.error('Configuration operation failed', error);
    process.exit(1);
  }
}
