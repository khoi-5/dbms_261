import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
const links = [['/', '⌂', 'Trang chủ'], ['/products', '▧', 'Sản phẩm'], ['/cart', '🛒', 'Giỏ hàng'], ['/orders', '▤', 'Đơn hàng'], ['/spending', '▥', 'Thống kê chi tiêu'], ['/profile', '♙', 'Hồ sơ cá nhân']];
export default function BuyerLayout() {
  const { user, logout, error } = useAuth();
  const navigate = useNavigate();
  return <div className="buyer-shell"><aside className="buyer-sidebar"><Link className="brand" to="/">BKPEE<span>Mini Marketplace</span></Link><div className="sidebar-caption">{user ? `Xin chào, ${user.firstName}` : 'Khám phá mỗi ngày'}</div><nav aria-label="Điều hướng chính">{links.filter(([to]) => user || ['/', '/products'].includes(to)).map(([to, icon, label]) => <NavLink key={to} to={to} end={to === '/'}><span aria-hidden="true">{icon}</span>{label}</NavLink>)}</nav><div className="sidebar-bottom">{user ? <><div className="account-label">{user.username}<small>{user.roles.join(' · ')}</small></div>{user.roles.includes('SELLER') && <Link to="/seller/products">Seller Portal ↗</Link>}<button onClick={() => { logout(); navigate('/products'); }}>↪ Đăng xuất</button></> : <><Link className="primary" to="/login">Đăng nhập</Link><Link to="/register">Tạo tài khoản Buyer</Link></>}</div></aside><main className="buyer-main">{error && <p className="error" role="alert">{error}</p>}<Outlet /></main></div>;
}
