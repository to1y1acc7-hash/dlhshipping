import React from 'react';
import FooterContent from '../components/FooterContent';
import newsDetail1 from '../assets/news-detail-1.jpg';
import newsDetail2 from '../assets/news-detail-2.jpg';
import newsDetail3 from '../assets/news-detail-3.png';
import newsDetail4 from '../assets/news-detail-4.jpg';
import './News.css';

const News = () => {
  return (
    <div className="news-page">
      {/* News List Section */}
      <section className="news-list-section">
        <h2 className="news-list-title">TIN TỨC</h2>
        
        <div className="news-list-container">
          {/* News Article 1 */}
          <div className="news-list-item">
            <div className="news-list-image">
              <img src={newsDetail1} alt="Shipping Container" className="news-list-image-img" />
            </div>
            <div className="news-list-content">
              <h3 className="news-list-item-title">[Tìm hiểu] Vận chuyển hàng từ Úc về Hà Nội có lâu không?</h3>
              <p className="news-list-excerpt">
                Việc vận chuyển hàng từ Úc về Việt Nam, đặc biệt là Hà Nội, là một vấn đề được rất nhiều khách hàng quan tâm. Bởi nó ảnh hưởng đến thời gian nhận hàng mà còn có thể tác động đến kế hoạch kinh doanh hoặc nhu cầu sử dụng hàng hóa. Vậy vận chuyển [...]
              </p>
              <button className="news-list-read-more">Xem thêm</button>
            </div>
          </div>

          {/* News Article 2 */}
          <div className="news-list-item">
            <div className="news-list-image">
              <img src={newsDetail2} alt="Australia Shipping Map" className="news-list-image-img" />
            </div>
            <div className="news-list-content">
              <h3 className="news-list-item-title">Vận chuyển hàng từ Úc về Hải Dương bao nhiêu tiền 1kg? Chi tiết giá cước mới nhất</h3>
              <p className="news-list-excerpt">
                Khi cần vận chuyển hàng hóa từ Úc về Việt Nam, đặc biệt là Hải Dương, một trong những yếu tố quan trọng cần được xem xét là chi phí vận chuyển. Chi phí này có thể thay đổi tùy thuộc vào nhiều yếu tố khác nhau, từ hình thức vận chuyển, khối lượng hàng [...]
              </p>
              <button className="news-list-read-more">Xem thêm</button>
            </div>
          </div>

          {/* News Article 3 */}
          <div className="news-list-item">
            <div className="news-list-image">
              <img src={newsDetail3} alt="Dropshipping Diagram" className="news-list-image-img" />
            </div>
            <div className="news-list-content">
              <h3 className="news-list-item-title">Dropshipping là gì? Ưu và nhược điểm của Dropshipping</h3>
              <p className="news-list-excerpt">
                Bạn đã từng nghe đến khái niệm "kinh doanh không cần vốn"? Nghe có vẻ khó tin, nhưng đó chính là những gì Dropshipping mang lại. Vậy Dropshipping thực chất là gì? Tại sao nó lại được nhiều người lựa chọn đến vậy? Liệu có "con đường tắt" nào mà không đi kèm với rủi [...]
              </p>
              <button className="news-list-read-more">Xem thêm</button>
            </div>
          </div>

          {/* News Article 4 */}
          <div className="news-list-item">
            <div className="news-list-image">
              <img src={newsDetail4} alt="Airplane Loading" className="news-list-image-img" />
            </div>
            <div className="news-list-content">
              <h3 className="news-list-item-title">Vận chuyển hàng từ Úc về Việt Nam bằng đường hàng không nhanh chóng</h3>
              <p className="news-list-excerpt">
                Vận chuyển hàng từ Úc về Việt Nam bằng đường hàng không là giải pháp tối ưu cho những kiện hàng cần được giao nhận trong thời gian ngắn. Với ưu điểm vượt trội về tốc độ, dịch vụ này ngày càng được nhiều cá nhân và doanh nghiệp lựa chọn. Bài viết này sẽ [...]
              </p>
              <button className="news-list-read-more">Xem thêm</button>
            </div>
          </div>
        </div>
      </section>
      <FooterContent />
    </div>
  );
};

export default News;

