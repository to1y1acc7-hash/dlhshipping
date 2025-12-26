import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import FooterContent from '../components/FooterContent';
import './EditName.css';

const EditName = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';
  const [fullName, setFullName] = useState(username);

  useEffect(() => {
    // Load user info from localStorage or API
    const savedName = localStorage.getItem('fullName');
    if (savedName) {
      setFullName(savedName);
    }
  }, []);

  const handleSave = () => {
    if (fullName.trim()) {
      localStorage.setItem('fullName', fullName.trim());
      navigate(-1); // Quay về trang trước đó
    }
  };

  const handleCancel = () => {
    navigate(-1); // Quay về trang trước đó
  };

  return (
    <div className="edit-name-page">
      <div className="edit-name-container">
        <div className="edit-name-header">
          <button className="edit-name-back" onClick={handleCancel}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className="edit-name-title">Sửa Tên</h1>
        </div>

        <div className="edit-name-content">
          <div className="edit-name-field">
            <label className="edit-name-label">Họ tên thật</label>
            <input
              type="text"
              className="edit-name-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ tên thật"
            />
          </div>

          <div className="edit-name-warning">
            Để đảm bảo an toàn cho tài khoản của bạn, họ tên thật cần phải giống với tên trên thẻ ngân hàng.
          </div>

          <div className="edit-name-actions">
            <button className="edit-name-cancel" onClick={handleCancel}>
              Hủy
            </button>
            <button className="edit-name-save" onClick={handleSave}>
              Lưu
            </button>
          </div>
        </div>
      </div>
      <FooterContent />
    </div>
  );
};

export default EditName;

