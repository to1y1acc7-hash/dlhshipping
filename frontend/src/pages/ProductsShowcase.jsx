import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faShoppingCart, faEye } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import './ProductsShowcase.css';

const API_BASE_URL = '/api';

const ProductsShowcase = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Get search query from URL
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearchTerm(searchQuery);
      loadSearchResults(searchQuery);
    } else {
      loadProducts();
    }
  }, [searchParams]);

  // Reload products when page becomes visible (after returning from edit page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const searchQuery = searchParams.get('search');
        if (searchQuery) {
          loadSearchResults(searchQuery);
        } else {
          loadProducts();
        }
      }
    };

    const handleFocus = () => {
      const searchQuery = searchParams.get('search');
      if (searchQuery) {
        loadSearchResults(searchQuery);
      } else {
        loadProducts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/products/active`);
      if (response.data && Array.isArray(response.data)) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSearchResults = async (query) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/products/search`, {
        params: { q: query }
      });
      if (response.data && Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm sản phẩm:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/400x400?text=No+Image';
    if (imagePath.startsWith('http')) {
      // Add cache busting for external URLs
      const separator = imagePath.includes('?') ? '&' : '?';
      return `${imagePath}${separator}t=${Date.now()}`;
    }
    if (imagePath.startsWith('/uploads')) {
      // Add cache busting for uploaded images
      const separator = imagePath.includes('?') ? '&' : '?';
      return `http://localhost:5000${imagePath}${separator}t=${Date.now()}`;
    }
    return imagePath;
  };

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchLower) ||
      (product.description && product.description.toLowerCase().includes(searchLower)) ||
      (product.product_code && product.product_code.toLowerCase().includes(searchLower)) ||
      (product.productCode && product.productCode.toLowerCase().includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  const formatPrice = (price) => {
    return parseFloat(price || 0).toLocaleString('vi-VN');
  };

  return (
    <div className="products-showcase-page">
      <div className="showcase-header">
        <div className="showcase-header-content">
          <h1 className="showcase-title">Sản Phẩm Nổi Bật</h1>
          <p className="showcase-subtitle">Khám phá bộ sưu tập sản phẩm chất lượng cao</p>
        </div>
      </div>

      <div className="showcase-container">
        {/* Filters */}
        <div className="showcase-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'Tất cả' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải sản phẩm...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h2>Không tìm thấy sản phẩm</h2>
            <p>Hãy thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác</p>
          </div>
        ) : (
          <>
            <div className="products-count">
              Tìm thấy {filteredProducts.length} sản phẩm
            </div>
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="product-card-showcase"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="product-image-container">
                    {product.image ? (
                      <img 
                        src={getImageUrl(product.image, product)} 
                        alt={product.name}
                        className="product-image-showcase"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="product-image-placeholder-showcase">
                        <span>Không có hình ảnh</span>
                        <span className="click-hint">Click để xem chi tiết</span>
                      </div>
                    )}
                    <div className="product-overlay">
                      <button 
                        className="view-detail-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.id}`);
                        }}
                      >
                        <FontAwesomeIcon icon={faEye} /> Xem chi tiết
                      </button>
                    </div>
                    {product.stock > 0 && (
                      <div className="stock-badge">
                        Còn {product.stock} sản phẩm
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="stock-badge out-of-stock">
                        Hết hàng
                      </div>
                    )}
                  </div>
                  
                  <div className="product-info-showcase">
                    <div className="product-category-tag">
                      {product.category || 'Không phân loại'}
                    </div>
                    <h3 className="product-name-showcase" title={product.name}>
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="product-description-preview">
                        {product.description.length > 80 
                          ? product.description.substring(0, 80) + '...' 
                          : product.description}
                      </p>
                    )}
                    <div className="product-footer-showcase">
                      <div className="product-price-showcase">
                        {formatPrice(product.price)}
                      </div>
                      {product.product_code && (
                        <div className="product-code">
                          Mã: {product.product_code}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <FooterContent />
    </div>
  );
};

export default ProductsShowcase;



