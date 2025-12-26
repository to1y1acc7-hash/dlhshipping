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

db.get('SELECT id FROM staff LIMIT 1', (err, staff) => {
  const staffId = staff ? staff.id : null;
  let done = 0;
  
  products.forEach((p, i) => {
    db.run(
      `INSERT INTO import_history (user_id, staff_id, product_name, product_code, product_link, quantity, unit_price, total_amount, supplier, notes, status, created_at) 
       VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now'))`,
      [staffId, p.name, p.code, p.img, p.qty, p.price, p.price * p.qty, p.supplier, p.notes],
      function(e) {
        if (!e) {
          console.log(`✅ ${i+1}. ${p.name} (ID: ${this.lastID})`);
          if (++done === 5) {
            console.log('\n✨ Đã tạo xong 5 sản phẩm!');
            db.close();
          }
        }
      }
    );
  });
});
