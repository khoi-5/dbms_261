import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import PasswordField from '../components/PasswordField';

export default function AuthPage({ register = false }) {
  const { authenticate, error: sessionError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [roleType, setRoleType] = useState('BUYER'); // BUYER hoặc SELLER

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');

    const body = Object.fromEntries(new FormData(e.currentTarget));

    if (register) {
      if (body.password !== body.confirmPassword) {
        setError('Xác nhận mật khẩu không khớp.');
        setBusy(false);
        return;
      }
      if (new TextEncoder().encode(body.password).length > 72) {
        setError('Mật khẩu tối đa 72 byte UTF-8.');
        setBusy(false);
        return;
      }
    }

    try {
      let endpoint = 'login';
      if (register) {
        endpoint = roleType === 'SELLER' ? 'register-seller' : 'register';
      }

      const user = await authenticate(endpoint, body);
      const requested = location.state?.from;

      if (requested?.startsWith('/') && !requested.startsWith('//')) {
        navigate(requested, { replace: true });
      } else if (user.roles.includes('SELLER')) {
        navigate('/seller/products', { replace: true });
      } else {
        navigate('/products', { replace: true });
      }
    } catch (e) {
      setError(e.message || 'Thao tác không thành công.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      color: '#0f172a'
    }}>
      {/* Brand */}
      <Link
        to="/products"
        style={{
          textDecoration: 'none',
          marginBottom: '24px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
          BKPEE
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
          Mini E-Commerce Marketplace
        </div>
      </Link>

      {/* Card đăng nhập / đăng ký */}
      <section style={{
        width: '100%',
        maxWidth: register ? '480px' : '400px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '32px 28px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px', color: '#0f172a' }}>
            {register ? 'Đăng ký tài khoản' : 'Đăng nhập'}
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {register
              ? 'Tạo tài khoản để tham gia mua sắm hoặc đăng bán sản phẩm.'
              : 'Chào mừng quay trở lại hệ thống marketplace.'}
          </p>
        </div>

        {/* Tab chuyển đổi vai trò khi Đăng ký (Overlapping Specialization) */}
        {register && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            backgroundColor: '#f1f5f9',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              onClick={() => setRoleType('BUYER')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: roleType === 'BUYER' ? '#ffffff' : 'transparent',
                color: roleType === 'BUYER' ? '#2563eb' : '#64748b',
                fontWeight: roleType === 'BUYER' ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: roleType === 'BUYER' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Người mua
            </button>

            <button
              type="button"
              onClick={() => setRoleType('SELLER')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: roleType === 'SELLER' ? '#ffffff' : 'transparent',
                color: roleType === 'SELLER' ? '#2563eb' : '#64748b',
                fontWeight: roleType === 'SELLER' ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: roleType === 'SELLER' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Người bán
            </button>
          </div>
        )}

        {/* Thông báo lỗi */}
        {(error || sessionError) && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {error || sessionError}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {register ? (
            <>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Tên đăng nhập</label>
                <input name="username" required pattern="[A-Za-z0-9_]{3,50}" maxLength={50} placeholder="Ví dụ: nguyenvana"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Địa chỉ Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={100}
                  placeholder="email@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Họ</label>
                  <input name="lastName" required maxLength={50} placeholder="Nguyễn" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Tên</label>
                  <input name="firstName" required maxLength={50} placeholder="Văn A" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Điện thoại (10 số, bắt đầu bằng 0)</label>
                  <input name="phone" type="tel" required pattern="[+0-9]{8,20}" placeholder="0901234567" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>CCCD (9 hoặc 12 số, bắt đầu bằng 0)</label>
                  <input name="cccd" required pattern="[0-9]{9}|[0-9]{12}" maxLength={12} placeholder="079090123456" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Thông tin bổ sung cho Người bán */}
              {roleType === 'SELLER' && (
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px dashed #cbd5e1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af' }}>
                    Thông tin gian hàng
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Tên gian hàng *
                    </label>
                    <input
                      name="shopName"
                      required
                      maxLength={100}
                      placeholder="Ví dụ: Phụ Kiện Công Nghệ Shop"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Tên ngân hàng *
                    </label>
                    <input
                      name="bankName"
                      required
                      maxLength={100}
                      placeholder="Ví dụ: Techcombank"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Tên chủ tài khoản *
                    </label>
                    <input
                      name="bankAccountHolder"
                      required
                      maxLength={100}
                      placeholder="Ví dụ: NGUYEN VAN A"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Số tài khoản ngân hàng *
                    </label>
                    <input
                      name="bankAccount"
                      required
                      inputMode="numeric"
                      pattern="[0-9]{6,50}"
                      maxLength={50}
                      placeholder="Ví dụ: 19036789123456"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Chi nhánh ngân hàng
                    </label>
                    <input
                      name="bankBranch"
                      maxLength={100}
                      placeholder="Ví dụ: Chi nhánh TP. Thủ Đức"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                Tên đăng nhập hoặc Email
              </label>
              <input
                name="identity"
                required
                maxLength={100}
                autoComplete="username"
                placeholder="Nhập tên đăng nhập hoặc email..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <PasswordField
            label="Mật khẩu"
            name="password"
            minLength={register ? 8 : undefined}
            disabled={busy}
          />

          {register && (
            <PasswordField
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              minLength={8}
              disabled={busy}
            />
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: busy ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)',
              opacity: busy ? 0.7 : 1
            }}
          >
            {busy ? 'Đang xử lý...' : register ? `Đăng ký ${roleType === 'SELLER' ? 'Người bán' : 'Người mua'}` : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          {register ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
          <Link
            to={register ? '/login' : '/register'}
            style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}
          >
            {register ? 'Đăng nhập ngay' : 'Đăng ký tài khoản mới'}
          </Link>
        </div>
      </section>
    </main>
  );
}
