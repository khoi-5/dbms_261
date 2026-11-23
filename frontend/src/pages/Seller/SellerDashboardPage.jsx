import { useState, useEffect } from 'react';
import { api } from '../../services/api';

const formatVnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')} đ`;

const STATUS_LABELS = {
  PENDING: { label: 'Chờ xác nhận', bg: '#fef3c7', color: '#92400e' },
  CONFIRMED: { label: 'Đã xác nhận', bg: '#e0f2fe', color: '#075985' },
  SHIPPING: { label: 'Đang giao', bg: '#ede9fe', color: '#5b21b6' },
  DELIVERED: { label: 'Đã giao thành công', bg: '#dcfce7', color: '#166534' },
  CANCELLED: { label: 'Đã hủy', bg: '#fee2e2', color: '#991b1b' },
  RETURNED: { label: 'Hoàn trả', bg: '#f1f5f9', color: '#475569' }
};

function MonthlyBarChart({ data }) {
  const [hovered, setHovered] = useState(null);
  const maxVal = Math.max(...data.map(d => Number(d.revenue || 0)), 1);

  const width = 760;
  const height = 270;
  const padLeft = 72;
  const padRight = 18;
  const padTop = 24;
  const padBottom = 38;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const slotW = plotW / data.length;
  const barW = Math.min(36, slotW * 0.62);

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const compactVnd = (v) => {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
    return `${Math.round(v)}`;
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: '540px', height: 'auto', display: 'block' }}>
        {/* Gridlines & Y labels */}
        {yTicks.map((t, idx) => {
          const y = padTop + plotH * (1 - t);
          return (
            <g key={idx}>
              <line x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray={t === 0 ? undefined : '4 4'} />
              <text x={padLeft - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
                {compactVnd(maxVal * t)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const val = Number(d.revenue || 0);
          const barH = val > 0 ? Math.max(4, (val / maxVal) * plotH) : 0;
          const x = padLeft + i * slotW + (slotW - barW) / 2;
          const y = padTop + plotH - barH;
          const isHover = hovered === d.month;

          return (
            <g
              key={d.month}
              onMouseEnter={() => setHovered(d.month)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={padLeft + i * slotW + 2}
                y={padTop}
                width={slotW - 4}
                height={plotH}
                fill={isHover ? '#eff6ff' : 'transparent'}
                rx="6"
              />
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx="5"
                fill={isHover ? '#1d4ed8' : val > 0 ? '#2563eb' : '#cbd5e1'}
              />
              {val > 0 && (
                <text
                  x={x + barW / 2}
                  y={Math.max(14, y - 6)}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill={isHover ? '#1d4ed8' : '#334155'}
                >
                  {compactVnd(val)}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={height - 12}
                textAnchor="middle"
                fontSize="12"
                fontWeight={isHover ? '700' : '500'}
                fill={isHover ? '#1d4ed8' : '#475569'}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered !== null && (() => {
        const item = data.find(x => x.month === hovered);
        if (!item) return null;
        return (
          <div style={{
            marginTop: '10px',
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            fontSize: '13px',
            color: '#1e3a8a'
          }}>
            <strong>Tháng {item.month}:</strong>
            <span>Doanh thu: <b>{formatVnd(item.revenue)}</b></span>
            <span>Số đơn: <b>{item.orderCount}</b></span>
            <span>Sản phẩm bán ra: <b>{item.itemsSold}</b></span>
          </div>
        );
      })()}
    </div>
  );
}

export default function SellerDashboardPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [statusScope, setStatusScope] = useState('VALID');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    api(`/seller/analytics/revenue?year=${year}&statusScope=${statusScope}`)
      .then((data) => {
        if (alive) {
          setReport(data);
          setError('');
        }
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Không thể tải dữ liệu thống kê doanh thu.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [year, statusScope, refreshKey]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    setRefreshKey((k) => k + 1);
  };

  const years = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '20px'
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: '6px' }}>F07 · AGGREGATE FUNCTIONS & QUERY PROCESSING</p>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>
            Thống kê doanh thu {report?.shopName ? `— ${report.shopName}` : ''}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
            Tổng hợp doanh thu, số đơn khác nhau và sản phẩm bán chạy theo tháng (SQL SUM / COUNT DISTINCT / GROUP BY)
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label="Chọn năm thống kê"
            style={{ padding: '9px 14px', fontSize: '13px', fontWeight: '600' }}
          >
            {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
          </select>

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
                  color: statusScope === opt.id ? '#2563eb' : '#475569',
                  boxShadow: statusScope === opt.id ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            style={{ padding: '9px 14px', fontSize: '13px', fontWeight: '600', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}
          >
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="error" role="alert" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="state">Đang tổng hợp doanh thu năm {year}...</div>
      ) : report && (
        <>
          {/* Policy banner */}
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#475569',
            marginBottom: '20px'
          }}>
            <b>Quy tắc tính doanh thu:</b> {report.policyDescription}
          </div>

          {/* 4 KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Tổng doanh thu năm {report.year}</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb', marginTop: '8px' }}>
                {formatVnd(report.totalRevenue)}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Tổng đơn hàng (Distinct)</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '8px' }}>
                {report.totalOrders.toLocaleString('vi-VN')} đơn
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Giá trị trung bình / đơn</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#15803d', marginTop: '8px' }}>
                {formatVnd(report.averageOrderValue)}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Tổng sản phẩm đã bán</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#7c3aed', marginTop: '8px' }}>
                {report.totalItemsSold.toLocaleString('vi-VN')} sp
              </div>
            </div>
          </div>

          {/* Monthly Chart */}
          <div style={{ ...cardStyle, marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Biểu đồ doanh thu 12 tháng ({report.year})</h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Di chuột vào từng cột để xem chi tiết số đơn và số sản phẩm</p>
              </div>
            </div>
            <MonthlyBarChart data={report.monthly} />
          </div>

          {/* Bottom 2 columns: Top Products & Status Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Top products */}
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 14px', fontSize: '16px', color: '#0f172a' }}>Top sản phẩm doanh thu cao nhất</h2>
              {report.topProducts.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '13px', padding: '16px 0' }}>
                  Chưa có sản phẩm phát sinh doanh thu trong năm {report.year}.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '8px 4px' }}>Sản phẩm</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>SL bán</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topProducts.map((p, idx) => (
                      <tr key={p.productId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 4px' }}>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>#{idx + 1} {p.productName}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{p.categoryName}</div>
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: '600' }}>{p.unitsSold}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: '700', color: '#2563eb' }}>{formatVnd(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Status breakdown */}
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 14px', fontSize: '16px', color: '#0f172a' }}>Phân bổ theo trạng thái giao hàng</h2>
              {report.statusBreakdown.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '13px', padding: '16px 0' }}>
                  Chưa có đơn hàng nào trong năm {report.year}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {report.statusBreakdown.map((s) => {
                    const meta = STATUS_LABELS[s.deliveryStatus] || { label: s.deliveryStatus, bg: '#f1f5f9', color: '#334155' };
                    return (
                      <div key={s.deliveryStatus} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #f1f5f9'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: meta.bg,
                            color: meta.color
                          }}>
                            {meta.label}
                          </span>
                          <span style={{ fontSize: '13px', color: '#475569' }}>{s.orderCount} đơn</span>
                        </div>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{formatVnd(s.revenue)}</strong>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
