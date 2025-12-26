import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faStar } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import './ProductDetail.css';

const API_BASE_URL = '/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  
  // Common tags based on rating
  const getRatingTags = (ratingValue) => {
    const tagsMap = {
      5: ['Chất lượng SP tuyệt vời!', 'Đóng gói đẹp và rất chắc chắn!', 'Shop phục vụ rất tốt và có tâm!', 'SP chất lượng, rất đáng tiền!', 'Thời gian giao hàng nhanh!'],
      4: ['Chất lượng tốt', 'Đóng gói cẩn thận', 'Shop phục vụ tốt', 'SP đáng tiền', 'Giao hàng đúng hẹn'],
      3: ['Chất lượng bình thường', 'Đóng gói ổn', 'SP tạm được', 'Giá hợp lý'],
      2: ['Chất lượng chưa tốt', 'Đóng gói sơ sài', 'SP không như mong đợi'],
      1: ['Chất lượng kém', 'Đóng gói không cẩn thận', 'SP không đúng mô tả']
    };
    return tagsMap[ratingValue] || [];
  };
  
  const handleTagClick = (tag) => {
    if (comment.trim() === '') {
      setComment(tag);
    } else {
      setComment(prev => prev + ' ' + tag);
    }
  };
  
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  useEffect(() => {
    loadProduct();
    loadReviews();
    loadRatingStats();
  }, [id]);

  // Reload product when page becomes visible (after returning from edit page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProduct();
      }
    };

    const handleFocus = () => {
      loadProduct();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/products/active`);
      if (response.data && Array.isArray(response.data)) {
        const foundProduct = response.data.find(p => p.id === parseInt(id));
        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          // Try getting from all products
          const allProductsResponse = await axios.get(`${API_BASE_URL}/admin/products`);
          if (allProductsResponse.data && Array.isArray(allProductsResponse.data)) {
            const foundProduct2 = allProductsResponse.data.find(p => p.id === parseInt(id));
            if (foundProduct2) {
              setProduct(foundProduct2);
            }
          }
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/products/${id}/reviews`);
      if (response.data && Array.isArray(response.data)) {
        setReviews(response.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải đánh giá:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadRatingStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${id}/rating-stats`);
      if (response.data) {
        setRatingStats(response.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải thống kê đánh giá:', error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      alert('Vui lòng đăng nhập để đánh giá sản phẩm');
      navigate('/dang-nhap');
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      alert('Vui lòng chọn số sao đánh giá');
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/products/${id}/reviews`, {
        userId: parseInt(userId),
        username: username || 'User',
        rating: parseInt(rating),
        comment: comment.trim()
      });

      if (response.data.success) {
        // Show success notification
        setShowSuccessNotification(true);
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 3000);
        
        // Reset form
        setRating(5);
        setComment('');
        // Reload reviews and stats
        loadReviews();
        loadRatingStats();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/400x400?text=No+Image';
    // Use product updated_at or current timestamp for cache busting
    const cacheBuster = product?.updated_at ? new Date(product.updated_at).getTime() : Date.now();
    
    if (imagePath.startsWith('http')) {
      // Add cache busting for external URLs
      const separator = imagePath.includes('?') ? '&' : '?';
      return `${imagePath}${separator}v=${cacheBuster}`;
    }
    if (imagePath.startsWith('/uploads')) {
      // Add cache busting for uploaded images
      const separator = imagePath.includes('?') ? '&' : '?';
      return `http://localhost:5000${imagePath}${separator}v=${cacheBuster}`;
    }
    return imagePath;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (ratingValue, interactive = false, onStarClick = null, onStarHover = null) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${interactive ? 'interactive' : ''} ${
              star <= (hoveredRating || ratingValue) ? 'filled' : 'empty'
            }`}
            onClick={interactive && onStarClick ? () => onStarClick(star) : undefined}
            onMouseEnter={interactive && onStarHover ? () => onStarHover(star) : undefined}
            onMouseLeave={interactive && onStarHover ? () => onStarHover(0) : undefined}
          >
            <FontAwesomeIcon icon={faStar} />
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <div className="loading">Đang tải...</div>
        </div>
        <FooterContent />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <div className="error-message">
            <h2>Sản phẩm không tồn tại</h2>
            <button onClick={() => navigate(-1)} className="back-button">
              <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
            </button>
          </div>
        </div>
        <FooterContent />
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="success-notification">
          <div className="success-notification-content">
            <span className="success-icon">✓</span>
            <span className="success-message">Gửi đánh giá thành công!</span>
          </div>
        </div>
      )}
      
      <div className="product-detail-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
        </button>

        <div className="product-detail-content">
          {/* Product Info Section */}
          <div className="product-info-section">
            <div className="product-image">
              <img 
                src={getImageUrl(product.image)} 
                alt={product.name}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                }}
              />
            </div>
            
            <div className="product-details">
              <h1 className="product-title">{product.name}</h1>
              
              {ratingStats && (
                <div className="product-rating-summary">
                  <div className="rating-display">
                    <span className="average-rating">{ratingStats.average_rating}</span>
                    {renderStars(Math.round(parseFloat(ratingStats.average_rating)))}
                    <span className="total-reviews">({ratingStats.total_reviews} đánh giá)</span>
                  </div>
                  
                  {ratingStats.total_reviews > 0 && (
                    <div className="rating-breakdown">
                      <div className="rating-bar">
                        <span>5 sao</span>
                        <div className="bar-container">
                          <div 
                            className="bar-fill" 
                            style={{ width: `${(ratingStats.rating_5 / ratingStats.total_reviews) * 100}%` }}
                          ></div>
                        </div>
                        <span>{ratingStats.rating_5}</span>
                      </div>
                      <div className="rating-bar">
                        <span>4 sao</span>
                        <div className="bar-container">
                          <div 
                            className="bar-fill" 
                            style={{ width: `${(ratingStats.rating_4 / ratingStats.total_reviews) * 100}%` }}
                          ></div>
                        </div>
                        <span>{ratingStats.rating_4}</span>
                      </div>
                      <div className="rating-bar">
                        <span>3 sao</span>
                        <div className="bar-container">
                          <div 
                            className="bar-fill" 
                            style={{ width: `${(ratingStats.rating_3 / ratingStats.total_reviews) * 100}%` }}
                          ></div>
                        </div>
                        <span>{ratingStats.rating_3}</span>
                      </div>
                      <div className="rating-bar">
                        <span>2 sao</span>
                        <div className="bar-container">
                          <div 
                            className="bar-fill" 
                            style={{ width: `${(ratingStats.rating_2 / ratingStats.total_reviews) * 100}%` }}
                          ></div>
                        </div>
                        <span>{ratingStats.rating_2}</span>
                      </div>
                      <div className="rating-bar">
                        <span>1 sao</span>
                        <div className="bar-container">
                          <div 
                            className="bar-fill" 
                            style={{ width: `${(ratingStats.rating_1 / ratingStats.total_reviews) * 100}%` }}
                          ></div>
                        </div>
                        <span>{ratingStats.rating_1}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="product-info">
                <div className="info-row">
                  <span className="info-label">Mã sản phẩm:</span>
                  <span className="info-value">
                    {/* Hỗ trợ cả snake_case và camelCase để đồng bộ với dữ liệu mới nhập */}
                    {product.product_code || product.productCode || 'N/A'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Giá:</span>
                  <span className="info-value price">
                    {parseFloat(product.price || product.unitPrice || 0).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Số lượng:</span>
                  <span className="info-value">
                    {product.stock ?? product.quantity ?? 0}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Danh mục:</span>
                  <span className="info-value">{product.category || product.categoryName || 'N/A'}</span>
                </div>
                {(product.supplier || product.supplierName) && (
                  <div className="info-row">
                    <span className="info-label">Nhà cung cấp:</span>
                    <span className="info-value">{product.supplier || product.supplierName}</span>
                  </div>
                )}
              </div>

              {product.description && (
                <div className="product-description">
                  <h3>Mô tả sản phẩm</h3>
                  <p>{product.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="reviews-section">
            <h2 className="reviews-title">Đánh giá sản phẩm</h2>

            {/* Reviews List - Hiển thị cho mọi người */}
            <div className="reviews-list">
              <h3>{reviews.length} đánh giá</h3>
              
              {reviewsLoading ? (
                <div className="loading">Đang tải đánh giá...</div>
              ) : reviews.length === 0 ? (
                <div className="no-reviews">
                  <p>Chưa có đánh giá nào cho sản phẩm này.</p>
                  <p>Hãy là người đầu tiên đánh giá!</p>
                </div>
              ) : (
                <div className="reviews-container">
                  {reviews.map((review) => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <div className="reviewer-info">
                          <span className="reviewer-name">{review.username || 'Anonymous'}</span>
                          <span className="review-date">{formatDate(review.created_at)}</span>
                        </div>
                        <div className="review-rating">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      {review.comment && (
                        <div className="review-comment">
                          <p>{review.comment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review Form - Chỉ hiển thị cho người đã đăng nhập */}
            {isLoggedIn && (
              <div className="review-form-container">
                <h3>Viết đánh giá của bạn</h3>
                <form onSubmit={handleSubmitReview} className="review-form">
                  <div className="form-group">
                    <label>Đánh giá của bạn:</label>
                    <div className="rating-input">
                      {renderStars(
                        rating,
                        true,
                        setRating,
                        setHoveredRating
                      )}
                      <span className="rating-text">
                        {rating === 1 ? 'Rất tệ' :
                         rating === 2 ? 'Tệ' :
                         rating === 3 ? 'Bình thường' :
                         rating === 4 ? 'Tốt' :
                         rating === 5 ? 'Rất tốt' : ''}
                      </span>
                    </div>
                    {getRatingTags(rating).length > 0 && (
                      <div className="rating-tags">
                        <span className="tags-label">Gợi ý:</span>
                        <div className="tags-container">
                          {getRatingTags(rating).map((tag, index) => (
                            <button
                              key={index}
                              type="button"
                              className="tag-button"
                              onClick={() => handleTagClick(tag)}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="comment">Nhận xét (tùy chọn):</label>
                    <textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                      rows="4"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="submit-review-btn"
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </form>
              </div>
            )}

            {!isLoggedIn && (
              <div className="login-prompt">
                <p>Vui lòng <button onClick={() => navigate('/dang-nhap')}>đăng nhập</button> để đánh giá sản phẩm</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <FooterContent />
    </div>
  );
};

export default ProductDetail;

