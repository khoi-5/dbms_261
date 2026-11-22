import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import BecomeSellerModal from './BecomeSellerModal';

export default function BuyerLayout() {
  const { user, logout, error } = useAuth();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [showBecomeSellerModal, setShowBecomeSellerModal] = useState(false);

  useEffect(() => {
    let alive = true;
    const syncCart = () => {
      if (!user) {
        if (alive) setCartCount(0);
        return;
      }
      api('/buyer/cart')
        .then(cart => {
          if (alive) setCartCount(cart?.totalQuantity || 0);
        })
        .catch(() => { });
    };
    syncCart();
    window.addEventListener('cart-updated', syncCart);
    return () => {
      alive = false;
      window.removeEventListener('cart-updated', syncCart);
    };
  }, [user]);

  const navItemClass = ({ isActive }) =>
    `buyer-nav-item ${isActive ? 'active' : ''}`;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a' }}>

      {/* Sidebar bên trái theo đúng thiết kế Figma */}
      <aside style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        padding: '24px 18px',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxSizing: 'border-box',
        flexShrink: 0
      }}>

        {/* Brand Logo & Tên thương hiệu */}
        <div style={{ marginBottom: '24px', paddingLeft: '6px' }}>
          <Link to="/products" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
              BKPEE
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
              Mini Marketplace BTL DBMS
            </div>
          </Link>
        </div>

        {/* Thanh icon người dùng đúng chuẩn Figma Image 1 (Avatar, Settings, Notification, Cart) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid #f1f5f9'
        }}>
          {/* Avatar */}
          <Link
            to={user ? '/profile' : '/login'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: user ? '#2563eb' : '#e2e8f0',
              color: user ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '13px',
              textDecoration: 'none'
            }}
            title={user ? `${user.firstName} ${user.lastName}` : 'Đăng nhập'}
          >
            {user ? (user.firstName?.charAt(0) || user.username?.charAt(0)).toUpperCase() : 'G'}
          </Link>

          {/* Settings */}
          <Link
            to="/profile"
            style={{ color: '#64748b', display: 'flex', alignItems: 'center', padding: '4px' }}
            title="Cài đặt hồ sơ"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </Link>

          {/* Notifications */}
          <div style={{ position: 'relative', color: '#64748b', display: 'flex', alignItems: 'center', padding: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '6px',
              height: '6px',
              backgroundColor: '#ef4444',
              borderRadius: '50%'
            }}></span>
          </div>

          {/* Cart Icon có badge số lượng */}
          <Link
            to={user ? '/cart' : '/login'}
            style={{
              position: 'relative',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              marginLeft: 'auto',
              textDecoration: 'none'
            }}
            title="Giỏ hàng"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: '700',
                borderRadius: '10px',
                padding: '1px 5px',
                minWidth: '12px',
                textAlign: 'center'
              }}>
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* Thanh tìm kiếm nhỏ sidebar đúng Figma Image 1 */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            onClick={() => navigate('/products')}
            readOnly
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              backgroundColor: '#f8fafc',
              boxSizing: 'border-box',
              cursor: 'pointer'
            }}
          />
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: '10px', top: '10px' }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        {/* Menu Điều hướng */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>

          <NavLink
            to="/products"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive ? '600' : '500',
              color: isActive ? '#2563eb' : '#475569',
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              transition: 'all 0.15s ease'
            })}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Sản phẩm</span>
          </NavLink>

          <NavLink
            to="/orders"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive ? '600' : '500',
              color: isActive ? '#2563eb' : '#475569',
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              transition: 'all 0.15s ease'
            })}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Đơn hàng</span>
          </NavLink>

          <NavLink
            to="/promotions"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive ? '600' : '500',
              color: isActive ? '#2563eb' : '#475569',
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              transition: 'all 0.15s ease'
            })}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            <span>Khuyến mãi</span>
          </NavLink>

          <NavLink
            to="/spending"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive ? '600' : '500',
              color: isActive ? '#2563eb' : '#475569',
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              transition: 'all 0.15s ease'
            })}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>Báo cáo chi tiêu</span>
          </NavLink>

          {/* Chuyển đổi vai trò Overlapping: Nếu tài khoản có quyền SELLER */}
          {user && user.roles.includes('SELLER') && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
              <Link
                to="/seller/products"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                <span>Kênh Người Bán ↗</span>
              </Link>
            </div>
          )}

          {/* Nếu là Buyer chưa có quyền Seller -> Cho phép mở shop */}
          {user && !user.roles.includes('SELLER') && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setShowBecomeSellerModal(true)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                Mở gian hàng bán hàng
              </button>
            </div>
          )}
        </nav>

        {/* Khu vực dưới cùng Sidebar (Đăng nhập / Đăng xuất) */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          {user ? (
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
                @{user.username} · {user.roles.map(r => r === 'BUYER' ? 'Người mua' : r === 'SELLER' ? 'Người bán' : r).join(' & ')}
              </div>
              <button
                onClick={() => { logout(); navigate('/products'); }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link
                to="/login"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '10px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                }}
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '8px',
                  color: '#475569',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Tạo tài khoản mới
              </Link>
            </div>
          )}
        </div>

      </aside>

      {/* Vùng nội dung chính */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px'
          }}>
            {error}
          </div>
        )}
        <Outlet />
      </main>
      {showBecomeSellerModal && (
        <BecomeSellerModal
          onClose={() => setShowBecomeSellerModal(false)}
          onSuccess={() => {
            setShowBecomeSellerModal(false);
            navigate('/seller/products', { replace: true });
          }}
        />
      )}
    </div>
  );
}
