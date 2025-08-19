import React, { useEffect, useRef } from 'react';
import { animate, stagger } from 'framer-motion';
import { splitText } from 'motion-plus';

export default function SplitText({
  text,
  as: Component = 'span',
  className = '',
  delay = 0,
  highlightWords = [],
  highlightClass = 'highlight-underline',
  onComplete,
}) {
  const ref = useRef(null);
  const didAnimateRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (!didAnimateRef.current && onComplete) {
        didAnimateRef.current = true;
        const id = requestAnimationFrame(() => onComplete());
        return () => cancelAnimationFrame(id);
      }
      return;
    }

    if (didAnimateRef.current) return; // prevent re-running animation on re-render

    const { words } = splitText(ref.current);

    const highlightSet = new Set(
      (highlightWords || []).map((w) => (w || '').toString().toLowerCase())
    );

    words.forEach((w) => {
      w.style.overflow = 'hidden';
      w.style.opacity = '0'; // avoid flash before animation applies
      if (highlightSet.size > 0) {
        const raw = w.textContent || '';
        const norm = raw.replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase();
        if (highlightSet.has(norm)) {
          const m2 = raw.match(/^([\p{L}\p{N}]+)([^\p{L}\p{N}]+)?$/u);
          if (m2) {
            const wordPart = m2[1] || raw;
            const punctPart = m2[2] || '';
            w.textContent = '';
            const span = document.createElement('span');
            span.textContent = wordPart;
            span.classList.add(highlightClass);
            w.appendChild(span);
            if (punctPart) w.appendChild(document.createTextNode(punctPart));
          } else {
            w.classList.add(highlightClass);
          }
        }
      }
    });

    const controls = animate(
      words,
      { opacity: [0, 1] },
      {
        duration: 0.28,
        delay: stagger(0.05, { startDelay: delay }),
        ease: 'linear',
      }
    );
    if (controls && typeof controls.then === 'function') {
      controls.then(() => {
        if (!didAnimateRef.current) didAnimateRef.current = true;
        onComplete && onComplete();
      });
    } else if (controls && controls.finished && typeof controls.finished.then === 'function') {
      controls.finished.then(() => {
        if (!didAnimateRef.current) didAnimateRef.current = true;
        onComplete && onComplete();
      });
    }

    return () => {
      if (controls && typeof controls.stop === 'function') controls.stop();
    };
  }, [delay, onComplete]);

  return (
    <Component ref={ref} className={className}>
      {text}
    </Component>
  );
}
