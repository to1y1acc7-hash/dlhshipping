#!/bin/bash

# ===========================================
# DHL Shipping - Database Backup to Google Drive
# Tự động backup database lên Google Drive mỗi ngày
# ===========================================

set -e

PROJECT_DIR="$HOME/dhlshipping"
BACKUP_DIR="$HOME/backups"
GDRIVE_FOLDER_ID="1e7jrKxdvCUyIo9s61erWfz2p3kzkPKsl"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="database_$DATE.sqlite"

# Tạo thư mục backup nếu chưa có
mkdir -p "$BACKUP_DIR"

echo "🔄 Đang backup database..."

# Copy database từ container
docker cp dhl-backend:/app/database/database.sqlite "$BACKUP_DIR/$BACKUP_FILE"

echo "📤 Đang upload lên Google Drive..."

# Upload lên Google Drive bằng gdrive
gdrive files upload --parent "$GDRIVE_FOLDER_ID" "$BACKUP_DIR/$BACKUP_FILE"

# Xóa file backup local cũ hơn 7 ngày
find "$BACKUP_DIR" -name "database_*.sqlite" -mtime +7 -delete

echo "✅ Backup hoàn tất: $BACKUP_FILE"
