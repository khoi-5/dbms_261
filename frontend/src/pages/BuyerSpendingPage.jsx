import { useState, useEffect } from 'react';
import { api } from '../services/api';

const formatVnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')} đ`;

const PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444'];

function SpendingDonut({ items, total }) {
  const [hovered, setHovered] = useState(null);
  const size = 210;
  const stroke = 30;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  if (!items.length || Number(total) <= 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
        Chưa có dữ liệu chi tiêu để hiển thị biểu đồ.
      </div>
    );
  }

  const segments = items.reduce((acc, item, idx) => {
    const fraction = Number(item.totalSpent) / Number(total);
    const dash = fraction * circumference;
    const prev = acc.length > 0 ? acc[acc.length - 1] : null;
    const offset = prev ? prev.offset + prev.dash : 0;
    acc.push({
      ...item,
      color: PALETTE[idx % PALETTE.length],
      dash,
      offset
    });
    return acc;
  }, []);

  const active = hovered !== null ? segments[hovered] : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {segments.map((seg, idx) => (
            <circle
              key={seg.categoryId || seg.targetType}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hovered === idx ? stroke + 4 : stroke}
              strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
              strokeDashoffset={-seg.offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ cursor: 'pointer', transition: 'stroke-width 0.15s ease' }}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          pointerEvents: 'none',
          padding: '16px'
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
            {active ? (active.categoryName || active.label) : 'Tổng chi tiêu'}
          </div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
            {active ? `${active.sharePercent}%` : formatVnd(total)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {segments.map((seg, idx) => (
          <div
            key={seg.categoryId || seg.targetType}
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: hovered === idx ? '#f1f5f9' : 'transparent',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: seg.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{seg.categoryName || seg.label}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{seg.itemsPurchased} sp · {seg.orderCount} đơn</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{formatVnd(seg.totalSpent)}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{seg.sharePercent}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BuyerSpendingPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusScope, setStatusScope] = useState('VALID');
  const [groupMode, setGroupMode] = useState('CATEGORY'); // CATEGORY | TARGET_TYPE
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams({ statusScope });
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    api(`/buyer/analytics/spending?${params.toString()}`)
      .then((data) => {
        if (alive) {
          setReport(data);
          setError('');
        }
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Không thể tải báo cáo chi tiêu cá nhân.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [fromDate, toDate, statusScope, refreshKey]);

  const triggerReload = () => {
    setLoading(true);
    setError('');
    setRefreshKey((k) => k + 1);
  };

  const applyPreset = (preset) => {
    const today = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);
    if (preset === 'ALL') {
      setFromDate('');
      setToDate('');
    } else if (preset === '30D') {
      const start = new Date(today.getTime() - 30 * 86400_000);
      setFromDate(fmt(start));
      setToDate(fmt(today));
    } else if (preset === 'YEAR') {
      setFromDate(`${today.getFullYear()}-01-01`);
      setToDate(`${today.getFullYear()}-12-31`);
    }
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '20px'
  };

  const chartItems = report
    ? (groupMode === 'CATEGORY' ? report.byCategory : report.byTargetType)
    : [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '22px' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: '6px' }}>F13 · AGGREGATE FUNCTIONS & QUERY PROCESSING</p>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Báo cáo chi tiêu cá nhân</h1>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
            Tổng hợp chi tiêu theo danh mục và nhóm sản phẩm (SQL JOIN + GROUP BY + SUM / COUNT DISTINCT)
          </p>
        </div>

        <div style={{ display: 'inline-flex', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
          {[
            { id: 'VALID', label: 'Đơn hợp lệ' },
            { id: 'DELIVERED', label: 'Chỉ đơn đã giao' }
          ].map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setStatusScope(opt.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: statusScope === opt.id ? '#ffffff' : 'transparent',
                color: statusScope === opt.id ? '#2563eb' : '#475569'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ ...cardStyle, padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button type="button" onClick={() => applyPreset('ALL')} style={{ fontSize: '12px', padding: '7px 12px' }}>Toàn bộ</button>
          <button type="button" onClick={() => applyPreset('YEAR')} style={{ fontSize: '12px', padding: '7px 12px' }}>Năm nay</button>
          <button type="button" onClick={() => applyPreset('30D')} style={{ fontSize: '12px', padding: '7px 12px' }}>30 ngày qua</button>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} aria-label="Từ ngày" style={{ padding: '7px 10px', fontSize: '12px' }} />
          <span style={{ color: '#64748b', fontSize: '12px' }}>đến</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} aria-label="Đến ngày" style={{ padding: '7px 10px', fontSize: '12px' }} />
          <button type="button" onClick={triggerReload} disabled={loading} className="primary" style={{ padding: '8px 14px' }}>
            Lọc
          </button>
        </div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      {loading ? (
        <div className="state">Đang tổng hợp chi tiêu của bạn...</div>
      ) : report && (
        <>
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#475569',
            marginBottom: '20px'
          }}>
            <b>Quy tắc tính chi tiêu:</b> {report.policyDescription}
          </div>

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Tổng chi tiêu</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb', marginTop: '8px' }}>
                {formatVnd(report.totalSpent)}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Tổng số đơn hàng</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '8px' }}>
                {report.totalOrders.toLocaleString('vi-VN')} đơn
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Chi tiêu trung bình / đơn</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#15803d', marginTop: '8px' }}>
                {formatVnd(report.averageOrderValue)}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Tổng sản phẩm đã mua</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#7c3aed', marginTop: '8px' }}>
                {report.totalItemsPurchased.toLocaleString('vi-VN')} sp
              </div>
            </div>
          </div>

          {/* Donut + Monthly Trend */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Phân bổ chi tiêu</h2>
                <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setGroupMode('CATEGORY')}
                    style={{
                      padding: '5px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '6px',
                      backgroundColor: groupMode === 'CATEGORY' ? '#ffffff' : 'transparent',
                      color: groupMode === 'CATEGORY' ? '#2563eb' : '#64748b'
                    }}
                  >
                    Theo danh mục
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupMode('TARGET_TYPE')}
                    style={{
                      padding: '5px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '6px',
                      backgroundColor: groupMode === 'TARGET_TYPE' ? '#ffffff' : 'transparent',
                      color: groupMode === 'TARGET_TYPE' ? '#2563eb' : '#64748b'
                    }}
                  >
                    Theo nhóm hàng
                  </button>
                </div>
              </div>
              <SpendingDonut items={chartItems} total={report.totalSpent} />
            </div>

            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 16px', fontSize: '16px', color: '#0f172a' }}>Xu hướng chi tiêu theo tháng</h2>
              {report.monthlyTrend.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Chưa có giao dịch nào trong khoảng thời gian đã chọn.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(() => {
                    const max = Math.max(...report.monthlyTrend.map(m => Number(m.totalSpent)), 1);
                    return report.monthlyTrend.map(m => {
                      const pct = Math.max(4, Math.round((Number(m.totalSpent) / max) * 100));
                      return (
                        <div key={m.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '600', color: '#334155' }}>{m.label} ({m.orderCount} đơn)</span>
                            <strong style={{ color: '#2563eb' }}>{formatVnd(m.totalSpent)}</strong>
                          </div>
                          <div style={{ height: '10px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '999px' }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Detailed category table */}
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 14px', fontSize: '16px', color: '#0f172a' }}>Chi tiết chi tiêu theo danh mục</h2>
            {report.byCategory.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '13px', padding: '16px 0' }}>
                Không có dữ liệu chi tiêu.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '10px 8px' }}>Danh mục</th>
                    <th style={{ padding: '10px 8px' }}>Nhóm hàng</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Số đơn</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Số SP</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Tổng chi tiêu</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Tỷ trọng</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byCategory.map((c, idx) => (
                    <tr key={c.categoryId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 8px', fontWeight: '600', color: '#0f172a' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '9px', height: '9px', borderRadius: '50%',
                          backgroundColor: PALETTE[idx % PALETTE.length],
                          marginRight: '8px'
                        }} />
                        {c.categoryName}
                      </td>
                      <td style={{ padding: '10px 8px', color: '#64748b' }}>{c.targetType}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{c.orderCount}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{c.itemsPurchased}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '700', color: '#2563eb' }}>{formatVnd(c.totalSpent)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '600' }}>{c.sharePercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
