import {useEffect, useMemo, useRef, useState, memo} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Mermaid from "./Mermaid";

function MarkdownTypewriter({text = '', speed = 10, finished = false}) {
    const [displayedText, setDisplayedText] = useState('');
    const indexRef = useRef(0);
    const lengthRef = useRef(0);
    const intervalRef = useRef(null);

    const safeText = useMemo(() => {
        if (finished) return text;
        return text.replace(/```mermaid([\s\S]*?)(```)?/g, (m, body, close) => {
            return close ? m : '```text\n' + body;
        });
    }, [text, finished]);

    useEffect(() => {
        if (safeText.length < lengthRef.current) {
            indexRef.current = 0;
            setDisplayedText('');
        }
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
        <div className="prose prose-p:my-2 prose-pre:my-2 prose-pre:rounded-md max-w-none">
            <ReactMarkdown
                children={displayedText}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    code({inline, className, children, ...props}) {
                        const lang = (className || '').replace('language-', '').trim();
                        if (!inline && (lang === 'mermaid' || className === 'mermaid')) {
                            return <Mermaid chart={String(children)}/>;
                        }
                        return inline ? (
                            <code
                                className="bg-[rgba(233,106,58,0.06)] border border-[#E8E1D9] rounded px-1.5 py-[2px] text-ink"
                                {...props}
                            >
                                {children}
                            </code>
                        ) : (
                            <pre className="bg-[#FFF9F5] border border-[#E8E1D9] rounded-md p-3 overflow-x-auto text-[#22252B] text-[13.5px] leading-relaxed">
                                <code className={`${className || ''} font-mono`} {...props}>{children}</code>
                            </pre>
                        );
                    },
                }}
            />
        </div>
    );
}

export default memo(MarkdownTypewriter);
