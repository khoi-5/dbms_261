import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { validQuantity } from '../config/catalog';
import { money } from './ProductCard';
import ProductImage from './ProductImage';

export default function ProductPurchaseModal({ product, onClose, onAdded }) {
  const { user } = useAuth();
  const currentUser = useRef(user);
  currentUser.current = user;
  const dialog = useRef(null);
  const pending = useRef(false);
  
  const [detail, setDetail] = useState(null);
  const [variants, setVariants] = useState(null);
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.focus();
    const controller = new AbortController();

    // Tải chi tiết sản phẩm và các biến thể
    api(`/products/${product.id}`, { signal: controller.signal })
      .then(data => {
        setDetail(data);
        if (data.variants && data.variants.length > 0) {
          setVariants(data.variants);
          setVariantId(String(data.variants[0].id));
        }
      })
      .catch(e => {
        if (e.name !== 'AbortError') {
          // Fallback tải danh sách biến thể nếu endpoint chi tiết gặp sự cố
          api(`/products/${product.id}/variants`, { signal: controller.signal })
            .then(rows => {
              setVariants(rows);
              setVariantId(String(rows[0].id));
            })
            .catch(err => { if (err.name !== 'AbortError') setError(err.message); });
        }
      });

    return () => { controller.abort(); previous?.focus(); };
  }, [product.id]);

  const selected = variants?.find(v => String(v.id) === variantId);
  const valid = selected && validQuantity(quantity, selected.stock);

  async function add() {
    if (pending.current || !valid || !user) return;
    pending.current = true;
    setBusy(true);
    setError('');
    const actor = user.id;
    try {
      await api('/buyer/cart/items', { method: 'POST', body: { variantId: selected.id, quantity: Number(quantity) } });
      if (currentUser.current?.id !== actor) {
        setError('Phiên đăng nhập đã thay đổi. Vui lòng đăng nhập và kiểm tra giỏ hàng.');
        return;
      }
      onAdded(Number(quantity));
    } catch (e) {
      setError(e.status ? e.message : 'Chưa xác định được kết quả thêm hàng. Hãy kiểm tra giỏ trước khi thêm lại.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  function keyboard(e) {
    if (e.key === 'Escape' && !busy) onClose();
  }

  const displayImage = selected?.image || product.image;
  const productType = detail?.productType || product.productType;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <section
        ref={dialog}
        tabIndex={-1}
        className="variant-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="variant-title"
        onKeyDown={keyboard}
        aria-busy={busy}
        style={{
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative'
        }}
      >
        {/* Nút đóng */}
        <button
          className="modal-close"
          aria-label="Đóng"
          disabled={busy}
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '22px',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px'
          }}
        >
          ×
        </button>

        {error && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
          {/* Cột trái: Ảnh preview & Biến thể */}
          <div>
            <div style={{
              width: '100%',
              aspectRatio: '4/3',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#f1f5f9',
              marginBottom: '14px',
              border: '1px solid #e2e8f0'
            }}>
              <ProductImage
                key={displayImage || product.id}
                src={displayImage}
                name={product.name}
                category={product.category}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Thông tin Gian hàng & Nhà sản xuất */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #f1f5f9',
              fontSize: '12px',
              color: '#475569',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div>
                <strong>Gian hàng:</strong> {detail?.shopName || 'BKPEE Official'}
              </div>
              <div>
                <strong>Thương hiệu:</strong> {detail?.manufacturer || product.manufacturer || 'Chính hãng'}
              </div>
              <div>
                <strong>Danh mục:</strong> {detail?.categoryName || product.category || 'Mặc định'}
              </div>
            </div>
          </div>

          {/* Cột phải: Thông tin chi tiết & Mua hàng */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Tag Phân cấp thực thể Specialization */}
            <div style={{ marginBottom: '8px' }}>
              {productType === 'BOOK' && (
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: '700' }}>
                  Sách
                </span>
              )}
              {productType === 'CLOTHES' && (
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f3e8ff', color: '#6b21a8', fontWeight: '700' }}>
                  Thời trang
                </span>
              )}
              {productType === 'ELECTRONICS' && (
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: '700' }}>
                  Thiết bị điện tử
                </span>
              )}
            </div>

            <h2 id="variant-title" style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: '800', color: '#0f172a', lineHeight: '1.4' }}>
              {product.name}
            </h2>

            {/* Thông tin chuyên biệt hóa (Disjoint Specialization) */}
            {productType === 'BOOK' && (
              <div style={{ padding: '10px 12px', backgroundColor: '#eff6ff', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', color: '#1e3a8a' }}>
                <div><strong>Nhà xuất bản:</strong> {detail?.publisher || 'Đang cập nhật'}</div>
                {detail?.authors && detail.authors.length > 0 && (
                  <div style={{ marginTop: '4px' }}><strong>Tác giả:</strong> {detail.authors.join(', ')}</div>
                )}
              </div>
            )}

            {productType === 'CLOTHES' && (
              <div style={{ padding: '10px 12px', backgroundColor: '#faf5ff', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', color: '#581c87' }}>
                <div><strong>Chất liệu:</strong> {detail?.material || 'Cotton / Vải thoáng khí'}</div>
              </div>
            )}

            {productType === 'ELECTRONICS' && (
              <div style={{ padding: '10px 12px', backgroundColor: '#fffbeb', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', color: '#78350f' }}>
                <div><strong>Thời hạn bảo hành:</strong> {detail?.warrantyTime || '12 tháng chính hãng'}</div>
                {detail?.warrantyId && (
                  <div style={{ marginTop: '4px' }}><strong>Mã bảo hành:</strong> {detail.warrantyId}</div>
                )}
              </div>
            )}

            {/* Mô tả sản phẩm */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Mô tả sản phẩm:</div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5', maxHeight: '70px', overflowY: 'auto' }}>
                {detail?.description || 'Sản phẩm chính hãng với chất lượng đảm bảo, đầy đủ giấy tờ bảo hành và nguồn gốc xuất xứ rõ ràng.'}
              </p>
            </div>

            {/* Chọn biến thể */}
            {variants && (
              <div style={{ marginTop: 'auto' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Chọn biến thể:
                </label>
                <select
                  value={variantId}
                  disabled={busy}
                  onChange={e => { setVariantId(e.target.value); setQuantity('1'); setError(''); }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    marginBottom: '12px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  {variants.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.variantName ? `${v.variantName}` : `Biến thể #${v.id}`} · {money(v.price)} · Còn {v.stock} sản phẩm
                    </option>
                  ))}
                </select>

                {selected && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        Đơn giá: <strong style={{ color: '#2563eb', fontSize: '16px' }}>{money(selected.price)}</strong>
                      </span>
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                        Còn {selected.stock} trong kho
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="purchase-quantity" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          aria-label="Giảm"
                          disabled={busy || Number(quantity) <= 1 || !valid}
                          onClick={() => setQuantity(String(Number(quantity) - 1))}
                          style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                        >−</button>
                        <input
                          id="purchase-quantity"
                          inputMode="numeric"
                          value={quantity}
                          disabled={busy}
                          onChange={e => setQuantity(e.target.value)}
                          style={{ width: '45px', height: '30px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                        />
                        <button
                          type="button"
                          aria-label="Tăng"
                          disabled={busy || !valid || Number(quantity) >= selected.stock}
                          onClick={() => setQuantity(String(Number(quantity) + 1))}
                          style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                        >+</button>
                      </div>

                      <div style={{ fontSize: '14px' }}>
                        Tạm tính: <strong style={{ color: '#2563eb', fontSize: '16px' }}>{valid ? money(selected.price * Number(quantity)) : '—'}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Nút Mua hàng / Đăng nhập */}
            <div style={{ marginTop: '12px' }}>
              {!user ? (
                <Link
                  to="/login"
                  state={{ from: '/products' }}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '12px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}
                >
                  Đăng nhập để thêm vào giỏ
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={!valid || busy}
                  onClick={add}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: !valid || busy ? '#94a3b8' : '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: !valid || busy ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  {busy ? 'Đang thêm…' : 'Thêm vào giỏ hàng'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
