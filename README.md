# E-Commerce Website - Ứng dụng Web Thương mại Điện tử

> **Lưu ý:** Đây là dự án học tập nhằm mục đích tìm hiểu và thực hành phát triển ứng dụng web full-stack.

Ứng dụng web full-stack thương mại điện tử với nhiều tính năng, được xây dựng với React.js (Frontend) và Node.js/Express (Backend).

## Mục lục

- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt](#cài-đặt)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Tính năng

### Frontend
-  Trang chủ với Hero Banner carousel
-  Hiển thị dịch vụ vận chuyển
-  Tin tức và cập nhật
-  Tra cứu vận đơn (Tracking)
-  Quản lý đơn hàng
-  Responsive design
-  Navigation với React Router

### Backend
-  RESTful API với Express.js
-  SQLite Database
-  CRUD operations cho Services, News, Tracking, Orders
-  CORS enabled
-  Error handling

## Công nghệ sử dụng

### Frontend
- **React 19** - UI Library
- **Vite** - Build tool
- **React Router DOM** - Routing
- **Axios** - HTTP Client
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime
- **Express.js** - Web Framework
- **SQLite3** - Database
- **CORS** - Cross-Origin Resource Sharing
- **Body Parser** - Request parsing

## Cài đặt

### Yêu cầu
- Node.js >= 16.x
- npm >= 8.x

### Bước 1: Tải source code
Tải source code về máy và giải nén vào thư mục `dlhshipping`

```bash
cd dlhshipping
```

### Bước 2: Cài đặt Backend
```bash
cd backend
npm install
```

### Bước 3: Cài đặt Frontend
```bash
cd ../frontend
npm install
```

### Bước 4: Khởi tạo Database
```bash
cd ../backend
npm run init-data
```

## Chạy ứng dụng

### Development Mode

#### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```
Backend sẽ chạy tại: `http://localhost:5000`

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:3000`

### Production Mode

#### Build Frontend:
```bash
cd frontend
npm run build
```

#### Chạy Backend (sẽ serve frontend build):
```bash
cd backend
NODE_ENV=production npm start
```

## Cấu trúc dự án

```
DHLSHIPPING/
 backend/                 # Backend API
    database/
       db.js           # Database operations
       database.sqlite # SQLite database file
    routes/
       api.js          # API routes
    scripts/
       initData.js     # Initialize sample data
    server.js           # Express server
    package.json

 frontend/                # Frontend React App
    public/
       images/         # Static images
    src/
       components/     # React components
          Header.jsx
          HeroBanner.jsx
          Footer.jsx
       pages/          # Page components
          Home.jsx
       App.jsx         # Main App component
       main.jsx        # Entry point
    vite.config.js      # Vite configuration
    package.json

 README.md
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### Services
- `GET /api/services` - Lấy danh sách tất cả dịch vụ
- `GET /api/services/:id` - Lấy thông tin một dịch vụ
- `POST /api/services` - Tạo dịch vụ mới

#### News
- `GET /api/news` - Lấy danh sách tin tức
- `GET /api/news/:id` - Lấy chi tiết tin tức
- `POST /api/news` - Tạo tin tức mới

#### Tracking
- `GET /api/tracking/:trackingNumber` - Tra cứu mã vận đơn
- `POST /api/tracking` - Tạo tracking mới
- `PUT /api/tracking/:trackingNumber` - Cập nhật tracking

#### Orders
- `GET /api/orders` - Lấy danh sách đơn hàng
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới

#### Health Check
- `GET /health` - Kiểm tra trạng thái server

### Ví dụ Request

#### Tạo đơn hàng:
```bash
POST /api/orders
Content-Type: application/json

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

#### Tra cứu vận đơn:
```bash
GET /api/tracking/DHL1234567890
```

## Database Schema

### Services Table
- `id` - Primary Key
- `name` - Tên dịch vụ
- `description` - Mô tả
- `icon` - Icon emoji
- `price` - Giá
- `category` - Danh mục
- `created_at` - Ngày tạo

### News Table
- `id` - Primary Key
- `title` - Tiêu đề
- `content` - Nội dung
- `image` - Hình ảnh
- `author` - Tác giả
- `created_at` - Ngày tạo

### Tracking Table
- `id` - Primary Key
- `tracking_number` - Mã vận đơn (Unique)
- `status` - Trạng thái
- `location` - Vị trí
- `description` - Mô tả
- `created_at` - Ngày tạo
- `updated_at` - Ngày cập nhật

### Orders Table
- `id` - Primary Key
- `order_number` - Số đơn hàng (Unique)
- `customer_name` - Tên khách hàng
- `customer_email` - Email
- `customer_phone` - Số điện thoại
- `service_id` - Foreign Key to Services
- `tracking_number` - Mã vận đơn
- `status` - Trạng thái
- `total_amount` - Tổng tiền
- `created_at` - Ngày tạo

## Testing

### Test API với curl:
```bash
# Health check
curl http://localhost:5000/health

# Get services
curl http://localhost:5000/api/services

# Get tracking
curl http://localhost:5000/api/tracking/DHL1234567890
```

## Scripts

### Backend
- `npm start` - Chạy server production
- `npm run dev` - Chạy server development (với nodemon)
- `npm run init-data` - Khởi tạo dữ liệu mẫu

### Frontend
- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

## Cấu hình

### Environment Variables (Backend)
Tạo file `.env` trong thư mục `backend/`:
```env
PORT=5000
NODE_ENV=development
DATABASE_PATH=./database/database.sqlite
```

### Vite Proxy (Frontend)
Proxy đã được cấu hình trong `vite.config.js` để forward `/api` requests đến backend.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Mục đích dự án

Dự án này được tạo ra với mục đích học tập và thực hành:
- Xây dựng ứng dụng web full-stack
- Làm việc với React.js và Node.js/Express
- Thiết kế RESTful API
- Quản lý database với SQLite
- Triển khai ứng dụng web

## Tác giả

Dự án học tập cá nhân

## Ghi chú

- Đây là dự án học tập, không phải sản phẩm thương mại
- Mọi thương hiệu được sử dụng chỉ nhằm mục đích minh họa

