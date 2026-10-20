import { useState } from 'react';

export default function Img({ src, alt, className = '', round = false }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`img-fallback ${round ? 'round' : ''} ${className}`} role="img" aria-label={alt}>
        {alt?.[0] || '?'}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`${round ? 'round' : ''} ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
