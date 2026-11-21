import { useState } from 'react';

// Bộ ảnh chất lượng cao CDN dự phòng khi URL trong database là domain nội bộ bkpee.vn
const FALLBACK_MAP = [
  { match: /(sách|giáo trình|database|cơ sở dữ liệu|clean code|book|tập)/i, url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80' },
  { match: /(áo|quần|thời trang|clothes|polo|nam|nữ|vải|cotton)/i, url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' },
  { match: /(tai nghe|sony|wh-1000|headphone|airpods)/i, url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80' },
  { match: /(macbook|laptop|m3|m2|dell|thinkpad)/i, url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80' },
  { match: /(iphone|điện thoại|phone|ipad|smartphone)/i, url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80' },
  { match: /(đồng hồ|watch|apple watch)/i, url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80' },
  { match: /(loa|homepod|speaker)/i, url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80' },
  { match: /(chuột|bàn phím|mouse|keyboard|silent|logitech)/i, url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80' }
];

export default function ProductImage({ src, name, category }) {
  const [imageError, setImageError] = useState(false);

  const getSmartImage = () => {
    const textToMatch = `${name || ''} ${category || ''}`.toLowerCase();
    for (const item of FALLBACK_MAP) {
      if (item.match.test(textToMatch)) {
        return item.url;
      }
    }
    return 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80';
  };

  // Nhận diện ảnh hợp lệ: http, data URL, hoặc file upload local
  const isDummyUrl = !src || src.includes('bkpee.vn');
  const isValidFormat = src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('/'));

  let resolvedSrc = src;
  if (src && src.startsWith('/uploads/')) {
    resolvedSrc = `http://localhost:8080${src}`;
  }

  const activeSrc = (!isDummyUrl && isValidFormat && !imageError) ? resolvedSrc : getSmartImage();

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
      <img
        src={activeSrc}
        alt={name || 'Sản phẩm'}
        loading="lazy"
        onError={() => setImageError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
    </div>
  );
}
