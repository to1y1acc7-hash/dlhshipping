import React, { useState } from 'react';
import FooterContent from '../components/FooterContent';
import './TrackingPublic.css';

const TrackingPublic = () => {
  const [formData, setFormData] = useState({
    customerCode: '',
    trackingNumber: '',
    notes: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Submit tracking data to backend
    alert('Thông tin tracking đã được gửi! Chúng tôi sẽ xử lý và liên hệ với bạn sớm nhất.');
    setFormData({
      customerCode: '',
      trackingNumber: '',
      notes: ''
    });
  };

  return (
    <div className="tracking-public-page">
      <div className="tracking-container">
        <div className="tracking-content">
          {/* Left Column - Form */}
          <div className="tracking-form-section">
            <h1 className="tracking-title">TRACKING</h1>
            <h2 className="tracking-subtitle">THÔNG BÁO TRACKING</h2>
            
            <form className="tracking-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="customerCode">Mã khách hàng (bắt buộc)</label>
                <input
                  type="text"
                  id="customerCode"
                  name="customerCode"
                  value={formData.customerCode}
                  onChange={handleChange}
                  required
                  placeholder="Nhập mã khách hàng"
                />
              </div>

              <div className="form-group">
                <label htmlFor="trackingNumber">Tracking kiện hàng tại Úc (bắt buộc)</label>
                <input
                  type="text"
                  id="trackingNumber"
                  name="trackingNumber"
                  value={formData.trackingNumber}
                  onChange={handleChange}
                  required
                  placeholder="Nhập mã tracking"
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Ghi chú</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Nhập ghi chú..."
                />
              </div>

              <button type="submit" className="submit-button">
                Gửi đi
              </button>
            </form>
          </div>

          {/* Right Column - Information */}
          <div className="tracking-info-section">
            <div className="info-content">
              <p>
                Khi hàng về đến kho Úc, DHL Express sẽ thực hiện khai báo và vận chuyển hàng của bạn về Việt Nam trong chuyến bay gần nhất.
              </p>
              <p>
                Trong trường hợp cần trợ giúp đặc biệt, bạn có thể trực tiếp liên hệ với chúng tôi qua:
              </p>
              
              <div className="contact-info">
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

export default TrackingPublic;

