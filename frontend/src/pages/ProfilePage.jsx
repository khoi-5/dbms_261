import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import PasswordField from '../components/PasswordField';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setError('');
    api('/buyer/profile', { signal: controller.signal }).then(setProfile).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [retry]);
  async function save(e) {
    e.preventDefault(); if (saving) return;
    setSaving(true); setError(''); setNotice('');
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      setProfile(await api('/buyer/profile', { method: 'PUT', body }));
      await refreshUser(); setNotice('Đã cập nhật hồ sơ.');
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }
  async function changePassword(e) {
    e.preventDefault(); if (passwordBusy) return;
    const form = e.currentTarget, body = Object.fromEntries(new FormData(form));
    setPasswordError(''); setPasswordNotice('');
    if (body.newPassword !== body.confirmPassword) { setPasswordError('Xác nhận mật khẩu mới không khớp.'); return; }
    if (new TextEncoder().encode(body.newPassword).length > 72) { setPasswordError('Mật khẩu tối đa 72 byte UTF-8.'); return; }
    setPasswordBusy(true);
    try {
      await api('/buyer/profile/password', { method: 'POST', body }); form.reset();
      setPasswordNotice('Đã đổi mật khẩu. Token đã cấp trước đó vẫn có hiệu lực đến khi hết hạn.');
    } catch (e) { setPasswordError(e.message); } finally { setPasswordBusy(false); }
  }
  return <><header className="page-header"><div><p className="eyebrow">TÀI KHOẢN CỦA BẠN</p><h1>Hồ sơ cá nhân</h1><p className="muted">Cập nhật thông tin và bảo vệ tài khoản.</p></div></header>
    <div className="profile-grid"><section className="profile-card"><h2>Thông tin cá nhân</h2><p className="muted">{user.username} · {user.email}</p><p className="muted">Email, số điện thoại, CCCD và vai trò không được thay đổi tại đây.</p>
      {error && <p className="error" role="alert">{error} <button onClick={() => setRetry(retry + 1)}>Tải lại</button></p>}{notice && <p className="success" role="status">{notice}</p>}
      {!profile ? !error && <p role="status">Đang tải hồ sơ…</p> : <form key={JSON.stringify(profile)} onSubmit={save}><fieldset disabled={saving}><div className="form-pair"><label>Họ<input name="lastName" defaultValue={profile.lastName} required maxLength={50} autoComplete="family-name" /></label><label>Tên<input name="firstName" defaultValue={profile.firstName} required maxLength={50} autoComplete="given-name" /></label></div><label>Địa chỉ<input name="address" defaultValue={profile.address || ''} maxLength={255} autoComplete="street-address" /></label><label>Giới tính<select name="gender" defaultValue={profile.gender || ''}><option value="">Chưa cung cấp</option>{['Nam', 'Nữ', 'Khác', 'Nu', 'Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}</select></label><label>URL avatar<input name="avatar" type="url" defaultValue={profile.avatar || ''} maxLength={500} placeholder="https://…" /></label><button className="primary">{saving ? 'Đang lưu…' : 'Lưu hồ sơ'}</button></fieldset></form>}
    </section><section className="profile-card"><h2>Đổi mật khẩu</h2><p className="muted">Tối thiểu 8 ký tự và tối đa 72 byte UTF-8. Đổi mật khẩu không tự thu hồi các JWT đã cấp.</p><form onSubmit={changePassword}><PasswordField label="Mật khẩu hiện tại" name="currentPassword" autoComplete="current-password" disabled={passwordBusy} /><PasswordField label="Mật khẩu mới" name="newPassword" minLength={8} disabled={passwordBusy} /><PasswordField label="Xác nhận mật khẩu mới" name="confirmPassword" minLength={8} disabled={passwordBusy} />{passwordError && <p className="error" role="alert">{passwordError}</p>}{passwordNotice && <p className="success" role="status">{passwordNotice}</p>}<button className="primary" disabled={passwordBusy}>{passwordBusy ? 'Đang đổi…' : 'Đổi mật khẩu'}</button></form></section></div>
  </>;
}
