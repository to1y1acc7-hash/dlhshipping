import React, { useEffect, useState } from 'react';
import './AccountNew.css';
import axios from 'axios';

export default function AccountNew() {
  const [summary, setSummary] = useState({
    balance: { value: '0', label: 'Số tiền khớp/không khớp' },
    stats: [
      { value: '0', label: 'Số tiền mỗi đơn' },
      { value: '0', label: 'Số tiền nạp' },
      { value: '0', label: 'Số tiền rút' },
      { value: '0', label: 'Số tiền khớp' },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatNumber = (num) => {
    const n = parseFloat(num);
    if (Number.isNaN(n)) return '0';
    return n.toLocaleString('vi-VN');
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError('');
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setError('Không tìm thấy userId trong phiên đăng nhập');
          setLoading(false);
          return;
        }
        const res = await axios.get('/api/account/summary', {
          headers: { 'user-id': userId },
        });
        const data = res.data || {};
        const stats = data.stats || {};

        setSummary({
          balance: {
            value: formatNumber(stats.matched ?? data.balance ?? 0),
            label: 'Số tiền khớp/không khớp',
          },
          stats: [
            { value: formatNumber(stats.perOrder ?? 0), label: 'Số tiền mỗi đơn' },
            { value: formatNumber(stats.deposit ?? 0), label: 'Số tiền nạp' },
            { value: formatNumber(stats.withdraw ?? 0), label: 'Số tiền rút' },
            { value: formatNumber(stats.matched ?? 0), label: 'Số tiền khớp' },
          ],
        });
      } catch (err) {
        setError('Không thể tải thống kê tài khoản');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="account-new-page">
      {loading && <div className="account-loading">Đang tải...</div>}

      <div className="account-balance-card">
        <div className="balance-label">{summary.balance.label}</div>
        <div className="balance-value">{summary.balance.value}</div>
      </div>

      <div className="account-stats-row">
        {summary.stats.map((item, idx) => (
          <div className="account-stat-box" key={idx}>
            <div className="stat-value">{item.value}</div>
            <div className="stat-label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

