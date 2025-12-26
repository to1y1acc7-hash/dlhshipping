# DHL Backend API

Backend API cho ứng dụng DHL Shipping được xây dựng với Node.js và Express.

## 🚀 Cài đặt

```bash
npm install
```

## 📦 Khởi tạo dữ liệu

```bash
npm run init-data
```

## 🏃 Chạy server

### Development mode (với nodemon):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

## 📡 API Endpoints

### Services
- `GET /api/services` - Lấy danh sách tất cả dịch vụ
- `GET /api/services/:id` - Lấy thông tin một dịch vụ
- `POST /api/services` - Tạo dịch vụ mới

### News
- `GET /api/news` - Lấy danh sách tin tức
- `GET /api/news/:id` - Lấy chi tiết một tin tức
- `POST /api/news` - Tạo tin tức mới

### Tracking
- `GET /api/tracking/:trackingNumber` - Tra cứu mã vận đơn
- `POST /api/tracking` - Tạo tracking mới
- `PUT /api/tracking/:trackingNumber` - Cập nhật tracking

### Orders
- `GET /api/orders` - Lấy danh sách đơn hàng
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới

### Health Check
- `GET /health` - Kiểm tra trạng thái server

## 🗄️ Database

Sử dụng SQLite với các bảng:
- `services` - Dịch vụ vận chuyển
- `news` - Tin tức
- `tracking` - Theo dõi vận đơn
- `orders` - Đơn hàng

Database file: `database/database.sqlite`

## 📝 Ví dụ Request

### Tạo đơn hàng mới:
```json
POST /api/orders
{
  "order_number": "ORD001",
  "customer_name": "Nguyễn Văn A",
  "customer_email": "nguyenvana@example.com",
  "customer_phone": "0123456789",
  "service_id": 1,
  "tracking_number": "DHL1234567890",
  "total_amount": 25.99
}
```

### Tra cứu vận đơn:
```
GET /api/tracking/DHL1234567890
```

