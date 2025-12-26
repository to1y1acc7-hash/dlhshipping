import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ItemExportProvider } from './contexts/ItemExportContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import StaffProtectedRoute from './components/StaffProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import './App.css';

// Lazy load all pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const News = lazy(() => import('./pages/News'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Order = lazy(() => import('./pages/Order'));
const Import = lazy(() => import('./pages/Import'));
const Export = lazy(() => import('./pages/Export'));
const BrandExport = lazy(() => import('./pages/BrandExport'));
const ItemExport = lazy(() => import('./pages/ItemExport'));
const TrackingPublic = lazy(() => import('./pages/TrackingPublic'));
const Tracking = lazy(() => import('./pages/Tracking'));
const EditName = lazy(() => import('./pages/EditName'));
const EditGender = lazy(() => import('./pages/EditGender'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const TopUp = lazy(() => import('./pages/TopUp'));
const TopUpBank = lazy(() => import('./pages/TopUpBank'));
const TopUpEwallet = lazy(() => import('./pages/TopUpEwallet'));
const PersonalInfo = lazy(() => import('./pages/PersonalInfo'));
const LinkBank = lazy(() => import('./pages/LinkBank'));
const DepositHistory = lazy(() => import('./pages/DepositHistory'));
const WithdrawalHistory = lazy(() => import('./pages/WithdrawalHistory'));
const Withdraw = lazy(() => import('./pages/Withdraw'));
const ImportHistory = lazy(() => import('./pages/ImportHistory'));
const ExportHistory = lazy(() => import('./pages/ExportHistory'));
const CustomerSupport = lazy(() => import('./pages/CustomerSupport'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StaffLogin = lazy(() => import('./pages/StaffLogin'));
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'));
const ExportOrdersList = lazy(() => import('./pages/ExportOrdersList'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const ProductsShowcase = lazy(() => import('./pages/ProductsShowcase'));
const EditLotteryResults = lazy(() => import('./pages/EditLotteryResults'));
const BettingHistory = lazy(() => import('./pages/BettingHistory'));
const CategoryManagement = lazy(() => import('./pages/CategoryManagement'));
const AccountNew = lazy(() => import('./pages/AccountNew'));

// Loading component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '50vh',
    fontSize: '18px',
    color: '#666'
  }}>
    Đang tải...
  </div>
);

const serviceData = {
  'van-chuyen-hang-uc-vietnam': {
    title: 'Dịch vụ vận chuyển hàng từ úc về Việt Nam',
    description: 'Dịch vụ vận chuyển hàng hóa từ Australia về Việt Nam nhanh chóng, an toàn và đáng tin cậy. Chúng tôi cung cấp giải pháp logistics toàn diện với nhiều lựa chọn vận chuyển phù hợp với nhu cầu của bạn.'
  },
  'drop-ship-hang-uc-vietnam': {
    title: 'Dịch vụ Drop Ship hàng từ Úc về Việt Nam',
    description: 'Dịch vụ Drop Ship giúp bạn nhận hàng trực tiếp từ Úc về Việt Nam mà không cần kho trung gian. Giảm chi phí và thời gian vận chuyển, đảm bảo hàng hóa đến tay bạn nhanh chóng nhất.'
  },
  'order-hang-uc-chinh-hang': {
    title: 'Dịch vụ Order hàng úc chính hãng giá tốt',
    description: 'Đặt hàng chính hãng từ Úc với giá tốt nhất, đảm bảo chất lượng và xuất xứ. Chúng tôi hỗ trợ bạn đặt hàng từ các website uy tín tại Úc với dịch vụ chuyên nghiệp và giá cả cạnh tranh.'
  }
};

// Page titles mapping
const pageTitles = {
  '/': 'DHL Shipping - Excellence. Simply Delivered.',
  '/gioi-thieu': 'Giới Thiệu - DHL Shipping',
  '/dich-vu': 'Dịch Vụ - DHL Shipping',
  '/dich-vu/van-chuyen-hang-uc-vietnam': 'Vận Chuyển Hàng Úc - Việt Nam - DHL Shipping',
  '/dich-vu/drop-ship-hang-uc-vietnam': 'Drop Ship Hàng Úc - DHL Shipping',
  '/dich-vu/order-hang-uc-chinh-hang': 'Order Hàng Úc Chính Hãng - DHL Shipping',
  '/tin-tuc': 'Tin Tức - DHL Shipping',
  '/san-pham': 'Sản Phẩm - DHL Shipping',
  '/products': 'Sản Phẩm - DHL Shipping',
  '/dang-nhap': 'Đăng Nhập - DHL Shipping',
  '/dang-ky': 'Đăng Ký - DHL Shipping',
  '/admin/login': 'Đăng Nhập Admin - DHL Shipping',
  '/admin/dashboard': 'Bảng Điều Khiển Admin - DHL Shipping',
  '/admin/export-orders': 'Danh Sách Đơn Hàng Xuất - DHL Shipping',
  '/admin/edit-lottery-results': 'Chỉnh Sửa Kết Quả Xổ Số - DHL Shipping',
  '/admin/categories': 'Quản Lý Danh Mục - DHL Shipping',
  '/admin/betting-history': 'Lịch Sử Cược - DHL Shipping',
  '/staff/login': 'Đăng Nhập Nhân Viên - DHL Shipping',
  '/staff/dashboard': 'Bảng Điều Khiển Nhân Viên - DHL Shipping',
  '/staff/export-orders': 'Danh Sách Đơn Hàng Xuất - DHL Shipping',
  '/tracking': 'Tra Cứu Vận Đơn - DHL Shipping',
  '/hang-order': 'Hàng Order - DHL Shipping',
  '/nhap-hang': 'Nhập Hàng - DHL Shipping',
  '/xuat-hang': 'Xuất Hàng - DHL Shipping',
  '/account': 'Tài Khoản - DHL Shipping',
  '/account/edit-name': 'Chỉnh Sửa Tên - DHL Shipping',
  '/account/edit-gender': 'Chỉnh Sửa Giới Tính - DHL Shipping',
  '/account/order-history': 'Lịch Sử Đơn Hàng - DHL Shipping',
  '/account/top-up': 'Nạp Tiền - DHL Shipping',
  '/account/top-up/bank': 'Nạp Tiền Qua Ngân Hàng - DHL Shipping',
  '/account/top-up/ewallet': 'Nạp Tiền Qua Ví Điện Tử - DHL Shipping',
  '/account/personal-info': 'Thông Tin Cá Nhân - DHL Shipping',
  '/account/link-bank': 'Liên Kết Ngân Hàng - DHL Shipping',
  '/account/deposit-history': 'Lịch Sử Nạp Tiền - DHL Shipping',
  '/account/withdraw': 'Rút Tiền - DHL Shipping',
  '/account/withdrawal-history': 'Lịch Sử Rút Tiền - DHL Shipping',
  '/account/import-history': 'Lịch Sử Nhập Hàng - DHL Shipping',
  '/account/export-history': 'Lịch Sử Xuất Hàng - DHL Shipping',
  '/account/customer-support': 'Hỗ Trợ Khách Hàng - DHL Shipping',
  '/account/new': 'Tài Khoản - DHL Shipping',
};

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isStaffRoute = location.pathname.startsWith('/staff');

  // Update page title based on current route
  useEffect(() => {
    const pathname = location.pathname;
    
    // Check for exact match first
    if (pageTitles[pathname]) {
      document.title = pageTitles[pathname];
      return;
    }
    
    // Check for dynamic routes (e.g., /product/:id, /xuat-hang/brand/:brandId)
    if (pathname.startsWith('/product/')) {
      document.title = 'Chi Tiết Sản Phẩm - DHL Shipping';
    } else if (pathname.startsWith('/xuat-hang/brand/')) {
      document.title = 'Xuất Hàng Theo Thương Hiệu - DHL Shipping';
    } else if (pathname.startsWith('/xuat-hang/item/')) {
      document.title = 'Chi Tiết Mặt Hàng - DHL Shipping';
    } else {
      // Default title
      document.title = 'DHL Shipping - Excellence. Simply Delivered.';
    }
  }, [location.pathname]);

  return (
    <div className="App">
      {!isAdminRoute && <Header />}
      <main className="main-content">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
          <Route path="/" element={<Home />} />
            <Route path="/gioi-thieu" element={<About />} />
            <Route path="/dich-vu" element={<Services />} />
            <Route 
              path="/nhap-hang" 
              element={
                <ProtectedRoute>
                  <Import />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/xuat-hang" 
              element={
                <ProtectedRoute>
                  <Export />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/xuat-hang/brand/:brandId" 
              element={
                <ProtectedRoute>
                  <BrandExport />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/xuat-hang/item/:itemId" 
              element={
                <ProtectedRoute>
                  <ItemExport />
                </ProtectedRoute>
              } 
            />
          <Route 
            path="/dich-vu/van-chuyen-hang-uc-vietnam" 
            element={<ServiceDetail serviceData={serviceData['van-chuyen-hang-uc-vietnam']} />}
          />
          <Route 
            path="/dich-vu/drop-ship-hang-uc-vietnam" 
            element={<ServiceDetail serviceData={serviceData['drop-ship-hang-uc-vietnam']} />}
          />
          <Route 
            path="/dich-vu/order-hang-uc-chinh-hang" 
            element={<ServiceDetail serviceData={serviceData['order-hang-uc-chinh-hang']} />}
          />
          <Route path="/tin-tuc" element={<News />} />
          <Route path="/san-pham" element={<ProductsShowcase />} />
          <Route path="/products" element={<ProductsShowcase />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/dang-nhap" element={<Login />} />
          <Route path="/dang-ky" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route 
            path="/admin/export-orders" 
            element={
              <AdminProtectedRoute>
                <ExportOrdersList />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/edit-lottery-results" 
            element={
              <AdminProtectedRoute>
                <EditLotteryResults />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/categories" 
            element={
              <AdminProtectedRoute>
                <CategoryManagement />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/betting-history" 
            element={
              <AdminProtectedRoute>
                <BettingHistory />
              </AdminProtectedRoute>
            } 
          />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route 
            path="/staff/dashboard" 
            element={
              <StaffProtectedRoute>
                <StaffDashboard />
              </StaffProtectedRoute>
            } 
          />
          <Route 
            path="/staff/export-orders" 
            element={
              <StaffProtectedRoute>
                <ExportOrdersList />
              </StaffProtectedRoute>
            } 
          />
          <Route path="/tracking" element={<TrackingPublic />} />
            <Route path="/hang-order" element={<Order />} />
            <Route 
              path="/account" 
              element={
                <ProtectedRoute>
                  <Tracking />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/new" 
              element={
                <ProtectedRoute>
                  <AccountNew />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/edit-name" 
              element={
                <ProtectedRoute>
                  <EditName />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/edit-gender" 
              element={
                <ProtectedRoute>
                  <EditGender />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/order-history" 
              element={
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/top-up" 
              element={
                <ProtectedRoute>
                  <TopUp />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/top-up/bank" 
              element={
                <ProtectedRoute>
                  <TopUpBank />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/top-up/ewallet" 
              element={
                <ProtectedRoute>
                  <TopUpEwallet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/personal-info" 
              element={
                <ProtectedRoute>
                  <PersonalInfo />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/link-bank" 
              element={
                <ProtectedRoute>
                  <LinkBank />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/deposit-history" 
              element={
                <ProtectedRoute>
                  <DepositHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/withdraw" 
              element={
                <ProtectedRoute>
                  <Withdraw />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/withdrawal-history" 
              element={
                <ProtectedRoute>
                  <WithdrawalHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/import-history" 
              element={
                <ProtectedRoute>
                  <ImportHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/export-history" 
              element={
                <ProtectedRoute>
                  <ExportHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/customer-support" 
              element={
                <ProtectedRoute>
                  <CustomerSupport />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Suspense>
        </main>
        {/* Hiển thị Footer cho tất cả routes trừ admin, bao gồm cả staff */}
        {!isAdminRoute && <Footer />}
      </div>
    );
}

function App() {
  return (
    <Router>
      <ItemExportProvider>
        <AppContent />
      </ItemExportProvider>
    </Router>
  );
}

export default App;
