import ProductImage from './ProductImage';
export const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
export default function ProductCard({ product, onChoose }) {
  return <article className="product-card"><div className="product-image"><ProductImage key={product.image} src={product.image} name={product.name} /></div><div className="product-info"><h3>{product.name}</h3><p>{product.category}</p><strong>{product.variantCount > 1 ? 'Từ ' : ''}{money(product.price)}</strong><button className="add-button" onClick={() => onChoose(product)}>Chọn mua <span aria-hidden="true">＋</span></button></div></article>;
}
