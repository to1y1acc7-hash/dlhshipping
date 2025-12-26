import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import FooterContent from '../components/FooterContent';
import './EditGender.css';

const EditGender = () => {
  const navigate = useNavigate();
  const [gender, setGender] = useState('Nam');

  useEffect(() => {
    // Load gender from localStorage
    const savedGender = localStorage.getItem('gender');
    if (savedGender) {
      setGender(savedGender);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('gender', gender);
    navigate(-1); // Quay về trang trước đó
  };

  const handleCancel = () => {
    navigate(-1); // Quay về trang trước đó
  };

  return (
    <div className="edit-gender-page">
      <div className="edit-gender-container">
        <div className="edit-gender-header">
          <button className="edit-gender-back" onClick={handleCancel}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className="edit-gender-title">Chọn giới tính</h1>
        </div>

        <div className="edit-gender-content">
          <label className="gender-label">Giới tính</label>
          <div className="gender-radio-group">
            <label 
              className={`gender-radio-option ${gender === 'Nam' ? 'selected' : ''}`}
              onClick={() => setGender('Nam')}
            >
              <input
                type="radio"
                name="gender"
                value="Nam"
                checked={gender === 'Nam'}
                onChange={() => setGender('Nam')}
                className="gender-radio-input"
              />
              <span className="gender-radio-custom"></span>
              <span className="gender-radio-text">Nam</span>
            </label>
            <label 
              className={`gender-radio-option ${gender === 'Nữ' ? 'selected' : ''}`}
              onClick={() => setGender('Nữ')}
            >
              <input
                type="radio"
                name="gender"
                value="Nữ"
                checked={gender === 'Nữ'}
                onChange={() => setGender('Nữ')}
                className="gender-radio-input"
              />
              <span className="gender-radio-custom"></span>
              <span className="gender-radio-text">Nữ</span>
            </label>
          </div>

          <div className="edit-gender-actions">
            <button className="edit-gender-cancel" onClick={handleCancel}>
              Hủy
            </button>
            <button className="edit-gender-save" onClick={handleSave}>
              Lưu
            </button>
          </div>
        </div>
      </div>
      <FooterContent />
    </div>
  );
};

export default EditGender;

