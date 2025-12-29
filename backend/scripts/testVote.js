const db = require('../database/db');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function testVote() {
  try {
    // Lấy thông tin user và kỳ hiện tại
    const user = await db.getUserByUsername('test');
    console.log('=== BEFORE ===');
    console.log('Balance:', user.balance);
    
    const period = await db.getCurrentPeriodNumber(1, '120');
    console.log('Current period:', period);
    
    const result = await db.getPollResultByPeriod(1, period);
    const winning1 = result ? result.winning_rate : 'N/A';
    const winning2 = result ? result.winning_rate_2 : 'N/A';
    console.log('Winning answers:', winning1, 'and', winning2);
    
    const dbPath = path.join(__dirname, '../database/database.sqlite');
    const database = new sqlite3.Database(dbPath);
    
    // Tạo 4 bình chọn: A, B, C, D mỗi cái 10.000đ
    const choices = ['A', 'B', 'C', 'D'];
    let totalBet = 0;
    
    for (const choice of choices) {
      await new Promise((resolve, reject) => {
        database.run(
          `INSERT INTO poll_history (user_id, username, item_id, item_title, item_key, period_number, amount, selected_rates) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [1, 'test', 1, 'test', '1', period, 10000, JSON.stringify([choice])],
          function(err) {
            if (err) reject(err);
            else {
              console.log(`✅ Vote ${choice}: 10.000đ`);
              totalBet += 10000;
              resolve();
            }
          }
        );
      });
    }
    
    // Trừ tiền user (40.000đ)
    const newBalance = user.balance - totalBet;
    await new Promise((resolve, reject) => {
      database.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, user.id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    database.close();
    
    console.log('\n=== SUMMARY ===');
    console.log('Total bet:', totalBet);
    console.log('Balance after bet:', newBalance);
    console.log('Winning:', winning1, 'and', winning2);
    
    // Tính toán kỳ vọng
    let expectedWin = 0;
    if (choices.includes(winning1)) expectedWin += 10000;
    if (winning2 && choices.includes(winning2)) expectedWin += 10000;
    console.log('Expected reward:', expectedWin);
    console.log('Expected final balance:', newBalance + expectedWin);
    
    console.log('\n⏳ Wait for period to end...');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testVote();
