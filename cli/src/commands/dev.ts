import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { Logger } from '../utils/logger';
import { FileSystemUtils } from '../utils/fs-utils';
import { ConfigManager } from '../utils/config';

const execAsync = promisify(exec);

interface DevOptions {
  services: string;
  port: string;
  docker: boolean;
}

const runningProcesses: ChildProcess[] = [];

/**
 * Start local development environment
 */
export async function devCommand(options: DevOptions): Promise<void> {
  try {
    // Check if running inside an AGL project
    const isProject = await FileSystemUtils.isAGLProject();
    if (!isProject) {
      Logger.error('Not an AGL project. Run this command inside an AGL project directory.');
      Logger.info('Hint: Initialize a new project with: agl init');
      process.exit(1);
    }

    Logger.banner();
    Logger.info('Starting AGL development environment...');
    console.log();

    // Load project configuration
    const config = await ConfigManager.getMerged();

    // Determine which services to start
    const services = parseServices(options.services);
    Logger.info(`Services: ${services.join(', ')}`);
    Logger.info(`Docker: ${options.docker ? 'Yes' : 'No'}`);
    console.log();

    // Check dependencies
    Logger.startSpinner('Checking environment...');
    await checkEnvironment(options.docker);
    Logger.succeedSpinner('Environment check passed');

    // Start services
    if (options.docker) {
      await startWithDocker(services);
    } else {
      await startWithoutDocker(services, config, options.port);
    }

    // Setup graceful shutdown
    setupShutdownHandlers();

    Logger.box(
      `Development environment is running! 🚀

API Service: http://localhost:${options.port}
Metrics: http://localhost:${options.port}/api/v1/metrics/health

Press Ctrl+C to stop all services`,
      '✨ Ready',
    );

    // Keep process alive
    await new Promise(() => {});
  } catch (error: any) {
    Logger.error('Failed to start development environment', error);
    await cleanup();
    process.exit(1);
  }
}

/**
 * Parse services string to array
 */
function parseServices(servicesStr: string): string[] {
  if (servicesStr === 'all') {
    return ['api', 'emotion', 'dialogue', 'memory', 'database', 'redis', 'qdrant'];
  }
  return servicesStr.split(',').map((s) => s.trim());
}

/**
 * Check environment requirements
 */
async function checkEnvironment(useDocker: boolean): Promise<void> {
  if (useDocker) {
    // Check Docker
    try {
      await execAsync('docker --version');
      await execAsync('docker-compose --version');
    } catch {
      throw new Error('Docker or Docker Compose not found. Please install Docker Desktop.');
    }
  } else {
    // Check Node.js
    try {
      await execAsync('node --version');
    } catch {
      throw new Error('Node.js not found. Please install Node.js.');
    }

    // Check Python (for emotion/dialogue services)
    try {
      await execAsync('python --version');
    } catch {
      Logger.warn('Python not found. Emotion and Dialogue services will not be available.');
    }

    // Check PostgreSQL
    try {
      await execAsync('psql --version');
    } catch {
      Logger.warn('PostgreSQL not found. Please ensure PostgreSQL is installed and running.');
    }
  }
}

/**
 * Start services with Docker
 */
async function startWithDocker(services: string[]): Promise<void> {
  Logger.startSpinner('Starting services with Docker...');

  const projectRoot = await FileSystemUtils.getProjectRoot();
  if (!projectRoot) {
    throw new Error('Project root not found');
  }

  // Find docker-compose.yml in project or use default
  const dockerComposePath = path.join(projectRoot, 'docker-compose.yml');
  const dockerComposeExists = await FileSystemUtils.findFileUp('docker-compose.yml');

  if (!dockerComposeExists) {
    Logger.warn('docker-compose.yml not found. Creating default configuration...');
    await createDefaultDockerCompose(projectRoot);
  }

  try {
    // Build and start services
    const serviceArgs = services.length > 0 ? services.join(' ') : '';
    await execAsync(`docker-compose up -d ${serviceArgs}`, { cwd: projectRoot });

    Logger.succeedSpinner('Services started successfully');

    // Show service status
    const { stdout } = await execAsync('docker-compose ps', { cwd: projectRoot });
    console.log();
    Logger.info('Service status:');
    console.log(stdout);
  } catch (error: any) {
    Logger.failSpinner('Failed to start services');
    throw error;
  }
}

/**
 * Start services without Docker
 */
async function startWithoutDocker(
  services: string[],
  config: any,
  apiPort: string,
): Promise<void> {
  Logger.info('Starting services...');

  const projectRoot = await FileSystemUtils.getProjectRoot();
  if (!projectRoot) {
    throw new Error('Project root not found');
  }

  // Start API service
  if (services.includes('api') || services.includes('all')) {
    Logger.startSpinner('Starting API service...');
    const apiProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(projectRoot, '../../services/api-service'),
      env: { ...process.env, PORT: apiPort },
      stdio: 'pipe',
    });

    apiProcess.stdout?.on('data', (data) => {
      Logger.debug(`[API] ${data.toString().trim()}`);
    });

    apiProcess.stderr?.on('data', (data) => {
      Logger.debug(`[API Error] ${data.toString().trim()}`);
    });

    runningProcesses.push(apiProcess);
    Logger.succeedSpinner('API service started');
  }

  // Start Emotion service (Python)
  if (services.includes('emotion') || services.includes('all')) {
    Logger.startSpinner('Starting Emotion service...');
    const emotionProcess = spawn('python', ['-m', 'uvicorn', 'main:app', '--reload'], {
      cwd: path.join(projectRoot, '../../services/emotion-service'),
      stdio: 'pipe',
    });

    emotionProcess.stdout?.on('data', (data) => {
      Logger.debug(`[Emotion] ${data.toString().trim()}`);
    });

    runningProcesses.push(emotionProcess);
    Logger.succeedSpinner('Emotion service started');
  }

  // Start Dialogue service (Python)
  if (services.includes('dialogue') || services.includes('all')) {
    Logger.startSpinner('Starting Dialogue service...');
    const dialogueProcess = spawn('python', ['-m', 'uvicorn', 'main:app', '--reload'], {
      cwd: path.join(projectRoot, '../../services/dialogue-service'),
      stdio: 'pipe',
    });

    dialogueProcess.stdout?.on('data', (data) => {
      Logger.debug(`[Dialogue] ${data.toString().trim()}`);
    });

    runningProcesses.push(dialogueProcess);
    Logger.succeedSpinner('Dialogue service started');
  }

  Logger.success('All services started');
}

/**
 * Create default docker-compose.yml
 */
async function createDefaultDockerCompose(projectRoot: string): Promise<void> {
  const dockerCompose = `version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: agl_user
      POSTGRES_PASSWORD: agl_password_dev
      POSTGRES_DB: agl_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

  api-service:
    build: ./services/api-service
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://agl_user:agl_password_dev@postgres:5432/agl_dev
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
    depends_on:
      - postgres
      - redis

  emotion-service:
    build: ./services/emotion-service
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://agl_user:agl_password_dev@postgres:5432/agl_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  dialogue-service:
    build: ./services/dialogue-service
    ports:
      - "8001:8001"
    environment:
      DATABASE_URL: postgresql://agl_user:agl_password_dev@postgres:5432/agl_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  memory-service:
    build: ./services/memory-service
    ports:
      - "3002:3002"
    environment:
      DATABASE_URL: postgresql://agl_user:agl_password_dev@postgres:5432/agl_dev
      QDRANT_URL: http://qdrant:6333
    depends_on:
      - postgres
      - qdrant

volumes:
  postgres_data:
  qdrant_data:
`;

  await FileSystemUtils.createFile(path.join(projectRoot, 'docker-compose.yml'), dockerCompose);
}

/**
 * Setup graceful shutdown handlers
 */
function setupShutdownHandlers(): void {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(); // New line after ^C
      Logger.info(`Received ${signal}, shutting down gracefully...`);
      await cleanup();
      process.exit(0);
    });
  });
}

/**
 * Cleanup running processes
 */
async function cleanup(): Promise<void> {
  for (const proc of runningProcesses) {
    if (proc && !proc.killed) {
      proc.kill('SIGTERM');
    }
  }

  // Wait a bit for processes to terminate
  await new Promise((resolve) => setTimeout(resolve, 1000));

  Logger.success('All services stopped');
}
