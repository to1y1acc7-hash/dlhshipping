import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faWallet } from '@fortawesome/free-solid-svg-icons';
import FooterContent from '../components/FooterContent';
import './TopUpEwallet.css';

const TopUpEwallet = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="top-up-ewallet-page">
      <div className="top-up-ewallet-container">
        <div className="top-up-ewallet-header">
          <button className="top-up-ewallet-back" onClick={handleBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="top-up-ewallet-title-section">
            <div className="top-up-ewallet-icon">
              <FontAwesomeIcon icon={faWallet} />
            </div>
            <span className="top-up-ewallet-title">Ví điện tử</span>
            <span className="top-up-ewallet-arrow">&gt;</span>
          </div>
        </div>

        <div className="top-up-ewallet-content">
          <p className="contact-message">Vui lòng liên hệ CSKH</p>
        </div>
      </div>
      <FooterContent />
    </div>
  );
};

export default TopUpEwallet;

