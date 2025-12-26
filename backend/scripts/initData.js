const db = require('../database/db');

const initialServices = [
  {
    name: 'DHL Express Shipping',
    description: 'Dịch vụ vận chuyển nhanh toàn cầu với thời gian giao hàng đảm bảo',
    icon: '✈️',
    price: 25.99,
    category: 'Express'
  },
  {
    name: 'DHL Standard Shipping',
    description: 'Dịch vụ vận chuyển tiêu chuẩn với theo dõi đầy đủ',
    icon: '🚚',
    price: 15.99,
    category: 'Standard'
  },
  {
    name: 'DHL Economy Shipping',
    description: 'Giải pháp vận chuyển tiết kiệm cho hàng hóa không khẩn cấp',
    icon: '📦',
    price: 9.99,
    category: 'Economy'
  },
  {
    name: 'DHL International Shipping',
    description: 'Vận chuyển quốc tế đến hơn 220 quốc gia và vùng lãnh thổ',
    icon: '🌍',
    price: 35.99,
    category: 'International'
  },
  {
    name: 'DHL Same Day Delivery',
    description: 'Dịch vụ giao hàng trong ngày cho các gói hàng khẩn cấp',
    icon: '⚡',
    price: 49.99,
    category: 'Express'
  },
  {
    name: 'DHL Sea Freight',
    description: 'Vận chuyển đường biển cho hàng hóa lớn và container',
    icon: '🚢',
    price: 500.00,
    category: 'Freight'
  }
];

const initialNews = [
  {
    title: 'DHL mở rộng dịch vụ tại Việt Nam',
    content: 'DHL tiếp tục mở rộng mạng lưới dịch vụ tại Việt Nam với các điểm giao nhận mới tại Hà Nội và TP.HCM.',
    image: '/images/news-1.jpg',
    author: 'DHL Vietnam'
  },
  {
    title: 'Công nghệ mới trong theo dõi hàng hóa',
    content: 'DHL ra mắt hệ thống theo dõi hàng hóa thời gian thực với công nghệ IoT tiên tiến.',
    image: '/images/news-2.jpg',
    author: 'DHL Technology'
  },
  {
    title: 'DHL cam kết giảm phát thải carbon',
    content: 'DHL đặt mục tiêu giảm phát thải carbon xuống 0% vào năm 2050 thông qua các giải pháp vận chuyển xanh.',
    image: '/images/news-3.jpg',
    author: 'DHL Sustainability'
  }
];

const initialTracking = [
  {
    tracking_number: 'DHL1234567890',
    status: 'In Transit',
    location: 'Ho Chi Minh City, Vietnam',
    description: 'Package is on the way to destination'
  },
  {
    tracking_number: 'DHL0987654321',
    status: 'Delivered',
    location: 'Hanoi, Vietnam',
    description: 'Package has been delivered successfully'
  },
  {
    tracking_number: 'DHL1122334455',
    status: 'Processing',
    location: 'DHL Warehouse',
    description: 'Package is being processed'
  }
];

async function initializeData() {
  try {
    console.log('🔄 Initializing database...');
    await db.init();
    
    console.log('📦 Seeding initial data...');
    
    // Seed services
    console.log('\n📋 Adding services...');
    for (const service of initialServices) {
      await db.createService(
        service.name,
        service.description,
        service.icon,
        service.price,
        service.category
      );
      console.log(`  ✓ Added: ${service.name}`);
    }
    
    // Seed news
    console.log('\n📰 Adding news...');
    for (const news of initialNews) {
      await db.createNews(
        news.title,
        news.content,
        news.image,
        news.author
      );
      console.log(`  ✓ Added: ${news.title}`);
    }
    
    // Seed tracking
    console.log('\n📦 Adding tracking data...');
    for (const tracking of initialTracking) {
      await db.createTracking(
        tracking.tracking_number,
        tracking.status,
        tracking.location,
        tracking.description
      );
      console.log(`  ✓ Added: ${tracking.tracking_number}`);
    }
    
    console.log('\n✅ Initial data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Services: ${initialServices.length}`);
    console.log(`   - News: ${initialNews.length}`);
    console.log(`   - Tracking: ${initialTracking.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing data:', error);
    process.exit(1);
  }
}

initializeData();

