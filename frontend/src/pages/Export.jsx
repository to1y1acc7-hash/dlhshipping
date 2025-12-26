import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import './Export.css';

const API_BASE_URL = '/api';

// Import brand logo images
const e1Image = '/images/banner/e1.svg';
const e2Image = '/images/banner/e2.svg';
const e3Image = '/images/banner/e3.svg';
const e4Image = '/images/banner/e4.svg';
const e5Image = '/images/banner/e5.svg';
const e6Image = '/images/banner/e6.svg';

const brandLogos = [e1Image, e2Image, e3Image, e4Image, e5Image, e6Image];

// Import tất cả brand images từ thư mục xuathang
import amazonImage from '../assets/xuathang/amazon.jpeg';
import coupangImage from '../assets/xuathang/coupang.jpg';
import ebayImage from '../assets/xuathang/Ebay.jpg';
import gmarketImage from '../assets/xuathang/gmarket.png';
import kmartImage from '../assets/xuathang/Kmart.png';
import koganImage from '../assets/xuathang/kogan.jpg';
import myerImage from '../assets/xuathang/myer.jpg';
import naverImage from '../assets/xuathang/naver.png';
import tmonImage from '../assets/xuathang/tmon.jpg';
import wemaketpriceImage from '../assets/xuathang/wemaketprice.png';

const fallbackImages = [
  amazonImage,
  ebayImage,
  kmartImage,
  koganImage,
  myerImage,
  gmarketImage,
  coupangImage,
  naverImage,
  tmonImage,
  wemaketpriceImage
];

const Export = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [pollItems, setPollItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError('');
        const [catRes, itemRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/categories`),
          axios.get(`${API_BASE_URL}/category-items`)
        ]);
        const cats = Array.isArray(catRes.data) ? catRes.data : [];
        const active = cats.filter(c => c.status !== 'inactive');
        setCategories(active);
        const items = Array.isArray(itemRes.data) ? itemRes.data : [];
        const activeItems = items.filter(i => i.status !== 'inactive');
        // Sắp xếp để item mới nhất hiển thị ở cuối danh sách
        const sortedItems = activeItems.sort((a, b) => {
          // Ưu tiên sắp xếp theo created_at tăng dần (cũ nhất lên đầu, mới nhất xuống cuối)
          if (a.created_at && b.created_at) {
            return new Date(a.created_at) - new Date(b.created_at);
          }
          // Fallback: sắp xếp theo id tăng dần (id nhỏ hơn = cũ hơn lên đầu)
          return (a.id || 0) - (b.id || 0);
        });
        setPollItems(sortedItems);
      } catch (err) {
        console.error('Lỗi tải danh mục hoặc loại bình chọn:', err);
        setError('Không thể tải dữ liệu');
        setCategories([]);
        setPollItems([]);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const handleItemClick = (itemId) => {
    navigate(`/xuat-hang/item/${itemId}`);
  };

  // Cards hiển thị theo từng mục bình chọn (poll item), không chỉ theo danh mục
  const displayItems = pollItems;

  return (
    <div className="export-page">
      <div className="export-content">
        {/* Brands Section */}
        <section className="brands-section">
          {/* Smooth Scrolling Brand Logos Carousel */}
          <div className="brands-logo-carousel">
            <div className="brands-logo-track">
              {[...brandLogos, ...brandLogos, ...brandLogos].map((logo, index) => (
                <div key={index} className="brand-logo-item">
                  <img src={logo} alt={`Brand ${(index % brandLogos.length) + 1}`} />
                </div>
              ))}
            </div>
          </div>
          
          <div className="brands-container">
            {loading ? (
              <div className="brands-loading">Đang tải danh mục...</div>
            ) : error ? (
              <div className="brands-error">{error}</div>
            ) : displayItems.length === 0 ? (
              <div className="brands-empty">Chưa có dữ liệu bình chọn.</div>
            ) : (
              <div className="brands-grid">
                {displayItems.map((item, index) => {
                  const category = categories.find(c => c.id === parseInt(item.category_id, 10));
                  const imgSrc = item.image || category?.image || fallbackImages[index % fallbackImages.length];
                  return (
                    <div 
                      key={item.id} 
                      className="brand-card"
                      onClick={() => handleItemClick(item.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="brand-logo-wrapper">
                        <img src={imgSrc} alt={item.title || category?.name} className="brand-logo" />
                      </div>
                      <div className="brand-description">
                        {item.title || category?.description || category?.name || 'Loại bình chọn'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
      <FooterContent />
    </div>
  );
};

export default Export;
