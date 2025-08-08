import {useEffect, useMemo, useRef, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Mermaid from './Mermaid';

import {memo} from 'react';


function MarkdownTypewriter({text = '', speed = 10, finished = false}) {
    const [displayedText, setDisplayedText] = useState('');
    const indexRef = useRef(0);
    const lengthRef = useRef(0);
    const intervalRef = useRef(null);

    // If we’re not finished, hide incomplete mermaid fences to avoid parser errors
    const safeText = useMemo(() => {
        if (finished) return text;
        // Replace any opening ```mermaid fence that doesn't have a closing fence yet
        // with a plain fenced code block so it renders as text while streaming.
        return text.replace(/```mermaid([\s\S]*?)(```)?/g, (m, body, close) => {
            return close ? m : '```text\n' + body;
        });
    }, [text, finished]);

    useEffect(() => {
        // Reset if text got shorter
        if (safeText.length < lengthRef.current) {
            indexRef.current = 0;
            setDisplayedText('');
        }

        // Start typing if there are new characters
        if (safeText.length > indexRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                indexRef.current += 1;
                lengthRef.current = indexRef.current;
                setDisplayedText(safeText.slice(0, indexRef.current));
                if (indexRef.current >= safeText.length) {
                    clearInterval(intervalRef.current);
                }
            }, [safeText, speed]);
        }

        return () => clearInterval(intervalRef.current);
    }, [safeText, speed]);

    return (
        <div
            className="prose prose-invert prose-p:my-2 prose-pre:my-2 prose-pre:rounded-md prose-pre:bg-black/40 prose-code:text-pink-400 max-w-none">
            <ReactMarkdown
                children={displayedText}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    code({inline, className, children, ...props}) {
                        const lang = (className || '').replace('language-', '').trim();
                        // Mermaid code fences: ```mermaid
                        if (!inline && (lang === 'mermaid' || className === 'mermaid')) {
                            return <Mermaid chart={String(children)}/>;
                        }
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

export default memo(MarkdownTypewriter);
