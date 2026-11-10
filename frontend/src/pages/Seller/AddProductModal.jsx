import React, { useState } from 'react';

export default function AddProductModal({ onClose, onAddProduct }) {
  const [category, setCategory] = useState('Books');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    author: '',
    size: 'M',
    material: '',
    warranty: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddProduct({
      name: formData.name,
      category,
      price: Number(formData.price),
      stock: Number(formData.stock),
      status: Number(formData.stock) > 0 ? 'Còn hàng' : 'Hết hàng'
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '24px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        
        {/* Nút đóng tròn đỏ góc phải theo đúng Figma */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '-12px', right: '-12px', width: '32px', height: '32px', backgroundColor: '#ef4444', color: '#fff', borderRadius: '50%', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ✕
        </button>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>Sản phẩm mới</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tên sản phẩm</label>
            <input 
              name="name" 
              required 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Nhập tên sản phẩm..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Danh mục</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff' }}
            >
              <option value="Books">Sách (Books)</option>
              <option value="Clothes">Thời trang (Clothes)</option>
              <option value="Electronics">Đồ điện tử (Electronics)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Giá bán (đ)</label>
              <input 
                type="number" 
                name="price" 
                required 
                value={formData.price} 
                onChange={handleChange} 
                placeholder="100000"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Số lượng</label>
              <input 
                type="number" 
                name="stock" 
                required 
                value={formData.stock} 
                onChange={handleChange} 
                placeholder="50"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
              />
            </div>
          </div>

          {/* Thuộc tính chuyên biệt theo danh mục */}
          <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
              Thuộc tính riêng ({category}):
            </span>
            {category === 'Books' && (
              <input name="author" placeholder="Tên tác giả..." value={formData.author} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }} />
            )}
            {category === 'Clothes' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <select name="size" value={formData.size} onChange={handleChange} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}>
                  <option value="S">Size S</option>
                  <option value="M">Size M</option>
                  <option value="L">Size L</option>
                  <option value="XL">Size XL</option>
                </select>
                <input name="material" placeholder="Chất liệu..." value={formData.material} onChange={handleChange} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }} />
              </div>
            )}
            {category === 'Electronics' && (
              <input name="warranty" placeholder="Bảo hành (tháng)..." value={formData.warranty} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }} />
            )}
          </div>

          <button 
            type="submit" 
            style={{ width: '100%', padding: '12px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}
          >
            Thêm vào danh sách sản phẩm
          </button>
        </form>
      </div>
    </div>
  );
}