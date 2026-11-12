import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { normalizeCatalogParams } from '../config/catalog';
import ProductCard from '../components/ProductCard';
import ProductPurchaseModal from '../components/ProductPurchaseModal';
import { SearchIcon } from '../components/Icons';

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState('');
  const [categoryRetry, setCategoryRetry] = useState(0);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selection, setSelection] = useState(null);
  const [notice, setNotice] = useState('');
  const query = normalizeCatalogParams(params).toString();
  useEffect(() => {
    if (params.toString() !== query) setParams(new URLSearchParams(query), { replace: true });
  }, [params, query, setParams]);
  useEffect(() => {
    const controller = new AbortController();
    setCategoryError('');
    api('/categories', { signal: controller.signal }).then(setCategories).catch(e => {
      if (e.name !== 'AbortError') setCategoryError(e.message);
    });
    return () => controller.abort();
  }, [categoryRetry]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    api(`/products?${query}`, { signal: controller.signal }).then(products => {
      const lastPage = Math.max(0, products.totalPages - 1);
      if (products.page > lastPage) {
        const next = new URLSearchParams(query); next.set('page', String(lastPage));
        setParams(next, { replace: true });
        setNotice('Trang yêu cầu không còn hợp lệ. Đã chuyển về trang hợp lệ gần nhất.');
        return;
      }
      setData(products);
    }).catch(e => { if (e.name !== 'AbortError') setError(e.message); }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [query, retry, setParams]);
  function apply(e) {
    e.preventDefault(); setFormError('');
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (values.minPrice && values.maxPrice && Number(values.minPrice) > Number(values.maxPrice)) {
      setFormError('Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa.'); return;
    }
    const next = new URLSearchParams(Object.fromEntries(Object.entries(values).filter(([,v]) => v.trim() !== '')));
    next.set('size', new URLSearchParams(query).get('size')); next.set('page', '0');
    setNotice(''); setParams(normalizeCatalogParams(next));
  }
  function clearFilters() {
    setFormError(''); setNotice('');
    setParams(normalizeCatalogParams({ size: new URLSearchParams(query).get('size'), page: '0' }));
  }
  function turn(page) {
    const next = new URLSearchParams(query); next.set('page', String(page)); setParams(next);
  }
  return <>
    <header className="page-header"><div><p className="eyebrow">KHÁM PHÁ & LỰA CHỌN</p><h1>Danh mục sản phẩm</h1><p className="muted">Tìm món đồ phù hợp với bạn.</p></div><Link className="cart-link" to={user ? '/cart' : '/login'}>Giỏ hàng ↗</Link></header>
    <form className="discovery-form" key={query} onSubmit={apply}>
      <div className="search-row"><label className="search-input"><input name="keyword" aria-label="Tìm sản phẩm theo tên" defaultValue={params.get('keyword') || ''} maxLength={255} placeholder="Nhập tên điện thoại, máy tính, phụ kiện… cần tìm" /><button type="submit" aria-label="Tìm kiếm"><SearchIcon /></button></label><button type="button" className="primary filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>Bộ lọc</button></div>
      <div className={`filter-panel ${filtersOpen ? 'open' : ''}`}>
        <label>Danh mục<select name="categoryId" defaultValue={params.get('categoryId') || ''}><option value="">Tất cả danh mục</option>{!categories.length && params.get('categoryId') && <option value={params.get('categoryId')}>Danh mục #{params.get('categoryId')}</option>}{categories.map(c => <option key={c.id} value={c.id}>{c.parentId ? '— ' : ''}{c.name}</option>)}</select></label>
        <label>Giá từ (₫)<input type="number" name="minPrice" min="0" max="9999999999999999.99" step="0.01" defaultValue={params.get('minPrice') || ''} /></label>
        <label>Đến (₫)<input type="number" name="maxPrice" min="0" max="9999999999999999.99" step="0.01" defaultValue={params.get('maxPrice') || ''} /></label>
        <button className="primary">Áp dụng</button><button type="button" className="text-button" onClick={clearFilters}>Xóa bộ lọc</button>
      </div>
      {formError && <p className="error" role="alert">{formError}</p>}
    </form>
    {categoryError && <p className="error" role="alert">Không tải được danh mục. {categoryError} <button onClick={() => setCategoryRetry(categoryRetry + 1)}>Tải lại danh mục</button></p>}
    {notice && <p className="success" role="status">{notice}</p>}
    <div className="section-heading"><h2>Sản phẩm nổi bật</h2>{data && !loading && !error && <span>{data.totalElements} sản phẩm</span>}</div>
    <p className="muted catalog-price-note">Giá “từ” là giá thấp nhất của biến thể đang bán và còn hàng. Bộ lọc giá áp dụng trên giá này.</p>
    {loading || (!data && !error) ? <div className="state" role="status">Đang tải sản phẩm…</div> : error ? <div className="state error" role="alert"><p>{error}</p><button onClick={() => setRetry(retry + 1)}>Thử lại</button></div> : !data.items.length ? <div className="state"><h2>Không tìm thấy sản phẩm</h2><p>Thử từ khóa khác hoặc xóa bớt bộ lọc.</p><button onClick={clearFilters}>Xóa bộ lọc</button></div> : <>
      <div className="product-grid">{data.items.map(p => <ProductCard key={p.id} product={p} onChoose={product => { setSelection(product); setNotice(''); }} />)}</div>
      <nav className="pagination" aria-label="Phân trang"><button disabled={data.page === 0} onClick={() => turn(data.page - 1)}>← Trước</button>{Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => Math.min(Math.max(0, data.page - 2), Math.max(0, data.totalPages - 5)) + i).map(p => <button key={p} aria-current={p === data.page ? 'page' : undefined} onClick={() => turn(p)}>{p + 1}</button>)}<span>/ {data.totalPages}</span><button disabled={data.page + 1 >= data.totalPages} onClick={() => turn(data.page + 1)}>Sau →</button></nav>
    </>}
    {selection && <ProductPurchaseModal product={selection} onClose={() => setSelection(null)} onAdded={quantity => { setSelection(null); setNotice(`Đã thêm ${quantity} sản phẩm vào giỏ hàng.`); }} />}
  </>;
}
