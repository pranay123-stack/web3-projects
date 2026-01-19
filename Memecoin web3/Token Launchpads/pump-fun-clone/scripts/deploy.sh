#!/bin/bash

# ===========================================
# Pump.fun Clone - Deployment Script
# ===========================================
# Production deployment script with health checks and rollback capability

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
ENV_FILE="$PROJECT_DIR/.env"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$PROJECT_DIR/logs/deploy.log"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=10

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
    esac

    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Create required directories
setup_directories() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$PROJECT_DIR/logs"
    mkdir -p "$PROJECT_DIR/nginx/ssl"
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log "ERROR" "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log "ERROR" "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    # Check .env file
    if [ ! -f "$ENV_FILE" ]; then
        log "ERROR" ".env file not found. Please run setup.sh first or copy .env.example to .env"
        exit 1
    fi

    # Validate required environment variables
    source "$ENV_FILE"

    local required_vars=("JWT_SECRET" "MONGO_ROOT_PASSWORD" "REDIS_PASSWORD" "SOLANA_RPC_URL" "PROGRAM_ID")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log "ERROR" "Required environment variable $var is not set in .env"
            exit 1
        fi
    done

    log "SUCCESS" "All prerequisites met"
}

# Backup current deployment
backup_deployment() {
    log "INFO" "Creating backup..."

    local backup_name="backup_$(date '+%Y%m%d_%H%M%S')"
    local backup_path="$BACKUP_DIR/$backup_name"

    mkdir -p "$backup_path"

    # Backup MongoDB data
    if docker ps --format '{{.Names}}' | grep -q "pumpfun_mongodb"; then
        log "INFO" "Backing up MongoDB..."
        docker exec pumpfun_mongodb mongodump --archive --gzip > "$backup_path/mongodb_backup.gz" 2>/dev/null || true
    fi

    # Save current image tags
    docker-compose -f "$COMPOSE_FILE" config > "$backup_path/docker-compose-resolved.yml" 2>/dev/null || true

    # Copy .env
    cp "$ENV_FILE" "$backup_path/.env.backup"

    log "SUCCESS" "Backup created at $backup_path"
    echo "$backup_name" > "$PROJECT_DIR/.last_backup"
}

# Pull latest images and rebuild
build_images() {
    log "INFO" "Building Docker images..."

    cd "$PROJECT_DIR"

    # Pull base images
    docker-compose -f "$COMPOSE_FILE" pull mongodb redis 2>/dev/null || docker compose -f "$COMPOSE_FILE" pull mongodb redis

    # Build application images
    docker-compose -f "$COMPOSE_FILE" build --no-cache 2>/dev/null || docker compose -f "$COMPOSE_FILE" build --no-cache

    log "SUCCESS" "Docker images built successfully"
}

# Stop current services
stop_services() {
    log "INFO" "Stopping current services..."

    cd "$PROJECT_DIR"
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || docker compose -f "$COMPOSE_FILE" down --remove-orphans || true

    log "SUCCESS" "Services stopped"
}

# Start services
start_services() {
    log "INFO" "Starting services..."

    cd "$PROJECT_DIR"
    docker-compose -f "$COMPOSE_FILE" up -d 2>/dev/null || docker compose -f "$COMPOSE_FILE" up -d

    log "SUCCESS" "Services started"
}

# Health check
health_check() {
    log "INFO" "Running health checks..."

    local retries=0
    local all_healthy=false

    while [ $retries -lt $HEALTH_CHECK_RETRIES ]; do
        sleep $HEALTH_CHECK_INTERVAL

        # Check MongoDB
        if ! docker exec pumpfun_mongodb mongosh --eval "db.adminCommand('ping')" &>/dev/null; then
            log "WARNING" "MongoDB health check failed (attempt $((retries + 1))/$HEALTH_CHECK_RETRIES)"
            retries=$((retries + 1))
            continue
        fi

        # Check Redis
        if ! docker exec pumpfun_redis redis-cli ping &>/dev/null; then
            log "WARNING" "Redis health check failed (attempt $((retries + 1))/$HEALTH_CHECK_RETRIES)"
            retries=$((retries + 1))
            continue
        fi

        # Check Backend
        if ! docker exec pumpfun_backend wget -q --spider http://localhost:3001/health 2>/dev/null; then
            log "WARNING" "Backend health check failed (attempt $((retries + 1))/$HEALTH_CHECK_RETRIES)"
            retries=$((retries + 1))
            continue
        fi

        # Check Frontend
        if ! docker exec pumpfun_frontend wget -q --spider http://localhost:3000 2>/dev/null; then
            log "WARNING" "Frontend health check failed (attempt $((retries + 1))/$HEALTH_CHECK_RETRIES)"
            retries=$((retries + 1))
            continue
        fi

        # Check Nginx
        if ! curl -s -o /dev/null -w "%{http_code}" http://localhost/nginx-health | grep -q "200"; then
            log "WARNING" "Nginx health check failed (attempt $((retries + 1))/$HEALTH_CHECK_RETRIES)"
            retries=$((retries + 1))
            continue
        fi

        all_healthy=true
        break
    done

    if [ "$all_healthy" = true ]; then
        log "SUCCESS" "All services are healthy"
        return 0
    else
        log "ERROR" "Health checks failed after $HEALTH_CHECK_RETRIES attempts"
        return 1
    fi
}

# Rollback to previous deployment
rollback() {
    log "WARNING" "Initiating rollback..."

    if [ ! -f "$PROJECT_DIR/.last_backup" ]; then
        log "ERROR" "No backup found for rollback"
        exit 1
    fi

    local last_backup=$(cat "$PROJECT_DIR/.last_backup")
    local backup_path="$BACKUP_DIR/$last_backup"

    if [ ! -d "$backup_path" ]; then
        log "ERROR" "Backup directory not found: $backup_path"
        exit 1
    fi

    # Restore .env
    if [ -f "$backup_path/.env.backup" ]; then
        cp "$backup_path/.env.backup" "$ENV_FILE"
    fi

    # Restart services
    stop_services
    start_services

    # Restore MongoDB data
    if [ -f "$backup_path/mongodb_backup.gz" ]; then
        log "INFO" "Restoring MongoDB data..."
        sleep 30  # Wait for MongoDB to be ready
        docker exec -i pumpfun_mongodb mongorestore --archive --gzip < "$backup_path/mongodb_backup.gz" || true
    fi

    log "SUCCESS" "Rollback completed"
}

# Show deployment status
show_status() {
    log "INFO" "Deployment Status:"
    echo ""
    docker-compose -f "$COMPOSE_FILE" ps 2>/dev/null || docker compose -f "$COMPOSE_FILE" ps
    echo ""
    log "INFO" "Container Logs (last 20 lines each):"

    for container in pumpfun_mongodb pumpfun_redis pumpfun_backend pumpfun_frontend pumpfun_nginx; do
        echo ""
        echo "=== $container ==="
        docker logs --tail 20 "$container" 2>/dev/null || echo "Container not running"
    done
}

# Clean up old resources
cleanup() {
    log "INFO" "Cleaning up old resources..."

    # Remove unused images
    docker image prune -f

    # Remove unused volumes (be careful!)
    # docker volume prune -f

    # Keep only last 5 backups
    cd "$BACKUP_DIR"
    ls -t | tail -n +6 | xargs -r rm -rf

    log "SUCCESS" "Cleanup completed"
}

# Main deployment function
deploy() {
    log "INFO" "Starting deployment..."

    setup_directories
    check_prerequisites
    backup_deployment
    build_images
    stop_services
    start_services

    if health_check; then
        log "SUCCESS" "Deployment completed successfully!"
        cleanup
    else
        log "ERROR" "Deployment failed! Initiating rollback..."
        rollback
        exit 1
    fi
}

# Show usage
usage() {
    echo "Usage: $0 {deploy|rollback|status|health|cleanup|build|start|stop}"
    echo ""
    echo "Commands:"
    echo "  deploy   - Full deployment with backup and health checks"
    echo "  rollback - Rollback to previous deployment"
    echo "  status   - Show current deployment status"
    echo "  health   - Run health checks"
    echo "  cleanup  - Clean up old resources"
    echo "  build    - Build Docker images only"
    echo "  start    - Start services only"
    echo "  stop     - Stop services only"
}

# Main
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    rollback)
        rollback
        ;;
    status)
        show_status
        ;;
    health)
        health_check
        ;;
    cleanup)
        cleanup
        ;;
    build)
        check_prerequisites
        build_images
        ;;
    start)
        check_prerequisites
        start_services
        health_check
        ;;
    stop)
        stop_services
        ;;
    *)
        usage
        exit 1
        ;;
esac
