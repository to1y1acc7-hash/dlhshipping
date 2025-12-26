import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEye, faSearch, faFilter, faDownload, faUser, faIdCard, faGlobe, faCalendar, faStar, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import './ExportOrdersList.css';

const API_BASE_URL = '/api';

const ExportOrdersList = () => {
  const navigate = useNavigate();
  const [exportOrders, setExportOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    today: 0,
    todayAmount: 0
  });

  useEffect(() => {
    loadExportOrders();
  }, []);

  const loadExportOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/admin/export-orders`);
      
      if (response.data && Array.isArray(response.data)) {
        setExportOrders(response.data);
        
        // Calculate statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayOrders = response.data.filter(order => {
          const orderDate = new Date(order.created_at);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        });
        
        const totalAmount = response.data.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
        const todayAmount = todayOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
        
        setStats({
          total: response.data.length,
          totalAmount: totalAmount,
          today: todayOrders.length,
          todayAmount: todayAmount
        });
      } else {
        setExportOrders([]);
        setStats({ total: 0, totalAmount: 0, today: 0, todayAmount: 0 });
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách đơn xuất hàng:', error);
      setExportOrders([]);
      setStats({ total: 0, totalAmount: 0, today: 0, todayAmount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString('vi-VN');
  };

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const filteredOrders = exportOrders.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.order_code?.toLowerCase().includes(search) ||
      order.username?.toLowerCase().includes(search) ||
      order.referral_code?.toLowerCase().includes(search) ||
      order.brand_name?.toLowerCase().includes(search) ||
      order.ip_address?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="export-orders-list-page">
      <div className="export-orders-list-container">
        <div className="export-orders-list-header">
          <div className="header-left">
            <h1>Danh sách đơn xuất hàng</h1>
          </div>
          <div className="header-right">
            <button className="refresh-btn" onClick={loadExportOrders} title="Làm mới">
              <FontAwesomeIcon icon={faDownload} /> Làm mới
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-label">Tổng đơn</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Tổng giá trị</div>
            <div className="stat-value amount">{formatCurrency(stats.totalAmount)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Đơn hôm nay</div>
            <div className="stat-value">{stats.today}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Giá trị hôm nay</div>
            <div className="stat-value amount">{formatCurrency(stats.todayAmount)}</div>
          </div>
        </div>

        <div className="export-orders-search">
          <div className="search-wrapper">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn, tên người dùng, mã giới thiệu, IP, brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="results-count">
            Hiển thị {filteredOrders.length} / {exportOrders.length} đơn
          </div>
        </div>

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="no-orders">Không có đơn xuất hàng nào</div>
        ) : (
          <div className="export-orders-table-wrapper">
            <table className="export-orders-table">
              <thead>
                <tr>
                  <th>Mã đơn hàng</th>
                  <th>Người dùng</th>
                  <th>Mã giới thiệu</th>
                  <th>Brand</th>
                  <th>Số sản phẩm</th>
                  <th>Tổng tiền</th>
                  <th>Số dư trước</th>
                  <th>Số dư sau</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-code-cell">{order.order_code}</td>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-name">
                          <FontAwesomeIcon icon={faUser} className="user-icon" />
                          {order.username || `User #${order.user_id}`}
                        </div>
                        {order.ip_address && (
                          <div className="user-ip">
                            <FontAwesomeIcon icon={faGlobe} className="ip-icon" />
                            {order.ip_address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="referral-code">{order.referral_code || '-'}</span>
                    </td>
                    <td>{order.brand_name || '-'}</td>
                    <td>{Array.isArray(order.products) ? order.products.length : 0}</td>
                    <td className="amount-cell">{formatCurrency(order.total_amount)}</td>
                    <td className="amount-cell">{formatCurrency(order.balance_before)}</td>
                    <td className="amount-cell">{formatCurrency(order.balance_after)}</td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      <button
                        className="view-detail-btn"
                        onClick={() => handleViewDetail(order)}
                      >
                        <FontAwesomeIcon icon={faEye} /> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết đơn xuất hàng</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Thông tin đơn hàng</h3>
                <div className="detail-row">
                  <span className="detail-label">Mã đơn hàng:</span>
                  <span className="detail-value order-code">{selectedOrder.order_code}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Brand:</span>
                  <span className="detail-value">{selectedOrder.brand_name || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tổng tiền:</span>
                  <span className="detail-value amount">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Số dư trước:</span>
                  <span className="detail-value">{formatCurrency(selectedOrder.balance_before)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Số dư sau:</span>
                  <span className="detail-value">{formatCurrency(selectedOrder.balance_after)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Ngày tạo:</span>
                  <span className="detail-value">{formatDate(selectedOrder.created_at)}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>
                  <FontAwesomeIcon icon={faUser} className="section-icon" />
                  Thông tin người dùng
                </h3>
                <div className="detail-row">
                  <span className="detail-label">
                    <FontAwesomeIcon icon={faUser} className="label-icon" />
                    Tên đăng nhập:
                  </span>
                  <span className="detail-value user-name-value">{selectedOrder.username || `User #${selectedOrder.user_id}`}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <FontAwesomeIcon icon={faIdCard} className="label-icon" />
                    Mã giới thiệu:
                  </span>
                  <span className="detail-value referral-code">{selectedOrder.referral_code || '-'}</span>
                </div>
                {selectedOrder.ip_address && (
                  <div className="detail-row">
                    <span className="detail-label">
                      <FontAwesomeIcon icon={faGlobe} className="label-icon" />
                      IP Address:
                    </span>
                    <span className="detail-value">{selectedOrder.ip_address}</span>
                  </div>
                )}
                {selectedOrder.user_created_at && (
                  <div className="detail-row">
                    <span className="detail-label">
                      <FontAwesomeIcon icon={faCalendar} className="label-icon" />
                      Ngày đăng ký:
                    </span>
                    <span className="detail-value">{formatDate(selectedOrder.user_created_at)}</span>
                  </div>
                )}
                {selectedOrder.credit_score !== undefined && (
                  <div className="detail-row">
                    <span className="detail-label">
                      <FontAwesomeIcon icon={faStar} className="label-icon" />
                      Điểm tín dụng:
                    </span>
                    <span className="detail-value credit-score">{selectedOrder.credit_score}</span>
                  </div>
                )}
                {selectedOrder.user_status && (
                  <div className="detail-row">
                    <span className="detail-label">
                      <FontAwesomeIcon icon={selectedOrder.user_status === 'active' ? faCheckCircle : faTimesCircle} className="label-icon" />
                      Trạng thái:
                    </span>
                    <span className={`detail-value status-badge ${selectedOrder.user_status === 'active' ? 'status-active' : 'status-inactive'}`}>
                      {selectedOrder.user_status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h3>Danh sách sản phẩm</h3>
                {Array.isArray(selectedOrder.products) && selectedOrder.products.length > 0 ? (
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Số tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.products.map((product, index) => (
                        <tr key={index}>
                          <td>Sản phẩm {product.productNumber}</td>
                          <td className="amount-cell">{formatCurrency(product.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>Không có sản phẩm</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowDetailModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportOrdersList;

