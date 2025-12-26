import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import './ImportHistory.css';

const API_BASE_URL = '/api';

const ImportHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImportHistory();
  }, [location.pathname]);

  const loadImportHistory = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        navigate('/dang-nhap');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/import/user/${userId}`);
      
      if (response.data && Array.isArray(response.data)) {
        setImports(response.data);
      } else {
        setImports([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử nhập hàng:', error);
      setImports([]);
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

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Chờ xử lý',
      'processing': 'Đang xử lý',
      'completed': 'Đã hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      'pending': 'status-pending',
      'processing': 'status-processing',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return classMap[status] || '';
  };

  return (
    <div className="import-history-page">
      <div className="import-history-container">
        <div className="import-history-header">
          <button className="back-btn" onClick={() => navigate('/nhap-hang')}>
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Quay lại</span>
          </button>
          <h1 className="import-history-title">Lịch sử nhập hàng</h1>
        </div>

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : imports.length === 0 ? (
          <div className="empty-state">
            <p>Bạn chưa có lịch sử nhập hàng nào.</p>
            <button className="btn-primary" onClick={() => navigate('/nhap-hang')}>
              Tạo yêu cầu nhập hàng
            </button>
          </div>
        ) : (
          <div className="import-history-list">
            {imports.map((item) => (
              <div key={item.id} className="import-history-item">
                <div className="import-item-header">
                  <div className="import-item-id">#NH{item.id}</div>
                  <span className={`status-badge ${getStatusClass(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </div>
                <div className="import-item-body">
                  <div className="import-item-row">
                    <span className="label">Tên sản phẩm:</span>
                    <span className="value">{item.product_name || '-'}</span>
                  </div>
                  {item.product_link && (
                    <div className="import-item-row">
                      <span className="label">Link sản phẩm:</span>
                      <a href={item.product_link} target="_blank" rel="noopener noreferrer" className="value link">
                        {item.product_link.length > 50 ? item.product_link.substring(0, 50) + '...' : item.product_link}
                      </a>
                    </div>
                  )}
                  <div className="import-item-row">
                    <span className="label">Số lượng:</span>
                    <span className="value">{item.quantity || 0}</span>
                  </div>
                  {item.unit_price > 0 && (
                    <div className="import-item-row">
                      <span className="label">Đơn giá:</span>
                      <span className="value">{parseFloat(item.unit_price).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                  {item.total_amount > 0 && (
                    <div className="import-item-row">
                      <span className="label">Tổng tiền:</span>
                      <span className="value total">{parseFloat(item.total_amount).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                  {item.supplier && (
                    <div className="import-item-row">
                      <span className="label">Nhà cung cấp:</span>
                      <span className="value">{item.supplier}</span>
                    </div>
                  )}
                  {item.notes && (
                    <div className="import-item-row">
                      <span className="label">Ghi chú:</span>
                      <span className="value">{item.notes}</span>
                    </div>
                  )}
                  <div className="import-item-row">
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

export default ImportHistory;

