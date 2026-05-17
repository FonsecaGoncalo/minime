import { useState, useRef, useEffect } from 'react';
import ErrorBanner from './components/ErrorBanner';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';

export default function App() {
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState(null);
    const [connectionVersion, setConnectionVersion] = useState(0);
    const socketRef = useRef(null);

    useEffect(() => {
        const socket = new WebSocket('wss://api.gfonseca.io');
        socketRef.current = socket;

        socket.onopen = () => console.log('✅ WebSocket open');

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.op === 'error') {
                setMessages(prev => prev.slice(0, -1));
                setError(data.message || 'Error');
                setWaiting(false);
                return;
            }

            if (data.op === 'message_chunk') {
                setMessages((prev) => {
                    const cleaned = prev.filter((m) => m.role !== 'tool');
                    const last = cleaned[cleaned.length - 1];
                    if (last?.role === 'assistant' && !last.finished) {
                        last.content += data.content;
                        last.loading = false;
                        return [...cleaned];
                    }
                    return [...cleaned, { role: 'assistant', content: data.content, finished: false, loading: false }];
                });
            }

            if (data.op === 'tool_use') {
                setMessages((prev) => {
                    const next = prev.filter(
                        (m) =>
                            m.role !== 'tool' &&
                            !(m.role === 'assistant' && m.content === '')
                    );
                    return [...next, { role: 'tool', name: data.name }];
                });
            }

            if (data.op === 'finish') {
                setMessages((prev) => {
                    const cleaned = prev.filter((m) => m.role !== 'tool');
                    const last = cleaned[cleaned.length - 1];
                    if (last?.role === 'assistant') {
                        return [...cleaned.slice(0, -1), { ...last, finished: true, loading: false }];
                    }
                    return cleaned;
                });
                setWaiting(false);
            }
        };

        socket.onclose = () => {
            console.log('❌ WebSocket closed');
            setWaiting(false);
        };

        return () => socket.close();
    }, [connectionVersion]);

    const send = (textOverride) => {
        const text = (textOverride ?? draft).trim();
        if (!text || waiting) return;

        setError(null);

        setMessages((prev) => [
            ...prev,
            { role: 'user', content: text },
            { role: 'assistant', content: '', finished: false, loading: true },
        ]);

        const ws = socketRef.current;
        const doSend = () => ws?.send(JSON.stringify({ message: text }));
        if (ws && ws.readyState === WebSocket.CONNECTING) {
            ws.addEventListener('open', doSend, { once: true });
        } else {
            doSend();
        }
        if (textOverride === undefined) setDraft('');
        setWaiting(true);
    };

    const resetChat = () => {
        socketRef.current?.close();
        setMessages([]);
        setDraft('');
        setWaiting(false);
        setError(null);
        setConnectionVersion((v) => v + 1);
    };

    return (
        <main
            className="min-h-screen w-full bg-frame text-ink font-sans selection:bg-accent/30 box-border p-[14px] max-[980px]:p-2"
        >
            <div className="sp-grid">
                <LeftPanel
                    messages={messages}
                    draft={draft}
                    setDraft={setDraft}
                    onSend={send}
                    onReset={resetChat}
                    waiting={waiting}
                />
                <RightPanel />
            </div>

            <ErrorBanner message={error} onClose={() => setError(null)} />
        </main>
    );
}
