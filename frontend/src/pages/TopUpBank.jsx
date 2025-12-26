import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import './TopUpBank.css';

const API_BASE_URL = '/api';

const TopUpBank = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    bank_name: 'Đang cập nhật',
    bank_account_holder: 'Đang cập nhật',
    bank_account_number: 'Đang cập nhật'
  });

  useEffect(() => {
    const loadBankInfo = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/settings`);
        if (response.data) {
          setBankInfo({
            bank_name: response.data.bank_name || 'Đang cập nhật',
            bank_account_holder: response.data.bank_account_holder || 'Đang cập nhật',
            bank_account_number: response.data.bank_account_number || 'Đang cập nhật'
          });
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin ngân hàng:', error);
      }
    };
    loadBankInfo();
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleAmountChange = (e) => {
    // Lấy giá trị và loại bỏ tất cả ký tự không phải số
    let value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
  };

  const handleConfirm = async () => {
    const amountValue = parseFloat(amount);
    
    if (!amount.trim() || isNaN(amountValue) || amountValue <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ (lớn hơn 0)');
      return;
    }

    if (amountValue < 10000) {
      alert('Số tiền nạp tối thiểu là 10.000');
      return;
    }

    const userId = localStorage.getItem('userId');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn || !userId) {
      alert('Vui lòng đăng nhập để nạp tiền');
      navigate('/dang-nhap');
      return;
    }

    const confirmMessage = `Bạn có chắc chắn muốn nạp ${amountValue.toLocaleString('vi-VN')}?\n\nSau khi xác nhận, vui lòng chuyển khoản đến:\n- Ngân hàng: ${bankInfo.bank_name}\n- Chủ TK: ${bankInfo.bank_account_holder}\n- Số TK: ${bankInfo.bank_account_number}\n\nYêu cầu sẽ được gửi và chờ admin duyệt.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/transactions/deposit`, {
        userId: parseInt(userId),
        amount: amountValue,
        description: `Nạp tiền qua ngân hàng ${bankInfo.bank_name} - Số tiền: ${amountValue.toLocaleString('vi-VN')}`
      });

      if (response.data.success) {
        alert(`Yêu cầu nạp tiền ${amountValue.toLocaleString('vi-VN')} đã được gửi thành công!\n\nVui lòng chờ admin duyệt yêu cầu của bạn.`);
        setAmount('');
        navigate('/account/deposit-history');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Có lỗi xảy ra khi tạo yêu cầu nạp tiền');
      console.error('Lỗi khi nạp tiền:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="top-up-bank-page">
      <div className="top-up-bank-container">
        <div className="top-up-bank-header">
          <button className="top-up-bank-back" onClick={handleBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="top-up-bank-title-section">
            <div className="top-up-bank-icon">
              <FontAwesomeIcon icon={faCreditCard} />
            </div>
            <span className="top-up-bank-title">Ngân hàng</span>
            <span className="top-up-bank-arrow">&gt;</span>
          </div>
        </div>

        <div className="top-up-bank-content">
          <div className="amount-section">
            <label className="amount-label">Số tiền *</label>
            <input
              type="text"
              className="amount-input"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Nhập số tiền (VD: 100000)"
              disabled={loading}
            />
            {amount && (
              <div className="amount-preview">
                Số tiền: <strong>{parseFloat(amount).toLocaleString('vi-VN')}</strong>
              </div>
            )}
            <small className="amount-hint">Số tiền tối thiểu: 10.000</small>
          </div>

          <div className="bank-info-section">
            <p className="bank-info-notice">
              Sau đây là thông tin tài khoản ngân hàng bạn cần chuyển khoản
            </p>
            <div className="bank-info-table">
              <div className="bank-info-row">
                <span className="bank-info-label">Tên ngân hàng</span>
                <span className="bank-info-value">{bankInfo.bank_name}</span>
              </div>
              <div className="bank-info-row">
                <span className="bank-info-label">Chủ tài khoản</span>
                <span className="bank-info-value">{bankInfo.bank_account_holder}</span>
              </div>
              <div className="bank-info-row">
                <span className="bank-info-label">Số tài khoản</span>
                <span className="bank-info-value">{bankInfo.bank_account_number}</span>
              </div>
            </div>
          </div>

          <button 
            className="confirm-button" 
            onClick={handleConfirm}
            disabled={loading || !amount.trim()}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận nạp tiền'}
          </button>
          
          <div className="deposit-instructions">
            <p className="instructions-title">Hướng dẫn nạp tiền:</p>
            <ol className="instructions-list">
              <li>Nhập số tiền bạn muốn nạp</li>
              <li>Chuyển khoản đúng số tiền đến tài khoản ngân hàng bên trên</li>
              <li>Nhấn "Xác nhận nạp tiền" để gửi yêu cầu</li>
              <li>Chờ admin duyệt yêu cầu của bạn</li>
            </ol>
            <p className="instructions-note">Lưu ý: Vui lòng chuyển khoản đúng số tiền đã nhập để admin có thể xác nhận nhanh chóng.</p>
          </div>
        </div>
      </div>
      <FooterContent />
    </div>
  );
};

export default TopUpBank;

