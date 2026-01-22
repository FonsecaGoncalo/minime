import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInput from './components/ChatInput';
import SocialNetworkBadge from './components/SocialNetworkBadge';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ErrorBanner from "./components/ErrorBanner";
import { AssistantBubble, UserBubble } from "./components/Bubbles";
import Hero from './components/Hero';
import FlyingLogos from './components/FlyingLogos';
import Resume from './components/Resume';

export default function App() {
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState(null);
    const [view, setView] = useState('hero');
    const [connectionVersion, setConnectionVersion] = useState(0);
    const socketRef = useRef(null);
    const bottomRef = useRef(null);

    const touchStart = useRef(null);

    const handleHeroWheel = (e) => {
        if (e.deltaY > 50) setView('resume');
    };

    const handleResumeWheel = (e) => {
        if (e.currentTarget.scrollTop === 0 && e.deltaY < -50) {
            setView('hero');
        }
    };

    const handleTouchStart = (e) => {
        touchStart.current = e.touches[0].clientY;
    };

    const handleHeroTouchEnd = (e) => {
        if (!touchStart.current) return;
        const deltaY = touchStart.current - e.changedTouches[0].clientY;
        if (deltaY > 50) setView('resume');
    };

    const handleResumeTouchEnd = (e) => {
        if (!touchStart.current) return;
        const deltaY = touchStart.current - e.changedTouches[0].clientY;
        if (deltaY < -50 && e.currentTarget.scrollTop === 0) setView('hero');
    };

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
                    return [...prev, { role: 'assistant', content: data.content, finished: false, loading: false }];
                });
            }

            if (data.op === 'finish') {
                setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last?.role === 'assistant') {
                        return [...prev.slice(0, -1), { ...last, finished: true, loading: false }];
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

    const mainRef = useRef(null);

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

    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        const isStreaming = lastMsg?.loading;
        bottomRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
    }, [messages]);

    const landing = messages.length === 0;

    const resetChat = () => {
        socketRef.current?.close();
        setMessages([]);
        setWaiting(false);
        setConnectionVersion(v => v + 1);
    };

    return (
        <main className="w-full h-dvh overflow-hidden text-ink bg-transparent selection:bg-brand-light/30 font-sans">
            <FlyingLogos className="fixed inset-0 z-0 opacity-100" />

            <AnimatePresence mode="wait">
                {landing ? (
                    <motion.div
                        key="landing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="relative z-10 w-full"
                    >
                        <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-6 flex justify-end items-center pointer-events-none">
                            <div className="flex items-center gap-4 pointer-events-auto">
                                <SocialNetworkBadge
                                    url="https://github.com/FonsecaGoncalo"
                                    icon="github"
                                    size={20}
                                    className="text-ink-lighter hover:text-brand-DEFAULT transition-colors"
                                />
                                <SocialNetworkBadge
                                    url="https://www.linkedin.com/in/goncalo-fonseca"
                                    icon="linkedin"
                                    size={20}
                                    className="text-ink-lighter hover:text-brand-DEFAULT transition-colors"
                                />
                            </div>
                        </header>

                        <div className="relative w-full h-full">
                            <AnimatePresence mode="wait">
                                {view === 'hero' ? (
                                    <motion.div
                                        key="hero"
                                        initial={{ opacity: 0, y: -50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -50, transition: { duration: 0.5 } }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                        className="h-[100dvh] w-full flex flex-col justify-center"
                                        onWheel={handleHeroWheel}
                                        onTouchStart={handleTouchStart}
                                        onTouchEnd={handleHeroTouchEnd}
                                    >
                                        <Hero
                                            onSend={send}
                                            value={draft}
                                            setValue={setDraft}
                                            disabled={waiting}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="resume"
                                        initial={{ opacity: 0, y: 100 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 100, transition: { duration: 0.5 } }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                        className="h-[100dvh] w-full overflow-y-auto bg-transparent"
                                        onWheel={handleResumeWheel}
                                        onTouchStart={handleTouchStart}
                                        onTouchEnd={handleResumeTouchEnd}
                                    >
                                        <Resume onDiscuss={(prompt) => send(prompt)} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col h-[100dvh] relative z-10 bg-white/50 backdrop-blur-sm"
                    >
                        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/90 backdrop-blur-md border-b border-border-light flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-brand-DEFAULT rounded-full" />
                                <span className="font-semibold text-lg tracking-tight text-ink">Gonçalo</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    aria-label="Close"
                                    onClick={resetChat}
                                    className="p-2 text-ink-light hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </header>

                        {/* Chat history */}
                        <section className="flex-1 overflow-y-auto overscroll-contain px-4 pt-24 pb-4 bg-transparent">
                            <div className="flex flex-col gap-8 max-w-3xl w-full mx-auto min-h-full justify-end pb-4">
                                {messages.map((m, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={`flex ${m.role === 'user' ? 'justify-end' : ''}`}
                                    >
                                        {m.role === 'user' ? (
                                            <UserBubble text={m.content} />
                                        ) : (
                                            <AssistantBubble text={m.content} finished={m.finished}
                                                loading={m.loading} />
                                        )}
                                    </motion.div>
                                ))}
                                <div ref={bottomRef} className="h-1" />
                            </div>
                        </section>

                        <ChatInput
                            landing={false}
                            value={draft}
                            setValue={setDraft}
                            onSend={send}
                            disabled={waiting}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-24 left-0 right-0 z-50 px-4 pointer-events-none"
                    >
                        <div className="max-w-md mx-auto pointer-events-auto">
                            <ErrorBanner message={error} onClose={() => setError(null)} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
