# Hướng Dẫn Triển Khai - DHL Shipping

Hướng dẫn chi tiết để triển khai ứng dụng DHL Shipping lên môi trường production.

## Lưu ý

> **Đây là dự án học tập**, các hướng dẫn deployment dưới đây chỉ mang tính chất tham khảo.

## Yêu Cầu

### Server Requirements (Tham khảo)
- **OS**: Linux (Ubuntu 20.04+ recommended) hoặc Windows Server
- **Node.js**: >= 16.x
- **npm**: >= 8.x
- **Nginx**: >= 1.18 (optional, for reverse proxy)
- **PM2**: For process management (optional)

## Triển Khai Với Docker

### Cách 1: Docker Compose (Khuyến Nghị)

#### Bước 1: Chuẩn Bị Files

Đảm bảo có các file:
- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`

#### Bước 2: Build và Chạy

```bash
# Build và start containers
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Stop containers
docker-compose down
```

#### Bước 3: Kiểm Tra

```bash
# Check containers
docker-compose ps

# Test API
curl http://localhost:5000/health
```

### Cách 2: Docker Individual Containers

#### Build Backend Image
```bash
cd backend
docker build -t dhl-backend .
```

#### Build Frontend Image
```bash
cd frontend
docker build -t dhl-frontend .
```

#### Run Containers
```bash
# Backend
docker run -d -p 5000:5000 \
  -v $(pwd)/backend/database:/app/database \
  -v $(pwd)/backend/uploads:/app/uploads \
  --name dhl-backend dhl-backend

# Frontend
docker run -d -p 80:80 \
  --name dhl-frontend dhl-frontend
```

## Triển Khai Manual (Không Docker)

### Backend Deployment

#### Bước 1: Upload Code
```bash
# Sử dụng SCP hoặc Git
scp -r backend/ user@server:/var/www/dhl-backend/
```

#### Bước 2: Cài Đặt Dependencies
```bash
ssh user@server
cd /var/www/dhl-backend
npm install --production
```

#### Bước 3: Cấu Hình Environment
```bash
# Tạo file .env
nano .env
```

```env
PORT=5000
NODE_ENV=production
DATABASE_PATH=./database/database.sqlite
```

#### Bước 4: Khởi Tạo Database
```bash
npm run init-data
```

#### Bước 5: Chạy với PM2
```bash
# Cài đặt PM2
npm install -g pm2

# Start application
pm2 start server.js --name dhl-backend

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### Frontend Deployment

#### Bước 1: Build Production
```bash
cd frontend
npm install
npm run build
```

#### Bước 2: Upload Build
```bash
# Upload dist folder
scp -r dist/ user@server:/var/www/dhl-frontend/
```

#### Bước 3: Cấu Hình Nginx

Tạo file `/etc/nginx/sites-available/dhl-frontend`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/dhl-frontend;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
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

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Bước 4: Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/dhl-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/HTTPS Setup

### Sử Dụng Let's Encrypt

```bash
# Cài đặt Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Cấu Hình Production

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=production
DATABASE_PATH=./database/database.sqlite

# Security
SESSION_SECRET=your-secret-key-here
JWT_SECRET=your-jwt-secret-here

# CORS
CORS_ORIGIN=https://your-domain.com
```

#### Frontend (vite.config.js)
```javascript
export default {
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.your-domain.com',
        changeOrigin: true,
      }
    }
  }
}
```

## Monitoring & Logging

### PM2 Monitoring
```bash
# Monitor
pm2 monit

# View logs
pm2 logs dhl-backend

# Restart
pm2 restart dhl-backend
```

### Nginx Logs
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

## Database Backup

### Manual Backup
```bash
# Backup SQLite database
cp backend/database/database.sqlite backups/database-$(date +%Y%m%d).sqlite
```

### Automated Backup Script
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/dhl"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /var/www/dhl-backend/database/database.sqlite $BACKUP_DIR/database-$DATE.sqlite
# Keep only last 7 days
find $BACKUP_DIR -name "database-*.sqlite" -mtime +7 -delete
```

## Troubleshooting

### Backend Không Chạy
```bash
# Check logs
pm2 logs dhl-backend

# Check port
netstat -tulpn | grep 5000

# Restart
pm2 restart dhl-backend
```

### Frontend Không Load
```bash
# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check files
ls -la /var/www/dhl-frontend/
```

### Database Errors
```bash
# Check database file
ls -la backend/database/database.sqlite

# Check permissions
chmod 644 backend/database/database.sqlite
```

## Performance Optimization

### Nginx Caching
```nginx
# Add to nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;

location /api {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_pass http://localhost:5000;
}
```

### PM2 Cluster Mode
```bash
# Run multiple instances
pm2 start server.js -i max --name dhl-backend
```

## Security Checklist

- [ ] SSL/HTTPS enabled
- [ ] Environment variables secured
- [ ] Database permissions set correctly
- [ ] Firewall configured
- [ ] Regular backups scheduled
- [ ] Logs monitored
- [ ] Updates applied regularly
- [ ] Strong passwords used
- [ ] CORS configured correctly

## Post-Deployment

### Kiểm Tra
1. Test all endpoints
2. Verify SSL certificate
3. Check logs for errors
4. Test file uploads
5. Verify database connections

### Monitoring
- Set up uptime monitoring
- Configure error alerts
- Monitor server resources
- Track API performance

---

**Lưu ý:** Luôn test trên staging environment trước khi deploy lên production!

