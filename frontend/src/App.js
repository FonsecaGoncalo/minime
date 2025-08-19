import {useState, useRef, useEffect, useMemo, useCallback} from 'react';
import {motion} from 'framer-motion';
import ChatInput from './components/ChatInput';
import SocialNetworkBadge from './components/SocialNetworkBadge';
import SplitText from './components/SplitText';

import {
    XMarkIcon,
    SparklesIcon,
    BriefcaseIcon,
    CalendarDaysIcon,
    HeartIcon,
    WrenchScrewdriverIcon,
    MusicalNoteIcon,
    CodeBracketSquareIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';
import ErrorBanner from "./components/ErrorBanner";
import {AssistantBubble, UserBubble} from "./components/Bubbles";
import FlyingLogos from './components/FlyingLogos';

const ALL_PROMPTS = [
    {text: 'Do you enjoy working on side projects?', Icon: SparklesIcon},
    {text: 'What kind of projects were you working on at your last job?', Icon: BriefcaseIcon},
    {text: 'Can I schedule a meeting with you to chat more?', Icon: CalendarDaysIcon},
    {text: 'Do you have any pets?', Icon: HeartIcon},
    {text: "What's a side project you've worked on that you're particularly proud of?", Icon: WrenchScrewdriverIcon},
    {text: 'What do you usually enjoy doing outside of work?', Icon: MusicalNoteIcon},
    {text: 'How did you get into software engineering?', Icon: CodeBracketSquareIcon},
    {text: 'Can you tell me a bit about your career journey so far?', Icon: ChartBarIcon},
];

export default function App() {
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState(null);
    const [connectionVersion, setConnectionVersion] = useState(0);
    const socketRef = useRef(null);
    const bottomRef = useRef(null);
    const [titleReady, setTitleReady] = useState(false);
    const onTitleDone = useCallback(() => setTitleReady(true), []);

    const examplePrompts = useMemo(() => {
        const arr = [...ALL_PROMPTS];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.slice(0, 3);
    }, []);

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
                        <div className="w-full max-w-screen-md px-4 mx-auto flex flex-col items-center">
                            <div className="w-[88vw] max-w-[520px] mb-6 self-center">
                                <div
                                    className="text-[28px] leading-8 md:text-3xl md:leading-tight font-medium text-gray-900 text-left">
                                    <h1>
                                        <SplitText text="Hi!" as="span" />
                                        <span className={`inline-block align-baseline leading-none ml-2 relative top-[-0.18em] ${titleReady ? 'wave-once' : ''}`}>👋</span>
                                    </h1>
                                    <h1>
                                        <SplitText
                                            text={"I'm Gonçalo, a Software Engineer"}
                                            as="span"
                                            delay={0.12}
                                            highlightWords={["Gonçalo"]}
                                            onComplete={onTitleDone}
                                        />
                                    </h1>
                                </div>
                            </div>

                            <div className="w-full mb-6">
                                <div className="overflow-x-auto no-scrollbar -mx-4 overscroll-contain">
                                    <div className="flex gap-3 snap-x snap-mandatory sm:justify-center px-3 sm:px-0">
                                        {examplePrompts.map(({text, Icon}) => (
                                            <button
                                                key={text}
                                                onClick={() => send(text)}
                                                className="flex-shrink-0 snap-start bg-white/90 backdrop-blur text-gray-800 border border-gray-200 rounded-xl p-4 w-3/5 sm:w-48 h-32 flex flex-col justify-between hover:shadow-md transition"

                                            >
                                                <span className="text-sm leading-snug text-center">{text}</span>
                                                <Icon className="w-5 h-5 text-[#f87160] self-end"/>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <ChatInput
                                    landing
                                    value={draft}
                                    setValue={setDraft}
                                    onSend={send}
                                    disabled={waiting}
                                />
                            </div>

                            {/* Social icons */}
                            <div className="flex gap-6">
                                <SocialNetworkBadge
                                    url="https://github.com/FonsecaGoncalo"
                                    icon="github"
                                    size={32}
                                    className="text-gray-500 hover:text-gray-800"
                                />
                                <SocialNetworkBadge
                                    url="https://www.linkedin.com/in/goncalo-fonseca"
                                    icon="linkedin"
                                    size={32}
                                    className="text-gray-500 hover:text-gray-800"
                                />
                            </div>
                        </div>
                    ) : (
                        /* ---------- CHAT LAYOUT ---------- */
                        <>
                            <header
                                className="sticky top-0 w-full bg-white/70 backdrop-blur border-b border-gray-200 z-10">
                                <div className="max-w-screen-md w-full mx-auto flex items-center gap-4 px-4 py-3">
                                    <h1 className="text-gray-800 font-medium flex-1">Gonçalo Fonseca</h1>
                                    <SocialNetworkBadge
                                        url="https://github.com/FonsecaGoncalo"
                                        icon="github"
                                        size={20}
                                        className="text-gray-500 hover:text-gray-800"
                                    />
                                    <SocialNetworkBadge
                                        url="https://www.linkedin.com/in/goncalo-fonseca"
                                        icon="linkedin"
                                        size={20}
                                        className="text-gray-500 hover:text-gray-800"
                                    />
                                    <button
                                        aria-label="Close chat"
                                        onClick={() => {
                                            socketRef.current?.close();
                                            setMessages([]);
                                            setWaiting(false);
                                            setConnectionVersion(v => v + 1);
                                        }}
                                        className="text-gray-500 hover:text-gray-800 active:scale-95 transition-transform"
                                    >
                                        <XMarkIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </header>

                            {/* Chat history */}
                            <section className="flex-1 overflow-y-auto overscroll-contain px-4">
                                <div
                                    className="flex flex-col gap-4 pt-10 max-w-screen-md w-full mx-auto pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
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
