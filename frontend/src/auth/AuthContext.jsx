import { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../services/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const logout = () => { tokenStore.clear(); setUser(null); setError(''); };
  useEffect(() => {
    let alive = true;
    const expired = () => { setUser(null); setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'); };
    window.addEventListener('auth-expired', expired);
    if (tokenStore.get()) api('/accounts/me').then(data => { if (alive) setUser(data); }).catch(e => { if (alive) setError(e.message); }).finally(() => { if (alive) setLoading(false); });
    else setLoading(false);
    return () => { alive = false; window.removeEventListener('auth-expired', expired); };
  }, []);
  useEffect(() => {
    if (!user) return;
    try {
      const token = tokenStore.get();
      const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const remaining = JSON.parse(atob(encoded)).exp * 1000 - Date.now();
      const timer = setTimeout(() => { tokenStore.clear(); setUser(null); setError('Phiên đăng nhập đã hết hạn.'); }, Math.max(0, remaining));
      return () => clearTimeout(timer);
    } catch { logout(); }
  }, [user]);
  const authenticate = async (mode, body) => {
    const session = await api(`/auth/${mode}`, { method: 'POST', body });
    tokenStore.set(session.token); setUser(session.account); setError('');
    return session.account;
  };
  const becomeSeller = async (body) => {
    const session = await api('/auth/become-seller', { method: 'POST', body });
    tokenStore.set(session.token);
    setUser(session.account);
    setError('');
    return session.account;
  };
  const refreshUser = async () => { const account = await api('/accounts/me'); setUser(account); return account; };
  return <AuthContext.Provider value={{ user, loading, error, logout, authenticate, becomeSeller, refreshUser }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
