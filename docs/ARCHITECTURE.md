# Kiến Trúc Hệ Thống - DHL Shipping

Tài liệu mô tả kiến trúc và cấu trúc của hệ thống DHL Shipping.

## Tổng Quan Kiến Trúc

DHL Shipping là một ứng dụng web full-stack được xây dựng theo mô hình **Client-Server** với kiến trúc **RESTful API**.

```

   Web Browser   
   (React App)   

          HTTP/HTTPS
          REST API
         

  Express Server 
   (Node.js)     

         
         

   SQLite DB     
  (database.sqlite)

```

## Cấu Trúc Thư Mục

```
DHLSHIPPING/
 backend/                    # Backend API Server
    database/
       db.js              # Database operations & queries
       database.sqlite    # SQLite database file
    routes/
       api.js             # API route handlers
    services/
       pollResultGenerator.js  # Business logic services
    scripts/
       initData.js        # Database initialization
       createAdmin.js     # Admin creation script
       ...                # Other utility scripts
    uploads/               # Uploaded files storage
       products/          # Product images
    server.js              # Express server entry point
    package.json

 frontend/                   # Frontend React Application
    public/                 # Static assets
       images/            # Public images
       favicon.png        # Site favicon
    src/
       components/        # Reusable React components
          Header.jsx
          Footer.jsx
          HeroBanner.jsx
          ProtectedRoute.jsx
       pages/             # Page components
          Home.jsx
          AdminDashboard.jsx
          Login.jsx
          ...            # 30+ page components
       contexts/          # React Context providers
          ItemExportContext.jsx
       assets/            # Frontend assets
          logo.png
       data/              # Mock data
          mockData.js
       App.jsx            # Main App component & routing
       main.jsx           # Application entry point
    vite.config.js         # Vite configuration
    package.json

 docs/                      # Project documentation
    README.md
    INSTALLATION.md
    ...

 docker-compose.yml         # Docker Compose configuration
 README.md                  # Main project README
```

## Luồng Dữ Liệu

### Request Flow

```
1. User Action (Click, Form Submit)
   ↓
2. React Component (Event Handler)
   ↓
3. Axios HTTP Request
   ↓
4. Vite Proxy (/api/* → localhost:5000)
   ↓
5. Express Router (routes/api.js)
   ↓
6. Route Handler (Business Logic)
   ↓
7. Database Layer (db.js)
   ↓
8. SQLite Database
   ↓
9. Response Back Through Chain
```

### Authentication Flow

```
1. User Login
   ↓
2. POST /api/admin/login hoặc /api/staff/login
   ↓
3. Verify Credentials
   ↓
4. Return adminId/staffId
   ↓
5. Store in localStorage
   ↓
6. Include in Request Headers (admin-id/staff-id)
   ↓
7. Middleware Verify (requireAdmin/requireAdminOrStaff)
   ↓
8. Grant/Deny Access
```

## Database Schema

### Các Bảng Chính

#### 1. **members** - Thành viên/Khách hàng
- `id` (INTEGER PRIMARY KEY)
- `username` (TEXT UNIQUE)
- `password` (TEXT)
- `balance` (REAL)
- `credit_score` (INTEGER)
- `status` (TEXT: 'active', 'inactive', 'frozen')
- `created_at` (TEXT)
- ...

#### 2. **admins** - Quản trị viên
- `id` (INTEGER PRIMARY KEY)
- `username` (TEXT UNIQUE)
- `password` (TEXT)
- `status` (TEXT: 'active', 'inactive')
- `created_at` (TEXT)

#### 3. **staff** - Nhân viên
- `id` (INTEGER PRIMARY KEY)
- `username` (TEXT UNIQUE)
- `password` (TEXT)
- `status` (TEXT: 'active', 'inactive')
- `created_at` (TEXT)

#### 4. **products** - Sản phẩm
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT)
- `product_code` (TEXT UNIQUE)
- `price` (REAL)
- `image` (TEXT)
- `description` (TEXT)
- `created_at` (TEXT)

#### 5. **categories** - Danh mục
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT UNIQUE)
- `quantity` (INTEGER)
- `status` (TEXT: 'active', 'inactive')
- `description` (TEXT)
- `image` (TEXT)
- `created_at` (TEXT)

#### 6. **category_items** - Mục trong danh mục (Polls)
- `id` (INTEGER PRIMARY KEY)
- `category_id` (INTEGER)
- `title` (TEXT)
- `reward_rate` (TEXT)
- `image` (TEXT)
- `content` (TEXT)
- `balance_required` (REAL)
- `item_key` (TEXT)
- `game` (INTEGER)
- `status` (TEXT: 'active', 'inactive')
- `created_at` (TEXT)

#### 7. **orders** - Đơn hàng
- `id` (INTEGER PRIMARY KEY)
- `order_number` (TEXT UNIQUE)
- `member_id` (INTEGER)
- `status` (TEXT)
- `total_amount` (REAL)
- `created_at` (TEXT)

#### 8. **transactions** - Giao dịch
- `id` (INTEGER PRIMARY KEY)
- `member_id` (INTEGER)
- `type` (TEXT: 'deposit', 'withdrawal', 'order')
- `amount` (REAL)
- `status` (TEXT)
- `created_at` (TEXT)

Và nhiều bảng khác...

## Bảo Mật

### Authentication & Authorization

1. **Admin Authentication**
   - Username/Password login
   - Session stored in localStorage
   - Header: `admin-id`

2. **Staff Authentication**
   - Username/Password login
   - Session stored in localStorage
   - Header: `staff-id`

3. **Member Authentication**
   - Username/Password login
   - Session stored in localStorage
   - Protected routes via `ProtectedRoute` component

### Middleware Protection

- `requireAdmin`: Chỉ admin mới có quyền
- `requireAdminOrStaff`: Admin hoặc Staff có quyền
- `requireAuth`: Yêu cầu đăng nhập (cho members)

## API Architecture

### RESTful Design

- **GET**: Lấy dữ liệu
- **POST**: Tạo mới
- **PUT**: Cập nhật
- **DELETE**: Xóa

### Base URL Structure

```
/api/{resource}/{id?}
```

Ví dụ:
- `GET /api/products` - Lấy tất cả sản phẩm
- `GET /api/products/:id` - Lấy sản phẩm theo ID
- `POST /api/products` - Tạo sản phẩm mới
- `PUT /api/products/:id` - Cập nhật sản phẩm
- `DELETE /api/products/:id` - Xóa sản phẩm

## Frontend Architecture

### Component Hierarchy

```
App
 Router
    Header (Global)
    Routes
       Home
       Login
       AdminDashboard
          MembersTable
          ProductsTable
          ...
       ...
    Footer (Global)
```

### State Management

- **Local State**: `useState` cho component state
- **Context API**: `ItemExportContext` cho shared state
- **LocalStorage**: Cho authentication và user preferences

### Routing

Sử dụng **React Router DOM v7** với:
- Lazy loading components
- Protected routes
- Dynamic routes với parameters

## Performance Optimizations

1. **Code Splitting**: Lazy load components
2. **Image Optimization**: Compressed images, lazy loading
3. **Database Indexing**: Indexes trên các cột thường query
4. **Caching**: Browser caching cho static assets
5. **Compression**: Gzip compression cho responses

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **File Upload**: Multer
- **CORS**: cors middleware

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Routing**: React Router DOM 7
- **HTTP Client**: Axios
- **Icons**: Font Awesome
- **Charts**: Chart.js + react-chartjs-2

### DevOps
- **Containerization**: Docker
- **Web Server**: Nginx (production)
- **Process Manager**: PM2 (optional)

## Scalability Considerations

### Current Limitations
- SQLite database (single file)
- Single server instance
- No load balancing

### Future Improvements
- Migrate to PostgreSQL/MySQL
- Implement Redis caching
- Add load balancing
- Microservices architecture
- CDN for static assets

---

**Tài liệu này được cập nhật thường xuyên. Vui lòng kiểm tra lại khi có thay đổi lớn trong kiến trúc.**

