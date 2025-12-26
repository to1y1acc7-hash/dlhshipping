import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import './LinkBank.css';

const API_BASE_URL = '/api';

const LinkBank = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: ''
  });
  const [loading, setLoading] = useState(false);
  const [bankInfo, setBankInfo] = useState(null);
  const [isLinked, setIsLinked] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn || !userId) {
      navigate('/dang-nhap');
      return;
    }
    
    loadBankInfo();
  }, [navigate]);

  const loadBankInfo = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.get(`${API_BASE_URL}/users/${userId}/bank`);
      
      if (response.data) {
        setBankInfo(response.data);
        setIsLinked(response.data.isLinked);
        
        if (response.data.isLinked) {
          setFormData({
            bank_name: response.data.bank_name || '',
            bank_account_number: response.data.bank_account_number || '',
            bank_account_holder: response.data.bank_account_holder || ''
          });
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin ngân hàng:', error);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.bank_name.trim() || !formData.bank_account_number.trim() || !formData.bank_account_holder.trim()) {
      alert('Vui lòng điền đầy đủ thông tin ngân hàng');
      return;
    }

    const userId = localStorage.getItem('userId');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn || !userId) {
      alert('Vui lòng đăng nhập');
      navigate('/dang-nhap');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/users/${userId}/bank`, {
        bank_name: formData.bank_name.trim(),
        bank_account_number: formData.bank_account_number.trim(),
        bank_account_holder: formData.bank_account_holder.trim()
      });

      if (response.data.success) {
        alert('Liên kết ngân hàng thành công!');
        localStorage.setItem('bankLinked', 'true');
        setIsLinked(true);
        setBankInfo(response.data.bank);
        navigate('/account/personal-info');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Có lỗi xảy ra khi liên kết ngân hàng');
      console.error('Lỗi khi liên kết ngân hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="link-bank-page">
      <div className="link-bank-container">
        <div className="link-bank-header">
          <button className="link-bank-back" onClick={handleBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="link-bank-title-section">
            <div className="link-bank-icon">
              <FontAwesomeIcon icon={faCreditCard} />
            </div>
            <span className="link-bank-title">Liên kết ngân hàng</span>
          </div>
        </div>

        <div className="link-bank-content">
          {isLinked && (
            <div className="linked-notice">
              <div className="notice-icon">✓</div>
              <div className="notice-text">
                <p className="notice-title">Đã liên kết ngân hàng</p>
                <p className="notice-subtitle">Bạn có thể cập nhật thông tin ngân hàng bên dưới</p>
              </div>
            </div>
          )}

          <form className="link-bank-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Tên ngân hàng *</label>
              <input
                type="text"
                name="bank_name"
                className="form-input"
                value={formData.bank_name}
                onChange={handleChange}
                placeholder="VD: Westpac, ING..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Số tài khoản *</label>
              <input
                type="text"
                name="bank_account_number"
                className="form-input"
                value={formData.bank_account_number}
                onChange={handleChange}
                placeholder="Nhập số tài khoản ngân hàng"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Chủ tài khoản *</label>
              <input
                type="text"
                name="bank_account_holder"
                className="form-input"
                value={formData.bank_account_holder}
                onChange={handleChange}
                placeholder="Nhập tên chủ tài khoản (đúng như trên thẻ)"
                required
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Đang xử lý...' : (isLinked ? 'Cập nhật thông tin' : 'Liên kết ngân hàng')}
            </button>
          </form>

          <div className="info-box">
            <p className="info-title">Lưu ý:</p>
            <ul className="info-list">
              <li>Thông tin ngân hàng sẽ được sử dụng để xử lý các giao dịch rút tiền</li>
              <li>Vui lòng đảm bảo thông tin chính xác để tránh lỗi trong quá trình giao dịch</li>
              <li>Bạn có thể cập nhật thông tin ngân hàng bất cứ lúc nào</li>
            </ul>
          </div>
        </div>
      </div>
      <FooterContent />
    </div>
  );
};

export default LinkBank;

