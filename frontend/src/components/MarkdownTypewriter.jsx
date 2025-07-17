import React, { useState, useEffect, useRef } from 'react';
import { animate } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownTypewriter({ text }) {
  const [displayed, setDisplayed] = useState('');
  const prevLength = useRef(0);

  useEffect(() => {
    const start = prevLength.current;
    const end = text.length;

    const controls = animate(start, end, {
      duration: Math.max((end - start) * 0.05, 0.1),
      ease: 'linear',
      onUpdate: (latest) => {
        const i = Math.floor(latest);
        setDisplayed(text.slice(0, i));
      },
    });

    prevLength.current = end;
    return controls.stop;
  }, [text]);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayed}</ReactMarkdown>
  );
}
