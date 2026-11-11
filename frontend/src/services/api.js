const BASE = import.meta.env?.VITE_API_URL || 'http://localhost:8080/api';
export const tokenStore = {
  get: () => sessionStorage.getItem('marketplace.token'),
  set: token => sessionStorage.setItem('marketplace.token', token),
  clear: () => sessionStorage.removeItem('marketplace.token'),
};
export async function api(path, { body, ...options } = {}) {
  const token = tokenStore.get();
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event('auth-expired'));
    }
    const error = new Error(data?.message || (response.status === 401 ? 'Vui lòng đăng nhập lại.' : response.status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : 'Không thể kết nối dịch vụ. Vui lòng thử lại.'));
    error.status = response.status;
    throw error;
  }
  return data;
}
