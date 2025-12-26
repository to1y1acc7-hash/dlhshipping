const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = path.join(__dirname, '../database/database.sqlite');

const products = [
  { name: 'Áo thun nam cao cấp', code: 'SP001', price: 250000, qty: 50, img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', cat: 'Thời trang', sup: 'Nhà cung cấp thời trang ABC', desc: 'Áo thun cotton 100%' },
  { name: 'Giày thể thao Nike Air Max', code: 'SP002', price: 2500000, qty: 30, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', cat: 'Giày dép', sup: 'Nike Store Việt Nam', desc: 'Giày chính hãng, size 38-44' },
  { name: 'Túi xách da thật', code: 'SP003', price: 1500000, qty: 25, img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', cat: 'Phụ kiện', sup: 'Thương hiệu túi xách XYZ', desc: 'Túi xách da bò thật' },
  { name: 'Đồng hồ thông minh Apple Watch', code: 'SP004', price: 8000000, qty: 20, img: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=500', cat: 'Điện tử', sup: 'Apple Authorized Reseller', desc: 'Apple Watch Series 9' },
  { name: 'Tai nghe không dây Sony WH-1000XM5', code: 'SP005', price: 6000000, qty: 40, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', cat: 'Điện tử', sup: 'Sony Việt Nam', desc: 'Tai nghe chống ồn chủ động' }
];

const db = new sqlite3.Database(DB_PATH);
db.get('SELECT id FROM staff LIMIT 1', (err, staff) => {
  const staffId = staff ? staff.id : null;
  let done = 0;
  products.forEach((p, i) => {
    db.run(
      `INSERT INTO products (name, product_code, description, image, price, category, supplier, stock, status, staff_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, datetime('now'))`,
      [p.name, p.code, p.desc, p.img, p.price, p.cat, p.sup, p.qty, staffId],
      function(e) {
        if (!e) {
          process.stdout.write(`✅ ${i+1}. ${p.name} (ID: ${this.lastID})\n`);
          if (++done === 5) {
            process.stdout.write('\n✨ Đã tạo xong 5 sản phẩm!\n');
            db.close();
          }
        }
      }
    );
  });
});
