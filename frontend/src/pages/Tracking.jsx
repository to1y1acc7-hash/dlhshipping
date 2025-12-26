import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus,
  faExchangeAlt,
  faChartBar,
  faUser,
  faWallet,
  faHeadset,
  faSignOutAlt,
  faTimes,
  faImage
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import './Tracking.css';

const API_BASE_URL = '/api';

const Tracking = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';
  const [showDetail, setShowDetail] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [tempSelectedAvatar, setTempSelectedAvatar] = useState(null);
  const [userInfo, setUserInfo] = useState({
    fullName: localStorage.getItem('fullName') || username,
    gender: localStorage.getItem('gender') || 'Nam',
    bankLinked: false,
    avatar: null
  });
  const [balance, setBalance] = useState(0);
  const [creditScore, setCreditScore] = useState(100);
  const [loading, setLoading] = useState(true);

  // Danh sách ảnh đại diện mẫu
  const avatarOptions = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    url: null, // Có thể thay bằng URL ảnh thật sau
    icon: faImage
  }));

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    navigate('/');
  };

  const toggleDetail = () => {
    setShowDetail(!showDetail);
  };

  const openAvatarModal = () => {
    setTempSelectedAvatar(selectedAvatar);
    setShowAvatarModal(true);
  };

  const closeAvatarModal = () => {
    setShowAvatarModal(false);
    setTempSelectedAvatar(null);
  };

  const previewAvatar = (avatarId) => {
    setTempSelectedAvatar(avatarId);
  };

  const confirmAvatarSelection = () => {
    if (tempSelectedAvatar) {
      setSelectedAvatar(tempSelectedAvatar);
      setUserInfo({ ...userInfo, avatar: tempSelectedAvatar });
    }
    closeAvatarModal();
  };

  const openEditNamePage = () => {
    navigate('/account/edit-name');
  };

  const openEditGenderPage = () => {
    navigate('/account/edit-gender');
  };

  useEffect(() => {
    // Load user info when component mounts or when returning from edit page
    const savedName = localStorage.getItem('fullName');
    const savedGender = localStorage.getItem('gender');
    if (savedName || savedGender) {
      setUserInfo(prev => ({
        ...prev,
        fullName: savedName || prev.fullName,
        gender: savedGender || prev.gender
      }));
    }
    
    // Load user balance and credit score
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        setLoading(false);
        return;
      }

      // Load user balance and credit score from members API
      const response = await axios.get(`${API_BASE_URL}/admin/members`);
      if (response.data && Array.isArray(response.data)) {
        const user = response.data.find(u => u.id === parseInt(userId));
        if (user) {
          setBalance(parseFloat(user.balance) || 0);
          setCreditScore(parseInt(user.credit_score) || 100);
        }
      }

      // Load bank linking status
      try {
        const bankResponse = await axios.get(`${API_BASE_URL}/users/${userId}/bank`);
        if (bankResponse.data && bankResponse.data.isLinked) {
          setUserInfo(prev => ({ ...prev, bankLinked: true }));
          localStorage.setItem('bankLinked', 'true');
        }
      } catch (error) {
        console.error('Error loading bank status:', error);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-dashboard">
      <div className="account-container">
        {/* Header */}
        <div className="account-header">
          <div className="account-greeting">
            <h2>Xin chào, {username}</h2>
          </div>
          <div className="account-detail-link">
            <a href="/account/personal-info" onClick={(e) => { e.preventDefault(); navigate('/account/personal-info'); }}>Thông tin chi tiết &gt;</a>
          </div>
        </div>

        {/* Personal Information Section */}
        {showDetail && (
          <div className="personal-info-section">
            <div className="personal-info-header">
              <span className="personal-info-tab">Thông tin cá nhân</span>
            </div>
            <div className="personal-info-content">
              <div className="info-item" onClick={openAvatarModal}>
                <div className="info-label">Ảnh đại diện</div>
                <div className="info-value-wrapper">
                  <div className={`profile-picture ${selectedAvatar ? 'has-avatar' : ''}`}>
                    {selectedAvatar ? (
                      <FontAwesomeIcon icon={faImage} />
                    ) : (
                      <FontAwesomeIcon icon={faUser} />
                    )}
                  </div>
                  <span className="info-arrow">&gt;</span>
                </div>
              </div>
              <div className="info-item" onClick={openEditNamePage}>
                <div className="info-label">Họ tên thật</div>
                <div className="info-value-wrapper">
                  <span className="info-value">{userInfo.fullName}</span>
                  <span className="info-arrow">&gt;</span>
                </div>
              </div>
              <div className="info-item" onClick={openEditGenderPage}>
                <div className="info-label">Giới tính</div>
                <div className="info-value-wrapper">
                  <span className="info-value">{userInfo.gender}</span>
                  <span className="info-arrow">&gt;</span>
                </div>
              </div>
              <div className="info-item" onClick={() => navigate('/account/link-bank')}>
                <div className="info-label">Liên kết ngân hàng</div>
                <div className="info-value-wrapper">
                  <span className="info-value">{userInfo.bankLinked ? 'Đã liên kết' : 'Chưa liên kết'}</span>
                  <span className="info-arrow">&gt;</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Summary */}
        <div className="summary-header-row">
          <h3 className="summary-greeting-text">
            Xin chào, <span className="summary-user-name">{userInfo.fullName || username}</span>
          </h3>
          <h3 
            className="detail-info-title" 
            onClick={() => navigate('/account/personal-info')}
            style={{ cursor: 'pointer' }}
          >
            Thông tin chi tiết
          </h3>
        </div>
        <div className="account-summary">
          <div className="summary-box">
            <div className="summary-label">Số dư</div>
            <div className="summary-value">
              {loading ? '...' : balance.toLocaleString('vi-VN')}
            </div>
          </div>
          <div className="summary-box">
            <div className="summary-label">Điểm tín nhiệm</div>
            <div className="summary-value">
              {loading ? '...' : creditScore}
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="quick-access-section">
          <h3 className="section-title">Lối tắt của tôi</h3>
          <div className="quick-access-grid">
            <div className="quick-access-item" onClick={() => navigate('/account/top-up')}>
              <div className="quick-access-icon">
                <FontAwesomeIcon icon={faPlus} />
              </div>
              <span className="quick-access-text">Nạp tiền</span>
            </div>
            <div className="quick-access-item" onClick={() => navigate('/account/withdraw')}>
              <div className="quick-access-icon">
                <FontAwesomeIcon icon={faExchangeAlt} />
              </div>
              <span className="quick-access-text">Rút tiền</span>
            </div>
            <div className="quick-access-item" onClick={() => navigate('/account/order-history')}>
              <div className="quick-access-icon">
                <FontAwesomeIcon icon={faChartBar} />
              </div>
              <span className="quick-access-text">Lịch sử đơn hàng</span>
            </div>
            <div className="quick-access-item" onClick={() => navigate('/account/new')}>
              <div className="quick-access-icon">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <span className="quick-access-text">Tài khoản</span>
            </div>
          </div>
        </div>

        {/* Main Menu */}
        <div className="main-menu-section">
          <h3 className="section-title">Menu của tôi</h3>
          <div className="menu-list">
            <div className="menu-item" onClick={() => navigate('/account/personal-info')}>
              <div className="menu-item-left">
                <FontAwesomeIcon icon={faUser} className="menu-icon" />
                <span className="menu-text">Thông tin cá nhân</span>
              </div>
              <span className="menu-arrow">&gt;</span>
            </div>
            <div className="menu-item" onClick={() => navigate('/account/deposit-history')}>
              <div className="menu-item-left">
                <FontAwesomeIcon icon={faWallet} className="menu-icon" />
                <span className="menu-text">Lịch sử nạp tiền</span>
              </div>
              <span className="menu-arrow">&gt;</span>
            </div>
            <div className="menu-item" onClick={() => navigate('/account/withdrawal-history')}>
              <div className="menu-item-left">
                <FontAwesomeIcon icon={faWallet} className="menu-icon" />
                <span className="menu-text">Lịch sử rút tiền</span>
              </div>
              <span className="menu-arrow">&gt;</span>
            </div>
            <div className="menu-item" onClick={() => navigate('/account/order-history')}>
              <div className="menu-item-left">
                <FontAwesomeIcon icon={faChartBar} className="menu-icon" />
                <span className="menu-text">Đơn hàng của tôi</span>
              </div>
              <span className="menu-arrow">&gt;</span>
            </div>
            <div className="menu-item" onClick={() => navigate('/account/customer-support')}>
              <div className="menu-item-left">
                <FontAwesomeIcon icon={faHeadset} className="menu-icon" />
                <span className="menu-text">Hỗ trợ khách hàng</span>
              </div>
              <span className="menu-arrow">&gt;</span>
            </div>
            <div className="menu-item menu-item-logout" onClick={handleLogout}>
              <div className="menu-item-left">
                <FontAwesomeIcon icon={faSignOutAlt} className="menu-icon menu-icon-logout" />
                <span className="menu-text menu-text-logout">Đăng xuất</span>
              </div>
              <span className="menu-arrow">&gt;</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <>
          <div className="modal-overlay" onClick={closeAvatarModal}></div>
          <div className="avatar-modal">
            <div className="avatar-modal-header">
              <button className="avatar-modal-close" onClick={closeAvatarModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <h3 className="avatar-modal-title">Ảnh đại diện</h3>
              <button 
                className="avatar-modal-select" 
                onClick={confirmAvatarSelection}
                disabled={!tempSelectedAvatar}
              >
                Chọn
              </button>
            </div>
            <div className="avatar-modal-content">
              <div className="avatar-grid">
                {avatarOptions.map((avatar) => (
                  <div
                    key={avatar.id}
                    className={`avatar-option ${tempSelectedAvatar === avatar.id ? 'selected' : ''}`}
                    onClick={() => previewAvatar(avatar.id)}
                  >
                    <div className="avatar-placeholder">
                      <FontAwesomeIcon icon={avatar.icon} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      
      <FooterContent />
    </div>
  );
};

export default Tracking;

