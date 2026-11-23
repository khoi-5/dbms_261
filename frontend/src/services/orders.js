export const deliveryStatuses = [
  ['PENDING', 'Chờ xác nhận'], ['CONFIRMED', 'Đã xác nhận'], ['SHIPPING', 'Đang giao'],
  ['DELIVERED', 'Đã giao'], ['CANCELLED', 'Đã hủy'], ['RETURNED', 'Đã trả hàng'],
];
const paymentLabels = {
  PENDING: 'Chờ thu tiền', COMPLETED: 'Đã thanh toán', FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền', CANCELLED: 'Đã hủy thanh toán', UNKNOWN: 'Chưa có thông tin',
};
const methodLabels = {
  COD: 'Thanh toán khi nhận hàng', DEMO: 'Mock Payment',
  BANKING: 'Chuyển khoản', VNPAY: 'VNPAY', MOMO: 'MoMo', CREDIT_CARD: 'Thẻ',
};
export const statusLabel = status => deliveryStatuses.find(([code]) => code === status)?.[1] || status;
export const paymentLabel = status => paymentLabels[status] || status;
export const methodLabel = method => methodLabels[method] || method;
export const orderMoney = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);
export const orderDate = value => value ? value.replace('T', ' ').slice(0, 19) : '—';
const intentKey = accountId => 'bkpee.checkout.intent.' + accountId;
export function readCheckoutIntent(accountId) {
  try {
    const value = JSON.parse(sessionStorage.getItem(intentKey(accountId)) || 'null');
    if (!value?.payload?.requestKey || !value.payload.quoteFingerprint) return null;
    return value;
  } catch { return null; }
}
export function saveCheckoutIntent(accountId, payload) {
  const intent = { payload, savedAt: Date.now() };
  sessionStorage.setItem(intentKey(accountId), JSON.stringify(intent));
  return intent;
}
export function clearCheckoutIntent(accountId) { sessionStorage.removeItem(intentKey(accountId)); }
export function orderQuery(filters, page = 0) {
  const params = new URLSearchParams({ page: String(page), size: '10' });
  for (const key of ['status', 'from', 'to']) if (filters[key]) params.set(key, filters[key]);
  return params.toString();
}
