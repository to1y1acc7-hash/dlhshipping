import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faPrint } from '@fortawesome/free-solid-svg-icons';
import './EditLotteryResults.css';

const API_BASE_URL = '/api';

const EditLotteryResults = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [lotteryTypes, setLotteryTypes] = useState([]);
  const [selectedLotteryType, setSelectedLotteryType] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    loadLotteryTypes();
    loadResults();
  }, []);

  const loadLotteryTypes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/lottery-types`);
      if (response.data && Array.isArray(response.data)) {
        setLotteryTypes(response.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách loại xổ số:', error);
      setLotteryTypes([]);
    }
  };

  const loadResults = async () => {
    try {
      setLoading(true);
      // Lấy các kỳ đang diễn ra từ poll_results
      const response = await axios.get(`${API_BASE_URL}/admin/poll-results/current`, {
        headers: {
          'admin-id': localStorage.getItem('adminId') || '',
          'admin-username': localStorage.getItem('adminUsername') || 'Admin'
        }
      });
      if (response.data && Array.isArray(response.data)) {
        setResults(response.data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải kết quả:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = () => {
    loadResults();
  };

  const handleReset = async () => {
    // Xác nhận trước khi xóa
    const confirmed = window.confirm(
      '⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ lịch sử kết quả khỏi hệ thống?\n\n' +
      'Hành động này không thể hoàn tác!'
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/admin/poll-results`, {
        headers: {
          'admin-id': localStorage.getItem('adminId') || '',
          'admin-username': localStorage.getItem('adminUsername') || 'Admin'
        }
      });
      
      if (response.data.success) {
        alert(`Đã xóa ${response.data.deleted} bản ghi lịch sử kết quả!`);
        setResults([]);
        setSelectedLotteryType('');
      }
    } catch (error) {
      console.error('Lỗi khi xóa lịch sử kết quả:', error);
      alert(error.response?.data?.error || 'Lỗi khi xóa lịch sử kết quả!');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadResults();
  };

  const handleSaveAll = async () => {
    // Không cần chức năng này vì chỉ chỉnh sửa từng kỳ
    alert('Vui lòng chỉnh sửa từng kỳ bằng nút "Sửa"');
  };

  const handleEdit = (row) => {
    console.log('✏️ Editing row:', row);
    // Parse result để lấy 2 đáp án (có thể là "A, B" hoặc chỉ "A")
    let currentResult1 = row.result1 || row.winning_rate || '';
    let currentResult2 = row.result2 || row.winning_rate_2 || '';
    
    // Nếu result là "A, B" format
    if (row.result && row.result.includes(',')) {
      const parts = row.result.split(',').map(s => s.trim());
      currentResult1 = parts[0] || 'A';
      currentResult2 = parts[1] || '';
    } else if (row.result) {
      currentResult1 = row.result;
    }
    
    // Nếu result là "Sản phẩm 1", "Sản phẩm 2", etc., chuyển thành A, B, C, D
    if (currentResult1.includes('Sản phẩm')) {
      const productNumber = currentResult1.match(/\d+/);
      if (productNumber) {
        const num = parseInt(productNumber[0]);
        currentResult1 = ['A', 'B', 'C', 'D'][num - 1] || 'A';
      }
    }
    
    // Chỉ chấp nhận A, B, C, D
    if (!['A', 'B', 'C', 'D'].includes(currentResult1)) {
      currentResult1 = 'A'; // Default
    }
    if (currentResult2 && !['A', 'B', 'C', 'D'].includes(currentResult2)) {
      currentResult2 = '';
    }
    
    setEditingRow(row.id);
    setEditData({
      result: currentResult1,
      result2: currentResult2 || '',
      openTime: row.openTime ? new Date(row.openTime).toISOString().slice(0, 16) : ''
    });
  };

  const handleSave = async (row) => {
    try {
      const winningProduct = editData.result || row.result1 || row.winning_rate || 'A';
      const winningProduct2 = editData.result2 || row.result2 || row.winning_rate_2 || null;
      
      console.log('💾 Saving poll result:', {
        id: row.id,
        winningProduct,
        winningProduct2,
        currentResult: row.result,
        editData: editData
      });
      
      // Validate winningProduct (must be A, B, C, or D)
      if (!winningProduct || !['A', 'B', 'C', 'D'].includes(winningProduct)) {
        alert('Đáp án 1 phải là A, B, C, hoặc D!');
        return;
      }
      
      // Validate winningProduct2 if provided
      if (winningProduct2 && !['A', 'B', 'C', 'D'].includes(winningProduct2)) {
        alert('Đáp án 2 phải là A, B, C, hoặc D!');
        return;
      }

      const adminId = localStorage.getItem('adminId') || '';
      const adminUsername = localStorage.getItem('adminUsername') || 'Admin';
      
      console.log('📤 Sending request to:', `${API_BASE_URL}/admin/poll-results/${row.id}`);
      console.log('📤 Request body:', { winningProduct, winningProduct2, editor: adminUsername });
      console.log('📤 Request headers:', { 'admin-id': adminId, 'admin-username': adminUsername });

      const response = await axios.put(`${API_BASE_URL}/admin/poll-results/${row.id}`, {
        winningProduct: winningProduct,
        winningProduct2: winningProduct2 || null,
        editor: adminUsername
      }, {
        headers: {
          'admin-id': adminId,
          'admin-username': adminUsername
        }
      });
      
      console.log('✅ Response:', response.data);
      
      if (response.data && response.data.success) {
        const resultDisplay = winningProduct2 
          ? `${winningProduct}, ${winningProduct2}` 
          : winningProduct;
        const updatedResult = {
          ...row,
          result: resultDisplay,
          result1: winningProduct,
          result2: winningProduct2,
          editor: adminUsername,
          saveTime: new Date().toISOString()
        };
        setResults(results.map(r => r.id === row.id ? updatedResult : r));
        setEditingRow(null);
        setEditData({});
        alert('Lưu thành công!');
        // Reload để cập nhật dữ liệu mới nhất
        setTimeout(() => {
          loadResults();
        }, 500);
      } else {
        alert('Lưu không thành công! Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('❌ Lỗi khi lưu:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      alert(error.response?.data?.error || error.message || 'Lỗi khi lưu!');
    }
  };

  const handleCancel = (row) => {
    setEditingRow(null);
    setEditData({});
  };

  const handleExport = () => {
    // Export functionality
    const csv = [
      ['Tên loại xổ số', 'Key', 'Kỳ số', 'Kết quả', 'Người chỉnh sửa', 'Thời gian mở', 'Thời gian lưu'].join(','),
      ...results.map(r => [
        r.lotteryTypeName,
        r.key,
        r.periodNumber,
        r.result,
        r.editor || '',
        r.openTime ? new Date(r.openTime).toLocaleString('vi-VN') : '',
        r.saveTime ? new Date(r.saveTime).toLocaleString('vi-VN') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ket-qua-xo-so-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`edit-lottery-results ${embedded ? 'embedded' : ''}`}>
      {!embedded && (
        <div className="page-header">
          <div className="header-content">
            <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
              ← Quay lại
            </button>
            <h1 className="page-title">Chỉnh Kết Quả Xổ Số</h1>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
          📋 Kỳ đang diễn ra - Chỉnh sửa kết quả
        </h3>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Danh sách các kỳ đang diễn ra. Bạn có thể chỉnh sửa kết quả (A, B, C, hoặc D) cho từng kỳ bằng cách nhấn nút "Sửa".
        </p>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons-section">
        <div className="action-buttons-left">
          <button className="btn-refresh" onClick={handleRefresh}>
            Làm mới
          </button>
        </div>
        <div className="action-buttons-right">
          <button className="btn-icon-only" title="Export" onClick={handleExport}>
            <FontAwesomeIcon icon={faDownload} />
          </button>
          <button className="btn-icon-only" title="Print" onClick={handlePrint}>
            <FontAwesomeIcon icon={faPrint} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-section">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <div className="table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Tên loại xổ số</th>
                  <th>
                    Key
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>
                    Kỳ số
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>Kết quả</th>
                  <th>
                    Người chỉnh sửa
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>Thời gian mở thưởng</th>
                  <th>
                    Thời gian lưu
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  results.map((row) => (
                    <tr key={row.id}>
                      <td>{row.lotteryTypeName}</td>
                      <td>{row.key}</td>
                      <td>{row.periodNumber}</td>
                      <td>
                        {editingRow === row.id ? (
                          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                            <select
                              value={editData.result || ''}
                              onChange={(e) => {
                                console.log('🔄 Selected result 1:', e.target.value);
                                setEditData({...editData, result: e.target.value});
                              }}
                              className="edit-input"
                              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                              <option value="">Chọn đáp án 1</option>
                              <option value="A">A (Sản phẩm 1)</option>
                              <option value="B">B (Sản phẩm 2)</option>
                              <option value="C">C (Sản phẩm 3)</option>
                              <option value="D">D (Sản phẩm 4)</option>
                            </select>
                            <select
                              value={editData.result2 || ''}
                              onChange={(e) => {
                                console.log('🔄 Selected result 2:', e.target.value);
                                setEditData({...editData, result2: e.target.value});
                              }}
                              className="edit-input"
                              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                              <option value="">Chọn đáp án 2 (tùy chọn)</option>
                              <option value="A">A (Sản phẩm 1)</option>
                              <option value="B">B (Sản phẩm 2)</option>
                              <option value="C">C (Sản phẩm 3)</option>
                              <option value="D">D (Sản phẩm 4)</option>
                            </select>
                          </div>
                        ) : (
                          <span className="result-text">{row.result || row.winning_rate || '—'}</span>
                        )}
                      </td>
                      <td>{row.editor || '—'}</td>
                      <td>
                        {formatDateTime(row.openTime)}
                      </td>
                      <td>{formatDateTime(row.saveTime || row.created_at)}</td>
                      <td>
                        <div className="row-actions">
                          {editingRow === row.id ? (
                            <>
                              <button className="btn-save-row" onClick={() => handleSave(row)}>
                                Lưu
                              </button>
                              <button className="btn-cancel-row" onClick={() => handleCancel(row)}>
                                Hủy
                              </button>
                            </>
                          ) : (
                            <button className="btn-edit-row" onClick={() => handleEdit(row)}>
                              Sửa
                            </button>
                          )}
                        </div>
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
};

export default EditLotteryResults;

