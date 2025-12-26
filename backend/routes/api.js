const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');

// Cấu hình multer cho upload ảnh sản phẩm
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/products');
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique: timestamp + random + extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

// Chỉ chấp nhận file ảnh
const fileFilter = (req, file, cb) => {
  // Nếu không có file, cho phép (cho upload.optional)
  if (!file) {
    return cb(null, true);
  }
  
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Middleware để xử lý upload file optional (file có thể không có)
const uploadOptional = (fieldName) => {
  return (req, res, next) => {
    const uploadSingle = upload.single(fieldName);
    uploadSingle(req, res, (err) => {
      // Nếu có lỗi và không phải là lỗi "no file", trả về lỗi
      if (err && err.code !== 'LIMIT_UNEXPECTED_FILE') {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ error: err.message });
        }
        return res.status(400).json({ error: err.message || 'Lỗi khi upload file' });
      }
      // Nếu không có file hoặc có file, đều tiếp tục
      next();
    });
  };
};

// Error handler cho multer - đặt sau khi định nghĩa upload
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('Multer/Upload error:', err);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message || 'Lỗi khi upload file' });
  }
  next();
};

// Middleware to check if user is admin (not staff)
const requireAdmin = async (req, res, next) => {
  try {
    const adminId = req.headers['admin-id'] || req.query.adminId;
    const staffId = req.headers['staff-id'] || req.query.staffId;
    
    // If staff ID is provided, deny access
    if (staffId) {
      return res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền thực hiện thao tác này' });
    }
    
    // If admin ID is provided, allow access
    if (adminId) {
      const admin = await db.getAdminById(parseInt(adminId));
      if (admin && admin.status === 'active') {
        return next();
      }
    }
    
    // For now, allow if no ID is provided (backward compatibility)
    // In production, you should require authentication
    next();
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
};

// Middleware to check if user is admin or staff
const requireAdminOrStaff = async (req, res, next) => {
  try {
    const adminId = req.headers['admin-id'] || req.query.adminId;
    const staffId = req.headers['staff-id'] || req.query.staffId;
    
    if (adminId) {
      const admin = await db.getAdminById(parseInt(adminId));
      if (admin && admin.status === 'active') {
        return next();
      }
    }
    
    if (staffId) {
      const staff = await db.getStaffById(parseInt(staffId));
      if (staff && staff.status === 'active') {
        return next();
      }
    }
    
    // For now, allow if no ID is provided (backward compatibility)
    next();
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
};

// ========== SERVICES ROUTES ==========
router.get('/services', async (req, res) => {
  try {
    const services = await db.getAllServices();
    res.json(services);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

router.get('/services/:id', async (req, res) => {
  try {
    const service = await db.getServiceById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

router.post('/services', async (req, res) => {
  try {
    const { name, description, icon, price, category } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Service name is required' });
    }
    const service = await db.createService(name, description, icon, price, category);
    res.status(201).json(service);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ========== NEWS ROUTES ==========
router.get('/news', async (req, res) => {
  try {
    const news = await db.getAllNews();
    res.json(news);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

router.get('/news/:id', async (req, res) => {
  try {
    const newsItem = await db.getNewsById(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ error: 'News not found' });
    }
    res.json(newsItem);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

router.post('/news', async (req, res) => {
  try {
    const { title, content, image, author } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const newsItem = await db.createNews(title, content, image, author);
    res.status(201).json(newsItem);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ========== CATEGORY ROUTES ==========
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.getAllCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categories', requireAdmin, async (req, res) => {
  try {
    const { name, quantity, status, description, image } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên danh mục là bắt buộc' });
    }

    const qty = Number.isFinite(Number(quantity)) ? parseInt(quantity, 10) : 0;
    const normalizedStatus = status === 'inactive' ? 'inactive' : 'active';

    const category = await db.createCategory(name, qty, normalizedStatus, description, image);
    res.status(201).json(category);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed: categories.name')) {
      return res.status(400).json({ error: 'Tên danh mục đã tồn tại' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getCategoryById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Danh mục không tồn tại' });
    }

    const { name, quantity, status, description, image } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên danh mục là bắt buộc' });
    }

    const qty = Number.isFinite(Number(quantity)) ? parseInt(quantity, 10) : existing.quantity || 0;
    const normalizedStatus = status === 'inactive' ? 'inactive' : 'active';

    const updated = await db.updateCategory(id, name, qty, normalizedStatus, description, image);
    res.json(updated);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed: categories.name')) {
      return res.status(400).json({ error: 'Tên danh mục đã tồn tại' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.delete('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getCategoryById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Danh mục không tồn tại' });
    }

    const result = await db.deleteCategory(id);
    res.json({ success: result.changes > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CATEGORY ITEMS (LIST) ROUTES ==========
router.get('/category-items', async (req, res) => {
  try {
    const { categoryId } = req.query;
    const items = await db.getAllCategoryItems(categoryId ? parseInt(categoryId, 10) : null);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/category-items/:id', async (req, res) => {
  try {
    const item = await db.getCategoryItemById(parseInt(req.params.id, 10));
    if (!item) {
      return res.status(404).json({ error: 'Mục không tồn tại' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/category-items', requireAdmin, uploadOptional('pollImage'), async (req, res) => {
  try {
    const {
      category_id,
      title,
      reward_rate,
      image,
      content,
      balance_required,
      item_key,
      game,
      status
    } = req.body;

    if (!category_id || !title) {
      return res.status(400).json({ error: 'category_id và title là bắt buộc' });
    }

    const category = await db.getCategoryById(parseInt(category_id, 10));
    if (!category) {
      return res.status(404).json({ error: 'Danh mục không tồn tại' });
    }

    // Nếu có upload ảnh, sử dụng ảnh đã upload, nếu không dùng image từ body
    let finalImage = image || '';
    if (req.file) {
      finalImage = `/uploads/products/${req.file.filename}`;
    }

    const item = await db.createCategoryItem(
      parseInt(category_id, 10),
      title,
      reward_rate,
      finalImage,
      content,
      balance_required,
      item_key,
      game,
      status
    );
    
    // Nếu item được tạo với status = 'active', tự động tạo kết quả cho kỳ đầu tiên
    if (status === 'active' && item && item.id) {
      try {
        console.log(`🔄 Auto-generating poll result for newly created item ${item.id}`);
        await db.autoGeneratePollResult(item);
      } catch (error) {
        console.error(`❌ Error auto-generating poll result for new item ${item.id}:`, error);
        // Không throw error để không làm gián đoạn việc tạo item
      }
    }
    
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/category-items/:id', requireAdmin, uploadOptional('pollImage'), async (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    const existing = await db.getCategoryItemById(itemId);
    if (!existing) {
      return res.status(404).json({ error: 'Mục không tồn tại' });
    }

    const {
      category_id,
      title,
      reward_rate,
      image,
      content,
      balance_required,
      item_key,
      game,
      status
    } = req.body;

    if (!category_id || !title) {
      return res.status(400).json({ error: 'category_id và title là bắt buộc' });
    }

    const category = await db.getCategoryById(parseInt(category_id, 10));
    if (!category) {
      return res.status(404).json({ error: 'Danh mục không tồn tại' });
    }

    // Lấy item hiện tại để giữ ảnh cũ nếu không upload ảnh mới
    // Nếu có upload ảnh mới, sử dụng ảnh mới, nếu không giữ ảnh cũ hoặc dùng image từ body
    let finalImage = image || (existing ? existing.image : '');
    
    if (req.file) {
      console.log('Poll: Upload file received:', req.file.filename);
      // Xóa ảnh cũ nếu có
      if (existing && existing.image && existing.image.startsWith('/uploads')) {
        const oldImagePath = path.join(__dirname, '../uploads/products', path.basename(existing.image));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      finalImage = `/uploads/products/${req.file.filename}`;
    }

    const updated = await db.updateCategoryItem(
      itemId,
      parseInt(category_id, 10),
      title,
      reward_rate,
      finalImage,
      content,
      balance_required,
      item_key,
      game,
      status
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/category-items/:id', requireAdmin, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    const existing = await db.getCategoryItemById(itemId);
    if (!existing) {
      return res.status(404).json({ error: 'Mục không tồn tại' });
    }

    const result = await db.deleteCategoryItem(itemId);
    res.json({ success: result.changes > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== TRACKING ROUTES ==========
router.get('/tracking/:trackingNumber', async (req, res) => {
  try {
    const tracking = await db.getTracking(req.params.trackingNumber);
    if (!tracking) {
      return res.status(404).json({ error: 'Tracking number not found' });
    }
    res.json(tracking);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

router.post('/tracking', async (req, res) => {
  try {
    const { tracking_number, status, location, description } = req.body;
    if (!tracking_number) {
      return res.status(400).json({ error: 'Tracking number is required' });
    }
    const tracking = await db.createTracking(tracking_number, status, location, description);
    res.status(201).json(tracking);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

router.put('/tracking/:trackingNumber', async (req, res) => {
  try {
    const { status, location, description } = req.body;
    const result = await db.updateTracking(req.params.trackingNumber, status, location, description);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tracking number not found' });
    }
    const tracking = await db.getTracking(req.params.trackingNumber);
    res.json(tracking);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ========== ORDERS ROUTES ==========
router.get('/orders', async (req, res) => {
  try {
    const orders = await db.getAllOrders();
    res.json(orders);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const { 
      order_number, 
      user_id,
      customer_name, 
      customer_email, 
      customer_phone,
      product_link,
      quantity,
      notes,
      service_id, 
      tracking_number, 
      total_amount 
    } = req.body;
    
    if (!customer_name || !customer_phone) {
      return res.status(400).json({ error: 'Tên khách hàng và số điện thoại là bắt buộc' });
    }
    
    // Generate order number if not provided
    const orderNumber = order_number || `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Convert user_id to integer if provided
    const userId = user_id ? parseInt(user_id) : null;
    
    console.log('Creating order with data:', {
      orderNumber,
      userId,
      customer_name,
      customer_phone,
      product_link,
      quantity
    });
    
    const order = await db.createOrder(
      orderNumber,
      userId,
      customer_name,
      customer_email || '',
      customer_phone,
      product_link || '',
      quantity || 0,
      notes || '',
      service_id || null,
      tracking_number || '',
      total_amount || 0
    );
    
    console.log('Order created successfully:', order);
    res.status(201).json({ success: true, order });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get orders by user ID
router.get('/orders/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('GET /orders/user/:userId called with userId:', userId);
    const userIdInt = parseInt(userId);
    console.log('Parsed userId:', userIdInt);
    
    if (isNaN(userIdInt) || userIdInt <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Kiểm tra user có tồn tại không (tùy chọn, để đảm bảo an toàn)
    const user = await db.getUserById(userIdInt);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Chỉ trả về orders của user này
    const orders = await db.getOrdersByUserId(userIdInt);
    console.log(`Returning ${orders.length} orders for user ${userIdInt}`);
    
    // Đảm bảo tất cả orders đều thuộc về user này (double check)
    const filteredOrders = orders.filter(order => 
      order.user_id === userIdInt || order.userId === userIdInt
    );
    
    res.json(filteredOrders);
  } catch (error) {
    console.error('Error in GET /orders/user/:userId:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== AUTH ROUTES ==========
// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const user = await db.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    
    // Kiểm tra tài khoản có bị đóng băng không
    if (user.status === 'frozen' || user.status === 'inactive') {
      return res.status(403).json({ error: 'Tài khoản đã bị đóng băng' });
    }
    
    // Lấy IP address
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || req.ip || 'unknown';
    
    // Cập nhật thông tin đăng nhập (IP và thời gian)
    await db.updateUserLoginInfo(user.id, ipAddress);
    
    // Trả về thông tin user (không bao gồm password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword,
      message: 'Đăng nhập thành công'
    });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Register
router.post('/auth/register', async (req, res) => {
  try {
    const { username, password, confirmPassword, referralCode } = req.body;
    
    if (!username || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Tên đăng nhập, mật khẩu và xác nhận mật khẩu là bắt buộc' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Mật khẩu không khớp' });
    }
    
    // Bắt buộc phải có mã giới thiệu
    if (!referralCode || !referralCode.trim()) {
      return res.status(400).json({ error: 'Mã giới thiệu là bắt buộc' });
    }
    
    // Kiểm tra mã giới thiệu có thuộc về nhân viên đang hoạt động không
    const staff = await db.getActiveStaffByReferralCode(referralCode.trim());
    if (!staff) {
      return res.status(400).json({ error: 'Mã giới thiệu không hợp lệ hoặc nhân viên không hoạt động' });
    }
    
    // Kiểm tra username đã tồn tại chưa
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }
    
    // Lấy IP address
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || req.ip || 'unknown';
    
    // Tạo user với mã giới thiệu của nhân viên và IP address
    const user = await db.createUser(username, password, referralCode.trim(), ipAddress);
    
    // Trả về thông tin user (không bao gồm password)
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      staffName: staff.full_name || staff.username,
      message: 'Đăng ký thành công'
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Admin Login
router.post('/auth/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Tìm trong bảng admins (quản trị viên)
    const admin = await db.getAdminByUsername(username);
    
    if (!admin) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    
    if (admin.password !== password) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    
    // Kiểm tra admin có đang hoạt động không
    if (admin.status !== 'active') {
      return res.status(403).json({ error: 'Tài khoản đã bị vô hiệu hóa' });
    }
    
    // Trả về thông tin admin (không bao gồm password)
    const { password: _, ...adminWithoutPassword } = admin;
    res.json({
      success: true,
      user: adminWithoutPassword,
      message: 'Đăng nhập admin thành công'
    });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Staff Login
router.post('/auth/staff/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Tìm trong bảng staff (nhân viên)
    const staff = await db.getStaffByUsername(username);
    
    if (!staff) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    
    if (staff.password !== password) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    
    // Kiểm tra staff có đang hoạt động không
    if (staff.status !== 'active') {
      return res.status(403).json({ error: 'Tài khoản đã bị vô hiệu hóa' });
    }
    
    // Trả về thông tin staff (không bao gồm password)
    const { password: _, ...staffWithoutPassword } = staff;
    res.json({
      success: true,
      user: staffWithoutPassword,
      message: 'Đăng nhập nhân viên thành công'
    });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get users by staff referral code (staff only)
router.get('/staff/users', async (req, res) => {
  try {
    const staffId = req.headers['staff-id'] || req.query.staffId;
    const referralCode = req.headers['referral-code'] || req.query.referralCode;
    
    if (!staffId && !referralCode) {
      return res.status(400).json({ error: 'Staff ID or referral code is required' });
    }
    
    let finalReferralCode = referralCode;
    
    // Nếu chỉ có staffId, lấy referral code từ staff
    if (!finalReferralCode && staffId) {
      const staff = await db.getStaffById(parseInt(staffId));
      if (!staff) {
        return res.status(404).json({ error: 'Staff not found' });
      }
      finalReferralCode = staff.referral_code;
    }
    
    if (!finalReferralCode) {
      return res.status(400).json({ error: 'Referral code not found' });
    }
    
    // Lấy tất cả users có referral code này
    const users = await db.getUsersByReferralCode(finalReferralCode);
    
    res.json(users);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Update user withdrawal_enabled (staff only)
router.put('/staff/users/:id/withdrawal', async (req, res) => {
  try {
    const { id } = req.params;
    const { withdrawal_enabled } = req.body;
    const staffId = req.headers['staff-id'] || req.query.staffId;
    const referralCode = req.headers['referral-code'] || req.query.referralCode;
    
    if (!staffId && !referralCode) {
      return res.status(400).json({ error: 'Staff ID or referral code is required' });
    }
    
    // Verify staff has access to this user
    let finalReferralCode = referralCode;
    if (!finalReferralCode && staffId) {
      const staff = await db.getStaffById(parseInt(staffId));
      if (!staff) {
        return res.status(404).json({ error: 'Staff not found' });
      }
      finalReferralCode = staff.referral_code;
    }
    
    // Get user and verify they belong to this staff's referral code
    const user = await db.getUserById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.referral_code !== finalReferralCode) {
      return res.status(403).json({ error: 'Bạn không có quyền cập nhật user này' });
    }
    
    // Update user
    await db.updateUser(
      parseInt(id),
      user.username,
      null, // password
      user.referral_code,
      user.balance || 0,
      user.credit_score || 100,
      user.ip_address,
      user.status || 'active',
      null, null, null, // bank info
      withdrawal_enabled
    );
    
    // Get updated users list
    const users = await db.getUsersByReferralCode(finalReferralCode);
    
    res.json({ success: true, users, message: `Đã ${withdrawal_enabled ? 'mở' : 'đóng'} chức năng rút tiền cho thành viên` });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get orders by staff referral code (staff only)
router.get('/staff/orders', async (req, res) => {
  try {
    const staffId = req.headers['staff-id'] || req.query.staffId;
    const referralCode = req.headers['referral-code'] || req.query.referralCode;
    
    if (!staffId && !referralCode) {
      return res.status(400).json({ error: 'Staff ID or referral code is required' });
    }
    
    let finalReferralCode = referralCode;
    
    // Nếu chỉ có staffId, lấy referral code từ staff
    if (!finalReferralCode && staffId) {
      const staff = await db.getStaffById(parseInt(staffId));
      if (!staff) {
        return res.status(404).json({ error: 'Staff not found' });
      }
      finalReferralCode = staff.referral_code;
    }
    
    if (!finalReferralCode) {
      return res.status(400).json({ error: 'Referral code not found' });
    }
    
    // Lấy tất cả users có referral code này
    const users = await db.getUsersByReferralCode(finalReferralCode);
    const userIds = users.map(u => u.id);
    
    if (userIds.length === 0) {
      return res.json([]);
    }
    
    // Lấy tất cả orders của các users này
    const allOrders = await db.getAllOrders();
    const filteredOrders = allOrders.filter(order => 
      order.user_id && userIds.includes(order.user_id)
    );
    
    res.json(filteredOrders);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ========== IMPORT/EXPORT HISTORY ROUTES ==========
// Create import history
router.post('/import', async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['user-id'];
    const { productName, productCode, productLink, quantity, unitPrice, supplier, notes } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!productName || !quantity || parseFloat(quantity) <= 0) {
      return res.status(400).json({ error: 'Tên sản phẩm và số lượng là bắt buộc' });
    }
    
    const totalAmount = (parseFloat(unitPrice) || 0) * (parseInt(quantity) || 0);
    
    // Lấy staff_id từ referral_code của user
    let staffId = null;
    try {
      const user = await db.getUserById(parseInt(userId));
      if (user && user.referral_code) {
        const staff = await db.getStaffByReferralCode(user.referral_code);
        if (staff) {
          staffId = staff.id;
        }
      }
    } catch (err) {
      console.error('Error getting staff_id:', err);
    }
    
    const importRecord = await db.createImportHistory(
      parseInt(userId),
      staffId,
      productName.trim(),
      productCode?.trim() || '',
      productLink?.trim() || '',
      parseInt(quantity),
      parseFloat(unitPrice) || 0,
      totalAmount,
      supplier?.trim() || '',
      notes?.trim() || '',
      'pending'
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Yêu cầu nhập hàng đã được gửi',
      import: importRecord 
    });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get import history by user
router.get('/import/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);
    
    if (isNaN(userIdInt) || userIdInt <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const imports = await db.getImportHistoryByUserId(userIdInt);
    res.json(imports);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get all import history (admin only)
router.get('/admin/import', async (req, res) => {
  try {
    const imports = await db.getAllImportHistory();
    res.json(imports);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get import history by staff referral code (public - for import page)
router.get('/import/staff/:referralCode', async (req, res) => {
  try {
    const { referralCode } = req.params;
    const imports = await db.getImportHistoryByUserReferralCode(referralCode);
    res.json(imports);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get completed imports (public - for import page to show products in stock)
router.get('/import/completed', async (req, res) => {
  try {
    const allImports = await db.getAllImportHistory();
    // Lấy tất cả các import được tạo bởi nhân viên (có staff_id) - hiển thị tất cả status
    // Bao gồm cả pending, processing, completed để người dùng thấy được sản phẩm đã được nhân viên nhập
    const staffImports = allImports.filter(imp => {
      // Kiểm tra cả staff_id và đảm bảo nó không phải là null hoặc undefined
      return imp.staff_id !== null && imp.staff_id !== undefined && imp.staff_id !== '';
    });
    console.log(`Total imports: ${allImports.length}, Staff imports: ${staffImports.length}`);
    res.json(staffImports);
  } catch (error) {
    console.error('Error in /import/completed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Staff create import (nhân viên tạo yêu cầu nhập hàng)
router.post('/staff/import', upload.single('productImage'), async (req, res) => {
  try {
    const staffId = req.body.staffId || req.headers['staff-id'];
    const { productName, productCode, quantity, unitPrice, supplier, notes } = req.body;
    
    if (!staffId) {
      return res.status(400).json({ error: 'Staff ID is required' });
    }
    
    // Validate staff exists
    const staff = await db.getStaffById(parseInt(staffId));
    if (!staff) {
      return res.status(400).json({ error: 'Staff không tồn tại' });
    }
    
    if (!productName || !productName.trim()) {
      return res.status(400).json({ error: 'Tên sản phẩm là bắt buộc' });
    }
    
    if (!quantity || parseFloat(quantity) <= 0) {
      return res.status(400).json({ error: 'Số lượng phải lớn hơn 0' });
    }
    
    // Lấy đường dẫn file ảnh nếu có
    let productLink = '';
    if (req.file) {
      // Tạo URL để truy cập file: /uploads/products/filename
      productLink = `/uploads/products/${req.file.filename}`;
    }
    
    const totalAmount = (parseFloat(unitPrice) || 0) * (parseInt(quantity) || 0);
    
    // Staff tạo import, user_id có thể null
    // Status = 'completed' vì nhân viên thêm sản phẩm có nghĩa là sản phẩm đã được nhập vào kho
    const importRecord = await db.createImportHistory(
      null, // user_id = null khi staff tạo trực tiếp
      parseInt(staffId),
      productName.trim(),
      productCode?.trim() || '',
      productLink,
      parseInt(quantity),
      parseFloat(unitPrice) || 0,
      totalAmount,
      supplier?.trim() || '',
      notes?.trim() || '',
      'completed' // Sản phẩm đã được nhân viên nhập vào kho
    );
    
    console.log('Staff import created:', {
      id: importRecord.id,
      staff_id: importRecord.staff_id,
      product_name: importRecord.product_name,
      product_link: importRecord.product_link,
      status: importRecord.status
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Sản phẩm đã được thêm thành công',
      import: importRecord 
    });
  } catch (error) {
    console.error('Error creating staff import:', error);
    // Xóa file nếu có lỗi xảy ra
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/products', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({ error: error.message || 'Có lỗi xảy ra khi thêm sản phẩm' });
  }
});

// ========== STAFF PRODUCTS ROUTES ==========
// Get all products for staff (staff can see all products)
router.get('/staff/products', async (req, res) => {
  try {
    const products = await db.getAllProducts();
    res.json(products);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID (staff)
router.get('/staff/products/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }
    res.json(product);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint để kiểm tra route
router.get('/staff/products/test', (req, res) => {
  res.json({ message: 'Route /staff/products is working!' });
});

// Create new product (staff) - ảnh là optional, không cần staffId
router.post('/staff/products', uploadOptional('productImage'), async (req, res) => {
  try {
    console.log('POST /staff/products - Request received');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    // Parse body data từ FormData
    const name = req.body.name;
    const description = req.body.description || '';
    const price = req.body.price || 0;
    const category = req.body.category || '';
    const stock = req.body.stock || 0;
    const status = req.body.status || 'active';
    const productCode = req.body.productCode || '';
    const supplier = req.body.supplier || '';
    
    if (!name || !name.trim()) {
      console.log('Validation failed: name is required');
      return res.status(400).json({ error: 'Tên sản phẩm là bắt buộc' });
    }
    
    // Lấy đường dẫn file ảnh nếu có
    let image = '';
    if (req.file) {
      image = `/uploads/products/${req.file.filename}`;
    } else {
      // Nếu không có ảnh, có thể sử dụng ảnh mặc định hoặc để trống
      // Tạm thời để trống, frontend sẽ xử lý hiển thị placeholder
      image = '';
    }
    
    // Đảm bảo status luôn là 'active' khi tạo sản phẩm mới
    const productStatus = (status && String(status).trim()) || 'active';
    
    console.log('Creating product with:', {
      name: name?.trim(),
      description: description?.trim(),
      price: parseFloat(price) || 0,
      category: category?.trim(),
      stock: parseInt(stock) || 0,
      status: productStatus,
      productCode: productCode?.trim(),
      supplier: supplier?.trim(),
      image: image
    });
    
    const product = await db.createProduct(
      name?.trim() || '',
      description?.trim() || '',
      image,
      parseFloat(price) || 0,
      category?.trim() || '',
      parseInt(stock) || 0,
      productStatus,
      productCode?.trim() || '',
      supplier?.trim() || '',
      null // Không cần staffId
    );
    
    console.log('Product created:', {
      id: product.id,
      name: product.name,
      status: product.status
    });
    
    const allProducts = await db.getAllProducts();
    res.status(201).json({ success: true, products: allProducts, product });
  } catch (error) {
    // Xóa file nếu có lỗi
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/products', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    console.error('Error creating product:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    console.error('Request file:', req.file);
    
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || 'Có lỗi xảy ra khi tạo sản phẩm' });
  }
});

// Update product (staff) - ảnh là optional khi update
router.put('/staff/products/:id', uploadOptional('productImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock, status, productCode, supplier } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên sản phẩm là bắt buộc' });
    }
    
    // Lấy sản phẩm hiện tại để giữ ảnh cũ nếu không upload ảnh mới
    const currentProduct = await db.getProductById(id);
    if (!currentProduct) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }
    
    // Nếu có upload ảnh mới, sử dụng ảnh mới, nếu không giữ ảnh cũ
    let image = currentProduct.image || '';
    if (req.file) {
      console.log('Upload file received:', req.file.filename);
      // Xóa ảnh cũ nếu có
      if (currentProduct.image && currentProduct.image.startsWith('/uploads')) {
        const oldImagePath = path.join(__dirname, '../uploads/products', path.basename(currentProduct.image));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('Old image deleted:', oldImagePath);
        }
      }
      image = `/uploads/products/${req.file.filename}`;
      console.log('New image path:', image);
    } else {
      console.log('No file uploaded, keeping existing image:', image);
    }
    
    console.log('Updating product with image:', image);
    await db.updateProduct(
      id,
      name.trim(),
      description?.trim() || '',
      image,
      parseFloat(price) || 0,
      category?.trim() || '',
      parseInt(stock) || 0,
      status || 'active',
      productCode?.trim() || '',
      supplier?.trim() || ''
    );
    
    // Verify the update
    const updatedProduct = await db.getProductById(id);
    console.log('Product updated, image in DB:', updatedProduct?.image);
    
    const allProducts = await db.getAllProducts();
    res.json({ success: true, products: allProducts });
  } catch (error) {
    // Xóa file nếu có lỗi
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/products', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    console.error('Error updating product:', error);
    
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || 'Có lỗi xảy ra khi cập nhật sản phẩm' });
  }
});

// Delete product (staff)
router.delete('/staff/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Lấy sản phẩm để xóa ảnh
    const product = await db.getProductById(id);
    if (product && product.image && product.image.startsWith('/uploads')) {
      const imagePath = path.join(__dirname, '../uploads/products', path.basename(product.image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await db.deleteProduct(id);
    
    const allProducts = await db.getAllProducts();
    res.json({ success: true, products: allProducts });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message || 'Có lỗi xảy ra khi xóa sản phẩm' });
  }
});

// Get active products for import page (public)
router.get('/products/active', async (req, res) => {
  try {
    let products = await db.getActiveProducts();
    
    // Nếu chưa có sản phẩm nào, tự động tạo 5 sản phẩm mẫu
    if (!products || products.length === 0) {
      console.log('Chưa có sản phẩm nào, đang tạo 5 sản phẩm mẫu...');
      const sampleProducts = [
        {
          name: 'Áo thun nam cao cấp',
          product_code: 'SP001',
          description: 'Áo thun chất liệu cotton 100%, nhiều màu sắc, thoáng mát',
          image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
          price: 250000,
          category: 'Thời trang',
          supplier: 'Nhà cung cấp thời trang ABC',
          stock: 50,
          status: 'active'
        },
        {
          name: 'Giày thể thao Nike Air Max',
          product_code: 'SP002',
          description: 'Giày thể thao chính hãng Nike, size 38-44, đế cao su chống trượt',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
          price: 2500000,
          category: 'Giày dép',
          supplier: 'Nike Store Việt Nam',
          stock: 30,
          status: 'active'
        },
        {
          name: 'Túi xách da thật',
          product_code: 'SP003',
          description: 'Túi xách da bò thật, thiết kế sang trọng, phù hợp công sở',
          image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
          price: 1500000,
          category: 'Phụ kiện',
          supplier: 'Thương hiệu túi xách XYZ',
          stock: 25,
          status: 'active'
        },
        {
          name: 'Đồng hồ thông minh Apple Watch',
          product_code: 'SP004',
          description: 'Apple Watch Series 9, màu đen, chính hãng, pin 18 giờ',
          image: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=500',
          price: 8000000,
          category: 'Điện tử',
          supplier: 'Apple Authorized Reseller',
          stock: 20,
          status: 'active'
        },
        {
          name: 'Tai nghe không dây Sony WH-1000XM5',
          product_code: 'SP005',
          description: 'Tai nghe chống ồn chủ động, pin 30 giờ, chất lượng âm thanh cao',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
          price: 6000000,
          category: 'Điện tử',
          supplier: 'Sony Việt Nam',
          stock: 40,
          status: 'active'
        }
      ];
      
      // Lấy staff đầu tiên
      const allStaff = await db.getAllStaff();
      const staffId = allStaff && allStaff.length > 0 ? allStaff[0].id : null;
      
      // Tạo từng sản phẩm
      for (const product of sampleProducts) {
        await db.createProduct(
          product.name,
          product.description,
          product.image,
          product.price,
          product.category,
          product.stock,
          product.status,
          product.product_code,
          product.supplier,
          staffId
        );
      }
      
      // Lấy lại danh sách sản phẩm sau khi tạo
      products = await db.getActiveProducts();
      console.log(`Đã tạo ${products.length} sản phẩm mẫu`);
    }
    
    // Trả về tất cả sản phẩm active, sắp xếp theo thời gian tạo mới nhất
    if (products && products.length > 0) {
      products.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });
    }
    
    res.json(products || []);
  } catch (error) {
    console.error('Error getting active products:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search products by name or product code (public)
router.get('/products/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.json([]);
    }
    
    const products = await db.searchProducts(q);
    res.json(products || []);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create export history
router.post('/export', async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['user-id'];
    const { productName, productLink, quantity, unitPrice, recipientName, recipientPhone, recipientAddress, notes } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!productName || !quantity || parseFloat(quantity) <= 0) {
      return res.status(400).json({ error: 'Tên sản phẩm và số lượng là bắt buộc' });
    }
    
    const totalAmount = (parseFloat(unitPrice) || 0) * (parseInt(quantity) || 0);
    
    const exportRecord = await db.createExportHistory(
      parseInt(userId),
      productName.trim(),
      productLink?.trim() || '',
      parseInt(quantity),
      parseFloat(unitPrice) || 0,
      totalAmount,
      recipientName?.trim() || '',
      recipientPhone?.trim() || '',
      recipientAddress?.trim() || '',
      notes?.trim() || '',
      'pending'
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Yêu cầu xuất hàng đã được gửi',
      export: exportRecord 
    });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get export history by user
router.get('/export/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);
    
    if (isNaN(userIdInt) || userIdInt <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const exports = await db.getExportHistoryByUserId(userIdInt);
    res.json(exports);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get all export history (admin only)
router.get('/admin/export', async (req, res) => {
  try {
    const exports = await db.getAllExportHistory();
    res.json(exports);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get current user info
router.get('/auth/me', async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN ROUTES ==========
// Get all members (admin only)
router.get('/admin/members', async (req, res) => {
  try {
    // TODO: Add admin authentication check
    const members = await db.getAllUsers();
    res.json(members);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Create new member (admin only)
router.post('/admin/members', async (req, res) => {
  try {
    const { username, password, referralCode, balance, creditScore } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Check if username already exists
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }
    
    // Lấy IP address
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || req.ip || null;
    
    const user = await db.createUser(username, password, referralCode || null, ipAddress);
    
    // If balance or creditScore provided, update them
    if (balance !== undefined || creditScore !== undefined) {
      await db.updateUser(user.id, username, null, referralCode || null, balance || 0, creditScore || 100, ipAddress, 'active', null, null, null);
    }
    
    const members = await db.getAllUsers();
    res.status(201).json({ success: true, members });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Update member (admin only)
router.put('/admin/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, referralCode, balance, creditScore, status, withdrawal_enabled, min_withdrawal, max_withdrawal, vip_level, bank_name, bank_account_number, bank_account_holder } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Check if username already exists (excluding current user)
    const existingUser = await db.getUserByUsername(username);
    if (existingUser && existingUser.id !== parseInt(id)) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }
    
    const user = await db.getUserById(parseInt(id));
    const ipAddress = user?.ip_address || null;
    
    await db.updateUser(
      parseInt(id),
      username,
      password || null,
      referralCode || null,
      balance !== undefined ? balance : user?.balance || 0,
      creditScore !== undefined ? creditScore : user?.credit_score || 100,
      ipAddress,
      status || user?.status || 'active',
      bank_name !== undefined ? bank_name : user?.bank_name, // bank_name parameter
      bank_account_number !== undefined ? bank_account_number : user?.bank_account_number, // bank_account_number parameter
      bank_account_holder !== undefined ? bank_account_holder : user?.bank_account_holder, // bank_account_holder parameter
      withdrawal_enabled !== undefined ? withdrawal_enabled : user?.withdrawal_enabled, // withdrawal_enabled parameter
      min_withdrawal !== undefined ? min_withdrawal : user?.min_withdrawal, // min_withdrawal parameter
      max_withdrawal !== undefined ? max_withdrawal : user?.max_withdrawal, // max_withdrawal parameter
      vip_level !== undefined ? vip_level : user?.vip_level // vip_level parameter
    );
    
    const members = await db.getAllUsers();
    res.json({ success: true, members });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Toggle withdrawal enabled for member (admin only)
router.put('/admin/members/:id/withdrawal', async (req, res) => {
  try {
    const { id } = req.params;
    const { withdrawal_enabled } = req.body;
    
    if (withdrawal_enabled === undefined) {
      return res.status(400).json({ error: 'withdrawal_enabled is required' });
    }
    
    const user = await db.getUserById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await db.updateUser(
      parseInt(id),
      user.username,
      null, // password
      user.referral_code,
      user.balance || 0,
      user.credit_score || 100,
      user.ip_address,
      user.status || 'active',
      null, null, null, // bank info
      withdrawal_enabled
    );
    
    const members = await db.getAllUsers();
    res.json({ 
      success: true, 
      members,
      message: `Đã ${withdrawal_enabled ? 'mở' : 'đóng'} chức năng rút tiền cho thành viên`
    });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Freeze/Unfreeze user account
router.put('/admin/members/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'frozen', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status phải là: active, frozen, hoặc inactive' });
    }
    
    await db.updateUserStatus(parseInt(id), status);
    
    const members = await db.getAllUsers();
    res.json({ success: true, members, message: `Tài khoản đã được ${status === 'frozen' ? 'đóng băng' : status === 'active' ? 'kích hoạt' : 'vô hiệu hóa'}` });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Delete member (admin only)
router.delete('/admin/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting admin user
    const user = await db.getUserById(parseInt(id));
    if (user && user.username.toLowerCase().startsWith('admin')) {
      return res.status(400).json({ error: 'Không thể xóa tài khoản admin' });
    }
    
    await db.deleteUser(parseInt(id));
    
    const members = await db.getAllUsers();
    res.json({ success: true, members });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN MANAGEMENT ROUTES ==========
// Get all admins
router.get('/admin/admins', async (req, res) => {
  try {
    const admins = await db.getAllAdmins();
    res.json(admins);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ========== STAFF MANAGEMENT ROUTES ==========
// Get all staff (admin only)
router.get('/admin/staff', async (req, res) => {
  try {
    const staff = await db.getAllStaff();
    res.json(staff);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Create new staff (admin only)
router.post('/admin/staff', async (req, res) => {
  try {
    const { username, password, fullName, email, phone, position, referralCode } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Check if username already exists
    const existingStaff = await db.getStaffByUsername(username);
    if (existingStaff) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }
    
    // Nếu có mã giới thiệu, kiểm tra trùng lặp
    let finalReferralCode = referralCode?.trim() || '';
    if (finalReferralCode) {
      const existingReferralCode = await db.getStaffByReferralCode(finalReferralCode);
      if (existingReferralCode) {
        return res.status(400).json({ error: 'Mã giới thiệu đã tồn tại, vui lòng chọn mã khác' });
      }
    }
    // Nếu không có mã giới thiệu, hàm createStaff sẽ tự động tạo
    
    const staff = await db.createStaff(username, password, fullName || '', email || '', phone || '', position || 'Nhân viên', finalReferralCode);
    
    const allStaff = await db.getAllStaff();
    res.status(201).json({ success: true, staff: allStaff });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Update staff (admin only)
router.put('/admin/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, fullName, email, phone, position, referralCode, status } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Check if username already exists (excluding current staff)
    const existingStaff = await db.getStaffByUsername(username);
    if (existingStaff && existingStaff.id !== parseInt(id)) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }
    
    // Lấy thông tin nhân viên hiện tại để giữ mã giới thiệu nếu không có mã mới
    const currentStaff = await db.getStaffById(parseInt(id));
    let finalReferralCode = referralCode?.trim() || currentStaff?.referral_code || '';
    
    // Nếu có mã giới thiệu mới, kiểm tra trùng lặp
    if (finalReferralCode && finalReferralCode !== currentStaff?.referral_code) {
      const existingReferralCode = await db.getStaffByReferralCode(finalReferralCode);
      if (existingReferralCode && existingReferralCode.id !== parseInt(id)) {
        return res.status(400).json({ error: 'Mã giới thiệu đã tồn tại, vui lòng chọn mã khác' });
      }
    }
    
    // Nếu không có mã giới thiệu, tự động tạo
    if (!finalReferralCode) {
      finalReferralCode = 'NV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    
    await db.updateStaff(
      parseInt(id),
      username,
      password || null,
      fullName || '',
      email || '',
      phone || '',
      position || 'Nhân viên',
      finalReferralCode,
      status || 'active'
    );
    
    const allStaff = await db.getAllStaff();
    res.json({ success: true, staff: allStaff });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Delete staff (admin only)
router.delete('/admin/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.deleteStaff(parseInt(id));
    
    const allStaff = await db.getAllStaff();
    res.json({ success: true, staff: allStaff });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ========== MONEY MANAGEMENT ROUTES ==========
// Get all transactions (admin only)
router.get('/admin/transactions', async (req, res) => {
  try {
    const transactions = await db.getAllTransactions();
    res.json(transactions);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Create new transaction (admin only)
router.post('/admin/transactions', async (req, res) => {
  try {
    const { userId, username, transactionType, amount, description, status, adminNote } = req.body;
    
    if (!userId || !username || !transactionType || !amount) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    
    // Get user current balance
    const user = await db.getUserById(parseInt(userId));
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    
    const balanceBefore = user.balance || 0;
    let balanceAfter = balanceBefore;
    
    // Calculate new balance based on transaction type
    if (transactionType === 'deposit' || transactionType === 'add') {
      balanceAfter = balanceBefore + parseFloat(amount);
    } else if (transactionType === 'withdraw' || transactionType === 'subtract') {
      balanceAfter = balanceBefore - parseFloat(amount);
      if (balanceAfter < 0) {
        return res.status(400).json({ error: 'Số dư không đủ' });
      }
    }
    
    // Create transaction
    const transaction = await db.createTransaction(
      parseInt(userId),
      username,
      transactionType,
      parseFloat(amount),
      balanceBefore,
      balanceAfter,
      description || '',
      status || 'completed',
      adminNote || ''
    );
    
    // Update user balance
    await db.updateUser(parseInt(userId), user.username, null, user.referral_code, balanceAfter, user.credit_score, user.ip_address, user.status, null, null, null);
    
    const allTransactions = await db.getAllTransactions();
    res.status(201).json({ success: true, transactions: allTransactions });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// User create deposit request
router.post('/transactions/deposit', async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['user-id'];
    const { amount, description } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Số tiền phải lớn hơn 0' });
    }
    
    const user = await db.getUserById(parseInt(userId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const balanceBefore = parseFloat(user.balance) || 0;
    const balanceAfter = balanceBefore; // Chưa cộng tiền, chờ admin duyệt
    
    // Tạo transaction với status = pending
    const transaction = await db.createTransaction(
      parseInt(userId),
      user.username,
      'deposit',
      parseFloat(amount),
      balanceBefore,
      balanceAfter,
      description || `Yêu cầu nạp tiền ${parseFloat(amount).toLocaleString('vi-VN')}`,
      'pending',
      ''
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Yêu cầu nạp tiền đã được gửi, vui lòng chờ admin duyệt',
      transaction 
    });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Account summary (per user)
router.get('/account/summary', async (req, res) => {
  try {
    const userId = req.query.userId || req.headers['user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await db.getUserById(parseInt(userId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Transactions: sum deposits/withdraws that are completed
    const transactions = await db.getTransactionsByUserId(parseInt(userId));
    const sumAmount = (arr) => arr.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

    // Tính tất cả giao dịch, không chỉ completed (để user thấy ngay sau khi tạo)
    const deposits = transactions.filter(
      (t) => t.transaction_type === 'deposit' || t.transaction_type === 'add'
    );
    const withdraws = transactions.filter(
      (t) => t.transaction_type === 'withdraw' || t.transaction_type === 'subtract'
    );

    const totalDeposit = sumAmount(deposits);
    const totalWithdraw = sumAmount(withdraws);

    // Orders: combine order_set and export_orders
    const orders = await db.getOrdersByUserId(parseInt(userId));
    const exportOrders = await db.getExportOrdersByUserId(parseInt(userId));

    const totalOrderAmount = orders.reduce((acc, o) => acc + (parseFloat(o.total_amount) || 0), 0);
    const totalExportAmount = exportOrders.reduce((acc, o) => acc + (parseFloat(o.total_amount) || 0), 0);
    const totalMatched = totalOrderAmount + totalExportAmount;

    const totalCount = orders.length + exportOrders.length;
    const avgPerOrder = totalCount ? totalMatched / totalCount : 0;

    res.json({
      balance: user.balance || 0,
      stats: {
        perOrder: avgPerOrder,
        deposit: totalDeposit,
        withdraw: totalWithdraw,
        matched: totalMatched
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user bank info
router.get('/users/:userId/info', async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);
    
    if (isNaN(userIdInt) || userIdInt <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await db.getUserById(userIdInt);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      balance: user.balance || 0,
      credit_score: user.credit_score || 100,
      min_withdrawal: user.min_withdrawal || 0,
      max_withdrawal: user.max_withdrawal || 0,
      vip_level: user.vip_level || 0,
      withdrawal_enabled: user.withdrawal_enabled !== undefined ? (user.withdrawal_enabled === 1 || user.withdrawal_enabled === true) : true,
      bank_name: user.bank_name || null,
      bank_account_number: user.bank_account_number || null,
      bank_account_holder: user.bank_account_holder || null,
      status: user.status || 'active'
    });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/:userId/bank', async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);
    
    if (isNaN(userIdInt) || userIdInt <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await db.getUserById(userIdInt);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      bank_name: user.bank_name || null,
      bank_account_number: user.bank_account_number || null,
      bank_account_holder: user.bank_account_holder || null,
      isLinked: !!(user.bank_name && user.bank_account_number && user.bank_account_holder)
    });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Update user bank info
router.put('/users/:userId/bank', async (req, res) => {
  try {
    const { userId } = req.params;
    const { bank_name, bank_account_number, bank_account_holder } = req.body;
    const userIdInt = parseInt(userId);
    
    if (isNaN(userIdInt) || userIdInt <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    if (!bank_name || !bank_account_number || !bank_account_holder) {
      return res.status(400).json({ error: 'Tất cả các trường thông tin ngân hàng là bắt buộc' });
    }
    
    const user = await db.getUserById(userIdInt);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user with bank info
    await db.updateUser(
      userIdInt,
      user.username,
      null, // password
      user.referral_code,
      user.balance,
      user.credit_score,
      user.ip_address,
      user.status,
      bank_name.trim(),
      bank_account_number.trim(),
      bank_account_holder.trim()
    );
    
    res.json({ 
      success: true, 
      message: 'Liên kết ngân hàng thành công',
      bank: {
        bank_name: bank_name.trim(),
        bank_account_number: bank_account_number.trim(),
        bank_account_holder: bank_account_holder.trim()
      }
    });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get user transactions
router.get('/transactions/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);
    
    if (isNaN(userIdInt) || userIdInt <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Kiểm tra user có tồn tại không
    const user = await db.getUserById(userIdInt);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Chỉ trả về transactions của user này
    const transactions = await db.getTransactionsByUserId(userIdInt);
    
    // Đảm bảo tất cả transactions đều thuộc về user này
    const filteredTransactions = transactions.filter(t => 
      t.user_id === userIdInt || t.userId === userIdInt
    );
    
    res.json(filteredTransactions);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// User create withdrawal request
router.post('/transactions/withdraw', async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['user-id'];
    const { amount, description, bankAccount, bankName, accountHolder } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Số tiền phải lớn hơn 0' });
    }
    
    const user = await db.getUserById(parseInt(userId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Kiểm tra chức năng rút tiền có được bật không
    const withdrawalEnabled = user.withdrawal_enabled !== undefined 
      ? (user.withdrawal_enabled === 1 || user.withdrawal_enabled === true) 
      : true; // Mặc định là true nếu không có giá trị
    
    if (!withdrawalEnabled) {
      return res.status(403).json({ error: 'Chức năng rút tiền đã bị đóng. Vui lòng liên hệ admin để được hỗ trợ.' });
    }
    
    const balanceBefore = parseFloat(user.balance) || 0;
    
    // Kiểm tra số dư có đủ không
    if (balanceBefore < parseFloat(amount)) {
      return res.status(400).json({ error: 'Số dư không đủ để rút tiền' });
    }
    
    const balanceAfter = balanceBefore; // Chưa trừ tiền, chờ admin duyệt
    
    // Tạo mô tả với thông tin ngân hàng
    let withdrawDescription = `Yêu cầu rút tiền ${parseFloat(amount).toLocaleString('vi-VN')}`;
    if (bankName || bankAccount || accountHolder) {
      withdrawDescription += ` - Ngân hàng: ${bankName || 'N/A'}, Số TK: ${bankAccount || 'N/A'}, Chủ TK: ${accountHolder || 'N/A'}`;
    }
    if (description) {
      withdrawDescription += ` - ${description}`;
    }
    
    // Tạo transaction với status = pending
    const transaction = await db.createTransaction(
      parseInt(userId),
      user.username,
      'withdraw',
      parseFloat(amount),
      balanceBefore,
      balanceAfter,
      withdrawDescription,
      'pending',
      ''
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Yêu cầu rút tiền đã được gửi, vui lòng chờ admin duyệt',
      transaction 
    });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Update transaction (admin only) - Approve/Reject
router.put('/admin/transactions/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Trạng thái là bắt buộc' });
    }
    
    // Lấy thông tin transaction hiện tại
    const transaction = await db.getTransactionById(parseInt(id));
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Nếu đang duyệt (status = completed) và transaction đang pending
    if (status === 'completed' && transaction.status === 'pending') {
      const user = await db.getUserById(transaction.user_id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const balanceBefore = parseFloat(user.balance) || 0;
      let balanceAfter = balanceBefore;
      
      // Cập nhật số dư dựa trên loại giao dịch
      if (transaction.transaction_type === 'deposit' || transaction.transaction_type === 'add') {
        balanceAfter = balanceBefore + parseFloat(transaction.amount);
      } else if (transaction.transaction_type === 'withdraw' || transaction.transaction_type === 'subtract') {
        balanceAfter = balanceBefore - parseFloat(transaction.amount);
        if (balanceAfter < 0) {
          return res.status(400).json({ error: 'Số dư không đủ để duyệt yêu cầu rút tiền' });
        }
      }
      
      // Cập nhật số dư user
      await db.updateUser(
        transaction.user_id,
        user.username,
        null,
        user.referral_code,
        balanceAfter,
        user.credit_score,
        user.ip_address,
        user.status,
        null, null, null // bank info not updated here
      );
      
      // Cập nhật transaction với số dư mới và balance_after
      await db.updateTransaction(parseInt(id), status, adminNote || 'Đã duyệt bởi admin');
      await db.updateTransactionBalance(parseInt(id), balanceAfter);
    } else {
      // Chỉ cập nhật status nếu không phải duyệt
      await db.updateTransaction(parseInt(id), status, adminNote || '');
    }
    
    const allTransactions = await db.getAllTransactions();
    res.json({ success: true, transactions: allTransactions });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Delete transaction (admin only)
router.delete('/admin/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.deleteTransaction(parseInt(id));
    
    const allTransactions = await db.getAllTransactions();
    res.json({ success: true, transactions: allTransactions });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN ORDERS & TRACKING ROUTES ==========
// Get all orders (admin only)
router.get('/admin/orders', async (req, res) => {
  try {
    const orders = await db.getAllOrders();
    res.json(orders);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get all tracking (admin only)
router.get('/admin/tracking', async (req, res) => {
  try {
    const tracking = await db.getAllTracking();
    res.json(tracking);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Approve order (admin only)
router.post('/admin/orders/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.approveOrder(parseInt(id));
    res.json(result);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Reject order (admin only)
router.post('/admin/orders/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await db.rejectOrder(parseInt(id), reason);
    res.json(result);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Delete order (admin only)
router.delete('/admin/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.deleteOrder(parseInt(id));
    res.json({ success: true, message: 'Đơn hàng đã được xóa thành công', order: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN PRODUCTS ROUTES ==========
// Get all products (admin only)
router.get('/admin/products', async (req, res) => {
  try {
    const products = await db.getAllProducts();
    res.json(products);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID (admin only)
router.get('/admin/products/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Create new product (admin only)
router.post('/admin/products', uploadOptional('productImage'), async (req, res) => {
  try {
    const { name, description, image, price, category, stock, status, productCode, supplier } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Tên sản phẩm là bắt buộc' });
    }
    
    // Nếu có upload ảnh, sử dụng ảnh đã upload, nếu không dùng image từ body
    let finalImage = image || '';
    if (req.file) {
      finalImage = `/uploads/products/${req.file.filename}`;
    }
    
    const product = await db.createProduct(name, description, finalImage, price, category, stock, status, productCode, supplier, null);
    const allProducts = await db.getAllProducts();
    res.status(201).json({ success: true, products: allProducts });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Update product (admin only)
router.put('/admin/products/:id', uploadOptional('productImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, price, category, stock, status, productCode, supplier } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Tên sản phẩm là bắt buộc' });
    }
    
    // Lấy sản phẩm hiện tại để giữ ảnh cũ nếu không upload ảnh mới
    const currentProduct = await db.getProductById(id);
    
    // Nếu có upload ảnh mới, sử dụng ảnh mới, nếu không giữ ảnh cũ hoặc dùng image từ body
    let finalImage = image || (currentProduct ? currentProduct.image : '');
    
    if (req.file) {
      console.log('Admin: Upload file received:', req.file.filename);
      // Xóa ảnh cũ nếu có
      if (currentProduct && currentProduct.image && currentProduct.image.startsWith('/uploads')) {
        const oldImagePath = path.join(__dirname, '../uploads/products', path.basename(currentProduct.image));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('Admin: Old image deleted:', oldImagePath);
        }
      }
      finalImage = `/uploads/products/${req.file.filename}`;
      console.log('Admin: New image path:', finalImage);
    } else {
      console.log('Admin: No file uploaded, using image from body or existing:', finalImage);
    }
    
    console.log('Admin: Updating product with image:', finalImage);
    await db.updateProduct(id, name, description, finalImage, price, category, stock, status, productCode, supplier);
    
    // Verify the update
    const updatedProduct = await db.getProductById(id);
    console.log('Admin: Product updated, image in DB:', updatedProduct?.image);
    
    const allProducts = await db.getAllProducts();
    res.json({ success: true, products: allProducts });
  } catch (error) {
    console.error('Admin: Error updating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete product (admin only)
router.delete('/admin/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.deleteProduct(id);
    
    const allProducts = await db.getAllProducts();
    res.json({ success: true, products: allProducts });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN SETTINGS ROUTES ==========
// Get all settings (admin only)
router.get('/admin/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await db.getAllSettings();
    res.json(settings);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Update settings (admin only)
router.put('/admin/settings', requireAdmin, async (req, res) => {
  try {
    const settings = req.body;
    
    await db.updateSettings(settings);
    
    const updatedSettings = await db.getAllSettings();
    res.json({ success: true, settings: updatedSettings });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN STATISTICS ROUTES ==========
// Get transaction statistics by month (admin only)
router.get('/admin/statistics', async (req, res) => {
  try {
    const { year } = req.query;
    const statistics = await db.getTransactionStatisticsByMonth(year ? parseInt(year) : null);
    res.json(statistics);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ========== EXPORT ORDERS ROUTES ==========
// Create export order (trừ tiền và ghi nhận đơn)
router.post('/export-orders', async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const { orderCode, brandId, brandName, products, totalAmount } = req.body;

    if (!orderCode || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Order code and products are required' });
    }

    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt) || userIdInt <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get user current balance
    const user = await db.getUserById(userIdInt);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const balanceBefore = parseFloat(user.balance) || 0;
    const calculatedTotal = parseFloat(totalAmount) || 0;

    // Check if user has enough balance
    if (balanceBefore < calculatedTotal) {
      return res.status(400).json({ 
        error: 'Số dư không đủ', 
        balance: balanceBefore,
        required: calculatedTotal
      });
    }

    // Calculate new balance
    const balanceAfter = balanceBefore - calculatedTotal;

    // Update user balance
    await db.updateUser(
      userIdInt,
      user.username,
      null,
      user.referral_code,
      balanceAfter,
      user.credit_score,
      user.ip_address,
      user.status,
      null,
      null,
      null
    );

    // Create transaction record
    await db.createTransaction(
      userIdInt,
      user.username,
      'export_order',
      -calculatedTotal,
      balanceBefore,
      balanceAfter,
      `Xuất đơn ${orderCode} - ${brandName || 'Brand Export'}`,
      'completed',
      `Đơn xuất hàng: ${orderCode}`
    );

    // Create export order record
    const exportOrder = await db.createExportOrder(
      orderCode,
      userIdInt,
      brandId || null,
      brandName || null,
      calculatedTotal,
      balanceBefore,
      balanceAfter,
      products
    );

    res.status(201).json({
      success: true,
      message: 'Đơn hàng đã được xuất thành công',
      order: exportOrder,
      balance: balanceAfter
    });
  } catch (error) {
    console.error('Error creating export order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public: get current period number for an item
router.get('/polls/:itemId/period-number', async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    console.log(`📊 Getting period number for item ${itemId}`);
    if (!itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    const item = await db.getCategoryItemById(itemId);
    if (!item) {
      console.error(`❌ Item ${itemId} not found`);
      return res.status(404).json({ error: 'Item not found' });
    }

    const gameDuration = item.game || '120';
    console.log(`📊 Item ${itemId} game duration: ${gameDuration}`);
    const periodNumber = await db.getCurrentPeriodNumber(itemId, gameDuration);
    console.log(`✅ Period number for item ${itemId}: ${periodNumber}`);
    res.json({ periodNumber });
  } catch (error) {
    console.error('❌ Error getting period number:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Create item export order (trừ tiền khi xuất đơn từ item)
router.post('/item-export-orders', async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const { itemId, itemTitle, selectedRates, totalAmount } = req.body;
    
    console.log('📝 Item export order request:', {
      userId,
      itemId,
      itemTitle,
      selectedRates,
      totalAmount
    });

    if (!itemId || !totalAmount) {
      return res.status(400).json({ error: 'Item ID and total amount are required' });
    }

    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt) || userIdInt <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get user current balance
    const user = await db.getUserById(userIdInt);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const balanceBefore = parseFloat(user.balance) || 0;
    const calculatedTotal = parseFloat(totalAmount) || 0;

    // Check if user has enough balance
    if (balanceBefore < calculatedTotal) {
      return res.status(400).json({ 
        error: 'Số dư không đủ', 
        balance: balanceBefore,
        required: calculatedTotal
      });
    }

    // Calculate new balance
    const balanceAfter = balanceBefore - calculatedTotal;

    // Update user balance
    await db.updateUser(
      userIdInt,
      user.username,
      null,
      user.referral_code,
      balanceAfter,
      user.credit_score,
      user.ip_address,
      user.status,
      null,
      null,
      null
    );

    // Create transaction record
    const productNames = Array.isArray(selectedRates) 
      ? selectedRates.map(rate => {
          const rateToNumber = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
          return `Sản phẩm ${rateToNumber[rate] || rate}`;
        }).join(', ')
      : '';

    await db.createTransaction(
      userIdInt,
      user.username,
      'export_order',
      -calculatedTotal,
      balanceBefore,
      balanceAfter,
      `Xuất đơn - ${itemTitle || 'Item'} - ${productNames}`,
      'completed',
      `Đơn xuất hàng từ item: ${itemId}`
    );

    // Get item details for poll history
    const item = await db.getCategoryItemById(parseInt(itemId));
    const itemKey = item ? (item.item_key || null) : null;
    const finalItemTitle = itemTitle || (item ? item.title : 'Item');
    const gameDuration = item ? (item.game || '120') : '120';

    // Get current period number (tự động tăng theo thời gian)
    const periodNumber = await db.getCurrentPeriodNumber(parseInt(itemId), gameDuration);

    // Create poll history record - Ghi nhận lịch sử bình chọn
    try {
      const selectedRatesArray = Array.isArray(selectedRates) ? selectedRates : (selectedRates ? [selectedRates] : []);
      console.log(`📝 Creating poll history:`, {
        userId: userIdInt,
        username: user.username,
        itemId: parseInt(itemId),
        itemTitle: finalItemTitle,
        itemKey,
        periodNumber,
        amount: calculatedTotal,
        selectedRates: selectedRatesArray
      });
      
      await db.createPollHistory(
        userIdInt,
        user.username,
        parseInt(itemId),
        finalItemTitle,
        itemKey,
        periodNumber,
        calculatedTotal,
        selectedRatesArray
      );
      console.log(`✅ Poll history created successfully for user ${userIdInt}, item ${itemId}, period ${periodNumber}, selectedRates: ${JSON.stringify(selectedRatesArray)}`);
    } catch (error) {
      console.error('❌ Error creating poll history:', error);
      console.error('Error stack:', error.stack);
      // Không throw error để không ảnh hưởng đến quá trình xuất đơn
    }

    // Lấy kết quả đã có sẵn cho kỳ hiện tại (không random mới)
    // Kết quả được tạo tự động bởi background service, độc lập với người dùng
    let existingResult = null;
    try {
      existingResult = await db.getPollResultByPeriod(parseInt(itemId), periodNumber);
    } catch (error) {
      console.error('Error getting poll result:', error);
    }

    // Nếu chưa có kết quả cho kỳ hiện tại, tạo ngay (tự động, không phụ thuộc người dùng)
    let winningProduct, winningRate, winningProductName;
    if (!existingResult) {
      // Random 1 trong 4 sản phẩm (A, B, C, D) - hoàn toàn ngẫu nhiên
      const products = ['A', 'B', 'C', 'D'];
      winningProduct = products[Math.floor(Math.random() * products.length)];
      
      // Parse reward_rate từ item
      let rewardCoefficients = { A: 1.0, B: 1.2, C: 1.5, D: 2.0 };
      if (item && item.reward_rate) {
        try {
          if (typeof item.reward_rate === 'string') {
            rewardCoefficients = JSON.parse(item.reward_rate);
          } else if (typeof item.reward_rate === 'object') {
            rewardCoefficients = item.reward_rate;
          }
        } catch (e) {
          console.error('Error parsing reward_rate:', e);
        }
      }
      
      winningRate = rewardCoefficients[winningProduct] || 1.0;
      const rateToNumber = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
      winningProductName = `Sản phẩm ${rateToNumber[winningProduct]}`;
      
      // Tạo kết quả cho kỳ này (không có user, tự động tạo)
      await db.createPollResult(
        parseInt(itemId),
        finalItemTitle,
        itemKey,
        periodNumber,
        winningProductName,
        winningProduct,
        0, // reward_amount = 0 vì chưa có ai chọn đúng
        null, // user_id = null
        null, // username = null
        null  // bet_amount = null
      );
    } else {
      // Lấy kết quả đã có sẵn
      winningProduct = existingResult.winning_rate; // winning_rate lưu A, B, C, hoặc D
      const rateToNumber = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
      winningProductName = existingResult.winning_product; // Đã có format "Sản phẩm X"
      
      // Parse reward_rate để lấy tỷ lệ
      let rewardCoefficients = { A: 1.0, B: 1.2, C: 1.5, D: 2.0 };
      if (item && item.reward_rate) {
        try {
          if (typeof item.reward_rate === 'string') {
            rewardCoefficients = JSON.parse(item.reward_rate);
          } else if (typeof item.reward_rate === 'object') {
            rewardCoefficients = item.reward_rate;
          }
        } catch (e) {
          console.error('Error parsing reward_rate:', e);
        }
      }
      winningRate = rewardCoefficients[winningProduct] || 1.0;
    }

    // KHÔNG trả thưởng ngay khi xuất đơn
    // Việc trả thưởng sẽ được thực hiện ở cuối giây cuối cùng của kỳ
    // Thông tin về kết quả sẽ được lưu để xử lý sau
    const selectedRatesArray = Array.isArray(selectedRates) ? selectedRates : [];
    const hasWinningSelection = selectedRatesArray.includes(winningProduct);

    res.status(201).json({
      success: true,
      message: 'Đơn hàng đã được xuất thành công',
      balance: balanceAfter,
      periodNumber: periodNumber,
      winningProduct: winningProductName,
      hasWinningSelection: hasWinningSelection,
      note: 'Thưởng sẽ được xử lý ở cuối kỳ'
    });
  } catch (error) {
    console.error('Error creating item export order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get poll results (admin/staff only) - Lịch sử kết quả
router.get('/admin/poll-results', requireAdmin, async (req, res) => {
  try {
    const filters = {
      periodNumber: req.query.periodNumber,
      votingTypeName: req.query.votingTypeName,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 30
    };
    console.log('📊 Fetching poll results with filters:', filters);
    
    const results = await db.getPollResults(filters);
    console.log(`✅ Found ${results.total} total poll results, returning page ${results.page}`);
    
    res.json(results);
  } catch (error) {
    console.error('❌ Error getting poll results:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get poll history (admin/staff only)
router.get('/admin/poll-history', requireAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching poll history...');
    const history = await db.getAllPollHistory();
    console.log(`✅ Found ${history.length} poll history records`);
    res.json(history);
  } catch (error) {
    console.error('❌ Error getting poll history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current period results (admin only) - Lấy các kỳ đang diễn ra
router.get('/admin/poll-results/current', requireAdmin, async (req, res) => {
  try {
    const results = await db.getCurrentPeriodResults();
    res.json(results);
  } catch (error) {
    console.error('Error getting current period results:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update poll result (admin only) - Cập nhật kết quả của kỳ
router.put('/admin/poll-results/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { winningProduct, winningProduct2, editor } = req.body;
    
    console.log(`📝 Updating poll result ${id}:`, {
      winningProduct,
      winningProduct2,
      editor,
      body: req.body,
      headers: req.headers
    });
    
    if (!winningProduct) {
      console.error('❌ Missing winningProduct');
      return res.status(400).json({ error: 'winningProduct is required' });
    }
    
    // Validate winningProduct (must be A, B, C, or D)
    if (!['A', 'B', 'C', 'D'].includes(winningProduct)) {
      console.error('❌ Invalid winningProduct:', winningProduct);
      return res.status(400).json({ error: 'winningProduct must be A, B, C, or D' });
    }
    
    // Validate winningProduct2 if provided (must be A, B, C, or D)
    if (winningProduct2 && !['A', 'B', 'C', 'D'].includes(winningProduct2)) {
      console.error('❌ Invalid winningProduct2:', winningProduct2);
      return res.status(400).json({ error: 'winningProduct2 must be A, B, C, or D' });
    }
    
    const adminUsername = req.headers['admin-username'] || editor || 'Admin';
    console.log(`✅ Updating poll result ${id} with winningProduct: ${winningProduct}, winningProduct2: ${winningProduct2}, editor: ${adminUsername}`);
    
    const result = await db.updatePollResult(parseInt(id), winningProduct, adminUsername, winningProduct2 || null);
    
    console.log(`✅ Poll result ${id} updated successfully:`, result);
    res.json({ success: true, result });
  } catch (error) {
    console.error('❌ Error updating poll result:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Delete all poll results (admin only) - Xóa tất cả lịch sử kết quả
router.delete('/admin/poll-results', requireAdmin, async (req, res) => {
  try {
    const result = await db.deleteAllPollResults();
    console.log(`🗑️ Deleted ${result.deleted} poll results`);
    res.json({ success: true, deleted: result.deleted });
  } catch (error) {
    console.error('Error deleting all poll results:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint: Force generate poll results for all active items (admin only)
router.post('/admin/poll-results/generate', requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Manual trigger: Generating poll results for all active items...');
    const items = await db.getAllActiveCategoryItems();
    
    if (!items || items.length === 0) {
      return res.json({ 
        success: false, 
        message: 'Không có item nào active',
        itemsCount: 0 
      });
    }
    
    console.log(`Found ${items.length} active items`);
    const results = [];
    
    for (const item of items) {
      try {
        const result = await db.autoGeneratePollResult(item);
        results.push({
          itemId: item.id,
          itemTitle: item.title,
          success: result?.success || false,
          periodNumber: result?.periodNumber || null
        });
      } catch (error) {
        console.error(`Error processing item ${item.id}:`, error);
        results.push({
          itemId: item.id,
          itemTitle: item.title,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({ 
      success: true, 
      message: `Đã xử lý ${items.length} items`,
      itemsCount: items.length,
      results 
    });
  } catch (error) {
    console.error('Error generating poll results:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get poll history by user ID
router.get('/poll-history/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const history = await db.getPollHistoryByUserId(userId);
    res.json(history);
  } catch (error) {
    console.error('Error getting poll history by user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all export orders (admin/staff only)
router.get('/admin/export-orders', async (req, res) => {
  try {
    const exportOrders = await db.getAllExportOrders();
    res.json(exportOrders);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get export orders by user ID
router.get('/export-orders/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);
    
    if (isNaN(userIdInt) || userIdInt <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const exportOrders = await db.getExportOrdersByUserId(userIdInt);
    res.json(exportOrders);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ========== PRODUCT REVIEWS ROUTES ==========
// Get reviews for a product
router.get('/products/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await db.getProductReviews(parseInt(id));
    res.json(reviews);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get product rating statistics
router.get('/products/:id/rating-stats', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await db.getProductRatingStats(parseInt(id));
    res.json(stats);
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Create a review for a product
router.post('/products/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, username, rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const review = await db.createProductReview(
      parseInt(id),
      userId || null,
      username || 'Anonymous',
      parseInt(rating),
      comment || ''
    );
    
    res.status(201).json({ success: true, review });
  } catch (error) {
    // Nếu là lỗi duplicate product code, trả về 400
    if (error.message && error.message.includes('Mã sản phẩm đã tồn tại')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

