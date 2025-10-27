import chalk from 'chalk';
import ora, { Ora } from 'ora';
import boxen from 'boxen';

/**
 * Logger utility for CLI output
 */
export class Logger {
  private static spinner: Ora | null = null;

  /**
   * Log success message
   */
  static success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  /**
   * Log error message
   */
  static error(message: string, error?: Error): void {
    console.error(chalk.red('✗'), message);
    if (error && process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }
  }

  /**
   * Log warning message
   */
  static warn(message: string): void {
    console.warn(chalk.yellow('⚠'), message);
  }

  /**
   * Log info message
   */
  static info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  /**
   * Log debug message (only in DEBUG mode)
   */
  static debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(chalk.gray('[DEBUG]'), message);
    }
  }

  /**
   * Start a spinner with message
   */
  static startSpinner(message: string): void {
    this.spinner = ora(message).start();
  }

  /**
   * Update spinner message
   */
  static updateSpinner(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  /**
   * Stop spinner with success
   */
  static succeedSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner with failure
   */
  static failSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }

  /**
   * Display a boxed message
   */
  static box(message: string, title?: string): void {
    console.log(
      boxen(message, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        title: title,
        titleAlignment: 'center',
      }),
    );
  }

  /**
   * Display welcome banner
   */
  static banner(): void {
    const banner = `
${chalk.bold.cyan('    █████╗  ██████╗ ██╗     ')}
${chalk.bold.cyan('   ██╔══██╗██╔════╝ ██║     ')}
${chalk.bold.cyan('   ███████║██║  ███╗██║     ')}
${chalk.bold.cyan('   ██╔══██║██║   ██║██║     ')}
${chalk.bold.cyan('   ██║  ██║╚██████╔╝███████╗')}
${chalk.bold.cyan('   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝')}

${chalk.bold('   AI Game Companion Engine')}
${chalk.gray('   Version 1.0.0')}
`;
    console.log(banner);
  }

  /**
   * Display a table
   */
  static table(headers: string[], rows: string[][]): void {
    const colWidths = headers.map((h, i) => {
      const maxRowWidth = Math.max(...rows.map((r) => (r[i] || '').length));
      return Math.max(h.length, maxRowWidth);
    });

    // Header
    const headerRow = headers
      .map((h, i) => h.padEnd(colWidths[i]))
      .join('  ');
    console.log(chalk.bold(headerRow));

    // Separator
    console.log(colWidths.map((w) => '-'.repeat(w)).join('  '));

    // Rows
    rows.forEach((row) => {
      const rowStr = row
        .map((cell, i) => (cell || '').padEnd(colWidths[i]))
        .join('  ');
      console.log(rowStr);
    });
  }

  /**
   * Prompt user for confirmation
   */
  static async confirm(message: string, defaultValue: boolean = false): Promise<boolean> {
    const { default: inquirer } = await import('inquirer');
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message,
        default: defaultValue,
      },
    ]);
    return confirm;
  }

  /**
   * Prompt user for input
   */
  static async input(message: string, defaultValue?: string): Promise<string> {
    const { default: inquirer } = await import('inquirer');
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message,
        default: defaultValue,
      },
    ]);
    return input;
  }

  /**
   * Prompt user for selection
   */
  static async select(message: string, choices: string[]): Promise<string> {
    const { default: inquirer } = await import('inquirer');
    const { selection } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selection',
        message,
        choices,
      },
    ]);
    return selection;
  }
}
