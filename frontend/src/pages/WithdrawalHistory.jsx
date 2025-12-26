import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import './WithdrawalHistory.css';

const API_BASE_URL = '/api';

const WithdrawalHistory = () => {
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
    
    loadWithdrawals();
  }, [location.pathname, navigate]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      const response = await axios.get(`${API_BASE_URL}/transactions/user/${userId}`);
      
      if (response.data && Array.isArray(response.data)) {
        // Lọc chỉ lấy transactions rút tiền (withdraw hoặc subtract)
        const withdrawals = response.data.filter(t => 
          (t.transaction_type === 'withdraw' || t.transaction_type === 'subtract') &&
          (t.user_id === parseInt(userId) || t.userId === parseInt(userId))
        );
        setTransactions(withdrawals);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử rút tiền:', error);
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

  // Ẩn số tài khoản, chỉ hiện 3 số cuối (VD: 3456789 -> ****789)
  const maskBankAccount = (text) => {
    if (!text) return text;
    // Tìm và thay thế số tài khoản (chuỗi số liên tiếp >= 4 ký tự)
    return text.replace(/\b(\d{4,})\b/g, (match) => {
      if (match.length <= 3) return match;
      const lastThree = match.slice(-3);
      return '****' + lastThree;
    });
  };

  return (
    <div className="withdrawal-history-page">
      <div className="withdrawal-history-container">
        <div className="withdrawal-history-header">
          <button className="withdrawal-history-back" onClick={handleBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className="withdrawal-history-title">Lịch sử rút</h1>
        </div>

        <div className="withdrawal-history-content">
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
              <p className="empty-state-text">Bạn chưa có giao dịch rút tiền nào!</p>
            </div>
          ) : (
            <div className="transaction-list">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-header">
                    <div className="transaction-amount negative">
                      -{parseFloat(transaction.amount || 0).toLocaleString('vi-VN')}
                    </div>
                    <span className={`transaction-status ${getStatusClass(transaction.status)}`}>
                      {getStatusText(transaction.status)}
                    </span>
                  </div>
                  <div className="transaction-body">
                    <div className="transaction-info-row">
                      <span className="transaction-label">Mô tả:</span>
                      <span className="transaction-value">{maskBankAccount(removeVND(transaction.description)) || '-'}</span>
                    </div>
                    <div className="transaction-info-row">
                      <span className="transaction-label">Số dư hiện tại:</span>
                      <span className="transaction-value">{parseFloat(transaction.balance_after || 0).toLocaleString('vi-VN')}</span>
                    </div>
                    {transaction.admin_note && (
                      <div className="transaction-info-row">
                        <span className="transaction-label">Ghi chú:</span>
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

export default WithdrawalHistory;
