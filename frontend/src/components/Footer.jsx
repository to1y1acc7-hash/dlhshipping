import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { 
  faHome, 
  faPlus, 
  faTruck, 
  faUser,
  faTachometerAlt
} from '@fortawesome/free-solid-svg-icons';
import { useItemExport } from '../contexts/ItemExportContext';
import '../pages/Export.css';
import './Footer.css';

const API_BASE_URL = '/api';

const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isStaffLoggedIn = localStorage.getItem('isStaffLoggedIn') === 'true';
  const {
    item,
    category,
    selectedRates,
    orderAmount,
    showBottomBar,
    countdown,
    isCounting,
    setOrderAmount,
    setSelectedRates,
    setShowBottomBar,
    startCountdown
  } = useItemExport();
  const isItemExportPage = location.pathname.startsWith('/xuat-hang/item/');
  const [balance, setBalance] = useState(0);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  // Chỉ hiển thị thanh khi đã chọn sản phẩm
  useEffect(() => {
    if (!isItemExportPage) {
      setShowBottomBar(false);
      return;
    }
    
    // Chỉ hiển thị khi đã chọn ít nhất một sản phẩm hợp lệ
    const validRates = selectedRates && Array.isArray(selectedRates) 
      ? selectedRates.filter(rate => ['A', 'B', 'C', 'D'].includes(rate))
      : [];
    
    if (item && validRates.length > 0) {
      setShowBottomBar(true);
    } else {
      setShowBottomBar(false);
    }
  }, [isItemExportPage, item, selectedRates, setShowBottomBar]);

  // Load user balance
  const loadUserBalance = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/admin/members`);
      if (response.data && Array.isArray(response.data)) {
        const user = response.data.find(u => u.id === parseInt(userId));
        if (user) {
          setBalance(parseFloat(user.balance) || 0);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải số dư:', error);
      // Không set balance về 0 nếu có lỗi, giữ giá trị cũ
    }
  };

  // Load balance khi component mount
  useEffect(() => {
    loadUserBalance();
  }, []);

  // Cập nhật số dư realtime mỗi 2 giây
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      return;
    }

    // Polling mỗi 2 giây để cập nhật số dư realtime
    const interval = setInterval(() => {
      loadUserBalance();
    }, 2000); // 2 giây

    // Cleanup interval khi component unmount
    return () => clearInterval(interval);
  }, []);

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleAccountClick = (e) => {
    e.preventDefault();
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const isStaffLoggedIn = localStorage.getItem('isStaffLoggedIn') === 'true';
    if (isLoggedIn || isStaffLoggedIn) {
      navigate('/account');
    } else {
      navigate('/dang-nhap', { state: { from: { pathname: '/account' } } });
    }
  };

  // Chuyển đổi selectedRates thành tên sản phẩm
  const getSelectedProductsText = () => {
    // Chỉ hiển thị các lựa chọn hợp lệ A/B/C/D, tránh chuỗi JSON
    const valid = Array.isArray(selectedRates)
      ? selectedRates.filter((r) => ['A', 'B', 'C', 'D'].includes(r))
      : [];
    if (valid.length === 0) return '—';

    const rateToNumber = { A: 1, B: 2, C: 3, D: 4 };
    return valid.map((rate) => `Sản phẩm ${rateToNumber[rate]}`).join(', ');
  };

  // Tính tổng tiền
  const calculateTotalAmount = () => {
    const amountPerOrder = parseFloat(orderAmount) || 0;
    // Chỉ đếm các sản phẩm hợp lệ (A, B, C, D)
    const validRates = selectedRates && Array.isArray(selectedRates) 
      ? selectedRates.filter(rate => ['A', 'B', 'C', 'D'].includes(rate))
      : [];
    const selectedCount = validRates.length;
    const total = amountPerOrder * selectedCount;
    return total.toLocaleString('vi-VN');
  };

  // Format countdown thành MM:SS
  const formatCountdown = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Xử lý xuất đơn
  const handleExportOrder = async () => {
    // Không bắt đợi - cho phép xuất đơn ngay lập tức

    // Chỉ lấy các sản phẩm hợp lệ (A, B, C, D)
    const validRates = selectedRates && Array.isArray(selectedRates) 
      ? selectedRates.filter(rate => ['A', 'B', 'C', 'D'].includes(rate))
      : [];
    
    const amountPerOrder = parseFloat(orderAmount) || 0;
    const selectedCount = validRates.length;
    const totalAmount = amountPerOrder * selectedCount;

    // Kiểm tra đã chọn sản phẩm chưa
    if (selectedCount === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    // Kiểm tra đã nhập số tiền chưa
    if (!orderAmount || amountPerOrder <= 0 || isNaN(amountPerOrder)) {
      alert('Vui lòng nhập số tiền mỗi đơn hợp lệ');
      return;
    }

    // Kiểm tra totalAmount hợp lệ
    if (isNaN(totalAmount) || totalAmount <= 0) {
      alert('Tổng tiền không hợp lệ');
      return;
    }

    // Kiểm tra số dư
    if (balance < totalAmount) {
      alert(`Số dư không đủ. Số dư hiện tại: ${balance.toLocaleString('vi-VN')}. Cần: ${totalAmount.toLocaleString('vi-VN')}`);
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('Vui lòng đăng nhập');
        navigate('/dang-nhap');
        return;
      }

      console.log('Đang xuất đơn với dữ liệu:', {
        userId: parseInt(userId),
        itemId: item?.id,
        itemTitle: item?.title,
        selectedRates: validRates,
        totalAmount: totalAmount
      });

      const response = await axios.post(`${API_BASE_URL}/item-export-orders`, {
        userId: parseInt(userId),
        itemId: item?.id,
        itemTitle: item?.title,
        selectedRates: validRates, // Chỉ gửi các sản phẩm hợp lệ
        totalAmount: totalAmount
      });

      console.log('Phản hồi từ server:', response.data);

      if (response.data && response.data.success) {
        // Cập nhật số dư ngay lập tức từ response
        if (response.data.balance !== undefined) {
          setBalance(response.data.balance);
        } else {
          // Reload balance ngay lập tức nếu không có trong response
          await loadUserBalance();
        }
        // Không bắt đầu countdown - cho phép xuất đơn tiếp theo ngay lập tức
        // Trigger event để reload period number ngay lập tức
        window.dispatchEvent(new CustomEvent('itemExportSuccess', { 
          detail: { itemId: item?.id } 
        }));
        // Hiển thị notification tự động nhảy xuống
        setShowSuccessNotification(true);
        // Tự động ẩn sau 3 giây
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 3000);
        // Tự động ẩn thanh bottom sheet khi xuất đơn thành công
        setShowBottomBar(false);
        // Reset lựa chọn sản phẩm và số tiền
        setSelectedRates([]);
        setOrderAmount('');
      } else {
        // Reload balance ngay lập tức để đảm bảo số dư được cập nhật
        await loadUserBalance();
        // Trigger event để reload period number ngay lập tức
        window.dispatchEvent(new CustomEvent('itemExportSuccess', { 
          detail: { itemId: item?.id } 
        }));
        // Hiển thị notification tự động nhảy xuống
        setShowSuccessNotification(true);
        // Tự động ẩn sau 3 giây
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 3000);
        // Tự động ẩn thanh bottom sheet khi xuất đơn thành công
        setShowBottomBar(false);
        // Reset lựa chọn sản phẩm và số tiền
        setSelectedRates([]);
        setOrderAmount('');
        // Không bắt đầu countdown - cho phép xuất đơn tiếp theo ngay lập tức
      }
    } catch (error) {
      console.error('Lỗi khi xuất đơn:', error);
      console.error('Chi tiết lỗi:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Lỗi khi xuất đơn';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  return (
    <footer className="footer">
      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="success-notification">
          <div className="success-notification-content">
            <span className="success-icon">✓</span>
            <span className="success-message">Xuất đơn thành công!</span>
          </div>
        </div>
      )}
      {isItemExportPage && item && (
        <>
          {showBottomBar ? (
            <div className="bottom-toggle-bar visible sheet">
              <div className="sheet-container">
                <div className="sheet-row between">
                  <div className="sheet-row gap8">
                    <span className="sheet-label">Nội dung:</span>
                    <span className="sheet-value sheet-link">{getSelectedProductsText()}</span>
                  </div>
                  <button
                    className="sheet-close"
                    type="button"
                    aria-label="Ẩn"
                    onClick={() => setShowBottomBar(false)}
                  >
                    ▾
                  </button>
                </div>
                <div className="sheet-row between">
                  <span className="sheet-label">Số tiền mỗi đơn:</span>
                  <input
                    type="text"
                    className="sheet-input"
                    placeholder="Vui lòng nhập Số tiền"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(e.target.value)}
                  />
                </div>
                <div className="sheet-row between">
                  <div className="sheet-row gap8">
                    <span className="sheet-label">Chọn</span>
                    <span className="sheet-highlight">
                      {selectedRates && Array.isArray(selectedRates) 
                        ? selectedRates.filter(rate => ['A', 'B', 'C', 'D'].includes(rate)).length 
                        : 0}
                    </span>
                  </div>
                  <div className="sheet-row gap8">
                    <span className="sheet-label">Tổng tiền</span>
                    <span className="sheet-highlight">{calculateTotalAmount()}</span>
                  </div>
                </div>
                <div className="sheet-row between">
                  <div className="sheet-row gap8">
                    <span className="sheet-cart">🛒</span>
                    <div className="sheet-divider"></div>
                    <span className="sheet-label">Số dư</span>
                    <span className="sheet-highlight">{balance.toLocaleString('vi-VN')}</span>
                  </div>
                  <button 
                    className="btn-primary"
                    onClick={handleExportOrder}
                    title="Xuất đơn"
                  >
                    Xuất đơn
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              className="sheet-close sheet-close-only"
              type="button"
              aria-label="Hiện"
              onClick={() => setShowBottomBar(true)}
            >
              ▴
            </button>
          )}
        </>
      )}
      <div className="footer-nav">
        <Link 
          to="/" 
          className={`footer-nav-item ${isActive('/') ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faHome} className="footer-icon" />
          <span className="footer-text">Trang chủ</span>
        </Link>
        {isStaffLoggedIn && (
          <Link 
            to="/staff/dashboard" 
            className={`footer-nav-item ${isActive('/staff/dashboard') ? 'active' : ''}`}
          >
            <FontAwesomeIcon icon={faTachometerAlt} className="footer-icon" />
            <span className="footer-text">Dashboard</span>
          </Link>
        )}
        <Link 
          to="/nhap-hang" 
          className={`footer-nav-item ${isActive('/nhap-hang') ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faPlus} className="footer-icon" />
          <span className="footer-text">Nhập hàng</span>
        </Link>
        <Link 
          to="/xuat-hang" 
          className={`footer-nav-item ${isActive('/xuat-hang') ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faTruck} className="footer-icon" />
          <span className="footer-text">Xuất hàng</span>
        </Link>
        <a 
          href="/account"
          onClick={handleAccountClick}
          className={`footer-nav-item ${isActive('/account') ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faUser} className="footer-icon" />
          <span className="footer-text">Tài khoản</span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;

