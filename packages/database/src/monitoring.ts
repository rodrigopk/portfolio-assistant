/**
 * Database monitoring and health check utilities
 * Provides metrics and monitoring for connection pool performance
 */

import { database } from './connection.js';

export interface DatabaseMetrics {
  timestamp: Date;
  connectionPool: {
    active: number;
    idle: number;
    total: number;
    maxConnections: number;
    utilizationPercent: number;
  };
  performance: {
    responseTimeMs: number;
    connected: boolean;
    lastCheck: Date;
  };
  errors: {
    connectionErrors: number;
    queryErrors: number;
    timeoutErrors: number;
  };
}

/**
 * Database monitoring class
 */
export class DatabaseMonitor {
  private metrics: DatabaseMetrics;
  private errorCounts = {
    connectionErrors: 0,
    queryErrors: 0,
    timeoutErrors: 0,
  };
  
  constructor() {
    this.metrics = this.createInitialMetrics();
  }
  
  private createInitialMetrics(): DatabaseMetrics {
    const config = database.getPoolConfig();
    
    return {
      timestamp: new Date(),
      connectionPool: {
        active: 0,
        idle: 0,
        total: 0,
        maxConnections: config.maxConnections,
        utilizationPercent: 0,
      },
      performance: {
        responseTimeMs: 0,
        connected: false,
        lastCheck: new Date(),
      },
      errors: { ...this.errorCounts },
    };
  }
  
  /**
   * Collect current database metrics
   */
  public async collectMetrics(): Promise<DatabaseMetrics> {
    try {
      const healthCheck = await database.healthCheck();
      const config = database.getPoolConfig();
      
      this.metrics = {
        timestamp: new Date(),
        connectionPool: {
          active: healthCheck.poolStatus?.activeConnections || 0,
          idle: healthCheck.poolStatus?.idleConnections || 0,
          total: healthCheck.poolStatus?.totalConnections || 0,
          maxConnections: config.maxConnections,
          utilizationPercent: healthCheck.poolStatus?.totalConnections 
            ? Math.round((healthCheck.poolStatus.totalConnections / config.maxConnections) * 100)
            : 0,
        },
        performance: {
          responseTimeMs: healthCheck.responseTime,
          connected: healthCheck.connected,
          lastCheck: new Date(),
        },
        errors: { ...this.errorCounts },
      };
      
      return this.metrics;
    } catch (error) {
      this.incrementErrorCount('connectionErrors');
      throw error;
    }
  }
  
  /**
   * Get current metrics without collecting new ones
   */
  public getCurrentMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Increment error count by type
   */
  public incrementErrorCount(errorType: keyof typeof this.errorCounts): void {
    this.errorCounts[errorType]++;
  }
  
  /**
   * Reset error counts
   */
  public resetErrorCounts(): void {
    this.errorCounts = {
      connectionErrors: 0,
      queryErrors: 0,
      timeoutErrors: 0,
    };
  }
  
  /**
   * Check if database is healthy
   */
  public async isHealthy(): Promise<boolean> {
    try {
      const healthCheck = await database.healthCheck();
      const metrics = await this.collectMetrics();
      
      // Health criteria
      const isConnected = healthCheck.connected;
      const responseTimeOk = healthCheck.responseTime < 5000; // 5 seconds max
      const poolNotOverloaded = metrics.connectionPool.utilizationPercent < 90;
      const lowErrorRate = metrics.errors.connectionErrors < 10;
      
      return isConnected && responseTimeOk && poolNotOverloaded && lowErrorRate;
    } catch {
      return false;
    }
  }
  
  /**
   * Get health status with details
   */
  public async getHealthStatus(): Promise<{
    healthy: boolean;
    status: 'healthy' | 'warning' | 'critical';
    checks: {
      database_connected: boolean;
      response_time_ok: boolean;
      pool_utilization_ok: boolean;
      error_rate_ok: boolean;
    };
    metrics: DatabaseMetrics;
  }> {
    try {
      const metrics = await this.collectMetrics();
      const responseTimeOk = metrics.performance.responseTimeMs < 5000;
      const poolUtilizationOk = metrics.connectionPool.utilizationPercent < 90;
      const errorRateOk = metrics.errors.connectionErrors < 10;
      
      const checks = {
        database_connected: metrics.performance.connected,
        response_time_ok: responseTimeOk,
        pool_utilization_ok: poolUtilizationOk,
        error_rate_ok: errorRateOk,
      };
      
      const allChecksPass = Object.values(checks).every(check => check);
      const criticalFailure = !metrics.performance.connected;
      
      let status: 'healthy' | 'warning' | 'critical';
      if (criticalFailure) {
        status = 'critical';
      } else if (!allChecksPass) {
        status = 'warning';
      } else {
        status = 'healthy';
      }
      
      return {
        healthy: allChecksPass,
        status,
        checks,
        metrics,
      };
    } catch {
      this.incrementErrorCount('connectionErrors');
      
      return {
        healthy: false,
        status: 'critical',
        checks: {
          database_connected: false,
          response_time_ok: false,
          pool_utilization_ok: false,
          error_rate_ok: false,
        },
        metrics: this.createInitialMetrics(),
      };
    }
  }
  
  /**
   * Log metrics to console (for development/debugging)
   */
  public logMetrics(): void {
    const metrics = this.getCurrentMetrics();
    
    console.log('📊 Database Metrics:', {
      timestamp: metrics.timestamp.toISOString(),
      connected: metrics.performance.connected,
      responseTime: `${metrics.performance.responseTimeMs}ms`,
      connectionPool: `${metrics.connectionPool.active}/${metrics.connectionPool.total}/${metrics.connectionPool.maxConnections} (${metrics.connectionPool.utilizationPercent}%)`,
      errors: metrics.errors,
    });
  }
  
  /**
   * Start periodic monitoring (for development/staging)
   */
  public startPeriodicMonitoring(intervalMs = 30000): NodeJS.Timeout {
    console.log(`🔄 Starting database monitoring (interval: ${intervalMs}ms)`);
    
    return setInterval(async () => {
      try {
        await this.collectMetrics();
        this.logMetrics();
      } catch (error) {
        console.error('❌ Database monitoring error:', error);
      }
    }, intervalMs);
  }
}

// Export singleton monitor instance
export const databaseMonitor = new DatabaseMonitor();

/**
 * Express middleware for database health checks
 */
export function createHealthCheckMiddleware() {
  return async (req: unknown, res: unknown, _next: unknown) => {
    // Type assertion for Express types
    const response = res as { status: (code: number) => { json: (data: unknown) => void } };
    
    try {
      const healthStatus = await databaseMonitor.getHealthStatus();
      
      response.status(healthStatus.healthy ? 200 : 503).json({
        status: healthStatus.status,
        timestamp: new Date().toISOString(),
        checks: healthStatus.checks,
        metrics: {
          connectionPool: healthStatus.metrics.connectionPool,
          performance: healthStatus.metrics.performance,
        },
      });
    } catch {
      response.status(503).json({
        status: 'critical',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  };
}

/**
 * Performance optimization recommendations based on metrics
 */
export function getPerformanceRecommendations(metrics: DatabaseMetrics): string[] {
  const recommendations: string[] = [];
  
  // High connection pool utilization
  if (metrics.connectionPool.utilizationPercent > 80) {
    recommendations.push('Consider increasing connection pool size');
  }
  
  // Slow response times
  if (metrics.performance.responseTimeMs > 1000) {
    recommendations.push('Database response time is slow - check query performance');
  }
  
  // High error rates
  if (metrics.errors.connectionErrors > 5) {
    recommendations.push('High connection error rate - check database availability');
  }
  
  if (metrics.errors.queryErrors > 10) {
    recommendations.push('High query error rate - review application queries');
  }
  
  // Low utilization
  if (metrics.connectionPool.utilizationPercent < 10 && metrics.connectionPool.maxConnections > 10) {
    recommendations.push('Connection pool may be oversized - consider reducing maxConnections');
  }
  
  return recommendations;
}