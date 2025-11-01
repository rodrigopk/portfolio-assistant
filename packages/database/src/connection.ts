/**
 * Database connection pool configuration and management
 * Handles connection pooling for different environments with proper resource management
 */

import { PrismaClient } from './generated/client/index.js';
import { loadDatabaseConfig, getPrismaConfig } from './config.js';
import type { DatabaseConfig } from './config.js';

export interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  idleTimeoutMs: number;
  maxLifetimeMs: number;
  acquireTimeoutMs: number;
  createRetryIntervalMs: number;
  createTimeoutMs: number;
  destroyTimeoutMs: number;
  poolMin: number;
  poolMax: number;
}

/**
 * Get connection pool configuration based on environment
 */
export function getConnectionPoolConfig(config: DatabaseConfig): ConnectionPoolConfig {
  const isProduction = config.nodeEnv === 'production';
  const isStaging = config.nodeEnv === 'staging';

  // Base configuration
  const baseConfig: ConnectionPoolConfig = {
    maxConnections: config.connectionLimit,
    minConnections: isProduction ? Math.ceil(config.connectionLimit * 0.2) : 2,
    idleTimeoutMs: config.idleTimeout,
    maxLifetimeMs: config.maxLifetime,
    acquireTimeoutMs: isProduction ? 10000 : 30000,
    createRetryIntervalMs: 1000,
    createTimeoutMs: isProduction ? 10000 : 30000,
    destroyTimeoutMs: 5000,
    poolMin: isProduction ? Math.ceil(config.connectionLimit * 0.1) : 1,
    poolMax: config.connectionLimit,
  };

  // Environment-specific overrides
  if (isProduction) {
    return {
      ...baseConfig,
      maxConnections: 50,
      minConnections: 10,
      idleTimeoutMs: 15000,
      maxLifetimeMs: 900000, // 15 minutes
      acquireTimeoutMs: 10000,
    };
  }

  if (isStaging) {
    return {
      ...baseConfig,
      maxConnections: 20,
      minConnections: 4,
      idleTimeoutMs: 30000,
      maxLifetimeMs: 1800000, // 30 minutes
      acquireTimeoutMs: 15000,
    };
  }

  // Development
  return {
    ...baseConfig,
    maxConnections: 10,
    minConnections: 2,
    idleTimeoutMs: 60000,
    maxLifetimeMs: 3600000, // 60 minutes
    acquireTimeoutMs: 30000,
  };
}

/**
 * Enhanced Prisma client with connection pooling
 */
class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  private prisma: PrismaClient | null = null;
  private config: DatabaseConfig;
  private poolConfig: ConnectionPoolConfig;
  private isConnected = false;
  private connectionRetries = 0;
  private maxRetries = 3;

  private constructor(environment?: string) {
    this.config = loadDatabaseConfig(environment);
    this.poolConfig = getConnectionPoolConfig(this.config);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(environment?: string): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection(environment);
    }
    return DatabaseConnection.instance;
  }

  /**
   * Initialize Prisma client with connection pooling
   */
  private createPrismaClient(): PrismaClient {
    const prismaConfig = getPrismaConfig();

    // Add connection pool configuration to datasource URL
    const pooledUrl = this.buildPooledConnectionUrl();

    return new PrismaClient({
      ...prismaConfig,
      datasources: {
        db: {
          url: pooledUrl,
        },
      },
      errorFormat: this.config.nodeEnv === 'development' ? 'pretty' : 'minimal',
      log: this.getLogConfig(),
    });
  }

  /**
   * Build connection URL with pooling parameters
   */
  private buildPooledConnectionUrl(): string {
    const url = new URL(this.config.databaseUrl);

    // Add connection pool parameters
    url.searchParams.set('connection_limit', this.poolConfig.maxConnections.toString());
    url.searchParams.set(
      'pool_timeout',
      Math.ceil(this.poolConfig.acquireTimeoutMs / 1000).toString()
    );
    url.searchParams.set('sslmode', this.config.sslMode || 'prefer');

    // Production-specific parameters
    if (this.config.nodeEnv === 'production') {
      url.searchParams.set('sslmode', 'require');
      url.searchParams.set('statement_timeout', '30000'); // 30 seconds
      url.searchParams.set('lock_timeout', '10000'); // 10 seconds
      url.searchParams.set('idle_in_transaction_session_timeout', '60000'); // 1 minute
    }

    return url.toString();
  }

  /**
   * Get logging configuration based on environment
   */
  private getLogConfig() {
    switch (this.config.nodeEnv) {
      case 'development':
        return [
          { level: 'query' as const, emit: 'stdout' as const },
          { level: 'info' as const, emit: 'stdout' as const },
          { level: 'warn' as const, emit: 'stdout' as const },
          { level: 'error' as const, emit: 'stdout' as const },
        ];
      case 'staging':
        return [
          { level: 'warn' as const, emit: 'stdout' as const },
          { level: 'error' as const, emit: 'stdout' as const },
        ];
      case 'production':
        return [{ level: 'error' as const, emit: 'stdout' as const }];
      default:
        return [];
    }
  }

  /**
   * Connect to database with retry logic
   */
  public async connect(): Promise<void> {
    if (this.isConnected && this.prisma) {
      return;
    }

    try {
      this.prisma = this.createPrismaClient();
      await this.prisma.$connect();
      this.isConnected = true;
      this.connectionRetries = 0;

      console.log(`✅ Database connected (Environment: ${this.config.nodeEnv})`);
      console.log(
        `📊 Connection pool: ${this.poolConfig.minConnections}-${this.poolConfig.maxConnections} connections`
      );
    } catch (error) {
      this.connectionRetries++;
      console.error(
        `❌ Database connection failed (attempt ${this.connectionRetries}/${this.maxRetries}):`,
        error
      );

      if (this.connectionRetries >= this.maxRetries) {
        throw new Error(`Failed to connect to database after ${this.maxRetries} attempts`);
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, this.connectionRetries), 30000);
      console.log(`🔄 Retrying connection in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      return this.connect();
    }
  }

  /**
   * Disconnect from database
   */
  public async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
      this.isConnected = false;
      console.log('📴 Database disconnected');
    }
  }

  /**
   * Get Prisma client instance
   */
  public getClient(): PrismaClient {
    if (!this.prisma || !this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.prisma;
  }

  /**
   * Health check for the database connection
   */
  public async healthCheck(): Promise<{
    connected: boolean;
    responseTime: number;
    poolStatus:
      | {
          activeConnections: number;
          idleConnections: number;
          totalConnections: number;
        }
      | undefined;
  }> {
    if (!this.prisma) {
      return { connected: false, responseTime: -1, poolStatus: undefined };
    }

    const startTime = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        connected: true,
        responseTime,
        poolStatus: await this.getPoolStatus(),
      };
    } catch {
      return { connected: false, responseTime: Date.now() - startTime, poolStatus: undefined };
    }
  }

  /**
   * Get connection pool status
   */
  private async getPoolStatus() {
    if (!this.prisma) return undefined;

    try {
      // Query PostgreSQL stats to get connection info
      const result = await this.prisma.$queryRaw<
        Array<{
          state: string;
          count: bigint;
        }>
      >`
        SELECT state, count(*) as count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
      `;

      let activeConnections = 0;
      let idleConnections = 0;

      result.forEach((row) => {
        const count = Number(row.count);
        if (row.state === 'active') {
          activeConnections = count;
        } else if (row.state === 'idle') {
          idleConnections = count;
        }
      });

      return {
        activeConnections,
        idleConnections,
        totalConnections: activeConnections + idleConnections,
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Get connection pool configuration
   */
  public getPoolConfig(): ConnectionPoolConfig {
    return { ...this.poolConfig };
  }

  /**
   * Get database configuration
   */
  public getDatabaseConfig(): DatabaseConfig {
    return { ...this.config };
  }
}

// Export singleton instance and factory function
export const createDatabaseConnection = (environment?: string) =>
  DatabaseConnection.getInstance(environment);

// Export default instance for convenience
export const database = createDatabaseConnection();

// Auto-connect in non-test environments
if (process.env.NODE_ENV !== 'test') {
  database.connect().catch((error) => {
    console.error('Failed to auto-connect to database:', error);
    process.exit(1);
  });
}

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log('🔄 Gracefully shutting down database connection...');
  await database.disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('beforeExit', gracefulShutdown);

export default database;
