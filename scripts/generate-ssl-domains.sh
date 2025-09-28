#!/bin/bash

# SSL Certificate Generation Script for Call Centre CRM Domains
# Generates certificates for apikc.lead-schem.ru and callcentre.lead-schem.ru

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DOMAIN="apikc.lead-schem.ru"
FRONTEND_DOMAIN="callcentre.lead-schem.ru"
SSL_DIR="./ssl"
DAYS=365

echo -e "${BLUE}🔐 Call Centre CRM SSL Certificate Generator${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}Backend Domain: $BACKEND_DOMAIN${NC}"
echo -e "${YELLOW}Frontend Domain: $FRONTEND_DOMAIN${NC}"

# Create SSL directory
mkdir -p "$SSL_DIR"

# Function to generate wildcard certificate for lead-schem.ru
generate_wildcard_certificate() {
    echo -e "${YELLOW}📝 Generating wildcard certificate for *.lead-schem.ru...${NC}"
    
    # Generate private key
    openssl genrsa -out "$SSL_DIR/private.key" 2048
    
    # Generate certificate signing request with SAN
    openssl req -new -key "$SSL_DIR/private.key" -out "$SSL_DIR/cert.csr" \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=Call Centre CRM/OU=IT Department/CN=*.lead-schem.ru" \
        -config <(
        echo '[req]'
        echo 'distinguished_name = req_distinguished_name'
        echo 'req_extensions = v3_req'
        echo 'prompt = no'
        echo '[req_distinguished_name]'
        echo 'C = RU'
        echo 'ST = Moscow'
        echo 'L = Moscow'
        echo 'O = Call Centre CRM'
        echo 'OU = IT Department'
        echo 'CN = *.lead-schem.ru'
        echo '[v3_req]'
        echo 'basicConstraints = CA:FALSE'
        echo 'keyUsage = nonRepudiation, digitalSignature, keyEncipherment'
        echo 'subjectAltName = @alt_names'
        echo '[alt_names]'
        echo 'DNS.1 = *.lead-schem.ru'
        echo 'DNS.2 = lead-schem.ru'
        echo 'DNS.3 = apikc.lead-schem.ru'
        echo 'DNS.4 = callcentre.lead-schem.ru'
        echo 'DNS.5 = localhost'
        echo 'IP.1 = 127.0.0.1'
        echo 'IP.2 = ::1'
    )
    
    # Generate self-signed certificate
    openssl x509 -req -in "$SSL_DIR/cert.csr" -signkey "$SSL_DIR/private.key" \
        -out "$SSL_DIR/certificate.crt" -days $DAYS \
        -extensions v3_req -extfile <(
        echo '[v3_req]'
        echo 'basicConstraints = CA:FALSE'
        echo 'keyUsage = nonRepudiation, digitalSignature, keyEncipherment'
        echo 'subjectAltName = @alt_names'
        echo '[alt_names]'
        echo 'DNS.1 = *.lead-schem.ru'
        echo 'DNS.2 = lead-schem.ru'
        echo 'DNS.3 = apikc.lead-schem.ru'
        echo 'DNS.4 = callcentre.lead-schem.ru'
        echo 'DNS.5 = localhost'
        echo 'IP.1 = 127.0.0.1'
        echo 'IP.2 = ::1'
    )
    
    # Clean up CSR file
    rm "$SSL_DIR/cert.csr"
    
    echo -e "${GREEN}✅ Wildcard certificate generated successfully!${NC}"
}

# Function to prepare for Let's Encrypt
prepare_letsencrypt() {
    echo -e "${YELLOW}📝 Preparing for Let's Encrypt certificates...${NC}"
    
    # Create directory structure
    mkdir -p "$SSL_DIR"
    
    echo -e "${BLUE}📋 To obtain Let's Encrypt certificates, run:${NC}"
    echo -e "${GREEN}# For wildcard certificate (requires DNS validation):${NC}"
    echo -e "${GREEN}sudo certbot certonly --manual --preferred-challenges=dns -d '*.lead-schem.ru' -d 'lead-schem.ru'${NC}"
    echo ""
    echo -e "${GREEN}# Or for individual domains (requires HTTP validation):${NC}"
    echo -e "${GREEN}sudo certbot certonly --standalone -d $BACKEND_DOMAIN -d $FRONTEND_DOMAIN${NC}"
    echo ""
    echo -e "${GREEN}# Then copy certificates:${NC}"
    echo -e "${GREEN}sudo cp /etc/letsencrypt/live/$BACKEND_DOMAIN/fullchain.pem $SSL_DIR/certificate.crt${NC}"
    echo -e "${GREEN}sudo cp /etc/letsencrypt/live/$BACKEND_DOMAIN/privkey.pem $SSL_DIR/private.key${NC}"
    echo -e "${GREEN}sudo cp /etc/letsencrypt/live/$BACKEND_DOMAIN/chain.pem $SSL_DIR/ca_bundle.crt${NC}"
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
            openssl x509 -in "$SSL_DIR/certificate.crt" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After :|DNS:|IP Address:)" || true
            
            # Test domains
            echo -e "${BLUE}📋 Testing domains in certificate:${NC}"
            openssl x509 -in "$SSL_DIR/certificate.crt" -text -noout | grep -A 10 "Subject Alternative Name" || true
        else
            echo -e "${RED}❌ Certificate and private key do not match!${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Certificate files not found!${NC}"
        exit 1
    fi
}

# Function to create domain-specific environment file
create_env_file() {
    echo -e "${YELLOW}📝 Creating domain-specific environment configuration...${NC}"
    
    cat > "$SSL_DIR/domains.env" << EOF
# Domain Configuration for Call Centre CRM
BACKEND_DOMAIN=$BACKEND_DOMAIN
FRONTEND_DOMAIN=$FRONTEND_DOMAIN
FRONTEND_URL=https://$FRONTEND_DOMAIN

# SSL Configuration
SSL_ENABLED=true
SSL_CERT_DIR=$SSL_DIR
HTTPS_PORT=443
HTTP_PORT=80

# Webhook URLs
MANGO_WEBHOOK_URL=https://$BACKEND_DOMAIN/api/webhooks/mango

# API URLs
NEXT_PUBLIC_API_URL=https://$BACKEND_DOMAIN
NEXT_PUBLIC_SOCKET_URL=wss://$BACKEND_DOMAIN
NEXT_PUBLIC_FRONTEND_DOMAIN=$FRONTEND_DOMAIN
NEXT_PUBLIC_BACKEND_DOMAIN=$BACKEND_DOMAIN

# For Docker deployment
NGINX_SSL_CERT=/etc/ssl/certs/callcentre/certificate.crt
NGINX_SSL_KEY=/etc/ssl/certs/callcentre/private.key
NGINX_SSL_CA=/etc/ssl/certs/callcentre/ca_bundle.crt
EOF
    
    echo -e "${GREEN}✅ Domain environment file created: $SSL_DIR/domains.env${NC}"
}

# Function to test domains
test_domains() {
    echo -e "${YELLOW}🧪 Testing domain configuration...${NC}"
    
    # Check if domains resolve
    for domain in "$BACKEND_DOMAIN" "$FRONTEND_DOMAIN"; do
        if nslookup "$domain" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $domain resolves${NC}"
        else
            echo -e "${YELLOW}⚠️  $domain does not resolve (may need DNS configuration)${NC}"
        fi
    done
}

# Main menu
echo -e "${BLUE}Select certificate type:${NC}"
echo "1) Wildcard self-signed certificate for *.lead-schem.ru (for development/testing)"
echo "2) Prepare for Let's Encrypt certificates (for production)"
echo "3) Validate existing certificates"
echo "4) Test domain configuration"
echo "5) Exit"

read -p "Enter your choice [1-5]: " choice

case $choice in
    1)
        generate_wildcard_certificate
        set_permissions
        validate_certificates
        create_env_file
        test_domains
        ;;
    2)
        prepare_letsencrypt
        set_permissions
        create_env_file
        test_domains
        ;;
    3)
        validate_certificates
        ;;
    4)
        test_domains
        ;;
    5)
        echo -e "${BLUE}👋 Exiting...${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Please select 1-5.${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 SSL setup completed for domains!${NC}"
echo -e "${BLUE}📁 Certificate files are located in: $SSL_DIR${NC}"
echo -e "${YELLOW}⚠️  Remember to update your .env files with the generated settings!${NC}"

# Final instructions
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Copy ssl/domains.env settings to your .env files"
echo "2. Deploy to server with proper DNS configuration"
echo "3. Update Nginx configuration with correct domain names"
echo "4. Test HTTPS connections for both domains"
echo "5. Configure Mango Office webhook URL: https://$BACKEND_DOMAIN/api/webhooks/mango"

if [[ "$choice" == "1" ]]; then
    echo -e "${YELLOW}⚠️  Note: Self-signed certificates will show security warnings in browsers.${NC}"
    echo -e "${YELLOW}   For production, use Let's Encrypt or purchase commercial certificates.${NC}"
fi

# Display URLs
echo -e "${BLUE}🌐 Your application URLs:${NC}"
echo -e "${GREEN}Frontend: https://$FRONTEND_DOMAIN${NC}"
echo -e "${GREEN}Backend API: https://$BACKEND_DOMAIN${NC}"
echo -e "${GREEN}Health Check: https://$BACKEND_DOMAIN/health${NC}"
