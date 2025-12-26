const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = path.join(__dirname, '../database/database.sqlite');

const products = [
  { name: 'Áo thun nam cao cấp', code: 'SP001', price: 250000, qty: 50, img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', supplier: 'Nhà cung cấp thời trang ABC', notes: 'Áo thun cotton 100%' },
  { name: 'Giày thể thao Nike Air Max', code: 'SP002', price: 2500000, qty: 30, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', supplier: 'Nike Store Việt Nam', notes: 'Giày chính hãng, size 38-44' },
  { name: 'Túi xách da thật', code: 'SP003', price: 1500000, qty: 25, img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', supplier: 'Thương hiệu túi xách XYZ', notes: 'Túi xách da bò thật' },
  { name: 'Đồng hồ thông minh Apple Watch', code: 'SP004', price: 8000000, qty: 20, img: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=500', supplier: 'Apple Authorized Reseller', notes: 'Apple Watch Series 9' },
  { name: 'Tai nghe không dây Sony WH-1000XM5', code: 'SP005', price: 6000000, qty: 40, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', supplier: 'Sony Việt Nam', notes: 'Tai nghe chống ồn chủ động' }
];

const db = new sqlite3.Database(DB_PATH);

// Kiểm tra số lượng sản phẩm hiện có
db.get('SELECT COUNT(*) as count FROM import_history WHERE staff_id IS NOT NULL', (err, row) => {
  if (err) {
    console.error('❌ Lỗi:', err.message);
    db.close();
    process.exit(1);
  }

  const existingCount = row.count;
  console.log(`📊 Số sản phẩm hiện có: ${existingCount}`);

  if (existingCount >= 5) {
    console.log('✅ Đã có đủ sản phẩm mẫu!');
    db.close();
    process.exit(0);
  }

  console.log(`\n📦 Đang tạo ${5 - existingCount} sản phẩm mẫu...\n`);

  // Lấy staff đầu tiên
  db.get('SELECT id, username FROM staff LIMIT 1', (err, staff) => {
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

    let done = 0;
    const toCreate = 5 - existingCount;

    products.slice(0, toCreate).forEach((p, i) => {
      db.run(
        `INSERT INTO import_history (user_id, staff_id, product_name, product_code, product_link, quantity, unit_price, total_amount, supplier, notes, status, created_at) 
         VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now'))`,
        [staffId, p.name, p.code, p.img, p.qty, p.price, p.price * p.qty, p.supplier, p.notes],
        function(e) {
          if (e) {
            console.error(`❌ ${i+1}. Lỗi: ${e.message}`);
          } else {
            console.log(`✅ ${i+1}. ${p.name} (ID: ${this.lastID})`);
          }
          if (++done === toCreate) {
            console.log(`\n✨ Đã tạo xong ${toCreate} sản phẩm!`);
            db.close();
            process.exit(0);
          }
        }
      );
    });
  });
});
