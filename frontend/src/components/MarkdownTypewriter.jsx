import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export default function MarkdownTypewriter({ text = '', speed = 10 }) {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const lengthRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Reset if text got shorter
    if (text.length < lengthRef.current) {
      indexRef.current = 0;
      setDisplayedText('');
    }

    // Start typing if there are new characters
    if (text.length > indexRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        indexRef.current += 1;
        lengthRef.current = indexRef.current;
        setDisplayedText(text.slice(0, indexRef.current));
        if (indexRef.current >= text.length) {
          clearInterval(intervalRef.current);
        }
      }, speed);
    }

    return () => clearInterval(intervalRef.current);
  }, [text, speed]);

  return (
    <div className="prose prose-invert prose-p:my-2 prose-pre:my-2 prose-pre:rounded-md prose-pre:bg-black/40 prose-code:text-pink-400 max-w-none">
      <ReactMarkdown
        children={displayedText}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ inline, className, children, ...props }) {
            return inline ? (
              <code
                className="bg-black/40 rounded px-1 py-0.5 text-pink-400"
                {...props}
              >
                {children}
              </code>
            ) : (
              <pre className="bg-black/40 rounded p-3 overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
        }}
      />
    </div>
  );
}
