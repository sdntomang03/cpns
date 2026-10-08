import DOMPurify from 'dompurify';
import { useEffect, useRef } from 'react';

const delimiters = [
  { left: '$$', right: '$$', display: true },
  { left: '\\[', right: '\\]', display: true },
  { left: '\\(', right: '\\)', display: false },
  { left: '$', right: '$', display: false },
];

export default function MathContent({ content, className = '' }) {
  const contentRef = useRef(null);

  useEffect(() => {
    const element = contentRef.current;

    if (!element) {
      return;
    }

    element.innerHTML = DOMPurify.sanitize(content || '');

    let active = true;

    import('katex/contrib/auto-render').then(({ default: renderMathInElement }) => {
      if (!active) {
        return;
      }

      renderMathInElement(element, {
        delimiters,
        throwOnError: false,
        strict: 'ignore',
        trust: false,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
      });
    }).catch((error) => {
      console.error('Failed to load the offline math renderer', error);
    });

    return () => {
      active = false;
    };
  }, [content]);

  return <article ref={contentRef} className={`material-content ${className}`} />;
}
