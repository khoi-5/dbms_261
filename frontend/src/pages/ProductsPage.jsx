import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import ProductCard, { money } from '../components/ProductCard';
export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selection, setSelection] = useState(null);
  const [variants, setVariants] = useState(null);
  const [variantId, setVariantId] = useState('');
  const [cartError, setCartError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const query = params.toString();
  useEffect(() => {
    if (!selection) return;
    const controller = new AbortController();
    api(`/products/${selection.id}/variants`, { signal: controller.signal }).then(rows => {
      setVariants(rows); setVariantId(String(rows[0].id));
    }).catch(e => { if (e.name !== 'AbortError') setCartError(e.message); });
    return () => controller.abort();
  }, [selection]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    Promise.all([api(`/products?${query}`, { signal: controller.signal }), api('/categories', { signal: controller.signal })]).then(([products, cats]) => { setData(products); setCategories(cats); }).catch(e => { if (e.name !== 'AbortError') setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, retry]);
  function apply(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (values.minPrice && values.maxPrice && Number(values.minPrice) > Number(values.maxPrice)) { setError('Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa.'); return; }
    setParams(Object.fromEntries(Object.entries(values).filter(([,v]) => v.trim() !== '')));
  }
  function choose(product) {
    setSelection(product); setVariants(null); setVariantId(''); setCartError(''); setNotice('');
  }
  async function add() {
    setBusy(true); setCartError('');
    try { await api('/buyer/cart/items', { method: 'POST', body: { variantId: Number(variantId), quantity: 1 } }); setSelection(null); setNotice('Đã thêm sản phẩm vào giỏ hàng.'); } catch(e) { setCartError(e.message); } finally { setBusy(false); }
  }
  function turn(page) { const next = new URLSearchParams(params); next.set('page', String(page)); setParams(next); }
  return <><header className="page-header"><div><p className="eyebrow">KHÁM PHÁ & LỰA CHỌN</p><h1>Danh mục sản phẩm</h1><p className="muted">Tìm món đồ phù hợp với bạn.</p></div><Link className="cart-link" to={user ? '/cart' : '/login'}>Giỏ hàng ↗</Link></header>
    <form className="discovery-form" key={query} onSubmit={apply}><div className="search-row"><label className="search-input"><span aria-hidden="true">⌕</span><input name="keyword" aria-label="Tìm sản phẩm theo tên" defaultValue={params.get('keyword') || ''} maxLength={255} placeholder="Nhập tên điện thoại, máy tính, phụ kiện… cần tìm" /><button type="submit" aria-label="Tìm kiếm">⌕</button></label><button type="button" className="primary filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>☷ Bộ lọc</button></div><div className={`filter-panel ${filtersOpen ? 'open' : ''}`}><label>Danh mục<select name="categoryId" defaultValue={params.get('categoryId') || ''}><option value="">Tất cả danh mục</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Giá từ (₫)<input type="number" name="minPrice" min="0" max="9999999999999999.99" step="0.01" defaultValue={params.get('minPrice') || ''} /></label><label>Đến (₫)<input type="number" name="maxPrice" min="0" max="9999999999999999.99" step="0.01" defaultValue={params.get('maxPrice') || ''} /></label><button className="primary">Áp dụng</button><button type="button" className="text-button" onClick={() => setParams({})}>Xóa bộ lọc</button></div></form>
    {notice && <p className="success" role="status">{notice} <Link to="/cart">Xem giỏ hàng →</Link></p>}<div className="section-heading"><h2>Sản phẩm nổi bật</h2>{data && !loading && !error && <span>{data.totalElements} sản phẩm</span>}</div>
    {loading ? <div className="state" role="status">Đang tải sản phẩm…</div> : error ? <div className="state error" role="alert"><p>{error}</p><button onClick={() => setRetry(retry+1)}>Thử lại</button></div> : !data?.items.length ? <div className="state"><h2>Không tìm thấy sản phẩm</h2><p>Thử từ khóa khác hoặc xóa bớt bộ lọc.</p><button onClick={() => setParams({})}>Xóa bộ lọc</button></div> : <><div className="product-grid">{data.items.map(p => <ProductCard key={p.id} product={p} onChoose={choose} />)}</div><nav className="pagination" aria-label="Phân trang"><button disabled={data.page === 0} onClick={() => turn(data.page-1)}>← Trước</button>{Array.from({length: Math.min(5, data.totalPages)}, (_,i) => Math.min(Math.max(0,data.page-2),Math.max(0,data.totalPages-5))+i).map(p => <button key={p} aria-current={p === data.page ? 'page' : undefined} onClick={() => turn(p)}>{p+1}</button>)}<span>/ {data.totalPages}</span><button disabled={data.page+1 >= data.totalPages} onClick={() => turn(data.page+1)}>Sau →</button></nav></>}
    {selection && <div className="modal-overlay"><section className="variant-modal" role="dialog" aria-modal="true" aria-labelledby="variant-title"><button autoFocus className="modal-close" aria-label="Đóng" disabled={busy} onClick={() => setSelection(null)}>×</button><h2 id="variant-title">{selection.name}</h2><p className="muted">Chọn biến thể đang bán. Giỏ chưa giữ tồn kho.</p>{cartError && <p className="error" role="alert">{cartError}</p>}{!variants && !cartError && <p role="status">Đang tải biến thể…</p>}{variants && <label>Biến thể<select value={variantId} onChange={e => setVariantId(e.target.value)}>{variants.map(v => <option key={v.id} value={v.id}>#{v.id} · {money(v.price)} · Còn {v.stock}</option>)}</select></label>}{!user ? <Link className="primary" to="/login" state={{ from: '/products' }}>Đăng nhập để thêm vào giỏ</Link> : !user.roles.includes('BUYER') ? <p className="error">Tài khoản cần vai trò Buyer để mua hàng.</p> : <button className="primary" disabled={!variantId || busy} onClick={add}>{busy ? 'Đang thêm…' : 'Thêm vào giỏ hàng'}</button>}</section></div>}
  </>;
}
