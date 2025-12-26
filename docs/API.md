# Tài Liệu API - DHL Shipping

Tài liệu đầy đủ về REST API của DHL Shipping Backend.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

Hầu hết các endpoints yêu cầu authentication thông qua headers:

### Admin Authentication
```
admin-id: <admin_id>
```

### Staff Authentication
```
staff-id: <staff_id>
```

### Member Authentication
Được xử lý qua cookies/localStorage ở frontend.

## Endpoints

### Health Check

#### GET /health
Kiểm tra trạng thái server.

**Response:**
```json
{
  "status": "OK",
  "message": "DHL Backend API is running"
}
```

---

### Members (Thành Viên)

#### GET /api/members
Lấy danh sách tất cả thành viên.

**Headers:**
- `admin-id` (required)

**Response:**
```json
[
  {
    "id": 1,
    "username": "user123",
    "balance": 1000.50,
    "credit_score": 100,
    "status": "active",
    "created_at": "2025-01-01 00:00:00"
  }
]
```

#### GET /api/members/:id
Lấy thông tin một thành viên.

**Headers:**
- `admin-id` (required)

#### POST /api/admin/members
Tạo thành viên mới.

**Headers:**
- `admin-id` (required)

**Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "balance": 0,
  "credit_score": 100
}
```

#### PUT /api/admin/members/:id
Cập nhật thông tin thành viên.

**Headers:**
- `admin-id` (required)

#### DELETE /api/admin/members/:id
Xóa thành viên.

**Headers:**
- `admin-id` (required)

#### PUT /api/admin/members/:id/status
Cập nhật trạng thái thành viên.

**Headers:**
- `admin-id` (required)

**Body:**
```json
{
  "status": "frozen"
}
```

---

### Products (Sản Phẩm)

#### GET /api/products
Lấy danh sách tất cả sản phẩm.

**Query Parameters:**
- `search` (optional): Tìm kiếm theo tên

**Response:**
```json
[
  {
    "id": 1,
    "name": "Product Name",
    "product_code": "PROD001",
    "price": 99.99,
    "image": "/uploads/products/image.jpg",
    "description": "Product description"
  }
]
```

#### GET /api/products/:id
Lấy thông tin một sản phẩm.

#### POST /api/products
Tạo sản phẩm mới.

**Headers:**
- `admin-id` (required)

**Body (multipart/form-data):**
- `name` (required)
- `product_code` (required, unique)
- `price` (required)
- `description` (optional)
- `image` (optional, file)

#### PUT /api/products/:id
Cập nhật sản phẩm.

**Headers:**
- `admin-id` (required)

#### DELETE /api/products/:id
Xóa sản phẩm.

**Headers:**
- `admin-id` (required)

#### GET /api/products/search
Tìm kiếm sản phẩm.

**Query Parameters:**
- `q` (required): Từ khóa tìm kiếm

---

### Categories (Danh Mục)

#### GET /api/categories
Lấy danh sách tất cả danh mục.

#### POST /api/categories
Tạo danh mục mới.

**Headers:**
- `admin-id` (required)

**Body:**
```json
{
  "name": "Category Name",
  "quantity": 10,
  "status": "active",
  "description": "Category description",
  "image": "image_url"
}
```

#### PUT /api/categories/:id
Cập nhật danh mục.

**Headers:**
- `admin-id` (required)

#### DELETE /api/categories/:id
Xóa danh mục.

**Headers:**
- `admin-id` (required)

---

### Category Items (Polls - Bình Chọn)

#### GET /api/category-items
Lấy danh sách tất cả items trong danh mục.

**Query Parameters:**
- `category_id` (optional): Lọc theo category

#### POST /api/category-items
Tạo item mới.

**Headers:**
- `admin-id` (required)

**Body:**
```json
{
  "category_id": 1,
  "title": "Item Title",
  "reward_rate": "1.5,2.0,3.0",
  "image": "image_url",
  "content": "Content",
  "balance_required": 100,
  "item_key": "KEY001",
  "game": 1,
  "status": "active"
}
```

#### PUT /api/category-items/:id
Cập nhật item.

**Headers:**
- `admin-id` (required)

#### DELETE /api/category-items/:id
Xóa item.

**Headers:**
- `admin-id` (required)

---

### Authentication

#### POST /api/admin/login
Đăng nhập admin.

**Body:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "adminId": 1,
  "message": "Đăng nhập thành công"
}
```

#### POST /api/staff/login
Đăng nhập staff.

**Body:**
```json
{
  "username": "staff",
  "password": "password"
}
```

#### POST /api/members/login
Đăng nhập thành viên.

**Body:**
```json
{
  "username": "user123",
  "password": "password"
}
```

---

### Transactions (Giao Dịch)

#### GET /api/transactions
Lấy danh sách giao dịch.

**Headers:**
- `admin-id` hoặc `staff-id` (required)

**Query Parameters:**
- `member_id` (optional): Lọc theo thành viên
- `type` (optional): 'deposit', 'withdrawal', 'order'

#### POST /api/transactions
Tạo giao dịch mới.

**Headers:**
- `admin-id` (required)

**Body:**
```json
{
  "member_id": 1,
  "type": "deposit",
  "amount": 1000,
  "status": "completed"
}
```

---

### News (Tin Tức)

#### GET /api/news
Lấy danh sách tin tức.

#### GET /api/news/:id
Lấy chi tiết tin tức.

#### POST /api/news
Tạo tin tức mới.

**Body:**
```json
{
  "title": "News Title",
  "content": "News content",
  "image": "image_url",
  "author": "Author Name"
}
```

---

### Services (Dịch Vụ)

#### GET /api/services
Lấy danh sách dịch vụ.

#### GET /api/services/:id
Lấy chi tiết dịch vụ.

#### POST /api/services
Tạo dịch vụ mới.

**Body:**
```json
{
  "name": "Service Name",
  "description": "Service description",
  "icon": "",
  "price": 50.00,
  "category": "shipping"
}
```

---

### Orders (Đơn Hàng)

#### GET /api/orders
Lấy danh sách đơn hàng.

**Headers:**
- `admin-id` hoặc `staff-id` (required)

#### GET /api/orders/:id
Lấy chi tiết đơn hàng.

#### POST /api/orders
Tạo đơn hàng mới.

**Body:**
```json
{
  "order_number": "ORD001",
  "member_id": 1,
  "status": "pending",
  "total_amount": 99.99
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "success": false
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## File Upload

### Upload Product Image

**Endpoint:** `POST /api/products`

**Content-Type:** `multipart/form-data`

**Fields:**
- `name` (text)
- `product_code` (text)
- `price` (number)
- `description` (text, optional)
- `image` (file, optional)

**File Restrictions:**
- Max size: 5MB
- Allowed types: jpeg, jpg, png, gif, webp

## Examples

### cURL Examples

#### Get Products
```bash
curl http://localhost:5000/api/products
```

#### Create Product (with image)
```bash
curl -X POST http://localhost:5000/api/products \
  -H "admin-id: 1" \
  -F "name=New Product" \
  -F "product_code=PROD001" \
  -F "price=99.99" \
  -F "image=@/path/to/image.jpg"
```

#### Admin Login
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

#### Get Members (with auth)
```bash
curl http://localhost:5000/api/members \
  -H "admin-id: 1"
```

## Testing

Sử dụng Postman, Insomnia, hoặc cURL để test API.

### Postman Collection
Có thể import các endpoints vào Postman để test dễ dàng hơn.

---

**Lưu ý:** Một số endpoints có thể yêu cầu authentication. Vui lòng đăng nhập trước khi sử dụng.

