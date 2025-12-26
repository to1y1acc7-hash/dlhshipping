import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BettingHistory.css';

const API_BASE_URL = '/api';

const BettingHistory = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [bettingTypes, setBettingTypes] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    username: '',
    startDate: '',
    endDate: ''
  });
  const [bettingRecords, setBettingRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalResult: 0
  });

  useEffect(() => {
    loadBettingTypes();
    loadBettingRecords();
  }, [currentPage, itemsPerPage]);

  const loadBettingTypes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/betting-types`);
      if (response.data && Array.isArray(response.data)) {
        setBettingTypes(response.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách loại hình:', error);
      // Mock data for development
      setBettingTypes([
        { id: 1, name: 'Amazon Web Service' },
        { id: 2, name: 'Ebay Australia' },
        { id: 3, name: 'Miền Bắc' },
        { id: 4, name: 'Miền Trung' },
        { id: 5, name: 'Miền Nam' }
      ]);
    }
  };

  const loadBettingRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/admin/betting-history`, {
        params: {
          ...filters,
          page: currentPage,
          limit: itemsPerPage
        }
      });
      if (response.data && response.data.records) {
        setBettingRecords(response.data.records);
        setTotalItems(response.data.total || 0);
        setSummary(response.data.summary || { totalAmount: 0, totalResult: 0 });
      } else {
        setBettingRecords([]);
        setTotalItems(0);
        setSummary({
          totalAmount: 0,
          totalResult: 0
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử đặt cược:', error);
      setBettingRecords([]);
      setTotalItems(0);
      setSummary({
        totalAmount: 0,
        totalResult: 0
      });
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = () => {
    setCurrentPage(1);
    loadBettingRecords();
  };

  const handleReset = () => {
    setFilters({
      type: '',
      username: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
    setTimeout(() => {
      loadBettingRecords();
    }, 100);
  };

  const handleRefresh = () => {
    loadBettingRecords();
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Người dùng', 'Loại hình', 'Kỳ số', 'Chọn', 'Số tiền', 'Tỷ lệ thưởng', 'Kết quả', 'Số tiền trước cược', 'Số tiền sau cược', 'Trạng thái', 'Thời gian đặt', 'Thời gian xử lý'].join(','),
      ...bettingRecords.map(r => [
        r.id,
        r.username,
        r.type,
        r.periodNumber,
        r.selection,
        r.amount.toFixed(2),
        r.odds.toFixed(2),
        r.result.toFixed(2),
        parseFloat(r.amountBefore).toFixed(2),
        parseFloat(r.amountAfter).toFixed(2),
        r.status,
        formatDateTime(r.bettingTime),
        formatDateTime(r.processingTime)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lich-su-dat-cuoc-${new Date().toISOString().split('T')[0]}.csv`;
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
      minute: '2-digit',
      second: '2-digit'
    }).replace(',', '');
  };

  const formatCurrency = (value) => {
    return parseFloat(value).toFixed(2);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageInputChange = (e) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className={`betting-history ${embedded ? 'embedded' : ''}`}>
      {!embedded && (
        <div className="page-header">
          <div className="header-content">
            <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
              ← Quay lại
            </button>
            <h1 className="page-title">Ghi Chú Đặt Cược</h1>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="search-filter-section">
        <div className="filter-row">
          <div className="filter-item">
            <label>Loại hình</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="filter-select"
            >
              <option value="">Vui lòng chọn</option>
              {bettingTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>Tên đăng nhập người chơi</label>
            <input
              type="text"
              placeholder="Vui lòng nhập tên đăng nhập"
              value={filters.username}
              onChange={(e) => setFilters({...filters, username: e.target.value})}
              className="filter-input"
            />
          </div>
          <div className="filter-item">
            <label>Ngày bắt đầu</label>
            <input
              type="date"
              placeholder="Ngày bắt đầu"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="filter-input"
            />
          </div>
          <div className="filter-item">
            <label>Ngày kết thúc</label>
            <input
              type="date"
              placeholder="Ngày kết thúc"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="filter-input"
            />
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn-search" onClick={handleSearch}>
            Tìm kiếm
          </button>
          <button className="btn-reset" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons-section">
        <div className="action-buttons-left">
          <button className="btn-refresh" onClick={handleRefresh}>
            <span className="btn-icon">🔄</span>
            Làm mới
          </button>
        </div>
        <div className="action-buttons-right">
          <button className="btn-icon-only" title="Grid view">⊞</button>
          <button className="btn-icon-only" title="Export" onClick={handleExport}>📥</button>
          <button className="btn-icon-only" title="Print" onClick={handlePrint}>🖨️</button>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-section">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <div className="table-wrapper">
            <table className="betting-table">
              <thead>
                <tr>
                  <th>
                    ID
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>
                    Người dùng
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>
                    Loại hình
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>
                    Kỳ số
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>
                    Chọn
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>
                    Số tiền
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>
                    Tỷ lệ thưởng
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>
                    Kết quả
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>
                    Số tiền trước cược
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>
                    Số tiền sau cược
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>
                    Trạng thái
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>
                    Thời gian đặt
                    <span className="sort-icons">⇅</span>
                  </th>
                  <th>
                    Thời gian xử lý
                    <span className="sort-icons">⇅</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {bettingRecords.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="empty-state">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  <>
                    {bettingRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="id-cell">{record.id}</td>
                        <td>{record.username}</td>
                        <td>{record.type}</td>
                        <td>{record.periodNumber}</td>
                        <td>{record.selection}</td>
                        <td>{formatCurrency(record.amount)}</td>
                        <td>{formatCurrency(record.odds)}</td>
                        <td className="result-cell">+{formatCurrency(record.result)}</td>
                        <td>{formatCurrency(record.amountBefore)}</td>
                        <td>{formatCurrency(record.amountAfter)}</td>
                        <td>
                          <span className="status-badge status-resolved">{record.status}</span>
                        </td>
                        <td>{formatDateTime(record.bettingTime)}</td>
                        <td className="processing-time-cell">{formatDateTime(record.processingTime)}</td>
                      </tr>
                    ))}
                    {/* Summary Row */}
                    <tr className="summary-row">
                      <td colSpan="5" className="summary-label">Tổng cộng:</td>
                      <td className="summary-value">{formatCurrency(summary.totalAmount)}</td>
                      <td></td>
                      <td className="summary-value result-cell">{formatCurrency(summary.totalResult)}</td>
                      <td colSpan="5"></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="pagination-footer">
        <div className="pagination-controls">
          <button 
            className="pagination-btn" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            &lt;
          </button>
          {renderPagination().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="pagination-dots">...</span>
              ) : (
                <button
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
          <button 
            className="pagination-btn" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
        <div className="pagination-info">
          <label>
            Xem trang:
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={handlePageInputChange}
              className="page-input"
            />
          </label>
          <button className="btn-refresh-small" onClick={handleRefresh}>
            Làm mới
          </button>
          <span className="total-items">Tổng cộng {totalItems} mục</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="items-per-page-select"
          >
            <option value="10">10 mục/trang</option>
            <option value="20">20 mục/trang</option>
            <option value="50">50 mục/trang</option>
            <option value="100">100 mục/trang</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default BettingHistory;

