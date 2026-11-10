import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function SellerLayout() {
  const sidebarStyle = {
    width: '260px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    minHeight: '100vh'
  };

  const navItemStyle = (isActive) => ({
    display: 'block',
    padding: '12px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '500',
    color: isActive ? '#2563eb' : '#4b5563',
    backgroundColor: isActive ? '#eff6ff' : 'transparent',
    marginBottom: '4px'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            S
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Tên thương hiệu</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Seller Portal</div>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <NavLink to="/seller/dashboard" style={({ isActive }) => navItemStyle(isActive)}>Tổng quan</NavLink>
          <NavLink to="/seller/products" style={({ isActive }) => navItemStyle(isActive)}>Sản phẩm</NavLink>
          <NavLink to="/seller/orders" style={({ isActive }) => navItemStyle(isActive)}>Đơn hàng</NavLink>
          <NavLink to="/seller/promotions" style={({ isActive }) => navItemStyle(isActive)}>Doanh thu</NavLink>
        </nav>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          <button 
            onClick={() => alert('Đăng xuất thành công (F01)')}
            style={{ width: '100%', textAlign: 'left', padding: '10px 16px', backgroundColor: 'transparent', border: 'none', color: '#ef4444', fontSize: '14px', cursor: 'pointer', borderRadius: '8px' }}
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Vùng nội dung chính */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}