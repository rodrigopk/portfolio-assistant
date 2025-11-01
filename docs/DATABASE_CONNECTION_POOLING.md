# Database Connection Pooling Configuration

This document outlines the database connection pooling setup for the Portfolio Assistant application, including configuration options, monitoring, and best practices.

## 🏗️ Architecture Overview

The application uses a sophisticated connection pooling system built on top of Prisma Client with environment-specific optimizations:

- **Development**: 10 connections, optimized for debugging
- **Staging**: 20 connections, balanced for testing
- **Production**: 50 connections, optimized for performance

## ⚙️ Configuration

### Environment-Specific Settings

Connection pool settings are automatically configured based on the environment:

#### Development Environment

```bash
DATABASE_CONNECTION_LIMIT=10
DATABASE_IDLE_TIMEOUT=60000     # 1 minute
DATABASE_MAX_LIFETIME=3600000   # 1 hour
```

#### Staging Environment

```bash
DATABASE_CONNECTION_LIMIT=20
DATABASE_IDLE_TIMEOUT=30000     # 30 seconds
DATABASE_MAX_LIFETIME=1800000   # 30 minutes
```

#### Production Environment

```bash
DATABASE_CONNECTION_LIMIT=50
DATABASE_IDLE_TIMEOUT=15000     # 15 seconds
DATABASE_MAX_LIFETIME=900000    # 15 minutes
DATABASE_SSL_MODE=require
DATABASE_SSL_REJECT_UNAUTHORIZED=true
```

### Connection Pool Parameters

| Parameter          | Description                    | Development | Staging   | Production |
| ------------------ | ------------------------------ | ----------- | --------- | ---------- |
| `maxConnections`   | Maximum number of connections  | 10          | 20        | 50         |
| `minConnections`   | Minimum number of connections  | 2           | 4         | 10         |
| `idleTimeoutMs`    | Connection idle timeout        | 60000ms     | 30000ms   | 15000ms    |
| `maxLifetimeMs`    | Connection maximum lifetime    | 3600000ms   | 1800000ms | 900000ms   |
| `acquireTimeoutMs` | Connection acquisition timeout | 30000ms     | 15000ms   | 10000ms    |

## 📊 Monitoring and Health Checks

### Health Check Endpoints

The API provides several health check endpoints for monitoring:

#### General Health Check

```bash
GET /api/health
```

Returns overall application health including database status.

#### Database-Specific Health Check

```bash
GET /api/health/database
```

Returns detailed database metrics including:

- Connection pool utilization
- Response times
- Error counts
- Pool configuration

#### Readiness Probe

```bash
GET /api/health/ready
```

Kubernetes-compatible readiness probe that checks critical dependencies.

#### Liveness Probe

```bash
GET /api/health/live
```

Simple liveness check for container orchestration.

### Monitoring Metrics

The system tracks the following metrics:

- **Connection Pool Metrics**:
  - Active connections
  - Idle connections
  - Total connections
  - Pool utilization percentage

- **Performance Metrics**:
  - Database response time
  - Connection status
  - Last health check timestamp

- **Error Metrics**:
  - Connection errors
  - Query errors
  - Timeout errors

### Example Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T15:30:00.000Z",
  "checks": {
    "database_connected": true,
    "response_time_ok": true,
    "pool_utilization_ok": true,
    "error_rate_ok": true
  },
  "metrics": {
    "connectionPool": {
      "active": 5,
      "idle": 3,
      "total": 8,
      "maxConnections": 50,
      "utilizationPercent": 16
    },
    "performance": {
      "responseTimeMs": 23,
      "connected": true,
      "lastCheck": "2025-11-01T15:30:00.000Z"
    },
    "errors": {
      "connectionErrors": 0,
      "queryErrors": 0,
      "timeoutErrors": 0
    }
  }
}
```

## 🔧 Usage Examples

### Basic Database Connection

```typescript
import { database } from '@portfolio/database';

// Get the configured client
const prisma = database.getClient();

// Perform database operations
const users = await prisma.profile.findMany();
```

### Health Monitoring

```typescript
import { databaseMonitor } from '@portfolio/database';

// Get current metrics
const metrics = await databaseMonitor.collectMetrics();

// Check if database is healthy
const isHealthy = await databaseMonitor.isHealthy();

// Get detailed health status
const healthStatus = await databaseMonitor.getHealthStatus();
```

### Custom Connection Pool

```typescript
import { createDatabaseConnection } from '@portfolio/database';

// Create a custom connection for specific environment
const customDb = createDatabaseConnection('production');
await customDb.connect();

const client = customDb.getClient();
```

## 🚀 Performance Optimization

### Connection Pool Sizing

The connection pool size is automatically optimized based on environment:

- **Too few connections**: May cause queuing and increased response times
- **Too many connections**: May overwhelm the database and waste resources

### Recommendations by Environment

#### Development

- **Pool Size**: 10 connections (sufficient for single developer)
- **Timeout**: Longer timeouts for debugging
- **Monitoring**: Detailed logging enabled

#### Staging

- **Pool Size**: 20 connections (handles moderate load testing)
- **Timeout**: Balanced timeouts for realistic testing
- **Monitoring**: Periodic health checks

#### Production

- **Pool Size**: 50 connections (optimized for high concurrency)
- **Timeout**: Aggressive timeouts for fast failover
- **Monitoring**: Continuous monitoring with alerting

### Performance Best Practices

1. **Connection Reuse**: Always reuse the singleton database instance
2. **Query Optimization**: Use appropriate indexes and query patterns
3. **Connection Lifecycle**: Let the pool manage connection lifecycle
4. **Error Handling**: Implement proper error handling for connection failures
5. **Monitoring**: Regularly monitor pool utilization and performance

## 🚨 Troubleshooting

### Common Issues

#### High Connection Pool Utilization (>90%)

```bash
# Check current pool status
curl http://localhost:3001/api/health/database

# Recommended actions:
# 1. Increase pool size
# 2. Optimize slow queries
# 3. Implement query result caching
```

#### Connection Timeouts

```bash
# Check connection configuration
# Review acquireTimeoutMs setting
# Monitor for connection leaks

# Debug connection issues
DATABASE_LOG_LEVEL=debug npm start
```

#### Memory Leaks

```bash
# Monitor connection pool over time
# Check for unclosed connections
# Review application connection patterns
```

### Performance Tuning

#### Database Server Settings

```sql
-- PostgreSQL recommended settings for connection pooling
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

#### Application Settings

```bash
# Optimize for high-throughput scenarios
DATABASE_CONNECTION_LIMIT=100
DATABASE_IDLE_TIMEOUT=10000
DATABASE_MAX_LIFETIME=600000

# Optimize for low-latency scenarios
DATABASE_CONNECTION_LIMIT=20
DATABASE_IDLE_TIMEOUT=5000
DATABASE_ACQUIRE_TIMEOUT=5000
```

## 📈 Metrics Dashboard

For production deployments, consider integrating with monitoring tools:

- **Prometheus**: Expose metrics via `/metrics` endpoint
- **Grafana**: Create dashboards for visualization
- **DataDog**: Use application performance monitoring
- **New Relic**: Database monitoring and alerting

### Sample Prometheus Metrics

```
# Connection pool utilization
database_pool_utilization_percent 16.0

# Active connections
database_pool_active_connections 8.0

# Response time
database_response_time_ms 23.0

# Error rate
database_error_rate_per_minute 0.0
```

## 🔒 Security Considerations

### Production Security

1. **SSL/TLS**: Always use encrypted connections in production
2. **Authentication**: Use strong database credentials
3. **Network Security**: Restrict database access to application servers
4. **Connection Limits**: Set appropriate connection limits to prevent DoS
5. **Monitoring**: Monitor for unusual connection patterns

### Environment Variables

Ensure sensitive configuration is properly secured:

```bash
# Use secrets management in production
DATABASE_URL="${DATABASE_URL_SECRET}"
DATABASE_PASSWORD="${DATABASE_PASSWORD_SECRET}"

# Enable SSL verification
DATABASE_SSL_MODE=require
DATABASE_SSL_REJECT_UNAUTHORIZED=true
```

This connection pooling setup provides a robust, scalable, and maintainable database layer for the Portfolio Assistant application.
