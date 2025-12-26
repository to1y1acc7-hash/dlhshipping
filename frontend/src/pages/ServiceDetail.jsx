import React from 'react';
import FooterContent from '../components/FooterContent';
import './ServiceDetail.css';

const ServiceDetail = ({ serviceData }) => {
  return (
    <div className="service-detail-page">
      <div className="service-detail-container">
        <h1 className="service-detail-title">{serviceData.title}</h1>
        <div className="service-detail-content">
          <p>{serviceData.description}</p>
          <p>Trang này đang được phát triển...</p>
        </div>
      </div>
      <FooterContent />
    </div>
  );
};

export default ServiceDetail;

