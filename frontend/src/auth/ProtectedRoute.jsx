import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="state" role="status">Đang kiểm tra phiên đăng nhập…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!user.roles.includes(role)) return <section className="state"><h1>Không có quyền truy cập</h1><p>Trang này dành cho {role}.</p></section>;
  return <Outlet />;
}
