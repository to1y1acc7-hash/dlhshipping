#!/bin/bash

# ===========================================
# DHL Shipping - Quick Redeploy Script
# Chạy sau khi push code mới lên GitHub
# ===========================================

set -e

PROJECT_DIR="$HOME/dhlshipping"

echo "🔄 Đang cập nhật code..."
cd "$PROJECT_DIR"

# Pull code mới
git pull origin main

# Rebuild và restart containers
echo "🐳 Rebuild containers..."
docker compose up -d --build

# Hiển thị status
echo ""
echo "✅ Redeploy hoàn tất!"
docker ps
echo ""
echo "Xem logs: docker compose logs -f"
