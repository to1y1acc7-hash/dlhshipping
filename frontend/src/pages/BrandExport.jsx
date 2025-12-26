import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import './BrandExport.css';

const API_BASE_URL = '/api';

// Brand data - same as in Export.jsx
import amazonImage from '../assets/xuathang/amazon.jpeg';
import coupangImage from '../assets/xuathang/coupang.jpg';
import ebayImage from '../assets/xuathang/Ebay.jpg';
import gmarketImage from '../assets/xuathang/gmarket.png';
import kmartImage from '../assets/xuathang/Kmart.png';
import koganImage from '../assets/xuathang/kogan.jpg';
import myerImage from '../assets/xuathang/myer.jpg';
import naverImage from '../assets/xuathang/naver.png';
import tmonImage from '../assets/xuathang/tmon.jpg';
import wemaketpriceImage from '../assets/xuathang/wemaketprice.png';

const fallbackImages = [
  amazonImage,
  ebayImage,
  kmartImage,
  koganImage,
  myerImage,
  gmarketImage,
  coupangImage,
  naverImage,
  tmonImage,
  wemaketpriceImage
];

const BrandExport = () => {
  const { brandId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState('');
  const [timer, setTimer] = useState({ hours: 0, minutes: 2, seconds: 0 });
  const [orderCode, setOrderCode] = useState('#202512062419');
  const [amounts, setAmounts] = useState(['', '', '', '']);
  const [selectedProducts, setSelectedProducts] = useState([0]); // Mảng các sản phẩm đã chọn, mặc định chọn sản phẩm 1
  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [isBalanceBarOpen, setIsBalanceBarOpen] = useState(true);
  const [cooldownTimer, setCooldownTimer] = useState(0); // Thời gian chờ còn lại (giây)
  const [isOnCooldown, setIsOnCooldown] = useState(false); // Trạng thái đang trong thời gian chờ

  // Load categories for brand info
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError('');
        const res = await axios.get(`${API_BASE_URL}/categories`);
        const items = Array.isArray(res.data) ? res.data : [];
        setCategories(items);
      } catch (err) {
        console.error('Lỗi tải danh mục:', err);
        setCategories([]);
        setCategoriesError('Không thể tải danh mục');
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Find the brand/category by ID
  const brand = categories.find(c => c.id === parseInt(brandId));
  const brandIndex = brand ? categories.findIndex(c => c.id === brand.id) : -1;
  const brandImage = brand
    ? brand.image || fallbackImages[(brandIndex >= 0 ? brandIndex : 0) % fallbackImages.length]
    : fallbackImages[0];

  // Kiểm tra và khôi phục thời gian chờ từ localStorage
  useEffect(() => {
    const lastOrderTime = localStorage.getItem(`lastOrderTime_${brandId}`);
    if (lastOrderTime) {
      const timeElapsed = Math.floor((Date.now() - parseInt(lastOrderTime)) / 1000);
      const cooldownPeriod = 120; // 120 giây = 2 phút
      const remainingTime = cooldownPeriod - timeElapsed;
      
      if (remainingTime > 0) {
        setCooldownTimer(remainingTime);
        setIsOnCooldown(true);
      } else {
        // Thời gian chờ đã hết
        localStorage.removeItem(`lastOrderTime_${brandId}`);
        setCooldownTimer(0);
        setIsOnCooldown(false);
      }
    }
  }, [brandId]);

  // If brand not found, redirect to export page
  useEffect(() => {
    if (!categoriesLoading && categoriesError) {
      navigate('/xuat-hang');
      return;
    }
    if (!categoriesLoading && brandId && !brand) {
      navigate('/xuat-hang');
    }
  }, [brand, brandId, navigate, categoriesLoading, categoriesError]);

  // Load user balance
  useEffect(() => {
    const loadUserBalance = async () => {
      try {
        setBalanceLoading(true);
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setBalanceLoading(false);
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
        setBalance(0);
      } finally {
        setBalanceLoading(false);
      }
    };
    
    loadUserBalance();
  }, []);

  // Timer countdown cho đơn hàng kế tiếp (cooldown)
  useEffect(() => {
    if (!isOnCooldown) return;

    const interval = setInterval(() => {
      setCooldownTimer(prev => {
        if (prev <= 1) {
          // Thời gian chờ đã hết
          setIsOnCooldown(false);
          localStorage.removeItem(`lastOrderTime_${brandId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOnCooldown, brandId]);

  // Timer countdown (giữ nguyên cho các mục đích khác nếu cần)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        let { hours, minutes, seconds } = prev;
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        
        if (totalSeconds <= 0) {
          // Khi timer về 0, reload trang
          clearInterval(interval);
          setTimeout(() => {
            window.location.reload();
          }, 100);
          return { hours: 0, minutes: 0, seconds: 0 };
        }
        
        // Giảm 1 giây
        const newTotalSeconds = totalSeconds - 1;
        const newHours = Math.floor(newTotalSeconds / 3600);
        const newMinutes = Math.floor((newTotalSeconds % 3600) / 60);
        const newSeconds = newTotalSeconds % 60;
        
        return { hours: newHours, minutes: newMinutes, seconds: newSeconds };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Generate new order code (for demo purposes)
  useEffect(() => {
    const generateOrderCode = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `#${year}${month}${day}${random}`;
    };
    setOrderCode(generateOrderCode());
  }, []);

  const handleAmountChange = (index, value) => {
    // Chỉ cho phép nhập số dương hoặc rỗng
    // Loại bỏ tất cả ký tự không phải số và dấu chấm
    let sanitizedValue = value.replace(/[^0-9.]/g, '');
    
    // Chỉ cho phép một dấu chấm thập phân
    const parts = sanitizedValue.split('.');
    if (parts.length > 2) {
      sanitizedValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    const newAmounts = [...amounts];
    newAmounts[index] = sanitizedValue;
    setAmounts(newAmounts);
  };

  const calculateTotal = () => {
    return amounts.reduce((sum, amount) => {
      const numAmount = parseFloat(amount) || 0;
      return sum + numAmount;
    }, 0);
  };

  const handleExportOrder = async () => {
    try {
      // Kiểm tra thời gian chờ
      if (isOnCooldown) {
        alert(`Vui lòng đợi ${formatCooldownTime(cooldownTimer)} trước khi thực hiện đơn hàng tiếp theo`);
        return;
      }

      // Validate
      if (selectedProducts.length === 0) {
        alert('Vui lòng chọn ít nhất một sản phẩm');
        return;
      }

      const totalAmount = calculateTotal();
      if (totalAmount <= 0) {
        alert('Tổng tiền phải lớn hơn 0');
        return;
      }

      if (totalAmount > balance) {
        alert(`Số dư không đủ. Số dư hiện tại: ${balance.toLocaleString('vi-VN')}`);
        return;
      }

      // Prepare products data
      const productsData = selectedProducts
        .map(index => {
          const amount = parseFloat(amounts[index]) || 0;
          return {
            productNumber: index + 1,
            amount: amount
          };
        })
        .filter(p => p.amount > 0);

      if (productsData.length === 0) {
        alert('Vui lòng nhập số tiền cho ít nhất một sản phẩm');
        return;
      }

      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('Vui lòng đăng nhập lại');
        navigate('/dang-nhap');
        return;
      }

      // Call API directly without confirmation
      console.log('Sending export order:', {
        userId: parseInt(userId),
        orderCode,
        brandId: parseInt(brandId),
        brandName: brand.name || brand.description,
        products: productsData,
        totalAmount
      });

      const response = await axios.post(`${API_BASE_URL}/export-orders`, {
        userId: parseInt(userId),
        orderCode: orderCode,
        brandId: parseInt(brandId),
        brandName: brand.name || brand.description,
        products: productsData,
        totalAmount: totalAmount
      }, {
        headers: {
          'user-id': userId
        }
      });

      console.log('Export order response:', response.data);

      if (response.data && response.data.success) {
        alert('Xuất đơn thành công!');
        
        // Lưu thời gian thực hiện đơn hàng và bắt đầu đếm ngược 120 giây
        const currentTime = Date.now();
        localStorage.setItem(`lastOrderTime_${brandId}`, currentTime.toString());
        setCooldownTimer(120);
        setIsOnCooldown(true);
        
        // Reset form
        setSelectedProducts([]);
        setAmounts(['', '', '', '']);
        setIsBalanceBarOpen(false);
        // Generate new order code
        const newOrderCode = `#${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        setOrderCode(newOrderCode);
        // Update balance from response
        if (response.data.balance !== undefined) {
          setBalance(parseFloat(response.data.balance));
        } else {
          // Reload balance from API
          try {
            const balanceResponse = await axios.get(`${API_BASE_URL}/admin/members`);
            if (balanceResponse.data && Array.isArray(balanceResponse.data)) {
              const user = balanceResponse.data.find(u => u.id === parseInt(userId));
              if (user) {
                setBalance(parseFloat(user.balance) || 0);
              }
            }
          } catch (err) {
            console.error('Error loading balance:', err);
          }
        }
      } else {
        alert(response.data?.message || 'Có lỗi xảy ra khi xuất đơn.');
      }
    } catch (error) {
      console.error('Error exporting order:', error);
      if (error.response && error.response.data && error.response.data.error) {
        alert(error.response.data.error);
      } else {
        alert('Có lỗi xảy ra khi xuất đơn. Vui lòng thử lại.');
      }
    }
  };

  const formatTime = (time) => {
    return String(time).padStart(2, '0');
  };

  const formatCooldownTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${formatTime(mins)}:${formatTime(secs)}`;
  };

  if (categoriesLoading) {
    return null;
  }

  if (!brand) {
    return null;
  }

  return (
    <div className="brand-export-page">
      <div className="brand-export-content">
        {/* Order Information Boxes */}
        <div className="order-info-container">
          <div className="order-info-box">
            <div className="order-info-label">Đơn hàng kế tiếp</div>
            <div className="order-timer">
              {isOnCooldown ? formatCooldownTime(cooldownTimer) : '00:00'}
            </div>
          </div>
          <div className="order-info-box">
            <div className="order-info-label">Mã đơn hàng</div>
            <div className="order-code">{orderCode}</div>
          </div>
        </div>

        {/* Company Name */}
        <div className="company-name">
          {brand.description || brand.name}
        </div>

        {/* Product Selection Buttons */}
        <div className="products-container">
          {amounts.map((amount, index) => (
            <button
              key={index}
              className={`product-select-btn ${selectedProducts.includes(index) ? 'product-select-btn-active' : ''}`}
              onClick={() => {
                // Toggle sản phẩm: nếu đã chọn thì bỏ chọn, chưa chọn thì thêm vào
                if (selectedProducts.includes(index)) {
                  setSelectedProducts(selectedProducts.filter(i => i !== index));
                } else {
                  setSelectedProducts([...selectedProducts, index]);
                  // Tự động mở popup khi chọn sản phẩm
                  setIsBalanceBarOpen(true);
                }
              }}
            >
              Sản phẩm {index + 1}
            </button>
          ))}
        </div>

      </div>
      
      {/* Floating Balance Bar */}
      <div className={`balance-popup-bar ${isBalanceBarOpen ? 'balance-popup-bar-open' : 'balance-popup-bar-closed'}`}>
        <button 
          className="balance-toggle-btn"
          onClick={() => setIsBalanceBarOpen(!isBalanceBarOpen)}
          aria-label={isBalanceBarOpen ? 'Ẩn thanh' : 'Hiện thanh'}
        >
          <FontAwesomeIcon icon={isBalanceBarOpen ? faChevronDown : faChevronUp} />
        </button>
        {isBalanceBarOpen && (
          <div className="balance-popup-content">
            {/* Product Details - Hiển thị tất cả sản phẩm đã chọn */}
            {selectedProducts.length > 0 ? (
              <div className="products-details-list">
                {selectedProducts.map((productIndex) => (
                  <div key={productIndex} className="product-details-in-popup">
                    <div className="product-header">
                      <div className="product-amount-label">Sản phẩm {productIndex + 1} - Số tiền mỗi đơn:</div>
                      <button
                        className="product-remove-btn"
                        onClick={() => {
                          setSelectedProducts(selectedProducts.filter(i => i !== productIndex));
                        }}
                        aria-label="Bỏ chọn sản phẩm"
                      >
                        ×
                      </button>
                    </div>
                    <input
                      type="number"
                      className="product-amount-input"
                      placeholder="Vui lòng nhập Số tiền"
                      value={amounts[productIndex]}
                      onChange={(e) => handleAmountChange(productIndex, e.target.value)}
                      min="0"
                      onKeyDown={(e) => {
                        // Ngăn chặn nhập dấu trừ, dấu cộng, và chữ e/E (scientific notation)
                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                    />
                    <div className="product-select-container">
                      <span className="product-select-label">Chọn</span>
                      <span className="product-select-number">{productIndex + 1}</span>
                      <FontAwesomeIcon icon={faShoppingCart} className="product-cart-icon" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-product-selected">
                Vui lòng chọn ít nhất một sản phẩm
              </div>
            )}
            
            {/* Balance Info */}
            <div className="balance-section">
              <div className="balance-info">
                <span className="balance-label">Tổng tiền</span>
                <span className="balance-value total-amount">{calculateTotal().toLocaleString('vi-VN')}</span>
              </div>
              <div className="balance-info">
                <span className="balance-label">Số dư</span>
                <span className="balance-value balance-amount">
                  {balanceLoading ? '...' : balance.toLocaleString('vi-VN')}
                </span>
              </div>
              <button 
                className="export-order-btn" 
                onClick={handleExportOrder}
                disabled={selectedProducts.length === 0 || isOnCooldown}
                title={isOnCooldown ? `Vui lòng đợi ${formatCooldownTime(cooldownTimer)} trước khi thực hiện đơn hàng tiếp theo` : ''}
              >
                {isOnCooldown ? `Đợi ${formatCooldownTime(cooldownTimer)}` : 'Xuất đơn'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <FooterContent />
    </div>
  );
};

export default BrandExport;

