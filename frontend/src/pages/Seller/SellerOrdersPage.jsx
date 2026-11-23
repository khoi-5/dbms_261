import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useOrderResource } from '../../services/useOrderResource';
import { orderDate, orderMoney, orderQuery } from '../../services/orders';
import { DeliveryBadge, OrderFilters, OrderPagination, PaymentInfo, ReceiptInfo, ShopOrderCard } from '../../components/OrderParts';
import '../../styles/orders.css';

function SellerOrdersList() {
  const [params, setParams] = useSearchParams();
  const filters = { status: params.get('status') || '', from: params.get('from') || '', to: params.get('to') || '' };
  const page = Math.max(0, parseInt(params.get('page') || '0', 10) || 0);
  const [revision, setRevision] = useState(0);
  const [filterError, setFilterError] = useState('');
  const { data, error, loading } = useOrderResource('/seller/orders?' + orderQuery(filters, page), revision);
  function apply(value) {
    if (value.from && value.to && value.from > value.to) { setFilterError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'); return; }
    setFilterError(''); setParams(orderQuery(value));
  }
  return <div className="orders-feature">
    <header className="page-header"><div><p className="eyebrow">SELLER · ĐƠN HÀNG</p><h1>Quản lý đơn hàng</h1>
      <p className="muted">Lọc theo trạng thái và ngày đặt. Chỉ hiển thị phần đơn của shop bạn.</p></div></header>
    <OrderFilters key={params.toString()} filters={filters} onSubmit={apply} busy={loading} />
    {(error || filterError) && <div className="error" role="alert">{error || filterError}
      {error && <button onClick={() => setRevision(v => v + 1)}>Tải lại</button>}</div>}
    {loading ? <div className="state" role="status">Đang tải đơn shop…</div> : data && <>
      {!data.items.length ? <div className="state"><h2>Không có đơn hàng phù hợp</h2>
        {page > 0 && <button onClick={() => setParams(orderQuery(filters))}>Về trang đầu</button>}</div> :
        <div className="orders-table-wrap"><table className="orders-table"><thead><tr>
          <th>Đơn shop / đơn tổng</th><th>Ngày đặt</th><th>Buyer</th><th>Trạng thái</th><th>Giá trị phần đơn</th><th>Thao tác</th>
        </tr></thead><tbody>{data.items.map(shop => <tr key={shop.id}>
          <td><strong>#{shop.id}</strong><small>Đơn tổng #{shop.orderId}</small></td>
          <td>{orderDate(shop.orderedAt)}</td><td>{shop.buyerName}<small>@{shop.buyerUsername}</small></td>
          <td><DeliveryBadge status={shop.status} /><ReceiptInfo shop={shop} /></td><td>{orderMoney(shop.total)}</td>
          <td><Link to={'/seller/orders/' + shop.id}>Xem / xử lý</Link></td>
        </tr>)}</tbody></table></div>}
      <OrderPagination data={data} busy={loading} onPage={value => setParams(orderQuery(filters, value))} />
    </>}
  </div>;
}

function SellerOrderDetails({ id }) {
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [tracking, setTracking] = useState('');
  const [actionError, setActionError] = useState('');
  const { data: shop, error, loading } = useOrderResource('/seller/orders/' + id, revision);
  const labels = { CONFIRMED: 'Xác nhận đơn', SHIPPING: 'Bắt đầu giao', DELIVERED: 'Xác nhận đã giao', CANCELLED: 'Hủy đơn' };
  async function update(next) {
    if (busy || !shop) return;
    if (next === 'SHIPPING' && !tracking.trim()) { setActionError('Nhập mã vận đơn trước khi giao hàng.'); return; }
    if (next === 'CANCELLED' && !window.confirm('Hủy phần đơn này và hoàn lại tồn kho?')) return;
    setBusy(true); setActionError('');
    try {
      await api('/seller/orders/' + shop.id + '/status', { method: 'PATCH',
        body: { expectedStatus: shop.status, newStatus: next, trackingNumber: tracking.trim() || null } });
      setRevision(v => v + 1);
    } catch (e) { setActionError(e.message); if (e.status === 409) setRevision(v => v + 1); }
    finally { setBusy(false); }
  }
  return <div className="orders-feature">
    <header className="page-header"><div><p className="eyebrow">XỬ LÝ ĐƠN SHOP</p><h1>Đơn shop #{id}</h1></div>
      <Link to="/seller/orders">← Danh sách đơn</Link></header>
    {(error || actionError) && <div className="error" role="alert">{error || actionError}<button onClick={() => setRevision(v => v + 1)}>Tải lại</button></div>}
    {loading ? <div className="state" role="status">Đang tải chi tiết…</div> : shop && <>
      <section className="order-card order-overview"><div><h2>Thông tin giao hàng</h2>
        <p>Buyer {shop.buyerName} (@{shop.buyerUsername}, #{shop.buyerId})</p>
        <p>Người nhận {shop.receiverName || shop.buyerName} · {shop.receiverPhone || '—'}</p><p>{shop.deliveryAddress}</p>
        <small>Đơn tổng #{shop.orderId} · {orderDate(shop.orderedAt)}</small></div>
        <div><h2>Thanh toán</h2><PaymentInfo payment={shop.payment} /></div></section>
      <ShopOrderCard shop={shop}>
        {shop.allowedTransitions.includes('SHIPPING') && <label className="order-tracking">Mã vận đơn
          <input value={tracking} onChange={e => setTracking(e.target.value)} maxLength={100} disabled={busy} placeholder="Ví dụ: GHN-2026-001" />
        </label>}
        <div className="order-actions">{shop.allowedTransitions.map(next => <button key={next} disabled={busy}
          className={next === 'CANCELLED' ? 'order-danger' : 'primary'} onClick={() => update(next)}>{labels[next]}</button>)}</div>
        {!shop.allowedTransitions.length && <p className="muted">Không còn thao tác chuyển trạng thái cho phần đơn này.</p>}
      </ShopOrderCard>
      <p className="muted">Chức năng hủy áp dụng cho đơn COD chưa thu tiền và đã được hệ thống trừ kho. Đơn đã thanh toán chưa hỗ trợ hoàn tiền trên trang này.</p>
    </>}
  </div>;
}
export default function SellerOrdersPage() {
  const { shopOrderId } = useParams();
  return shopOrderId ? <SellerOrderDetails key={shopOrderId} id={shopOrderId} /> : <SellerOrdersList />;
}
