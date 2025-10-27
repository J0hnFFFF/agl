import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Connection pool settings for better performance
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Log configuration
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    // Log slow queries (> 1 second)
    this.$on('warn' as never, (e: any) => {
      this.logger.warn(e);
    });

    this.$on('error' as never, (e: any) => {
      this.logger.error(e);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Database connected with optimized connection pool');

    // Enable query result caching
    await this.$executeRaw`SET SESSION query_cache_type = ON`;
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('👋 Database disconnected');
  }

  /**
   * Execute query with automatic retry on connection errors
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Check if it's a connection error
        if (error.code === 'P2024' || error.code === 'P1001') {
          this.logger.warn(`Database connection error, retrying (${i + 1}/${maxRetries})`);
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
          continue;
        }

        // If it's not a connection error, throw immediately
        throw error;
      }
    }

    throw lastError;
  }
}
