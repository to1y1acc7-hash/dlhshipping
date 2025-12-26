# Database Schema - DHL Shipping

Tài liệu chi tiết về cấu trúc cơ sở dữ liệu SQLite của DHL Shipping.

## Tổng Quan

Hệ thống sử dụng **SQLite3** làm database. File database được lưu tại:
```
backend/database/database.sqlite
```

## Các Bảng

### 1. members - Thành Viên

Lưu trữ thông tin thành viên/khách hàng.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| id | INTEGER PRIMARY KEY | ID thành viên |
| username | TEXT UNIQUE | Tên đăng nhập |
| password | TEXT | Mật khẩu (hashed) |
| balance | REAL | Số dư tài khoản |
| credit_score | INTEGER | Điểm tín dụng |
| min_withdrawal | REAL | Số tiền rút tối thiểu |
| max_withdrawal | REAL | Số tiền rút tối đa |
| vip_level | INTEGER | Cấp độ VIP |
| bank_name | TEXT | Tên ngân hàng |
| bank_account_number | TEXT | Số tài khoản |
| bank_account_holder | TEXT | Tên chủ tài khoản |
| status | TEXT | Trạng thái: 'active', 'inactive', 'frozen' |
| withdrawal_enabled | INTEGER | Cho phép rút tiền (0/1) |
| login_time | TEXT | Thời gian đăng nhập cuối |
| created_at | TEXT | Ngày tạo |

**Indexes:**
- `username` (UNIQUE)
- `status`

### 2. admins - Quản Trị Viên

Lưu trữ thông tin admin.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| id | INTEGER PRIMARY KEY | ID admin |
| username | TEXT UNIQUE | Tên đăng nhập |
| password | TEXT | Mật khẩu (hashed) |
| status | TEXT | Trạng thái: 'active', 'inactive' |
| created_at | TEXT | Ngày tạo |

**Indexes:**
- `username` (UNIQUE)

### 3. staff - Nhân Viên

Lưu trữ thông tin nhân viên.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| id | INTEGER PRIMARY KEY | ID nhân viên |
| username | TEXT UNIQUE | Tên đăng nhập |
| password | TEXT | Mật khẩu (hashed) |
| status | TEXT | Trạng thái: 'active', 'inactive' |
| created_at | TEXT | Ngày tạo |

**Indexes:**
- `username` (UNIQUE)

### 4. products - Sản Phẩm

Lưu trữ thông tin sản phẩm.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| id | INTEGER PRIMARY KEY | ID sản phẩm |
| name | TEXT | Tên sản phẩm |
| product_code | TEXT UNIQUE | Mã sản phẩm |
| price | REAL | Giá |
| image | TEXT | Đường dẫn hình ảnh |
| description | TEXT | Mô tả |
| created_at | TEXT | Ngày tạo |

**Indexes:**
- `product_code` (UNIQUE)
- `name`

### 5. categories - Danh Mục

Lưu trữ các danh mục.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| id | INTEGER PRIMARY KEY | ID danh mục |
| name | TEXT UNIQUE | Tên danh mục |
| quantity | INTEGER | Số lượng |
| status | TEXT | Trạng thái: 'active', 'inactive' |
| description | TEXT | Mô tả |
| image | TEXT | Đường dẫn hình ảnh |
| created_at | TEXT | Ngày tạo |

**Indexes:**
- `name` (UNIQUE)
- `status`

### 6. category_items - Mục Trong Danh Mục (Polls)

Lưu trữ các mục trong danh mục (bình chọn).

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| id | INTEGER PRIMARY KEY | ID mục |
| category_id | INTEGER | ID danh mục (FK) |
| title | TEXT | Tiêu đề |
| reward_rate | TEXT | Tỷ lệ thưởng (CSV) |
| image | TEXT | Đường dẫn hình ảnh |
| content | TEXT | Nội dung |
| balance_required | REAL | Số dư yêu cầu |
| item_key | TEXT | Key của mục |
| game | INTEGER | Trò chơi |
| status | TEXT | Trạng thái: 'active', 'inactive' |
| created_at | TEXT | Ngày tạo |

**Indexes:**
- `category_id`
- `status`

**Foreign Keys:**
- `category_id` → `categories.id`

### 7. orders - Đơn Hàng

Lưu trữ thông tin đơn hàng.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| id | INTEGER PRIMARY KEY | ID đơn hàng |
| order_number | TEXT UNIQUE | Số đơn hàng |
| member_id | INTEGER | ID thành viên (FK) |
| status | TEXT | Trạng thái |
| total_amount | REAL | Tổng tiền |
| created_at | TEXT | Ngày tạo |

**Indexes:**
- `order_number` (UNIQUE)
- `member_id`
- `status`

**Foreign Keys:**
- `member_id` → `members.id`

### 8. transactions - Giao Dịch

Lưu trữ các giao dịch.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| id | INTEGER PRIMARY KEY | ID giao dịch |
| member_id | INTEGER | ID thành viên (FK) |
| type | TEXT | Loại: 'deposit', 'withdrawal', 'order' |
| amount | REAL | Số tiền |
| status | TEXT | Trạng thái |
| description | TEXT | Mô tả |
| created_at | TEXT | Ngày tạo |

**Indexes:**
- `member_id`
- `type`
- `status`
- `created_at`

**Foreign Keys:**
- `member_id` → `members.id`

### 9. services - Dịch Vụ

Lưu trữ các dịch vụ vận chuyển.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| id | INTEGER PRIMARY KEY | ID dịch vụ |
| name | TEXT | Tên dịch vụ |
| description | TEXT | Mô tả |
| icon | TEXT | Icon emoji |
| price | REAL | Giá |
| category | TEXT | Danh mục |
| created_at | TEXT | Ngày tạo |

### 10. news - Tin Tức

Lưu trữ tin tức.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| id | INTEGER PRIMARY KEY | ID tin tức |
| title | TEXT | Tiêu đề |
| content | TEXT | Nội dung |
| image | TEXT | Đường dẫn hình ảnh |
| author | TEXT | Tác giả |
| created_at | TEXT | Ngày tạo |

### 11. tracking - Vận Đơn

Lưu trữ thông tin tracking.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| id | INTEGER PRIMARY KEY | ID tracking |
| tracking_number | TEXT UNIQUE | Mã vận đơn |
| status | TEXT | Trạng thái |
| location | TEXT | Vị trí |
| description | TEXT | Mô tả |
| created_at | TEXT | Ngày tạo |
| updated_at | TEXT | Ngày cập nhật |

**Indexes:**
- `tracking_number` (UNIQUE)

## Quan Hệ Giữa Các Bảng

```
members
   orders (member_id)
   transactions (member_id)

categories
   category_items (category_id)

orders
   transactions (có thể liên kết)
```

## SQL Queries Mẫu

### Lấy Thành Viên Và Số Dư
```sql
SELECT 
  id, 
  username, 
  balance, 
  status 
FROM members 
WHERE status = 'active';
```

### Lấy Đơn Hàng Của Thành Viên
```sql
SELECT 
  o.*,
  m.username 
FROM orders o
JOIN members m ON o.member_id = m.id
WHERE m.id = ?;
```

### Lấy Tổng Giao Dịch Theo Loại
```sql
SELECT 
  type,
  SUM(amount) as total
FROM transactions
WHERE member_id = ?
GROUP BY type;
```

### Lấy Sản Phẩm Có Giá Cao Nhất
```sql
SELECT * 
FROM products 
ORDER BY price DESC 
LIMIT 10;
```

## Database Operations

### Backup Database
```bash
cp backend/database/database.sqlite backups/database-$(date +%Y%m%d).sqlite
```

### Restore Database
```bash
cp backups/database-YYYYMMDD.sqlite backend/database/database.sqlite
```

### Vacuum Database (Optimize)
```sql
VACUUM;
```

### Analyze Database (Update Statistics)
```sql
ANALYZE;
```

## Database Statistics

Để xem thông tin về database:

```sql
-- Xem tất cả tables
SELECT name FROM sqlite_master WHERE type='table';

-- Xem schema của table
.schema table_name

-- Xem số lượng records
SELECT COUNT(*) FROM table_name;
```

## Security Notes

1. **Passwords**: Luôn hash passwords trước khi lưu vào database
2. **SQL Injection**: Sử dụng parameterized queries
3. **Backup**: Backup database thường xuyên
4. **Permissions**: Giới hạn quyền truy cập database

## Performance Tips

1. **Indexes**: Đảm bảo có indexes trên các cột thường query
2. **WAL Mode**: Sử dụng WAL mode cho concurrency tốt hơn
3. **Connection Pooling**: Sử dụng connection pooling
4. **Query Optimization**: Tối ưu các queries phức tạp

---

**Lưu ý:** Database schema có thể thay đổi theo thời gian. Luôn kiểm tra schema hiện tại trước khi thực hiện migrations.

