import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import './ExportHistory.css';

const API_BASE_URL = '/api';

const ExportHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExportHistory();
  }, [location.pathname]);

  const loadExportHistory = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        navigate('/dang-nhap');
        return;
      }

      // Lấy lịch sử xuất đơn theo lựa chọn sản phẩm (poll history)
      const response = await axios.get(`${API_BASE_URL}/poll-history/${userId}`);
      
      if (response.data && Array.isArray(response.data)) {
        setHistory(response.data);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử xuất đơn:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatSelection = (rates) => {
    if (!rates || !Array.isArray(rates) || rates.length === 0) return '—';
    const rateToNumber = { A: 1, B: 2, C: 3, D: 4 };
    return rates.map(r => `Sản phẩm ${rateToNumber[r] || r}`).join(', ');
  };

  return (
    <div className="export-history-page">
      <div className="export-history-container">
        <div className="export-history-header">
          <button className="back-btn" onClick={() => navigate('/xuat-hang')}>
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Quay lại</span>
          </button>
          <h1 className="export-history-title">Lịch sử xuất đơn</h1>
        </div>

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <p>Bạn chưa có lịch sử xuất đơn nào.</p>
            <button className="btn-primary" onClick={() => navigate('/xuat-hang')}>
              Tạo yêu cầu xuất đơn
            </button>
          </div>
        ) : (
          <div className="export-history-list">
            {history.map((item) => (
              <div key={item.id} className="export-history-item">
                <div className="export-item-header">
                  <div className="export-item-id">
                    #{item.period_number || item.id || '—'}
                  </div>
                  {item.item_key && (
                    <span className="status-badge status-processing">
                      Item key: {item.item_key}
                    </span>
                  )}
                </div>
                <div className="export-item-body">
                  <div className="export-item-row">
                    <span className="label">Mục:</span>
                    <span className="value">{item.item_title || '—'}</span>
                  </div>
                  <div className="export-item-row">
                    <span className="label">Kỳ số:</span>
                    <span className="value">{item.period_number || '—'}</span>
                  </div>
                  <div className="export-item-row">
                    <span className="label">Chọn:</span>
                    <span className="value">{formatSelection(item.selected_rates)}</span>
                  </div>
                  <div className="export-item-row">
                    <span className="label">Số tiền:</span>
                    <span className="value total">
                      {parseFloat(item.amount || 0).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="export-item-row">
                    <span className="label">Ngày tạo:</span>
                    <span className="value">{formatDate(item.created_at)}</span>
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

export default ExportHistory;

