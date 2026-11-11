import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { money } from '../components/ProductCard';
import ProductImage from '../components/ProductImage';
export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    api('/buyer/cart', { signal: controller.signal }).then(setCart).catch(e => { if(e.name !== 'AbortError') setError(e.message); }).finally(() => { if(!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  async function mutate(item, quantity) {
    setBusy(true); setError('');
    try { setCart(await api(`/buyer/cart/items/${item.variantId}`, { method: quantity === null ? 'DELETE' : 'PUT', ...(quantity === null ? {} : { body: { quantity } }) })); }
    catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  const unavailable = cart?.items.some(i => !i.active || i.sellerStatus !== 'ACTIVE' || i.quantity > i.stock);
  return <><header className="page-header"><div><p className="eyebrow">MUA SẮM CỦA BẠN</p><h1>Giỏ hàng của bạn</h1><p className="muted">Kiểm tra sản phẩm trước khi tiến hành thanh toán</p></div></header>{error && <div className="error" role="alert">{error} <button onClick={() => setRetry(retry+1)} disabled={busy}>Tải lại giỏ</button></div>}{loading ? <div className="state" role="status">Đang tải giỏ hàng…</div> : cart && !cart.items.length ? <section className="state"><h2>Giỏ hàng đang trống</h2><p>Khám phá sản phẩm và chọn món đồ bạn yêu thích.</p><Link className="primary" to="/products">Khám phá sản phẩm</Link></section> : cart && <><div className="cart-table-wrap"><table className="cart-table"><thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th><th>Thao tác</th></tr></thead><tbody>{cart.items.map(item => <tr key={item.variantId}><td><div className="cart-product"><div className="cart-image"><ProductImage src={item.image} name={item.name} /></div><div><strong>{item.name}</strong><small>Biến thể #{item.variantId} · {item.shop}</small>{(!item.active || item.sellerStatus !== 'ACTIVE') ? <small className="error">Đã ngừng bán</small> : item.quantity > item.stock ? <small className="error">Chỉ còn {item.stock} sản phẩm</small> : null}</div></div></td><td>{money(item.price)}</td><td><div className="quantity-control"><button aria-label={`Giảm số lượng ${item.name}`} disabled={busy || item.quantity <= 1 || !item.active || item.sellerStatus !== 'ACTIVE'} onClick={() => mutate(item,item.quantity-1)}>−</button><span>{item.quantity}</span><button aria-label={`Tăng số lượng ${item.name}`} disabled={busy || item.quantity >= item.stock || !item.active || item.sellerStatus !== 'ACTIVE'} onClick={() => mutate(item,item.quantity+1)}>+</button></div></td><td>{money(item.subtotal)}</td><td><button className="delete-button" aria-label={`Xóa ${item.name}`} disabled={busy} onClick={() => mutate(item,null)}>♲</button></td></tr>)}</tbody></table></div><div className="cart-footer"><Link to="/products">← Tiếp tục mua sắm</Link><section className="cart-summary"><div><strong>Tổng cộng ({cart.totalQuantity} sản phẩm)</strong><b>{money(cart.total)}</b></div><p className="muted">Giá hiện tại, chưa bao gồm phí vận chuyển hoặc voucher.</p>{unavailable && <p className="error">Vui lòng điều chỉnh sản phẩm không còn khả dụng.</p>}<Link className="primary" to="/checkout">▱ Tiến hành thanh toán</Link></section></div></>}</>;
}
