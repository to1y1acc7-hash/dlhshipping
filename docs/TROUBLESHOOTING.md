# Troubleshooting Guide - Hướng dẫn xử lý lỗi

## Các lỗi thường gặp và cách khắc phục

### 1.  Lỗi: Cannot connect to API / Network Error

**Triệu chứng:**
- Console hiển thị: `Error fetching services: Network Error`
- Không load được dữ liệu từ backend

**Giải pháp:**

#### Kiểm tra Backend có đang chạy:
```bash
# Terminal 1
cd backend
npm start
# hoặc
npm run dev
```

#### Kiểm tra port:
```bash
# Kiểm tra port 5000 có đang được sử dụng
netstat -ano | findstr "5000"
```

#### Kiểm tra CORS:
Đảm bảo trong `backend/server.js` có:
```javascript
app.use(cors());
```

#### Kiểm tra Proxy:
Đảm bảo trong `frontend/vite.config.js` có:
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

---

### 2.  Lỗi: Port already in use

**Triệu chứng:**
- `Error: listen EADDRINUSE: address already in use :::5000`

**Giải pháp:**

#### Tìm và kill process:
```bash
# Tìm process đang dùng port 5000
netstat -ano | findstr "5000"

# Kill process (thay PID bằng số process ID)
taskkill /PID <PID> /F
```

#### Hoặc đổi port:
Tạo file `backend/.env`:
```env
PORT=5001
```

---

### 3.  Lỗi: Database not found / SQLite Error

**Triệu chứng:**
- `Error: SQLITE_CANTOPEN: unable to open database file`
- `Database initialized successfully` nhưng không có dữ liệu

**Giải pháp:**

#### Khởi tạo lại database:
```bash
cd backend
# Xóa database cũ (nếu có)
rm database/database.sqlite

# Khởi tạo lại
npm run init-data
```

#### Kiểm tra quyền truy cập:
Đảm bảo thư mục `backend/database/` có quyền ghi.

---

### 4.  Lỗi: Module not found / Cannot find module

**Triệu chứng:**
- `Error: Cannot find module 'react-router-dom'`
- `Error: Cannot find module 'axios'`

**Giải pháp:**

#### Cài đặt lại dependencies:
```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd ../backend
rm -rf node_modules package-lock.json
npm install
```

---

### 5.  Lỗi: React Router không hoạt động

**Triệu chứng:**
- Click vào link nhưng không chuyển trang
- URL thay đổi nhưng nội dung không đổi

**Giải pháp:**

#### Kiểm tra BrowserRouter:
Đảm bảo trong `App.jsx`:
```jsx
import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      {/* ... */}
    </Router>
  );
}
```

#### Kiểm tra Routes:
Đảm bảo có `<Routes>` và `<Route>` components.

---

### 6.  Lỗi: CORS Error

**Triệu chứng:**
- `Access to XMLHttpRequest has been blocked by CORS policy`
- `No 'Access-Control-Allow-Origin' header`

**Giải pháp:**

#### Kiểm tra backend CORS:
```javascript
// backend/server.js
const cors = require('cors');
app.use(cors()); // Phải đặt trước routes
```

#### Kiểm tra thứ tự middleware:
```javascript
app.use(cors());
app.use(bodyParser.json());
app.use('/api', apiRoutes);
```

---

### 7.  Lỗi: Blank page / White screen

**Triệu chứng:**
- Trang web hiển thị trắng
- Console có lỗi JavaScript

**Giải pháp:**

#### Kiểm tra Console:
Mở Developer Tools (F12) và kiểm tra Console tab.

#### Kiểm tra import paths:
Đảm bảo các import paths đúng:
```jsx
import Header from './components/Header';
import Home from './pages/Home';
```

#### Kiểm tra file tồn tại:
Đảm bảo tất cả files được import đều tồn tại.

---

### 8.  Lỗi: Vite HMR không hoạt động

**Triệu chứng:**
- Thay đổi code nhưng không tự động reload

**Giải pháp:**

#### Restart dev server:
```bash
# Dừng server (Ctrl+C)
# Chạy lại
cd frontend
npm run dev
```

#### Clear cache:
```bash
rm -rf node_modules/.vite
npm run dev
```

---

### 9.  Lỗi: Styling không áp dụng

**Triệu chứng:**
- CSS không được áp dụng
- Component không có style

**Giải pháp:**

#### Kiểm tra import CSS:
```jsx
import './Home.css';
import './Header.css';
```

#### Kiểm tra class names:
Đảm bảo class names trong JSX khớp với CSS.

---

### 10.  Lỗi: API trả về 404

**Triệu chứng:**
- `GET http://localhost:5000/api/services 404 (Not Found)`

**Giải pháp:**

#### Kiểm tra routes:
Đảm bảo trong `backend/routes/api.js` có:
```javascript
router.get('/services', async (req, res) => {
  // ...
});
```

#### Kiểm tra server.js:
```javascript
app.use('/api', apiRoutes);
```

---

## Debug Checklist

Khi gặp lỗi, kiểm tra theo thứ tự:

- [ ] Backend server có đang chạy? (`http://localhost:5000/health`)
- [ ] Frontend server có đang chạy? (`http://localhost:5173`)
- [ ] Database đã được khởi tạo? (`npm run init-data`)
- [ ] Dependencies đã được cài đặt? (`npm install`)
- [ ] Port không bị conflict? (kiểm tra với `netstat`)
- [ ] Console có lỗi? (F12 → Console tab)
- [ ] Network requests thành công? (F12 → Network tab)
- [ ] CORS được cấu hình đúng?

---

## Cần hỗ trợ?

1. Kiểm tra file này trước
2. Kiểm tra README.md
3. Kiểm tra console errors
4. Tạo issue với:
   - Mô tả lỗi chi tiết
   - Screenshot (nếu có)
   - Console errors
   - Steps to reproduce

---

## Quick Fix Commands

```bash
# Restart cả hai servers
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev

# Reset database
cd backend
rm database/database.sqlite
npm run init-data

# Reinstall dependencies
cd frontend && rm -rf node_modules && npm install
cd ../backend && rm -rf node_modules && npm install
```

