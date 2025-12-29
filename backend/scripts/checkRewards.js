const db = require('../database/db');
const path = require('path');

async function checkRewards() {
  try {
    // Kiểm tra poll_results chưa xử lý
    const pollResults = await db.getPollResults({ limit: 50 });
    
    console.log('=== Poll Results ===');
    console.log(`Total: ${pollResults.total} results`);
    
    // Kiểm tra poll_history gần đây - query trực tiếp để lấy item_id
    const recentHistory = await new Promise((resolve, reject) => {
      const sqlite3 = require('sqlite3').verbose();
      const dbPath = path.join(__dirname, '../database/database.sqlite');
      const database = new sqlite3.Database(dbPath);
      database.all(
        `SELECT * FROM poll_history ORDER BY created_at DESC`,
        (err, rows) => {
          database.close();
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    console.log('\n=== Recent Poll History ===');
    console.log(`Total: ${recentHistory.length} records`);
    if (recentHistory.length > 0) {
      console.log('Latest 5:');
      recentHistory.slice(0, 5).forEach(h => {
        console.log(`  - User: ${h.username}, Item ID: ${h.item_id}, Period: ${h.period_number}, Amount: ${h.amount}, Selected: ${h.selected_rates}`);
      });
    }
    
    // Tìm các kỳ có người chơi nhưng chưa được xử lý
    const historyByPeriod = {};
    recentHistory.forEach(h => {
      const key = `${h.item_id}_${h.period_number}`;
      if (!historyByPeriod[key]) {
        historyByPeriod[key] = { item_id: h.item_id, period_number: h.period_number, count: 0 };
      }
      historyByPeriod[key].count++;
    });
    
    console.log('\n=== Periods with votes ===');
    Object.values(historyByPeriod).forEach(p => {
      console.log(`  - Item ${p.item_id}, Period ${p.period_number}: ${p.count} votes`);
    });
    
    // Xử lý trả thưởng cho các kỳ có người chơi
    for (const period of Object.values(historyByPeriod)) {
      console.log(`\n💰 Processing rewards for item ${period.item_id}, period ${period.period_number}...`);
      try {
        const rewardResult = await db.processPeriodRewards(period.item_id, period.period_number);
        console.log(`✅ Processed: ${rewardResult.processed} users, total: ${rewardResult.totalReward} VNĐ`);
      } catch (error) {
        console.error(`❌ Error:`, error.message);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRewards();
