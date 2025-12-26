#!/bin/bash

# Server Setup Script for DHL Shipping
# Script tự động cài đặt Docker và các dependencies cần thiết

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== DHL Shipping Server Setup Script ===${NC}\n"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}This script must be run as root (use sudo)${NC}"
   exit 1
fi

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install prerequisites
echo -e "${YELLOW}Installing prerequisites...${NC}"
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw \
    nginx \
    certbot \
    python3-certbot-nginx

# Install Docker
echo -e "${YELLOW}Installing Docker...${NC}"

# Remove old versions
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Setup repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable Docker to start on boot
systemctl enable docker
systemctl start docker

# Add current user to docker group (if not root)
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker "$SUDO_USER"
    echo -e "${GREEN}Added $SUDO_USER to docker group${NC}"
    echo -e "${YELLOW}User needs to logout and login again for group changes to take effect${NC}"
fi

# Configure Firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 5000/tcp  # Deny direct access to backend port

# Create project directory
PROJECT_DIR="/opt/dhlshipping"
mkdir -p "$PROJECT_DIR"
echo -e "${GREEN}Created project directory: $PROJECT_DIR${NC}"

# Create backup directory
BACKUP_DIR="$PROJECT_DIR/backups"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}Created backup directory: $BACKUP_DIR${NC}"

# Create logs directory
LOGS_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOGS_DIR/backend"
echo -e "${GREEN}Created logs directory: $LOGS_DIR${NC}"

# Set permissions
if [ -n "$SUDO_USER" ]; then
    chown -R "$SUDO_USER:$SUDO_USER" "$PROJECT_DIR"
fi

echo -e "\n${GREEN}=== Setup Completed Successfully! ===${NC}\n"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Clone or upload your project to $PROJECT_DIR"
echo "2. Configure .env file"
echo "3. Run deployment script: ./scripts/deploy.sh"
echo ""
echo -e "${YELLOW}Docker version:${NC}"
docker --version
docker compose version

