# Hướng Dẫn Cài Đặt Backup Database Tự Động

## Bước 1: Cài đặt gdrive trên VPS

```bash
# Tải gdrive
wget https://github.com/glotlabs/gdrive/releases/download/3.9.1/gdrive_linux-amd64.tar.gz

# Giải nén
tar -xvf gdrive_linux-amd64.tar.gz

# Di chuyển vào /usr/local/bin
sudo mv gdrive /usr/local/bin/

# Kiểm tra
gdrive version
```

## Bước 2: Tạo Google Cloud Project và OAuth

1. Vào https://console.cloud.google.com/
2. Tạo project mới hoặc chọn project có sẵn
3. Vào "APIs & Services" > "Enable APIs" > Bật "Google Drive API"
4. Vào "APIs & Services" > "Credentials" > "Create Credentials" > "OAuth client ID"
5. Chọn "Desktop app", đặt tên và tạo
6. Download file JSON credentials

## Bước 3: Cấu hình gdrive

```bash
# Thêm account
gdrive account add

# Làm theo hướng dẫn để xác thực với Google
# Paste Client ID và Client Secret từ bước 2
```

## Bước 4: Test backup thủ công

```bash
cd ~/dhlshipping
bash scripts/backup-database.sh
```

## Bước 5: Cài đặt Cron Job (backup tự động mỗi ngày)

```bash
# Mở crontab
crontab -e

# Thêm dòng này để backup lúc 2:00 AM mỗi ngày
0 2 * * * /bin/bash /home/to1y1acc7/dhlshipping/scripts/backup-database.sh >> /home/to1y1acc7/backups/backup.log 2>&1
```

## Kiểm tra backup

- Google Drive folder: https://drive.google.com/drive/folders/1e7jrKxdvCUyIo9s61erWfz2p3kzkPKsl
- Log file: `~/backups/backup.log`

## Restore database từ backup

```bash
# Download file từ Google Drive
gdrive files download <FILE_ID> --destination ~/backups/

# Stop backend
docker compose stop backend

# Copy vào container
docker cp ~/backups/database_YYYYMMDD.sqlite dhl-backend:/app/database/database.sqlite

# Start backend
docker compose start backend
```
