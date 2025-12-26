#!/bin/bash

# ===========================================
# DHL Shipping - VPS Deployment Script
# Domain: www.logistictransport.com.au
# VPS IP: 34.142.238.216
# ===========================================

set -e

DOMAIN="logistictransport.com.au"
WWW_DOMAIN="www.logistictransport.com.au"
PROJECT_DIR="$HOME/dhlshipping"

echo "=========================================="
echo "  DHL Shipping - VPS Deployment"
echo "=========================================="

# 1. Build và chạy Docker containers
echo "[1/3] Build và chạy Docker containers..."
cd "$PROJECT_DIR"
docker compose down 2>/dev/null || true
docker compose up -d --build
echo "Containers đang chạy:"
docker ps

# 2. Cấu hình Nginx
echo "[2/3] Cấu hình Nginx..."

sudo tee /etc/nginx/sites-available/logistictransport > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/logistictransport /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
echo "Nginx đã được cấu hình!"

# 3. Cài đặt SSL
echo "[3/3] Cài đặt SSL Certificate..."
sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN 2>/dev/null || {
    echo "⚠️  SSL chưa cài được. Chạy thủ công sau khi DNS đã trỏ về VPS:"
    echo "   sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN"
}

echo ""
echo "=========================================="
echo "  Deployment hoàn tất!"
echo "=========================================="
echo ""
echo "URLs:"
echo "  - https://$WWW_DOMAIN"
echo "  - https://$DOMAIN"
echo "  - http://34.142.238.216:8080 (direct)"
echo ""
echo "Quản lý:"
echo "  - Xem logs: docker compose logs -f"
echo "  - Restart: docker compose restart"
echo "  - Stop: docker compose down"
