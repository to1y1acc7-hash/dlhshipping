const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database/db');
const apiRoutes = require('./routes/api');
const pollResultGenerator = require('./services/pollResultGenerator');

const app = express();
const PORT = process.env.PORT || 5000;

// Compression middleware (using built-in express compression if available)
// For production, consider installing: npm install compression
let compression;
try {
  compression = require('compression');
  app.use(compression({
    level: 6,
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
} catch (e) {
  console.log('⚠️  Compression middleware not installed. Install with: npm install compression');
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'DHL Backend API is running' });
});

// Serve static files in production (if frontend is built)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
}

// Helper function to get local IP address
function getLocalIPAddress() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Initialize database and start server
db.init()
  .then(() => {
    console.log('✅ Database initialized successfully');
    const HOST = '0.0.0.0'; // Listen on all network interfaces
    app.listen(PORT, HOST, () => {
      const localIP = getLocalIPAddress();
      console.log('\n' + '='.repeat(60));
      console.log('🚀 Server is running!');
      console.log('='.repeat(60));
      console.log(`📍 Local:    http://localhost:${PORT}`);
      console.log(`🌐 Network:  http://${localIP}:${PORT}`);
      console.log(`📡 API:      http://${localIP}:${PORT}/api`);
      console.log(`💚 Health:   http://${localIP}:${PORT}/health`);
      console.log('='.repeat(60));
      console.log('\n💡 Để người khác truy cập, họ cần dùng địa chỉ Network IP ở trên');
      console.log('💡 To allow others to access, they need to use the Network IP above');
      console.log('💡 Đảm bảo firewall cho phép port ' + PORT);
      console.log('💡 Make sure firewall allows port ' + PORT + '\n');
      
      // Start background service để tự động tạo kết quả
      pollResultGenerator.start();
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pollResultGenerator.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  pollResultGenerator.stop();
  process.exit(0);
});

