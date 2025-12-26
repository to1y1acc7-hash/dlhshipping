# Cấu Hình Hệ Thống - DHL Shipping

Tài liệu về các cấu hình và biến môi trường của hệ thống.

## Backend Configuration

### Environment Variables

Tạo file `.env` trong thư mục `backend/`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_PATH=./database/database.sqlite

# Security
SESSION_SECRET=your-session-secret-key-here
JWT_SECRET=your-jwt-secret-key-here

# CORS
CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# API Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Server Configuration (server.js)

```javascript
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
```

### Database Configuration (database/db.js)

```javascript
const dbPath = process.env.DATABASE_PATH || './database/database.sqlite';
```

## Frontend Configuration

### Vite Configuration (vite.config.js)

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  }
});
```

### Environment Variables (Frontend)

Tạo file `.env` trong thư mục `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=DHL Shipping
VITE_APP_VERSION=1.0.0
```

Sử dụng trong code:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

## Docker Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    volumes:
      - ./backend/database:/app/database
      - ./backend/uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Backend Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Nginx Configuration

### Production Nginx Config

File: `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Security Configuration

### CORS Configuration

Backend (`server.js`):
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

### File Upload Limits

```javascript
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});
```

## Database Configuration

### SQLite Settings

```javascript
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    // Set WAL mode for better concurrency
    db.run('PRAGMA journal_mode = WAL');
  }
});
```

## API Configuration

### Base URL Configuration

Frontend (`src/App.jsx` hoặc các components):
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

### Request Timeout

```javascript
// Axios configuration
axios.defaults.timeout = 30000; // 30 seconds
```

## Logging Configuration

### Console Logging Levels

```javascript
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};
```

## Cache Configuration

### Browser Cache Headers

```javascript
app.use((req, res, next) => {
  if (req.path.startsWith('/uploads')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  next();
});
```

## Responsive Breakpoints

Frontend CSS:
```css
/* Mobile */
@media (max-width: 768px) { }

/* Tablet */
@media (min-width: 769px) and (max-width: 1199px) { }

/* Desktop */
@media (min-width: 1200px) { }
```

## Theme Configuration

### Colors

```css
:root {
  --primary-color: #DC3545;
  --secondary-color: #FFCC00;
  --text-color: #2c2c2c;
  --bg-color: #f8f9fa;
}
```

## Build Configuration

### Production Build

```bash
# Frontend
cd frontend
npm run build

# Output: frontend/dist/
```

### Build Optimization

```javascript
// vite.config.js
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true
    }
  }
}
```

## Debug Configuration

### Development Mode

```javascript
if (process.env.NODE_ENV === 'development') {
  console.log(' Development mode enabled');
  // Enable detailed logging
}
```

### Production Mode

```javascript
if (process.env.NODE_ENV === 'production') {
  // Disable console logs
  // Enable error tracking
  // Enable performance monitoring
}
```

---

**Lưu ý:** Không commit file `.env` vào Git. Sử dụng `.env.example` làm template.

