/**
 * Environment-specific database configuration loader
 * Handles loading appropriate configuration based on environment
 */

import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface DatabaseConfig {
  databaseUrl: string;
  redisUrl: string;
  nodeEnv: string;
  logLevel: string;
  prismaEngineType: string;
  prismaLogLevel: string;
  connectionLimit: number;
  idleTimeout: number;
  maxLifetime: number;
  enableSeeding: boolean;
  seedSampleData: boolean;
  sslMode: string | undefined;
  sslRejectUnauthorized: boolean | undefined;
}

/**
 * Load environment-specific configuration
 */
export function loadDatabaseConfig(environment?: string): DatabaseConfig {
  const env = environment || process.env.NODE_ENV || 'development';

  // Load base environment variables
  config();

  // Load environment-specific variables
  const envFile = join(__dirname, '..', 'env', `.env.${env}`);
  config({ path: envFile });

  // Validate required variables
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required but not provided');
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL is required but not provided');
  }

  return {
    databaseUrl,
    redisUrl,
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    prismaEngineType: process.env.PRISMA_ENGINE_TYPE || 'library',
    prismaLogLevel: process.env.PRISMA_LOG_LEVEL || 'info',
    connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
    idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '60000'),
    maxLifetime: parseInt(process.env.DATABASE_MAX_LIFETIME || '3600000'),
    enableSeeding: process.env.ENABLE_DATABASE_SEEDING === 'true',
    seedSampleData: process.env.SEED_SAMPLE_DATA === 'true',
    sslMode: process.env.DATABASE_SSL_MODE || undefined,
    sslRejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true' || undefined,
  };
}

/**
 * Get Prisma client configuration based on environment
 */
export function getPrismaConfig(environment?: string) {
  const config = loadDatabaseConfig(environment);

  const prismaConfig: Record<string, unknown> = {
    datasources: {
      db: {
        url: config.databaseUrl,
      },
    },
  };

  // Add logging configuration
  if (config.nodeEnv === 'development') {
    prismaConfig.log = ['query', 'info', 'warn', 'error'];
  } else if (config.nodeEnv === 'staging') {
    prismaConfig.log = ['warn', 'error'];
  } else {
    prismaConfig.log = ['error'];
  }

  return prismaConfig;
}

/**
 * Get Redis client configuration based on environment
 */
export function getRedisConfig(environment?: string) {
  const config = loadDatabaseConfig(environment);

  const redisConfig: Record<string, unknown> = {
    url: config.redisUrl,
  };

  // Add SSL configuration for production
  if (config.nodeEnv === 'production' && config.sslMode) {
    redisConfig.socket = {
      tls: true,
      rejectUnauthorized: config.sslRejectUnauthorized,
    };
  }

  return redisConfig;
}

/**
 * Validate database configuration
 */
export function validateDatabaseConfig(config: DatabaseConfig): void {
  const errors: string[] = [];

  if (!config.databaseUrl) {
    errors.push('DATABASE_URL is required');
  }

  if (!config.redisUrl) {
    errors.push('REDIS_URL is required');
  }

  if (config.connectionLimit <= 0) {
    errors.push('DATABASE_CONNECTION_LIMIT must be greater than 0');
  }

  if (config.idleTimeout <= 0) {
    errors.push('DATABASE_IDLE_TIMEOUT must be greater than 0');
  }

  if (config.maxLifetime <= 0) {
    errors.push('DATABASE_MAX_LIFETIME must be greater than 0');
  }

  if (errors.length > 0) {
    throw new Error(`Database configuration validation failed:\n${errors.join('\n')}`);
  }
}

// Export default configuration for current environment
export const databaseConfig = loadDatabaseConfig();

// Validate configuration on load
validateDatabaseConfig(databaseConfig);
