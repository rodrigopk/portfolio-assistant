# Database Package - Migration Workflow

This package contains the shared database schema, migrations, and configuration for the Portfolio Assistant application.

## 🚀 Quick Start

### Local Development Setup

1. **Start local database services:**

   ```bash
   npm run docker:up
   ```

2. **Run initial migration:**

   ```bash
   npm run db:migrate
   ```

3. **Seed the database (optional):**
   ```bash
   npm run db:seed
   ```

### Environment Configuration

The package supports multiple environments with specific configurations:

- **Development**: `env/.env.development`
- **Staging**: `env/.env.staging`
- **Production**: `env/.env.production`

## 📋 Migration Commands

### Development

```bash
# Create and apply a new migration
npm run db:migrate

# Reset database (⚠️ destroys all data)
npm run db:reset

# Check migration status
npm run db:migrate:status

# Generate Prisma client
npm run db:generate
```

### Staging

```bash
# Deploy migrations to staging
npm run db:migrate:staging

# Dry run (see what would be migrated)
npm run db:migrate:staging -- --dry-run
```

### Production

```bash
# Deploy migrations to production (with backup)
npm run db:migrate:prod

# Dry run production migration
npm run db:migrate:dry-run

# Force migration (skip checks)
npm run db:migrate:prod -- --force

# Skip backup
npm run db:migrate:prod -- --no-backup
```

## 🔧 Production Migration Workflow

### Automated (GitHub Actions)

1. **Push to main branch** - Triggers automatic dry-run migration on staging
2. **Manual deployment** - Use GitHub Actions workflow dispatch for production

### Manual Production Migration

1. **Backup current database:**

   ```bash
   ./scripts/migrate-production.sh --dry-run
   ```

2. **Review migration plan:**

   ```bash
   npx prisma migrate diff --from-url $CURRENT_DB --to-schema-datamodel prisma/schema.prisma
   ```

3. **Deploy migration:**
   ```bash
   ./scripts/migrate-production.sh --environment production
   ```

## 🏗️ Schema Changes

### Adding a Migration

1. **Modify the Prisma schema** (`prisma/schema.prisma`)
2. **Create migration:**
   ```bash
   npx prisma migrate dev --name descriptive_migration_name
   ```
3. **Test the migration:**
   ```bash
   npm run db:migrate:dry-run
   ```
4. **Commit and push** changes

### Migration Best Practices

- ✅ **Always test migrations** on staging first
- ✅ **Use descriptive names** for migrations
- ✅ **Review generated SQL** before deployment
- ✅ **Backup production** before major schema changes
- ⚠️ **Avoid destructive changes** without careful planning
- ⚠️ **Consider backward compatibility** for rolling deployments

## 🐳 Docker Support

### Local Development

```bash
# Start database services
docker-compose up -d postgres redis

# Run migrations in container
npm run docker:migrate

# Stop services
npm run docker:down
```

### Production Docker Deployment

```bash
# Build migration image
docker build -f Dockerfile.migration -t portfolio-db-migrate .

# Run migration
docker run --env-file .env.production portfolio-db-migrate
```

## 🔒 Security Considerations

### Environment Variables

- ✅ Use strong database passwords
- ✅ Enable SSL in production (`DATABASE_SSL_MODE=require`)
- ✅ Restrict database user permissions
- ✅ Use connection pooling limits

### Migration Security

- ✅ Review all SQL changes before production
- ✅ Backup database before migrations
- ✅ Use read-only users for application connections when possible
- ✅ Monitor migration logs for errors

## 📊 Monitoring and Troubleshooting

### Migration Status

```bash
# Check current migration status
npx prisma migrate status

# View migration history
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma
```

### Common Issues

**Migration fails with "Schema drift detected":**

```bash
# Reset to match production exactly
npx prisma db pull
npx prisma migrate resolve --applied MIGRATION_NAME
```

**Connection issues:**

```bash
# Test database connection
npx prisma db execute --stdin <<< "SELECT 1;"
```

**Performance issues:**

- Check connection pool settings
- Monitor query performance with `PRISMA_LOG_LEVEL=info`
- Use database indices appropriately

## 📈 Performance Optimization

### Connection Pooling

The package includes environment-specific connection pool settings:

- **Development**: 10 connections, 60s idle timeout
- **Staging**: 20 connections, 30s idle timeout
- **Production**: 50 connections, 15s idle timeout

### Query Optimization

- Use appropriate indices (see schema comments)
- Monitor slow queries in production
- Consider read replicas for read-heavy workloads

## 🚨 Emergency Procedures

### Rollback Migration

```bash
# 1. Stop application
# 2. Restore from backup
pg_restore -h HOST -U USER -d DATABASE backup_file.sql

# 3. Reset migration state
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

### Database Recovery

```bash
# Check database integrity
psql -c "SELECT pg_size_pretty(pg_database_size('portfolio_prod'));"

# Vacuum and analyze
psql -c "VACUUM ANALYZE;"
```

## 📞 Support

For migration issues or questions:

1. Check logs in GitHub Actions workflows
2. Review migration artifacts in failed runs
3. Create issue with `database` and `migration` labels
