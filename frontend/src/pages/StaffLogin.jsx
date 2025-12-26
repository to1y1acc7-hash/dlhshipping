import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import './Login.css';

const API_BASE_URL = '/api';

const StaffLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Đang gửi request đến:', `${API_BASE_URL}/auth/staff/login`);
      console.log('Dữ liệu:', { username: formData.username, password: '***' });
      
      const response = await axios.post(`${API_BASE_URL}/auth/staff/login`, {
        username: formData.username,
        password: formData.password
      });

      console.log('Response:', response.data);

      if (response.data.success) {
        // Lưu thông tin staff đăng nhập - staff cũng là user trong hệ thống
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('isStaffLoggedIn', 'true');
        localStorage.setItem('staffUsername', response.data.user.username);
        localStorage.setItem('staffId', response.data.user.id);
        localStorage.setItem('staffReferralCode', response.data.user.referral_code || '');
        // Lưu thông tin user để tương thích với các component khác
        localStorage.setItem('username', response.data.user.username);
        localStorage.setItem('userId', response.data.user.id);
        
        navigate('/staff/dashboard');
      } else {
        setError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      console.error('Response error:', err.response?.data);
      setError(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-form-wrapper">
          <div className="login-header">
            <h1 className="login-title">ĐĂNG NHẬP NHÂN VIÊN</h1>
          </div>
          
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Tên đăng nhập</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Nhập tên đăng nhập"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="login-footer">
            <p><Link to="/" className="register-link">← Quay lại trang chủ</Link></p>
          </div>
        </div>
      </div>
      <FooterContent />
    </div>
  );
};

export default StaffLogin;

