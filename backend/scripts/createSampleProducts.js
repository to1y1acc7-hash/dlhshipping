const db = require('../database/db');

// Dữ liệu 5 sản phẩm mẫu
const sampleProducts = [
  {
    productName: 'Áo thun nam cao cấp',
    productCode: 'SP001',
    productLink: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    quantity: 50,
    unitPrice: 250000,
    supplier: 'Nhà cung cấp thời trang ABC',
    notes: 'Áo thun chất liệu cotton 100%, nhiều màu sắc',
    status: 'completed'
  },
  {
    productName: 'Giày thể thao Nike Air Max',
    productCode: 'SP002',
    productLink: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    quantity: 30,
    unitPrice: 2500000,
    supplier: 'Nike Store Việt Nam',
    notes: 'Giày thể thao chính hãng, size 38-44',
    status: 'completed'
  },
  {
    productName: 'Túi xách da thật',
    productCode: 'SP003',
    productLink: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
    quantity: 25,
    unitPrice: 1500000,
    supplier: 'Thương hiệu túi xách XYZ',
    notes: 'Túi xách da bò thật, thiết kế sang trọng',
    status: 'completed'
  },
  {
    productName: 'Đồng hồ thông minh Apple Watch',
    productCode: 'SP004',
    productLink: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=500',
    quantity: 20,
    unitPrice: 8000000,
    supplier: 'Apple Authorized Reseller',
    notes: 'Apple Watch Series 9, màu đen, chính hãng',
    status: 'completed'
  },
  {
    productName: 'Tai nghe không dây Sony WH-1000XM5',
    productCode: 'SP005',
    productLink: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    quantity: 40,
    unitPrice: 6000000,
    supplier: 'Sony Việt Nam',
    notes: 'Tai nghe chống ồn chủ động, pin 30 giờ',
    status: 'completed'
  }
];

async function createSampleProducts() {
  try {
    console.log('🔄 Đang khởi tạo database...');
    await db.init();
    console.log('✅ Database đã sẵn sàng\n');
    
    // Test connection
    const testDb = db.getDb();
    if (!testDb) {
      throw new Error('Không thể kết nối database');
    }

    // Lấy staff đầu tiên để gán vào sản phẩm
    let staffId = null;
    try {
      const allStaff = await db.getAllStaff();
      if (allStaff && allStaff.length > 0) {
        staffId = allStaff[0].id;
        console.log(`📋 Sử dụng staff ID: ${staffId} (${allStaff[0].username})\n`);
      } else {
        console.log('⚠️  Không tìm thấy staff nào, sẽ tạo sản phẩm với staff_id = null\n');
      }
    } catch (err) {
      console.log('⚠️  Không thể lấy danh sách staff, sẽ tạo sản phẩm với staff_id = null\n');
    }

    console.log('📦 Đang tạo 5 sản phẩm mẫu...\n');

    for (let i = 0; i < sampleProducts.length; i++) {
      const product = sampleProducts[i];
      const totalAmount = product.unitPrice * product.quantity;

      try {
        const importRecord = await db.createImportHistory(
          null, // user_id = null (sản phẩm được tạo bởi nhân viên)
          staffId, // staff_id
          product.productName,
          product.productCode,
          product.productLink,
          product.quantity,
          product.unitPrice,
          totalAmount,
          product.supplier,
          product.notes,
          product.status
        );

        console.log(`✅ [${i + 1}/5] Đã tạo sản phẩm: ${product.productName}`);
        console.log(`   - Mã: ${product.productCode}`);
        console.log(`   - Số lượng: ${product.quantity}`);
        console.log(`   - Giá: ${product.unitPrice.toLocaleString('vi-VN')} VNĐ`);
        console.log(`   - Tổng tiền: ${totalAmount.toLocaleString('vi-VN')} VNĐ`);
        console.log(`   - ID: ${importRecord.id}\n`);
      } catch (error) {
        console.error(`❌ Lỗi khi tạo sản phẩm ${i + 1}:`, error.message);
      }
    }

    console.log('✨ Hoàn tất! Đã tạo 5 sản phẩm mẫu.');
    console.log('💡 Bạn có thể xem các sản phẩm này trên trang nhập hàng của khách hàng.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

// Chạy script
createSampleProducts();
