import { useState } from 'react';

const FALLBACK = '/posters/fallback.svg';

/** Movie poster that swaps to a local placeholder if the image is missing or blocked. */
export default function PosterImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed || !src ? FALLBACK : src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
