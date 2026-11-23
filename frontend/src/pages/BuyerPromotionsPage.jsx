import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import VoucherPicker from '../components/VoucherPicker';
import ProductImage from '../components/ProductImage';

const formatVnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')} đ`;
const PAGE_SIZE = 12;

export default function BuyerPromotionsPage() {
  const navigate = useNavigate();
  const [eligibleProducts, setEligibleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [cartVersion, setCartVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    api('/buyer/promotions/eligible-products')
      .then(res => { if (alive) setEligibleProducts(res || []); })
      .catch(err => { if (alive) setError(err.message || 'Không thể tải danh sách sản phẩm khuyến mãi.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const notify = (text, isError = false) => {
    setFeedback({ text, isError });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddToCart = async (item, goToCart = false) => {
    setBusyId(item.variantId);
    try {
      await api('/buyer/cart/items', {
        method: 'POST',
        body: { variantId: item.variantId, quantity: 1 }
      });
      window.dispatchEvent(new Event('cart-updated'));
      setCartVersion(v => v + 1);
      if (goToCart) {
        navigate('/cart');
      } else {
        notify(`Đã thêm "${item.productName}" vào giỏ hàng — xem ưu đãi đã tự cập nhật phía trên!`);
      }
    } catch (err) {
      notify(err.message || 'Không thể thêm sản phẩm vào giỏ hàng.', true);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = eligibleProducts.filter(item => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return item.productName.toLowerCase().includes(q)
      || (item.variantName || '').toLowerCase().includes(q)
      || item.categoryName.toLowerCase().includes(q)
      || item.shopName.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: '6px' }}>F06 · SUBQUERY (EXISTS & IN) & DISCOUNT PREVIEW</p>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Khuyến mãi & Ưu đãi của bạn</h1>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
            Thêm sản phẩm đang khuyến mãi vào giỏ hoặc bấm Mua ngay để áp dụng Voucher trực tiếp tại Giỏ hàng.
          </p>
        </div>
        <Link to="/cart" className="primary">Đi tới giỏ hàng →</Link>
      </div>

      {feedback && (
        <div className={feedback.isError ? 'error' : 'success'} role="status">
          {feedback.text}
        </div>
      )}

      {/* Section 1: Cart Voucher Picker (Subquery IN + Preview) */}
      <div style={{ marginBottom: '28px' }}>
        <VoucherPicker refreshTrigger={cartVersion} />
      </div>

      {/* Section 2: Active Promoted Products (Subquery EXISTS) */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
              Sản phẩm đang có khuyến mãi ({filtered.length})
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              Truy vấn bằng SQL Subquery <code>EXISTS</code> trên bảng <code>Promotion_Apply</code> &amp; <code>Promotion</code> còn hiệu lực.
            </p>
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm, danh mục, shop..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '280px', maxWidth: '100%', fontSize: '13px', padding: '8px 12px' }}
          />
        </div>

        {error && <div className="error">{error}</div>}
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Đang tải sản phẩm đang khuyến mãi...
          </div>
        ) : paged.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Không tìm thấy sản phẩm đang khuyến mãi phù hợp.
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {paged.map(item => {
                const isBusy = busyId === item.variantId;
                return (
                  <div key={item.variantId} style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    backgroundColor: '#f8fafc'
                  }}>
                    <div className="product-image">
                      <ProductImage src={item.image} name={item.productName} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{item.categoryName}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '10px',
                        fontWeight: '700',
                        backgroundColor: '#fef3c7',
                        color: '#92400e'
                      }}>
                        {item.activePromotionCount} ưu đãi
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', lineHeight: 1.4 }}>
                      {item.productName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {item.variantName ? `${item.variantName} · ` : ''}{item.shopName}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '6px' }}>
                      <strong style={{ fontSize: '14px', color: '#2563eb' }}>{formatVnd(item.price)}</strong>
                      <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '600' }}>Còn {item.stock}</span>
                    </div>

                    {/* Hành động trực tiếp: Thêm vào giỏ & Mua ngay */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAddToCart(item, false)}
                        style={{
                          padding: '8px 6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          borderRadius: '8px',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe'
                        }}
                      >
                        {isBusy ? 'Đang thêm...' : '+ Thêm giỏ'}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAddToCart(item, true)}
                        style={{
                          padding: '8px 6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          borderRadius: '8px',
                          backgroundColor: '#2563eb',
                          color: '#ffffff'
                        }}
                      >
                        Mua ngay
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>← Trước</button>
                <span>Trang {safePage} / {totalPages}</span>
                <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Sau →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
