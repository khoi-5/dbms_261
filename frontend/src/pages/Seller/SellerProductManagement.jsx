import React, { useState, useEffect } from 'react';
import AddProductModal from './AddProductModal';

const API_BASE = 'http://localhost:8080/api/seller/products';

export default function SellerProductManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dữ liệu ban đầu để hiển thị ngay giao diện trước khi Backend bật
  const [products, setProducts] = useState([
    { id: 1, name: 'Sách Clean Code', category: 'Books', price: 350000, stock: 20, status: 'Còn hàng' },
    { id: 2, name: 'Áo Thun Trắng Đơn Giản', category: 'Clothes', price: 199000, stock: 100, status: 'Còn hàng' },
    { id: 3, name: 'Chuột Không Dây Logitech', category: 'Electronics', price: 450000, stock: 0, status: 'Hết hàng' },
    { id: 4, name: 'MacBook Air M2', category: 'Electronics', price: 26990000, stock: 15, status: 'Còn hàng' },
  ]);

  // Tải dữ liệu từ Backend Spring Boot
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}?sellerId=2`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) setProducts(data);
      }
    } catch (err) {
      console.log('Chưa kết nối Backend Spring Boot, đang dùng dữ liệu mô phỏng');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // F04: Xóa sản phẩm (Delete)
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này (F04 - Delete)?')) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (res.ok) fetchProducts();
      else setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // F03: Sửa nhanh giá & tồn kho (Update)
  const handleQuickUpdate = async (p) => {
    const newPrice = prompt('Nhập giá mới (VND):', p.price);
    const newStock = prompt('Nhập số lượng tồn kho mới:', p.stock);
    if (newPrice !== null && newStock !== null) {
      try {
        const res = await fetch(`${API_BASE}/variants/${p.variantId || p.id}?price=${newPrice}&stock=${newStock}`, {
          method: 'PUT'
        });
        if (res.ok) fetchProducts();
        else updateLocal(p.id, newPrice, newStock);
      } catch (err) {
        updateLocal(p.id, newPrice, newStock);
      }
    }
  };

  const updateLocal = (id, newPrice, newStock) => {
    setProducts(products.map(p => p.id === id ? {
      ...p,
      price: Number(newPrice) || p.price,
      stock: Number(newStock) || p.stock,
      status: Number(newStock) > 0 ? 'Còn hàng' : 'Hết hàng'
    } : p));
  };

  // F02: Thêm mới sản phẩm (Insert)
  const handleAddProduct = async (newProd) => {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProd, sellerId: 2, categoryId: 1 })
      });
      if (res.ok) fetchProducts();
      else setProducts([...products, { ...newProd, id: Date.now() }]);
    } catch (err) {
      setProducts([...products, { ...newProd, id: Date.now() }]);
    }
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Quản lý sản phẩm</h1>

      {/* Thanh công cụ đúng Figma */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
        >
          + Thêm sản phẩm
        </button>

        <div style={{ position: 'relative', width: '380px' }}>
          <input 
            type="text" 
            placeholder="Nhập tên sản phẩm, danh mục cần tìm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 36px 10px 16px', borderRadius: '24px', border: '1px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', outline: 'none' }}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: '10px', top: '9px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Bảng nền đen #1E293B theo Figma */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', color: '#fff' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
              <th style={{ padding: '14px 16px' }}>Tên sản phẩm</th>
              <th style={{ padding: '14px 16px' }}>Danh mục</th>
              <th style={{ padding: '14px 16px' }}>Giá bán</th>
              <th style={{ padding: '14px 16px' }}>Số lượng</th>
              <th style={{ padding: '14px 16px' }}>Trạng thái</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '14px 16px', fontWeight: '500' }}>{p.name}</td>
                <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>{p.category}</td>
                <td style={{ padding: '14px 16px' }}>{p.price.toLocaleString('vi-VN')} đ</td>
                <td style={{ padding: '14px 16px' }}>{p.stock}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    backgroundColor: p.stock > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: p.stock > 0 ? '#34d399' : '#f87171'
                  }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <button 
                    onClick={() => handleQuickUpdate(p)}
                    style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', marginRight: '8px', fontWeight: '600' }}
                  >
                    Sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <AddProductModal 
          onClose={() => setIsModalOpen(false)}
          onAddProduct={handleAddProduct}
        />
      )}
    </div>
  );
}