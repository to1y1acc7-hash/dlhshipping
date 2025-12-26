import React from 'react';
import { Link } from 'react-router-dom';
import a1Image from '../assets/a1.png';
import a2Image from '../assets/a2.png';
import a3Image from '../assets/a3.png';
import './ServicesGallery.css';

const ServicesGallery = ({ layout = 'horizontal' }) => {
  const services = [
    {
      id: 'van-chuyen-hang-uc-vietnam',
      path: '/dich-vu/van-chuyen-hang-uc-vietnam',
      image: a1Image,
      title: 'Dịch vụ vận chuyển hàng từ úc về Việt Nam',
      alt: 'Dịch vụ vận chuyển hàng từ úc về Việt Nam'
    },
    {
      id: 'drop-ship-hang-uc-vietnam',
      path: '/dich-vu/drop-ship-hang-uc-vietnam',
      image: a2Image,
      title: 'Dịch vụ Drop Ship hàng từ Úc về Việt Nam',
      alt: 'Dịch vụ Drop Ship hàng từ Úc về Việt Nam'
    },
    {
      id: 'order-hang-uc-chinh-hang',
      path: '/dich-vu/order-hang-uc-chinh-hang',
      image: a3Image,
      title: 'Dịch vụ Order hàng úc chính hãng giá tốt',
      alt: 'Dịch vụ Order hàng úc chính hãng giá tốt'
    }
  ];

  const gridClass = layout === 'vertical' ? 'services-main-grid-vertical' : 'services-main-grid';

  return (
    <section className="services-section">
      <div className={gridClass}>
        {services.map((service) => (
          <div key={service.id} className="service-main-item">
            <Link to={service.path} className="service-main-card">
              <div className="service-main-image">
                <img src={service.image} alt={service.alt} loading="lazy" decoding="async" />
              </div>
            </Link>
            <div className="service-main-title">
              {service.title}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServicesGallery;

