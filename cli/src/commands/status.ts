import axios from 'axios';
import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config';

interface StatusOptions {
  verbose?: boolean;
}

/**
 * Check AGL services status
 */
export async function statusCommand(options: StatusOptions): Promise<void> {
  try {
    Logger.info('Checking AGL services status...');
    console.log();

    const config = await ConfigManager.getMerged();

    const services = [
      { name: 'API Service', url: config.apiBaseUrl || 'http://localhost:3000' },
      { name: 'Emotion Service', url: config.emotionServiceUrl || 'http://localhost:8000' },
      { name: 'Dialogue Service', url: config.dialogueServiceUrl || 'http://localhost:8001' },
      { name: 'Memory Service', url: config.memoryServiceUrl || 'http://localhost:3002' },
    ];

    const statuses: [string, string, string][] = [];

    for (const service of services) {
      Logger.startSpinner(`Checking ${service.name}...`);

      try {
        const healthUrl = service.name === 'API Service'
          ? `${service.url}/api/v1/metrics/health`
          : `${service.url}/health`;

        const response = await axios.get(healthUrl, {
          timeout: 5000,
          validateStatus: () => true, // Don't throw on non-2xx
        });

        if (response.status === 200) {
          Logger.succeedSpinner(`${service.name}: ✓ Online`);
          statuses.push([service.name, '✓ Online', service.url]);

          if (options.verbose && response.data) {
            Logger.debug(JSON.stringify(response.data, null, 2));
          }
        } else {
          Logger.failSpinner(`${service.name}: ✗ Unhealthy (${response.status})`);
          statuses.push([service.name, `✗ Unhealthy (${response.status})`, service.url]);
        }
      } catch (error: any) {
        Logger.failSpinner(`${service.name}: ✗ Offline`);
        statuses.push([service.name, '✗ Offline', service.url]);

        if (options.verbose) {
          Logger.debug(error.message);
        }
      }
    }

    console.log();
    Logger.table(['Service', 'Status', 'URL'], statuses);

    // Summary
    const onlineCount = statuses.filter((s) => s[1].includes('Online')).length;
    const totalCount = statuses.length;

    console.log();
    if (onlineCount === totalCount) {
      Logger.success(`All services are online (${onlineCount}/${totalCount})`);
    } else if (onlineCount > 0) {
      Logger.warn(`Some services are offline (${onlineCount}/${totalCount} online)`);
    } else {
      Logger.error('All services are offline');
    }
  } catch (error: any) {
    Logger.error('Failed to check service status', error);
    process.exit(1);
  }
}
