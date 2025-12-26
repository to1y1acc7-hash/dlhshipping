# DHL Shipping - Frontend

Frontend React application cho DHL Shipping, được xây dựng với Vite và React 19.

## 🚀 Chạy Frontend (Không cần Backend)

Frontend có thể chạy độc lập với mock data:

```bash
cd frontend
npm run dev
```

Mở trình duyệt tại: `http://localhost:5173`

## 📦 Dependencies

- React 19.2.0
- React Router DOM 6.8.0
- Axios (optional, chỉ khi cần kết nối backend)
- Vite 7.2.4

## 🎨 Features

- ✅ Trang chủ với Hero Banner carousel
- ✅ Hiển thị dịch vụ vận chuyển
- ✅ Tin tức và cập nhật
- ✅ Responsive design
- ✅ Mock data để phát triển không cần backend

## 📁 Cấu trúc

```
frontend/
├── public/           # Static files
├── src/
│   ├── components/  # React components
│   │   ├── Header.jsx
│   │   ├── HeroBanner.jsx
│   │   └── Footer.jsx
│   ├── pages/       # Page components
│   │   └── Home.jsx
│   ├── data/        # Mock data
│   │   └── mockData.js
│   ├── App.jsx      # Main App
│   └── main.jsx     # Entry point
└── vite.config.js   # Vite config
```

## 🔧 Development

### Chạy development server:
```bash
npm run dev
```

### Build production:
```bash
npm run build
```

### Preview production build:
```bash
npm run preview
```

### Lint code:
```bash
npm run lint
```

## 📝 Mock Data

Frontend sử dụng mock data từ `src/data/mockData.js`:
- `mockServices` - 6 dịch vụ mẫu
- `mockNews` - 3 tin tức mẫu

Khi backend sẵn sàng, có thể uncomment code API trong `Home.jsx` để sử dụng real data.

## 🎯 Kết nối với Backend

Khi backend đang chạy, frontend sẽ tự động kết nối qua proxy đã được cấu hình trong `vite.config.js`:

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

## 🌐 Routes

- `/` - Trang chủ
- `/gioi-thieu` - Giới thiệu
- `/dich-vu` - Dịch vụ
- `/tin-tuc` - Tin tức
- `/hang-order` - Hàng Order
- `/tracking` - Tracking

## 📱 Responsive

Ứng dụng được thiết kế responsive cho:
- Desktop (1920px+)
- Tablet (768px - 1919px)
- Mobile (< 768px)

## 🎨 Styling

- CSS Modules
- Responsive design
- DHL brand colors:
  - Yellow: #FFCC00
  - Red: #D40511
  - Dark Gray: #2c2c2c
