import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import './OrderHistory.css';

const API_BASE_URL = '/api';

const OrderHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userId = localStorage.getItem('userId');
    
    if (!isLoggedIn || !userId) {
      navigate('/dang-nhap', { state: { from: location.pathname } });
      return;
    }
    
    loadHistory();
  }, [location.pathname, navigate]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      if (!isLoggedIn || !userId) {
        navigate('/dang-nhap', { state: { from: location.pathname } });
        return;
      }

      // Lịch sử “chọn sản phẩm” từ xuất hàng (poll history)
      const response = await axios.get(`${API_BASE_URL}/poll-history/${userId}`);
      
      if (response.data && Array.isArray(response.data)) {
        setHistory(response.data);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/dang-nhap', { state: { from: location.pathname } });
        return;
      }
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const formatSelection = (rates) => {
    if (!rates || !Array.isArray(rates) || rates.length === 0) return '—';
    return rates.join(', ');
  };

  return (
    <div className="order-history-page">
      <div className="order-history-container">
        <div className="order-history-header">
          <button className="order-history-back" onClick={handleBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className="order-history-title">Lịch sử chọn sản phẩm</h1>
        </div>

        <div className="order-history-content">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-illustration">
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="60" y="50" width="80" height="100" rx="4" fill="#E0E0E0" opacity="0.3"/>
                  <line x1="70" y1="70" x2="130" y2="70" stroke="#BDBDBD" strokeWidth="2"/>
                  <line x1="70" y1="85" x2="130" y2="85" stroke="#BDBDBD" strokeWidth="2"/>
                  <line x1="70" y1="100" x2="130" y2="100" stroke="#BDBDBD" strokeWidth="2"/>
                  <line x1="70" y1="130" x2="130" y2="130" stroke="#BDBDBD" strokeWidth="3"/>
                  <rect x="20" y="80" width="25" height="70" rx="2" fill="#E0E0E0" opacity="0.2"/>
                  <rect x="50" y="90" width="20" height="60" rx="2" fill="#E0E0E0" opacity="0.2"/>
                  <rect x="155" y="75" width="25" height="75" rx="2" fill="#E0E0E0" opacity="0.2"/>
                  <rect x="130" y="85" width="20" height="65" rx="2" fill="#E0E0E0" opacity="0.2"/>
                  <path d="M 40 120 L 45 100 L 50 120 Z" fill="#E0E0E0" opacity="0.2"/>
                  <path d="M 160 115 L 165 95 L 170 115 Z" fill="#E0E0E0" opacity="0.2"/>
                </svg>
              </div>
              <p className="empty-state-text">Bạn chưa có lịch sử chọn sản phẩm.</p>
              <p className="empty-state-hint">Hãy vào trang “Xuất hàng” để chọn sản phẩm.</p>
            </div>
          ) : (
            <div className="order-list">
              {history.map((item) => (
                <div key={item.id} className="order-item">
                  <div className="order-item-header">
                    <div className="order-company-name">
                      {item.item_title || '—'}
                    </div>
                    <div className="order-header-right">
                      <div className="order-id">#Kỳ {item.period_number || item.id}</div>
                      <div className="order-amount-badge">
                        {parseFloat(item.amount || 0).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="order-item-body">
                    <div className="order-info-row">
                      <span className="order-label">Lựa chọn:</span>
                      <span className="order-value order-selection">{formatSelection(item.selected_rates)}</span>
                    </div>
                    {item.item_key && (
                      <div className="order-info-row">
                        <span className="order-label">Item key:</span>
                        <span className="order-value">{item.item_key}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="order-item-footer">
                    <span className="order-timestamp">{formatDate(item.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <FooterContent />
    </div>
  );
};

export default OrderHistory;

