import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTachometerAlt, faBars } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import logoImage from '../assets/logo.png';
import './Header.css';

const API_BASE_URL = '/api';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileServicesDropdown, setShowMobileServicesDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Kiểm tra trạng thái đăng nhập khi component mount và khi location thay đổi
  useEffect(() => {
    const checkLoginStatus = () => {
      const staffLoggedIn = localStorage.getItem('isStaffLoggedIn') === 'true';
      setIsStaffLoggedIn(staffLoggedIn);
    };

    // Kiểm tra ngay khi component mount
    checkLoginStatus();

    // Lắng nghe sự kiện storage để cập nhật khi localStorage thay đổi (từ tab khác)
    const handleStorageChange = (e) => {
      if (e.key === 'isStaffLoggedIn' || e.key === null) {
        checkLoginStatus();
      }
    };

    // Lắng nghe custom event để cập nhật khi đăng xuất trong cùng tab
    const handleLogoutEvent = () => {
      checkLoginStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('staffLogout', handleLogoutEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('staffLogout', handleLogoutEvent);
    };
  }, [location.pathname]); // Chạy lại khi pathname thay đổi

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Search products when user types
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Debounce search
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSearching(true);
          const response = await axios.get(`${API_BASE_URL}/products/search`, {
            params: { q: searchQuery.trim() }
          });
          setSearchResults(response.data || []);
          setShowSearchResults(true);
        } catch (error) {
          console.error('Lỗi khi tìm kiếm sản phẩm:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
        // Đóng mobile search nếu click bên ngoài và không có kết quả
        if (showMobileSearch && searchResults.length === 0) {
          setShowMobileSearch(false);
        }
      }
      // Đóng mobile menu nếu click bên ngoài
      if (showMobileMenu && !event.target.closest('.mobile-menu') && !event.target.closest('.hamburger-btn')) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileSearch, searchResults.length, showMobileMenu]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
      setShowMobileSearch(false);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
    setShowSearchResults(false);
    setSearchQuery('');
    setShowMobileSearch(false);
  };

  const handleMobileSearchToggle = (e) => {
    e.preventDefault();
    setShowMobileSearch(!showMobileSearch);
    if (!showMobileSearch) {
      // Focus vào input khi mở
      setTimeout(() => {
        const input = document.querySelector('.search-input');
        if (input) input.focus();
      }, 100);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/50x50?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads')) return imagePath;
    return imagePath;
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo-link">
            <img src={logoImage} alt="DHL Logo" className="logo-image" />
          </Link>
          <div className="mobile-home">
            <Link 
              to="/" 
              className={`mobile-home-link ${isActive('/') ? 'menu-action' : ''}`}
            >
              TRANG CHỦ
            </Link>
          </div>

          <nav className="nav-menu">
            <Link to="/" className={`nav-link ${isActive('/') ? 'menu-action' : 'menu-hover'}`}>
              TRANG CHỦ
            </Link>
            <Link to="/gioi-thieu" className={`nav-link ${isActive('/gioi-thieu') ? 'menu-action' : 'menu-hover'}`}>
              GIỚI THIỆU
            </Link>
            <div 
              className="nav-item-dropdown"
              onMouseEnter={() => setShowServicesDropdown(true)}
              onMouseLeave={() => setShowServicesDropdown(false)}
            >
              <Link to="/dich-vu" className={`nav-link ${isActive('/dich-vu') ? 'menu-action' : 'menu-hover'}`}>
                DỊCH VỤ
              </Link>
              {showServicesDropdown && (
                <div className="dropdown-menu">
                  <Link to="/dich-vu/van-chuyen-hang-uc-vietnam" className="dropdown-item">
                    Dịch vụ vận chuyển hàng từ úc về Việt Nam
                  </Link>
                  <Link to="/dich-vu/drop-ship-hang-uc-vietnam" className="dropdown-item">
                    Dịch vụ Drop Ship hàng từ Úc về Việt Nam
                  </Link>
                  <Link to="/dich-vu/order-hang-uc-chinh-hang" className="dropdown-item">
                    Dịch vụ Order hàng úc chính hãng giá tốt
                  </Link>
                </div>
              )}
            </div>
            <Link to="/tin-tuc" className={`nav-link ${isActive('/tin-tuc') ? 'menu-action' : 'menu-hover'}`}>
              TIN TỨC
            </Link>
            <Link to="/hang-order" className={`nav-link ${isActive('/hang-order') ? 'menu-action' : 'menu-hover'}`}>
              HÀNG ORDER
            </Link>
            <Link to="/tracking" className={`nav-link ${isActive('/tracking') ? 'menu-action' : 'menu-hover'}`}>
              TRACKING
            </Link>
            {isStaffLoggedIn && (
              <Link to="/staff/dashboard" className={`nav-link ${isActive('/staff/dashboard') ? 'menu-action' : 'menu-hover'}`}>
                <FontAwesomeIcon icon={faTachometerAlt} style={{ marginRight: '5px' }} />
                DASHBOARD
              </Link>
            )}
          </nav>
        </div>

        <div className="header-right">
          <div className={`search-wrapper ${showMobileSearch ? 'mobile-search-active' : ''}`} ref={searchRef}>
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowSearchResults(true);
                }
              }}
              aria-label="Tìm kiếm sản phẩm"
            />
            <button 
              type={showMobileSearch ? "submit" : "button"} 
              className="search-button" 
              aria-label="Tìm kiếm"
              onClick={!showMobileSearch ? handleMobileSearchToggle : undefined}
            >
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
            </button>
          </form>
          
          {showSearchResults && (
            <div className="search-results-dropdown">
              {isSearching ? (
                <div className="search-loading">Đang tìm kiếm...</div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="search-results-header">
                    Tìm thấy {searchResults.length} kết quả
                  </div>
                  <div className="search-results-list">
                    {searchResults.slice(0, 5).map((product) => (
                      <div
                        key={product.id}
                        className="search-result-item"
                        onClick={() => handleProductClick(product.id)}
                      >
                        <img
                          src={getImageUrl(product.image)}
                          alt={product.name}
                          className="search-result-image"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/50x50?text=No+Image';
                          }}
                        />
                        <div className="search-result-info">
                          <div className="search-result-name">{product.name}</div>
                          {product.product_code && (
                            <div className="search-result-code">Mã: {product.product_code}</div>
                          )}
                          {product.price && (
                            <div className="search-result-price">
                              {parseFloat(product.price).toLocaleString('vi-VN')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {searchResults.length > 5 && (
                    <div className="search-results-footer" onClick={handleSearch}>
                      Xem tất cả {searchResults.length} kết quả
                    </div>
                  )}
                </>
              ) : searchQuery.trim().length >= 2 ? (
                <div className="search-no-results">Không tìm thấy sản phẩm nào</div>
              ) : null}
            </div>
          )}
          </div>

          <button 
            className="hamburger-btn" 
            aria-label="Menu"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <FontAwesomeIcon icon={faBars} className="hamburger-icon" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="mobile-menu">
          <nav className="mobile-menu-nav">
            <Link 
              to="/" 
              className={`mobile-menu-item ${isActive('/') ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              TRANG CHỦ
            </Link>
            <Link 
              to="/gioi-thieu" 
              className={`mobile-menu-item ${isActive('/gioi-thieu') ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              GIỚI THIỆU
            </Link>
            <div className="mobile-menu-item-dropdown">
              <div 
                className={`mobile-menu-item ${isActive('/dich-vu') ? 'active' : ''}`}
                onClick={() => setShowMobileServicesDropdown(!showMobileServicesDropdown)}
              >
                DỊCH VỤ
                <span className="mobile-menu-arrow">{showMobileServicesDropdown ? '▲' : '▼'}</span>
              </div>
              {showMobileServicesDropdown && (
                <div className="mobile-menu-dropdown">
                  <Link 
                    to="/dich-vu/van-chuyen-hang-uc-vietnam" 
                    className="mobile-menu-dropdown-item"
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowMobileServicesDropdown(false);
                    }}
                  >
                    Dịch vụ vận chuyển hàng từ úc về Việt Nam
                  </Link>
                  <Link 
                    to="/dich-vu/drop-ship-hang-uc-vietnam" 
                    className="mobile-menu-dropdown-item"
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowMobileServicesDropdown(false);
                    }}
                  >
                    Dịch vụ Drop Ship hàng từ Úc về Việt Nam
                  </Link>
                  <Link 
                    to="/dich-vu/order-hang-uc-chinh-hang" 
                    className="mobile-menu-dropdown-item"
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowMobileServicesDropdown(false);
                    }}
                  >
                    Dịch vụ Order hàng úc chính hãng giá tốt
                  </Link>
                </div>
              )}
            </div>
            <Link 
              to="/tin-tuc" 
              className={`mobile-menu-item ${isActive('/tin-tuc') ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              TIN TỨC
            </Link>
            <Link 
              to="/hang-order" 
              className={`mobile-menu-item ${isActive('/hang-order') ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              HÀNG ORDER
            </Link>
            <Link 
              to="/tracking" 
              className={`mobile-menu-item ${isActive('/tracking') ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              TRACKING
            </Link>
            {isStaffLoggedIn && (
              <Link 
                to="/staff/dashboard" 
                className={`mobile-menu-item ${isActive('/staff/dashboard') ? 'active' : ''}`}
                onClick={() => setShowMobileMenu(false)}
              >
                <FontAwesomeIcon icon={faTachometerAlt} style={{ marginRight: '5px' }} />
                DASHBOARD
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

