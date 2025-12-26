import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import FooterContent from '../components/FooterContent';
import ServicesGallery from '../components/ServicesGallery';
import { mockServices, mockNews } from '../data/mockData';
import bgOverbackground from '../assets/bg-overbackground.png';
import bgHomeContact from '../assets/bg-home-contact.jpg';
import b1Image from '../assets/b1.png';
import d1Image from '../assets/d1.png';
import d2Image from '../assets/d2.png';
import d3Image from '../assets/d3.png';
// Import brand images - sử dụng đường dẫn trực tiếp từ public nếu không có trong assets
const e1Image = '/images/banner/e1.svg';
const e2Image = '/images/banner/e2.svg';
const e3Image = '/images/banner/e3.svg';
const e4Image = '/images/banner/e4.svg';
const e5Image = '/images/banner/e5.svg';
const e6Image = '/images/banner/e6.svg';
import './Home.css';

const sloganTexts = [
  'Sản phẩm của chúng tôi',
  'BẠN TRAO TÔI NIỀM TIN CHÚNG TÔI TRAO BẠN SỰ HÀI LÒNG!'
];

const Home = () => {
  const [services, setServices] = useState([]);
  const [news, setNews] = useState([]);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [expandedNews, setExpandedNews] = useState({});
  const [contactForm, setContactForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    note: ''
  });

  const brandImages = [e1Image, e2Image, e3Image, e4Image, e5Image, e6Image].filter(img => img !== null);

  useEffect(() => {
    // Sử dụng mock data (không cần backend)
    setServices(mockServices.slice(0, 6)); // Lấy 6 dịch vụ đầu tiên
    setNews(mockNews.slice(0, 3)); // Lấy 3 tin tức đầu tiên
  }, []);

  const handleContactChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.');
    setContactForm({
      fullName: '',
      email: '',
      phone: '',
      note: ''
    });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Tắt tự động fade in/out
  // useEffect(() => {
  //   // Auto change text với fade effect (giống hero-slide)
  //   const textTimer = setInterval(() => {
  //     setCurrentTextIndex((prev) => (prev + 1) % sloganTexts.length);
  //   }, 5000);
  //   return () => clearInterval(textTimer);
  // }, []);

  return (
    <div className="home-page">
      <HeroBanner />
      
      {/* Products Section Header */}
      <div className="products-header bg-overbackground" style={{ backgroundImage: `url(${bgOverbackground})` }}>
        <div className="products-header-content">
          <div className="products-text-slider">
            {sloganTexts.map((text, index) => (
              <div
                key={index}
                className={`products-text-slide ${index === currentTextIndex ? 'active' : ''}`}
              >
                {text}
              </div>
            ))}
          </div>
          <div className="products-text-buttons">
            {sloganTexts.map((_, index) => (
              <button
                key={index}
                className={`products-text-button ${index === currentTextIndex ? 'active' : ''}`}
                onClick={() => setCurrentTextIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="home-content">
        {/* Services Section - Horizontal Layout */}
        <ServicesGallery layout="horizontal" />

        {/* Contact Section */}
        <section className="contact-section" style={{ backgroundImage: `url(${bgHomeContact})` }}>
          <div className="contact-container">
            {/* Left: Company Info */}
            <div className="contact-info">
              <h2 className="contact-info-title">
                Chất lượng và uy tín hàng đầu<br />
                Nhân giá trị cộng niềm tin
              </h2>
              <div className="contact-info-content">
                <p className="company-name"><strong className="company-name-link" onClick={scrollToTop}>DHL Express</strong> là thành viên của VietPost Pty Ltd, có trụ sở tại:</p>
                <p className="company-address">Lot. 06, 14-16 Belmore Road, Punchbowl NSW 2196</p>
                <p className="company-description">
                  Chúng tôi cung cấp dịch vụ vận chuyển hàng hóa toàn quốc từ Úc, mang đến cho bạn những lựa chọn mua sắm thoải mái, 
                  gửi hàng từ các cửa hàng Úc đến các quốc gia khác với mức giá tối ưu nhất.
                </p>
                <p className="company-description">
                  Chúng tôi mong muốn được hợp tác với các doanh nghiệp để chinh phục thị trường toàn cầu, giúp khách hàng quốc tế 
                  nhanh chóng tiếp cận những sản phẩm chất lượng cao từ Úc, xử lý các đơn hàng xuất nhập khẩu trong nước.
                </p>
              </div>
            </div>

            {/* Right: Contact Form */}
            <div className="contact-form-wrapper">
              <h2 className="contact-form-title">Liên hệ với chúng tôi</h2>
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <input
                    type="text"
                    name="fullName"
                    value={contactForm.fullName}
                    onChange={handleContactChange}
                    placeholder="Họ và tên"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    placeholder="Email"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="tel"
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleContactChange}
                    placeholder="Số điện thoại"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="note"
                    value={contactForm.note}
                    onChange={handleContactChange}
                    placeholder="Note"
                  />
                </div>
                <button type="submit" className="contact-submit-btn">
                  Đăng ký ngay
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* DHL Express Vision & Mission Section */}
        <section className="dhl-express-section">
          <div className="dhl-express-container">
            <h1 className="dhl-express-title">DHL EXPRESS</h1>
            <p className="dhl-express-tagline">Sự lựa chọn hoàn hảo nhất cho Doanh nghiệp và mọi nhà</p>
            
            <div className="dhl-content-wrapper">
              {/* Left: Vision & Mission */}
              <div className="dhl-vision-mission">
                <div className="vision-section">
                  <h2 className="section-heading">Tầm nhìn</h2>
                  <ul className="vision-list">
                    <li>Đáng tin cậy cho các doanh nghiệp thuộc mọi quy mô.</li>
                    <li>Xây dựng mối quan hệ lâu dài với khách hàng dựa trên sự tin tưởng và tôn trọng lẫn nhau.</li>
                    <li>Tập trung vào việc cung cấp các giải pháp chuỗi cung ứng hiệu quả và đáng tin cậy đồng thời ưu tiên sự hài lòng của khách hàng.</li>
                  </ul>
                </div>
                
                <div className="mission-section">
                  <h2 className="section-heading">Sứ mệnh</h2>
                  <ul className="mission-list">
                    <li>Cung cấp cho khách hàng các giải pháp sáng tạo, hiệu quả về chi phí, đáp ứng nhu cầu vận chuyển của khách hàng.</li>
                    <li>An toàn, bền vững và trách nhiệm xã hội.</li>
                    <li>Chất lượng dịch vụ, sự hài lòng của khách hàng, tăng trưởng và lợi nhuận.</li>
                  </ul>
                </div>
              </div>

              {/* Right: DHL Van Image */}
              <div className="dhl-image-wrapper">
                <div className="dhl-image-placeholder">
                  <img src={b1Image} alt="DHL Delivery Van" loading="lazy" decoding="async" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="why-choose-section">
          <h2 className="why-choose-title">TẠI SAO LẠI CHỌN CHÚNG TÔI?</h2>
          
          <div className="why-choose-grid">
            {/* Card 1 - Top Left */}
            <div className="why-choose-card">
              <div className="why-choose-icon">
                <div className="icon-handshake">🤝</div>
              </div>
              <div className="why-choose-content">
                <ul className="why-choose-list">
                  <li>Dịch vụ vận chuyển hàng từ Úc sang các nước quốc tế như Mỹ, Đức, Pháp, Hungary, Việt Nam, Oder hàng Úc chính hãng, dịch vụ Dropship chuyên nghiệp giá rẻ.</li>
                  <li>Đảm bảo chất lượng hàng hóa chính hãng, mang lại giải pháp hiệu quả, đồng thời thỏa mãn được những mong muốn của khách hàng khi sử dụng dịch vụ của chúng tôi.</li>
                </ul>
              </div>
            </div>

            {/* Card 2 - Top Right */}
            <div className="why-choose-card">
              <div className="why-choose-icon">
                <div className="icon-handshake">🤝</div>
              </div>
              <div className="why-choose-content">
                <ul className="why-choose-list">
                  <li>DHL, có đủ năng lực đáp ứng mọi yêu cầu của khách hàng cả về chất lượng dịch vụ cũng như số lượng và chất lượng hàng hóa. Giao hàng tận nơi tại tất cả các tỉnh thành: <span style={{color: '#d40511'}}>Bắc – Trung – Nam</span>.</li>
                  <li>Đảm bảo sự hoạt động liên tục và tính kịp thời về tiến độ vận chuyển hàng hóa cho các khách hàng: cá nhân, các tổ chức, doanh nghiệp.</li>
                </ul>
              </div>
            </div>

            {/* Card 3 - Bottom Left */}
            <div className="why-choose-card">
              <div className="why-choose-icon">
                <div className="icon-handshake">🤝</div>
              </div>
              <div className="why-choose-content">
                <ul className="why-choose-list">
                  <li>Đội ngũ nhân viên tận tâm và chu đáo.</li>
                  <li>Luôn đặt uy tín và sự hài lòng của khách hàng lên hàng đầu.</li>
                </ul>
              </div>
            </div>

            {/* Card 4 - Bottom Right */}
            <div className="why-choose-card">
              <div className="why-choose-icon">
                <div className="icon-24">24</div>
              </div>
              <div className="why-choose-content">
                <ul className="why-choose-list">
                  <li>Giá thành hợp lý.</li>
                  <li>Hỗ trợ khách hàng <span style={{color: '#d40511'}}>24/7</span>.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section className="customer-reviews-section">
          <h2 className="customer-reviews-title">ĐÁNH GIÁ CỦA KHÁCH HÀNG</h2>
          
          <div className="reviews-container">
            {/* Reviews will be added here */}
          </div>
        </section>

        {/* News Section */}
        <section className="news-section-home">
          <h2 className="news-section-title">Tin tức</h2>
          
          <div className="news-grid-home">
            {/* News Article 1 */}
            <div className="news-card-home">
              <div className="news-image-home">
                <div className="news-image-placeholder-home">
                  <img src={d1Image} alt="E-commerce Platforms" loading="lazy" decoding="async" />
                </div>
              </div>
              <div className="news-content-home">
                <h3 className="news-title-home">BÍ QUYẾT SẴN SALE TRÊN CÁC SÀN THƯƠNG MẠI ĐIỆN TỬ</h3>
                <p className={`news-excerpt-home ${expandedNews.news1 ? 'expanded' : ''}`}>
                  Thời gian gần đây, xu hướng mua sắm trực tuyến đã trở nên cực kỳ phổ biến. Các sàn thương mại điện tử như Shopee, Tiki, Lazada, Sendo... đã trở thành những điểm đến quen thuộc của người tiêu dùng Việt Nam.
                </p>
                <button 
                  className="news-read-more" 
                  onClick={() => setExpandedNews({...expandedNews, news1: !expandedNews.news1})}
                >
                  {expandedNews.news1 ? 'Thu gọn' : 'Xem thêm'}
                </button>
              </div>
            </div>

            {/* News Article 2 */}
            <div className="news-card-home">
              <div className="news-image-home">
                <div className="news-image-placeholder-home">
                  <img src={d2Image} alt="Perfume Bottles" loading="lazy" decoding="async" />
                </div>
              </div>
              <div className="news-content-home">
                <h3 className="news-title-home">GIẢI PHÁP VẬN CHUYỂN NƯỚC HOA TỪ ÚC VỀ VIỆT NAM AN TOÀN, HIỆU QUẢ</h3>
                <p className={`news-excerpt-home ${expandedNews.news2 ? 'expanded' : ''}`}>
                  Nước hoa, với thành phần đặc biệt và quy định vận chuyển khắt khe, luôn là một bài toán khó đối với nhiều người muốn mua sắm từ Úc về Việt Nam.
                </p>
                <button 
                  className="news-read-more" 
                  onClick={() => setExpandedNews({...expandedNews, news2: !expandedNews.news2})}
                >
                  {expandedNews.news2 ? 'Thu gọn' : 'Xem thêm'}
                </button>
              </div>
            </div>

            {/* News Article 3 */}
            <div className="news-card-home">
              <div className="news-image-home">
                <div className="news-image-placeholder-home">
                  <img src={d3Image} alt="DHL Warehouse" loading="lazy" decoding="async" />
                </div>
              </div>
              <div className="news-content-home">
                <h3 className="news-title-home">DỊCH VỤ GỬI HÀNG QUỐC TẾ TỪ ÚC VỀ VIỆT NAM CHUYÊN NGHIỆP CỦA CÔNG TY DHL</h3>
                <p className={`news-excerpt-home ${expandedNews.news3 ? 'expanded' : ''}`}>
                  Trong bối cảnh giao thương quốc tế ngày càng phát triển, nhu cầu gửi hàng từ Úc về Việt Nam đang tăng cao.
                </p>
                <button 
                  className="news-read-more" 
                  onClick={() => setExpandedNews({...expandedNews, news3: !expandedNews.news3})}
                >
                  {expandedNews.news3 ? 'Thu gọn' : 'Xem thêm'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Brands Section */}
        <section className="brands-section">
          <h2 className="brands-section-title">ORDER HÀNG TỪ CÁC THƯƠNG HIỆU NỔI TIẾNG</h2>
          {/* Smooth Scrolling Brand Logos Carousel */}
          <div className="brands-logo-carousel">
            <div className="brands-logo-track">
              {[...brandImages, ...brandImages, ...brandImages].map((logo, index) => (
                <div key={index} className="brand-logo-item">
                  <img src={logo} alt={`Brand ${(index % brandImages.length) + 1}`} loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
      <FooterContent />
    </div>
  );
};

export default Home;

