# Tổng Hợp Lệnh VPS - DHL Shipping

## Thông Tin Kết Nối
```bash
ssh to1y1acc7@34.142.238.216
```

---

## 🚀 Deploy Lần Đầu

```bash
# Clone project
cd ~
git clone https://github.com/to1y1acc7-hash/dlhshipping.git dhlshipping
cd dhlshipping

# Chạy deploy
bash scripts/deploy-vps.sh
```

---

## 🔄 Cập Nhật Code (Redeploy)

```bash
cd ~/dhlshipping
git pull origin main
bash scripts/redeploy.sh
```

Hoặc ngắn gọn:
```bash
bash ~/dhlshipping/scripts/redeploy.sh
```

---

## 💾 Backup Database

### Backup thủ công
```bash
bash ~/dhlshipping/scripts/backup-database.sh
```

### Cài backup tự động (mỗi ngày lúc 2:00 AM)
```bash
crontab -e
# Thêm dòng:
0 2 * * * /bin/bash /home/to1y1acc7/dhlshipping/scripts/backup-database.sh >> /home/to1y1acc7/backups/backup.log 2>&1
```

---

## 🐳 Quản Lý Docker

```bash
# Xem containers đang chạy
docker ps

# Xem logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend

# Restart
docker compose restart
docker compose restart backend

# Stop
docker compose down

# Start
docker compose up -d

# Rebuild hoàn toàn
docker compose down
docker compose up -d --build

# Dọn dẹp Docker
docker system prune -a
```

---

## 🔧 Troubleshooting

```bash
# Kiểm tra port
sudo netstat -tlnp | grep 5000
sudo netstat -tlnp | grep 8080

# Kiểm tra disk
df -h

# Kiểm tra resource
docker stats

# Test API
curl http://localhost:5000/health

# Test Frontend
curl -I http://localhost:8080
```

---

## 📋 URLs

| Service | URL |
|---------|-----|
| Frontend (direct) | http://34.142.238.216:8080 |
| Backend API | http://34.142.238.216:5000 |
| Domain | https://www.logistictransport.com.au |
