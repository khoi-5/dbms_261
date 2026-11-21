import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import AddProductModal from './AddProductModal';
import ProductImage from '../../components/ProductImage';

// ─── Sub-component: Hàng mở rộng variant (Chế độ xem nhanh) ─────────────────
function VariantRow({ productId, onVariantChange, showNotification }) {
  const [variants, setVariants] = useState(null);
  const [loadingId, setLoadingId] = useState(null); // variantId đang loading

  useEffect(() => {
    let alive = true;
    api(`/seller/products/${productId}/variants`)
      .then(res => { if (alive) setVariants(res); })
      .catch(() => { if (alive) setVariants([]); });
    return () => { alive = false; };
  }, [productId]);

  const toggleActive = async (v) => {
    setLoadingId(v.variantId);
    try {
      const updated = await api(`/seller/products/variants/${v.variantId}/toggle`, { method: 'PATCH' });
      setVariants(prev => prev.map(x => x.variantId === v.variantId ? updated : x));
      onVariantChange?.();
    } catch (err) {
      showNotification(err.message || 'Không thể cập nhật trạng thái.', true);
    } finally {
      setLoadingId(null);
    }
  };

  if (variants === null) {
    return (
      <tr>
        <td colSpan="7" style={{ padding: '16px 32px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>Đang tải phân loại...</span>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan="7" style={{ padding: '0 0 10px', backgroundColor: '#f8fafc', borderBottom: '2px solid #bfdbfe' }}>
        <div style={{ margin: '0 20px 8px 76px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0 8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Danh sách phân loại hàng ({variants.length})
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#cbd5e1' }} />
          </div>

          {/* Danh sách variant */}
          {variants.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '13px', padding: '8px 0' }}>Chưa có phân loại nào.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr',
                gap: '8px', padding: '4px 12px',
                fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase'
              }}>
                <span>Tên phân loại</span>
                <span>Giá bán</span>
                <span>Tồn kho</span>
                <span>Trạng thái</span>
              </div>

              {variants.map(v => {
                const busy = loadingId === v.variantId;
                return (
                  <div
                    key={v.variantId}
                    style={{
                      display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr',
                      gap: '8px', alignItems: 'center',
                      backgroundColor: '#ffffff', borderRadius: '8px',
                      padding: '9px 12px', border: '1px solid #e2e8f0',
                      opacity: busy ? 0.6 : 1, transition: 'opacity 0.15s'
                    }}
                  >
                    {/* Tên */}
                    <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>
                      {v.variantName || '(Mặc định)'}
                    </span>
                    {/* Giá */}
                    <span style={{ color: '#b45309', fontSize: '13px', fontWeight: '700' }}>
                      {Number(v.price).toLocaleString('vi-VN')} đ
                    </span>
                    {/* Tồn kho */}
                    <span style={{ color: v.stock === 0 ? '#dc2626' : '#15803d', fontSize: '13px', fontWeight: '600' }}>
                      {v.stock} sp
                    </span>
                    {/* Trạng thái toggle */}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => toggleActive(v)}
                      title="Bấm để bật / tắt trạng thái bán"
                      style={{
                        padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                        border: `1px solid ${v.active ? '#bbf7d0' : '#e2e8f0'}`,
                        cursor: busy ? 'not-allowed' : 'pointer',
                        backgroundColor: v.active ? '#dcfce7' : '#f1f5f9',
                        color: v.active ? '#15803d' : '#64748b',
                        width: 'fit-content', transition: 'all 0.15s ease'
                      }}
                    >
                      {v.active ? 'Đang bán' : 'Đã tắt'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SellerProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalSubType, setAddModalSubType] = useState('Books');
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Expandable rows
  const [expandedProductId, setExpandedProductId] = useState(null);

  const [filterSubType, setFilterSubType] = useState('ALL');
  const [filterStock, setFilterStock] = useState('ALL');

  const showNotification = (msg, isError = false) => {
    setFeedbackMsg({ text: msg, isError });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const fetchProducts = useCallback(async (keyword = '', silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const query = keyword.trim() ? `?keyword=${encodeURIComponent(keyword.trim())}` : '';
      const data = await api(`/seller/products${query}`);
      setProducts(data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách sản phẩm.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchProducts(searchTerm); };

  const openDeleteModal = (p) => setDeletingProduct(p);

  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    setActionLoading(true);
    try {
      await api(`/seller/products/${deletingProduct.id}`, { method: 'DELETE' });
      showNotification('Đã xóa sản phẩm thành công.');
      setDeletingProduct(null);
      if (expandedProductId === deletingProduct.id) setExpandedProductId(null);
      fetchProducts(searchTerm, true);
    } catch (err) {
      showNotification(err.message || 'Không thể xóa sản phẩm.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setAddModalSubType(p.subType || 'Books');
    setIsAddModalOpen(true);
  };

  const toggleExpand = (productId) => {
    setExpandedProductId(prev => prev === productId ? null : productId);
  };

  const filteredProducts = products.filter(p => {
    if (filterSubType === 'Books' && p.subType !== 'Books') return false;
    if (filterSubType === 'Clothes' && p.subType !== 'Clothes') return false;
    if (filterSubType === 'Electronics' && p.subType !== 'Electronics') return false;
    if (filterStock === 'IN_STOCK' && p.stock <= 0) return false;
    if (filterStock === 'OUT_OF_STOCK' && p.stock > 0) return false;
    return true;
  });

  const countBooks = products.filter(p => p.subType === 'Books').length;
  const countClothes = products.filter(p => p.subType === 'Clothes').length;
  const countElec = products.filter(p => p.subType === 'Electronics').length;

  const subTypeLabel = { Books: 'Sách', Clothes: 'Thời trang', Electronics: 'Thiết bị điện tử' };

  const formatPriceRange = (p) => {
    const min = p.minPrice ?? p.price;
    const max = p.maxPrice ?? p.price;
    if (min !== undefined && max !== undefined && Number(min) !== Number(max)) {
      return `${Number(min).toLocaleString('vi-VN')} đ - ${Number(max).toLocaleString('vi-VN')} đ`;
    }
    return `${Number(min || 0).toLocaleString('vi-VN')} đ`;
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', color: '#0f172a' }}>

      {/* Tiêu đề & Thông báo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Quản lý sản phẩm
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Bấm vào hàng sản phẩm để xem và quản lý từng phân loại hàng.
          </p>
        </div>
        {feedbackMsg && (
          <div style={{
            padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
            backgroundColor: feedbackMsg.isError ? '#fef2f2' : '#f0fdf4',
            color: feedbackMsg.isError ? '#dc2626' : '#16a34a',
            border: `1px solid ${feedbackMsg.isError ? '#fecaca' : '#bbf7d0'}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            {feedbackMsg.text}
          </div>
        )}
      </div>

      {/* Nút thêm sản phẩm */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { subType: 'Books', label: '+ Thêm Sách', color: '#2563eb', shadow: 'rgba(37,99,235,0.25)' },
          { subType: 'Clothes', label: '+ Thêm Thời trang', color: '#7c3aed', shadow: 'rgba(124,58,237,0.25)' },
          { subType: 'Electronics', label: '+ Thêm Thiết bị điện tử', color: '#d97706', shadow: 'rgba(217,119,6,0.25)' },
        ].map(btn => (
          <button
            key={btn.subType}
            type="button"
            onClick={() => { setEditingProduct(null); setAddModalSubType(btn.subType); setIsAddModalOpen(true); }}
            style={{
              backgroundColor: btn.color, color: '#fff', border: 'none',
              padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700',
              cursor: 'pointer', boxShadow: `0 4px 6px -1px ${btn.shadow}`, transition: 'all 0.15s ease'
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Thanh lọc & Tìm kiếm */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '20px', gap: '16px', flexWrap: 'wrap',
        backgroundColor: '#fff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginRight: '4px' }}>Lọc:</span>
          {[
            { key: 'ALL', label: `Tất cả (${products.length})` },
            { key: 'Books', label: `Sách (${countBooks})` },
            { key: 'Clothes', label: `Thời trang (${countClothes})` },
            { key: 'Electronics', label: `Điện tử (${countElec})` },
          ].map(f => {
            const active = filterSubType === f.key;
            return (
              <button key={f.key} type="button" onClick={() => setFilterSubType(f.key)} style={{
                padding: '6px 12px', borderRadius: '20px', border: 'none',
                backgroundColor: active ? '#2563eb' : '#f1f5f9',
                color: active ? '#fff' : '#475569',
                fontSize: '12px', fontWeight: active ? '700' : '500', cursor: 'pointer'
              }}>
                {f.label}
              </button>
            );
          })}
          <select value={filterStock} onChange={e => setFilterStock(e.target.value)} style={{
            padding: '6px 10px', borderRadius: '20px', border: '1px solid #cbd5e1',
            backgroundColor: '#fff', fontSize: '12px', color: '#334155', cursor: 'pointer', marginLeft: '6px'
          }}>
            <option value="ALL">Tất cả tồn kho</option>
            <option value="IN_STOCK">Còn hàng</option>
            <option value="OUT_OF_STOCK">Hết hàng</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '340px', maxWidth: '100%' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text" placeholder="Tìm theo tên sản phẩm (nhấn Enter)..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '9px 36px 9px 40px', borderRadius: '20px',
              border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#f8fafc',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
          {searchTerm && (
            <button type="button" onClick={() => { setSearchTerm(''); fetchProducts(''); }}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}>✕</button>
          )}
        </form>
      </div>

      {/* Bảng sản phẩm */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', color: '#0f172a' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 16px', width: '36px' }} /> {/* mũi tên expand */}
                <th style={{ padding: '14px 12px', width: '56px' }}>Ảnh</th>
                <th style={{ padding: '14px 12px' }}>Sản phẩm</th>
                <th style={{ padding: '14px 12px' }}>Danh mục</th>
                <th style={{ padding: '14px 12px' }}>Giá bán</th>
                <th style={{ padding: '14px 12px' }}>Tổng kho</th>
                <th style={{ padding: '14px 12px', textAlign: 'center', width: '140px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && products.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <div style={{ marginTop: '10px', fontSize: '13px' }}>Đang tải dữ liệu...</div>
                </td></tr>
              ) : error ? (
                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#dc2626', backgroundColor: '#fef2f2' }}>{error}</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Không có sản phẩm nào phù hợp.</td></tr>
              ) : (
                filteredProducts.map(p => {
                  const isExpanded = expandedProductId === p.id;
                  const hasStock = p.stock > 0;
                  return (
                    <React.Fragment key={p.id}>
                      {/* Hàng sản phẩm chính */}
                      <tr
                        style={{ borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.1s', backgroundColor: isExpanded ? '#f8fafc' : 'transparent' }}
                        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        onClick={() => toggleExpand(p.id)}
                      >
                        {/* Mũi tên */}
                        <td style={{ padding: '12px 8px 12px 16px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block', fontSize: '10px', color: '#2563eb',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s'
                          }}>▶</span>
                        </td>

                        {/* Ảnh */}
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: '#f1f5f9', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <ProductImage src={p.image} name={p.name} category={p.categoryName || p.subType} />
                          </div>
                        </td>

                        {/* Tên & thông tin phụ */}
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px', marginBottom: '2px' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {p.manufacturer && <span>Hãng: {p.manufacturer}</span>}
                            {p.publisher && <span>NXB: {p.publisher}</span>}
                            {p.material && <span>Vải: {p.material}</span>}
                            {p.warrantyTime && <span>BH: {p.warrantyTime}</span>}
                          </div>
                        </td>

                        {/* Danh mục */}
                        <td style={{ padding: '12px 8px', color: '#334155', fontSize: '13px' }}>
                          <div>{p.categoryName}</div>
                          <span style={{ display: 'inline-block', marginTop: '3px', padding: '1px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                            {subTypeLabel[p.subType] || p.subType}
                          </span>
                        </td>

                        {/* Giá */}
                        <td style={{ padding: '12px 8px', fontWeight: '700', color: '#b45309', whiteSpace: 'nowrap', fontSize: '13px' }}>
                          {formatPriceRange(p)}
                        </td>

                        {/* Tổng kho */}
                        <td style={{ padding: '12px 8px', fontSize: '13px' }}>
                          <span style={{ color: hasStock ? '#15803d' : '#dc2626', fontWeight: '700' }}>{p.stock}</span>
                          <span style={{ color: '#64748b', fontSize: '11px' }}> sp</span>
                        </td>

                        {/* Hành động (ngăn click expand) */}
                        <td style={{ padding: '12px 8px', textAlign: 'center', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditModal(p)} style={{
                            backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                            padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                            cursor: 'pointer', marginRight: '6px'
                          }}>Sửa</button>
                          {p.hasOrders ? (
                            <button
                              type="button"
                              disabled
                              title="Sản phẩm đã có lịch sử đơn hàng của người mua, không thể xóa để bảo toàn dữ liệu giao dịch."
                              style={{
                                backgroundColor: '#f1f5f9',
                                color: '#94a3b8',
                                border: '1px solid #e2e8f0',
                                padding: '5px 12px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'not-allowed',
                                opacity: 0.65
                              }}
                            >
                              Xóa
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openDeleteModal(p)}
                              title="Xóa sản phẩm này"
                              style={{
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                padding: '5px 12px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Xóa
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Hàng mở rộng variant */}
                      {isExpanded && (
                        <VariantRow
                          productId={p.id}
                          onVariantChange={() => fetchProducts(searchTerm, true)}
                          showNotification={showNotification}
                        />
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Sửa sản phẩm */}
      {isAddModalOpen && (
        <AddProductModal
          productToEdit={editingProduct}
          initialSubType={addModalSubType}
          onClose={() => { setIsAddModalOpen(false); setEditingProduct(null); }}
          onSuccess={() => {
            showNotification(editingProduct ? 'Đã cập nhật sản phẩm thành công!' : 'Đã đăng bán sản phẩm mới!');
            fetchProducts(searchTerm);
          }}
        />
      )}

      {/* Modal xác nhận xóa */}
      {deletingProduct && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px',
            padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', border: '1px solid #f1f5f9'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px' }}>Xác nhận xóa sản phẩm</h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px', lineHeight: '1.5' }}>
              Bạn có chắc muốn xóa <strong style={{ color: '#0f172a' }}>"{deletingProduct.name}"</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" disabled={actionLoading} onClick={() => setDeletingProduct(null)} style={{
                padding: '9px 18px', backgroundColor: '#f1f5f9', color: '#475569',
                border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
              }}>Hủy bỏ</button>
              <button type="button" disabled={actionLoading} onClick={confirmDeleteProduct} style={{
                padding: '9px 20px', backgroundColor: '#ef4444', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                cursor: actionLoading ? 'not-allowed' : 'pointer'
              }}>
                {actionLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
