import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faUser,
  faImage,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import './PersonalInfo.css';

const PersonalInfo = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [tempSelectedAvatar, setTempSelectedAvatar] = useState(null);
  const [userInfo, setUserInfo] = useState({
    fullName: localStorage.getItem('fullName') || username,
    gender: localStorage.getItem('gender') || 'Nam',
    bankLinked: localStorage.getItem('bankLinked') === 'true',
    avatar: null,
    creditScore: 100,
    vipLevel: 0,
    minWithdrawal: 0,
    maxWithdrawal: 0,
    balance: 0
  });

  // Danh sách ảnh đại diện mẫu
  const avatarOptions = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    url: null,
    icon: faImage
  }));

  useEffect(() => {
    // Load user info when component mounts
    const savedName = localStorage.getItem('fullName');
    const savedGender = localStorage.getItem('gender');
    const savedBankLinked = localStorage.getItem('bankLinked');
    if (savedName || savedGender || savedBankLinked) {
      setUserInfo(prev => ({
        ...prev,
        fullName: savedName || prev.fullName,
        gender: savedGender || prev.gender,
        bankLinked: savedBankLinked === 'true' || prev.bankLinked
      }));
    }
    
    // Load user info from API (including credit score, VIP, withdrawal limits)
    const loadUserInfo = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (userId) {
          // Load bank status
          const bankResponse = await axios.get(`/api/users/${userId}/bank`);
          if (bankResponse.data && bankResponse.data.isLinked) {
            setUserInfo(prev => ({ ...prev, bankLinked: true }));
            localStorage.setItem('bankLinked', 'true');
          }
          
          // Load full user info
          const userResponse = await axios.get(`/api/users/${userId}/info`);
          if (userResponse.data) {
            setUserInfo(prev => ({
              ...prev,
              creditScore: userResponse.data.credit_score || 100,
              vipLevel: userResponse.data.vip_level || 0,
              minWithdrawal: userResponse.data.min_withdrawal || 0,
              maxWithdrawal: userResponse.data.max_withdrawal || 0,
              balance: userResponse.data.balance || 0
            }));
          }
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };
    loadUserInfo();
  }, []);

  const handleBack = () => {
    navigate(-1);
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

  return (
    <div className="personal-info-page">
      <div className="personal-info-container">
        <div className="personal-info-header">
          <button className="personal-info-back" onClick={handleBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className="personal-info-title">Thông tin cá nhân</h1>
        </div>

        <div className="personal-info-section">
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
            <div className="info-item">
              <div className="info-label">Điểm tín nhiệm</div>
              <div className="info-value-wrapper">
                <span className="info-value">{userInfo.creditScore || 100}</span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Cấp độ VIP</div>
              <div className="info-value-wrapper">
                <span className="info-value">{userInfo.vipLevel || 0}</span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Số tiền tối thiểu có thể rút</div>
              <div className="info-value-wrapper">
                <span className="info-value">{userInfo.minWithdrawal ? `${userInfo.minWithdrawal.toLocaleString('vi-VN')}` : 'Không giới hạn'}</span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Số tiền tối đa có thể rút</div>
              <div className="info-value-wrapper">
                <span className="info-value">{userInfo.maxWithdrawal ? `${userInfo.maxWithdrawal.toLocaleString('vi-VN')}` : 'Không giới hạn'}</span>
              </div>
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

export default PersonalInfo;

