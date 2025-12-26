import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CategoryManagement.css';

const API_BASE_URL = '/api';

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    status: 'active',
    description: '',
    image: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/categories`);
      setCategories(res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
      setError(err.response?.data?.error || 'Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      quantity: 0,
      status: 'active',
      description: '',
      image: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const payload = {
      name: formData.name.trim(),
      quantity: Number.isFinite(Number(formData.quantity))
        ? parseInt(formData.quantity, 10)
        : 0,
      status: formData.status,
      description: formData.description,
      image: formData.image
    };

    try {
      setSaving(true);
      if (editingId) {
        await axios.put(`${API_BASE_URL}/categories/${editingId}`, payload);
        setMessage('Cập nhật danh mục thành công');
      } else {
        await axios.post(`${API_BASE_URL}/categories`, payload);
        setMessage('Thêm danh mục thành công');
      }
      await loadCategories();
      resetForm();
    } catch (err) {
      console.error('Lỗi lưu danh mục:', err);
      setError(err.response?.data?.error || 'Không thể lưu danh mục');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      quantity: category.quantity ?? 0,
      status: category.status || 'active',
      description: category.description || '',
      image: category.image || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Bạn có chắc muốn xóa danh mục này?');
    if (!confirmDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/categories/${id}`);
      setMessage('Đã xóa danh mục');
      await loadCategories();
    } catch (err) {
      console.error('Lỗi xóa danh mục:', err);
      setError(err.response?.data?.error || 'Không thể xóa danh mục');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="category-page">
      <div className="category-header">
        <h1>Quản lý phân loại</h1>
        <p>Danh sách phân loại với các trường ID, Tên, Số lượng, Trạng thái, Thời gian tạo và thao tác.</p>
      </div>

      <div className="category-card">
        <h2>{editingId ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h2>
        {message && <div className="category-alert success">{message}</div>}
        {error && <div className="category-alert error">{error}</div>}
        <form className="category-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Tên danh mục <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên danh mục"
              required
            />
          </div>
          <div className="form-row">
            <label>Mô tả</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Nhập mô tả (tùy chọn)"
            />
          </div>
          <div className="form-row">
            <label>Số lượng</label>
            <input
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>Ảnh (URL)</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="form-row">
            <label>Trạng thái</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Mở</option>
              <option value="inactive">Đóng</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
            </button>
            {editingId && (
              <button type="button" className="secondary" onClick={resetForm}>
                Hủy chỉnh sửa
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="category-card">
        <div className="table-header">
          <h2>Danh sách phân loại</h2>
          <span className="pill">Tổng: {categories.length}</span>
        </div>
        {loading ? (
          <div className="category-loading">Đang tải...</div>
        ) : (
          <div className="category-table-wrapper">
            <table className="category-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Mô tả</th>
                  <th>Ảnh</th>
                  <th>Số lượng</th>
                  <th>Trạng thái</th>
                  <th>Thời gian tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty">Chưa có danh mục</td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.id}</td>
                      <td>{category.name}</td>
                      <td className="desc-col">{category.description || '-'}</td>
                      <td>
                        {category.image ? (
                          <img src={category.image} alt={category.name} className="thumb-img" />
                        ) : (
                          <span className="no-img">Không có</span>
                        )}
                      </td>
                      <td>{category.quantity ?? 0}</td>
                      <td>
                        <span className={`status-badge ${category.status === 'active' ? 'active' : 'inactive'}`}>
                          {category.status === 'active' ? 'Mở' : 'Đóng'}
                        </span>
                      </td>
                      <td>{formatDate(category.created_at)}</td>
                      <td className="actions">
                        <button onClick={() => handleEdit(category)} className="edit-btn">Sửa</button>
                        <button onClick={() => handleDelete(category.id)} className="delete-btn">Xóa</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryManagement;


