const db = require('../database/db');

// Background service để tự động tạo kết quả random cho các items active
class PollResultGenerator {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkInterval = 5000; // Kiểm tra mỗi 5 giây để đảm bảo tạo kết quả đúng thời điểm
  }

  // Bắt đầu service
  start() {
    if (this.isRunning) {
      console.log('PollResultGenerator is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 PollResultGenerator service started');

    // Chạy ngay lập tức lần đầu
    this.processAllItems();

    // Sau đó chạy định kỳ
    this.intervalId = setInterval(() => {
      this.processAllItems();
    }, this.checkInterval);
  }

  // Dừng service
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ PollResultGenerator service stopped');
  }

  // Xử lý tất cả items active
  async processAllItems() {
    try {
      const items = await db.getAllActiveCategoryItems();
      
      if (!items || items.length === 0) {
        console.log('⚠️ No active category items found');
        return;
      }

      console.log(`🔄 Processing ${items.length} active items...`);

      // Xử lý từng item
      for (const item of items) {
        try {
          const result = await db.autoGeneratePollResult(item);
          if (result && result.success) {
            console.log(`✅ Generated result for item ${item.id} (${item.title})`);
          }
        } catch (error) {
          console.error(`❌ Error processing item ${item.id} (${item.title}):`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error in processAllItems:', error);
    }
  }
}

// Export singleton instance
const pollResultGenerator = new PollResultGenerator();

module.exports = pollResultGenerator;

