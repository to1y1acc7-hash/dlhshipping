const db = require('../database/db');

async function createAdmin() {
  try {
    // Khởi tạo database
    await db.init();
    console.log('✅ Database initialized');

    const username = 'admin';
    const password = 'admin123';
    const referralCode = null;

    // Kiểm tra admin đã tồn tại chưa
    const existingAdmin = await db.getUserByUsername(username);
    
    if (existingAdmin) {
      console.log(`⚠️  Admin "${username}" đã tồn tại. Đang cập nhật mật khẩu...`);
      
      // Cập nhật mật khẩu
      const sqlite3 = require('sqlite3').verbose();
      const path = require('path');
      const DB_PATH = path.join(__dirname, '../database/database.sqlite');
      const database = new sqlite3.Database(DB_PATH);
      
      return new Promise((resolve, reject) => {
        database.run(
          'UPDATE users SET password = ? WHERE username = ?',
          [password, username],
          function(err) {
            if (err) {
              reject(err);
            } else {
              console.log(`✅ Đã cập nhật mật khẩu cho admin "${username}"`);
              console.log(`   Username: ${username}`);
              console.log(`   Password: ${password}`);
              database.close();
              resolve();
            }
          }
        );
      });
    } else {
      // Tạo admin mới
      const user = await db.createUser(username, password, referralCode);
      console.log(`✅ Đã tạo tài khoản admin:`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Password: ${password}`);
      console.log(`   ID: ${user.id}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo admin:', error);
    process.exit(1);
  }
}

createAdmin();

