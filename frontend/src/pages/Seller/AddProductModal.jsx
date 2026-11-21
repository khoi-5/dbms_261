import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';

export default function AddProductModal({ onClose, onSuccess, productToEdit = null, initialSubType = 'Books' }) {
  const isEdit = Boolean(productToEdit);
  const fileInputRef = useRef(null);

  // Loại chuyên biệt được cố định ngay từ nút bấm bên ngoài
  const subType = productToEdit?.subType || initialSubType;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  // Placeholder phù hợp từng định dạng
  const typeConfig = {
    Books: {
      title: isEdit ? 'Chỉnh sửa Sách' : 'Thêm Sách mới',
      badge: 'Sách',
      badgeColor: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
      namePlaceholder: 'Ví dụ: Giáo trình Cơ Sở Dữ Liệu, Đắc Nhân Tâm, Lập trình Java...',
      brandPlaceholder: 'Ví dụ: NXB Trẻ, NXB ĐHQG TP.HCM, NXB Kim Đồng...',
      variantDefaultLabel: 'Bìa mềm'
    },
    Clothes: {
      title: isEdit ? 'Chỉnh sửa Thời trang' : 'Thêm sản phẩm Thời trang mới',
      badge: 'Thời trang',
      badgeColor: { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
      namePlaceholder: 'Ví dụ: Áo Thun Thể Thao Nam QuickDry, Quần Jeans Slimfit...',
      brandPlaceholder: 'Ví dụ: Coolmate, Biti\'s, Canifa, Uniqlo...',
      variantDefaultLabel: 'Size L - Đen'
    },
    Electronics: {
      title: isEdit ? 'Chỉnh sửa Thiết bị điện tử' : 'Thêm Thiết bị điện tử mới',
      badge: 'Điện tử',
      badgeColor: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
      namePlaceholder: 'Ví dụ: Tai Nghe Chống Ồn Sony WH-1000XM5, Điện Thoại Galaxy S24...',
      brandPlaceholder: 'Ví dụ: Sony, Apple, Samsung, Lenovo...',
      variantDefaultLabel: 'Bản Tiêu Chuẩn'
    }
  };

  const currentConfig = typeConfig[subType] || typeConfig.Books;

  // Form dữ liệu sản phẩm
  const [formData, setFormData] = useState({
    name: productToEdit?.name || '',
    categoryId: productToEdit?.categoryId || '',
    manufacturer: productToEdit?.manufacturer || '',
    description: productToEdit?.description || '',
    imageUrl: productToEdit?.image || '',
    // Đặc thù Sách
    publisher: productToEdit?.publisher || '',
    authors: productToEdit?.authors?.join(', ') || '',
    // Đặc thù Thời trang
    material: productToEdit?.material || '',
    // Đặc thù Điện tử
    warrantyId: productToEdit?.warrantyId || '',
    warrantyTime: productToEdit?.warrantyTime || '12 tháng chính hãng'
  });

  // Preview hình ảnh
  const [imagePreview, setImagePreview] = useState(productToEdit?.image || '');

  // Danh sách biến thể
  const [variants, setVariants] = useState([
    {
      name: currentConfig.variantDefaultLabel,
      price: productToEdit?.price ? String(productToEdit.price) : '200000',
      stock: productToEdit?.stock !== undefined ? String(productToEdit.stock) : '50',
      imageUrl: productToEdit?.image || '',
      active: true,
      hasOrders: false
    }
  ]);

  // Nạp toàn bộ variants đầy đủ của sản phẩm khi chỉnh sửa
  useEffect(() => {
    if (!productToEdit?.id) return;
    let alive = true;
    api(`/seller/products/${productToEdit.id}/variants`)
      .then(data => {
        if (!alive || !Array.isArray(data) || data.length === 0) return;
        setVariants(data.map(v => ({
          variantId: v.variantId,
          name: v.variantName || '',
          price: String(v.price ?? 0),
          stock: String(v.stock ?? 0),
          imageUrl: v.image || '',
          active: v.active !== false,
          hasOrders: Boolean(v.hasOrders)
        })));
      })
      .catch(() => { });
    return () => { alive = false; };
  }, [productToEdit?.id]);

  // Nạp toàn bộ variants đầy đủ của sản phẩm khi chỉnh sửa
  useEffect(() => {
    if (!productToEdit?.id) return;
    let alive = true;
    api(`/seller/products/${productToEdit.id}/variants`)
      .then(data => {
        if (!alive || !Array.isArray(data) || data.length === 0) return;
        setVariants(data.map(v => ({
          variantId: v.variantId,
          name: v.variantName || '',
          price: String(v.price ?? 0),
          stock: String(v.stock ?? 0),
          imageUrl: v.image || '',
          active: v.active !== false,
          hasOrders: Boolean(v.hasOrders)
        })));
      })
      .catch(() => { });
    return () => { alive = false; };
  }, [productToEdit?.id]);

  // Tải và lọc danh mục phù hợp với loại sản phẩm chuyên biệt
  useEffect(() => {
    let alive = true;
    api('/categories')
      .then(data => {
        if (!alive || !data) return;

        // Lọc danh mục linh hoạt theo Target_Type do Admin cấu hình trong CSDL
        const typeMapping = { Books: 'BOOK', Clothes: 'CLOTHES', Electronics: 'ELECTRONICS' };
        const requiredType = typeMapping[subType];
        const filtered = requiredType
          ? data.filter(c => c.targetType === requiredType)
          : data;

        // Nếu lọc không ra thì fallback toàn bộ danh mục
        const finalCategories = filtered.length > 0 ? filtered : data;
        setCategories(finalCategories);

        if (!formData.categoryId && finalCategories.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: finalCategories[0].id }));
        }
      })
      .catch(() => { });
    return () => { alive = false; };
  }, [subType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Xử lý upload ảnh lưu trực tiếp vào Server Storage (uploads/products/)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Dung lượng ảnh tối đa 5MB.');
      return;
    }

    setError('');
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setUploadingImage(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api('/seller/products/upload', {
        method: 'POST',
        body: fd
      });
      if (res?.url) {
        setFormData(prev => ({ ...prev, imageUrl: res.url }));
      }
    } catch (err) {
      setError(err.message || 'Không thể tải ảnh lên máy chủ. Vui lòng thử lại.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Quản lý biến thể
  const addVariant = () => {
    setVariants(prev => [
      ...prev,
      {
        variantId: null,
        name: `${currentConfig.variantDefaultLabel} #${prev.length + 1}`,
        price: '250000',
        stock: '20',
        imageUrl: '',
        active: true,
        hasOrders: false
      }
    ]);
  };

  const toggleVariantActive = (index) => {
    setVariants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], active: !next[index].active };
      return next;
    });
  };

  const removeVariant = (index) => {
    if (variants.length <= 1) {
      setError('Sản phẩm cần tối thiểu 1 biến thể.');
      return;
    }
    const target = variants[index];
    if (target.hasOrders) {
      setError(`Không thể xóa biến thể "${target.name || 'này'}" vì đã phát sinh đơn hàng trong hệ thống. Vui lòng nhấn vào trạng thái để chuyển sang "Tắt bán".`);
      return;
    }
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index, field, value) => {
    setVariants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Kiểm tra biến thể
    const parsedVariants = [];
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const p = Number(v.price);
      const s = Number(v.stock);
      if (isNaN(p) || p < 0) {
        setError(`Giá bán của biến thể #${i + 1} không hợp lệ.`);
        return;
      }
      if (isNaN(s) || s < 0) {
        setError(`Số lượng tồn kho của biến thể #${i + 1} không được âm.`);
        return;
      }
      parsedVariants.push({
        variantId: v.variantId || null,
        price: p,
        stock: s,
        variantName: v.name?.trim() || `Biến thể #${i + 1}`,
        imageUrl: formData.imageUrl?.trim() || null,
        active: v.active !== false
      });
    }

    const payload = {
      name: formData.name.trim(),
      categoryId: Number(formData.categoryId),
      price: parsedVariants[0].price,
      stock: parsedVariants[0].stock,
      imageUrl: formData.imageUrl?.trim() || null,
      manufacturer: formData.manufacturer?.trim() || null,
      description: formData.description?.trim() || null,
      subType: subType,
      // Đặc thù Sách
      publisher: subType === 'Books' ? (formData.publisher?.trim() || 'NXB Đại Học Quốc Gia') : null,
      authors: subType === 'Books'
        ? (formData.authors ? formData.authors.split(',').map(a => a.trim()).filter(Boolean) : ['Đang cập nhật'])
        : null,
      // Đặc thù Thời trang
      material: subType === 'Clothes' ? (formData.material?.trim() || '100% Cotton') : null,
      // Đặc thù Điện tử
      warrantyId: subType === 'Electronics' ? (formData.warrantyId?.trim() || 'BH-' + Date.now().toString().slice(-6)) : null,
      warrantyTime: subType === 'Electronics' ? (formData.warrantyTime?.trim() || '12 tháng chính hãng') : null,
      // Danh sách các biến thể F02
      variants: parsedVariants
    };

    setLoading(true);
    try {
      if (isEdit) {
        await api(`/seller/products/${productToEdit.id}`, {
          method: 'PUT',
          body: payload
        });
      } else {
        await api('/seller/products', {
          method: 'POST',
          body: payload
        });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Thao tác không thành công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '30px',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #f1f5f9'
      }}>
        {/* Nút đóng góc phải */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '32px',
            height: '32px',
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          title="Đóng"
        >
          ✕
        </button>

        {/* Tiêu đề & Tag chuyên biệt hóa */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'inline-block', marginBottom: '8px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '3px 10px',
              borderRadius: '6px',
              backgroundColor: currentConfig.badgeColor.bg,
              color: currentConfig.badgeColor.text,
              border: `1px solid ${currentConfig.badgeColor.border}`
            }}>
              {currentConfig.badge}
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px', color: '#0f172a' }}>
            {currentConfig.title}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Điền thông tin chi tiết về sản phẩm bạn muốn đăng bán.
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Khối 2 cột: Thông tin cơ bản & Upload ảnh */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '20px' }}>

            {/* Cột trái: Tên sản phẩm, Danh mục, Hãng, Mô tả */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Tên sản phẩm *
                </label>
                <input
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={currentConfig.namePlaceholder}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Danh mục hệ thống *
                  </label>
                  <select
                    name="categoryId"
                    required
                    value={formData.categoryId}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    {subType === 'Books' ? 'Nhà phát hành' : 'Hãng / Thương hiệu'}
                  </label>
                  <input
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleChange}
                    placeholder={currentConfig.brandPlaceholder}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Mô tả sản phẩm
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Nhập thông tin giới thiệu nguồn gốc, đặc điểm nổi bật..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Cột phải: Khu vực Upload ảnh - Không có link ảnh, chỉ tải ảnh lên */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', display: 'block', marginBottom: '10px' }}>
                Hình ảnh sản phẩm
              </label>

              {/* Khung upload & xem trước */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  height: '170px',
                  borderRadius: '10px',
                  border: imagePreview ? '1px solid #cbd5e1' : '2px dashed #94a3b8',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
              >
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview.startsWith('/uploads/') ? `http://localhost:8080${imagePreview}` : imagePreview}
                      alt="Ảnh sản phẩm"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    {uploadingImage && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.75)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: '700', color: '#2563eb'
                      }}>
                        <div style={{ width: '20px', height: '20px', border: '2px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '6px' }} />
                        Đang lưu ảnh...
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      display: 'flex',
                      gap: '6px'
                    }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: 'rgba(15, 23, 42, 0.75)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Đổi ảnh
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: 'rgba(220, 38, 38, 0.85)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb', marginBottom: '4px' }}>
                      Tải ảnh lên
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      PNG, JPG, WEBP (tối đa 2MB)
                    </div>
                  </div>
                )}
              </div>

              {/* Input file ẩn */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Thông tin chuyên biệt */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '14px 16px',
            borderRadius: '10px',
            border: `1px solid ${currentConfig.badgeColor.border}`
          }}>


            {subType === 'Books' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Nhà xuất bản *
                  </label>
                  <input
                    name="publisher"
                    required
                    value={formData.publisher}
                    onChange={handleChange}
                    placeholder="Ví dụ: NXB Trẻ, NXB ĐHQG TP.HCM, NXB Kim Đồng..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Tác giả (cách nhau bởi dấu phẩy)
                  </label>
                  <input
                    name="authors"
                    value={formData.authors}
                    onChange={handleChange}
                    placeholder="Nguyễn Nhật Ánh, Trần Minh..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            {subType === 'Clothes' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Chất liệu vải *
                </label>
                <input
                  name="material"
                  required
                  value={formData.material}
                  onChange={handleChange}
                  placeholder="Ví dụ: 100% Cotton, Vải đũi thoáng khí, Spandex co giãn..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {subType === 'Electronics' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Thời gian bảo hành *
                  </label>
                  <input
                    name="warrantyTime"
                    required
                    value={formData.warrantyTime}
                    onChange={handleChange}
                    placeholder="Ví dụ: 12 tháng chính hãng, 24 tháng..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Mã bảo hành (nếu có)
                  </label>
                  <input
                    name="warrantyId"
                    value={formData.warrantyId}
                    onChange={handleChange}
                    placeholder="Ví dụ: BH-SONY-2026..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Phân loại & giá bán */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid #cbd5e1'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                  Phân loại hàng
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Thêm các lựa chọn kích thước, màu sắc hoặc phiên bản.
                </div>
              </div>
              <button
                type="button"
                onClick={addVariant}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                + Thêm phân loại
              </button>
            </div>

            {/* Tiêu đề các cột căn hàng chuẩn */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1.1fr 0.9fr 70px 70px',
              gap: '10px',
              padding: '0 12px 6px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#64748b',
              textTransform: 'uppercase'
            }}>
              <div>Tên phân loại *</div>
              <div>Giá bán (₫) *</div>
              <div>Tồn kho *</div>
              <div style={{ textAlign: 'center' }}>Trạng thái</div>
              <div style={{ textAlign: 'center' }}>Thao tác</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {variants.map((v, idx) => (
                <div key={idx} style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1.1fr 0.9fr 70px 70px',
                  gap: '10px',
                  alignItems: 'center',
                  backgroundColor: v.active ? '#f8fafc' : '#f1f5f9',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${v.active ? '#e2e8f0' : '#cbd5e1'}`,
                  opacity: v.active ? 1 : 0.75
                }}>
                  <div>
                    <input
                      type="text"
                      required
                      value={v.name || ''}
                      onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                      placeholder={currentConfig.variantDefaultLabel}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={v.price}
                      onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                      placeholder="200000"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      required
                      min="0"
                      value={v.stock}
                      onChange={(e) => updateVariant(idx, 'stock', e.target.value)}
                      placeholder="50"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Nút bật/tắt bán variant */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => toggleVariantActive(idx)}
                      title="Bấm để bật hoặc tắt trạng thái bán phân loại này"
                      style={{
                        width: '100%',
                        padding: '7px 0',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        backgroundColor: v.active ? '#dcfce7' : '#e2e8f0',
                        color: v.active ? '#15803d' : '#64748b',
                        textAlign: 'center'
                      }}
                    >
                      {v.active ? 'Bán' : 'Tắt'}
                    </button>
                  </div>

                  {/* Nút xóa variant hoặc hiển thị icon khóa nếu đã có đơn */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {v.hasOrders ? (
                      <span
                        title="Phân loại đã phát sinh đơn hàng, không thể xóa để bảo toàn dữ liệu. Bạn có thể chọn Tắt bán."
                        style={{
                          width: '100%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px 0',
                          borderRadius: '6px',
                          backgroundColor: '#fef3c7',
                          color: '#d97706',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'help'
                        }}
                      >
                        Có đơn
                      </span>
                    ) : variants.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        title="Xóa phân loại này"
                        style={{
                          width: '100%',
                          padding: '6px 0',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '700',
                          textAlign: 'center'
                        }}
                      >
                        ✕
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#cbd5e1', textAlign: 'center' }}>—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nút hành động */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: (loading || uploadingImage) ? 'not-allowed' : 'pointer',
                opacity: (loading || uploadingImage) ? 0.7 : 1,
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)'
              }}
            >
              {uploadingImage ? 'Đang tải ảnh...' : loading ? 'Đang lưu...' : isEdit ? 'Cập nhật sản phẩm' : 'Lưu & Đăng bán sản phẩm'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
