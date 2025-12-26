# Hướng Dẫn Phát Triển - DHL Shipping

Hướng dẫn cho nhà phát triển về quy trình làm việc, coding standards, và best practices.

## Bắt Đầu Phát Triển

### Setup Development Environment

1. **Clone và cài đặt** (xem [INSTALLATION.md](INSTALLATION.md))

2. **Chạy development servers:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

3. **Mở trình duyệt:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Coding Standards

### JavaScript/React

#### Naming Conventions
- **Components**: PascalCase (`AdminDashboard.jsx`)
- **Functions**: camelCase (`handleSubmit`, `getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Files**: camelCase cho utilities, PascalCase cho components

#### Code Style
```javascript
//  Good
const handleClick = () => {
  setState(newValue);
};

//  Bad
const handleClick=()=>{setState(newValue)};
```

#### Component Structure
```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 2. Constants
const API_BASE_URL = '/api';

// 3. Component
const MyComponent = () => {
  // 4. State
  const [data, setData] = useState(null);
  
  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 6. Handlers
  const handleSubmit = () => {
    // Handler logic
  };
  
  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

### CSS

#### Naming
- Use descriptive class names
- Follow BEM-like naming: `.component-name`, `.component-name__element`, `.component-name--modifier`

```css
/*  Good */
.member-table { }
.member-table__row { }
.member-table__row--highlighted { }

/*  Bad */
.table { }
.row { }
.highlight { }
```

#### Organization
```css
/* 1. Component container */
.component-name {
  /* Layout */
  /* Spacing */
  /* Colors */
  /* Typography */
}

/* 2. Elements */
.component-name__element { }

/* 3. Modifiers */
.component-name--modifier { }

/* 4. Responsive */
@media (max-width: 768px) { }
```

## Git Workflow

### Branch Naming
- `feature/feature-name` - Tính năng mới
- `bugfix/bug-name` - Sửa lỗi
- `hotfix/issue-name` - Sửa lỗi khẩn cấp
- `refactor/component-name` - Refactor code

### Commit Messages
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: Tính năng mới
- `fix`: Sửa lỗi
- `docs`: Tài liệu
- `style`: Formatting
- `refactor`: Refactor code
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```
feat(admin): add member deletion functionality

fix(products): resolve image upload error

docs(api): update API documentation
```

## Testing

### Manual Testing Checklist

#### Frontend
- [ ] Component renders correctly
- [ ] User interactions work
- [ ] Responsive design works
- [ ] Forms validate properly
- [ ] Error handling works
- [ ] Loading states display

#### Backend
- [ ] API endpoints return correct data
- [ ] Authentication works
- [ ] Error handling works
- [ ] File uploads work
- [ ] Database operations work

### Testing API với cURL

```bash
# Test GET endpoint
curl http://localhost:5000/api/products

# Test POST endpoint
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "admin-id: 1" \
  -d '{"name":"Test","product_code":"TEST001","price":99.99}'
```

## Debugging

### Frontend Debugging

#### React DevTools
- Install React DevTools browser extension
- Inspect component state and props
- Check component hierarchy

#### Console Logging
```javascript
//  Good - Use descriptive logs
console.log(' Loading products...', { categoryId, page });

//  Bad
console.log('test');
```

#### Network Tab
- Check API requests/responses
- Verify headers
- Check for CORS errors

### Backend Debugging

#### Console Logging
```javascript
//  Good
console.log(' Admin login attempt:', { username });
console.error(' Database error:', error);

//  Bad
console.log('error');
```

#### Database Inspection
```bash
# SQLite CLI
sqlite3 backend/database/database.sqlite

# Run queries
SELECT * FROM members;
SELECT * FROM products;
```

## Adding New Features

### 1. Planning
- [ ] Define requirements
- [ ] Design database schema (if needed)
- [ ] Plan API endpoints
- [ ] Design UI/UX

### 2. Backend Development
- [ ] Create database tables (if needed)
- [ ] Add API endpoints
- [ ] Add authentication/authorization
- [ ] Test endpoints

### 3. Frontend Development
- [ ] Create components
- [ ] Add routing
- [ ] Connect to API
- [ ] Style components
- [ ] Add error handling

### 4. Testing
- [ ] Test functionality
- [ ] Test edge cases
- [ ] Test responsive design
- [ ] Test error scenarios

### 5. Documentation
- [ ] Update API docs
- [ ] Update README if needed
- [ ] Add code comments

## Code Review Checklist

### Backend
- [ ] Code follows naming conventions
- [ ] Error handling is proper
- [ ] Authentication/authorization is correct
- [ ] SQL queries are safe (no SQL injection)
- [ ] API responses are consistent
- [ ] File uploads are validated

### Frontend
- [ ] Code follows naming conventions
- [ ] Components are reusable
- [ ] Error handling is proper
- [ ] Loading states are handled
- [ ] Responsive design works
- [ ] No console errors
- [ ] Performance is acceptable

## Useful Resources

### React
- [React Documentation](https://react.dev/)
- [React Router Documentation](https://reactrouter.com/)

### Node.js/Express
- [Express Documentation](https://expressjs.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

### Tools
- [Vite Documentation](https://vitejs.dev/)
- [Axios Documentation](https://axios-http.com/)

## Common Issues & Solutions

### Issue: CORS Error
**Solution:** Check backend CORS configuration in `server.js`

### Issue: Port Already in Use
**Solution:** Change port in `.env` or `vite.config.js`

### Issue: Module Not Found
**Solution:** 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database Locked
**Solution:** Close all database connections, restart server

### Issue: Image Upload Fails
**Solution:** 
- Check file size (max 5MB)
- Check file type (jpeg, jpg, png, gif, webp)
- Check uploads directory permissions

## Performance Tips

### Frontend
- Use lazy loading for routes
- Optimize images
- Minimize re-renders
- Use React.memo for expensive components
- Code splitting

### Backend
- Add database indexes
- Use pagination for large datasets
- Cache frequently accessed data
- Optimize SQL queries
- Compress responses

## Documentation Standards

### Code Comments
```javascript
/**
 * Tính tổng số tiền từ danh sách giao dịch
 * @param {Array} transactions - Mảng các giao dịch
 * @returns {number} Tổng số tiền
 */
const calculateTotal = (transactions) => {
  // Implementation
};
```

### API Documentation
- Document all endpoints
- Include request/response examples
- Document authentication requirements
- Document error responses

## Security Best Practices

1. **Never commit secrets**
   - Use `.env` files
   - Keep sensitive files private

2. **Validate input**
   - Sanitize user input
   - Validate file uploads
   - Check data types

3. **Use parameterized queries**
   - Prevent SQL injection
   - Use prepared statements

4. **Implement proper authentication**
   - Hash passwords
   - Use secure sessions
   - Validate tokens

---

**Happy Coding! **

