import {useState, useRef, useEffect, useMemo} from 'react';
import {motion} from 'framer-motion';
import ChatInput from './components/ChatInput';
import SocialNetworkBadge from './components/SocialNetworkBadge';
import SplitText from './components/SplitText';
import FlyingLogos from './components/FlyingLogos';
import MarkdownTypewriter from './components/MarkdownTypewriter';


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

// --------------------- message bubbles ---------------------
const AssistantBubble = ({text, loading}) => (
    <div className="self-start max-w-[75%]">
        <div
            className={`bg-gray-800 text-gray-100 px-4 py-3 rounded-2xl text-sm shadow whitespace-pre-wrap ${loading && !text ? 'min-h-[40px] flex items-end' : ''}`}
        >
            {loading && !text ? (
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0s]"/>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"/>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"/>
                </div>
            ) : (
                <MarkdownTypewriter text={text}/>
            )}
        </div>
    </div>
);

const UserBubble = ({text}) => (
    <div className="self-end max-w-[75%]">
        <div
            className="inline-block bg-gradient-to-br from-indigo-500 to-purple-600 text-white px-4 py-3 rounded-2xl text-sm shadow whitespace-pre-wrap"
        >
            {text}
        </div>
    </div>
);

// --------------------- main component ---------------------
export default function App() {
    const [messages, setMessages] = useState([]);          // {role:'user'|'assistant', content:'', finished?:bool}
    const [draft, setDraft] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState(null);
    const [connectionVersion, setConnectionVersion] = useState(0);
    const socketRef = useRef(null);
    const bottomRef = useRef(null);                        // auto‑scroll anchor
    const examplePrompts = useMemo(() => {
        const arr = [...ALL_PROMPTS];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.slice(0, 3);
    }, []);

    // ---------- WebSocket lifecycle ----------
    useEffect(() => {
        const socket = new WebSocket(
            'wss://api.gfonseca.io'
        );
        socketRef.current = socket;

        socket.onopen = () => console.log('✅ WebSocket open');

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.op === 'error') {
                setMessages(prev => prev.slice(0, -1))
                setError(data.message || 'Error');
                setWaiting(false);
                return;
            }

            if (data.op === 'message_chunk') {
                setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last?.role === 'assistant' && !last.finished) {
                        // extend existing streamed message
                        last.content += data.content;
                        last.loading = false;
                        return [...prev];
                    }
                    // first chunk ➜ push new assistant message
                    return [...prev, {role: 'assistant', content: data.content, finished: false, loading: false}];
                });
            }

            if (data.op === 'finish') {
                setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last?.role === 'assistant') {
                        return [
                            ...prev.slice(0, -1),
                            {...last, finished: true, loading: false},
                        ];
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

    // ---------- send user message ----------
    const send = (textOverride) => {
        const text = (textOverride ?? draft).trim();
        if (!text || waiting) return;

        setError(null);

        // optimistic user bubble
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

    // auto‑scroll every time messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    const landing = messages.length === 0;

    return (
        <>
            <FlyingLogos/>
            <main
                className={`
            min-h-dvh w-full bg-transparent flex flex-col
            transition-all duration-500
            ${landing ? 'items-center justify-center' : ''}
          `}
                style={{
                    paddingTop: 'env(safe-area-inset-top)',
                    paddingLeft: 'env(safe-area-inset-left)',
                    paddingRight: 'env(safe-area-inset-right)'
                }}
            >
                {/* ---------- Top header when chat active ---------- */}
                {!landing && (
                    <header
                        className="sticky top-0 w-full bg-neutral-900/30 backdrop-blur border-b border-neutral-800 z-10"
                    >
                        <div className="max-w-screen-md w-full mx-auto flex items-center gap-4 px-4 py-3">
                            <h1 className="text-white font-medium flex-1">Gonçalo Fonseca</h1>
                            <SocialNetworkBadge
                                url="https://github.com/FonsecaGoncalo"
                                icon="github"
                                size={20}
                                className="text-gray-300 hover:text-white"
                            />
                            <SocialNetworkBadge
                                url="https://www.linkedin.com/in/goncalo-fonseca"
                                icon="linkedin"
                                size={20}
                                className="text-gray-300 hover:text-white"
                            />
                            <button
                                aria-label="Close chat"
                                onClick={() => {
                                    socketRef.current?.close();
                                    setMessages([]);
                                    setWaiting(false);
                                    setConnectionVersion(v => v + 1);
                                }}
                                className="text-gray-300 hover:text-white active:scale-95 transition-transform"
                            >
                                <XMarkIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </header>
                )}

                {/* ---------- Landing greeting ---------- */}
                {landing && (
                    <div className="flex flex-col items-center gap-4 mb-10 w-80 sm:w-96 md:w-[520px]">
                        <div className="text-2xl md:text-3xl font-medium text-white text-left leading-tight">
                            <SplitText text="Hi!👋" as="h1"/>
                            <SplitText text="I'm Gonçalo, a Software Engineer" as="h1" delay={0.2}/>
                        </div>
                    </div>
                )}

                {landing && (
                    <div className="flex justify-center mb-10">
                        <div
                            className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory w-full max-w-screen-md px-4">
                            {examplePrompts.map(({text, Icon}) => (
                                <button
                                    key={text}
                                    onClick={() => send(text)}
                                    className="flex-shrink-0 snap-start bg-neutral-900/30 backdrop-blur text-gray-200 border border-neutral-800 rounded-xl p-4 w-3/5 sm:w-48 h-32 flex flex-col justify-between hover:bg-neutral-900/50 transition"
                                >
                                    <span className="text-sm">{text}</span>
                                    <Icon className="w-5 h-5 text-gray-400 self-end"/>
                                </button>
                            ))}
                        </div>
                    </div>
                )}


                {/* ---------- Chat history ---------- */}
                {messages.length > 0 && (
                    /* Chat scroll container */
                    <section
                        className="
                flex-1 overflow-y-auto overscroll-contain
                  scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800
                px-4
              "
                    >
                        <div
                            className="
                          flex flex-col gap-4 pt-10
                          max-w-screen-md w-full mx-auto
                          pb-[calc(5.5rem+env(safe-area-inset-bottom))]
                        "
                        >
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
                                        <AssistantBubble text={m.content} finished={m.finished} loading={m.loading}/>
                                    )}
                                </motion.div>
                            ))}
                            <span ref={bottomRef}/>
                        </div>
                    </section>
                )}

                {/* ---------- Input (sticky at bottom, still part of normal flow) ---------- */}
                {error && <ErrorBanner message={error} onClose={() => setError(null)}/>}
                <ChatInput
                    landing={landing}
                    value={draft}
                    setValue={setDraft}
                    onSend={send}
                    disabled={waiting}
                />

                {landing && (
                    <div className="flex gap-6 mt-6">
                        <SocialNetworkBadge
                            url="https://github.com/FonsecaGoncalo"
                            icon="github"
                            size={32}
                            className="text-gray-300 hover:text-white"
                        />
                        <SocialNetworkBadge
                            url="https://www.linkedin.com/in/goncalo-fonseca"
                            icon="linkedin"
                            size={32}
                            className="text-gray-300 hover:text-white"
                        />
                    </div>
                )}
            </main>
        </>
    );
}
