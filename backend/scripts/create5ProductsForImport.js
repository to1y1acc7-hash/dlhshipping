const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/database.sqlite');

const products = [
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

console.log('🔄 Đang kết nối database...\n');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Lỗi kết nối database:', err.message);
    process.exit(1);
  }
  console.log('✅ Đã kết nối database\n');

  // Lấy staff đầu tiên
  db.get('SELECT id FROM staff LIMIT 1', (err, staff) => {
    if (err) {
      console.error('❌ Lỗi khi lấy staff:', err.message);
      db.close();
      process.exit(1);
    }

    const staffId = staff ? staff.id : null;
    if (staff) {
      console.log(`📋 Sử dụng staff ID: ${staffId}\n`);
    } else {
      console.log('⚠️  Không tìm thấy staff, tạo với staff_id = null\n');
    }

    console.log('📦 Đang tạo 5 sản phẩm mẫu...\n');

    let completed = 0;
    const total = products.length;

    products.forEach((product, index) => {
      db.run(
        `INSERT INTO products (name, product_code, description, image, price, category, supplier, stock, status, staff_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          product.name,
          product.product_code,
          product.description,
          product.image,
          product.price,
          product.category,
          product.supplier,
          product.stock,
          product.status,
          staffId
        ],
        function(err) {
          if (err) {
            console.error(`❌ [${index + 1}/${total}] Lỗi:`, err.message);
          } else {
            console.log(`✅ [${index + 1}/${total}] ${product.name}`);
            console.log(`   Mã: ${product.product_code} | Giá: ${product.price.toLocaleString('vi-VN')} VNĐ | SL: ${product.stock}`);
          }

          completed++;
          if (completed === total) {
            console.log('\n✨ Hoàn tất! Đã tạo 5 sản phẩm mẫu.');
            console.log('💡 Các sản phẩm này sẽ hiển thị trên trang nhập hàng (http://localhost:5173/import)\n');
            db.close();
            process.exit(0);
          }
        }
      );
    });
  });
});
