import React from 'react';
import { Link } from 'react-router-dom';
import FooterContent from '../components/FooterContent';
import a1Image from '../assets/a1.png';
import a2Image from '../assets/a2.png';
import a3Image from '../assets/a3.png';
import './Services.css';

const Services = () => {
  const services = [
    {
      id: 'order-hang-uc-chinh-hang',
      title: 'Dịch vụ order hàng Úc chính hãng giá tốt',
      description: 'Nhu cầu mua hàng Úc ngày càng tăng cao, đặc biệt là các sản phẩm chính hãng, chất lượng cao. Tuy nhiên, nhiều người lo ngại về vấn đề hàng giả, hàng nhái và không biết cách mua hàng an toàn. Với dịch vụ order hàng Úc chính hãng của chúng tôi, bạn sẽ được đảm bảo về chất lượng sản phẩm, thanh toán an toàn và hỗ trợ vận chuyển về Việt Nam một cách nhanh chóng và tiện lợi. Chúng tôi cam kết chỉ cung cấp hàng chính hãng từ các nhà bán lẻ uy tín tại Úc, với giá cả cạnh tranh và dịch vụ chuyên nghiệp...',
      image: a1Image
    },
    {
      id: 'drop-ship-hang-uc-vietnam',
      title: 'Dịch vụ Drop Ship hàng Úc về Việt Nam',
      description: 'Dropshipping là một xu hướng kinh doanh hiện đại, linh hoạt và không cần vốn lớn. Với sự phát triển của thương mại điện tử, nhiều người đang tìm kiếm cơ hội kinh doanh với mô hình dropshipping. Hàng hóa Úc xách tay luôn được ưa chuộng tại thị trường Việt Nam nhờ chất lượng cao và đa dạng về chủng loại. Tuy nhiên, làm thế nào để gửi hàng "Drop" một cách hiệu quả và tiết kiệm chi phí? Dịch vụ Drop Ship hàng Úc về Việt Nam của chúng tôi sẽ giúp bạn giải quyết vấn đề này...',
      image: a2Image
    },
    {
      id: 'van-chuyen-hang-uc-vietnam',
      title: 'Dịch vụ vận chuyển hàng từ úc về Việt Nam',
      description: 'Nhu cầu vận chuyển hàng hóa quốc tế ngày càng tăng cao, đặc biệt là tuyến đường từ Úc về Việt Nam. Với số lượng lớn người Việt đang sinh sống và làm việc tại Úc, cũng như các doanh nghiệp xuất nhập khẩu và cá nhân có nhu cầu mua sắm hàng hóa từ Úc, dịch vụ vận chuyển hàng từ Úc về Việt Nam đã trở thành một nhu cầu thiết yếu. Chúng tôi cung cấp giải pháp vận chuyển toàn diện với nhiều lựa chọn phù hợp với nhu cầu và ngân sách của bạn...',
      image: a3Image
    }
  ];

  return (
    <div className="services-page">
      <div className="services-container">
        <h1 className="services-title">Dịch vụ</h1>
        
        <div className="services-list">
          {services.map((service) => (
            <div key={service.id} className="service-card">
              <div className="service-image-wrapper">
                <img src={service.image} alt={service.title} className="service-image" />
              </div>
              <div className="service-content">
                <h2 className="service-card-title">{service.title}</h2>
                <p className="service-description">{service.description}</p>
                <Link 
                  to={`/dich-vu/${service.id}`} 
                  className="service-read-more-btn"
                >
                  Xem thêm
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      <FooterContent />
    </div>
  );
};

export default Services;
