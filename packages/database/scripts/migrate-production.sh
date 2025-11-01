#!/bin/bash

# Production Migration Script for Portfolio Assistant
# This script handles database migrations in production environments

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set"
    exit 1
fi

# Parse command line arguments
DRY_RUN=false
FORCE=false
BACKUP=true
ENVIRONMENT="production"

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --no-backup)
            BACKUP=false
            shift
            ;;
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run       Show what would be migrated without applying changes"
            echo "  --force         Force migration even if there are pending changes"
            echo "  --no-backup     Skip database backup before migration"
            echo "  --environment   Set environment name (default: production)"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_info "Starting database migration for environment: $ENVIRONMENT"

# Check Prisma CLI availability
if ! command -v prisma &> /dev/null; then
    print_error "Prisma CLI not found. Please install it globally or run via npx"
    exit 1
fi

# Function to create backup
create_backup() {
    if [ "$BACKUP" = true ]; then
        print_info "Creating database backup..."
        
        # Extract database connection details
        DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:/]+):?([0-9]*)?/(.+)"
        if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
            DB_USER="${BASH_REMATCH[1]}"
            DB_PASS="${BASH_REMATCH[2]}"
            DB_HOST="${BASH_REMATCH[3]}"
            DB_PORT="${BASH_REMATCH[4]:-5432}"
            DB_NAME="${BASH_REMATCH[5]}"
        else
            print_error "Could not parse DATABASE_URL"
            exit 1
        fi
        
        # Create backup filename with timestamp
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        BACKUP_FILE="backup_${ENVIRONMENT}_${TIMESTAMP}.sql"
        
        print_info "Creating backup: $BACKUP_FILE"
        
        # Use pg_dump to create backup
        PGPASSWORD="$DB_PASS" pg_dump \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --no-owner \
            --no-privileges \
            --verbose \
            -f "$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            print_success "Backup created successfully: $BACKUP_FILE"
        else
            print_error "Backup failed"
            exit 1
        fi
    else
        print_warning "Skipping backup as requested"
    fi
}

# Function to check migration status
check_migration_status() {
    print_info "Checking current migration status..."
    
    if [ "$DRY_RUN" = true ]; then
        print_info "DRY RUN: Would check migration status"
        return 0
    fi
    
    # Check if there are any pending migrations
    if npx prisma migrate status --schema=./prisma/schema.prisma; then
        print_success "Migration status check completed"
    else
        print_warning "There might be pending migrations or schema drift"
        if [ "$FORCE" = false ]; then
            print_error "Use --force to proceed despite migration issues"
            exit 1
        fi
    fi
}

# Function to run migrations
run_migrations() {
    print_info "Applying database migrations..."
    
    if [ "$DRY_RUN" = true ]; then
        print_info "DRY RUN: Would apply migrations with: npx prisma migrate deploy"
        return 0
    fi
    
    # Run migration deploy (production-safe)
    if npx prisma migrate deploy --schema=./prisma/schema.prisma; then
        print_success "Migrations applied successfully"
    else
        print_error "Migration failed"
        exit 1
    fi
}

# Function to generate Prisma client
generate_client() {
    print_info "Generating Prisma client..."
    
    if [ "$DRY_RUN" = true ]; then
        print_info "DRY RUN: Would generate Prisma client"
        return 0
    fi
    
    if npx prisma generate --schema=./prisma/schema.prisma; then
        print_success "Prisma client generated successfully"
    else
        print_error "Prisma client generation failed"
        exit 1
    fi
}

# Function to verify database connection
verify_connection() {
    print_info "Verifying database connection..."
    
    if [ "$DRY_RUN" = true ]; then
        print_info "DRY RUN: Would verify database connection"
        return 0
    fi
    
    # Simple connection test using Prisma
    if npx prisma db execute --schema=./prisma/schema.prisma --stdin <<< "SELECT 1;"; then
        print_success "Database connection verified"
    else
        print_error "Database connection failed"
        exit 1
    fi
}

# Main execution flow
main() {
    print_info "=== Production Database Migration Started ==="
    print_info "Environment: $ENVIRONMENT"
    print_info "Dry Run: $DRY_RUN"
    print_info "Force: $FORCE"
    print_info "Backup: $BACKUP"
    echo ""
    
    # Step 1: Verify database connection
    verify_connection
    
    # Step 2: Create backup
    create_backup
    
    # Step 3: Check migration status
    check_migration_status
    
    # Step 4: Generate client first (in case of schema changes)
    generate_client
    
    # Step 5: Run migrations
    run_migrations
    
    # Step 6: Final verification
    verify_connection
    
    print_success "=== Migration completed successfully ==="
    
    if [ "$DRY_RUN" = true ]; then
        print_info "This was a dry run. No changes were made to the database."
    fi
}

# Run main function
main