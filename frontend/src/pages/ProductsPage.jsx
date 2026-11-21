import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { normalizeCatalogParams } from '../config/catalog';
import ProductCard from '../components/ProductCard';
import ProductPurchaseModal from '../components/ProductPurchaseModal';

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catExpanded, setCatExpanded] = useState(false);
  const [selection, setSelection] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const query = normalizeCatalogParams(params).toString();

  useEffect(() => {
    if (params.toString() !== query) {
      setParams(new URLSearchParams(query), { replace: true });
    }
  }, [params, query, setParams]);

  useEffect(() => {
    api('/categories')
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    api(`/products?${query}`, { signal: controller.signal })
      .then(products => {
        setData(products);
      })
      .catch(e => {
        if (e.name !== 'AbortError') setError(e.message || 'Lỗi tải danh sách sản phẩm');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query]);

  function handleSearch(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const keyword = formData.get('keyword')?.toString() || '';
    const next = new URLSearchParams(query);
    if (keyword.trim()) next.set('keyword', keyword.trim());
    else next.delete('keyword');
    next.set('page', '0');
    setParams(normalizeCatalogParams(next));
  }

  function handleFilterSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const next = new URLSearchParams(query);

    const catId = formData.get('categoryId')?.toString();
    const minPrice = formData.get('minPrice')?.toString();
    const maxPrice = formData.get('maxPrice')?.toString();

    if (catId) next.set('categoryId', catId);
    else next.delete('categoryId');

    if (minPrice) next.set('minPrice', minPrice);
    else next.delete('minPrice');

    if (maxPrice) next.set('maxPrice', maxPrice);
    else next.delete('maxPrice');

    next.set('page', '0');
    setParams(normalizeCatalogParams(next));
  }

  function clearFilters() {
    const next = new URLSearchParams();
    if (params.get('keyword')) next.set('keyword', params.get('keyword'));
    next.set('page', '0');
    setParams(normalizeCatalogParams(next));
  }

  function turnPage(page) {
    const next = new URLSearchParams(query);
    next.set('page', String(page));
    setParams(next);
  }

  const selectedCatId = params.get('categoryId') || '';
  const selectedFormat = params.get('format') || '';

  // Lọc danh mục linh hoạt động theo Target_Type do Admin cấu hình trong CSDL
  const displayedCategories = categories.filter(c => {
    if (!selectedFormat) return true;
    return c.targetType === selectedFormat;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Tiêu đề trang */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Danh mục sản phẩm
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          Tìm kiếm và khám phá các sản phẩm đa định dạng từ các gian hàng uy tín.
        </p>
      </div>

      {/* Bộ lọc theo Định dạng chuyên biệt: Sách, Thời trang, Điện tử */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        {[
          { key: '', label: 'Tất cả' },
          { key: 'BOOK', label: 'Sách' },
          { key: 'CLOTHES', label: 'Thời trang' },
          { key: 'ELECTRONICS', label: 'Thiết bị điện tử' },
        ].map(tab => {
          const isActive = selectedFormat === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                const next = new URLSearchParams(query);
                if (tab.key) next.set('format', tab.key);
                else next.delete('format');

                // Tự động bỏ category nếu category đang chọn không thuộc về loại mới
                if (tab.key && selectedCatId) {
                  const currCat = categories.find(c => c.id === Number(selectedCatId));
                  if (currCat && currCat.targetType !== tab.key) {
                    next.delete('categoryId');
                  }
                }

                next.set('page', '0');
                setParams(normalizeCatalogParams(next));
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                color: isActive ? '#2563eb' : '#64748b',
                fontWeight: isActive ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Thanh tìm kiếm: Đặt icon kính lúp bên trái, không cần button đỏ, nhấn Enter để tìm kiếm */}
      <form
        onSubmit={handleSearch}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '0 16px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
          marginBottom: '20px',
          transition: 'all 0.2s ease'
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginRight: '12px', flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        <input
          name="keyword"
          defaultValue={params.get('keyword') || ''}
          placeholder="Tìm kiếm sản phẩm theo tên, danh mục (nhấn Enter để tìm)..."
          style={{
            width: '100%',
            height: '46px',
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            backgroundColor: 'transparent',
            color: '#0f172a'
          }}
        />

        {params.get('keyword') && (
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(query);
              next.delete('keyword');
              next.set('page', '0');
              setParams(normalizeCatalogParams(next));
            }}
            title="Xóa tìm kiếm"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              fontSize: '14px'
            }}
          >
            ✕
          </button>
        )}
      </form>

      {/* Khu vực bộ lọc: Danh mục và Khoảng giá */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '24px',
        padding: '12px 16px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        {/* Nhóm chip Danh mục */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(query);
              next.delete('categoryId');
              next.set('page', '0');
              setParams(normalizeCatalogParams(next));
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: !selectedCatId ? '700' : '500',
              backgroundColor: !selectedCatId ? '#2563eb' : '#f1f5f9',
              color: !selectedCatId ? '#ffffff' : '#475569',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Tất cả
          </button>

          {(catExpanded ? displayedCategories : displayedCategories.slice(0, 8)).map(c => {
            const isSelected = selectedCatId === String(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(query);
                  next.set('categoryId', String(c.id));
                  next.set('page', '0');
                  setParams(normalizeCatalogParams(next));
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: isSelected ? '700' : '500',
                  backgroundColor: isSelected ? '#2563eb' : '#f1f5f9',
                  color: isSelected ? '#ffffff' : '#475569',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {c.name}
              </button>
            );
          })}

          {displayedCategories.length > 8 && (
            <button
              type="button"
              onClick={() => setCatExpanded(v => !v)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: 'transparent',
                color: '#2563eb',
                border: '1px dashed #93c5fd',
                cursor: 'pointer'
              }}
            >
              {catExpanded ? 'Thu gọn ▲' : `+${displayedCategories.length - 8} thêm ▼`}
            </button>
          )}
        </div>

        {/* Lọc theo khoảng giá gọn gàng */}
        <form
          onSubmit={handleFilterSubmit}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Khoảng giá:</span>
          <input
            type="number"
            name="minPrice"
            placeholder="Từ ₫"
            defaultValue={params.get('minPrice') || ''}
            min="0"
            step="1000"
            style={{
              width: '95px',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: '#ffffff'
            }}
          />
          <span style={{ color: '#94a3b8' }}>–</span>
          <input
            type="number"
            name="maxPrice"
            placeholder="Đến ₫"
            defaultValue={params.get('maxPrice') || ''}
            min="0"
            step="1000"
            style={{
              width: '95px',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: '#ffffff'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Lọc
          </button>
          {(params.get('minPrice') || params.get('maxPrice')) && (
            <button
              type="button"
              onClick={clearFilters}
              title="Xóa khoảng giá"
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                border: 'none',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* Thông báo thao tác */}
      {notice && (
        <div style={{
          padding: '12px 18px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#16a34a',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {notice}
        </div>
      )}

      {/* Header khu vực sản phẩm nổi bật & Chỉ báo trạng thái tải */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Sản phẩm nổi bật
          </h2>
          {loading && data && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#2563eb',
              backgroundColor: '#eff6ff',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: '500'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb', display: 'inline-block', animation: 'pulse 1s infinite' }} />
              Đang làm mới...
            </span>
          )}
        </div>
        {data && (
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            {data.totalElements} sản phẩm
          </span>
        )}
      </div>

      {/* Lưới sản phẩm - Giữ layout mượt mà, chống giựt màn hình khi lọc */}
      {!data && loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ marginTop: '12px', fontSize: '14px' }}>Đang tải danh sách sản phẩm...</div>
        </div>
      ) : error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
          {error}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center',
          border: '1px solid #f1f5f9'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>
            Không tìm thấy sản phẩm phù hợp
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
            Thử nhập từ khóa tìm kiếm khác hoặc xóa bớt tiêu chí lọc.
          </p>
          <button 
            onClick={clearFilters}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div style={{
          opacity: loading ? 0.45 : 1,
          transition: 'opacity 0.15s ease',
          pointerEvents: loading ? 'none' : 'auto',
          minHeight: '400px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '20px',
            marginBottom: '36px'
          }}>
            {data.items.map(p => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onChoose={(prod) => {
                  setSelection(prod);
                  setNotice('');
                }} 
              />
            ))}
          </div>

          {/* Phân trang đúng Figma */}
          {data.totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginTop: '32px'
            }}>
              <button 
                disabled={data.page === 0} 
                onClick={() => turnPage(data.page - 1)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: data.page === 0 ? '#cbd5e1' : '#64748b',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: data.page === 0 ? 'not-allowed' : 'pointer',
                  padding: '6px 12px'
                }}
              >
                ← Trước
              </button>

              {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                const pageNum = Math.min(Math.max(0, data.page - 2), Math.max(0, data.totalPages - 5)) + i;
                const isCurrent = pageNum === data.page;
                return (
                  <button 
                    key={pageNum}
                    onClick={() => turnPage(pageNum)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isCurrent ? '#2563eb' : 'transparent',
                      color: isCurrent ? '#ffffff' : '#64748b',
                      fontSize: '13px',
                      fontWeight: isCurrent ? '700' : '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}

              <button 
                disabled={data.page + 1 >= data.totalPages} 
                onClick={() => turnPage(data.page + 1)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: data.page + 1 >= data.totalPages ? '#cbd5e1' : '#64748b',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: data.page + 1 >= data.totalPages ? 'not-allowed' : 'pointer',
                  padding: '6px 12px'
                }}
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Mua hàng */}
      {selection && (
        <ProductPurchaseModal 
          product={selection} 
          onClose={() => setSelection(null)} 
          onAdded={(quantity) => {
            setSelection(null);
            setNotice(`Đã thêm ${quantity} sản phẩm "${selection.name}" vào giỏ hàng thành công!`);
          }} 
        />
      )}

    </div>
  );
}
