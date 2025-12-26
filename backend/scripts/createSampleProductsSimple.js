const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/database.sqlite');

const sampleProducts = [
  {
    productName: 'Áo thun nam cao cấp',
    productCode: 'SP001',
    productLink: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    quantity: 50,
    unitPrice: 250000,
    supplier: 'Nhà cung cấp thời trang ABC',
    notes: 'Áo thun chất liệu cotton 100%, nhiều màu sắc',
    status: 'completed'
  },
  {
    productName: 'Giày thể thao Nike Air Max',
    productCode: 'SP002',
    productLink: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    quantity: 30,
    unitPrice: 2500000,
    supplier: 'Nike Store Việt Nam',
    notes: 'Giày thể thao chính hãng, size 38-44',
    status: 'completed'
  },
  {
    productName: 'Túi xách da thật',
    productCode: 'SP003',
    productLink: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
    quantity: 25,
    unitPrice: 1500000,
    supplier: 'Thương hiệu túi xách XYZ',
    notes: 'Túi xách da bò thật, thiết kế sang trọng',
    status: 'completed'
  },
  {
    productName: 'Đồng hồ thông minh Apple Watch',
    productCode: 'SP004',
    productLink: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=500',
    quantity: 20,
    unitPrice: 8000000,
    supplier: 'Apple Authorized Reseller',
    notes: 'Apple Watch Series 9, màu đen, chính hãng',
    status: 'completed'
  },
  {
    productName: 'Tai nghe không dây Sony WH-1000XM5',
    productCode: 'SP005',
    productLink: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    quantity: 40,
    unitPrice: 6000000,
    supplier: 'Sony Việt Nam',
    notes: 'Tai nghe chống ồn chủ động, pin 30 giờ',
    status: 'completed'
  }
];

// Sử dụng process.stdout.write để đảm bảo output hiển thị
process.stdout.write('🔄 Đang kết nối database...\n');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    process.stdout.write('❌ Lỗi kết nối database: ' + err.message + '\n');
    process.exit(1);
  }
  process.stdout.write('✅ Đã kết nối database\n\n');
});

// Lấy staff đầu tiên
db.get('SELECT id, username FROM staff WHERE referral_code IS NOT NULL AND referral_code != "" LIMIT 1', (err, staff) => {
  if (err) {
    console.error('❌ Lỗi khi lấy staff:', err.message);
    db.close();
    process.exit(1);
  }

  const staffId = staff ? staff.id : null;
  if (staff) {
    process.stdout.write(`📋 Sử dụng staff ID: ${staffId} (${staff.username})\n\n`);
  } else {
    process.stdout.write('⚠️  Không tìm thấy staff nào, sẽ tạo sản phẩm với staff_id = null\n\n');
  }

  process.stdout.write('📦 Đang tạo 5 sản phẩm mẫu...\n\n');

  let completed = 0;
  const total = sampleProducts.length;

  sampleProducts.forEach((product, index) => {
    const totalAmount = product.unitPrice * product.quantity;

    db.run(
      `INSERT INTO import_history 
       (user_id, staff_id, product_name, product_code, product_link, quantity, unit_price, total_amount, supplier, notes, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        null, // user_id
        staffId, // staff_id
        product.productName,
        product.productCode,
        product.productLink,
        product.quantity,
        product.unitPrice,
        totalAmount,
        product.supplier,
        product.notes,
        product.status
      ],
      function(err) {
        if (err) {
          process.stdout.write(`❌ [${index + 1}/${total}] Lỗi khi tạo sản phẩm "${product.productName}": ${err.message}\n`);
        } else {
          process.stdout.write(`✅ [${index + 1}/${total}] Đã tạo sản phẩm: ${product.productName}\n`);
          process.stdout.write(`   - Mã: ${product.productCode}\n`);
          process.stdout.write(`   - Số lượng: ${product.quantity}\n`);
          process.stdout.write(`   - Giá: ${product.unitPrice.toLocaleString('vi-VN')} VNĐ\n`);
          process.stdout.write(`   - Tổng tiền: ${totalAmount.toLocaleString('vi-VN')} VNĐ\n`);
          process.stdout.write(`   - ID: ${this.lastID}\n\n`);
        }

        completed++;
        if (completed === total) {
          process.stdout.write('✨ Hoàn tất! Đã tạo 5 sản phẩm mẫu.\n');
          process.stdout.write('💡 Bạn có thể xem các sản phẩm này trên trang nhập hàng của khách hàng.\n\n');
          db.close();
          process.exit(0);
        }
      }
    );
  });
});
