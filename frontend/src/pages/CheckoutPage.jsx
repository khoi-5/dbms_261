import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../services/api';
import { clearCheckoutIntent, readCheckoutIntent, saveCheckoutIntent, orderMoney,
  clearCheckoutPromotion, readCheckoutPromotion } from '../services/orders';
import '../styles/orders.css';

function finishCheckout(accountId, promotionId) {
  clearCheckoutIntent(accountId);
  clearCheckoutPromotion(promotionId);
  window.dispatchEvent(new Event('cart-updated'));
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [options, setOptions] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fields, setFields] = useState({ receiverName: '', receiverPhone: '', deliveryAddress: '', providerId: '', paymentMethod: 'COD' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(() => readCheckoutIntent(user.id));
  const [promotionId, setPromotionId] = useState(readCheckoutPromotion);
  const quotedPromotionId = pending ? pending.payload.promotionId ?? null : promotionId;
  const ready = preview?.available && (preview.promotionId ?? null) === quotedPromotionId;
  const [reload, setReload] = useState(0);
  const working = useRef(false);
  const actor = useRef(user.id);
  const active = useRef(false);
  useEffect(() => {
    actor.current = user.id; active.current = true;
    return () => { active.current = false; };
  }, [user.id]);

  useEffect(() => {
    const abort = new AbortController();
    const saved = readCheckoutIntent(user.id);
    async function load() {
      try {
        if (saved) {
          try {
            const order = await api('/buyer/checkout/requests/' + saved.payload.requestKey, { signal: abort.signal });
            if (!abort.signal.aborted) {
              finishCheckout(user.id, saved.payload.promotionId);
              navigate('/orders/' + order.id, { replace: true });
            }
            return;
          } catch (e) { if (e.status !== 404) throw e; }
        }
        const value = await api('/buyer/checkout/options', { signal: abort.signal });
        if (!abort.signal.aborted) {
          setOptions(value); setPending(saved);
          setFields(saved ? { ...saved.payload } : {
            receiverName: value.receiver.name || '', receiverPhone: value.receiver.phone || '',
            deliveryAddress: value.receiver.address || '', providerId: String(value.providers[0]?.id || ''), paymentMethod: 'COD',
          });
          setLoading(false);
        }
      } catch (e) { if (!abort.signal.aborted) { setError(e.message); setLoading(false); } }
    }
    load();
    return () => abort.abort();
  }, [user.id, navigate, reload]);

  useEffect(() => {
    if (!fields.providerId) return;
    const abort = new AbortController();
    const query = new URLSearchParams({ providerId: String(fields.providerId) });
    if (quotedPromotionId !== null) query.set('promotionId', String(quotedPromotionId));
    api('/buyer/checkout/preview?' + query, { signal: abort.signal })
      .then(value => { if (!abort.signal.aborted) setPreview(value); })
      .catch(e => { if (!abort.signal.aborted) setError(e.message); });
    return () => abort.abort();
  }, [fields.providerId, quotedPromotionId, reload]);

  async function send(payload) {
    if (working.current) return;
    working.current = true; setBusy(true); setError(''); setNotice('');
    const accountId = user.id;
    try {
      const intent = saveCheckoutIntent(accountId, payload); setPending(intent);
      const result = await api('/buyer/checkout', { method: 'POST', body: payload });
      if (!active.current || actor.current !== accountId) return;
      finishCheckout(accountId, payload.promotionId);
      navigate('/orders/' + result.order.id, { replace: true, state: { placed: true } });
    } catch (e) {
      if (!active.current || actor.current !== accountId) return;
      setError(e.message);
      if (e.status >= 400 && e.status < 500) {
        clearCheckoutIntent(accountId); setPending(null); setPreview(null); setReload(value => value + 1);
      } else {
        setNotice('Chưa xác định được kết quả. Hãy kiểm tra đơn hoặc gửi lại cùng yêu cầu bên dưới.');
      }
    } finally { working.current = false; if (active.current && actor.current === accountId) setBusy(false); }
  }
  async function checkPrevious() {
    if (working.current || !pending) return;
    working.current = true; setBusy(true); setError(''); setNotice('');
    const accountId = user.id;
    try {
      const order = await api('/buyer/checkout/requests/' + pending.payload.requestKey);
      if (!active.current || actor.current !== accountId) return;
      finishCheckout(accountId, pending.payload.promotionId);
      navigate('/orders/' + order.id, { replace: true });
    } catch (e) {
      if (active.current && actor.current === accountId)
        setError(e.status === 404 ? 'Chưa tìm thấy đơn. Bạn có thể gửi lại cùng yêu cầu.' : e.message);
    }
    finally { working.current = false; if (active.current && actor.current === accountId) setBusy(false); }
  }
  function submit(e) {
    e.preventDefault();
    if (!ready || !options || busy || pending) return;
    send({ ...fields, providerId: Number(fields.providerId), quoteFingerprint: preview.quoteFingerprint,
      promotionId: quotedPromotionId ?? undefined, requestKey: crypto.randomUUID() });
  }
  function change(name, value) {
    if (name === 'providerId') setPreview(null);
    setFields(current => ({ ...current, [name]: value }));
  }
  function removePromotion() {
    clearCheckoutPromotion(promotionId);
    setPromotionId(null); setPreview(null); setError('');
  }
  return <div className="orders-feature">
    <header className="page-header"><div><p className="eyebrow">HOÀN TẤT ĐƠN HÀNG</p><h1>Checkout và thanh toán</h1>
      <p className="muted">Xác nhận thông tin nhận hàng và tổng tiền trước khi đặt.</p></div><Link to="/cart">← Giỏ hàng</Link></header>
    {error && <div className="error" role="alert">{error} <button disabled={busy} onClick={() => {
      setError(''); setPreview(null); if (!options) setLoading(true); setReload(v => v + 1);
    }}>Tải lại</button></div>}
    {quotedPromotionId !== null && !pending && <div className="order-actions">
      <button type="button" disabled={busy} onClick={removePromotion}>Bỏ ưu đãi #{quotedPromotionId}</button>
    </div>}
    {notice && <p className="success" role="status">{notice}</p>}
    {pending && <section className="order-recovery"><h2>Kiểm tra yêu cầu đặt hàng trước</h2>
      <p>Thông tin yêu cầu được giữ lại để kiểm tra kết quả và tránh đặt trùng đơn.</p>
      <p>Người nhận: {pending.payload.receiverName} · {pending.payload.deliveryAddress}</p>
      <div className="order-actions"><button disabled={busy} onClick={checkPrevious}>Kiểm tra đơn đã tạo</button>
        <button className="primary" disabled={busy} onClick={() => send(pending.payload)}>Gửi lại cùng yêu cầu</button></div>
    </section>}
    {loading ? <div className="state" role="status">Đang tải thông tin thanh toán…</div> : options && <>
      {!options.providers.length ? <p className="error">Chưa có đơn vị vận chuyển.</p> :
        !preview ? (!error && <div className="state" role="status">Đang cập nhật tổng tiền…</div>) :
          !preview.items.length && !pending ? <div className="state"><h2>Giỏ hàng đang trống</h2><Link to="/products">Chọn sản phẩm</Link></div> :
            <div className="checkout-grid"><form className="order-card checkout-form" onSubmit={submit}>
              <fieldset disabled={busy || !!pending}>
                <h2>Thông tin nhận hàng</h2>
                <label>Họ tên người nhận<input required maxLength={100} value={fields.receiverName}
                  onChange={e => change('receiverName', e.target.value)} autoComplete="name" /></label>
                <label>Số điện thoại<input required pattern="[+0-9]{8,20}" maxLength={20} value={fields.receiverPhone}
                  onChange={e => change('receiverPhone', e.target.value)} autoComplete="tel" /></label>
                <label>Địa chỉ giao hàng<textarea required maxLength={255} rows={3} value={fields.deliveryAddress}
                  onChange={e => change('deliveryAddress', e.target.value)} autoComplete="street-address" /></label>
                <label>Đơn vị vận chuyển<select value={fields.providerId} onChange={e => change('providerId', e.target.value)}>
                  {options.providers.map(provider => <option key={provider.id} value={provider.id}>{provider.name} · {orderMoney(provider.fee)}/shop</option>)}
                </select></label>
                <label>Phương thức thanh toán<select value={fields.paymentMethod} onChange={e => change('paymentMethod', e.target.value)}>
                  {options.paymentMethods.map(method => <option key={method.code} value={method.code}>{method.label}</option>)}
                </select></label>
                {fields.paymentMethod === 'DEMO' && <p className="order-demo-label">Thanh toán mô phỏng cho bài thực hành, không thu tiền thật.</p>}
                <button className="primary" disabled={!ready}>{busy ? 'Đang đặt hàng…' : 'Xác nhận đặt hàng'}</button>
              </fieldset>
            </form><section className="order-card"><h2>Đơn hàng của bạn</h2>
              {preview.items.map(item => <div className="checkout-line" key={item.variantId}>
                <div><strong>{item.name}</strong>
                  <small>{item.variantName || 'Biến thể #' + item.variantId} · {item.shop} · {item.quantity} × {orderMoney(item.price)}</small>
                  {!item.available && <small className="error">Không còn bán hoặc không đủ tồn kho.</small>}</div>
                <b>{orderMoney(item.subtotal)}</b>
              </div>)}
              <dl className="order-totals"><div><dt>Tiền hàng</dt><dd>{orderMoney(preview.subtotal)}</dd></div>
                <div><dt>Vận chuyển ({preview.shopCount} shop)</dt><dd>{orderMoney(preview.shippingTotal)}</dd></div>
                {preview.discountAmount > 0 && <div><dt>Ưu đãi #{preview.promotionId}</dt><dd>− {orderMoney(preview.discountAmount)}</dd></div>}
                <div className="order-grand-total"><dt>Tổng cộng</dt><dd>{orderMoney(preview.total)}</dd></div></dl>
              {!preview.available && preview.items.length > 0 && <p className="error">Vui lòng <Link to="/cart">điều chỉnh giỏ hàng</Link> trước khi đặt.</p>}
            </section></div>}
    </>}
  </div>;
}
