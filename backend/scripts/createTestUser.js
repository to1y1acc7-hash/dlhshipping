const db = require('../database/db');

async function createTestUser() {
  try {
    // Khởi tạo database
    await db.init();
    console.log('✅ Database initialized');

    const username = 'HAN50TY';
    const password = 'HAN50TY';
    const referralCode = null;

    // Kiểm tra user đã tồn tại chưa
    const existingUser = await db.getUserByUsername(username);
    
    if (existingUser) {
      console.log(`⚠️  User "${username}" đã tồn tại. Đang cập nhật mật khẩu...`);
      
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
              console.log(`✅ Đã cập nhật mật khẩu cho user "${username}"`);
              database.close();
              resolve();
            }
          }
        );
      });
    } else {
      // Tạo user mới
      const user = await db.createUser(username, password, referralCode);
      console.log(`✅ Đã tạo tài khoản test:`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Password: ${password}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Balance: ${user.balance}`);
      console.log(`   Credit Score: ${user.credit_score}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo user:', error);
    process.exit(1);
  }
}

createTestUser();

