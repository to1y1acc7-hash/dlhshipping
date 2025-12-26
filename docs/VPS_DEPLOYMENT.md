# Hướng Dẫn Triển Khai Lên VPS - DHL Shipping

Tài liệu hướng dẫn chi tiết triển khai dự án DHL Shipping lên VPS.

## Thông Tin VPS

- **IP**: 34.142.238.216
- **User**: to1y1acc7
- **Hostname**: dhlshipping

## Yêu Cầu VPS

- Ubuntu 20.04+ hoặc Debian
- Docker >= 20.x
- Docker Compose >= 2.x
- Git
- Nginx (đã cài sẵn)

## Bước 1: Kết Nối VPS

```bash
ssh to1y1acc7@34.142.238.216
```

## Bước 2: Cài Đặt Docker (Nếu Chưa Có)

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Thêm user vào group docker
sudo usermod -aG docker $USER

# Cài đặt Docker Compose
sudo apt install docker-compose-plugin -y

# Kiểm tra
docker --version
docker compose version

# Logout và login lại để áp dụng group
exit
```

## Bước 3: Clone/Upload Project

### Cách 1: Clone từ Git (Khuyến nghị)
```bash
cd ~
git clone https://github.com/to1y1acc7-hash/dlhshipping.git dhlshipping
cd dhlshipping
```

### Cách 2: Upload từ Local (SCP)
```bash
# Chạy trên máy local
scp -r ./* to1y1acc7@34.142.238.216:~/dhlshipping/
```

### Cách 3: Upload bằng SFTP
Sử dụng FileZilla hoặc WinSCP để upload toàn bộ project.

## Bước 4: Build và Chạy Docker

```bash
cd ~/dhlshipping

# Build và chạy containers
docker compose up -d --build

# Kiểm tra containers
docker ps

# Xem logs
docker compose logs -f
```

## Bước 5: Kiểm Tra Services

```bash
# Kiểm tra containers đang chạy
docker ps

# Kết quả mong đợi:
# dhl-frontend - port 8080:80 - healthy
# dhl-backend  - port 5000:5000 - healthy

# Test Backend API
curl http://localhost:5000/health

# Test Frontend
curl http://localhost:8080
```

## Cấu Hình Nginx Reverse Proxy

Nginx đã chạy trên VPS ở port 80/443. Cấu hình để proxy đến Docker containers:

```bash
sudo nano /etc/nginx/sites-available/dhlshipping
```

Nội dung:
```nginx
server {
    listen 80;
    server_name 34.142.238.216;  # Hoặc domain của bạn

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Kích hoạt cấu hình:
```bash
sudo ln -s /etc/nginx/sites-available/dhlshipping /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Các Lệnh Quản Lý Docker

### Khởi động/Dừng Services
```bash
# Khởi động
docker compose up -d

# Dừng
docker compose down

# Restart
docker compose restart

# Restart một service
docker compose restart backend
docker compose restart frontend
```

### Xem Logs
```bash
# Tất cả logs
docker compose logs -f

# Logs của backend
docker compose logs -f backend

# Logs của frontend
docker compose logs -f frontend
```

### Rebuild Sau Khi Update Code
```bash
# Pull code mới (nếu dùng Git)
git pull origin main

# Rebuild và restart
docker compose up -d --build
```

### Xóa và Build Lại Hoàn Toàn
```bash
docker compose down
docker system prune -f
docker compose up -d --build
```

## Cấu Hình Port

| Service | Container Port | Host Port | URL |
|---------|---------------|-----------|-----|
| Frontend | 80 | 8080 | http://34.142.238.216:8080 |
| Backend | 5000 | 5000 | http://34.142.238.216:5000 |
| Nginx | 80, 443 | 80, 443 | http://34.142.238.216 |

## Backup Database

### Backup Thủ Công
```bash
# Tạo thư mục backup
mkdir -p ~/backups

# Backup database
docker cp dhl-backend:/app/database/database.sqlite ~/backups/database-$(date +%Y%m%d).sqlite
```

### Backup Tự Động (Cron)
```bash
# Mở crontab
crontab -e

# Thêm dòng này để backup hàng ngày lúc 2:00 AM
0 2 * * * docker cp dhl-backend:/app/database/database.sqlite ~/backups/database-$(date +\%Y\%m\%d).sqlite
```

## Restore Database

```bash
# Stop backend
docker compose stop backend

# Copy database vào container
docker cp ~/backups/database-20241226.sqlite dhl-backend:/app/database/database.sqlite

# Start backend
docker compose start backend
```

## Troubleshooting

### Container Không Chạy
```bash
# Xem logs chi tiết
docker compose logs backend
docker compose logs frontend

# Kiểm tra container status
docker ps -a
```

### Port Đã Được Sử Dụng
```bash
# Kiểm tra port
sudo netstat -tlnp | grep 5000
sudo netstat -tlnp | grep 8080

# Kill process đang dùng port
sudo kill -9 <PID>
```

### Hết Dung Lượng Disk
```bash
# Kiểm tra dung lượng
df -h

# Dọn dẹp Docker
docker system prune -a
```

### Permission Denied
```bash
# Thêm user vào docker group
sudo usermod -aG docker $USER

# Logout và login lại
exit
```

## Cập Nhật Ứng Dụng

### Quy Trình Update
```bash
# 1. SSH vào VPS
ssh to1y1acc7@34.142.238.216

# 2. Vào thư mục project
cd ~/dhlshipping

# 3. Pull code mới
git pull origin main

# 4. Rebuild containers
docker compose up -d --build

# 5. Kiểm tra
docker ps
docker compose logs -f
```

## Monitoring

### Kiểm Tra Resource
```bash
# CPU, Memory
docker stats

# Disk usage
docker system df
```

### Health Check
```bash
# Backend health
curl http://localhost:5000/health

# Frontend
curl -I http://localhost:8080
```

## Liên Hệ

Nếu gặp vấn đề, kiểm tra:
1. Logs: `docker compose logs -f`
2. Container status: `docker ps -a`
3. Network: `docker network ls`
4. Volumes: `docker volume ls`
