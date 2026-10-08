import api from '../../api/axios';

export default function QuestionImage({ image, alt, compact = false }) {
  if (typeof image !== 'string' || !image.trim()) {
    return null;
  }

  const imagePath = image.trim();
  const isAbsoluteUrl = /^(https?:|data:|blob:)/i.test(imagePath);
  const isServerStoragePath = /^\/?storage\//i.test(imagePath);
  const apiOrigin = new URL(api.defaults.baseURL, window.location.origin).origin;
  const source = isAbsoluteUrl
    ? imagePath
    : isServerStoragePath
      ? new URL(imagePath.startsWith('/') ? imagePath : `/${imagePath}`, apiOrigin).href
      : `/${imagePath.replace(/^\/+/, '')}`;

  return (
    <img
      className={`question-image${compact ? ' question-image-compact' : ''}`}
      src={source}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  );
}
