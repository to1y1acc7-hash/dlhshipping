// Seed sample categories and poll items for AdminDashboard "Quản Lý Bình Chọn"
const db = require('../database/db');

async function ensureCategory(name, quantity = 5, status = 'active', description = '', image = '') {
  const existing = (await db.getAllCategories()).find((c) => c.name === name);
  if (existing) return existing;
  return db.createCategory(name, quantity, status, description, image);
}

async function ensureItem(categoryId, title, itemKey, overrides = {}) {
  const existingItems = await db.getAllCategoryItems(categoryId);
  const found = existingItems.find((i) => i.title === title || String(i.item_key) === String(itemKey));
  if (found) return found;
  return db.createCategoryItem(
    categoryId,
    title,
    overrides.reward_rate || 'A',
    overrides.image || '',
    overrides.content || '',
    overrides.balance_required || 0,
    itemKey,
    overrides.game || '2 phút',
    overrides.status || 'active'
  );
}

async function main() {
  await db.init();

  const sports = await ensureCategory('Thể thao', 10, 'active', 'Các kèo thể thao phổ biến');
  const lotto = await ensureCategory('Xổ số nhanh', 8, 'active', 'Trò chơi quay nhanh 2-5 phút');

  await ensureItem(sports.id, 'Kèo bóng 2 phút', 1, { content: 'Kèo bóng nhanh', reward_rate: 'A', game: '2 phút' });
  await ensureItem(sports.id, 'Kèo tennis 5 phút', 2, { content: 'Kèo tennis', reward_rate: 'B', game: '5 phút' });
  await ensureItem(lotto.id, 'XS nhanh A', 1, { content: 'XS siêu tốc', reward_rate: 'A', game: '2 phút' });
  await ensureItem(lotto.id, 'XS nhanh B', 2, { content: 'XS nhanh 5p', reward_rate: 'C', game: '5 phút' });

  console.log('✅ Seed dữ liệu mẫu cho Quản Lý Bình Chọn hoàn tất.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed thất bại:', err);
  process.exit(1);
});

