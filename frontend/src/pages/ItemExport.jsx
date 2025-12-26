import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FooterContent from '../components/FooterContent';
import { useItemExport } from '../contexts/ItemExportContext';
import './Export.css';

const API_BASE_URL = '/api';

// Reuse fallback images from Export
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

const ItemExport = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const {
    item,
    category,
    selectedRates,
    countdown,
    setItem,
    setCategory,
    setSelectedRates,
    setShowBottomBar
  } = useItemExport();
  const [periodNumber, setPeriodNumber] = useState('—');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadItem = async () => {
      try {
        setLoading(true);
        setError('');
        const [itemRes, catRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/category-items/${itemId}`),
          axios.get(`${API_BASE_URL}/categories`)
        ]);
        const it = itemRes.data;
        setItem(it || null);
        // Không tự chọn từ reward_rate để tránh hiển thị chuỗi JSON; để trống chờ người dùng chọn
        setSelectedRates([]);
        const cats = Array.isArray(catRes.data) ? catRes.data : [];
        const cat = cats.find(c => c.id === parseInt(it?.category_id, 10));
        setCategory(cat || null);
        setShowBottomBar(true);
        
        // Load period number ngay sau khi item được load
        if (itemId) {
          try {
            const periodRes = await axios.get(`${API_BASE_URL}/polls/${itemId}/period-number`);
            if (periodRes.data?.periodNumber) {
              console.log(`✅ Loaded period number: ${periodRes.data.periodNumber}`);
              setPeriodNumber(periodRes.data.periodNumber);
            }
          } catch (err) {
            console.error('Error loading period number:', err);
          }
        }
      } catch (err) {
        console.error('Lỗi tải chi tiết mục:', err);
        setError('Không thể tải dữ liệu mục này.');
        setItem(null);
      } finally {
        setLoading(false);
      }
    };
    if (itemId) {
      loadItem();
    } else {
      // Reset khi rời khỏi trang
      setItem(null);
      setCategory(null);
      setSelectedRates([]);
      setShowBottomBar(false);
    }
    return () => {
      // Cleanup khi unmount
      if (!itemId) {
        setItem(null);
        setCategory(null);
        setSelectedRates([]);
        setShowBottomBar(false);
      }
    };
  }, [itemId, setItem, setCategory, setSelectedRates, setShowBottomBar]);

  // Load current period number and refresh periodically
  useEffect(() => {
    if (!itemId) return;
    
    let interval = null;
    const fetchPeriod = async () => {
      try {
        console.log(`📊 Fetching period number for item ${itemId}...`);
        const res = await axios.get(`${API_BASE_URL}/polls/${itemId}/period-number`);
        console.log(`📊 Period number response:`, res.data);
        if (res.data?.periodNumber) {
          console.log(`✅ Setting period number to: ${res.data.periodNumber}`);
          setPeriodNumber(res.data.periodNumber);
        } else {
          console.warn(`⚠️ No period number in response:`, res.data);
          // Fallback: tạo period number từ ngày hiện tại nếu API không trả về
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const fallbackPeriod = `${year}${month}${day}0`;
          console.log(`⚠️ Using fallback period number: ${fallbackPeriod}`);
          setPeriodNumber(fallbackPeriod);
        }
      } catch (err) {
        console.error(`❌ Error fetching period number for item ${itemId}:`, err);
        console.error('Error details:', err.response?.data || err.message);
        console.error('Error status:', err.response?.status);
        // Fallback: tạo period number từ ngày hiện tại nếu API lỗi
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const fallbackPeriod = `${year}${month}${day}0`;
        console.log(`⚠️ Using fallback period number due to error: ${fallbackPeriod}`);
        setPeriodNumber(fallbackPeriod);
      }
    };
    
    // Gọi ngay lập tức
    fetchPeriod();
    // Sau đó refresh mỗi 3 giây
    interval = setInterval(fetchPeriod, 3000);
    
    // Listen for export success event để reload period number ngay lập tức
    const handleExportSuccess = (event) => {
      if (event.detail?.itemId === parseInt(itemId)) {
        console.log('🔄 Reloading period number after export success...');
        fetchPeriod();
      }
    };
    
    window.addEventListener('itemExportSuccess', handleExportSuccess);
    
    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('itemExportSuccess', handleExportSuccess);
    };
  }, [itemId]);

  const imgSrc =
    item?.image ||
    category?.image ||
    fallbackImages[item ? (item.id % fallbackImages.length) : 0];

  // Format countdown thành HH:MM:SS
  const formatCountdown = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="export-page">
      <div className="export-content">
        {loading ? (
          <div className="brands-loading">Đang tải...</div>
        ) : error ? (
          <div className="brands-error">{error}</div>
        ) : !item ? (
          <div className="brands-empty">Không tìm thấy mục bình chọn.</div>
        ) : (
          <>
            <div className="item-top-card">
              <div className="item-top-left">
                <div className="item-top-label">Đơn hàng kế tiếp</div>
                <div className="item-top-countdown">{formatCountdown(countdown || 0)}</div>
              </div>
              <div className="item-top-right">
                <div className="item-top-label">Mã đơn hàng</div>
                <div className="item-top-order">#{periodNumber || '—'}</div>
              </div>
            </div>

            <div className="item-form-card">
              <div className="item-title">{item.title}</div>
              {['A', 'B', 'C', 'D'].map((opt) => {
                const isActive = selectedRates.includes(opt);
                const toggle = () => {
                  setSelectedRates((prev) =>
                    prev.includes(opt) ? prev.filter((v) => v !== opt) : [...prev, opt]
                  );
                };
                return (
                  <div
                    key={opt}
                    className={`item-pill ${isActive ? 'active' : ''}`}
                    onClick={toggle}
                  >
                    {opt}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <FooterContent />
    </div>
  );
};

export default ItemExport;

