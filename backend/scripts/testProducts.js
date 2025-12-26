const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/database.sqlite');

console.log('🔍 Đang kiểm tra sản phẩm trong database...\n');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Lỗi kết nối database:', err.message);
    process.exit(1);
  }

  // Đếm tổng số sản phẩm
  db.all(
    `SELECT id, product_name, product_code, quantity, unit_price, status, staff_id 
     FROM import_history 
     WHERE staff_id IS NOT NULL 
     ORDER BY id DESC 
     LIMIT 10`,
    (err, rows) => {
      if (err) {
        console.error('❌ Lỗi:', err.message);
        db.close();
        process.exit(1);
      }

      console.log(`📊 Tìm thấy ${rows.length} sản phẩm được tạo bởi nhân viên:\n`);

      if (rows.length === 0) {
        console.log('⚠️  Chưa có sản phẩm nào. Đang tạo 5 sản phẩm mẫu...\n');
        createSampleProducts(db);
      } else {
        rows.forEach((r, i) => {
          console.log(`${i + 1}. ${r.product_name}`);
          console.log(`   - Mã: ${r.product_code}`);
          console.log(`   - Số lượng: ${r.quantity}`);
          console.log(`   - Giá: ${r.unit_price.toLocaleString('vi-VN')} VNĐ`);
          console.log(`   - Trạng thái: ${r.status}`);
          console.log(`   - Staff ID: ${r.staff_id}`);
          console.log('');
        });
        db.close();
      }
    }
  );
});

function createSampleProducts(db) {
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

  // Lấy staff đầu tiên
  db.get('SELECT id, username FROM staff WHERE referral_code IS NOT NULL AND referral_code != "" LIMIT 1', (err, staff) => {
    if (err) {
      console.error('❌ Lỗi khi lấy staff:', err.message);
      db.close();
      process.exit(1);
    }

    const staffId = staff ? staff.id : null;
    if (staff) {
      console.log(`📋 Sử dụng staff ID: ${staffId} (${staff.username})\n`);
    } else {
      console.log('⚠️  Không tìm thấy staff, tạo với staff_id = null\n');
    }

    let completed = 0;
    const total = sampleProducts.length;

    sampleProducts.forEach((product, index) => {
      const totalAmount = product.unitPrice * product.quantity;

      db.run(
        `INSERT INTO import_history 
         (user_id, staff_id, product_name, product_code, product_link, quantity, unit_price, total_amount, supplier, notes, status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          null,
          staffId,
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
            console.error(`❌ [${index + 1}/${total}] Lỗi:`, err.message);
          } else {
            console.log(`✅ [${index + 1}/${total}] ${product.productName}`);
            console.log(`   Mã: ${product.productCode} | SL: ${product.quantity} | Giá: ${product.unitPrice.toLocaleString('vi-VN')} VNĐ`);
          }

          completed++;
          if (completed === total) {
            console.log('\n✨ Hoàn tất! Đã tạo 5 sản phẩm mẫu.');
            console.log('💡 Xem sản phẩm trên trang nhập hàng của khách hàng.\n');
            db.close();
            process.exit(0);
          }
        }
      );
    });
  });
}
