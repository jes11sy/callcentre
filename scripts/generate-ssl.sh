#!/bin/bash

# SSL Certificate Generation Script for Call Centre CRM
# This script generates self-signed certificates for development or prepares for production certificates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${1:-"localhost"}
SSL_DIR="./ssl"
CERT_DIR="/etc/ssl/certs/callcentre"
DAYS=365

echo -e "${BLUE}🔐 Call Centre CRM SSL Certificate Generator${NC}"
echo -e "${BLUE}=============================================${NC}"

# Create SSL directory
mkdir -p "$SSL_DIR"

# Function to generate self-signed certificate
generate_self_signed() {
    echo -e "${YELLOW}📝 Generating self-signed certificate for $DOMAIN...${NC}"
    
    # Generate private key
    openssl genrsa -out "$SSL_DIR/private.key" 2048
    
    # Generate certificate signing request
    openssl req -new -key "$SSL_DIR/private.key" -out "$SSL_DIR/cert.csr" \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=Call Centre CRM/OU=IT Department/CN=$DOMAIN"
    
    # Generate self-signed certificate
    openssl x509 -req -in "$SSL_DIR/cert.csr" -signkey "$SSL_DIR/private.key" \
        -out "$SSL_DIR/certificate.crt" -days $DAYS \
        -extensions v3_req -extfile <(
        echo '[v3_req]'
        echo 'basicConstraints = CA:FALSE'
        echo 'keyUsage = nonRepudiation, digitalSignature, keyEncipherment'
        echo 'subjectAltName = @alt_names'
        echo '[alt_names]'
        echo "DNS.1 = $DOMAIN"
        echo 'DNS.2 = localhost'
        echo 'IP.1 = 127.0.0.1'
        echo 'IP.2 = ::1'
    )
    
    # Clean up CSR file
    rm "$SSL_DIR/cert.csr"
    
    echo -e "${GREEN}✅ Self-signed certificate generated successfully!${NC}"
}

# Function to prepare for Let's Encrypt
prepare_letsencrypt() {
    echo -e "${YELLOW}📝 Preparing for Let's Encrypt certificate...${NC}"
    
    # Create directory structure
    mkdir -p "$SSL_DIR"
    
    # Create placeholder files
    touch "$SSL_DIR/certificate.crt"
    touch "$SSL_DIR/private.key"
    touch "$SSL_DIR/ca_bundle.crt"
    
    echo -e "${BLUE}📋 To obtain Let's Encrypt certificate, run:${NC}"
    echo -e "${GREEN}sudo certbot certonly --standalone -d $DOMAIN${NC}"
    echo -e "${GREEN}sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/certificate.crt${NC}"
    echo -e "${GREEN}sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/private.key${NC}"
    echo -e "${GREEN}sudo cp /etc/letsencrypt/live/$DOMAIN/chain.pem $SSL_DIR/ca_bundle.crt${NC}"
}

# Function to set permissions
set_permissions() {
    echo -e "${YELLOW}🔒 Setting secure permissions...${NC}"
    
    # Set ownership and permissions
    chmod 600 "$SSL_DIR/private.key" 2>/dev/null || true
    chmod 644 "$SSL_DIR/certificate.crt" 2>/dev/null || true
    chmod 644 "$SSL_DIR/ca_bundle.crt" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Permissions set successfully!${NC}"
}

# Function to validate certificates
validate_certificates() {
    echo -e "${YELLOW}🔍 Validating certificates...${NC}"
    
    if [[ -f "$SSL_DIR/certificate.crt" && -f "$SSL_DIR/private.key" ]]; then
        # Check if certificate and key match
        cert_modulus=$(openssl x509 -noout -modulus -in "$SSL_DIR/certificate.crt" | openssl md5)
        key_modulus=$(openssl rsa -noout -modulus -in "$SSL_DIR/private.key" | openssl md5)
        
        if [[ "$cert_modulus" == "$key_modulus" ]]; then
            echo -e "${GREEN}✅ Certificate and private key match!${NC}"
            
            # Display certificate info
            echo -e "${BLUE}📋 Certificate Information:${NC}"
            openssl x509 -in "$SSL_DIR/certificate.crt" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After :|DNS:|IP Address:)"
        else
            echo -e "${RED}❌ Certificate and private key do not match!${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Certificate files not found!${NC}"
        exit 1
    fi
}

# Function to create environment file
create_env_file() {
    echo -e "${YELLOW}📝 Creating SSL environment configuration...${NC}"
    
    cat > "$SSL_DIR/ssl.env" << EOF
# SSL Configuration for Call Centre CRM
SSL_ENABLED=true
SSL_CERT_DIR=$SSL_DIR
HTTPS_PORT=443
HTTP_PORT=80

# For Docker deployment
NGINX_SSL_CERT=/etc/ssl/certs/callcentre/certificate.crt
NGINX_SSL_KEY=/etc/ssl/certs/callcentre/private.key
NGINX_SSL_CA=/etc/ssl/certs/callcentre/ca_bundle.crt
EOF
    
    echo -e "${GREEN}✅ SSL environment file created: $SSL_DIR/ssl.env${NC}"
}

# Main menu
echo -e "${BLUE}Select certificate type:${NC}"
echo "1) Self-signed certificate (for development/testing)"
echo "2) Prepare for Let's Encrypt certificate (for production)"
echo "3) Validate existing certificates"
echo "4) Exit"

read -p "Enter your choice [1-4]: " choice

case $choice in
    1)
        generate_self_signed
        set_permissions
        validate_certificates
        create_env_file
        ;;
    2)
        prepare_letsencrypt
        set_permissions
        create_env_file
        ;;
    3)
        validate_certificates
        ;;
    4)
        echo -e "${BLUE}👋 Exiting...${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Please select 1-4.${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 SSL setup completed!${NC}"
echo -e "${BLUE}📁 Certificate files are located in: $SSL_DIR${NC}"
echo -e "${YELLOW}⚠️  Remember to update your .env file with SSL settings!${NC}"

# Final instructions
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Copy SSL files to production server"
echo "2. Update .env file with SSL_ENABLED=true"
echo "3. Restart the application"
echo "4. Test HTTPS connection"

if [[ "$choice" == "1" ]]; then
    echo -e "${YELLOW}⚠️  Note: Self-signed certificates will show security warnings in browsers.${NC}"
    echo -e "${YELLOW}   For production, use Let's Encrypt or purchase a commercial certificate.${NC}"
fi
