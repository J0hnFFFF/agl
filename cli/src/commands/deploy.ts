import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../utils/logger';
import { FileSystemUtils } from '../utils/fs-utils';
import { ConfigManager } from '../utils/config';

const execAsync = promisify(exec);

interface DeployOptions {
  env: 'dev' | 'staging' | 'production';
  services: string;
  skipBuild?: boolean;
  skipTests?: boolean;
}

/**
 * Deploy AGL services
 */
export async function deployCommand(options: DeployOptions): Promise<void> {
  try {
    // Check if running inside an AGL project
    const isProject = await FileSystemUtils.isAGLProject();
    if (!isProject) {
      Logger.error('Not an AGL project. Run this command inside an AGL project directory.');
      process.exit(1);
    }

    Logger.banner();
    Logger.info(`Deploying to: ${options.env}`);
    Logger.info(`Services: ${options.services}`);
    console.log();

    // Confirmation for production
    if (options.env === 'production') {
      const confirmed = await Logger.confirm(
        'Are you sure you want to deploy to PRODUCTION?',
        false,
      );
      if (!confirmed) {
        Logger.info('Deployment cancelled');
        process.exit(0);
      }
    }

    // Load configuration
    const config = await ConfigManager.getMerged();
    if (!config.apiKey && options.env === 'production') {
      Logger.error('API key not configured. Set it in .agl.yml or global config');
      process.exit(1);
    }

    // Run tests
    if (!options.skipTests) {
      Logger.startSpinner('Running tests...');
      try {
        await execAsync('npm test');
        Logger.succeedSpinner('All tests passed');
      } catch (error) {
        Logger.failSpinner('Tests failed');
        const proceed = await Logger.confirm('Tests failed. Continue anyway?', false);
        if (!proceed) {
          process.exit(1);
        }
      }
    }

    // Build services
    if (!options.skipBuild) {
      Logger.startSpinner('Building services...');
      try {
        await execAsync('npm run build');
        Logger.succeedSpinner('Build completed');
      } catch (error) {
        Logger.failSpinner('Build failed');
        throw error;
      }
    }

    // Deploy
    Logger.startSpinner('Deploying services...');
    await deployServices(options.services, options.env);
    Logger.succeedSpinner('Deployment completed');

    Logger.box(
      `Services deployed successfully to ${options.env}! 🚀

Next steps:
  1. Verify deployment: agl status --env ${options.env}
  2. Monitor logs
  3. Run smoke tests

Dashboard: https://dashboard.agl.dev/${options.env}`,
      '✨ Success',
    );
  } catch (error: any) {
    Logger.error('Deployment failed', error);
    process.exit(1);
  }
}

/**
 * Deploy services
 */
async function deployServices(servicesStr: string, env: string): Promise<void> {
  const services = servicesStr === 'all'
    ? ['api', 'emotion', 'dialogue', 'memory']
    : servicesStr.split(',').map((s) => s.trim());

  for (const service of services) {
    Logger.updateSpinner(`Deploying ${service}...`);
    // Simulate deployment (in real implementation, this would use Docker, K8s, etc.)
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
