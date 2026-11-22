import { useState, useEffect } from 'react';
import { api } from '../services/api';

const formatVnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')} đ`;

/**
 * Reusable VoucherPicker component (F06).
 * Used in /cart, /promotions, and ready to embed in M3's /checkout page:
 *   <VoucherPicker
 *     refreshTrigger={cartVersion}
 *     selectedPromotionId={promoId}
 *     onSelect={(preview) => setSelectedPromo(preview)}
 *     onOffersLoaded={(offers) => ...}
 *   />
 */
export default function VoucherPicker({
  refreshTrigger = 0,
  selectedPromotionId = null,
  onSelect,
  onOffersLoaded
}) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewingId, setPreviewingId] = useState(null);
  const [manualId, setManualId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    api('/buyer/promotions/available')
      .then((data) => {
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        setOffers(list);
        setError('');
        onOffersLoaded?.(list);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Không thể tải danh sách voucher cho giỏ hàng.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [refreshKey, refreshTrigger, onOffersLoaded]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    setRefreshKey((k) => k + 1);
  };

  const handleApply = async (promotionId) => {
    setPreviewingId(promotionId);
    setError('');
    try {
      const res = await api('/buyer/promotions/preview', {
        method: 'POST',
        body: { promotionId: Number(promotionId) }
      });
      setPreview(res);
      onSelect?.(res);
    } catch (err) {
      setError(err.message || 'Không thể áp dụng khuyến mãi này.');
    } finally {
      setPreviewingId(null);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const id = Number(manualId.trim());
    if (!Number.isInteger(id) || id < 1) {
      setError('Vui lòng nhập mã khuyến mãi hợp lệ (số nguyên dương, ví dụ: 1 hoặc 2).');
      return;
    }
    handleApply(id);
  };

  const clearSelection = () => {
    setPreview(null);
    onSelect?.(null);
  };

  const activeId = selectedPromotionId ?? (preview?.eligible ? preview.promotionId : null);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '14px',
      padding: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Voucher & Mã khuyến mãi cho giỏ hàng
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            Tự động đối chiếu các biến thể trong giỏ hàng bằng truy vấn con (Subquery)
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: '7px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#f8fafc',
            fontSize: '12px',
            fontWeight: '600',
            color: '#334155'
          }}
        >
          Làm mới
        </button>
      </div>

      {/* Nhập mã khuyến mãi trực tiếp theo ID */}
      <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="number"
          min="1"
          placeholder="Nhập mã Promotion ID để kiểm tra (VD: 1, 2)..."
          value={manualId}
          onChange={(e) => setManualId(e.target.value)}
          style={{ flex: 1, fontSize: '13px', padding: '9px 12px' }}
        />
        <button
          type="submit"
          disabled={previewingId !== null}
          className="primary"
          style={{ padding: '9px 16px', whiteSpace: 'nowrap' }}
        >
          Kiểm tra mã
        </button>
      </form>

      {error && (
        <div className="error" role="alert" style={{ marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
          Đang tìm kiếm khuyến mãi phù hợp với giỏ hàng...
        </div>
      ) : offers.length === 0 ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          borderRadius: '10px',
          border: '1px dashed #cbd5e1',
          color: '#64748b',
          fontSize: '13px'
        }}>
          Hiện chưa có khuyến mãi nào áp dụng cho các sản phẩm đang có trong giỏ hàng của bạn.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {offers.map((o) => {
            const isSelected = activeId === o.promotionId;
            const discountText = o.type === 'COUPON'
              ? `Giảm ${Number(o.percentDiscount)}%${o.maxDiscount ? ` (tối đa ${formatVnd(o.maxDiscount)})` : ''}`
              : `Giảm trực tiếp ${formatVnd(o.voucherValue)}`;
            return (
              <div
                key={o.promotionId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: `1.5px solid ${isSelected ? '#2563eb' : o.eligible ? '#bfdbfe' : '#e2e8f0'}`,
                  backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: '700',
                      backgroundColor: o.type === 'COUPON' ? '#ede9fe' : '#dcfce7',
                      color: o.type === 'COUPON' ? '#6d28d9' : '#15803d'
                    }}>
                      {o.type} #{o.promotionId}
                    </span>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{discountText}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>· {o.shopName}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                    Đơn tối thiểu: <b>{formatVnd(o.minBill)}</b> · Sản phẩm hợp lệ trong giỏ: <b>{formatVnd(o.eligibleSubtotal)}</b> · Còn {o.quantity} lượt
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px', color: o.eligible ? '#15803d' : '#b45309', fontWeight: '500' }}>
                    {o.eligible ? `✓ ${o.reason} — Dự kiến giảm ${formatVnd(o.estimatedDiscount)}` : `⚠ ${o.reason}`}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!o.eligible || previewingId === o.promotionId}
                  onClick={() => isSelected ? clearSelection() : handleApply(o.promotionId)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor: isSelected ? '#e2e8f0' : o.eligible ? '#2563eb' : '#f1f5f9',
                    color: isSelected ? '#334155' : o.eligible ? '#ffffff' : '#94a3b8'
                  }}
                >
                  {previewingId === o.promotionId ? 'Đang kiểm tra...' : isSelected ? 'Bỏ chọn' : 'Áp dụng'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Kết quả tính thử giảm giá */}
      {preview && (
        <div style={{
          marginTop: '16px',
          padding: '14px 16px',
          borderRadius: '10px',
          backgroundColor: preview.eligible ? '#f0fdf4' : '#fffbeb',
          border: `1px solid ${preview.eligible ? '#bbf7d0' : '#fde68a'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ fontSize: '13px', color: preview.eligible ? '#166534' : '#92400e' }}>
              {preview.eligible ? `Đã áp dụng ${preview.type} #${preview.promotionId} (${preview.shopName})` : `Không thể áp dụng mã #${preview.promotionId}`}
            </strong>
            <button
              type="button"
              onClick={clearSelection}
              style={{ background: 'none', padding: '2px 6px', fontSize: '12px', color: '#64748b' }}
            >
              Đóng
            </button>
          </div>
          {!preview.eligible ? (
            <div style={{ fontSize: '12px', color: '#92400e' }}>{preview.reason}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', fontSize: '13px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Tổng giỏ hàng</div>
                <div style={{ fontWeight: '600', color: '#0f172a' }}>{formatVnd(preview.cartTotal)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Được giảm</div>
                <div style={{ fontWeight: '700', color: '#15803d' }}>− {formatVnd(preview.discountAmount)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Tạm tính sau giảm</div>
                <div style={{ fontWeight: '800', color: '#2563eb' }}>{formatVnd(preview.finalTotal)}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
