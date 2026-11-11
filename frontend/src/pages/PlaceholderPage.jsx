import { Link } from 'react-router-dom';
export default function PlaceholderPage({ title }) { return <section className="state"><p className="eyebrow">ĐANG PHÁT TRIỂN</p><h1>{title}</h1><p>Chức năng chưa được triển khai. Chưa có đơn hàng hay thanh toán nào được tạo.</p><Link to="/products">← Tiếp tục mua sắm</Link></section>; }
