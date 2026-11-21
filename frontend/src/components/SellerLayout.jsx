import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function SellerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Kênh Người Bán';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'S';

  const sidebarStyle = {
    width: '260px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    minHeight: '100vh',
    boxSizing: 'border-box'
  };

  const navItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '500',
    color: isActive ? '#2563eb' : '#475569',
    backgroundColor: isActive ? '#eff6ff' : 'transparent',
    marginBottom: '6px',
    transition: 'all 0.15s ease'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'inherit' }}>
      {/* Sidebar theo đúng phong cách Figma */}
      <aside style={sidebarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '6px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '16px',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
          }}>
            {initial}
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
              {displayName}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Kênh Người Bán
            </div>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <NavLink to="/seller/dashboard" style={({ isActive }) => navItemStyle(isActive)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Tổng quan</span>
          </NavLink>

          <NavLink to="/seller/products" style={({ isActive }) => navItemStyle(isActive)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <span>Sản phẩm</span>
          </NavLink>

          <NavLink to="/seller/orders" style={({ isActive }) => navItemStyle(isActive)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span>Đơn hàng</span>
          </NavLink>

          <NavLink to="/seller/promotions" style={({ isActive }) => navItemStyle(isActive)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <span>Doanh thu</span>
          </NavLink>

          {/* Chuyển đổi vai trò Overlapping: Sang Kênh Người Mua */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
            <Link
              to="/products"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 16px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '700',
                transition: 'all 0.15s ease'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span>Kênh Mua Sắm ↗</span>
            </Link>
          </div>
        </nav>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ef4444',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Vùng nội dung chính */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
