import React, { useEffect, useRef } from 'react';
import { animate, stagger } from 'framer-motion';
import { splitText } from 'motion-plus';

export default function SplitText({
  text,
  as: Component = 'span',
  className = '',
  delay = 0,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const { chars, words } = splitText(ref.current);
    words.forEach((w) => (w.style.overflow = 'hidden'));
    animate(
      chars,
      { opacity: [0, 1], y: ['100%', '0%'] },
      {
        duration: 0.1,
        delay: stagger(0.05, { startDelay: delay }),
        ease: [0.12, 0, 0.39, 0],
      }
    );
  }, [delay]);

  return (
    <Component ref={ref} className={className}>
      {text}
    </Component>
  );
}
