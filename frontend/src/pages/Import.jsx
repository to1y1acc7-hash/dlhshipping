import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import '../components/HeroBanner.css';
import './Import.css';

const API_BASE_URL = '/api';

// Import brand logo images
const e1Image = '/images/banner/e1.svg';
const e2Image = '/images/banner/e2.svg';
const e3Image = '/images/banner/e3.svg';
const e4Image = '/images/banner/e4.svg';
const e5Image = '/images/banner/e5.svg';
const e6Image = '/images/banner/e6.svg';

const brandLogos = [e1Image, e2Image, e3Image, e4Image, e5Image, e6Image];

// Helper function để xử lý URL ảnh
const getImageUrl = (imagePath, product) => {
  if (!imagePath) return '';
  
  // Nếu là URL đầy đủ (http/https), thêm cache busting
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('//')) {
    const separator = imagePath.includes('?') ? '&' : '?';
    const cacheBuster = product?.updated_at ? new Date(product.updated_at).getTime() : Date.now();
    return `${imagePath}${separator}v=${cacheBuster}`;
  }
  
  // Nếu là đường dẫn local (bắt đầu với /uploads)
  if (imagePath.startsWith('/uploads')) {
    // Trong Docker, nginx sẽ proxy /uploads đến backend
    // Thêm cache busting để đảm bảo ảnh mới được load
    const separator = imagePath.includes('?') ? '&' : '?';
    const cacheBuster = product?.updated_at ? new Date(product.updated_at).getTime() : Date.now();
    return `${imagePath}${separator}v=${cacheBuster}`;
  }
  
  // Trường hợp khác, trả về nguyên bản
  return imagePath;
};

const Import = () => {
  const navigate = useNavigate();
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const carouselSlides = [
    '/images/dhl/carousel-1.png',
    '/images/dhl/carousel-2.png',
    '/images/dhl/carousel-3.png'
  ];

  useEffect(() => {
    loadImports();
    // Auto-refresh mỗi 10 giây để cập nhật sản phẩm mới
    const interval = setInterval(() => {
      loadImports();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Tự động chuyển slide mỗi 5 giây
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    
    return () => clearInterval(slideInterval);
  }, [carouselSlides.length]);

  const loadImports = async () => {
    try {
      setLoading(true);
      // Lấy tất cả sản phẩm active từ bảng products
      const response = await axios.get(`${API_BASE_URL}/products/active`);
      console.log('Products response:', response.data);
      if (response.data && Array.isArray(response.data)) {
        // Chuyển đổi products thành format để hiển thị
        const productsList = response.data.map(product => ({
          id: product.id,
          name: product.name,
          code: product.product_code || '',
          description: product.description || '',
          image: product.image || '',
          price: product.price || 0,
          category: product.category || '',
          stock: product.stock || 0,
          status: product.status || 'active',
          supplier: product.supplier || '',
          created_at: product.created_at,
          updated_at: product.updated_at // Thêm updated_at để cache busting
        }));
        // Sắp xếp theo thời gian tạo mới nhất
        productsList.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB - dateA;
        });
        console.log('Products loaded:', productsList.length);
        setImports(productsList);
      } else {
        setImports([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách sản phẩm:', error);
      console.error('Error details:', error.response?.data || error.message);
      setImports([]);
    } finally {
      setLoading(false);
    }
  };


  const formatPrice = (price) => {
    return parseFloat(price || 0).toLocaleString('vi-VN');
  };


  return (
    <div className="import-page">
      <div className="hero-banner">
        <div className="hero-slider">
          {carouselSlides.map((slide, index) => (
            <div
              key={index}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{
                backgroundImage: `url("${slide}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat'
              }}
            />
          ))}
        </div>
      </div>

      {/* Smooth Scrolling Brand Logos Carousel */}
      <div className="brands-logo-carousel">
        <div className="brands-logo-track">
          {[...brandLogos, ...brandLogos, ...brandLogos].map((logo, index) => (
            <div key={index} className="brand-logo-item">
              <img src={logo} alt={`Brand ${(index % brandLogos.length) + 1}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="import-products-section">
        {loading ? (
          <div className="products-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải sản phẩm...</p>
          </div>
          ) : imports.length === 0 ? (
            <div className="products-empty">
              <p>Chưa có sản phẩm nào được nhập vào kho</p>
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Vui lòng đợi vài giây để hệ thống tự động tạo sản phẩm mẫu, hoặc refresh trang.
              </p>
            </div>
          ) : (
            <div className="products-grid">
              {imports.map((product) => (
              <div 
                key={product.id} 
                className="product-card"
                onClick={() => navigate(`/product/${product.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="product-image-wrapper">
                  {product.image ? (
                    <img 
                      src={getImageUrl(product.image, product)}
                      alt={product.name}
                      className="product-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="product-image-placeholder">
                      <span>Không có hình ảnh</span>
                      <span style={{ fontSize: '12px', marginTop: '5px', display: 'block' }}>Click để xem chi tiết</span>
                    </div>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-name" title={product.name}>
                    {product.name || 'Sản phẩm không tên'}
                  </h3>
                  <div className="product-price">
                    {formatPrice(product.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FooterContent />
    </div>
  );
};

export default Import;
