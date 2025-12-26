import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import './FooterContent.css';

const API_BASE_URL = '/api';

const FooterContent = () => {
  const [settings, setSettings] = useState({
    company_description: 'DHLSHIPPING cung cấp dịch vụ đặt hàng từ Úc, Mỹ, Hàn Quốc, Thái Lan và dịch vụ vận chuyển hàng hóa đến các quốc gia như Mỹ, Đức, Pháp, Hungary, Việt Nam... Chúng tôi giúp khách hàng trên toàn thế giới tiếp cận với những sản phẩm chất lượng cao và chinh phục thị trường toàn cầu.',
    address_australia: '1/283 Coward St, Mascot NSW 2020, Australia',
    address_korea: '충청북도 청주시 구 오창읍 각리 가곡로 459 청원',
    address_vietnam: '348 Nguyễn Văn Công, Phường 3, Gò Vấp, Hồ Chí Minh',
    fanpage_name: 'DHL Shipping',
    fanpage_followers: '3.676 người theo dõi',
    fanpage_link: '',
    telegram_link: ''
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/settings`);
        if (response.data) {
          setSettings(prev => ({
            ...prev,
            ...response.data
          }));
        }
      } catch (error) {
        console.error('Lỗi khi tải cài đặt:', error);
        // Sử dụng giá trị mặc định nếu không load được
      }
    };
    loadSettings();
  }, []);

  const handleFanpageClick = () => {
    if (settings.fanpage_link) {
      window.open(settings.fanpage_link, '_blank');
    }
  };

  const handleTelegramClick = () => {
    if (settings.telegram_link) {
      window.open(settings.telegram_link, '_blank');
    }
  };

  return (
    <div className="footer-content-wrapper">
      <div className="footer-content">
        <div className="footer-column">
          <h3 className="footer-column-title">VÀI DÒNG GIỚI THIỆU</h3>
          <div className="footer-title-line"></div>
          <p className="footer-text-content">
            {settings.company_description}
          </p>
        </div>

        <div className="footer-column">
          <h3 className="footer-column-title">THÔNG TIN LIÊN HỆ</h3>
          <div className="footer-title-line"></div>
          <div className="footer-contact-info">
            <div className="contact-item">
              <strong>DHL Australia:</strong>
              <p>{settings.address_australia}</p>
            </div>
            <div className="contact-item">
              <strong>DHL South Korea:</strong>
              <p>{settings.address_korea}</p>
            </div>
            <div className="contact-item">
              <strong>DHL Vietnam:</strong>
              <p>{settings.address_vietnam}</p>
            </div>
            {settings.telegram_link && (
              <div className="contact-item">
                <strong>Telegram:</strong>
                <p>
                  <a href={settings.telegram_link} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>
                    {settings.telegram_link}
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="footer-column">
          <h3 className="footer-column-title">FANPAGE</h3>
          <div className="footer-title-line"></div>
          <div className="footer-fanpage">
            <div className="fanpage-header">
              <div className="fanpage-logo">
                <div className="fanpage-logo-bg">
                  <span className="fanpage-logo-text">DHL</span>
                </div>
              </div>
              <div className="fanpage-info">
                <div className="fanpage-name">{settings.fanpage_name}</div>
                <div className="fanpage-followers">{settings.fanpage_followers}</div>
              </div>
            </div>
            <div className="fanpage-buttons">
              {settings.fanpage_link ? (
                <button className="fanpage-btn fanpage-follow" onClick={handleFanpageClick}>
                  <FontAwesomeIcon icon={faPlus} className="btn-icon" />
                  Theo dõi Trang
                </button>
              ) : (
                <button className="fanpage-btn fanpage-follow" disabled>
                  <FontAwesomeIcon icon={faPlus} className="btn-icon" />
                  Theo dõi Trang
                </button>
              )}
              {settings.telegram_link && (
                <button className="fanpage-btn fanpage-share" onClick={handleTelegramClick}>
                  <FontAwesomeIcon icon={faPlus} className="btn-icon" />
                  Telegram
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterContent;

