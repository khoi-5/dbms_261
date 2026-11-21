import ProductImage from './ProductImage';

export const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function ProductCard({ product, onChoose }) {
  return (
    <article 
      className="product-card"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
        border: '1px solid #f1f5f9',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 10px 20px -3px rgba(15, 23, 42, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.05)';
      }}
      onClick={() => onChoose(product)}
    >
      <div 
        className="product-image"
        style={{
          aspectRatio: '16/10',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '12px'
        }}
      >
        <ProductImage 
          key={product.image || product.id} 
          src={product.image} 
          name={product.name} 
          category={product.category} 
        />
      </div>

      <div className="product-info" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '700',
          color: '#0f172a',
          margin: '0 0 4px',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '38px'
        }}>
          {product.name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {product.category || 'Chung'}
          </span>
          {product.productType === 'BOOK' && (
            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: '700' }}>
              Sách
            </span>
          )}
          {product.productType === 'CLOTHES' && (
            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#f3e8ff', color: '#6b21a8', fontWeight: '700' }}>
              Thời trang
            </span>
          )}
          {product.productType === 'ELECTRONICS' && (
            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: '700' }}>
              Điện tử
            </span>
          )}
        </div>

        <div style={{
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <strong style={{
            fontSize: '15px',
            fontWeight: '700',
            color: '#2563eb'
          }}>
            {product.maxPrice && product.maxPrice !== product.price
              ? `${money(product.price)} – ${money(product.maxPrice)}`
              : money(product.price)}
          </strong>

          <button 
            type="button"
            className="add-button" 
            onClick={(e) => {
              e.stopPropagation();
              onChoose(product);
            }}
            title="Thêm vào giỏ hàng"
            style={{
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              border: 'none',
              padding: '7px',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#eff6ff';
              e.currentTarget.style.color = '#2563eb';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
