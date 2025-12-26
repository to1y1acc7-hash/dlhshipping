import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faHeadset } from '@fortawesome/free-solid-svg-icons';
import FooterContent from '../components/FooterContent';
import './CustomerSupport.css';

const CustomerSupport = () => {
  const navigate = useNavigate();
  
  // Link Telegram mặc định - admin có thể thay đổi sau
  const telegramLink = localStorage.getItem('telegramSupportLink') || 'https://t.me/CSKH24_7SHIPPING';

  const handleBack = () => {
    navigate(-1);
  };

  const handleConnect = () => {
    // Mở link Telegram trong tab mới
    window.open(telegramLink, '_blank');
  };

  return (
    <div className="customer-support-page">
      <div className="customer-support-container">
        <div className="customer-support-header">
          <button className="customer-support-back" onClick={handleBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className="customer-support-title">Chăm sóc khách hàng</h1>
        </div>

        <div className="customer-support-content">
          <div className="support-input-section">
            <input
              type="text"
              className="support-input"
              value="Chăm sóc khách hàng"
              readOnly
            />
          </div>

          <div className="support-main-section">
            <div className="support-icon-wrapper">
              <div className="support-icon">
                <FontAwesomeIcon icon={faHeadset} />
              </div>
            </div>
            <div className="support-info">
              <h2 className="support-title">Chăm sóc khách hàng</h2>
              <button className="connect-button" onClick={handleConnect}>
                Kết nối
              </button>
            </div>
          </div>

          <p className="support-hours">Hỗ trợ 24/7</p>
        </div>
      </div>
      <FooterContent />
    </div>
  );
};

export default CustomerSupport;

