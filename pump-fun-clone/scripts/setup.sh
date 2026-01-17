#!/bin/bash

# ===========================================
# Pump.fun Clone - Initial Setup Script
# ===========================================
# Sets up the development/production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Logging function
log() {
    local level=$1
    shift
    local message="$@"

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
        "STEP")
            echo -e "${CYAN}[STEP]${NC} $message"
            ;;
    esac
}

# Generate random string
generate_secret() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -dc 'a-zA-Z0-9' | head -c $length
}

# Check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Print banner
print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║              Pump.fun Clone - Setup Script                   ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check system requirements
check_requirements() {
    log "STEP" "Checking system requirements..."

    local missing_requirements=()

    # Check Docker
    if ! command_exists docker; then
        missing_requirements+=("Docker")
    else
        log "SUCCESS" "Docker found: $(docker --version)"
    fi

    # Check Docker Compose
    if command_exists docker-compose; then
        log "SUCCESS" "Docker Compose found: $(docker-compose --version)"
    elif docker compose version &>/dev/null; then
        log "SUCCESS" "Docker Compose (plugin) found: $(docker compose version)"
    else
        missing_requirements+=("Docker Compose")
    fi

    # Check Node.js (optional, for local development)
    if command_exists node; then
        log "SUCCESS" "Node.js found: $(node --version)"
    else
        log "WARNING" "Node.js not found (optional for local development)"
    fi

    # Check npm (optional)
    if command_exists npm; then
        log "SUCCESS" "npm found: $(npm --version)"
    else
        log "WARNING" "npm not found (optional for local development)"
    fi

    # Check Git
    if command_exists git; then
        log "SUCCESS" "Git found: $(git --version)"
    else
        log "WARNING" "Git not found (recommended)"
    fi

    # Check OpenSSL
    if command_exists openssl; then
        log "SUCCESS" "OpenSSL found"
    else
        missing_requirements+=("OpenSSL")
    fi

    if [ ${#missing_requirements[@]} -gt 0 ]; then
        log "ERROR" "Missing required tools: ${missing_requirements[*]}"
        log "INFO" "Please install the missing tools and run this script again."
        exit 1
    fi

    log "SUCCESS" "All requirements met!"
}

# Create directory structure
create_directories() {
    log "STEP" "Creating directory structure..."

    local directories=(
        "$PROJECT_DIR/backend/src"
        "$PROJECT_DIR/backend/logs"
        "$PROJECT_DIR/frontend/src"
        "$PROJECT_DIR/nginx/ssl"
        "$PROJECT_DIR/scripts"
        "$PROJECT_DIR/logs"
        "$PROJECT_DIR/backups"
    )

    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        log "INFO" "Created: $dir"
    done

    log "SUCCESS" "Directory structure created!"
}

# Setup environment files
setup_environment() {
    log "STEP" "Setting up environment files..."

    # Generate secrets
    local jwt_secret=$(generate_secret 64)
    local mongo_password=$(generate_secret 32)
    local redis_password=$(generate_secret 32)
    local session_secret=$(generate_secret 32)
    local encryption_key=$(generate_secret 32)

    # Create root .env if it doesn't exist
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        log "INFO" "Creating root .env file..."

        cat > "$PROJECT_DIR/.env" << EOF
# ===========================================
# Pump.fun Clone - Environment Configuration
# Generated on $(date)
# ===========================================

# Environment
NODE_ENV=development

# MongoDB Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=$mongo_password
MONGO_DB_NAME=pumpfun

# Redis Configuration
REDIS_PASSWORD=$redis_password

# JWT Configuration
JWT_SECRET=$jwt_secret
JWT_EXPIRES_IN=7d

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=YourProgramIdHere11111111111111111111111111111

# Frontend Configuration
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_WS_URL=ws://localhost/ws
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=YourProgramIdHere11111111111111111111111111111

# CORS Configuration
CORS_ORIGIN=http://localhost

# Server Ports
HTTP_PORT=80
HTTPS_PORT=443

# Logging
LOG_LEVEL=info
EOF
        log "SUCCESS" "Root .env file created"
    else
        log "WARNING" "Root .env file already exists, skipping..."
    fi

    # Create backend .env if it doesn't exist
    if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
        log "INFO" "Creating backend .env file..."

        cat > "$PROJECT_DIR/backend/.env" << EOF
# ===========================================
# Backend Environment Configuration
# Generated on $(date)
# ===========================================

NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# MongoDB
MONGODB_URI=mongodb://localhost:27017/pumpfun

# Redis
REDIS_URL=redis://localhost:6379
SESSION_SECRET=$session_secret

# JWT
JWT_SECRET=$jwt_secret
JWT_EXPIRES_IN=7d

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=YourProgramIdHere11111111111111111111111111111

# CORS
CORS_ORIGIN=http://localhost:3000

# Security
BCRYPT_SALT_ROUNDS=12
ENCRYPTION_KEY=$encryption_key

# Logging
LOG_LEVEL=debug

# Features
ENABLE_SWAGGER=true
ENABLE_METRICS=true
EOF
        log "SUCCESS" "Backend .env file created"
    else
        log "WARNING" "Backend .env file already exists, skipping..."
    fi

    # Create frontend .env.local if it doesn't exist
    if [ ! -f "$PROJECT_DIR/frontend/.env.local" ]; then
        log "INFO" "Creating frontend .env.local file..."

        cat > "$PROJECT_DIR/frontend/.env.local" << EOF
# ===========================================
# Frontend Environment Configuration
# Generated on $(date)
# ===========================================

NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=YourProgramIdHere11111111111111111111111111111
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# App
NEXT_PUBLIC_APP_NAME=Pump.fun Clone
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_DEBUG_MODE=true
EOF
        log "SUCCESS" "Frontend .env.local file created"
    else
        log "WARNING" "Frontend .env.local file already exists, skipping..."
    fi

    log "SUCCESS" "Environment files setup complete!"
}

# Install dependencies
install_dependencies() {
    log "STEP" "Installing dependencies..."

    # Backend dependencies
    if [ -f "$PROJECT_DIR/backend/package.json" ]; then
        log "INFO" "Installing backend dependencies..."
        cd "$PROJECT_DIR/backend"
        if command_exists yarn; then
            yarn install
        elif command_exists pnpm; then
            pnpm install
        else
            npm install
        fi
        log "SUCCESS" "Backend dependencies installed"
    else
        log "WARNING" "No backend package.json found, skipping..."
    fi

    # Frontend dependencies
    if [ -f "$PROJECT_DIR/frontend/package.json" ]; then
        log "INFO" "Installing frontend dependencies..."
        cd "$PROJECT_DIR/frontend"
        if command_exists yarn; then
            yarn install
        elif command_exists pnpm; then
            pnpm install
        else
            npm install
        fi
        log "SUCCESS" "Frontend dependencies installed"
    else
        log "WARNING" "No frontend package.json found, skipping..."
    fi

    cd "$PROJECT_DIR"
}

# Initialize database
init_database() {
    log "STEP" "Initializing database..."

    # Check if Docker is running
    if ! docker info &>/dev/null; then
        log "WARNING" "Docker is not running. Please start Docker and run database initialization manually."
        return
    fi

    # Start MongoDB container for initialization
    log "INFO" "Starting MongoDB container..."

    cd "$PROJECT_DIR"

    # Start only MongoDB service
    if command_exists docker-compose; then
        docker-compose -f docker-compose.yml up -d mongodb
    else
        docker compose -f docker-compose.yml up -d mongodb
    fi

    # Wait for MongoDB to be ready
    log "INFO" "Waiting for MongoDB to be ready..."
    local retries=0
    local max_retries=30

    while [ $retries -lt $max_retries ]; do
        if docker exec pumpfun_mongodb mongosh --eval "db.adminCommand('ping')" &>/dev/null; then
            break
        fi
        sleep 2
        retries=$((retries + 1))
    done

    if [ $retries -eq $max_retries ]; then
        log "ERROR" "MongoDB failed to start"
        return 1
    fi

    # Create database and collections
    log "INFO" "Creating database schema..."

    source "$PROJECT_DIR/.env"

    docker exec pumpfun_mongodb mongosh \
        --username "$MONGO_ROOT_USERNAME" \
        --password "$MONGO_ROOT_PASSWORD" \
        --authenticationDatabase admin \
        --eval "
            use $MONGO_DB_NAME;

            // Create collections with validation
            db.createCollection('users', {
                validator: {
                    \\\$jsonSchema: {
                        bsonType: 'object',
                        required: ['walletAddress', 'createdAt'],
                        properties: {
                            walletAddress: { bsonType: 'string' },
                            username: { bsonType: 'string' },
                            createdAt: { bsonType: 'date' }
                        }
                    }
                }
            });

            db.createCollection('tokens', {
                validator: {
                    \\\$jsonSchema: {
                        bsonType: 'object',
                        required: ['mintAddress', 'name', 'symbol', 'creator', 'createdAt'],
                        properties: {
                            mintAddress: { bsonType: 'string' },
                            name: { bsonType: 'string' },
                            symbol: { bsonType: 'string' },
                            creator: { bsonType: 'string' },
                            createdAt: { bsonType: 'date' }
                        }
                    }
                }
            });

            db.createCollection('trades');
            db.createCollection('comments');

            // Create indexes
            db.users.createIndex({ walletAddress: 1 }, { unique: true });
            db.users.createIndex({ username: 1 }, { unique: true, sparse: true });
            db.tokens.createIndex({ mintAddress: 1 }, { unique: true });
            db.tokens.createIndex({ creator: 1 });
            db.tokens.createIndex({ createdAt: -1 });
            db.trades.createIndex({ tokenMint: 1, timestamp: -1 });
            db.trades.createIndex({ user: 1, timestamp: -1 });
            db.comments.createIndex({ tokenMint: 1, createdAt: -1 });

            print('Database initialized successfully!');
        " 2>/dev/null || log "WARNING" "Database initialization skipped (may already exist)"

    # Stop MongoDB container (will be started with full deployment)
    log "INFO" "Stopping MongoDB container..."
    if command_exists docker-compose; then
        docker-compose -f docker-compose.yml down
    else
        docker compose -f docker-compose.yml down
    fi

    log "SUCCESS" "Database initialization complete!"
}

# Generate SSL certificates (self-signed for development)
generate_ssl() {
    log "STEP" "Generating SSL certificates (self-signed for development)..."

    local ssl_dir="$PROJECT_DIR/nginx/ssl"

    if [ -f "$ssl_dir/fullchain.pem" ] && [ -f "$ssl_dir/privkey.pem" ]; then
        log "WARNING" "SSL certificates already exist, skipping..."
        return
    fi

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$ssl_dir/privkey.pem" \
        -out "$ssl_dir/fullchain.pem" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
        2>/dev/null

    log "SUCCESS" "Self-signed SSL certificates generated"
    log "WARNING" "For production, replace with certificates from a trusted CA (e.g., Let's Encrypt)"
}

# Setup Git hooks
setup_git_hooks() {
    log "STEP" "Setting up Git hooks..."

    if [ ! -d "$PROJECT_DIR/.git" ]; then
        log "WARNING" "Not a Git repository, skipping Git hooks setup..."
        return
    fi

    local hooks_dir="$PROJECT_DIR/.git/hooks"

    # Pre-commit hook
    cat > "$hooks_dir/pre-commit" << 'EOF'
#!/bin/bash

# Pre-commit hook for Pump.fun Clone

echo "Running pre-commit checks..."

# Check for .env files being committed
if git diff --cached --name-only | grep -E '^\.env$|^backend/\.env$|^frontend/\.env\.local$'; then
    echo "ERROR: Attempting to commit .env files!"
    echo "Please remove sensitive files from staging."
    exit 1
fi

# Run linting if available
if [ -f "backend/package.json" ] && grep -q '"lint"' backend/package.json; then
    cd backend && npm run lint || exit 1
    cd ..
fi

if [ -f "frontend/package.json" ] && grep -q '"lint"' frontend/package.json; then
    cd frontend && npm run lint || exit 1
    cd ..
fi

echo "Pre-commit checks passed!"
EOF

    chmod +x "$hooks_dir/pre-commit"

    log "SUCCESS" "Git hooks setup complete!"
}

# Print next steps
print_next_steps() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    Setup Complete!                           ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo ""
    echo "1. Update your Solana Program ID in the .env files:"
    echo "   - $PROJECT_DIR/.env"
    echo "   - $PROJECT_DIR/backend/.env"
    echo "   - $PROJECT_DIR/frontend/.env.local"
    echo ""
    echo "2. For development, run:"
    echo "   cd $PROJECT_DIR"
    echo "   docker-compose up -d"
    echo ""
    echo "3. For production deployment, run:"
    echo "   ./scripts/deploy.sh deploy"
    echo ""
    echo "4. Access the application:"
    echo "   - Frontend: http://localhost"
    echo "   - Backend API: http://localhost/api"
    echo "   - Health Check: http://localhost/health"
    echo ""
    echo -e "${YELLOW}Important:${NC}"
    echo "- Update PROGRAM_ID with your deployed Solana program"
    echo "- For production, use real SSL certificates"
    echo "- Review and update all security settings"
    echo ""
}

# Main setup function
main() {
    print_banner

    check_requirements
    create_directories
    setup_environment

    # Ask about optional steps
    read -p "Install dependencies (requires Node.js)? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_dependencies
    fi

    read -p "Initialize database (requires Docker)? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        init_database
    fi

    read -p "Generate self-signed SSL certificates? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        generate_ssl
    fi

    read -p "Setup Git hooks? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_git_hooks
    fi

    print_next_steps
}

# Run main function
main "$@"
