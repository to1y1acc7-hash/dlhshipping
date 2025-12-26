# Hướng Dẫn Cài Đặt - DHL Shipping

Hướng dẫn chi tiết để cài đặt và thiết lập môi trường phát triển cho dự án DHL Shipping.

## Yêu Cầu Hệ Thống

### Phần Mềm Cần Thiết

- **Node.js**: >= 16.x (khuyến nghị 18.x hoặc cao hơn)
- **npm**: >= 8.x (hoặc yarn/pnpm)
- **Git**: Để clone repository
- **SQLite3**: Được cài đặt cùng với Node.js

### Kiểm Tra Phiên Bản

```bash
# Kiểm tra Node.js
node --version

# Kiểm tra npm
npm --version

# Kiểm tra Git
git --version
```

## Cài Đặt

### Bước 1: Tải Source Code

Tải source code về máy và giải nén vào thư mục `dlhshipping`

```bash
cd dlhshipping
```

### Bước 2: Cài Đặt Backend Dependencies

```bash
cd backend
npm install
```

**Các package chính được cài đặt:**
- `express` - Web framework
- `sqlite3` - Database driver
- `cors` - Cross-origin resource sharing
- `body-parser` - Request body parsing
- `multer` - File upload handling
- `nodemon` - Development server (dev dependency)

### Bước 3: Cài Đặt Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Các package chính được cài đặt:**
- `react` - UI library
- `react-router-dom` - Routing
- `axios` - HTTP client
- `vite` - Build tool
- `@fortawesome/react-fontawesome` - Icons

### Bước 4: Khởi Tạo Database

```bash
cd ../backend
npm run init-data
```

Lệnh này sẽ:
- Tạo database SQLite nếu chưa tồn tại
- Tạo các bảng cần thiết
- Thêm dữ liệu mẫu (nếu có)

### Bước 5: Tạo File Cấu Hình (Tùy Chọn)

Tạo file `.env` trong thư mục `backend/`:

```env
PORT=5000
NODE_ENV=development
DATABASE_PATH=./database/database.sqlite
```

## Kiểm Tra Cài Đặt

### Kiểm Tra Backend

```bash
cd backend
npm run dev
```

Backend sẽ chạy tại: `http://localhost:5000`

Kiểm tra health endpoint:
```bash
curl http://localhost:5000/health
```

Kết quả mong đợi:
```json
{
  "status": "OK",
  "message": "DHL Backend API is running"
}
```

### Kiểm Tra Frontend

Mở terminal mới:
```bash
cd frontend
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## Cài Đặt Với Docker (Tùy Chọn)

### Yêu Cầu
- Docker >= 20.x
- Docker Compose >= 2.x

### Chạy Với Docker Compose

```bash
# Từ thư mục gốc dự án
docker-compose up -d
```

Xem chi tiết tại [DEPLOYMENT.md](DEPLOYMENT.md)

## Cấu Hình Bổ Sung

### Cấu Hình Vite Proxy

File `frontend/vite.config.js` đã được cấu hình để proxy API requests:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    }
  }
}
```

### Cấu Hình CORS

Backend đã được cấu hình CORS để cho phép requests từ frontend. Nếu cần thay đổi, chỉnh sửa trong `backend/server.js`:

```javascript
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true
}));
```

## Scripts Có Sẵn

### Backend Scripts

```bash
cd backend

# Chạy development server (với auto-reload)
npm run dev

# Chạy production server
npm start

# Khởi tạo dữ liệu mẫu
npm run init-data

# Tạo sản phẩm mẫu
npm run create-sample-products
npm run create-products
```

### Frontend Scripts

```bash
cd frontend

# Chạy development server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Xử Lý Sự Cố

### Lỗi Port Đã Được Sử Dụng

Nếu port 5000 hoặc 3000 đã được sử dụng:

**Backend:**
```bash
# Thay đổi PORT trong .env hoặc
PORT=5001 npm run dev
```

**Frontend:**
Chỉnh sửa `vite.config.js`:
```javascript
server: {
  port: 3001
}
```

### Lỗi Database

Nếu gặp lỗi database:

```bash
cd backend
# Xóa database cũ và tạo lại
rm database/database.sqlite
npm run init-data
```

### Lỗi Module Không Tìm Thấy

```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

## Bước Tiếp Theo

Sau khi cài đặt thành công:

1. Đọc [Hướng Dẫn Phát Triển](DEVELOPMENT.md) để bắt đầu phát triển
2. Xem [Tài Liệu API](API.md) để hiểu về API endpoints
3. Tham khảo [Kiến Trúc Hệ Thống](ARCHITECTURE.md) để hiểu cấu trúc dự án

## Câu Hỏi Thường Gặp

**Q: Tôi có thể chạy frontend mà không cần backend không?**
A: Có, frontend có thể chạy độc lập với mock data. Xem `frontend/src/data/mockData.js`

**Q: Database được lưu ở đâu?**
A: Database SQLite được lưu tại `backend/database/database.sqlite`

**Q: Làm sao để reset database?**
A: Xóa file `backend/database/database.sqlite` và chạy lại `npm run init-data`

---

**Cần hỗ trợ?** Xem [TROUBLESHOOTING.md](TROUBLESHOOTING.md) hoặc tạo issue trên GitHub.

