import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import './Order.css';

const API_BASE_URL = '/api';

const Order = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    productLink: '',
    quantity: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      // Get user ID from localStorage if logged in
      const userIdStr = localStorage.getItem('userId');
      const userId = userIdStr ? parseInt(userIdStr) : null;
      
      const orderData = {
        customer_name: formData.fullName,
        customer_phone: formData.phone,
        product_link: formData.productLink,
        quantity: parseInt(formData.quantity) || 0,
        notes: formData.notes,
        user_id: userId,
        status: 'pending'
      };

      console.log('Submitting order:', orderData);

      const response = await axios.post(`${API_BASE_URL}/orders`, orderData);
      
      console.log('Order creation response:', response.data);
      console.log('Response status:', response.status);
      
      // Kiểm tra cả success và status code
      if (response.data.success || response.status === 201) {
        alert('Đơn hàng của bạn đã được ghi nhận! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
        setFormData({
          fullName: '',
          phone: '',
          productLink: '',
          quantity: '',
          notes: ''
        });
        // Navigate to order history if logged in
        if (userId) {
          // Add a small delay to ensure order is saved before navigating
          setTimeout(() => {
            navigate('/account/order-history');
          }, 500);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      alert(error.response?.data?.error || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="order-page">
      <div className="order-container">
        <div className="order-content">
          {/* Left Column - Form */}
          <div className="order-form-section">
            <h1 className="order-title">HÀNG ORDER</h1>
            <h2 className="order-subtitle">VUI LÒNG ĐIỀN THÔNG TIN</h2>
            
            <form className="order-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fullName">Họ và tên*</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Số điện thoại*</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="form-group">
                <label htmlFor="productLink">Link sản phẩm cần mua*</label>
                <input
                  type="url"
                  id="productLink"
                  name="productLink"
                  value={formData.productLink}
                  onChange={handleChange}
                  required
                  placeholder="Nhập link sản phẩm"
                />
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Số lượng sản phẩm cần mua*</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="Nhập số lượng"
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Vui lòng ghi chú nội dung cần chú ý khi đặt hàng</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Nhập ghi chú..."
                />
              </div>

              <button type="submit" className="submit-button" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : 'Đăng ký ngay'}
              </button>
            </form>
          </div>

          {/* Right Column - Information */}
          <div className="order-info-section">
            <h2 className="info-title">YÊU CẦU BÁO GIÁ MUA HỘ</h2>
            <div className="info-content">
              <p>
                Bạn đang yêu cầu báo giá dịch vụ mua hộ hàng hóa từ các website Úc và vận chuyển về Việt Nam.
              </p>
              <p>
                Vui lòng điền đầy đủ thông tin vào form bên trái và mô tả chi tiết về hàng hóa, đặc biệt là 
                <strong> "Link sản phẩm cần mua"</strong> và <strong>"Ghi chú về số lượng sản phẩm cần mua"</strong> 
                để chúng tôi có thể báo giá chính xác nhất cho bạn.
              </p>
              <p>
                Sau khi nhận được thông tin, chúng tôi sẽ liên hệ với bạn ngay lập tức.
              </p>
              
              <div className="contact-info">
                <p className="contact-label">Hoặc bạn có thể trực tiếp liên hệ với chúng tôi qua:</p>
                <a 
                  href="https://facebook.com/dhlshipping/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="fanpage-link"
                >
                  Fanpage: https://facebook.com/dhlshipping/
                </a>
              </div>

              <p className="support-message">
                <strong>Chúng tôi luôn sẵn sàng hỗ trợ, tư vấn!</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
      <FooterContent />
    </div>
  );
};

export default Order;
