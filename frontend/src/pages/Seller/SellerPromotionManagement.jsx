import { useState, useEffect } from 'react';
import { api } from '../../services/api';

const formatVnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')} đ`;

const formatDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const toLocalInput = (iso) => {
  if (!iso) return '';
  return iso.slice(0, 16);
};

const STATUS_BADGE = {
  ACTIVE: { label: 'Đang hoạt động', bg: '#dcfce7', color: '#15803d' },
  UPCOMING: { label: 'Sắp diễn ra', bg: '#e0f2fe', color: '#0369a1' },
  EXPIRED: { label: 'Đã hết hạn', bg: '#f1f5f9', color: '#64748b' },
  OUT_OF_STOCK: { label: 'Hết lượt', bg: '#fee2e2', color: '#b91c1c' }
};

function PromotionFormModal({ initial, variants, onClose, onSaved }) {
  const isEdit = Boolean(initial);

  const [type, setType] = useState(initial?.type || 'COUPON');
  const [quantity, setQuantity] = useState(initial?.quantity ?? 50);
  const [minBill, setMinBill] = useState(initial?.minBill ?? 200000);
  const [percentDiscount, setPercentDiscount] = useState(initial?.percentDiscount ?? 15);
  const [maxDiscount, setMaxDiscount] = useState(initial?.maxDiscount ?? 50000);
  const [voucherValue, setVoucherValue] = useState(initial?.voucherValue ?? 30000);
  const [startDate, setStartDate] = useState(() => initial ? toLocalInput(initial.startDate) : new Date().toISOString().slice(0, 16));
  const [expirationDate, setExpirationDate] = useState(() => initial ? toLocalInput(initial.expirationDate) : new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 16));
  const [selectedIds, setSelectedIds] = useState(
    initial ? initial.appliedVariants.map(v => v.variantId) : variants.map(v => v.variantId)
  );
  const [variantSearch, setVariantSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const filteredVariants = variants.filter(v => {
    const q = variantSearch.trim().toLowerCase();
    if (!q) return true;
    return v.productName.toLowerCase().includes(q)
      || (v.variantName || '').toLowerCase().includes(q)
      || v.categoryName.toLowerCase().includes(q);
  });

  const toggleVariant = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (selectedIds.length === 0) {
      setError('Vui lòng chọn ít nhất một biến thể sản phẩm áp dụng.');
      return;
    }
    const payload = {
      type,
      quantity: Number(quantity),
      startDate: startDate.length === 16 ? `${startDate}:00` : startDate,
      expirationDate: expirationDate.length === 16 ? `${expirationDate}:00` : expirationDate,
      minBill: Number(minBill),
      percentDiscount: type === 'COUPON' ? Number(percentDiscount) : null,
      maxDiscount: type === 'COUPON' && maxDiscount !== '' && maxDiscount !== null ? Number(maxDiscount) : null,
      voucherValue: type === 'VOUCHER' ? Number(voucherValue) : null,
      variantIds: selectedIds
    };
    setSaving(true);
    try {
      const saved = await api(
        isEdit ? `/seller/promotions/${initial.promotionId}` : '/seller/promotions',
        { method: isEdit ? 'PUT' : 'POST', body: payload }
      );
      onSaved(saved);
    } catch (err) {
      setError(err.message || 'Không thể lưu chương trình khuyến mãi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          width: '640px',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.25)',
          position: 'relative'
        }}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Đóng">×</button>
        <h2 style={{ margin: '0 0 6px', fontSize: '18px', color: '#0f172a' }}>
          {isEdit ? `Chỉnh sửa khuyến mãi #${initial.promotionId}` : 'Tạo chương trình khuyến mãi mới (F06)'}
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#64748b' }}>
          Chọn loại Coupon (%) hoặc Voucher (VNĐ) và gắn các biến thể sản phẩm thuộc gian hàng của bạn.
        </p>

        {error && <div className="error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Type selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { id: 'COUPON', title: 'COUPON (Giảm theo %)', desc: 'Có thể đặt trần giảm tối đa' },
              { id: 'VOUCHER', title: 'VOUCHER (Giảm tiền mặt)', desc: 'Giảm số tiền cố định (VNĐ)' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setType(opt.id)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: `2px solid ${type === opt.id ? '#2563eb' : '#e2e8f0'}`,
                  backgroundColor: type === opt.id ? '#eff6ff' : '#ffffff'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '700', color: type === opt.id ? '#1d4ed8' : '#0f172a' }}>{opt.title}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{opt.desc}</div>
              </button>
            ))}
          </div>

          {type === 'COUPON' ? (
            <div className="form-pair">
              <label>
                Phần trăm giảm (%) *
                <input type="number" step="0.01" min="0.01" max="100" required value={percentDiscount} onChange={e => setPercentDiscount(e.target.value)} />
              </label>
              <label>
                Giảm tối đa (VNĐ, bỏ trống nếu không trần)
                <input type="number" step="1000" min="0" value={maxDiscount} onChange={e => setMaxDiscount(e.target.value)} />
              </label>
            </div>
          ) : (
            <label>
              Số tiền giảm trực tiếp (VNĐ) *
              <input type="number" step="1000" min="1000" required value={voucherValue} onChange={e => setVoucherValue(e.target.value)} />
            </label>
          )}

          <div className="form-pair">
            <label>
              Đơn tối thiểu áp dụng (VNĐ) *
              <input type="number" step="1000" min="0" required value={minBill} onChange={e => setMinBill(e.target.value)} />
            </label>
            <label>
              Tổng lượt sử dụng *
              <input type="number" min="0" required value={quantity} onChange={e => setQuantity(e.target.value)} />
            </label>
          </div>

          <div className="form-pair">
            <label>
              Thời gian bắt đầu *
              <input type="datetime-local" required value={startDate} onChange={e => setStartDate(e.target.value)} />
            </label>
            <label>
              Thời gian kết thúc *
              <input type="datetime-local" required value={expirationDate} onChange={e => setExpirationDate(e.target.value)} />
            </label>
          </div>

          {/* Variant multi-select */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                Biến thể sản phẩm áp dụng ({selectedIds.length}/{variants.length})
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setSelectedIds(variants.map(v => v.variantId))} style={{ fontSize: '11px', padding: '4px 8px' }}>
                  Chọn tất cả
                </button>
                <button type="button" onClick={() => setSelectedIds([])} style={{ fontSize: '11px', padding: '4px 8px' }}>
                  Bỏ chọn
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Lọc nhanh theo tên sản phẩm / phân loại..."
              value={variantSearch}
              onChange={(e) => setVariantSearch(e.target.value)}
              style={{ width: '100%', marginBottom: '8px', fontSize: '12px', padding: '8px 10px', boxSizing: 'border-box' }}
            />
            <div style={{
              maxHeight: '190px',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '6px'
            }}>
              {filteredVariants.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                  Không có biến thể nào phù hợp.
                </div>
              ) : filteredVariants.map(v => {
                const checked = selectedIds.includes(v.variantId);
                return (
                  <label
                    key={v.variantId}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: checked ? '#eff6ff' : 'transparent',
                      fontWeight: '400'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleVariant(v.variantId)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                        {v.productName} {v.variantName ? `— ${v.variantName}` : ''}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Variant #{v.variantId} · {v.categoryName} · {formatVnd(v.price)} · Kho: {v.stock}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} disabled={saving}>Hủy</button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EligibleProductsModal({ promotion, onClose }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api(`/seller/promotions/${promotion.promotionId}/eligible-products`)
      .then(res => { if (alive) setItems(res || []); })
      .catch(err => { if (alive) setError(err.message || 'Không thể tải danh sách sản phẩm đủ điều kiện.'); });
    return () => { alive = false; };
  }, [promotion.promotionId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '26px',
          width: '620px',
          maxWidth: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(15,23,42,0.25)'
        }}
      >
        <button className="modal-close" type="button" onClick={onClose}>×</button>
        <p className="eyebrow" style={{ marginBottom: '4px' }}>DEMO TIÊU CHÍ (g) · SQL EXISTS SUBQUERY</p>
        <h2 style={{ margin: '0 0 8px', fontSize: '18px', color: '#0f172a' }}>
          Sản phẩm đang đủ điều kiện cho {promotion.type} #{promotion.promotionId}
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#64748b' }}>
          Chỉ trả về các biến thể đang bán (<code>Is_Active = 1</code>), còn tồn kho (<code>Quantity_Stock &gt; 0</code>) và thỏa mãn truy vấn con <code>EXISTS</code> với chương trình còn hạn &amp; còn lượt.
        </p>

        {error && <div className="error">{error}</div>}
        {items === null && !error ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Đang truy vấn Subquery...</div>
        ) : items && items.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '10px', color: '#64748b', fontSize: '13px' }}>
            Không có biến thể nào đang đủ điều kiện (khuyến mãi có thể chưa bắt đầu, hết hạn, hết lượt hoặc sản phẩm đã tắt/hết kho).
          </div>
        ) : items && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map(it => (
              <div key={it.variantId} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    {it.productName} {it.variantName ? `— ${it.variantName}` : ''}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Variant #{it.variantId} · {it.categoryName} · Kho: {it.stock} sp · Đang hưởng {it.activePromotionCount} CTKM
                  </div>
                </div>
                <strong style={{ fontSize: '13px', color: '#2563eb' }}>{formatVnd(it.price)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SellerPromotionManagement() {
  const [promotions, setPromotions] = useState([]);
  const [variants, setVariants] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [inspecting, setInspecting] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const notify = (text, isError = false) => {
    setFeedback({ text, isError });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    let alive = true;
    Promise.all([
      api('/seller/promotions'),
      api('/seller/promotions/variants')
    ])
      .then(([promos, vars]) => {
        if (alive) {
          setPromotions(promos || []);
          setVariants(vars || []);
          setError('');
        }
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Không thể tải danh sách khuyến mãi.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [refreshKey]);

  const reloadAll = () => {
    setLoading(true);
    setError('');
    setRefreshKey((k) => k + 1);
  };

  const handleDelete = async (promo) => {
    if (!window.confirm(`Xóa chương trình ${promo.type} #${promo.promotionId}?`)) return;
    setDeletingId(promo.promotionId);
    try {
      await api(`/seller/promotions/${promo.promotionId}`, { method: 'DELETE' });
      setPromotions(prev => prev.filter(p => p.promotionId !== promo.promotionId));
      notify(`Đã xóa khuyến mãi #${promo.promotionId}.`);
    } catch (err) {
      notify(err.message || 'Không thể xóa khuyến mãi.', true);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = promotions.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: promotions.length,
    active: promotions.filter(p => p.status === 'ACTIVE').length,
    upcoming: promotions.filter(p => p.status === 'UPCOMING').length,
    inactive: promotions.filter(p => p.status === 'EXPIRED' || p.status === 'OUT_OF_STOCK').length
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '22px' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: '6px' }}>F06 · INSERT & SUBQUERY (EXISTS)</p>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Quản lý Khuyến mãi & Voucher</h1>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
            Tạo Coupon (%) hoặc Voucher (VNĐ), gán phạm vi sản phẩm và truy vấn biến thể đủ điều kiện áp dụng.
          </p>
        </div>
        <button
          type="button"
          className="primary"
          onClick={() => { setEditing(null); setModalOpen(true); }}
        >
          + Tạo khuyến mãi mới
        </button>
      </div>

      {feedback && (
        <div className={feedback.isError ? 'error' : 'success'} role="status">
          {feedback.text}
        </div>
      )}
      {error && <div className="error" role="alert">{error}</div>}

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Tổng chương trình', value: stats.total, color: '#0f172a' },
          { label: 'Đang hoạt động', value: stats.active, color: '#15803d' },
          { label: 'Sắp diễn ra', value: stats.upcoming, color: '#0369a1' },
          { label: 'Hết hạn / Hết lượt', value: stats.inactive, color: '#64748b' }
        ].map(k => (
          <div key={k.label} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{k.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: k.color, marginTop: '6px' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'ACTIVE', label: 'Đang hoạt động' },
            { id: 'UPCOMING', label: 'Sắp diễn ra' },
            { id: 'EXPIRED', label: 'Hết hạn' },
            { id: 'OUT_OF_STOCK', label: 'Hết lượt' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '7px 13px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: statusFilter === tab.id ? '#2563eb' : '#ffffff',
                color: statusFilter === tab.id ? '#ffffff' : '#475569',
                border: `1px solid ${statusFilter === tab.id ? '#2563eb' : '#e2e8f0'}`
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '600' }}>
          <option value="ALL">Mọi loại (Coupon & Voucher)</option>
          <option value="COUPON">Chỉ COUPON (%)</option>
          <option value="VOUCHER">Chỉ VOUCHER (VNĐ)</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách khuyến mãi...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Chưa có chương trình khuyến mãi nào khớp bộ lọc.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '820px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: '12px' }}>
                <th style={{ padding: '14px 16px' }}>Mã & Loại</th>
                <th style={{ padding: '14px 12px' }}>Mức giảm</th>
                <th style={{ padding: '14px 12px' }}>Đơn tối thiểu</th>
                <th style={{ padding: '14px 12px' }}>Lượt còn lại</th>
                <th style={{ padding: '14px 12px' }}>Thời gian hiệu lực</th>
                <th style={{ padding: '14px 12px' }}>SP áp dụng</th>
                <th style={{ padding: '14px 12px' }}>Trạng thái</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const badge = STATUS_BADGE[p.status] || STATUS_BADGE.EXPIRED;
                const discountLabel = p.type === 'COUPON'
                  ? `Giảm ${Number(p.percentDiscount)}%${p.maxDiscount ? ` (tối đa ${formatVnd(p.maxDiscount)})` : ''}`
                  : `Giảm ${formatVnd(p.voucherValue)}`;
                return (
                  <tr key={p.promotionId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: p.type === 'COUPON' ? '#ede9fe' : '#dcfce7',
                        color: p.type === 'COUPON' ? '#6d28d9' : '#15803d',
                        marginRight: '6px'
                      }}>
                        {p.type}
                      </span>
                      <strong>#{p.promotionId}</strong>
                    </td>
                    <td style={{ padding: '14px 12px', fontWeight: '700', color: '#0f172a' }}>{discountLabel}</td>
                    <td style={{ padding: '14px 12px' }}>{formatVnd(p.minBill)}</td>
                    <td style={{ padding: '14px 12px', fontWeight: '600', color: p.quantity === 0 ? '#dc2626' : '#0f172a' }}>
                      {p.quantity} lượt
                    </td>
                    <td style={{ padding: '14px 12px', fontSize: '12px', color: '#475569' }}>
                      <div>Từ: {formatDateTime(p.startDate)}</div>
                      <div>Đến: {formatDateTime(p.expirationDate)}</div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <button
                        type="button"
                        onClick={() => setInspecting(p)}
                        style={{
                          padding: '5px 10px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe'
                        }}
                      >
                        {p.appliedVariantCount} biến thể · Xem đủ ĐK
                      </button>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: badge.bg,
                        color: badge.color
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => { setEditing(p); setModalOpen(true); }}
                        style={{ padding: '6px 10px', fontSize: '12px', marginRight: '6px' }}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === p.promotionId}
                        onClick={() => handleDelete(p)}
                        style={{ padding: '6px 10px', fontSize: '12px', backgroundColor: '#fef2f2', color: '#dc2626' }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <PromotionFormModal
          initial={editing}
          variants={variants}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={() => {
            setModalOpen(false);
            setEditing(null);
            notify(editing ? 'Đã cập nhật chương trình khuyến mãi.' : 'Đã tạo chương trình khuyến mãi mới thành công!');
            reloadAll();
          }}
        />
      )}

      {inspecting && (
        <EligibleProductsModal
          promotion={inspecting}
          onClose={() => setInspecting(null)}
        />
      )}
    </div>
  );
}
