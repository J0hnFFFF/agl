#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { devCommand } from './commands/dev';
import { deployCommand } from './commands/deploy';
import { configCommand } from './commands/config';
import { statusCommand } from './commands/status';

const program = new Command();

// CLI metadata
program
  .name('agl')
  .description('AGL Platform CLI - Developer tools for AI Game Companion Engine')
  .version('1.0.0');

// Register commands
program
  .command('init [project-name]')
  .description('Initialize a new AGL project')
  .option('-t, --template <template>', 'Project template (unity, web, unreal)', 'web')
  .option('-p, --path <path>', 'Project directory path')
  .option('--skip-install', 'Skip npm/package installation')
  .option('--skip-git', 'Skip git initialization')
  .action(initCommand);

program
  .command('dev')
  .description('Start local development environment')
  .option('-s, --services <services>', 'Services to start (api,emotion,dialogue,memory,all)', 'all')
  .option('-p, --port <port>', 'API service port', '3000')
  .option('--no-docker', 'Run without Docker')
  .action(devCommand);

program
  .command('deploy')
  .description('Deploy AGL services')
  .option('-e, --env <environment>', 'Deployment environment (dev, staging, production)', 'dev')
  .option('-s, --services <services>', 'Services to deploy (api,emotion,dialogue,memory,all)', 'all')
  .option('--skip-build', 'Skip build step')
  .option('--skip-tests', 'Skip tests before deployment')
  .action(deployCommand);

program
  .command('config')
  .description('Manage AGL configuration')
  .option('-s, --set <key=value>', 'Set configuration value')
  .option('-g, --get <key>', 'Get configuration value')
  .option('-l, --list', 'List all configuration')
  .option('--global', 'Use global configuration')
  .action(configCommand);

program
  .command('status')
  .description('Check AGL services status')
  .option('-v, --verbose', 'Verbose output')
  .action(statusCommand);

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);
} catch (err: any) {
  if (err.code === 'commander.helpDisplayed') {
    process.exit(0);
  }
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
}

// Show help if no command specified
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
