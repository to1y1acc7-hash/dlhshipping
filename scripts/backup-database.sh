#!/bin/bash

# ===========================================
# DHL Shipping - Database Backup to GitHub
# Tự động backup database lên GitHub mỗi ngày
# ===========================================

set -e

PROJECT_DIR="$HOME/dhlshipping"
DATE=$(date +%Y%m%d_%H%M%S)

cd "$PROJECT_DIR"

echo "🔄 Đang backup database..."

# Copy database từ container ra thư mục project
docker cp dhl-backend:/app/database/database.sqlite backend/database/database.sqlite

# Commit và push lên GitHub
git add backend/database/database.sqlite
git commit -m "Backup database - $DATE" || echo "Không có thay đổi"
git push origin main

echo "✅ Backup hoàn tất: $DATE"
