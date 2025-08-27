import {useState, useRef, useEffect} from 'react';
import {motion} from 'framer-motion';
import ChatInput from './components/ChatInput';
import SocialNetworkBadge from './components/SocialNetworkBadge';

import { XMarkIcon } from '@heroicons/react/24/outline';
import ErrorBanner from "./components/ErrorBanner";
import {AssistantBubble, UserBubble} from "./components/Bubbles";
import FlyingLogos from './components/FlyingLogos';
import Hero from './components/Hero';

export default function App() {
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState(null);
    const [connectionVersion, setConnectionVersion] = useState(0);
    const socketRef = useRef(null);
    const bottomRef = useRef(null);

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
                    const last = prev[prev.length - 1];
                    if (last?.role === 'assistant' && !last.finished) {
                        last.content += data.content;
                        last.loading = false;
                        return [...prev];
                    }
                    return [...prev, {role: 'assistant', content: data.content, finished: false, loading: false}];
                });
            }

            if (data.op === 'finish') {
                setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last?.role === 'assistant') {
                        return [...prev.slice(0, -1), {...last, finished: true, loading: false}];
                    }
                    return prev;
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
            {role: 'user', content: text},
            {role: 'assistant', content: '', finished: false, loading: true},
        ]);

        const ws = socketRef.current;
        const doSend = () => ws?.send(JSON.stringify({message: text}));
        if (ws && ws.readyState === WebSocket.CONNECTING) {
            ws.addEventListener('open', doSend, {once: true});
        } else {
            doSend();
        }
        if (textOverride === undefined) setDraft('');
        setWaiting(true);
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    const landing = messages.length === 0;

    // No toggles

    return (
        <>
            <main
                className={`
          min-h-dvh w-full app-bg flex flex-col
          transition-all duration-500
          ${landing ? 'items-center justify-center' : ''}
        `}
                style={{
                    paddingTop: 'env(safe-area-inset-top)',
                    paddingLeft: 'env(safe-area-inset-left)',
                    paddingRight: 'env(safe-area-inset-right)'
                }}
            >
                <FlyingLogos className="absolute inset-0 z-0" topClip={landing ? 0 : 56} opacity={0.12}/>

                <div className={`relative z-10 ${landing ? '' : 'flex flex-col flex-1 w-full'}`}>
                    {landing ? (
                        <Hero onSend={send} value={draft} setValue={setDraft} disabled={waiting} />
                    ) : (
                        /* ---------- CHAT LAYOUT ---------- */
                        <>
                            <header
                                className="sticky top-0 w-full bg-surface/80 backdrop-blur border-b border-borderCosmos z-10">
                                <div className="max-w-screen-md w-full mx-auto flex items-center gap-4 px-4 py-3">
                                    <h1 className="text-ink font-medium flex-1">Gonçalo Fonseca</h1>
                                    <SocialNetworkBadge
                                        url="https://github.com/FonsecaGoncalo"
                                        icon="github"
                                        size={20}
                                        className="text-muted hover:text-brand"
                                    />
                                    <SocialNetworkBadge
                                        url="https://www.linkedin.com/in/goncalo-fonseca"
                                        icon="linkedin"
                                        size={20}
                                        className="text-muted hover:text-brand"
                                    />
                                    {/* no theme toggles */}
                                    <button
                                        aria-label="Close chat"
                                        onClick={() => {
                                            socketRef.current?.close();
                                            setMessages([]);
                                            setWaiting(false);
                                            setConnectionVersion(v => v + 1);
                                        }}
                                        className="text-muted hover:text-brand active:scale-95 transition-transform"
                                    >
                                        <XMarkIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </header>

                            {/* Chat history */}
                            <section className="flex-1 overflow-y-auto overscroll-contain px-4">
                                <div
                                    className="flex flex-col gap-4 pt-16 max-w-screen-md w-full mx-auto pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
                                    {messages.map((m, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{opacity: 0, y: 8}}
                                            animate={{opacity: 1, y: 0}}
                                            transition={{duration: 0.2}}
                                            className={`flex ${m.role === 'user' ? 'justify-end' : ''}`}
                                        >
                                            {m.role === 'user' ? (
                                                <UserBubble text={m.content}/>
                                            ) : (
                                                <AssistantBubble text={m.content} finished={m.finished}
                                                                 loading={m.loading}/>
                                            )}
                                        </motion.div>
                                    ))}
                                    <span ref={bottomRef}/>
                                </div>
                            </section>

                            <ChatInput
                                landing={false}
                                value={draft}
                                setValue={setDraft}
                                onSend={send}
                                disabled={waiting}
                            />
                        </>
                    )}
                </div>

                {error && <ErrorBanner message={error} onClose={() => setError(null)}/>}
            </main>
        </>
    );
}
