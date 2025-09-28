#!/bin/bash

# GitHub Secrets Setup Script for Call Centre CRM
# This script helps to add all required secrets to GitHub repository

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME=""
DRY_RUN=false

# Function to display usage
usage() {
    echo -e "${BLUE}GitHub Secrets Setup Script${NC}"
    echo -e "${BLUE}=============================${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -r, --repo REPO       Repository name (e.g., username/repo-name)"
    echo "  -d, --dry-run         Show what would be done without making changes"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --repo myuser/callcentre_crm"
    echo "  $0 --repo myuser/callcentre_crm --dry-run"
}

# Function to log messages
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Function to check if gh CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI (gh) is not installed. Please install it first: https://cli.github.com/"
    fi
    
    if ! gh auth status &> /dev/null; then
        error "GitHub CLI is not authenticated. Please run 'gh auth login' first."
    fi
    
    success "GitHub CLI is installed and authenticated"
}

# Function to add a secret
add_secret() {
    local name=$1
    local description=$2
    
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would add secret '$name' - $description"
        return
    fi
    
    echo -e "${YELLOW}Adding secret: $name${NC}"
    echo -e "${BLUE}Description: $description${NC}"
    echo -n "Enter value for $name: "
    
    # Hide input for sensitive data
    read -s value
    echo ""
    
    if [ -z "$value" ]; then
        warning "Empty value provided for $name, skipping..."
        return
    fi
    
    if gh secret set "$name" --body "$value" --repo "$REPO_NAME"; then
        success "Successfully added secret: $name"
    else
        error "Failed to add secret: $name"
    fi
}

# Function to add secret from file
add_secret_from_file() {
    local name=$1
    local description=$2
    local file_hint=$3
    
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would add secret '$name' from file - $description"
        return
    fi
    
    echo -e "${YELLOW}Adding secret from file: $name${NC}"
    echo -e "${BLUE}Description: $description${NC}"
    echo -e "${BLUE}Hint: $file_hint${NC}"
    echo -n "Enter file path for $name: "
    
    read file_path
    
    if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
        warning "File not found: $file_path, skipping $name..."
        return
    fi
    
    if gh secret set "$name" < "$file_path" --repo "$REPO_NAME"; then
        success "Successfully added secret from file: $name"
    else
        error "Failed to add secret from file: $name"
    fi
}

# Function to generate random password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Function to setup production secrets
setup_production_secrets() {
    log "🏭 Setting up Production Secrets"
    echo "================================"
    
    # Database
    add_secret "DATABASE_URL" "PostgreSQL connection string for production"
    add_secret "POSTGRES_USER" "PostgreSQL username for production"
    add_secret "POSTGRES_PASSWORD" "PostgreSQL password for production"
    add_secret "POSTGRES_DB" "PostgreSQL database name for production"
    add_secret "REDIS_URL" "Redis connection string for production"
    
    # JWT
    echo -e "${YELLOW}Generating secure JWT secret...${NC}"
    JWT_SECRET=$(generate_password 48)
    if [ "$DRY_RUN" = false ]; then
        echo "$JWT_SECRET" | gh secret set "JWT_SECRET" --repo "$REPO_NAME"
        success "Generated and added JWT_SECRET"
    fi
    
    # Mango Office
    add_secret "MANGO_OFFICE_API_KEY" "Mango Office API key for production"
    add_secret "MANGO_OFFICE_API_SALT" "Mango Office API salt for production"
    add_secret "MANGO_API_KEY" "Mango API key for production"
    add_secret "MANGO_API_ID" "Mango API ID for production"
    
    # Avito
    add_secret "AVITO_CLIENT_ID" "Avito API client ID for production"
    add_secret "AVITO_CLIENT_SECRET" "Avito API client secret for production"
    
    # Bot Integration
    add_secret "BOT_WEBHOOK_URL" "Bot webhook URL for production"
    add_secret "WEBHOOK_TOKEN" "Webhook token for production"
    
    # Server Access
    add_secret "PRODUCTION_HOST" "Production server IP address or hostname"
    add_secret "PRODUCTION_USERNAME" "SSH username for production server"
    add_secret_from_file "PRODUCTION_SSH_KEY" "SSH private key for production server" "Path to your private SSH key file (e.g., ~/.ssh/id_rsa)"
    add_secret "PRODUCTION_SSH_PORT" "SSH port for production server (default: 22)"
}

# Function to setup staging secrets
setup_staging_secrets() {
    log "🧪 Setting up Staging Secrets"
    echo "============================="
    
    # Staging Database
    add_secret "STAGING_DATABASE_URL" "PostgreSQL connection string for staging"
    add_secret "STAGING_POSTGRES_USER" "PostgreSQL username for staging"
    add_secret "STAGING_POSTGRES_PASSWORD" "PostgreSQL password for staging"
    add_secret "STAGING_POSTGRES_DB" "PostgreSQL database name for staging"
    add_secret "STAGING_REDIS_URL" "Redis connection string for staging"
    add_secret "STAGING_REDIS_PASSWORD" "Redis password for staging"
    
    # Staging JWT
    echo -e "${YELLOW}Generating staging JWT secret...${NC}"
    STAGING_JWT_SECRET=$(generate_password 48)
    if [ "$DRY_RUN" = false ]; then
        echo "$STAGING_JWT_SECRET" | gh secret set "STAGING_JWT_SECRET" --repo "$REPO_NAME"
        success "Generated and added STAGING_JWT_SECRET"
    fi
    
    # Staging Mango Office
    add_secret "STAGING_MANGO_OFFICE_API_KEY" "Mango Office API key for staging"
    add_secret "STAGING_MANGO_OFFICE_API_SALT" "Mango Office API salt for staging"
    add_secret "STAGING_MANGO_API_KEY" "Mango API key for staging"
    add_secret "STAGING_MANGO_API_ID" "Mango API ID for staging"
    
    # Staging Avito
    add_secret "STAGING_AVITO_CLIENT_ID" "Avito API client ID for staging"
    add_secret "STAGING_AVITO_CLIENT_SECRET" "Avito API client secret for staging"
    
    # Staging Server
    add_secret "STAGING_HOST" "Staging server IP address or hostname"
    add_secret "STAGING_USERNAME" "SSH username for staging server"
    add_secret_from_file "STAGING_SSH_KEY" "SSH private key for staging server" "Path to your staging SSH key file"
    add_secret "STAGING_SSH_PORT" "SSH port for staging server (default: 22)"
}

# Function to setup notification secrets
setup_notification_secrets() {
    log "📧 Setting up Notification Secrets"
    echo "=================================="
    
    add_secret "TELEGRAM_BOT_TOKEN" "Telegram bot token for deployment notifications"
    add_secret "TELEGRAM_CHAT_ID" "Telegram chat ID for deployment notifications"
    add_secret "SNYK_TOKEN" "Snyk API token for security scanning (optional)"
}

# Function to list all secrets
list_secrets() {
    log "📋 Listing all repository secrets"
    
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would list secrets for repository: $REPO_NAME"
        return
    fi
    
    if gh secret list --repo "$REPO_NAME"; then
        success "Successfully listed secrets"
    else
        error "Failed to list secrets"
    fi
}

# Function to verify secrets
verify_secrets() {
    log "🔍 Verifying required secrets"
    
    local required_secrets=(
        "DATABASE_URL"
        "JWT_SECRET"
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
        "PRODUCTION_HOST"
        "PRODUCTION_SSH_KEY"
    )
    
    local missing_secrets=()
    
    for secret in "${required_secrets[@]}"; do
        if [ "$DRY_RUN" = true ]; then
            log "DRY RUN: Would verify secret: $secret"
            continue
        fi
        
        if gh secret list --repo "$REPO_NAME" | grep -q "^$secret"; then
            success "✅ $secret is set"
        else
            error "❌ $secret is missing"
            missing_secrets+=("$secret")
        fi
    done
    
    if [ ${#missing_secrets[@]} -eq 0 ]; then
        success "All required secrets are configured!"
    else
        error "Missing secrets: ${missing_secrets[*]}"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--repo)
            REPO_NAME="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Validate required parameters
if [ -z "$REPO_NAME" ]; then
    error "Repository name is required. Use --repo option."
fi

# Main execution
main() {
    log "🚀 Starting GitHub Secrets Setup for Call Centre CRM"
    echo "====================================================="
    
    if [ "$DRY_RUN" = true ]; then
        warning "DRY RUN MODE: No actual changes will be made"
    fi
    
    log "Repository: $REPO_NAME"
    echo ""
    
    # Check prerequisites
    check_gh_cli
    
    # Setup secrets
    echo ""
    echo "🔧 Choose what to setup:"
    echo "1) Production secrets only"
    echo "2) Staging secrets only"
    echo "3) Notification secrets only"
    echo "4) All secrets"
    echo "5) List existing secrets"
    echo "6) Verify required secrets"
    echo "0) Exit"
    
    read -p "Enter your choice [0-6]: " choice
    
    case $choice in
        1)
            setup_production_secrets
            ;;
        2)
            setup_staging_secrets
            ;;
        3)
            setup_notification_secrets
            ;;
        4)
            setup_production_secrets
            echo ""
            setup_staging_secrets
            echo ""
            setup_notification_secrets
            ;;
        5)
            list_secrets
            ;;
        6)
            verify_secrets
            ;;
        0)
            log "Exiting..."
            exit 0
            ;;
        *)
            error "Invalid choice: $choice"
            ;;
    esac
    
    echo ""
    success "🎉 GitHub Secrets setup completed!"
    
    if [ "$DRY_RUN" = false ]; then
        log "📚 Next steps:"
        echo "1. Verify secrets in GitHub repository settings"
        echo "2. Test GitHub Actions workflow"
        echo "3. Review deployment documentation"
        echo ""
        echo "🔗 Useful links:"
        echo "- Repository secrets: https://github.com/$REPO_NAME/settings/secrets/actions"
        echo "- Actions: https://github.com/$REPO_NAME/actions"
    fi
}

# Run main function
main
