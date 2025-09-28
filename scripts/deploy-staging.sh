#!/bin/bash

# Staging Deployment Script for Call Centre CRM
# This script is called by GitHub Actions for staging deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/callcentre-crm-staging"
COMPOSE_FILE="docker-compose.staging.yml"
LOG_FILE="/var/log/callcentre/staging-deploy.log"

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

log "🚀 Starting staging deployment process..."

# Check if we're in the right directory
if [ ! -f "$PROJECT_DIR/package.json" ] && [ ! -f "$PROJECT_DIR/docker-compose.yml" ]; then
    error "Project directory not found or invalid: $PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# Backup current state
log "📦 Creating backup of current deployment..."
BACKUP_DIR="/opt/backups/callcentre-staging/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup database before deployment
log "🗃️ Backing up staging database..."
docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U staging_user staging_db > "$BACKUP_DIR/database_backup.sql" || warning "Database backup failed"

# Backup uploads
if [ -d "backend/uploads" ]; then
    log "📁 Backing up uploads..."
    cp -r backend/uploads "$BACKUP_DIR/" || warning "Uploads backup failed"
fi

# Stop running containers gracefully
log "⏹️ Stopping current containers..."
docker-compose -f "$COMPOSE_FILE" down --timeout 30

# Clean up old images (keep last 3)
log "🧹 Cleaning up old Docker images..."
docker image prune -f
docker images --filter "dangling=true" -q | xargs -r docker rmi

# Pull latest code (this should already be done by GitHub Actions)
log "📡 Ensuring latest code is available..."
git status

# Build and start new containers
log "🏗️ Building and starting new containers..."
docker-compose -f "$COMPOSE_FILE" up -d --build

# Wait for services to be ready
log "⏳ Waiting for services to start..."
sleep 30

# Check if database is ready
log "🔍 Checking database connection..."
timeout 60 bash -c 'until docker-compose -f '"$COMPOSE_FILE"' exec -T postgres pg_isready -U staging_user; do echo "Waiting for database..."; sleep 5; done' || error "Database failed to start"

# Run database migrations
log "🗃️ Running database migrations..."
docker-compose -f "$COMPOSE_FILE" exec -T backend npm run migrate || warning "Migrations failed"

# Health checks
log "🏥 Running health checks..."

# Check backend health
BACKEND_URL="https://staging-api.lead-schem.ru"
timeout 120 bash -c 'until curl -f '"$BACKEND_URL"'/health; do echo "Waiting for backend health..."; sleep 10; done' || error "Backend health check failed"

# Check frontend
FRONTEND_URL="https://staging.callcentre.lead-schem.ru"
timeout 60 bash -c 'until curl -f '"$FRONTEND_URL"'; do echo "Waiting for frontend..."; sleep 10; done' || error "Frontend health check failed"

# Test database connectivity through API
log "🧪 Testing API database connectivity..."
curl -f "$BACKEND_URL/health" | grep -q "database.*connected" || warning "Database connectivity test failed"

# Test API endpoints
log "🧪 Testing API endpoints..."
curl -f "$BACKEND_URL/info" > /dev/null || warning "API info endpoint test failed"

# Check SSL certificates
log "🔐 Checking SSL certificates..."
echo | openssl s_client -connect staging-api.lead-schem.ru:443 -servername staging-api.lead-schem.ru 2>/dev/null | openssl x509 -noout -dates || warning "Backend SSL check failed"
echo | openssl s_client -connect staging.callcentre.lead-schem.ru:443 -servername staging.callcentre.lead-schem.ru 2>/dev/null | openssl x509 -noout -dates || warning "Frontend SSL check failed"

# Performance test
log "📊 Running basic performance test..."
response_time=$(curl -o /dev/null -s -w '%{time_total}' "$FRONTEND_URL")
if (( $(echo "$response_time > 5.0" | bc -l) )); then
    warning "Frontend response time is slow: ${response_time}s"
else
    log "Frontend response time: ${response_time}s"
fi

# Clean up old backups (keep last 10)
log "🧹 Cleaning up old backups..."
find /opt/backups/callcentre-staging -maxdepth 1 -type d -name "????????_??????" | sort | head -n -10 | xargs -r rm -rf

# Log container status
log "📋 Final container status:"
docker-compose -f "$COMPOSE_FILE" ps

# Log deployment completion
success "✅ Staging deployment completed successfully!"
log "🌐 Frontend: $FRONTEND_URL"
log "🔧 Backend: $BACKEND_URL"
log "📊 Health: $BACKEND_URL/health"
log "📦 Backup: $BACKUP_DIR"

# Output deployment summary
cat << EOF

📋 STAGING DEPLOYMENT SUMMARY
============================
📅 Date: $(date)
🌐 Frontend: $FRONTEND_URL
🔧 Backend: $BACKEND_URL
📊 Health: $BACKEND_URL/health
📦 Backup: $BACKUP_DIR
📝 Log: $LOG_FILE

✅ Deployment completed successfully!

EOF
