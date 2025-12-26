import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import './HeroBanner.css';

const HeroBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const slides = [
    {
      id: 1,
      title: 'DHL Express - Excellence. Simply Delivered.',
      subtitle: 'Dịch vụ vận chuyển nhanh toàn cầu',
      image: '/images/dhl/carousel-1.png'
    },
    {
      id: 2,
      title: 'DHL Logistics Solutions',
      subtitle: 'Giải pháp logistics chuyên nghiệp',
      image: '/images/dhl/carousel-2.png'
    },
    {
      id: 3,
      title: 'DHL International Shipping',
      subtitle: 'Vận chuyển quốc tế uy tín',
      image: '/images/dhl/carousel-3.png'
    }
  ];

  // Preload all carousel images for smooth transitions
  useEffect(() => {
    const imagePromises = slides.map((slide) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = slide.image;
      });
    });

    Promise.all(imagePromises)
      .then(() => setImagesLoaded(true))
      .catch((err) => console.warn('Some carousel images failed to load:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tắt tự động chuyển ảnh
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCurrentSlide((prev) => (prev + 1) % slides.length);
  //   }, 5000);
  //   return () => clearInterval(timer);
  // }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="hero-banner">
      <div className="hero-slider">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === currentSlide ? 'active' : ''} ${imagesLoaded ? 'loaded' : ''}`}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        ))}

        <button className="hero-arrow hero-arrow-left" onClick={prevSlide}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <button className="hero-arrow hero-arrow-right" onClick={nextSlide}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>

        <div className="hero-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`hero-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;

