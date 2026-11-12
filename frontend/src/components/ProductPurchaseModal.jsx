import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { validQuantity } from '../config/catalog';
import { money } from './ProductCard';

export default function ProductPurchaseModal({ product, onClose, onAdded }) {
  const { user } = useAuth();
  const currentUser = useRef(user);
  currentUser.current = user;
  const dialog = useRef(null);
  const pending = useRef(false);
  const [variants, setVariants] = useState(null);
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.focus();
    const controller = new AbortController();
    api(`/products/${product.id}/variants`, { signal: controller.signal }).then(rows => {
      setVariants(rows); setVariantId(String(rows[0].id));
    }).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => { controller.abort(); previous?.focus(); };
  }, [product.id]);
  const selected = variants?.find(v => String(v.id) === variantId);
  const valid = selected && validQuantity(quantity, selected.stock);
  async function add() {
    if (pending.current || !valid || !user?.roles.includes('BUYER')) return;
    pending.current = true; setBusy(true); setError('');
    const actor = user.id;
    try {
      await api('/buyer/cart/items', { method: 'POST', body: { variantId: selected.id, quantity: Number(quantity) } });
      if (currentUser.current?.id !== actor) {
        setError('Phiên đăng nhập đã thay đổi. Vui lòng đăng nhập và kiểm tra giỏ hàng.'); return;
      }
      onAdded(Number(quantity));
    } catch (e) {
      setError(e.status ? e.message : 'Chưa xác định được kết quả thêm hàng. Hãy kiểm tra giỏ trước khi thêm lại.');
    } finally { pending.current = false; setBusy(false); }
  }
  function keyboard(e) {
    if (e.key === 'Escape' && !busy) onClose();
    if (e.key !== 'Tab') return;
    const nodes = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]')];
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
  return <div className="modal-overlay"><section ref={dialog} tabIndex={-1} className="variant-modal" role="dialog" aria-modal="true" aria-labelledby="variant-title" onKeyDown={keyboard} aria-busy={busy}>
    <button className="modal-close" aria-label="Đóng" disabled={busy} onClick={onClose}>×</button><h2 id="variant-title">{product.name}</h2><p className="muted">Chọn biến thể và số lượng. Giỏ hàng chưa giữ tồn kho.</p>
    {error && <p className="error" role="alert">{error}</p>}{!variants && !error && <p role="status">Đang tải biến thể…</p>}
    {variants && <><label>Biến thể<select value={variantId} disabled={busy} onChange={e => { setVariantId(e.target.value); setQuantity('1'); setError(''); }}>{variants.map(v => <option key={v.id} value={v.id}>#{v.id} · {money(v.price)} · Còn {v.stock}</option>)}</select></label>
      {selected && <><p>Đơn giá: <strong>{money(selected.price)}</strong> · Tồn kho: {selected.stock}</p><label htmlFor="purchase-quantity">Số lượng</label><div className="purchase-quantity"><button aria-label="Giảm số lượng" disabled={busy || Number(quantity) <= 1 || !valid} onClick={() => setQuantity(String(Number(quantity) - 1))}>−</button><input id="purchase-quantity" inputMode="numeric" value={quantity} disabled={busy} aria-invalid={!valid} aria-describedby={!valid ? 'quantity-error' : undefined} onChange={e => setQuantity(e.target.value)} /><button aria-label="Tăng số lượng" disabled={busy || !valid || Number(quantity) >= selected.stock} onClick={() => setQuantity(String(Number(quantity) + 1))}>+</button></div>{!valid && <p id="quantity-error" className="error">Nhập số nguyên từ 1 đến {selected.stock}.</p>}<p className="purchase-total">Tạm tính <strong>{valid ? money(selected.price * Number(quantity)) : '—'}</strong></p></>}
    </>}
    {!user ? <Link className="primary" to="/login" state={{ from: '/products' }}>Đăng nhập để thêm vào giỏ</Link> : !user.roles.includes('BUYER') ? <p className="error">Tài khoản cần vai trò Buyer để mua hàng.</p> : <button className="primary" disabled={!valid || busy} onClick={add}>{busy ? 'Đang thêm…' : 'Thêm vào giỏ hàng'}</button>}
  </section></div>;
}
