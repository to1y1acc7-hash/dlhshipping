import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ExportOrdersList from './ExportOrdersList';
import './StaffDashboard.css';

const API_BASE_URL = '/api';

const StaffDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('users');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [staffInfo, setStaffInfo] = useState(null);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProductConfirm, setDeleteProductConfirm] = useState(null);
  const [importFormData, setImportFormData] = useState({
    productName: '',
    productCode: '',
    quantity: '',
    unitPrice: '',
    supplier: '',
    notes: ''
  });
  const [productFormData, setProductFormData] = useState({
    name: '',
    productCode: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    supplier: '',
    status: 'active'
  });
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submittingImport, setSubmittingImport] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra đăng nhập staff
    const isStaffLoggedIn = localStorage.getItem('isStaffLoggedIn');
    const staffId = localStorage.getItem('staffId');
    const referralCode = localStorage.getItem('staffReferralCode');
    
    if (!isStaffLoggedIn || !staffId) {
      navigate('/staff/login');
      return;
    }

    // Load thông tin staff và users
    loadStaffInfo();
    loadUsers();
    loadOrders();
    loadProducts();
  }, [navigate]);

  const loadStaffInfo = async () => {
    try {
      const staffId = localStorage.getItem('staffId');
      const response = await axios.get(`${API_BASE_URL}/admin/staff`);
      if (response.data && Array.isArray(response.data)) {
        const staff = response.data.find(s => s.id === parseInt(staffId));
        if (staff) {
          setStaffInfo(staff);
          localStorage.setItem('staffReferralCode', staff.referral_code || '');
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin staff:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const staffId = localStorage.getItem('staffId');
      const referralCode = localStorage.getItem('staffReferralCode');
      
      const response = await axios.get(`${API_BASE_URL}/staff/users`, {
        params: {
          staffId: staffId,
          referralCode: referralCode
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWithdrawal = async (userId, currentValue) => {
    try {
      const newValue = !currentValue;
      const staffId = localStorage.getItem('staffId');
      const referralCode = localStorage.getItem('staffReferralCode');
      
      const response = await axios.put(`${API_BASE_URL}/staff/users/${userId}/withdrawal`, {
        withdrawal_enabled: newValue
      }, {
        params: {
          staffId: staffId,
          referralCode: referralCode
        }
      });
      
      if (response.data.success) {
        setUsers(response.data.users);
        // Thực hiện trực tiếp, không hiển thị alert
      }
    } catch (error) {
      // Nếu có lỗi, vẫn cần thông báo
      console.error('Lỗi khi cập nhật trạng thái rút tiền:', error);
      // Reload users để khôi phục trạng thái cũ
      loadUsers();
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const staffId = localStorage.getItem('staffId');
      const referralCode = localStorage.getItem('staffReferralCode');
      
      const response = await axios.get(`${API_BASE_URL}/staff/orders`, {
        params: {
          staffId: staffId,
          referralCode: referralCode
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách đơn hàng:', error);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/staff/products`);
      
      if (response.data && Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách sản phẩm:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isStaffLoggedIn');
    localStorage.removeItem('staffUsername');
    localStorage.removeItem('staffId');
    localStorage.removeItem('staffReferralCode');
    // Gửi event để Header component cập nhật
    window.dispatchEvent(new Event('staffLogout'));
    navigate('/staff/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Chờ xử lý',
      'processing': 'Đang xử lý',
      'completed': 'Đã hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      'pending': 'status-pending',
      'processing': 'status-processing',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return classMap[status] || '';
  };

  const handleImportFormChange = (e) => {
    setImportFormData({
      ...importFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra loại file
      if (!file.type.match('image.*')) {
        alert('Vui lòng chọn file ảnh');
        return;
      }
      
      // Kiểm tra kích thước file (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB');
        return;
      }
      
      setProductImage(file);
      
      // Tạo preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductFormChange = (e) => {
    setProductFormData({
      ...productFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddProductClick = () => {
    setEditingProduct(null);
    setProductFormData({
      name: '',
      productCode: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      supplier: '',
      status: 'active'
    });
    setProductImage(null);
    setImagePreview(null);
    setShowProductForm(true);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('//')) {
      return imagePath;
    }
    if (imagePath.startsWith('/uploads')) {
      return imagePath; // Vite sẽ proxy
    }
    return imagePath;
  };

  const handleEditProductClick = (product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name || '',
      productCode: product.product_code || '',
      description: product.description || '',
      price: product.price || '',
      category: product.category || '',
      stock: product.stock || '',
      supplier: product.supplier || '',
      status: product.status || 'active'
    });
    setProductImage(null);
    setImagePreview(product.image ? getImageUrl(product.image) : null);
    setShowProductForm(true);
  };

  const handleDeleteProductClick = (product) => {
    setDeleteProductConfirm(product);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    if (!productFormData.name.trim()) {
      alert('Vui lòng nhập tên sản phẩm');
      return;
    }
    
    // Ảnh không bắt buộc
    
    try {
      setSubmittingProduct(true);
      
      const formData = new FormData();
      // Không cần gửi staffId
      formData.append('name', productFormData.name.trim());
      formData.append('productCode', productFormData.productCode.trim());
      formData.append('description', productFormData.description.trim());
      formData.append('price', parseFloat(productFormData.price) || 0);
      formData.append('category', productFormData.category.trim());
      formData.append('stock', parseInt(productFormData.stock) || 0);
      formData.append('supplier', productFormData.supplier.trim());
      formData.append('status', productFormData.status);
      
      if (productImage) {
        formData.append('productImage', productImage);
      }
      
      let response;
      if (editingProduct) {
        response = await axios.put(`${API_BASE_URL}/staff/products/${editingProduct.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        console.log('Creating new product with data:', {
          name: productFormData.name,
          hasImage: !!productImage
        });
        response = await axios.post(`${API_BASE_URL}/staff/products`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('Product creation response:', response.data);
      }
      
      if (response.data.success) {
        alert(editingProduct ? 'Sản phẩm đã được cập nhật thành công!' : 'Sản phẩm đã được thêm thành công!');
        setProductFormData({
          name: '',
          productCode: '',
          description: '',
          price: '',
          category: '',
          stock: '',
          supplier: '',
          status: 'active'
        });
        setProductImage(null);
        setImagePreview(null);
        setEditingProduct(null);
        setShowProductForm(false);
        // Force reload products with cache busting
        setTimeout(() => {
          loadProducts();
        }, 100);
      }
    } catch (error) {
      console.error('Lỗi khi lưu sản phẩm:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error URL:', error.config?.url);
      
      let errorMessage = 'Có lỗi xảy ra khi lưu sản phẩm';
      if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy API endpoint. Vui lòng kiểm tra backend server có đang chạy không.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProductConfirm = async () => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/staff/products/${deleteProductConfirm.id}`);
      if (response.data.success) {
        alert('Sản phẩm đã được xóa thành công!');
        setDeleteProductConfirm(null);
        loadProducts();
      }
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      alert(error.response?.data?.error || 'Có lỗi xảy ra khi xóa sản phẩm');
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    
    if (!importFormData.productName.trim()) {
      alert('Vui lòng nhập tên sản phẩm');
      return;
    }
    
    if (!importFormData.quantity || parseFloat(importFormData.quantity) <= 0) {
      alert('Vui lòng nhập số lượng hợp lệ');
      return;
    }
    
    if (!productImage) {
      alert('Vui lòng chọn ảnh sản phẩm');
      return;
    }
    
    try {
      setSubmittingImport(true);
      const staffId = localStorage.getItem('staffId');
      
      // Tạo FormData để gửi file
      const formData = new FormData();
      formData.append('staffId', parseInt(staffId));
      formData.append('productName', importFormData.productName.trim());
      formData.append('productCode', importFormData.productCode.trim());
      formData.append('quantity', parseInt(importFormData.quantity));
      formData.append('unitPrice', parseFloat(importFormData.unitPrice) || 0);
      formData.append('supplier', importFormData.supplier.trim());
      formData.append('notes', importFormData.notes.trim());
      formData.append('productImage', productImage);
      
      const response = await axios.post(`${API_BASE_URL}/staff/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        alert('Sản phẩm đã được thêm thành công!');
        setImportFormData({
          productName: '',
          productCode: '',
          quantity: '',
          unitPrice: '',
          supplier: '',
          notes: ''
        });
        setProductImage(null);
        setImagePreview(null);
        setShowImportForm(false);
      }
    } catch (error) {
      console.error('Lỗi khi thêm sản phẩm:', error);
      alert(error.response?.data?.error || 'Có lỗi xảy ra khi thêm sản phẩm');
    } finally {
      setSubmittingImport(false);
    }
  };

  return (
    <div className="staff-dashboard">
      {/* Sidebar */}
      <div className={`staff-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="staff-sidebar-header">
          <h2 className="staff-sidebar-title">NHÂN VIÊN</h2>
          <button className="staff-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◄' : '►'}
          </button>
        </div>
        
        {sidebarOpen && (
          <div className="staff-sidebar-content">
            <div className="staff-info-card">
              <div className="staff-info-item">
                <span className="staff-info-label">Tên đăng nhập:</span>
                <span className="staff-info-value">{staffInfo?.username || localStorage.getItem('staffUsername')}</span>
              </div>
              <div className="staff-info-item">
                <span className="staff-info-label">Mã giới thiệu:</span>
                <span className="staff-info-value referral-code">{staffInfo?.referral_code || localStorage.getItem('staffReferralCode') || 'Chưa có'}</span>
              </div>
              <div className="staff-info-item">
                <span className="staff-info-label">Họ tên:</span>
                <span className="staff-info-value">{staffInfo?.full_name || '-'}</span>
              </div>
            </div>

            <nav className="staff-nav">
              <div 
                className={`staff-nav-item ${activeMenu === 'users' ? 'active' : ''}`}
                onClick={() => setActiveMenu('users')}
              >
                <span>Thành viên của tôi</span>
                <span className="nav-count">({users.length})</span>
              </div>
              <div 
                className={`staff-nav-item ${activeMenu === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveMenu('orders')}
              >
                <span>Đơn hàng Order</span>
                <span className="nav-count">({orders.length})</span>
              </div>
              <div 
                className={`staff-nav-item ${activeMenu === 'products' ? 'active' : ''}`}
                onClick={() => setActiveMenu('products')}
              >
                <span>Quản lý sản phẩm</span>
                <span className="nav-count">({products.length})</span>
              </div>
              <div 
                className={`staff-nav-item ${activeMenu === 'export-orders' ? 'active' : ''}`}
                onClick={() => setActiveMenu('export-orders')}
              >
                <span>Đơn Xuất Hàng</span>
              </div>
            </nav>

            <div className="staff-sidebar-footer">
              <button className="staff-logout-btn" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="staff-main-content">
        <div className="staff-content-header">
          <h1 className="staff-page-title">
            {activeMenu === 'users' ? 'Thành viên của tôi' : 
             activeMenu === 'orders' ? 'Đơn hàng Order' : 
             activeMenu === 'products' ? 'Quản lý sản phẩm' :
             'Thêm sản phẩm'}
          </h1>
          {activeMenu !== 'import' && (
            <button className="staff-refresh-btn" onClick={() => {
              if (activeMenu === 'users') loadUsers();
              else if (activeMenu === 'orders') loadOrders();
              else if (activeMenu === 'products') loadProducts();
            }}>
              Làm mới
            </button>
          )}
        </div>

        {/* Users Section */}
        {activeMenu === 'users' && (
          <div className="staff-table-section">
            {loading ? (
              <div className="staff-loading">Đang tải...</div>
            ) : users.length === 0 ? (
              <div className="staff-empty-state">
                <p>Bạn chưa có thành viên nào đăng ký bằng mã giới thiệu của bạn.</p>
              </div>
            ) : (
              <div className="staff-table-wrapper">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tên đăng nhập</th>
                      <th>Số dư</th>
                      <th>Điểm tín nhiệm</th>
                      <th>IP</th>
                      <th>Rút tiền</th>
                      <th>Trạng thái</th>
                      <th>Ngày đăng ký</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{parseFloat(user.balance || 0).toLocaleString('vi-VN')}</td>
                        <td>{user.credit_score || 100}</td>
                        <td>{user.ip_address || user.last_ip || '-'}</td>
                        <td>
                          <label className="toggle-switch" onClick={() => handleToggleWithdrawal(user.id, user.withdrawal_enabled)}>
                            <input type="checkbox" checked={user.withdrawal_enabled} readOnly />
                            <span className="slider">{user.withdrawal_enabled ? 'Mở' : 'Đóng'}</span>
                          </label>
                        </td>
                        <td>
                          <span className={`staff-status-badge status-${user.status || 'active'}`}>
                            {user.status === 'active' ? 'Hoạt động' : 
                             user.status === 'frozen' ? 'Đóng băng' : 
                             user.status || 'Hoạt động'}
                          </span>
                        </td>
                        <td>{user.created_at ? user.created_at.split(' ')[0] : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="staff-table-footer">
              <span>Tổng cộng: {users.length} thành viên</span>
            </div>
          </div>
        )}

        {/* Orders Section */}
        {activeMenu === 'orders' && (
          <div className="staff-table-section">
            {ordersLoading ? (
              <div className="staff-loading">Đang tải...</div>
            ) : orders.length === 0 ? (
              <div className="staff-empty-state">
                <p>Chưa có đơn hàng nào từ các thành viên của bạn.</p>
              </div>
            ) : (
              <div className="staff-table-wrapper">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>SĐT</th>
                      <th>Link sản phẩm</th>
                      <th>Số lượng</th>
                      <th>Ghi chú</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>#{order.order_number || order.id}</td>
                        <td>{order.customer_name || '-'}</td>
                        <td>{order.customer_phone || '-'}</td>
                        <td className="order-link-cell">
                          {order.product_link ? (
                            <a href={order.product_link} target="_blank" rel="noopener noreferrer">
                              {order.product_link.length > 30 ? order.product_link.substring(0, 30) + '...' : order.product_link}
                            </a>
                          ) : '-'}
                        </td>
                        <td>{order.quantity || 0}</td>
                        <td className="order-notes-cell">{order.notes || '-'}</td>
                        <td>
                          <span className={`staff-status-badge ${getStatusClass(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td>{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="staff-table-footer">
              <span>Tổng cộng: {orders.length} đơn hàng</span>
            </div>
          </div>
        )}

        {/* Products Section */}
        {activeMenu === 'export-orders' && (
          <ExportOrdersList />
        )}

        {activeMenu === 'products' && !showProductForm && (
          <div className="staff-table-section">
            <div className="staff-import-header">
              <h2>Quản lý sản phẩm</h2>
              <button 
                className="staff-add-btn"
                onClick={handleAddProductClick}
              >
                + Thêm sản phẩm
              </button>
            </div>
            
            {productsLoading ? (
              <div className="staff-loading">Đang tải...</div>
            ) : products.length === 0 ? (
              <div className="staff-empty-state">
                <p>Chưa có sản phẩm nào. Hãy thêm sản phẩm mới.</p>
                <button 
                  className="staff-add-btn"
                  onClick={handleAddProductClick}
                  style={{ marginTop: '10px' }}
                >
                  + Thêm sản phẩm
                </button>
              </div>
            ) : (
              <div className="staff-table-wrapper">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Ảnh</th>
                      <th>Tên sản phẩm</th>
                      <th>Mã</th>
                      <th>Giá</th>
                      <th>Số lượng</th>
                      <th>Danh mục</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>
                          {product.image ? (
                            <img 
                              src={getImageUrl(product.image)} 
                              alt={product.name}
                              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/50x50?text=No+Image';
                              }}
                            />
                          ) : (
                            <div style={{ width: '50px', height: '50px', backgroundColor: '#ddd', borderRadius: '4px' }}></div>
                          )}
                        </td>
                        <td>
                          <a 
                            href={`/product/${product.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/product/${product.id}`);
                            }}
                            style={{ color: '#3498db', textDecoration: 'none', fontWeight: 500 }}
                          >
                            {product.name}
                          </a>
                        </td>
                        <td>{product.product_code || '-'}</td>
                        <td>{parseFloat(product.price || 0).toLocaleString('vi-VN')}</td>
                        <td>{product.stock || 0}</td>
                        <td>{product.category || '-'}</td>
                        <td>
                          <span className={`staff-status-badge status-${product.status || 'active'}`}>
                            {product.status === 'active' ? 'Hoạt động' : 'Ngừng bán'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="staff-edit-btn"
                            onClick={() => handleEditProductClick(product)}
                            style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px', backgroundColor: 'rgb(231, 76, 60)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Sửa
                          </button>
                          <button 
                            className="staff-delete-btn"
                            onClick={() => handleDeleteProductClick(product)}
                            style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="staff-table-footer">
              <span>Tổng cộng: {products.length} sản phẩm</span>
            </div>
          </div>
        )}

        {/* Product Form Section - Hiển thị riêng khi showProductForm = true */}
        {activeMenu === 'products' && showProductForm && (
          <div className="staff-table-section">
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                  setProductFormData({
                    name: '',
                    productCode: '',
                    description: '',
                    price: '',
                    category: '',
                    stock: '',
                    supplier: '',
                    status: 'active'
                  });
                  setProductImage(null);
                  setImagePreview(null);
                }}
              >
                ← Quay lại danh sách
              </button>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <form className="staff-import-form" onSubmit={handleProductSubmit}>
                <div className="form-group">
                  <label>Tên sản phẩm <span className="required">*</span></label>
                  <input
                    type="text"
                      name="name"
                      value={productFormData.name}
                      onChange={handleProductFormChange}
                    placeholder="Nhập tên sản phẩm"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Mã sản phẩm</label>
                  <input
                    type="text"
                    name="productCode"
                      value={productFormData.productCode}
                      onChange={handleProductFormChange}
                    placeholder="Nhập mã sản phẩm (SKU, barcode, ...)"
                  />
                </div>
                
                <div className="form-group">
                    <label>Mô tả</label>
                    <textarea
                      name="description"
                      value={productFormData.description}
                      onChange={handleProductFormChange}
                      placeholder="Mô tả sản phẩm"
                      rows="3"
                  />
                </div>
                  
                  <div className="form-group">
                    <label>Ảnh sản phẩm (tùy chọn)</label>
                    <input
                      type="file"
                      name="productImage"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {imagePreview && (
                      <div className="image-preview" style={{ marginTop: '10px' }}>
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ 
                            maxWidth: '200px', 
                            maxHeight: '200px', 
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                          }} 
                        />
                        {editingProduct && (
                          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                            Ảnh hiện tại. Chọn file mới để thay thế.
                          </p>
                        )}
                      </div>
                    )}
                    {editingProduct && !imagePreview && editingProduct.image && (
                      <div className="image-preview" style={{ marginTop: '10px' }}>
                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Ảnh hiện tại:</p>
                        <img 
                          src={getImageUrl(editingProduct.image)} 
                          alt="Current" 
                          style={{ 
                            maxWidth: '200px', 
                            maxHeight: '200px', 
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                          }} 
                        />
                      </div>
                    )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                      <label>Giá</label>
                    <input
                      type="number"
                        name="price"
                        value={productFormData.price}
                        onChange={handleProductFormChange}
                      placeholder="0"
                        min="0"
                    />
                  </div>
                  
                  <div className="form-group">
                      <label>Số lượng tồn kho</label>
                    <input
                      type="number"
                        name="stock"
                        value={productFormData.stock}
                        onChange={handleProductFormChange}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Danh mục</label>
                      <input
                        type="text"
                        name="category"
                        value={productFormData.category}
                        onChange={handleProductFormChange}
                        placeholder="Danh mục sản phẩm"
                      />
                </div>
                
                <div className="form-group">
                  <label>Nhà cung cấp</label>
                  <input
                    type="text"
                    name="supplier"
                        value={productFormData.supplier}
                        onChange={handleProductFormChange}
                    placeholder="Tên nhà cung cấp"
                  />
                    </div>
                </div>
                
                <div className="form-group">
                    <label>Trạng thái</label>
                    <select
                      name="status"
                      value={productFormData.status}
                      onChange={handleProductFormChange}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Ngừng bán</option>
                    </select>
                </div>
                
                <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={submittingProduct}>
                      {submittingProduct ? 'Đang lưu...' : editingProduct ? 'Cập nhật' : 'Thêm sản phẩm'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={() => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                      setProductFormData({
                        name: '',
                        productCode: '',
                        description: '',
                        price: '',
                        category: '',
                        stock: '',
                      supplier: '',
                        status: 'active'
                    });
                      setProductImage(null);
                      setImagePreview(null);
                  }}>
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
            
        {deleteProductConfirm && (
              <div style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                backgroundColor: 'rgba(0,0,0,0.5)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '20px', 
                  borderRadius: '8px',
                  maxWidth: '400px'
                }}>
                  <h3>Xác nhận xóa</h3>
                  <p>Bạn có chắc chắn muốn xóa sản phẩm <strong>{deleteProductConfirm.name}</strong>?</p>
                  <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => setDeleteProductConfirm(null)}
                      style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={handleDeleteProductConfirm}
                      style={{ padding: '8px 16px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;

