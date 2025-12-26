const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'database.sqlite');

let db = null;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      }
    });
  }
  return db;
}

function init() {
  return new Promise((resolve, reject) => {
    const database = getDb();
    
    database.serialize(() => {
      // Services table
      database.run(`
        CREATE TABLE IF NOT EXISTS services (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          price REAL,
          category TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // News table
      database.run(`
        CREATE TABLE IF NOT EXISTS news (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT,
          image TEXT,
          author TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // Categories table
      database.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          quantity INTEGER DEFAULT 0,
          status TEXT DEFAULT 'active',
          description TEXT,
          image TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        // Add missing columns if table already existed
        database.all(`PRAGMA table_info(categories)`, (pragmaErr, columns) => {
          if (pragmaErr) {
            console.error('Error checking categories table:', pragmaErr);
            return;
          }
          const columnNames = columns.map(col => col.name);
          if (!columnNames.includes('description')) {
            database.run(`ALTER TABLE categories ADD COLUMN description TEXT`, (alterErr) => {
              if (alterErr) {
                console.error('Error adding description to categories:', alterErr.message);
              }
            });
          }
          if (!columnNames.includes('image')) {
            database.run(`ALTER TABLE categories ADD COLUMN image TEXT`, (alterErr) => {
              if (alterErr) {
                console.error('Error adding image to categories:', alterErr.message);
              }
            });
          }
        });
      });

      // Category items table (child list under categories)
      database.run(`
        CREATE TABLE IF NOT EXISTS category_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          reward_rate TEXT DEFAULT '{"A": 1.0, "B": 1.2, "C": 1.5, "D": 2.0}',
          image TEXT,
          content TEXT,
          balance_required REAL DEFAULT 0,
          item_key TEXT,
          game TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        // Migration: Convert reward_rate from REAL to TEXT (JSON format)
        database.all(`PRAGMA table_info(category_items)`, (pragmaErr, columns) => {
          if (pragmaErr) {
            console.error('Error checking category_items table:', pragmaErr);
            return;
          }
          const rewardRateColumn = columns.find(col => col.name === 'reward_rate');
          if (rewardRateColumn && rewardRateColumn.type === 'REAL') {
            // Migrate existing REAL values to JSON format
            database.all(`SELECT id, reward_rate FROM category_items WHERE reward_rate IS NOT NULL`, (selectErr, rows) => {
              if (selectErr) {
                console.error('Error selecting reward_rate for migration:', selectErr);
                return;
              }
              // Create a temporary column
              database.run(`ALTER TABLE category_items ADD COLUMN reward_rate_new TEXT`, (alterErr1) => {
                if (alterErr1 && !alterErr1.message.includes('duplicate column')) {
                  console.error('Error adding new reward_rate column:', alterErr1);
                  return;
                }
                // Migrate data: convert old REAL values to default JSON
                rows.forEach(row => {
                  const defaultCoefficients = JSON.stringify({ A: 1.0, B: 1.2, C: 1.5, D: 2.0 });
                  database.run(`UPDATE category_items SET reward_rate_new = ? WHERE id = ?`, 
                    [defaultCoefficients, row.id], (updateErr) => {
                      if (updateErr) {
                        console.error('Error updating reward_rate:', updateErr);
                      }
                    });
                });
                // Drop old column and rename new one (SQLite doesn't support DROP COLUMN directly)
                // We'll keep both columns and handle in code, or use a more complex migration
                // For now, we'll handle both formats in the code
              });
            });
          }
        });
      });

      // Tracking table
      database.run(`
        CREATE TABLE IF NOT EXISTS tracking (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tracking_number TEXT UNIQUE NOT NULL,
          status TEXT,
          location TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // Orders table (kept for backward compatibility)
      database.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_number TEXT UNIQUE NOT NULL,
          user_id INTEGER,
          customer_name TEXT NOT NULL,
          customer_email TEXT,
          customer_phone TEXT,
          product_link TEXT,
          quantity INTEGER,
          notes TEXT,
          service_id INTEGER,
          tracking_number TEXT,
          status TEXT DEFAULT 'pending',
          total_amount REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (service_id) REFERENCES services(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Migration: Add new columns if they don't exist (ignore errors if columns already exist)
          // Check if table exists and add columns
          database.all(`PRAGMA table_info(orders)`, (err, columns) => {
            if (err) {
              console.error('Error checking table info:', err);
            } else {
              const columnNames = columns.map(col => col.name);
              console.log('Existing columns in orders table:', columnNames);
              
              if (!columnNames.includes('user_id')) {
                database.run(`ALTER TABLE orders ADD COLUMN user_id INTEGER`, (err) => {
                  if (err) {
                    console.error('Error adding user_id column:', err.message);
                  } else {
                    console.log('Successfully added user_id column');
                  }
                });
              }
              
              if (!columnNames.includes('product_link')) {
                database.run(`ALTER TABLE orders ADD COLUMN product_link TEXT`, (err) => {
                  if (err) {
                    console.error('Error adding product_link column:', err.message);
                  } else {
                    console.log('Successfully added product_link column');
                  }
                });
              }
              
              if (!columnNames.includes('quantity')) {
                database.run(`ALTER TABLE orders ADD COLUMN quantity INTEGER`, (err) => {
                  if (err) {
                    console.error('Error adding quantity column:', err.message);
                  } else {
                    console.log('Successfully added quantity column');
                  }
                });
              }
              
              if (!columnNames.includes('notes')) {
                database.run(`ALTER TABLE orders ADD COLUMN notes TEXT`, (err) => {
                  if (err) {
                    console.error('Error adding notes column:', err.message);
                  } else {
                    console.log('Successfully added notes column');
                  }
                });
              }
            }
          });
        }
      });

      // Order Set table (new table to replace orders)
      database.run(`
        CREATE TABLE IF NOT EXISTS order_set (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_number TEXT UNIQUE NOT NULL,
          user_id INTEGER,
          customer_name TEXT NOT NULL,
          customer_email TEXT,
          customer_phone TEXT,
          product_link TEXT,
          quantity INTEGER,
          notes TEXT,
          service_id INTEGER,
          tracking_number TEXT,
          status TEXT DEFAULT 'pending',
          total_amount REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (service_id) REFERENCES services(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Migration: Copy data from orders to order_set if order_set is empty
          database.get(`SELECT COUNT(*) as count FROM order_set`, (err, row) => {
            if (err) {
              console.error('Error checking order_set count:', err);
            } else {
              if (row && row.count === 0) {
                console.log('Migrating data from orders to order_set...');
                database.run(`
                  INSERT INTO order_set (
                    order_number, user_id, customer_name, customer_email, customer_phone,
                    product_link, quantity, notes, service_id, tracking_number,
                    status, total_amount, created_at
                  )
                  SELECT 
                    order_number, user_id, customer_name, customer_email, customer_phone,
                    product_link, quantity, notes, service_id, tracking_number,
                    status, total_amount, created_at
                  FROM orders
                `, (err) => {
                  if (err) {
                    console.error('Error migrating data from orders to order_set:', err.message);
                  } else {
                    console.log('Successfully migrated data from orders to order_set');
                  }
                });
              } else {
                console.log('order_set already has data, skipping migration');
              }
            }
          });
        }
      });

      // Users table
      database.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          referral_code TEXT,
          balance REAL DEFAULT 0,
          credit_score INTEGER DEFAULT 100,
          ip_address TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login_at DATETIME,
          last_login_ip TEXT
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Migration: Add new columns if not exists
          database.all(`PRAGMA table_info(users)`, (err, columns) => {
            if (!err) {
              const columnNames = columns.map(col => col.name);
              
              // Add bank linking columns if not exists
              if (!columnNames.includes('bank_name')) {
                database.run(`ALTER TABLE users ADD COLUMN bank_name TEXT`, (err) => {
                  if (err) console.error('Error adding bank_name column:', err);
                  else console.log('Added bank_name column to users table');
                });
              }
              if (!columnNames.includes('bank_account_number')) {
                database.run(`ALTER TABLE users ADD COLUMN bank_account_number TEXT`, (err) => {
                  if (err) console.error('Error adding bank_account_number column:', err);
                  else console.log('Added bank_account_number column to users table');
                });
              }
              if (!columnNames.includes('bank_account_holder')) {
                database.run(`ALTER TABLE users ADD COLUMN bank_account_holder TEXT`, (err) => {
                  if (err) console.error('Error adding bank_account_holder column:', err);
                  else console.log('Added bank_account_holder column to users table');
                });
              }
              
              // Add withdrawal_enabled column if not exists
              if (!columnNames.includes('withdrawal_enabled')) {
                database.run(`ALTER TABLE users ADD COLUMN withdrawal_enabled INTEGER DEFAULT 1`, (err) => {
                  if (err) console.error('Error adding withdrawal_enabled column:', err);
                  else console.log('Added withdrawal_enabled column to users table');
                });
              }
              
              // Add min_withdrawal column if not exists
              if (!columnNames.includes('min_withdrawal')) {
                database.run(`ALTER TABLE users ADD COLUMN min_withdrawal REAL DEFAULT 0`, (err) => {
                  if (err) console.error('Error adding min_withdrawal column:', err);
                  else console.log('Added min_withdrawal column to users table');
                });
              }
              
              // Add max_withdrawal column if not exists
              if (!columnNames.includes('max_withdrawal')) {
                database.run(`ALTER TABLE users ADD COLUMN max_withdrawal REAL DEFAULT 0`, (err) => {
                  if (err) console.error('Error adding max_withdrawal column:', err);
                  else console.log('Added max_withdrawal column to users table');
                });
              }
              
              // Add vip_level column if not exists
              if (!columnNames.includes('vip_level')) {
                database.run(`ALTER TABLE users ADD COLUMN vip_level INTEGER DEFAULT 0`, (err) => {
                  if (err) console.error('Error adding vip_level column:', err);
                  else console.log('Added vip_level column to users table');
                });
              }
              
              if (!columnNames.includes('ip_address')) {
                database.run(`ALTER TABLE users ADD COLUMN ip_address TEXT`, (err) => {
                  if (!err) console.log('Added ip_address column to users');
                });
              }
              
              if (!columnNames.includes('status')) {
                database.run(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`, (err) => {
                  if (!err) console.log('Added status column to users');
                });
              }
              
              if (!columnNames.includes('last_login_at')) {
                database.run(`ALTER TABLE users ADD COLUMN last_login_at DATETIME`, (err) => {
                  if (!err) console.log('Added last_login_at column to users');
                });
              }
              
              if (!columnNames.includes('last_login_ip')) {
                database.run(`ALTER TABLE users ADD COLUMN last_login_ip TEXT`, (err) => {
                  if (!err) console.log('Added last_login_ip column to users');
                });
              }
              
              // Add bank linking columns if not exists
              if (!columnNames.includes('bank_name')) {
                database.run(`ALTER TABLE users ADD COLUMN bank_name TEXT`, (err) => {
                  if (err) console.error('Error adding bank_name column:', err);
                  else console.log('Added bank_name column to users table');
                });
              }
              if (!columnNames.includes('bank_account_number')) {
                database.run(`ALTER TABLE users ADD COLUMN bank_account_number TEXT`, (err) => {
                  if (err) console.error('Error adding bank_account_number column:', err);
                  else console.log('Added bank_account_number column to users table');
                });
              }
              if (!columnNames.includes('bank_account_holder')) {
                database.run(`ALTER TABLE users ADD COLUMN bank_account_holder TEXT`, (err) => {
                  if (err) console.error('Error adding bank_account_holder column:', err);
                  else console.log('Added bank_account_holder column to users table');
                });
              }
            }
          });
        }
      });

      // Admins table (tài khoản quản trị)
      database.run(`
        CREATE TABLE IF NOT EXISTS admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          full_name TEXT,
          email TEXT,
          phone TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating admins table:', err.message);
        } else {
          // Tạo tài khoản admin mặc định nếu chưa có
          database.get(`SELECT COUNT(*) as count FROM admins`, (err, row) => {
            if (!err && row && row.count === 0) {
              database.run(
                `INSERT INTO admins (username, password, full_name, email, phone) VALUES (?, ?, ?, ?, ?)`,
                ['admin', 'admin123', 'Administrator', 'admin@dhlshipping.com', '0123456789'],
                (err) => {
                  if (!err) {
                    console.log('Created default admin account: admin / admin123');
                  }
                }
              );
            }
          });
        }
      });

      // Staff table (nhân viên - có mã giới thiệu)
      database.run(`
        CREATE TABLE IF NOT EXISTS staff (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          full_name TEXT,
          email TEXT,
          phone TEXT,
          position TEXT,
          referral_code TEXT UNIQUE,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Migration: Add referral_code column if not exists
          database.all(`PRAGMA table_info(staff)`, (err, columns) => {
            if (!err) {
              const columnNames = columns.map(col => col.name);
              if (!columnNames.includes('referral_code')) {
                // SQLite doesn't allow adding UNIQUE column with ALTER TABLE, so add without UNIQUE
                database.run(`ALTER TABLE staff ADD COLUMN referral_code TEXT`, (err) => {
                  if (err) {
                    console.error('Error adding referral_code column to staff:', err.message);
                  } else {
                    console.log('Successfully added referral_code column to staff');
                    // Generate referral codes for existing staff
                    database.all(`SELECT id FROM staff WHERE referral_code IS NULL`, (err, rows) => {
                      if (!err && rows) {
                        rows.forEach(row => {
                          const code = 'NV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
                          database.run(`UPDATE staff SET referral_code = ? WHERE id = ?`, [code, row.id]);
                        });
                      }
                    });
                  }
                });
              }
            }
          });
        }
      });

      // Transactions table (for money management)
      database.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          username TEXT NOT NULL,
          transaction_type TEXT NOT NULL,
          amount REAL NOT NULL,
          balance_before REAL,
          balance_after REAL,
          description TEXT,
          status TEXT DEFAULT 'pending',
          admin_note TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        }
      });

      // Products table (catalog - nhân viên tạo để user chọn)
      database.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          product_code TEXT,
          description TEXT,
          image TEXT,
          price REAL,
          category TEXT,
          supplier TEXT,
          staff_id INTEGER,
          stock INTEGER DEFAULT 0,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Migration: Add columns if not exists
          database.all("PRAGMA table_info(products)", (err, columns) => {
            if (!err) {
              const columnNames = columns.map(col => col.name);
              if (!columnNames.includes('product_code')) {
                database.run(`ALTER TABLE products ADD COLUMN product_code TEXT`, (err) => {
                  if (!err) console.log('Added product_code column to products');
                });
              }
              if (!columnNames.includes('supplier')) {
                database.run(`ALTER TABLE products ADD COLUMN supplier TEXT`, (err) => {
                  if (!err) console.log('Added supplier column to products');
                });
              }
              if (!columnNames.includes('staff_id')) {
                database.run(`ALTER TABLE products ADD COLUMN staff_id INTEGER`, (err) => {
                  if (!err) console.log('Added staff_id column to products');
                });
              }
            }
          });
        }
      });

      // Import history table (Lịch sử nhập hàng)
      database.run(`
        CREATE TABLE IF NOT EXISTS import_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          staff_id INTEGER,
          product_name TEXT NOT NULL,
          product_code TEXT,
          product_link TEXT,
          quantity INTEGER NOT NULL,
          unit_price REAL,
          total_amount REAL,
          supplier TEXT,
          notes TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Migration: Add staff_id column if not exists
          database.all("PRAGMA table_info(import_history)", (err, columns) => {
            if (!err) {
              const columnNames = columns.map(col => col.name);
              if (!columnNames.includes('staff_id')) {
                database.run(`ALTER TABLE import_history ADD COLUMN staff_id INTEGER`, (err) => {
                  if (err) {
                    console.error('Error adding staff_id column to import_history:', err.message);
                  } else {
                    console.log('Successfully added staff_id column to import_history');
                  }
                });
              }
              // Migration: Add product_code column if not exists
              if (!columnNames.includes('product_code')) {
                database.run(`ALTER TABLE import_history ADD COLUMN product_code TEXT`, (err) => {
                  if (err) {
                    console.error('Error adding product_code column to import_history:', err.message);
                  } else {
                    console.log('Successfully added product_code column to import_history');
                  }
                });
              }
              
              // Migration: Check if user_id allows NULL
              const userIdColumn = columns.find(col => col.name === 'user_id');
              if (userIdColumn && userIdColumn.notnull === 1) {
                // Table exists with NOT NULL constraint - need to handle this
                // SQLite doesn't support ALTER COLUMN, so we'll disable foreign key checks temporarily
                console.log('Warning: import_history.user_id has NOT NULL constraint. Attempting to handle NULL values...');
              }
              
            }
          });
        }
      });

      // Export history table (Lịch sử xuất hàng)
      database.run(`
        CREATE TABLE IF NOT EXISTS export_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          product_name TEXT NOT NULL,
          product_link TEXT,
          quantity INTEGER NOT NULL,
          unit_price REAL,
          total_amount REAL,
          recipient_name TEXT,
          recipient_phone TEXT,
          recipient_address TEXT,
          notes TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        }
      });

      // Product Reviews table
      database.run(`
        CREATE TABLE IF NOT EXISTS product_reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          user_id INTEGER,
          username TEXT,
          rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        }
      });

      // Poll History table (Lịch sử bình chọn)
      database.run(`
        CREATE TABLE IF NOT EXISTS poll_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          username TEXT,
          item_id INTEGER NOT NULL,
          item_title TEXT NOT NULL,
          item_key TEXT,
          period_number TEXT,
          amount REAL NOT NULL,
          selected_rates TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (item_id) REFERENCES category_items(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        }
      });

      // Export Orders table (for brand export orders)
      database.run(`
        CREATE TABLE IF NOT EXISTS export_orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_code TEXT UNIQUE NOT NULL,
          user_id INTEGER NOT NULL,
          brand_id INTEGER,
          brand_name TEXT,
          total_amount REAL NOT NULL,
          balance_before REAL,
          balance_after REAL,
          products TEXT NOT NULL,
          status TEXT DEFAULT 'completed',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        }
      });

      // Poll Results table (Lịch sử kết quả bình chọn)
      database.run(`
        CREATE TABLE IF NOT EXISTS poll_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER NOT NULL,
          item_title TEXT NOT NULL,
          item_key TEXT,
          period_number TEXT,
          winning_product TEXT NOT NULL,
          winning_rate TEXT NOT NULL,
          reward_amount REAL NOT NULL,
          user_id INTEGER,
          username TEXT,
          bet_amount REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES category_items(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Migration: Add updated_at column if not exists
          database.all("PRAGMA table_info(poll_results)", (err, columns) => {
            if (!err) {
              const columnNames = columns.map(col => col.name);
              if (!columnNames.includes('updated_at')) {
                database.run(`ALTER TABLE poll_results ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
                  if (!err) {
                    console.log('✅ Added updated_at column to poll_results');
                  } else {
                    console.error('Error adding updated_at column to poll_results:', err);
                  }
                });
              }
              // Migration: Add winning_rate_2 column if not exists
              if (!columnNames.includes('winning_rate_2')) {
                database.run(`ALTER TABLE poll_results ADD COLUMN winning_rate_2 TEXT`, (err) => {
                  if (!err) {
                    console.log('✅ Added winning_rate_2 column to poll_results');
                  } else {
                    console.error('Error adding winning_rate_2 column to poll_results:', err);
                  }
                });
              }
            }
          });
        }
      });

      // Item Periods table (Lưu kỳ số hiện tại cho mỗi item)
      database.run(`
        CREATE TABLE IF NOT EXISTS item_periods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER NOT NULL UNIQUE,
          current_period INTEGER DEFAULT 1,
          period_start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          game_duration_seconds INTEGER DEFAULT 120,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES category_items(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        }
      });

      // Settings table
      database.run(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          setting_key TEXT UNIQUE NOT NULL,
          setting_value TEXT,
          description TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Insert default settings if not exists
          database.run(`
            INSERT OR IGNORE INTO settings (setting_key, setting_value, description) VALUES
            ('company_description', 'DHLSHIPPING cung cấp dịch vụ đặt hàng từ Úc, Mỹ, Hàn Quốc, Thái Lan và dịch vụ vận chuyển hàng hóa đến các quốc gia như Mỹ, Đức, Pháp, Hungary, Việt Nam... Chúng tôi giúp khách hàng trên toàn thế giới tiếp cận với những sản phẩm chất lượng cao và chinh phục thị trường toàn cầu.', 'Mô tả công ty'),
            ('address_australia', '1/283 Coward St, Mascot NSW 2020, Australia', 'Địa chỉ Australia'),
            ('address_korea', '충청북도 청주시 구 오창읍 각리 가곡로 459 청원', 'Địa chỉ Hàn Quốc'),
            ('address_vietnam', '348 Nguyễn Văn Công, Phường 3, Gò Vấp, Hồ Chí Minh', 'Địa chỉ Việt Nam'),
            ('telegram_link', '', 'Link Telegram'),
            ('fanpage_link', '', 'Link Fanpage Facebook'),
            ('support_phone', '1900-xxxx', 'Số điện thoại hỗ trợ'),
            ('fanpage_name', 'DHL Shipping', 'Tên Fanpage'),
            ('fanpage_followers', '3.676 người theo dõi', 'Số người theo dõi'),
            ('bank_name', '', 'Tên ngân hàng'),
            ('bank_account_holder', '', 'Chủ tài khoản'),
            ('bank_account_number', '', 'Số tài khoản')
          `, (err) => {
            if (err) {
              console.error('Error inserting default settings:', err);
            }
            // Tạo 5 sản phẩm mẫu nếu chưa có (giống như tạo admin mặc định)
            createSampleProducts(database, resolve);
          });
        }
      });
    });
  });
}

// Function để tạo 5 sản phẩm mẫu (giống như tạo admin mặc định)
function createSampleProducts(database, callback) {
  database.get(`SELECT COUNT(*) as count FROM import_history WHERE staff_id IS NOT NULL`, (err, row) => {
    if (err) {
      console.error('Error checking sample products:', err);
      callback();
      return;
    }
    
    if (row && row.count === 0) {
      // Lấy staff đầu tiên để gán vào sản phẩm
      database.get(`SELECT id FROM staff LIMIT 1`, (err, staff) => {
        const staffId = staff ? staff.id : null;
        
        const sampleProducts = [
          {
            name: 'Áo thun nam cao cấp',
            code: 'SP001',
            link: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
            quantity: 50,
            unitPrice: 250000,
            totalAmount: 12500000,
            supplier: 'Nhà cung cấp thời trang ABC',
            notes: 'Áo thun chất liệu cotton 100%, nhiều màu sắc',
            status: 'completed'
          },
          {
            name: 'Giày thể thao Nike Air Max',
            code: 'SP002',
            link: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
            quantity: 30,
            unitPrice: 2500000,
            totalAmount: 75000000,
            supplier: 'Nike Store Việt Nam',
            notes: 'Giày thể thao chính hãng, size 38-44',
            status: 'completed'
          },
          {
            name: 'Túi xách da thật',
            code: 'SP003',
            link: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
            quantity: 25,
            unitPrice: 1500000,
            totalAmount: 37500000,
            supplier: 'Thương hiệu túi xách XYZ',
            notes: 'Túi xách da bò thật, thiết kế sang trọng',
            status: 'completed'
          },
          {
            name: 'Đồng hồ thông minh Apple Watch',
            code: 'SP004',
            link: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=500',
            quantity: 20,
            unitPrice: 8000000,
            totalAmount: 160000000,
            supplier: 'Apple Authorized Reseller',
            notes: 'Apple Watch Series 9, màu đen, chính hãng',
            status: 'completed'
          },
          {
            name: 'Tai nghe không dây Sony WH-1000XM5',
            code: 'SP005',
            link: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
            quantity: 40,
            unitPrice: 6000000,
            totalAmount: 240000000,
            supplier: 'Sony Việt Nam',
            notes: 'Tai nghe chống ồn chủ động, pin 30 giờ',
            status: 'completed'
          }
        ];
        
        let inserted = 0;
        const total = sampleProducts.length;
        
        if (total === 0) {
          callback();
          return;
        }
        
        sampleProducts.forEach((product) => {
          database.run(
            `INSERT INTO import_history (user_id, staff_id, product_name, product_code, product_link, quantity, unit_price, total_amount, supplier, notes, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [
              null, // user_id
              staffId, // staff_id
              product.name,
              product.code,
              product.link,
              product.quantity,
              product.unitPrice,
              product.totalAmount,
              product.supplier,
              product.notes,
              product.status
            ],
            (err) => {
              if (!err) {
                inserted++;
                if (inserted === total) {
                  console.log(`Created ${total} sample products in import_history`);
                  callback();
                }
              } else {
                console.error('Error creating sample product:', err.message);
                inserted++;
                if (inserted === total) {
                  callback();
                }
              }
            }
          );
        });
      });
    } else {
      callback();
    }
  });
}

// Services functions
function getAllServices() {
  return new Promise((resolve, reject) => {
    getDb().all('SELECT * FROM services ORDER BY created_at DESC', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function getServiceById(id) {
  return new Promise((resolve, reject) => {
    getDb().get('SELECT * FROM services WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function createService(name, description, icon, price, category) {
  return new Promise((resolve, reject) => {
    getDb().run(
      'INSERT INTO services (name, description, icon, price, category) VALUES (?, ?, ?, ?, ?)',
      [name, description, icon, price, category],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, name, description, icon, price, category });
        }
      }
    );
  });
}

// News functions
function getAllNews() {
  return new Promise((resolve, reject) => {
    getDb().all('SELECT * FROM news ORDER BY created_at DESC', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function getNewsById(id) {
  return new Promise((resolve, reject) => {
    getDb().get('SELECT * FROM news WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function createNews(title, content, image, author) {
  return new Promise((resolve, reject) => {
    getDb().run(
      'INSERT INTO news (title, content, image, author) VALUES (?, ?, ?, ?)',
      [title, content, image, author],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, title, content, image, author });
        }
      }
    );
  });
}

// Category functions
function getAllCategories() {
  return new Promise((resolve, reject) => {
    getDb().all(
      'SELECT id, name, quantity, status, description, image, created_at FROM categories ORDER BY created_at DESC',
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

function getCategoryById(id) {
  return new Promise((resolve, reject) => {
    getDb().get(
      'SELECT id, name, quantity, status, description, image, created_at FROM categories WHERE id = ?',
      [id],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

function createCategory(name, quantity = 0, status = 'active', description = '', image = '') {
  return new Promise((resolve, reject) => {
    getDb().run(
      'INSERT INTO categories (name, quantity, status, description, image) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), quantity || 0, status === 'inactive' ? 'inactive' : 'active', description || '', image || ''],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            name: name.trim(),
            quantity: quantity || 0,
            status: status === 'inactive' ? 'inactive' : 'active',
            description: description || '',
            image: image || ''
          });
        }
      }
    );
  });
}

function updateCategory(id, name, quantity = 0, status = 'active', description = '', image = '') {
  return new Promise((resolve, reject) => {
    const normalizedStatus = status === 'inactive' ? 'inactive' : 'active';
    getDb().run(
      'UPDATE categories SET name = ?, quantity = ?, status = ?, description = ?, image = ? WHERE id = ?',
      [name.trim(), quantity || 0, normalizedStatus, description || '', image || '', id],
      async function(err) {
        if (err) {
          reject(err);
        } else {
          const updated = await getCategoryById(id);
          resolve(updated);
        }
      }
    );
  });
}

function deleteCategory(id) {
  return new Promise((resolve, reject) => {
    getDb().run('DELETE FROM categories WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

// Category items (list) functions
function getAllCategoryItems(categoryId = null) {
  return new Promise((resolve, reject) => {
    const params = [];
    let query = `
      SELECT ci.*, c.name as category_name
      FROM category_items ci
      LEFT JOIN categories c ON ci.category_id = c.id
    `;
    if (categoryId) {
      query += ' WHERE ci.category_id = ?';
      params.push(categoryId);
    }
    query += ' ORDER BY ci.created_at DESC';

    getDb().all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function getCategoryItemById(id) {
  return new Promise((resolve, reject) => {
    getDb().get(
      `
      SELECT ci.*, c.name as category_name
      FROM category_items ci
      LEFT JOIN categories c ON ci.category_id = c.id
      WHERE ci.id = ?
      `,
      [id],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

function getAllActiveCategoryItems() {
  return new Promise((resolve, reject) => {
    getDb().all(
      `
      SELECT ci.*, c.name as category_name
      FROM category_items ci
      LEFT JOIN categories c ON ci.category_id = c.id
      WHERE ci.status = 'active'
      ORDER BY ci.id ASC
      `,
      [],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

// Helper function to normalize reward_rate to JSON string format
function normalizeRewardRate(rewardRate) {
  if (!rewardRate) {
    return JSON.stringify({ A: 1.0, B: 1.2, C: 1.5, D: 2.0 });
  }
  
  // If it's already a JSON string, validate and return
  if (typeof rewardRate === 'string') {
    try {
      const parsed = JSON.parse(rewardRate);
      if (typeof parsed === 'object' && parsed !== null && ('A' in parsed || 'B' in parsed || 'C' in parsed || 'D' in parsed)) {
        return rewardRate; // Valid JSON string
      }
    } catch (e) {
      // Not a JSON string, might be old format (single letter or number)
    }
    
    // If it's a single letter (A, B, C, D), convert to default coefficients
    if (['A', 'B', 'C', 'D'].includes(rewardRate)) {
      return JSON.stringify({ A: 1.0, B: 1.2, C: 1.5, D: 2.0 });
    }
  }
  
  // If it's an object, stringify it
  if (typeof rewardRate === 'object' && rewardRate !== null) {
    return JSON.stringify(rewardRate);
  }
  
  // Default fallback
  return JSON.stringify({ A: 1.0, B: 1.2, C: 1.5, D: 2.0 });
}

function createCategoryItem(categoryId, title, rewardRate, image, content, balanceRequired, itemKey, game, status) {
  return new Promise((resolve, reject) => {
    const normalizedStatus = status === 'inactive' ? 'inactive' : 'active';
    const normalizedRewardRate = normalizeRewardRate(rewardRate);
    
    getDb().run(
      `
      INSERT INTO category_items 
      (category_id, title, reward_rate, image, content, balance_required, item_key, game, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        categoryId,
        title,
        normalizedRewardRate,
        image || '',
        content || '',
        balanceRequired || 0,
        itemKey || '',
        game || '',
        normalizedStatus
      ],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            category_id: categoryId,
            title,
            reward_rate: normalizedRewardRate,
            image: image || '',
            content: content || '',
            balance_required: balanceRequired || 0,
            item_key: itemKey || '',
            game: game || '',
            status: normalizedStatus
          });
        }
      }
    );
  });
}

function updateCategoryItem(id, categoryId, title, rewardRate, image, content, balanceRequired, itemKey, game, status) {
  return new Promise((resolve, reject) => {
    const normalizedStatus = status === 'inactive' ? 'inactive' : 'active';
    const normalizedRewardRate = normalizeRewardRate(rewardRate);
    
    getDb().run(
      `
      UPDATE category_items
      SET category_id = ?, title = ?, reward_rate = ?, image = ?, content = ?, balance_required = ?, item_key = ?, game = ?, status = ?
      WHERE id = ?
      `,
      [
        categoryId,
        title,
        normalizedRewardRate,
        image || '',
        content || '',
        balanceRequired || 0,
        itemKey || '',
        game || '',
        normalizedStatus,
        id
      ],
      async function(err) {
        if (err) {
          reject(err);
        } else {
          const updated = await getCategoryItemById(id);
          resolve(updated);
        }
      }
    );
  });
}

function deleteCategoryItem(id) {
  return new Promise((resolve, reject) => {
    getDb().run('DELETE FROM category_items WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

// Tracking functions
function getTracking(trackingNumber) {
  return new Promise((resolve, reject) => {
    getDb().get('SELECT * FROM tracking WHERE tracking_number = ?', [trackingNumber], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function createTracking(trackingNumber, status, location, description) {
  return new Promise((resolve, reject) => {
    getDb().run(
      'INSERT INTO tracking (tracking_number, status, location, description) VALUES (?, ?, ?, ?)',
      [trackingNumber, status, location, description],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id: this.lastID, 
            tracking_number: trackingNumber, 
            status, 
            location, 
            description 
          });
        }
      }
    );
  });
}

function updateTracking(trackingNumber, status, location, description) {
  return new Promise((resolve, reject) => {
    getDb().run(
      'UPDATE tracking SET status = ?, location = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE tracking_number = ?',
      [status, location, description, trackingNumber],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      }
    );
  });
}

function getAllTracking() {
  return new Promise((resolve, reject) => {
    getDb().all(`
      SELECT * FROM tracking 
      ORDER BY created_at DESC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Orders functions (now using order_set)
function getAllOrders() {
  return new Promise((resolve, reject) => {
    getDb().all(`
      SELECT o.*, s.name as service_name, u.balance as user_balance, u.username
      FROM order_set o 
      LEFT JOIN services s ON o.service_id = s.id 
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function getOrderById(id) {
  return new Promise((resolve, reject) => {
    getDb().get(`
      SELECT o.*, s.name as service_name 
      FROM order_set o 
      LEFT JOIN services s ON o.service_id = s.id 
      WHERE o.id = ?
    `, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function createOrder(orderNumber, userId, customerName, customerEmail, customerPhone, productLink, quantity, notes, serviceId, trackingNumber, totalAmount) {
  return new Promise((resolve, reject) => {
    console.log('createOrder called with:', {
      orderNumber,
      userId,
      customerName,
      customerPhone,
      productLink,
      quantity
    });
    
    // Insert into order_set table
    getDb().run(
      'INSERT INTO order_set (order_number, user_id, customer_name, customer_email, customer_phone, product_link, quantity, notes, service_id, tracking_number, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [orderNumber, userId, customerName, customerEmail || '', customerPhone, productLink || '', quantity || 0, notes || '', serviceId, trackingNumber, totalAmount],
      function(err) {
        if (err) {
          console.error('Error inserting order into order_set:', err.message);
          reject(err);
        } else {
          console.log('Order created successfully in order_set with ID:', this.lastID);
          resolve({ 
            id: this.lastID, 
            order_number: orderNumber,
            user_id: userId,
            customer_name: customerName,
            product_link: productLink,
            quantity: quantity,
            notes: notes,
            tracking_number: trackingNumber
          });
        }
      }
    );
  });
}

function getOrdersByUserId(userId) {
  return new Promise((resolve, reject) => {
    const userIdInt = parseInt(userId);
    console.log('getOrdersByUserId called with userId:', userId, 'parsed:', userIdInt);
    
    getDb().all(`
      SELECT o.*, s.name as service_name 
      FROM order_set o 
      LEFT JOIN services s ON o.service_id = s.id 
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [userIdInt], (err, rows) => {
      if (err) {
        console.error('Error in getOrdersByUserId:', err);
        reject(err);
      } else {
        console.log(`Found ${rows.length} orders for user ${userIdInt}`);
        resolve(rows);
      }
    });
  });
}

function updateOrderStatus(orderId, status) {
  return new Promise((resolve, reject) => {
    getDb().run(
      'UPDATE order_set SET status = ? WHERE id = ?',
      [status, orderId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes, id: orderId });
        }
      }
    );
  });
}

function approveOrder(orderId) {
  return new Promise(async (resolve, reject) => {
    const database = getDb();
    
    try {
      // Get order details
      const order = await getOrderById(orderId);
      if (!order) {
        return reject(new Error('Đơn hàng không tồn tại'));
      }

      if (order.status !== 'pending') {
        return reject(new Error('Đơn hàng đã được xử lý'));
      }

      // Check if order has user_id
      if (!order.user_id) {
        // If no user_id, just approve the order
        await updateOrderStatus(orderId, 'processing');
        return resolve({ success: true, message: 'Đơn hàng đã được duyệt (không có user_id)' });
      }

      // Get user balance
      const user = await getUserById(order.user_id);
      if (!user) {
        return reject(new Error('Người dùng không tồn tại'));
      }

      const currentBalance = parseFloat(user.balance) || 0;
      const orderAmount = parseFloat(order.total_amount) || 0;

      // Check if user has enough balance
      if (currentBalance < orderAmount) {
        return reject(new Error(`Số dư không đủ. Số dư hiện tại: ${currentBalance.toLocaleString('vi-VN')} VNĐ, Số tiền đơn hàng: ${orderAmount.toLocaleString('vi-VN')} VNĐ`));
      }

      // Start transaction
      database.serialize(() => {
        database.run('BEGIN TRANSACTION');

        // Update order status
        database.run(
          'UPDATE order_set SET status = ? WHERE id = ?',
          ['processing', orderId],
          function(err) {
            if (err) {
              database.run('ROLLBACK');
              return reject(err);
            }
          }
        );

        // Update user balance
        const newBalance = currentBalance - orderAmount;
        database.run(
          'UPDATE users SET balance = ? WHERE id = ?',
          [newBalance, order.user_id],
          function(err) {
            if (err) {
              database.run('ROLLBACK');
              return reject(err);
            }
          }
        );

        // Create transaction record
        database.run(
          'INSERT INTO transactions (user_id, username, transaction_type, amount, balance_before, balance_after, description, status, admin_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            order.user_id,
            user.username,
            'subtract',
            orderAmount,
            currentBalance,
            newBalance,
            `Thanh toán đơn hàng #${order.order_number || orderId}`,
            'completed',
            `Duyệt đơn hàng #${order.order_number || orderId}`
          ],
          function(err) {
            if (err) {
              database.run('ROLLBACK');
              return reject(err);
            }

            // Commit transaction
            database.run('COMMIT', (err) => {
              if (err) {
                return reject(err);
              }
              resolve({
                success: true,
                message: 'Đơn hàng đã được duyệt và số dư đã được trừ',
                order: { ...order, status: 'processing' },
                user: { ...user, balance: newBalance }
              });
            });
          }
        );
      });
    } catch (error) {
      reject(error);
    }
  });
}

function deleteOrder(orderId) {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await getOrderById(orderId);
      if (!order) {
        return reject(new Error('Đơn hàng không tồn tại'));
      }
      
      database.run('DELETE FROM orders WHERE id = ?', [orderId], function(deleteErr) {
        if (deleteErr) {
          reject(deleteErr);
          return;
        }
        
        resolve({ 
          success: true,
          id: orderId, 
          message: 'Đơn hàng đã được xóa thành công',
          order: order
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

function rejectOrder(orderId, reason) {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await getOrderById(orderId);
      if (!order) {
        return reject(new Error('Đơn hàng không tồn tại'));
      }

      if (order.status !== 'pending') {
        return reject(new Error('Đơn hàng đã được xử lý'));
      }

      await updateOrderStatus(orderId, 'cancelled');
      resolve({
        success: true,
        message: 'Đơn hàng đã bị từ chối',
        order: { ...order, status: 'cancelled' }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Users functions
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    getDb().get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function createUser(username, password, referralCode, ipAddress) {
  return new Promise((resolve, reject) => {
    getDb().run(
      'INSERT INTO users (username, password, referral_code, ip_address, status) VALUES (?, ?, ?, ?, ?)',
      [username, password, referralCode, ipAddress || null, 'active'],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id: this.lastID, 
            username, 
            referral_code: referralCode,
            balance: 0,
            credit_score: 100,
            ip_address: ipAddress || null,
            status: 'active'
          });
        }
      }
    );
  });
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    getDb().get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function getUsersByReferralCode(referralCode) {
  return new Promise((resolve, reject) => {
    getDb().all(`
      SELECT 
        id, 
        username, 
        referral_code, 
        balance, 
        credit_score,
        ip_address,
        last_login_ip,
        status,
        created_at,
        last_login_at,
        bank_name,
        bank_account_number,
        bank_account_holder,
        withdrawal_enabled
      FROM users 
      WHERE referral_code = ?
      ORDER BY created_at DESC
    `, [referralCode], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Format data để phù hợp với frontend
        const formattedRows = rows.map(row => ({
          id: row.id,
          username: row.username,
          referral_code: row.referral_code,
          full_name: row.username, // Tạm thời dùng username
          vip: 0,
          withdrawal_enabled: row.withdrawal_enabled !== undefined ? (row.withdrawal_enabled === 1 || row.withdrawal_enabled === true) : true,
          status: row.status || 'active',
          balance: row.balance || 0,
          credit_score: row.credit_score || 100,
          ip_address: row.ip_address || row.last_login_ip || '-',
          last_ip: row.last_login_ip || row.ip_address || '-',
          last_login_date: row.last_login_at ? row.last_login_at.split(' ')[0] : (row.created_at ? row.created_at.split(' ')[0] : '-'),
          login_time: row.last_login_at ? row.last_login_at.split(' ')[0] : (row.created_at ? row.created_at.split(' ')[0] : '-'),
          created_at: row.created_at,
          bank_name: row.bank_name || null,
          bank_account_number: row.bank_account_number || null,
          bank_account_holder: row.bank_account_holder || null
        }));
        resolve(formattedRows);
      }
    });
  });
}

function getAllUsers() {
  return new Promise((resolve, reject) => {
    getDb().all(`
      SELECT 
        id, 
        username, 
        referral_code, 
        balance, 
        credit_score,
        ip_address,
        last_login_ip,
        status,
        created_at,
        last_login_at,
        bank_name,
        bank_account_number,
        bank_account_holder,
        withdrawal_enabled
      FROM users 
      ORDER BY created_at DESC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Format data để phù hợp với frontend
        const formattedRows = rows.map(row => ({
          id: row.id,
          username: row.username,
          referral_code: row.referral_code,
          full_name: row.username, // Tạm thời dùng username
          vip: row.vip_level || 0,
          vip_level: row.vip_level || 0,
          withdrawal_enabled: row.withdrawal_enabled !== undefined ? (row.withdrawal_enabled === 1 || row.withdrawal_enabled === true) : true,
          status: row.status || 'active',
          balance: row.balance || 0,
          credit_score: row.credit_score || 100,
          ip_address: row.ip_address || row.last_login_ip || '-',
          last_ip: row.last_login_ip || row.ip_address || '-',
          last_login_date: row.last_login_at ? row.last_login_at.split(' ')[0] : (row.created_at ? row.created_at.split(' ')[0] : '-'),
          login_time: row.last_login_at ? row.last_login_at.split(' ')[0] : (row.created_at ? row.created_at.split(' ')[0] : '-'),
          created_at: row.created_at,
          min_withdrawal: row.min_withdrawal || 0,
          max_withdrawal: row.max_withdrawal || 0,
          bank_name: row.bank_name || null,
          bank_account_number: row.bank_account_number || null,
          bank_account_holder: row.bank_account_holder || null
        }));
        resolve(formattedRows);
      }
    });
  });
}

function updateUser(id, username, password, referralCode, balance, creditScore, ipAddress, status, bankName, bankAccountNumber, bankAccountHolder, withdrawalEnabled, minWithdrawal, maxWithdrawal, vipLevel) {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE users SET username = ?, referral_code = ?, balance = ?, credit_score = ?, ip_address = ?, status = ?';
    let params = [username, referralCode, balance, creditScore, ipAddress || null, status || 'active'];
    
    // Add bank info if provided
    if (bankName !== undefined || bankAccountNumber !== undefined || bankAccountHolder !== undefined) {
      query += ', bank_name = ?, bank_account_number = ?, bank_account_holder = ?';
      params.push(bankName || null, bankAccountNumber || null, bankAccountHolder || null);
    }
    
    // Add withdrawal_enabled if provided
    if (withdrawalEnabled !== undefined) {
      query += ', withdrawal_enabled = ?';
      params.push(withdrawalEnabled ? 1 : 0);
    }
    
    // Add min_withdrawal if provided
    if (minWithdrawal !== undefined) {
      query += ', min_withdrawal = ?';
      params.push(minWithdrawal || 0);
    }
    
    // Add max_withdrawal if provided
    if (maxWithdrawal !== undefined) {
      query += ', max_withdrawal = ?';
      params.push(maxWithdrawal || 0);
    }
    
    // Add vip_level if provided
    if (vipLevel !== undefined) {
      query += ', vip_level = ?';
      params.push(vipLevel || 0);
    }
    
    if (password) {
      query = 'UPDATE users SET username = ?, password = ?, referral_code = ?, balance = ?, credit_score = ?, ip_address = ?, status = ?';
      params = [username, password, referralCode, balance, creditScore, ipAddress || null, status || 'active'];
      
      // Add bank info if provided
      if (bankName !== undefined || bankAccountNumber !== undefined || bankAccountHolder !== undefined) {
        query += ', bank_name = ?, bank_account_number = ?, bank_account_holder = ?';
        params.push(bankName || null, bankAccountNumber || null, bankAccountHolder || null);
      }
      
      // Add withdrawal_enabled if provided
      if (withdrawalEnabled !== undefined) {
        query += ', withdrawal_enabled = ?';
        params.push(withdrawalEnabled ? 1 : 0);
      }
      
      // Add min_withdrawal if provided
      if (minWithdrawal !== undefined) {
        query += ', min_withdrawal = ?';
        params.push(minWithdrawal || 0);
      }
      
      // Add max_withdrawal if provided
      if (maxWithdrawal !== undefined) {
        query += ', max_withdrawal = ?';
        params.push(maxWithdrawal || 0);
      }
      
      // Add vip_level if provided
      if (vipLevel !== undefined) {
        query += ', vip_level = ?';
        params.push(vipLevel || 0);
      }
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    getDb().run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes, id });
      }
    });
  });
}

function updateUserStatus(id, status) {
  return new Promise((resolve, reject) => {
    getDb().run('UPDATE users SET status = ? WHERE id = ?', [status, id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes, id });
      }
    });
  });
}

function updateUserLoginInfo(id, ipAddress) {
  return new Promise((resolve, reject) => {
    getDb().run(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, last_login_ip = ?, ip_address = ? WHERE id = ?',
      [ipAddress, ipAddress, id],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes, id });
        }
      }
    );
  });
}

function deleteUser(id) {
  return new Promise((resolve, reject) => {
    getDb().run('DELETE FROM users WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

// Staff functions
function getAllStaff() {
  return new Promise((resolve, reject) => {
    getDb().all(`
      SELECT 
        id, 
        username, 
        full_name,
        email,
        phone,
        position,
        referral_code,
        status,
        created_at
      FROM staff 
      WHERE referral_code IS NOT NULL AND referral_code != ''
      ORDER BY created_at DESC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// ========== ADMIN FUNCTIONS ==========
function getAllAdmins() {
  return new Promise((resolve, reject) => {
    getDb().all(`
      SELECT 
        id, 
        username, 
        full_name,
        email,
        phone,
        status,
        created_at
      FROM admins 
      ORDER BY created_at DESC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function getAdminById(id) {
  return new Promise((resolve, reject) => {
    getDb().get('SELECT * FROM admins WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function getAdminByUsername(username) {
  return new Promise((resolve, reject) => {
    getDb().get('SELECT * FROM admins WHERE username = ?', [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function createAdmin(username, password, fullName, email, phone) {
  return new Promise((resolve, reject) => {
    getDb().run(
      'INSERT INTO admins (username, password, full_name, email, phone) VALUES (?, ?, ?, ?, ?)',
      [username, password, fullName, email, phone],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id: this.lastID, 
            username, 
            full_name: fullName,
            email,
            phone,
            status: 'active'
          });
        }
      }
    );
  });
}

function updateAdmin(id, username, password, fullName, email, phone, status) {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE admins SET username = ?, full_name = ?, email = ?, phone = ?, status = ?';
    let params = [username, fullName, email, phone, status];
    
    if (password) {
      query = 'UPDATE admins SET username = ?, password = ?, full_name = ?, email = ?, phone = ?, status = ?';
      params = [username, password, fullName, email, phone, status];
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    getDb().run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes, id });
      }
    });
  });
}

function deleteAdmin(id) {
  return new Promise((resolve, reject) => {
    getDb().run('DELETE FROM admins WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

function getStaffById(id) {
  return new Promise((resolve, reject) => {
    getDb().get('SELECT * FROM staff WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function getStaffByUsername(username) {
  return new Promise((resolve, reject) => {
    getDb().get('SELECT * FROM staff WHERE username = ?', [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function createStaff(username, password, fullName, email, phone, position, referralCode) {
  return new Promise((resolve, reject) => {
    // Tự động tạo mã giới thiệu nếu không được cung cấp
    let finalReferralCode = referralCode;
    if (!finalReferralCode || !finalReferralCode.trim()) {
      // Tạo mã giới thiệu duy nhất: NV + timestamp + random string
      finalReferralCode = 'NV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    
    getDb().run(
      'INSERT INTO staff (username, password, full_name, email, phone, position, referral_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, password, fullName, email, phone, position, finalReferralCode],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id: this.lastID, 
            username, 
            full_name: fullName,
            email,
            phone,
            position,
            referral_code: finalReferralCode,
            status: 'active'
          });
        }
      }
    );
  });
}

function getStaffByReferralCode(referralCode) {
  return new Promise((resolve, reject) => {
    getDb().get('SELECT * FROM staff WHERE referral_code = ?', [referralCode], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function getActiveStaffByReferralCode(referralCode) {
  return new Promise((resolve, reject) => {
    getDb().get('SELECT * FROM staff WHERE referral_code = ? AND status = ?', [referralCode, 'active'], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function updateStaff(id, username, password, fullName, email, phone, position, referralCode, status) {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE staff SET username = ?, full_name = ?, email = ?, phone = ?, position = ?, referral_code = ?, status = ?';
    let params = [username, fullName, email, phone, position, referralCode, status];
    
    if (password) {
      query = 'UPDATE staff SET username = ?, password = ?, full_name = ?, email = ?, phone = ?, position = ?, referral_code = ?, status = ?';
      params = [username, password, fullName, email, phone, position, referralCode, status];
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    getDb().run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes, id });
      }
    });
  });
}

function deleteStaff(id) {
  return new Promise((resolve, reject) => {
    getDb().run('DELETE FROM staff WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

// Transaction functions
function getAllTransactions() {
  return new Promise((resolve, reject) => {
    getDb().all(`
      SELECT 
        t.*,
        u.username as user_username,
        u.balance as current_balance
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function getTransactionById(id) {
  return new Promise((resolve, reject) => {
    getDb().get('SELECT * FROM transactions WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function getTransactionsByUserId(userId) {
  return new Promise((resolve, reject) => {
    getDb().all('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function createTransaction(userId, username, transactionType, amount, balanceBefore, balanceAfter, description, status, adminNote) {
  return new Promise((resolve, reject) => {
    getDb().run(
      'INSERT INTO transactions (user_id, username, transaction_type, amount, balance_before, balance_after, description, status, admin_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, username, transactionType, amount, balanceBefore, balanceAfter, description, status || 'pending', adminNote || ''],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id: this.lastID, 
            user_id: userId,
            username,
            transaction_type: transactionType,
            amount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            description,
            status: status || 'pending',
            admin_note: adminNote || ''
          });
        }
      }
    );
  });
}

function updateTransaction(id, status, adminNote) {
  return new Promise((resolve, reject) => {
    getDb().run(
      'UPDATE transactions SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, adminNote || '', id],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes, id });
        }
      }
    );
  });
}

function updateTransactionBalance(id, balanceAfter) {
  return new Promise((resolve, reject) => {
    getDb().run(
      'UPDATE transactions SET balance_after = ? WHERE id = ?',
      [balanceAfter, id],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes, id });
        }
      }
    );
  });
}

function deleteTransaction(id) {
  return new Promise((resolve, reject) => {
    getDb().run('DELETE FROM transactions WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

function getTransactionStatisticsByMonth(year) {
  return new Promise((resolve, reject) => {
    const targetYear = year || new Date().getFullYear();
    const getMonthName = (month) => {
      const months = {
        '01': 'Tháng 1', '02': 'Tháng 2', '03': 'Tháng 3', '04': 'Tháng 4',
        '05': 'Tháng 5', '06': 'Tháng 6', '07': 'Tháng 7', '08': 'Tháng 8',
        '09': 'Tháng 9', '10': 'Tháng 10', '11': 'Tháng 11', '12': 'Tháng 12'
      };
      return months[month] || month;
    };

    getDb().all(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        SUM(CASE WHEN transaction_type IN ('deposit', 'add') THEN amount ELSE 0 END) as total_deposit,
        SUM(CASE WHEN transaction_type IN ('withdraw', 'subtract') THEN amount ELSE 0 END) as total_withdraw,
        COUNT(CASE WHEN transaction_type IN ('deposit', 'add') THEN 1 END) as deposit_count,
        COUNT(CASE WHEN transaction_type IN ('withdraw', 'subtract') THEN 1 END) as withdraw_count
      FROM transactions
      WHERE strftime('%Y', created_at) = ?
        AND status = 'completed'
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `, [targetYear.toString()], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Format data for chart
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const result = months.map(month => {
          const monthKey = `${targetYear}-${month}`;
          const row = rows.find(r => r.month === monthKey);
          return {
            month: monthKey,
            monthName: getMonthName(month),
            total_deposit: row ? parseFloat(row.total_deposit) || 0 : 0,
            total_withdraw: row ? parseFloat(row.total_withdraw) || 0 : 0,
            deposit_count: row ? parseInt(row.deposit_count) || 0 : 0,
            withdraw_count: row ? parseInt(row.withdraw_count) || 0 : 0
          };
        });
        resolve(result);
      }
    });
  });
}

// Products functions
function getAllProducts() {
  return new Promise((resolve, reject) => {
    getDb().all(`
      SELECT * FROM products 
      ORDER BY created_at DESC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function getProductById(id) {
  return new Promise((resolve, reject) => {
    getDb().get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Check if product code already exists (excluding current product id for updates)
function checkProductCodeExists(productCode, excludeId = null) {
  return new Promise((resolve, reject) => {
    if (!productCode || productCode.trim() === '') {
      resolve(false);
      return;
    }
    
    let query = 'SELECT id FROM products WHERE product_code = ? AND product_code != ""';
    const params = [productCode.trim()];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    getDb().get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(!!row);
      }
    });
  });
}

function createProduct(name, description, image, price, category, stock, status, productCode, supplier, staffId) {
  return new Promise((resolve, reject) => {
    // Check if product code already exists
    if (productCode && productCode.trim() !== '') {
      checkProductCodeExists(productCode.trim())
        .then(exists => {
          if (exists) {
            reject(new Error('Mã sản phẩm đã tồn tại. Vui lòng sử dụng mã khác.'));
            return;
          }
          
          // Proceed with insert
          getDb().run(
            'INSERT INTO products (name, description, image, price, category, stock, status, product_code, supplier, staff_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, description || '', image || '', price || 0, category || '', stock || 0, status || 'active', productCode.trim(), supplier || '', staffId || null],
            function(err) {
              if (err) {
                reject(err);
              } else {
                resolve({ 
                  id: this.lastID, 
                  name, 
                  description: description || '', 
                  image: image || '', 
                  price: price || 0, 
                  category: category || '', 
                  stock: stock || 0, 
                  status: status || 'active',
                  product_code: productCode.trim(),
                  supplier: supplier || '',
                  staff_id: staffId || null
                });
              }
            }
          );
        })
        .catch(reject);
    } else {
      // No product code, proceed with insert
      getDb().run(
        'INSERT INTO products (name, description, image, price, category, stock, status, product_code, supplier, staff_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, description || '', image || '', price || 0, category || '', stock || 0, status || 'active', productCode || '', supplier || '', staffId || null],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              id: this.lastID, 
              name, 
              description: description || '', 
              image: image || '', 
              price: price || 0, 
              category: category || '', 
              stock: stock || 0, 
              status: status || 'active',
              product_code: productCode || '',
              supplier: supplier || '',
              staff_id: staffId || null
            });
          }
        }
      );
    }
  });
}

function updateProduct(id, name, description, image, price, category, stock, status, productCode, supplier) {
  return new Promise((resolve, reject) => {
    // Check if product code already exists (excluding current product)
    if (productCode && productCode.trim() !== '') {
      checkProductCodeExists(productCode.trim(), id)
        .then(exists => {
          if (exists) {
            reject(new Error('Mã sản phẩm đã tồn tại. Vui lòng sử dụng mã khác.'));
            return;
          }
          
          // Proceed with update
          getDb().run(
            'UPDATE products SET name = ?, description = ?, image = ?, price = ?, category = ?, stock = ?, status = ?, product_code = ?, supplier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, description || '', image || '', price || 0, category || '', stock || 0, status || 'active', productCode.trim(), supplier || '', id],
            function(err) {
              if (err) {
                reject(err);
              } else {
                resolve({ changes: this.changes, id });
              }
            }
          );
        })
        .catch(reject);
    } else {
      // No product code, proceed with update
      getDb().run(
        'UPDATE products SET name = ?, description = ?, image = ?, price = ?, category = ?, stock = ?, status = ?, product_code = ?, supplier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, description || '', image || '', price || 0, category || '', stock || 0, status || 'active', productCode || '', supplier || '', id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes, id });
          }
        }
      );
    }
  });
}

function deleteProduct(id) {
  return new Promise((resolve, reject) => {
    getDb().run('DELETE FROM products WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

// Get products by staff_id
function getProductsByStaffId(staffId) {
  return new Promise((resolve, reject) => {
    getDb().all(
      'SELECT * FROM products WHERE staff_id = ? ORDER BY created_at DESC',
      [staffId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

// Get all active products (for import page)
function getActiveProducts() {
  return new Promise((resolve, reject) => {
    getDb().all(
      'SELECT * FROM products WHERE status = ? ORDER BY created_at DESC',
      ['active'],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

// Search products by name or product code
function searchProducts(query) {
  return new Promise((resolve, reject) => {
    if (!query || query.trim() === '') {
      resolve([]);
      return;
    }
    
    const searchTerm = `%${query.trim()}%`;
    getDb().all(
      `SELECT * FROM products 
       WHERE status = 'active' 
       AND (name LIKE ? OR product_code LIKE ?)
       ORDER BY 
         CASE 
           WHEN name LIKE ? THEN 1
           WHEN product_code LIKE ? THEN 2
           ELSE 3
         END,
         created_at DESC
       LIMIT 50`,
      [searchTerm, searchTerm, `%${query.trim()}%`, `%${query.trim()}%`],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

// Settings functions
function getAllSettings() {
  return new Promise((resolve, reject) => {
    getDb().all(`
      SELECT * FROM settings 
      ORDER BY setting_key
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Convert to object format
        const settingsObj = {};
        rows.forEach(row => {
          settingsObj[row.setting_key] = row.setting_value || '';
        });
        resolve(settingsObj);
      }
    });
  });
}

function getSetting(key) {
  return new Promise((resolve, reject) => {
    getDb().get('SELECT * FROM settings WHERE setting_key = ?', [key], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.setting_value : null);
      }
    });
  });
}

function updateSetting(key, value, description) {
  return new Promise((resolve, reject) => {
    getDb().run(
      'INSERT OR REPLACE INTO settings (setting_key, setting_value, description, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [key, value || '', description || ''],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ key, value: value || '' });
        }
      }
    );
  });
}

function updateSettings(settings) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.serialize(() => {
      database.run('BEGIN TRANSACTION');
      
      const keys = Object.keys(settings);
      let completed = 0;
      let hasError = false;

      keys.forEach(key => {
        database.run(
          'INSERT OR REPLACE INTO settings (setting_key, setting_value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
          [key, settings[key] || ''],
          function(err) {
            if (err && !hasError) {
              hasError = true;
              database.run('ROLLBACK');
              reject(err);
            } else {
              completed++;
              if (completed === keys.length && !hasError) {
                database.run('COMMIT', (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve({ success: true });
                  }
                });
              }
            }
          }
        );
      });
    });
  });
}

// Import/Export History functions
function createImportHistory(userId, staffId, productName, productCode, productLink, quantity, unitPrice, totalAmount, supplier, notes, status) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    // Prepare values - handle null userId for staff-created imports
    const finalUserId = userId || null;
    const finalStaffId = staffId || null;
    
    db.run(
      'INSERT INTO import_history (user_id, staff_id, product_name, product_code, product_link, quantity, unit_price, total_amount, supplier, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [finalUserId, finalStaffId, productName, productCode || '', productLink || '', quantity, unitPrice || 0, totalAmount || 0, supplier || '', notes || '', status || 'pending'],
      function(err) {
        if (err) {
          console.error('Error creating import history:', err);
          // If error is due to NOT NULL constraint on user_id, try with a workaround
          if (err.message && err.message.includes('NOT NULL constraint')) {
            // Try inserting with a default user_id of 0 (which should fail FK check but allow insert)
            // Or better: log the error and suggest migration
            console.error('Database constraint error. The import_history table may need to be migrated to allow NULL user_id.');
            reject(new Error('Lỗi database: Bảng import_history cần được cập nhật để cho phép user_id NULL. Vui lòng liên hệ quản trị viên.'));
          } else {
            reject(err);
          }
        } else {
          resolve({ 
            id: this.lastID, 
            user_id: finalUserId,
            staff_id: finalStaffId,
            product_name: productName,
            product_code: productCode || '',
            product_link: productLink || '',
            quantity,
            unit_price: unitPrice || 0,
            total_amount: totalAmount || 0,
            supplier: supplier || '',
            notes: notes || '',
            status: status || 'pending'
          });
        }
      }
    );
  });
}

function getImportHistoryByUserId(userId) {
  return new Promise((resolve, reject) => {
    getDb().all(
      'SELECT * FROM import_history WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

function getAllImportHistory() {
  return new Promise((resolve, reject) => {
    getDb().all(
      'SELECT i.*, u.username, s.username as staff_username FROM import_history i LEFT JOIN users u ON i.user_id = u.id LEFT JOIN staff s ON i.staff_id = s.id ORDER BY i.created_at DESC',
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

function getImportHistoryByUserReferralCode(referralCode) {
  return new Promise((resolve, reject) => {
    getDb().all(
      `SELECT i.*, u.username 
       FROM import_history i 
       LEFT JOIN users u ON i.user_id = u.id 
       WHERE u.referral_code = ? 
       ORDER BY i.created_at DESC`,
      [referralCode],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

function createExportHistory(userId, productName, productLink, quantity, unitPrice, totalAmount, recipientName, recipientPhone, recipientAddress, notes, status) {
  return new Promise((resolve, reject) => {
    getDb().run(
      'INSERT INTO export_history (user_id, product_name, product_link, quantity, unit_price, total_amount, recipient_name, recipient_phone, recipient_address, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, productName, productLink || '', quantity, unitPrice || 0, totalAmount || 0, recipientName || '', recipientPhone || '', recipientAddress || '', notes || '', status || 'pending'],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id: this.lastID, 
            user_id: userId,
            product_name: productName,
            product_link: productLink || '',
            quantity,
            unit_price: unitPrice || 0,
            total_amount: totalAmount || 0,
            recipient_name: recipientName || '',
            recipient_phone: recipientPhone || '',
            recipient_address: recipientAddress || '',
            notes: notes || '',
            status: status || 'pending'
          });
        }
      }
    );
  });
}

function getExportHistoryByUserId(userId) {
  return new Promise((resolve, reject) => {
    getDb().all(
      'SELECT * FROM export_history WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

function getAllExportHistory() {
  return new Promise((resolve, reject) => {
    getDb().all(
      'SELECT e.*, u.username FROM export_history e LEFT JOIN users u ON e.user_id = u.id ORDER BY e.created_at DESC',
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

// Export Orders functions
function createExportOrder(orderCode, userId, brandId, brandName, totalAmount, balanceBefore, balanceAfter, products) {
  return new Promise((resolve, reject) => {
    const productsJson = JSON.stringify(products);
    getDb().run(
      'INSERT INTO export_orders (order_code, user_id, brand_id, brand_name, total_amount, balance_before, balance_after, products, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [orderCode, userId, brandId, brandName, totalAmount, balanceBefore, balanceAfter, productsJson, 'completed'],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id: this.lastID, 
            order_code: orderCode,
            user_id: userId,
            brand_id: brandId,
            brand_name: brandName,
            total_amount: totalAmount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            products: products,
            status: 'completed'
          });
        }
      }
    );
  });
}

function getAllExportOrders() {
  return new Promise((resolve, reject) => {
    getDb().all(
      `SELECT 
        e.*, 
        u.username, 
        u.referral_code,
        u.ip_address,
        u.created_at as user_created_at,
        u.status as user_status,
        u.credit_score
      FROM export_orders e 
      LEFT JOIN users u ON e.user_id = u.id 
      ORDER BY e.created_at DESC`,
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse products JSON
          const parsedRows = rows.map(row => ({
            ...row,
            products: JSON.parse(row.products || '[]')
          }));
          resolve(parsedRows);
        }
      }
    );
  });
}

function getExportOrdersByUserId(userId) {
  return new Promise((resolve, reject) => {
    getDb().all(
      'SELECT * FROM export_orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse products JSON
          const parsedRows = rows.map(row => ({
            ...row,
            products: JSON.parse(row.products || '[]')
          }));
          resolve(parsedRows);
        }
      }
    );
  });
}

// Poll History functions
function createPollHistory(userId, username, itemId, itemTitle, itemKey, periodNumber, amount, selectedRates) {
  return new Promise((resolve, reject) => {
    // Đảm bảo selectedRates là array
    const selectedRatesArray = Array.isArray(selectedRates) ? selectedRates : (selectedRates ? [selectedRates] : []);
    const selectedRatesStr = JSON.stringify(selectedRatesArray);
    
    console.log(`💾 Inserting poll history:`, {
      userId,
      username,
      itemId,
      itemTitle,
      itemKey,
      periodNumber,
      amount,
      selectedRates: selectedRatesArray,
      selectedRatesStr
    });
    
    getDb().run(
      `INSERT INTO poll_history (user_id, username, item_id, item_title, item_key, period_number, amount, selected_rates)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, itemId, itemTitle, itemKey || null, periodNumber || null, amount, selectedRatesStr],
      function(err) {
        if (err) {
          console.error('❌ Error inserting poll history:', err);
          reject(err);
        } else {
          console.log(`✅ Poll history inserted with ID: ${this.lastID}`);
          resolve({ id: this.lastID });
        }
      }
    );
  });
}

function getAllPollHistory() {
  return new Promise((resolve, reject) => {
    console.log('📊 getAllPollHistory: Querying database...');
    getDb().all(
      `SELECT ph.*, u.username as user_username, pr.winning_rate as winning_product, pr.winning_rate_2 as winning_product_2, pr.reward_amount, ci.reward_rate as item_reward_rate
       FROM poll_history ph
       LEFT JOIN users u ON ph.user_id = u.id
       LEFT JOIN poll_results pr ON ph.item_id = pr.item_id AND ph.period_number = pr.period_number
       LEFT JOIN category_items ci ON ph.item_id = ci.id
       ORDER BY ph.created_at DESC`,
      [],
      (err, rows) => {
        if (err) {
          console.error('❌ Error querying poll history:', err);
          reject(err);
        } else {
          console.log(`📊 Found ${rows.length} poll history records in database`);
          const parsedRows = rows.map(row => {
            // Parse selected_rates từ JSON string
            let selectedRates = [];
            try {
              selectedRates = JSON.parse(row.selected_rates || '[]');
            } catch (e) {
              console.error('❌ Error parsing selected_rates for row', row.id, ':', e);
              console.error('Raw selected_rates:', row.selected_rates);
              selectedRates = [];
            }
            
            // Xác định trạng thái và số tiền: + nếu thắng, - nếu thua, — nếu chưa có kết quả
            // Tính tổng hợp nếu người dùng chọn nhiều sản phẩm
            let status = '—';
            let statusAmount = 0;
            let statusText = '—';
            
            if (row.winning_product && Array.isArray(selectedRates) && selectedRates.length > 0) {
              const totalBetAmount = parseFloat(row.amount || 0);
              const selectedCount = selectedRates.length;
              const amountPerProduct = selectedCount > 0 ? totalBetAmount / selectedCount : 0;
              
              // Parse reward_rate từ item
              let rewardCoefficients = { A: 1.0, B: 1.2, C: 1.5, D: 2.0 };
              if (row.item_reward_rate) {
                try {
                  if (typeof row.item_reward_rate === 'string') {
                    rewardCoefficients = JSON.parse(row.item_reward_rate);
                  } else if (typeof row.item_reward_rate === 'object') {
                    rewardCoefficients = row.item_reward_rate;
                  }
                } catch (e) {
                  console.error('Error parsing reward_rate:', e);
                }
              }
              
              // Tính tổng số tiền thắng và thua
              // Kiểm tra cả 2 đáp án thắng
              const winningProduct1 = row.winning_product;
              const winningProduct2 = row.winning_product_2;
              
              let totalWin = 0;
              let totalLose = 0;
              
              selectedRates.forEach(rate => {
                if (rate === winningProduct1 || rate === winningProduct2) {
                  // Sản phẩm này thắng: tính thưởng (ưu tiên đáp án 1 nếu chọn cả 2)
                  const matchedProduct = rate === winningProduct1 ? winningProduct1 : winningProduct2;
                  const rewardRate = parseFloat(rewardCoefficients[matchedProduct] || 1.0);
                  totalWin += amountPerProduct * rewardRate;
                } else {
                  // Sản phẩm này thua: mất số tiền đặt
                  totalLose += amountPerProduct;
                }
              });
              
              // Tính tổng hợp: thưởng - mất
              statusAmount = totalWin - totalLose;
              
              if (statusAmount > 0) {
                status = '+';
                statusText = `+${statusAmount.toLocaleString('vi-VN')}`;
              } else if (statusAmount < 0) {
                status = '-';
                statusText = `${statusAmount.toLocaleString('vi-VN')}`; // Đã có dấu - trong số
              } else {
                // Trường hợp hiếm: thắng = thua (không xảy ra trong thực tế)
                status = '—';
                statusText = '0';
              }
            }
            
            const parsedRow = {
              id: row.id,
              item_title: row.item_title || '',
              item_key: row.item_key || '',
              period_number: row.period_number || '',
              amount: row.amount || 0,
              user_username: row.user_username || row.username || '',
              username: row.user_username || row.username || '',
              selected_rates: selectedRates,
              created_at: row.created_at || '',
              winning_product: row.winning_product || null,
              reward_amount: row.reward_amount || 0,
              status: status,
              statusAmount: statusAmount,
              statusText: statusText
            };
            
            console.log(`📝 Parsed poll history row ${row.id}:`, parsedRow);
            return parsedRow;
          });
          console.log(`✅ Returning ${parsedRows.length} parsed poll history records`);
          resolve(parsedRows);
        }
      }
    );
  });
}

function getPollHistoryByUserId(userId) {
  return new Promise((resolve, reject) => {
    getDb().all(
      `SELECT ph.*, u.username as user_username
       FROM poll_history ph
       LEFT JOIN users u ON ph.user_id = u.id
       WHERE ph.user_id = ?
       ORDER BY ph.created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const parsedRows = rows.map(row => ({
            ...row,
            selected_rates: JSON.parse(row.selected_rates || '[]')
          }));
          resolve(parsedRows);
        }
      }
    );
  });
}

// Poll Results functions (Lịch sử kết quả)
function createPollResult(itemId, itemTitle, itemKey, periodNumber, winningProduct, winningRate, rewardAmount, userId, username, betAmount, winningRate2 = null) {
  return new Promise((resolve, reject) => {
    getDb().run(
      `INSERT INTO poll_results (item_id, item_title, item_key, period_number, winning_product, winning_rate, winning_rate_2, reward_amount, user_id, username, bet_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [itemId, itemTitle, itemKey || null, periodNumber || null, winningProduct, winningRate, winningRate2 || null, rewardAmount, userId || null, username || null, betAmount || null],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      }
    );
  });
}

function getPollResultByPeriod(itemId, periodNumber) {
  return new Promise((resolve, reject) => {
    getDb().get(
      `SELECT * FROM poll_results WHERE item_id = ? AND period_number = ? LIMIT 1`,
      [itemId, periodNumber],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      }
    );
  });
}

function updatePollResultReward(itemId, periodNumber, additionalReward) {
  return new Promise((resolve, reject) => {
    getDb().run(
      `UPDATE poll_results SET reward_amount = reward_amount + ? WHERE item_id = ? AND period_number = ?`,
      [additionalReward, itemId, periodNumber],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      }
    );
  });
}

// Xử lý trả thưởng ở cuối kỳ - So khớp kỳ giữa poll_history và poll_results
async function processPeriodRewards(itemId, periodNumber) {
  return new Promise(async (resolve, reject) => {
    try {
      // Lấy kết quả của kỳ này
      const pollResult = await getPollResultByPeriod(itemId, periodNumber);
      if (!pollResult) {
        console.log(`⚠️ No result found for item ${itemId}, period ${periodNumber}`);
        resolve({ processed: 0, totalReward: 0 });
        return;
      }

      const winningProduct = pollResult.winning_rate; // A, B, C, hoặc D (đáp án 1)
      const winningProduct2 = pollResult.winning_rate_2 || null; // A, B, C, hoặc D (đáp án 2)
      
      // Lấy tất cả lịch sử bình chọn của kỳ này
      const pollHistories = await new Promise((resolve, reject) => {
        getDb().all(
          `SELECT * FROM poll_history WHERE item_id = ? AND period_number = ? AND user_id IS NOT NULL`,
          [itemId, periodNumber],
          (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          }
        );
      });

      if (!pollHistories || pollHistories.length === 0) {
        console.log(`ℹ️ No voting history found for item ${itemId}, period ${periodNumber}`);
        resolve({ processed: 0, totalReward: 0 });
        return;
      }

      // Lấy thông tin item để parse reward_rate
      const item = await new Promise((resolve, reject) => {
        getDb().get(
          `SELECT * FROM category_items WHERE id = ?`,
          [itemId],
          (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          }
        );
      });

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

      let totalRewardDistributed = 0;
      let processedCount = 0;

      // Xử lý từng người chơi
      for (const history of pollHistories) {
        try {
          // Parse selected_rates từ JSON
          let selectedRates = [];
          try {
            selectedRates = JSON.parse(history.selected_rates || '[]');
          } catch (e) {
            console.error('Error parsing selected_rates:', e);
            continue;
          }

          // Kiểm tra xem người dùng có chọn đúng không (chọn 1 trong 2 đáp án thắng)
          const isWinner = Array.isArray(selectedRates) && (
            selectedRates.includes(winningProduct) || 
            (winningProduct2 && selectedRates.includes(winningProduct2))
          );
          
          if (isWinner) {
            // Xác định đáp án nào người dùng đã chọn (ưu tiên đáp án 1 nếu chọn cả 2)
            const matchedProduct = selectedRates.includes(winningProduct) ? winningProduct : winningProduct2;
            const winningRate = rewardCoefficients[matchedProduct] || 1.0;
            
            // Tính thưởng
            const amountPerProduct = parseFloat(history.amount) / selectedRates.length;
            const rewardAmount = amountPerProduct * winningRate;

            // Lấy thông tin user hiện tại
            const user = await new Promise((resolve, reject) => {
              getDb().get(
                `SELECT * FROM users WHERE id = ?`,
                [history.user_id],
                (err, row) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(row);
                  }
                }
              );
            });

            if (!user) {
              console.error(`User ${history.user_id} not found`);
              continue;
            }

            const currentBalance = parseFloat(user.balance) || 0;
            const newBalance = currentBalance + rewardAmount;

            // Cập nhật số dư user
            await new Promise((resolve, reject) => {
              getDb().run(
                `UPDATE users SET balance = ? WHERE id = ?`,
                [newBalance, history.user_id],
                function(err) {
                  if (err) {
                    reject(err);
                  } else {
                    resolve();
                  }
                }
              );
            });

            // Tạo transaction record
            await new Promise((resolve, reject) => {
              getDb().run(
                `INSERT INTO transactions (user_id, username, type, amount, balance_before, balance_after, description, status, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  history.user_id,
                  history.username || user.username,
                  'reward',
                  rewardAmount,
                  currentBalance,
                  newBalance,
                  `Thưởng - ${history.item_title} - ${matchedProduct}${winningProduct2 && matchedProduct !== winningProduct2 ? `, ${winningProduct2}` : ''} (Tỷ lệ: ${winningRate}x)`,
                  'completed',
                  `Thưởng từ kỳ ${periodNumber} - Xử lý ở cuối kỳ`
                ],
                function(err) {
                  if (err) {
                    reject(err);
                  } else {
                    resolve();
                  }
                }
              );
            });

            totalRewardDistributed += rewardAmount;
            processedCount++;
            console.log(`✅ Rewarded user ${history.user_id} (${history.username}): ${rewardAmount} VNĐ for period ${periodNumber}`);
          }
        } catch (error) {
          console.error(`Error processing reward for history ${history.id}:`, error);
        }
      }

      // Cập nhật reward_amount trong poll_results
      if (totalRewardDistributed > 0) {
        await updatePollResultReward(itemId, periodNumber, totalRewardDistributed);
      }

      console.log(`💰 Period ${periodNumber} rewards processed: ${processedCount} users, total: ${totalRewardDistributed} VNĐ`);
      resolve({ processed: processedCount, totalReward: totalRewardDistributed });
    } catch (error) {
      console.error(`Error processing period rewards for item ${itemId}, period ${periodNumber}:`, error);
      reject(error);
    }
  });
}

function getPollResults(filters = {}) {
  return new Promise((resolve, reject) => {
    // Phân trang server-side
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 30;
    const offset = (page - 1) * limit;

    let baseQuery = `
      FROM poll_results pr
      LEFT JOIN category_items ci ON pr.item_id = ci.id
      LEFT JOIN categories c ON ci.category_id = c.id
      LEFT JOIN item_periods ip ON pr.item_id = ip.item_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.periodNumber) {
      baseQuery += ` AND pr.period_number LIKE ?`;
      params.push(`%${filters.periodNumber}%`);
    }
    if (filters.votingTypeName) {
      baseQuery += ` AND pr.item_title LIKE ?`;
      params.push(`%${filters.votingTypeName}%`);
    }
    if (filters.startDate) {
      baseQuery += ` AND DATE(pr.created_at) >= ?`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      baseQuery += ` AND DATE(pr.created_at) <= ?`;
      params.push(filters.endDate);
    }

    // Đếm tổng số records
    const countQuery = `SELECT COUNT(DISTINCT pr.id) as total ${baseQuery}`;
    
    getDb().get(countQuery, params, (err, countRow) => {
      if (err) {
        reject(err);
        return;
      }
      
      const total = countRow?.total || 0;
      
      // Query lấy dữ liệu với phân trang
      const dataQuery = `
        SELECT pr.*, ci.reward_rate, ci.game, c.name as category_name, ip.period_start_time, ip.game_duration_seconds
        ${baseQuery}
        ORDER BY pr.created_at DESC
        LIMIT ? OFFSET ?
      `;
      const dataParams = [...params, limit, offset];

      getDb().all(dataQuery, dataParams, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Format results to match frontend expectations
          const formattedRows = rows.map(row => {
            // Lấy game duration từ category_items, nếu không có thì dùng giá trị mặc định
            let gameDuration = row.game || '120';
            // Format game duration để hiển thị (nếu là số giây, chuyển thành phút)
            let gameDisplay = gameDuration;
            if (typeof gameDuration === 'string') {
              const seconds = parseInt(gameDuration);
              if (!isNaN(seconds) && seconds > 0) {
                // Chuyển giây thành phút nếu >= 60 giây
                if (seconds >= 60) {
                  const minutes = Math.floor(seconds / 60);
                  const remainingSeconds = seconds % 60;
                  if (remainingSeconds === 0) {
                    gameDisplay = `${minutes} phút 1 kỳ`;
                  } else {
                    gameDisplay = `${minutes} phút ${remainingSeconds} giây 1 kỳ`;
                  }
                } else {
                  gameDisplay = `${seconds} giây 1 kỳ`;
                }
              }
            }
            
            // Tính toán thời gian mở thưởng dựa trên thời gian kết thúc kỳ
            let prizeOpeningTime = null;
            let nextPrizeOpeningTime = null;
            
            const gameDurationSeconds = row.game_duration_seconds || parseInt(gameDuration) || 120;
            
            // Parse period_number để tính thời gian kết thúc kỳ
            // Format: YYYYMMDD + số kỳ (ví dụ: 202512090 = ngày 2025-12-09, kỳ 0)
            const periodNumberStr = row.period_number || '';
          
          if (row.period_start_time && periodNumberStr.length >= 8) {
            // Sử dụng period_start_time từ item_periods để tính chính xác
            const periodStartTime = new Date(row.period_start_time);
            const periodIndex = parseInt(periodNumberStr.substring(8)) || 0;
            
            // Tính thời gian kết thúc kỳ = period_start_time + (periodIndex + 1) * game_duration_seconds
            // Ví dụ: kỳ 0 kết thúc sau 1 * game_duration_seconds từ period_start_time
            const periodEndTime = new Date(periodStartTime.getTime() + (periodIndex + 1) * gameDurationSeconds * 1000);
            prizeOpeningTime = periodEndTime.toISOString();
            
            // Thời gian mở thưởng tiếp theo = thời gian kết thúc kỳ hiện tại + game_duration_seconds
            const nextPeriodEndTime = new Date(periodEndTime.getTime() + gameDurationSeconds * 1000);
            nextPrizeOpeningTime = nextPeriodEndTime.toISOString();
          } else if (periodNumberStr.length >= 8) {
            // Fallback: tính từ period_number nếu không có period_start_time
            const year = parseInt(periodNumberStr.substring(0, 4));
            const month = parseInt(periodNumberStr.substring(4, 6)) - 1; // Month is 0-indexed
            const day = parseInt(periodNumberStr.substring(6, 8));
            const periodIndex = parseInt(periodNumberStr.substring(8)) || 0;
            
            // Tạo thời gian bắt đầu ngày (00:00:00)
            const dayStartTime = new Date(year, month, day, 0, 0, 0);
            // Tính thời gian kết thúc kỳ
            const periodEndTime = new Date(dayStartTime.getTime() + (periodIndex + 1) * gameDurationSeconds * 1000);
            prizeOpeningTime = periodEndTime.toISOString();
            
            const nextPeriodEndTime = new Date(periodEndTime.getTime() + gameDurationSeconds * 1000);
            nextPrizeOpeningTime = nextPeriodEndTime.toISOString();
          } else {
            // Fallback cuối cùng: sử dụng created_at + game_duration_seconds
            if (row.created_at) {
              const createdTime = new Date(row.created_at);
              // Giả sử kết quả được tạo ở cuối kỳ
              prizeOpeningTime = createdTime.toISOString();
              const nextTime = new Date(createdTime.getTime() + gameDurationSeconds * 1000);
              nextPrizeOpeningTime = nextTime.toISOString();
            }
          }
          
          // Format settings từ reward_rate
          let settingsDisplay = 'Tự động mở thưởng';
          if (row.reward_rate) {
            try {
              const rewardRates = typeof row.reward_rate === 'string' 
                ? JSON.parse(row.reward_rate) 
                : row.reward_rate;
              if (typeof rewardRates === 'object' && rewardRates !== null) {
                const ratesStr = Object.entries(rewardRates)
                  .map(([key, value]) => `${key}: ${value}x`)
                  .join(', ');
                settingsDisplay = `Tự động mở thưởng (${ratesStr})`;
              }
            } catch (e) {
              // Nếu không parse được, giữ nguyên
            }
          }
          
          return {
            id: row.id,
            lottery_type_name: row.item_title,
            poll_title: row.item_title,
            key: row.item_key || row.id,
            type: row.category_name || 'TMDT',
            category_name: row.category_name || 'TMDT',
            period_number: row.period_number,
            period: row.period_number,
            result: row.winning_rate_2 
              ? `${row.winning_rate}, ${row.winning_rate_2}` 
              : (row.winning_rate || row.winning_product),
            option_name: row.winning_product,
            game: gameDisplay,
            game_duration: gameDisplay,
            settings: settingsDisplay,
            prize_opening_time: prizeOpeningTime || row.created_at,
            next_prize_opening_time: nextPrizeOpeningTime || row.created_at,
            created_at: row.created_at,
            updated_at: row.created_at,
            reward_amount: row.reward_amount,
            winning_rate: row.winning_rate,
            user_id: row.user_id,
            username: row.username
          };
        });
        resolve({
          data: formattedRows,
          total: total,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total / limit)
        });
        }
      });
    });
  });
}

// Lấy các kỳ đang diễn ra (current periods) để chỉnh sửa
function getCurrentPeriodResults() {
  return new Promise(async (resolve, reject) => {
    try {
      // Lấy tất cả items active
      const items = await getAllActiveCategoryItems();
      
      if (!items || items.length === 0) {
        resolve([]);
        return;
      }
      
      const results = [];
      
      // Với mỗi item, lấy kỳ hiện tại
      for (const item of items) {
        try {
          const currentPeriodNumber = await getCurrentPeriodNumber(item.id, item.game || '120');
          if (currentPeriodNumber) {
            // Lấy kết quả của kỳ hiện tại
            const pollResult = await getPollResultByPeriod(item.id, currentPeriodNumber);
            if (pollResult) {
              // Lấy thông tin period để tính thời gian
              const period = await getOrCreateItemPeriod(item.id, item.game || '120');
              const gameDurationSeconds = period.game_duration_seconds || parseInt(item.game || '120') || 120;
              
              // Tính thời gian mở thưởng (thời gian kết thúc kỳ)
              const periodNumberStr = currentPeriodNumber || '';
              let prizeOpeningTime = null;
              
              if (period.period_start_time && periodNumberStr.length >= 8) {
                const periodIndex = parseInt(periodNumberStr.substring(8)) || 0;
                const periodStartTime = new Date(period.period_start_time);
                const periodEndTime = new Date(periodStartTime.getTime() + (periodIndex + 1) * gameDurationSeconds * 1000);
                prizeOpeningTime = periodEndTime.toISOString();
              }
              
              if (!prizeOpeningTime && pollResult.created_at) {
                prizeOpeningTime = pollResult.created_at;
              }
              
              // Parse winning_product để lấy A, B, C, hoặc D
              // winning_rate trong poll_results lưu A, B, C, hoặc D
              const winningProduct = pollResult.winning_rate || 'A';
              const winningProduct2 = pollResult.winning_rate_2 || null;
              
              // Format kết quả: hiển thị cả 2 đáp án
              const resultDisplay = winningProduct2 
                ? `${winningProduct}, ${winningProduct2}` 
                : winningProduct;
              
              results.push({
                id: pollResult.id,
                lotteryTypeName: pollResult.item_title,
                key: pollResult.item_key || pollResult.id,
                periodNumber: currentPeriodNumber,
                result: resultDisplay,
                result1: winningProduct,
                result2: winningProduct2,
                editor: pollResult.username || null,
                openTime: prizeOpeningTime,
                saveTime: pollResult.created_at,
                item_id: item.id,
                winning_rate: winningProduct,
                winning_rate_2: winningProduct2
              });
            }
          }
        } catch (error) {
          console.error(`Error getting current period for item ${item.id}:`, error);
        }
      }
      
      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
}

// Cập nhật kết quả của một kỳ
function updatePollResult(resultId, winningProduct, editorUsername, winningProduct2 = null) {
  return new Promise((resolve, reject) => {
    console.log(`💾 updatePollResult called:`, {
      resultId,
      winningProduct,
      winningProduct2,
      editorUsername
    });
    
    // Parse winning_product để lấy winning_rate (A, B, C, hoặc D)
    const rateToNumber = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
    const winningProductName = winningProduct.includes('Sản phẩm') 
      ? winningProduct 
      : `Sản phẩm ${rateToNumber[winningProduct] || winningProduct}`;
    
    console.log(`💾 Updating poll_result ${resultId}:`, {
      winningProductName,
      winningProduct,
      winningProduct2,
      editorUsername
    });
    
    // Đơn giản hóa: không dùng updated_at để tránh lỗi
    // Chỉ cập nhật các trường cần thiết
    getDb().run(
      `UPDATE poll_results 
       SET winning_product = ?, 
           winning_rate = ?,
           winning_rate_2 = ?,
           username = ?
       WHERE id = ?`,
      [winningProductName, winningProduct, winningProduct2 || null, editorUsername || null, resultId],
      function(err) {
        if (err) {
          console.error(`❌ Error updating poll_result ${resultId}:`, err);
          reject(err);
        } else {
          console.log(`✅ Poll result ${resultId} updated successfully. Changes: ${this.changes}`);
          if (this.changes === 0) {
            console.warn(`⚠️ No rows updated for poll_result ${resultId}. Record may not exist.`);
          }
          resolve({ id: resultId, changes: this.changes });
        }
      }
    );
  });
}

// Xóa tất cả lịch sử kết quả (poll_results)
function deleteAllPollResults() {
  return new Promise((resolve, reject) => {
    getDb().run(
      `DELETE FROM poll_results`,
      [],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      }
    );
  });
}

// Helper function to parse game duration from string (now accepts seconds directly)
function parseGameDuration(gameTime) {
  if (!gameTime) return 120; // Default 120 seconds
  
  // Try parse as number directly (seconds)
  const seconds = parseInt(gameTime);
  if (!isNaN(seconds) && seconds > 0) {
    return seconds;
  }
  
  // Fallback: try parse "X phút" format for backward compatibility
  const match = gameTime.match(/(\d+)\s*phút/);
  if (match) {
    return parseInt(match[1]) * 60; // Convert minutes to seconds
  }
  
  // Default to 120 seconds if parsing fails
  return 120;
}

// Item Periods functions (Quản lý kỳ số tự động)
function getOrCreateItemPeriod(itemId, gameDuration) {
  return new Promise((resolve, reject) => {
    const gameDurationSeconds = parseGameDuration(gameDuration);
    
    // Try to get existing period
    getDb().get(
      `SELECT * FROM item_periods WHERE item_id = ?`,
      [itemId],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (row) {
          // Check if game_duration has changed, update if needed
          const currentGameDurationSeconds = row.game_duration_seconds;
          const needsUpdate = currentGameDurationSeconds !== gameDurationSeconds;
          
          // Calculate current period based on elapsed time
          const now = new Date();
          const startTime = new Date(row.period_start_time);
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          
          // Use current or new game duration for calculation
          const durationToUse = needsUpdate ? gameDurationSeconds : currentGameDurationSeconds;
          const periodsElapsed = Math.floor(elapsedSeconds / durationToUse);
          
          let currentPeriod = row.current_period;
          let periodStartTime = startTime;
          
          // If time has passed or duration changed, update period
          if (periodsElapsed > 0 || needsUpdate) {
            if (periodsElapsed > 0) {
              currentPeriod = row.current_period + periodsElapsed;
              // Calculate new start time for current period (start of current period)
              const totalElapsedPeriods = periodsElapsed;
              const newStartSeconds = totalElapsedPeriods * durationToUse;
              periodStartTime = new Date(startTime.getTime() + newStartSeconds * 1000);
            } else if (needsUpdate) {
              // If only duration changed, reset to current time and keep period
              periodStartTime = now;
            }
            
            // Update database
            getDb().run(
              `UPDATE item_periods SET current_period = ?, period_start_time = ?, game_duration_seconds = ?, updated_at = CURRENT_TIMESTAMP WHERE item_id = ?`,
              [currentPeriod, periodStartTime.toISOString(), gameDurationSeconds, itemId],
              (updateErr) => {
                if (updateErr) {
                  console.error('Error updating item period:', updateErr);
                }
              }
            );
          }
          
          resolve({
            item_id: itemId,
            current_period: currentPeriod,
            period_start_time: periodStartTime.toISOString(),
            game_duration_seconds: gameDurationSeconds
          });
        } else {
          // Create new period record
          const now = new Date();
          getDb().run(
            `INSERT INTO item_periods (item_id, current_period, period_start_time, game_duration_seconds) VALUES (?, ?, ?, ?)`,
            [itemId, 1, now.toISOString(), gameDurationSeconds],
            function(insertErr) {
              if (insertErr) {
                reject(insertErr);
                return;
              }
              resolve({
                item_id: itemId,
                current_period: 1, // Lưu là 1 nhưng hiển thị sẽ là 0 (current_period - 1)
                period_start_time: now.toISOString(),
                game_duration_seconds: gameDurationSeconds
              });
            }
          );
        }
      }
    );
  });
}

function getCurrentPeriodNumber(itemId, gameDuration) {
  return new Promise((resolve, reject) => {
    getOrCreateItemPeriod(itemId, gameDuration)
      .then(period => {
        // Format: YYYYMMDD + số kỳ (bắt đầu từ 0)
        // Ví dụ: 202512090 = ngày 2025-12-09, kỳ 0
        const now = new Date(period.period_start_time);
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const periodNumber = `${year}${month}${day}${period.current_period - 1}`;
        resolve(periodNumber);
      })
      .catch(reject);
  });
}

// Auto generate poll result for an item (Tự động tạo kết quả random)
async function autoGeneratePollResult(item) {
  try {
    const itemId = item.id;
    const gameDuration = item.game || '120';
    const itemTitle = item.title || 'Item';
    const itemKey = item.item_key || null;
    
    console.log(`🔄 autoGeneratePollResult called for item ${itemId} (${itemTitle})`);
    
    // Get current period
    const period = await getOrCreateItemPeriod(itemId, gameDuration);
    const now = new Date();
    const startTime = new Date(period.period_start_time);
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    const gameDurationSeconds = period.game_duration_seconds;
    
    // Check if it's time to generate a new result (when period changes)
    const periodsElapsed = Math.floor(elapsedSeconds / gameDurationSeconds);
    const remainingSeconds = gameDurationSeconds - (elapsedSeconds % gameDurationSeconds);
    
    // LUÔN kiểm tra và tạo kết quả cho kỳ hiện tại nếu chưa có (cho item mới được tạo)
    const currentPeriodNumber = await getCurrentPeriodNumber(itemId, gameDuration).catch(() => null);
    
    if (currentPeriodNumber) {
      const existingCurrentResult = await new Promise((resolve) => {
        getDb().get(
          `SELECT id FROM poll_results WHERE item_id = ? AND period_number = ? LIMIT 1`,
          [itemId, currentPeriodNumber],
          (err, row) => {
            if (err) {
              resolve(null);
            } else {
              resolve(row);
            }
          }
        );
      });
      
      // Nếu chưa có kết quả cho kỳ hiện tại, tạo ngay
      if (!existingCurrentResult) {
        // Random 2 đáp án trong 4 sản phẩm (A, B, C, D) - có thể giống nhau
        const products = ['A', 'B', 'C', 'D'];
        const winningProduct = products[Math.floor(Math.random() * products.length)];
        const winningProduct2 = products[Math.floor(Math.random() * products.length)];
        
        // Parse reward_rate từ item
        let rewardCoefficients = { A: 1.0, B: 1.2, C: 1.5, D: 2.0 };
        if (item.reward_rate) {
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
        
        const rateToNumber = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
        const winningProductName = `Sản phẩm ${rateToNumber[winningProduct]}`;
        
        // Create poll result cho kỳ hiện tại (không có user, tự động tạo)
        await createPollResult(
          itemId,
          itemTitle,
          itemKey,
          currentPeriodNumber,
          winningProductName,
          winningProduct,
          0, // reward_amount = 0 vì chưa có người chơi
          null, // user_id = null
          null, // username = null
          null, // bet_amount = null
          winningProduct2 // winning_rate_2
        );
        
        console.log(`✅ Created result for item ${itemId}, period ${currentPeriodNumber}, winning: ${winningProductName} (${winningProduct}) and ${winningProduct2}`);
        return { success: true, periodsGenerated: 1, periodNumber: currentPeriodNumber };
      } else {
        console.log(`ℹ️ Result already exists for item ${itemId}, period ${currentPeriodNumber}`);
      }
    }
    
    // Tạo kết quả cho kỳ tiếp theo TRƯỚC khi kỳ đó bắt đầu (khi còn 10 giây hoặc ít hơn)
    // Hoặc nếu đã hết thời gian, tạo kết quả cho kỳ mới ngay lập tức
    const shouldGenerateNextPeriod = remainingSeconds <= 10 || periodsElapsed > 0;
    
    if (shouldGenerateNextPeriod) {
      let resultsGenerated = 0;
      
      // Tạo kết quả cho tất cả các kỳ đã trôi qua
      for (let i = 0; i < periodsElapsed; i++) {
        const periodToGenerate = period.current_period - periodsElapsed + i;
        
        // Format period number dựa trên thời gian bắt đầu của kỳ đó
        const periodStartTime = new Date(startTime.getTime() + i * gameDurationSeconds * 1000);
        const year = periodStartTime.getFullYear();
        const month = String(periodStartTime.getMonth() + 1).padStart(2, '0');
        const day = String(periodStartTime.getDate()).padStart(2, '0');
        const periodNumber = `${year}${month}${day}${periodToGenerate - 1}`;
        
        // Check if result already exists
        const existingResult = await new Promise((resolve) => {
          getDb().get(
            `SELECT id FROM poll_results WHERE item_id = ? AND period_number = ? LIMIT 1`,
            [itemId, periodNumber],
            (err, row) => {
              if (err) {
                resolve(null);
              } else {
                resolve(row);
              }
            }
          );
        });
        
        // Chỉ tạo nếu chưa có kết quả
        if (!existingResult) {
          // Random 2 đáp án trong 4 sản phẩm (A, B, C, D) - có thể giống nhau
          const products = ['A', 'B', 'C', 'D'];
          const winningProduct = products[Math.floor(Math.random() * products.length)];
          const winningProduct2 = products[Math.floor(Math.random() * products.length)];
          
          // Parse reward_rate từ item
          let rewardCoefficients = { A: 1.0, B: 1.2, C: 1.5, D: 2.0 };
          if (item.reward_rate) {
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
          
          const rateToNumber = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
          const winningProductName = `Sản phẩm ${rateToNumber[winningProduct]}`;
          
          // Create poll result (không có user, tự động tạo)
          await createPollResult(
            itemId,
            itemTitle,
            itemKey,
            periodNumber,
            winningProductName,
            winningProduct,
            0, // reward_amount = 0 vì không có người chơi
            null, // user_id = null
            null, // username = null
            null, // bet_amount = null
            winningProduct2 // winning_rate_2
          );
          
          resultsGenerated++;
        }
      }
      
      // Xử lý trả thưởng cho các kỳ đã kết thúc (trước khi cập nhật period)
      for (let i = 0; i < periodsElapsed; i++) {
        const periodToProcess = period.current_period - periodsElapsed + i;
        const periodStartTime = new Date(startTime.getTime() + i * gameDurationSeconds * 1000);
        const year = periodStartTime.getFullYear();
        const month = String(periodStartTime.getMonth() + 1).padStart(2, '0');
        const day = String(periodStartTime.getDate()).padStart(2, '0');
        const periodNumberToProcess = `${year}${month}${day}${periodToProcess - 1}`;
        
        // Kiểm tra xem đã xử lý trả thưởng chưa (kiểm tra reward_amount > 0)
        const result = await getPollResultByPeriod(itemId, periodNumberToProcess).catch(() => null);
        if (result && parseFloat(result.reward_amount || 0) === 0) {
          // Chưa xử lý, xử lý trả thưởng cho kỳ này
          try {
            await processPeriodRewards(itemId, periodNumberToProcess);
          } catch (error) {
            console.error(`Error processing rewards for period ${periodNumberToProcess}:`, error);
          }
        }
      }
      
      // Cập nhật period để bắt đầu kỳ mới
      const newPeriod = period.current_period + periodsElapsed;
      const newStartSeconds = periodsElapsed * gameDurationSeconds;
      const newStartTime = new Date(startTime.getTime() + newStartSeconds * 1000);
      
      await new Promise((resolve, reject) => {
        getDb().run(
          `UPDATE item_periods SET current_period = ?, period_start_time = ?, updated_at = CURRENT_TIMESTAMP WHERE item_id = ?`,
          [newPeriod, newStartTime.toISOString(), itemId],
          (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    }
    
    // Xử lý trả thưởng ở cuối giây cuối cùng của kỳ hiện tại (remainingSeconds <= 1)
    if (remainingSeconds <= 1 && periodsElapsed === 0) {
      const currentPeriodNumber = await getCurrentPeriodNumber(itemId, gameDuration).catch(() => null);
      if (currentPeriodNumber) {
        // Kiểm tra xem đã xử lý trả thưởng chưa (kiểm tra reward_amount > 0)
        const result = await getPollResultByPeriod(itemId, currentPeriodNumber).catch(() => null);
        if (result && parseFloat(result.reward_amount || 0) === 0) {
          // Chưa xử lý, xử lý trả thưởng ở cuối giây cuối cùng
          try {
            await processPeriodRewards(itemId, currentPeriodNumber);
          } catch (error) {
            console.error(`Error processing rewards for current period ${currentPeriodNumber}:`, error);
          }
        }
      }
    }
    
    // Tạo kết quả cho kỳ tiếp theo TRƯỚC khi kỳ đó bắt đầu (khi còn 10 giây hoặc ít hơn)
    // Tính toán kỳ tiếp theo sẽ bắt đầu
    const nextPeriodNumber = period.current_period + periodsElapsed;
    const nextPeriodStartTime = new Date(startTime.getTime() + (periodsElapsed + 1) * gameDurationSeconds * 1000);
    
    // Format period number cho kỳ tiếp theo
    const year = nextPeriodStartTime.getFullYear();
    const month = String(nextPeriodStartTime.getMonth() + 1).padStart(2, '0');
    const day = String(nextPeriodStartTime.getDate()).padStart(2, '0');
    const nextPeriodNumberStr = `${year}${month}${day}${nextPeriodNumber - 1}`;
    
    // Check if result already exists for next period
    const existingNextResult = await new Promise((resolve) => {
      getDb().get(
        `SELECT id FROM poll_results WHERE item_id = ? AND period_number = ? LIMIT 1`,
        [itemId, nextPeriodNumberStr],
        (err, row) => {
          if (err) {
            resolve(null);
          } else {
            resolve(row);
          }
        }
      );
    });
    
    // Tạo kết quả cho kỳ tiếp theo nếu chưa có và đang gần hết thời gian
    if (!existingNextResult && remainingSeconds <= 10) {
      // Random 2 đáp án trong 4 sản phẩm (A, B, C, D) - có thể giống nhau
      const products = ['A', 'B', 'C', 'D'];
      const winningProduct = products[Math.floor(Math.random() * products.length)];
      const winningProduct2 = products[Math.floor(Math.random() * products.length)];
      
      // Parse reward_rate từ item
      let rewardCoefficients = { A: 1.0, B: 1.2, C: 1.5, D: 2.0 };
      if (item.reward_rate) {
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
      
      const rateToNumber = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
      const winningProductName = `Sản phẩm ${rateToNumber[winningProduct]}`;
      
      // Create poll result cho kỳ tiếp theo (không có user, tự động tạo)
      await createPollResult(
        itemId,
        itemTitle,
        itemKey,
        nextPeriodNumberStr,
        winningProductName,
        winningProduct,
        0, // reward_amount = 0 vì không có người chơi
        null, // user_id = null
        null, // username = null
        null, // bet_amount = null
        winningProduct2 // winning_rate_2
      );
      
      return { success: true, periodsGenerated: 1, nextPeriodGenerated: true };
    }
    
    // Nếu đã tạo kết quả cho kỳ hiện tại hoặc không cần tạo gì thêm
    return { success: true, periodsGenerated: 0 };
  } catch (error) {
    console.error(`Error auto-generating poll result for item ${itemId}:`, error);
    throw error;
  }
}

// Product Reviews functions
function getProductReviews(productId) {
  return new Promise((resolve, reject) => {
    getDb().all(`
      SELECT r.*, u.username 
      FROM product_reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [productId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function createProductReview(productId, userId, username, rating, comment) {
  return new Promise((resolve, reject) => {
    if (rating < 1 || rating > 5) {
      return reject(new Error('Rating must be between 1 and 5'));
    }
    
    getDb().run(
      'INSERT INTO product_reviews (product_id, user_id, username, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [productId, userId || null, username || 'Anonymous', rating, comment || ''],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id: this.lastID, 
            product_id: productId,
            user_id: userId || null,
            username: username || 'Anonymous',
            rating,
            comment: comment || ''
          });
        }
      }
    );
  });
}

function getProductRatingStats(productId) {
  return new Promise((resolve, reject) => {
    getDb().get(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1
      FROM product_reviews
      WHERE product_id = ?
    `, [productId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          total_reviews: row?.total_reviews || 0,
          average_rating: row?.average_rating ? parseFloat(row.average_rating).toFixed(1) : '0.0',
          rating_5: row?.rating_5 || 0,
          rating_4: row?.rating_4 || 0,
          rating_3: row?.rating_3 || 0,
          rating_2: row?.rating_2 || 0,
          rating_1: row?.rating_1 || 0
        });
      }
    });
  });
}

module.exports = {
  init,
  getAllServices,
  getServiceById,
  createService,
  getAllNews,
  getNewsById,
  createNews,
  getTracking,
  createTracking,
  updateTracking,
  getAllTracking,
  getAllOrders,
  getOrderById,
  createOrder,
  getOrdersByUserId,
  updateOrderStatus,
  approveOrder,
  rejectOrder,
  deleteOrder,
  getUserByUsername,
  createUser,
  getUserById,
  getAllUsers,
  getUsersByReferralCode,
  updateUser,
  updateUserStatus,
  updateUserLoginInfo,
  deleteUser,
  getAllAdmins,
  getAdminById,
  getAdminByUsername,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAllStaff,
  getStaffById,
  getStaffByUsername,
  createStaff,
  getStaffByReferralCode,
  getActiveStaffByReferralCode,
  updateStaff,
  deleteStaff,
  getAllTransactions,
  getTransactionById,
  getTransactionsByUserId,
  createTransaction,
  updateTransaction,
  updateTransactionBalance,
  deleteTransaction,
  getTransactionStatisticsByMonth,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByStaffId,
  getActiveProducts,
  searchProducts,
  getAllSettings,
  getSetting,
  updateSetting,
  updateSettings,
  createImportHistory,
  getImportHistoryByUserId,
  getAllImportHistory,
  getImportHistoryByUserReferralCode,
  createExportHistory,
  getExportHistoryByUserId,
  getAllExportHistory,
  createExportOrder,
  getAllExportOrders,
  getExportOrdersByUserId,
  createPollHistory,
  getAllPollHistory,
  getPollHistoryByUserId,
  createPollResult,
  getPollResultByPeriod,
  updatePollResultReward,
  processPeriodRewards,
  getPollResults,
  getCurrentPeriodResults,
  updatePollResult,
  deleteAllPollResults,
  getOrCreateItemPeriod,
  getCurrentPeriodNumber,
  parseGameDuration,
  getAllActiveCategoryItems,
  autoGeneratePollResult,
  getProductReviews,
  createProductReview,
  getProductRatingStats,
  // Categories
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  // Category items (list)
  getAllCategoryItems,
  getCategoryItemById,
  createCategoryItem,
  updateCategoryItem,
  deleteCategoryItem
};

