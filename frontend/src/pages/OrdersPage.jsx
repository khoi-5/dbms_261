import { useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useOrderResource } from '../services/useOrderResource';
import { orderDate, orderMoney, orderQuery } from '../services/orders';
import { DeliveryBadge, OrderFilters, OrderPagination, PaymentInfo, ReceiptInfo, ShopOrderCard } from '../components/OrderParts';
import '../styles/orders.css';

function BuyerOrderList() {
  const [params, setParams] = useSearchParams();
  const filters = { status: params.get('status') || '', from: params.get('from') || '', to: params.get('to') || '' };
  const page = Math.max(0, parseInt(params.get('page') || '0', 10) || 0);
  const [revision, setRevision] = useState(0);
  const [filterError, setFilterError] = useState('');
  const { data, error, loading } = useOrderResource('/buyer/orders?' + orderQuery(filters, page), revision);
  function apply(value) {
    if (value.from && value.to && value.from > value.to) { setFilterError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'); return; }
    setFilterError(''); setParams(orderQuery(value));
  }
  return <div className="orders-feature">
    <header className="page-header"><div><p className="eyebrow">ĐƠN MUA CỦA BẠN</p><h1>Lịch sử mua hàng</h1>
      <p className="muted">Giá mua được giữ theo thời điểm đặt hàng.</p></div><Link to="/products">Tiếp tục mua sắm</Link></header>
    <OrderFilters key={params.toString()} filters={filters} onSubmit={apply} busy={loading} buyer />
    {(filterError || error) && <div className="error" role="alert">{filterError || error}
      {error && <button onClick={() => setRevision(v => v + 1)}>Tải lại</button>}</div>}
    {loading ? <div className="state" role="status">Đang tải lịch sử…</div> : data && <>
      {!data.items.length ? <section className="state"><h2>Chưa có đơn hàng phù hợp</h2>
        {page > 0 ? <button onClick={() => setParams(orderQuery(filters))}>Về trang đầu</button> : <Link to="/products">Khám phá sản phẩm</Link>}
      </section> : <div className="order-list">{data.items.map(order => <article className="order-card" key={order.id}>
        <div className="order-card-heading"><div><h2>Đơn #{order.id}</h2><small>{orderDate(order.orderedAt)}</small></div>
          <Link className="primary" to={'/orders/' + order.id}>Xem chi tiết</Link></div>
        <div className="order-shop-summaries">{order.shops.map(shop => <div key={shop.id}><span>{shop.shopName}<ReceiptInfo shop={shop} /></span>
          <DeliveryBadge status={shop.status} /></div>)}</div>
        <div className="order-card-footer"><PaymentInfo payment={order.payment} /><div>
          <small>Tổng đặt hàng</small><strong>{orderMoney(order.originalTotal)}</strong>
          {Number(order.payableTotal) !== Number(order.originalTotal) && <small>Sau hủy: {orderMoney(order.payableTotal)}</small>}
        </div></div>
      </article>)}</div>}
      <OrderPagination data={data} busy={loading} onPage={value => setParams(orderQuery(filters, value))} />
    </>}
  </div>;
}

function BuyerOrderDetails({ id }) {
  const location = useLocation();
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');
  const { data: order, error, loading } = useOrderResource('/buyer/orders/' + id, revision);
  async function changeShop(shop, action) {
    const receiving = action === 'confirm-received';
    const prompt = receiving ? 'Xác nhận đã nhận hàng từ ' : 'Hủy phần đơn của ';
    if (inFlight.current || !window.confirm(prompt + shop.shopName + '?')) return;
    inFlight.current = true;
    setBusy(true); setActionError(''); setSuccess('');
    try {
      await api('/buyer/shop-orders/' + shop.id + '/' + action, { method: 'POST', body: { expectedStatus: shop.status } });
      setSuccess(receiving ? 'Đã xác nhận nhận hàng.' : 'Đã hủy phần đơn.');
      setRevision(v => v + 1);
    } catch (e) { setActionError(e.message); if (e.status === 409) setRevision(v => v + 1); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <div className="orders-feature">
    <header className="page-header"><div><p className="eyebrow">CHI TIẾT ĐƠN MUA</p><h1>Đơn hàng #{id}</h1></div>
      <Link to="/orders">← Lịch sử mua hàng</Link></header>
    {location.state?.placed && <p className="success" role="status">Đặt hàng thành công.</p>}
    {success && <p className="success" role="status">{success}</p>}
    {(error || actionError) && <div className="error" role="alert">{error || actionError}<button onClick={() => setRevision(v => v + 1)}>Tải lại</button></div>}
    {loading ? <div className="state" role="status">Đang tải đơn hàng…</div> : order && <>
      <section className="order-card order-overview"><div><h2>Người nhận</h2><p>{order.receiverName || '—'} · {order.receiverPhone || '—'}</p>
        <p>{order.deliveryAddress}</p><small>Đặt lúc {orderDate(order.orderedAt)}</small></div>
        <div><h2>Thanh toán</h2><PaymentInfo payment={order.payment} />
          <p>Tổng đặt hàng: <strong>{orderMoney(order.originalTotal)}</strong></p>
          {Number(order.originalTotal) !== Number(order.payableTotal) && <p>Giá trị các phần chưa hủy: <strong>{orderMoney(order.payableTotal)}</strong></p>}
        </div></section>
      {order.shops.map(shop => <ShopOrderCard key={shop.id} shop={shop}>
        {(shop.buyerCanCancel || shop.buyerCanConfirmReceipt) && <div className="order-actions">
          {shop.buyerCanCancel && <button className="order-danger" disabled={busy} onClick={() => changeShop(shop, 'cancel')}>Hủy phần đơn này</button>}
          {shop.buyerCanConfirmReceipt && <button className="primary" disabled={busy} onClick={() => changeShop(shop, 'confirm-received')}>Đã nhận hàng</button>}
        </div>}
      </ShopOrderCard>)}
    </>}
  </div>;
}
export default function OrdersPage() {
  const { orderId } = useParams();
  return orderId ? <BuyerOrderDetails key={orderId} id={orderId} /> : <BuyerOrderList />;
}
