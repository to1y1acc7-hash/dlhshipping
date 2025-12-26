import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import './DepositHistory.css';

const API_BASE_URL = '/api';

const DepositHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userId = localStorage.getItem('userId');
    
    if (!isLoggedIn || !userId) {
      navigate('/dang-nhap', { state: { from: location.pathname } });
      return;
    }
    
    loadDeposits();
  }, [location.pathname, navigate]);

  const loadDeposits = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      const response = await axios.get(`${API_BASE_URL}/transactions/user/${userId}`);
      
      if (response.data && Array.isArray(response.data)) {
        // Lọc chỉ lấy transactions nạp tiền (deposit hoặc add)
        const deposits = response.data.filter(t => 
          (t.transaction_type === 'deposit' || t.transaction_type === 'add') &&
          (t.user_id === parseInt(userId) || t.userId === parseInt(userId))
        );
        setTransactions(deposits);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử nạp tiền:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/dang-nhap', { state: { from: location.pathname } });
        return;
      }
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Chờ duyệt',
      'completed': 'Đã duyệt',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      'pending': 'status-pending',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return classMap[status] || '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const removeVND = (text) => {
    if (!text) return text;
    return text.replace(/\s*VNĐ/gi, '').trim();
  };

  return (
    <div className="deposit-history-page">
      <div className="deposit-history-container">
        <div className="deposit-history-header">
          <button className="deposit-history-back" onClick={handleBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className="deposit-history-title">Lịch sử nạp</h1>
        </div>

        <div className="deposit-history-content">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-illustration">
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="70" y="60" width="60" height="80" rx="2" fill="#E0E0E0" opacity="0.3"/>
                  <rect x="75" y="55" width="60" height="80" rx="2" fill="#E0E0E0" opacity="0.4"/>
                  <rect x="80" y="50" width="60" height="80" rx="2" fill="#E0E0E0" opacity="0.5"/>
                  <line x1="90" y1="70" x2="130" y2="70" stroke="#BDBDBD" strokeWidth="2"/>
                  <line x1="90" y1="85" x2="130" y2="85" stroke="#BDBDBD" strokeWidth="2"/>
                  <line x1="90" y1="100" x2="130" y2="100" stroke="#BDBDBD" strokeWidth="2"/>
                </svg>
              </div>
              <p className="empty-state-text">Bạn chưa có giao dịch nạp tiền nào!</p>
            </div>
          ) : (
            <div className="transaction-list">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-header">
                    <div className="transaction-amount positive">
                      +{parseFloat(transaction.amount || 0).toLocaleString('vi-VN')}
                    </div>
                    <span className={`transaction-status ${getStatusClass(transaction.status)}`}>
                      {getStatusText(transaction.status)}
                    </span>
                  </div>
                  <div className="transaction-body">
                    <div className="transaction-info-row">
                      <span className="transaction-label">Mô tả:</span>
                      <span className="transaction-value">{removeVND(transaction.description) || '-'}</span>
                    </div>
                    <div className="transaction-info-row">
                      <span className="transaction-label">Số dư trước:</span>
                      <span className="transaction-value">{parseFloat(transaction.balance_before || 0).toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="transaction-info-row">
                      <span className="transaction-label">Số dư sau:</span>
                      <span className="transaction-value">{parseFloat(transaction.balance_after || 0).toLocaleString('vi-VN')}</span>
                    </div>
                    {transaction.admin_note && (
                      <div className="transaction-info-row">
                        <span className="transaction-label">Ghi chú admin:</span>
                        <span className="transaction-value">{transaction.admin_note}</span>
                      </div>
                    )}
                  </div>
                  <div className="transaction-footer">
                    <span className="transaction-date">{formatDate(transaction.created_at)}</span>
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

export default DepositHistory;

