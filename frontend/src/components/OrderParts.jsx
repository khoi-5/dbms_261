import ProductImage from './ProductImage';
import { deliveryStatuses, statusLabel, paymentLabel, methodLabel, orderMoney, orderDate } from '../services/orders';

export function DeliveryBadge({ status }) {
  return <span className={'order-badge order-status-' + status}>{statusLabel(status)}</span>;
}
export function PaymentInfo({ payment }) {
  return <span>{methodLabel(payment?.simulated ? 'DEMO' : payment?.method)} · {paymentLabel(payment?.status)}
    {payment?.simulated && <small className="order-demo-label">Mô phỏng, không thu tiền thật</small>}
    {payment?.paidAt && <small>Ghi nhận: {orderDate(payment.paidAt)}</small>}
  </span>;
}
export function ReceiptInfo({ shop, showTime = false }) {
  if (shop.buyerReceivedAt) {
    return <small className="order-receipt">Buyer đã xác nhận nhận hàng{showTime && ' · ' + orderDate(shop.buyerReceivedAt)}</small>;
  }
  return shop.status === 'DELIVERED' ? <small>Chờ Buyer xác nhận nhận hàng</small> : null;
}
export function OrderFilters({ filters, onSubmit, busy, buyer = false }) {
  return <form className="order-filters" onSubmit={e => {
    e.preventDefault(); onSubmit(Object.fromEntries(new FormData(e.currentTarget)));
  }}>
    <label>{buyer ? 'Đơn có shop ở trạng thái' : 'Trạng thái'}<select name="status" defaultValue={filters.status || ''}>
      <option value="">Tất cả</option>{deliveryStatuses.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
    </select></label>
    <label>Từ ngày<input type="date" name="from" defaultValue={filters.from || ''} /></label>
    <label>Đến hết ngày<input type="date" name="to" defaultValue={filters.to || ''} /></label>
    <button className="primary" disabled={busy}>Lọc đơn hàng</button>
  </form>;
}
export function OrderPagination({ data, onPage, busy }) {
  if (!data || data.totalPages <= 1) return null;
  return <nav className="pagination" aria-label="Phân trang đơn hàng">
    <button disabled={busy || data.page === 0} onClick={() => onPage(data.page - 1)}>← Trước</button>
    <span>Trang {data.page + 1} / {data.totalPages}</span>
    <button disabled={busy || data.page + 1 >= data.totalPages} onClick={() => onPage(data.page + 1)}>Sau →</button>
  </nav>;
}
export function OrderItems({ items }) {
  return <div className="order-items">{items.map(item => <div className="order-line" key={item.variantId}>
    <div className="order-line-image"><ProductImage src={item.image} name={item.name} /></div>
    <div><strong>{item.name}</strong><small>{item.variantName || 'Biến thể #' + item.variantId} · {item.quantity} × {orderMoney(item.purchasePrice)}</small></div>
    <b>{orderMoney(item.subtotal)}</b>
  </div>)}</div>;
}
export function ShopOrderCard({ shop, children }) {
  return <section className="order-card">
    <div className="order-card-heading"><div><h2>{shop.shopName}</h2><small>Đơn shop #{shop.id}</small></div>
      <DeliveryBadge status={shop.status} /></div>
    <OrderItems items={shop.items} />
    <div className="order-shipping"><span>{shop.providerName}</span>
      {shop.trackingNumber && <span>Mã vận đơn: <strong>{shop.trackingNumber}</strong></span>}
      {shop.shippedAt && <span>Bắt đầu giao: {orderDate(shop.shippedAt)}</span>}
      {shop.deliveredAt && <span>Đã giao: {orderDate(shop.deliveredAt)}</span>}
      <ReceiptInfo shop={shop} showTime />
    </div>
    <dl className="order-totals"><div><dt>Tiền hàng</dt><dd>{orderMoney(shop.subtotal)}</dd></div>
      <div><dt>Phí vận chuyển</dt><dd>{orderMoney(shop.shippingFee)}</dd></div>
      <div><dt>Tổng phần đơn</dt><dd>{orderMoney(shop.total)}</dd></div>
      {shop.status === 'CANCELLED' && <div><dt>Còn phải trả cho phần đơn này</dt><dd>{orderMoney(0)}</dd></div>}
    </dl>
    {children}
  </section>;
}
