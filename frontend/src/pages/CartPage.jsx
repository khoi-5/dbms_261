import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { money } from '../components/ProductCard';
import ProductImage from '../components/ProductImage';
import VoucherPicker from '../components/VoucherPicker';

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [cartVersion, setCartVersion] = useState(0);
  const [cartOffers, setCartOffers] = useState([]);
  const [appliedPromo, setAppliedPromo] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    api('/buyer/cart', { signal: controller.signal })
      .then((data) => {
        setCart(data);
        setError('');
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);

  const handleOffersLoaded = useCallback((offers) => {
    setCartOffers(offers || []);
  }, []);

  const handleSelectPromo = (preview) => {
    if (preview && preview.eligible) {
      setAppliedPromo(preview);
      sessionStorage.setItem('checkout.promotionId', String(preview.promotionId));
    } else {
      setAppliedPromo(null);
      sessionStorage.removeItem('checkout.promotionId');
    }
  };

  async function mutate(item, quantity) {
    setBusy(true);
    setError('');
    try {
      const updated = await api(`/buyer/cart/items/${item.variantId}`, {
        method: quantity === null ? 'DELETE' : 'PUT',
        ...(quantity === null ? {} : { body: { quantity } })
      });
      setCart(updated);
      setAppliedPromo(null);
      sessionStorage.removeItem('checkout.promotionId');
      setCartVersion((v) => v + 1);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const handleRetry = () => {
    setLoading(true);
    setError('');
    setRetry((r) => r + 1);
  };

  const discountedVariantIds = new Set(
    cartOffers.flatMap((o) => o.matchedVariantIds || [])
  );

  const unavailable = cart?.items.some(i => !i.active || i.sellerStatus !== 'ACTIVE' || i.quantity > i.stock);
  const discountAmount = appliedPromo?.eligible ? Number(appliedPromo.discountAmount || 0) : 0;
  const finalTotal = cart ? Math.max(0, Number(cart.total || 0) - discountAmount) : 0;

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">MUA SẮM CỦA BẠN</p>
          <h1>Giỏ hàng của bạn</h1>
          <p className="muted">Kiểm tra sản phẩm và áp dụng mã khuyến mãi trước khi tiến hành thanh toán</p>
        </div>
      </header>

      {error && (
        <div className="error" role="alert">
          {error}{' '}
          <button onClick={handleRetry} disabled={busy}>Tải lại giỏ</button>
        </div>
      )}

      {loading ? (
        <div className="state" role="status">Đang tải giỏ hàng…</div>
      ) : cart && !cart.items.length ? (
        <section className="state">
          <h2>Giỏ hàng đang trống</h2>
          <p>Khám phá sản phẩm hoặc xem các ưu đãi đang diễn ra để chọn món đồ bạn yêu thích.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="primary" to="/products">Khám phá sản phẩm</Link>
            <Link to="/promotions" style={{ padding: '12px 18px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: '600', fontSize: '13px' }}>
              Xem sản phẩm khuyến mãi
            </Link>
          </div>
        </section>
      ) : cart && (
        <>
          <div className="cart-table-wrap">
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Đơn giá</th>
                  <th>Số lượng</th>
                  <th>Thành tiền</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {cart.items.map(item => {
                  const hasPromo = discountedVariantIds.has(item.variantId);
                  return (
                    <tr key={item.variantId}>
                      <td>
                        <div className="cart-product">
                          <div className="cart-image">
                            <ProductImage src={item.image} name={item.name} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <strong>{item.name}</strong>
                              {hasPromo && (
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  backgroundColor: '#fef3c7',
                                  color: '#92400e'
                                }}>
                                  Đang có ưu đãi
                                </span>
                              )}
                            </div>
                            <small>Biến thể #{item.variantId} · {item.shop}</small>
                            {(!item.active || item.sellerStatus !== 'ACTIVE') ? (
                              <small className="error">Đã ngừng bán</small>
                            ) : item.quantity > item.stock ? (
                              <small className="error">Chỉ còn {item.stock} sản phẩm</small>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td>{money(item.price)}</td>
                      <td>
                        <div className="quantity-control">
                          <button
                            aria-label={`Giảm số lượng ${item.name}`}
                            disabled={busy || item.quantity <= 1 || !item.active || item.sellerStatus !== 'ACTIVE'}
                            onClick={() => mutate(item, item.quantity - 1)}
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            aria-label={`Tăng số lượng ${item.name}`}
                            disabled={busy || item.quantity >= item.stock || !item.active || item.sellerStatus !== 'ACTIVE'}
                            onClick={() => mutate(item, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>{money(item.subtotal)}</td>
                      <td>
                        <button
                          className="delete-button"
                          aria-label={`Xóa ${item.name}`}
                          disabled={busy}
                          onClick={() => mutate(item, null)}
                        >
                          ♲
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="cart-footer" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: '300px', width: '100%' }}>
              <VoucherPicker
                refreshTrigger={cartVersion}
                selectedPromotionId={appliedPromo?.promotionId ?? null}
                onSelect={handleSelectPromo}
                onOffersLoaded={handleOffersLoaded}
              />
              <div style={{ marginTop: '14px' }}>
                <Link to="/products">← Tiếp tục mua sắm</Link>
                {' · '}
                <Link to="/promotions">Xem thêm sản phẩm đang giảm giá</Link>
              </div>
            </div>

            <section className="cart-summary">
              <div>
                <span>Tạm tính ({cart.totalQuantity} sản phẩm)</span>
                <strong>{money(cart.total)}</strong>
              </div>
              {discountAmount > 0 && (
                <div style={{ marginTop: '10px', color: '#15803d' }}>
                  <span>Ưu đãi ({appliedPromo.type} #{appliedPromo.promotionId})</span>
                  <strong>− {money(discountAmount)}</strong>
                </div>
              )}
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                <strong>Tổng thanh toán</strong>
                <b>{money(finalTotal)}</b>
              </div>
              <p className="muted">
                {discountAmount > 0
                  ? 'Đã áp dụng ưu đãi dự kiến; điều kiện sẽ được xác thực lại khi thanh toán.'
                  : 'Chọn voucher ở khung bên trái để áp dụng giảm giá cho đơn hàng.'}
              </p>
              {unavailable && <p className="error">Vui lòng điều chỉnh sản phẩm không còn khả dụng.</p>}
              <Link className="primary" to="/checkout">▱ Tiến hành thanh toán</Link>
            </section>
          </div>
        </>
      )}
    </>
  );
}
