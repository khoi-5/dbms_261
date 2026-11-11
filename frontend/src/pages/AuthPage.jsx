import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
export default function AuthPage({ register = false }) {
  const { authenticate, error: sessionError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const user = await authenticate(register ? 'register' : 'login', body);
      const requested = location.state?.from;
      navigate(requested?.startsWith('/') && !requested.startsWith('//') ? requested : user.roles.includes('SELLER') ? '/seller/products' : '/products', { replace: true });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <main className="auth-shell"><Link to="/products" className="brand">BKPEE<span>Marketplace</span></Link><section className="auth-card"><p className="eyebrow">CHÀO MỪNG ĐẾN BKPEE</p><h1>{register ? 'Tạo tài khoản Buyer' : 'Đăng nhập'}</h1><p className="muted">Khám phá sản phẩm và quản lý giỏ hàng của bạn.</p><form onSubmit={submit}>
    {register ? <><label>Username<input name="username" required pattern="[A-Za-z0-9_]{3,50}" maxLength={50} autoComplete="username" /></label><label>Email<input name="email" type="email" required maxLength={100} autoComplete="email" /></label><div className="form-pair"><label>Họ<input name="lastName" required maxLength={50} autoComplete="family-name" /></label><label>Tên<input name="firstName" required maxLength={50} autoComplete="given-name" /></label></div><label>Số điện thoại<input name="phone" type="tel" required pattern="[+0-9]{8,20}" autoComplete="tel" /></label><label>CCCD / CMND<input name="cccd" required pattern="[0-9]{9}|[0-9]{12}" maxLength={12} inputMode="numeric" /><small className="muted">B?t bu?c theo r?ng bu?c duy nh?t c?a database hi?n t?i.</small></label></> : <label>Username hoặc email<input name="identity" required maxLength={100} autoComplete="username" /></label>}
    <label>Mật khẩu<input name="password" type="password" required minLength={register ? 8 : undefined} maxLength={72} autoComplete={register ? 'new-password' : 'current-password'} /></label>
    {(error || sessionError) && <p className="error" role="alert">{error || sessionError}</p>}<button className="primary" disabled={busy}>{busy ? 'Đang xử lý…' : register ? 'Đăng ký' : 'Đăng nhập'}</button>
  </form><p>{register ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}<Link to={register ? '/login' : '/register'}>{register ? 'Đăng nhập' : 'Đăng ký Buyer'}</Link></p></section></main>;
}
