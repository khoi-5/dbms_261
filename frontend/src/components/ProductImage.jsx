import { useState } from 'react';
export default function ProductImage({ src, name }) {
  const [failed, setFailed] = useState(false);
  const safe = typeof src === 'string' && /^(https?:\/\/|\/[^/])/.test(src);
  return safe && !failed ? <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} /> : <div className="image-placeholder" role="img" aria-label={`${name} — chưa có ảnh`}><span aria-hidden="true">▧</span><small>Chưa có ảnh</small></div>;
}
