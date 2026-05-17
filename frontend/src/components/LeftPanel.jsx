import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssistantBubble, UserBubble } from './Bubbles';
import { ToolPill } from './ToolPill';
import FlyingLogos from './FlyingLogos';
import useSpeechRecognition, { isSpeechRecognitionSupported } from '../hooks/useSpeechRecognition';

const SUGGESTED = [
    "Tech stack?",
    "Projects you're proud of",
    "How'd you build this site?",
    "What do you do for fun?",
];

const LEFT_GRADIENT =
    'linear-gradient(150deg, #f5e8d0 0%, #f3c065 38%, #ec8f3e 75%, #c0623e 100%)';

function Wordmark({ onReset }) {
    return (
        <button
            type="button"
            onClick={onReset}
            title="Start a new chat"
            className="flex items-center gap-3 bg-transparent border-0 cursor-pointer p-0 text-left"
        >
            <span className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-full bg-ink text-cream font-serif italic text-[20px] leading-none">
                <span style={{ display: 'block', transform: 'translateY(-2px)' }}>g</span>
            </span>
            <span
                className="font-serif text-[22px] text-ink leading-none whitespace-nowrap"
                style={{ letterSpacing: '-0.3px' }}
            >
                Gonçalo Fonseca
            </span>
        </button>
    );
}

function StatusPill() {
    return (
        <span
            className="inline-flex items-center gap-[7px] text-[12px] text-ink-soft rounded-full whitespace-nowrap"
            style={{
                letterSpacing: '0.4px',
                padding: '4px 12px',
                background: 'rgba(253,246,232,0.55)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                border: '1px solid rgba(28,24,21,0.14)',
            }}
        >
            <span className="block w-[7px] h-[7px] rounded-full bg-accent available-dot" />
            Open to new roles
        </span>
    );
}

function HeroEmptyState() {
    return (
        <div>
            <h1
                className="font-sans font-medium text-ink"
                style={{
                    fontSize: 'clamp(48px, 6.5vw, 88px)',
                    lineHeight: 0.96,
                    letterSpacing: '-0.035em',
                    margin: '0 0 18px',
                    maxWidth: 540,
                }}
            >
                Hi! I'm Gonçalo.
            </h1>
            <p
                className="m-0 text-ink-soft"
                style={{ fontSize: 17, lineHeight: 1.55, maxWidth: 460 }}
            >
                Software engineer.
                <span className="hidden max-[980px]:inline">
                    {' '}CV&nbsp;below&nbsp;↓
                </span>
            </p>
        </div>
    );
}

function SuggestedChip({ label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="font-sans text-[13px] text-ink-soft rounded-full cursor-pointer whitespace-nowrap leading-none transition-colors duration-150 hover:!text-ink"
            style={{
                background: 'rgba(253,246,232,0.55)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(28,24,21,0.14)',
                padding: '8px 14px',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(253,246,232,0.85)';
                e.currentTarget.style.borderColor = '#b85a3a';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(253,246,232,0.55)';
                e.currentTarget.style.borderColor = 'rgba(28,24,21,0.14)';
            }}
        >
            {label}
        </button>
    );
}

function MicButton({ listening, disabled, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={listening ? 'Stop recording' : 'Start voice message'}
            title={listening ? 'Stop recording' : 'Speak'}
            className="flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer"
            style={{
                width: 36,
                height: 36,
                border: 'none',
                flexShrink: 0,
                color: listening ? '#fff' : '#5b504a',
                background: listening
                    ? 'linear-gradient(135deg, #ec8f3e 0%, #b85a3a 100%)'
                    : 'transparent',
                opacity: disabled ? 0.4 : 1,
                boxShadow: listening ? '0 0 0 4px rgba(184,90,58,0.22)' : 'none',
            }}
            onMouseEnter={(e) => {
                if (!listening && !disabled) {
                    e.currentTarget.style.background = 'rgba(28,24,21,0.07)';
                    e.currentTarget.style.color = '#1c1815';
                }
            }}
            onMouseLeave={(e) => {
                if (!listening) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#5b504a';
                }
            }}
        >
            {listening ? (
                <motion.span
                    animate={{ scale: [1, 1.18, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                    className="block w-2.5 h-2.5 rounded-sm bg-white"
                />
            ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="2" width="4" height="8" rx="2" />
                    <path d="M3.5 8a4.5 4.5 0 009 0M8 12.5V14" />
                </svg>
            )}
        </button>
    );
}

function Composer({ value, setValue, onSend, onReset, disabled, hasUserMsg, listening, interim, onMicToggle, micSupported }) {
    const canSend = !!value.trim() && !disabled;
    const displayValue = listening && interim ? interim : value;
    return (
        <div
            className="w-full flex items-center gap-2 rounded-full transition-shadow duration-150"
            style={{
                marginTop: 14,
                background: 'rgba(253,246,232,0.85)',
                backdropFilter: 'blur(16px) saturate(1.25)',
                WebkitBackdropFilter: 'blur(16px) saturate(1.25)',
                border: '1px solid rgba(28,24,21,0.14)',
                padding: '7px 7px 7px 22px',
                boxShadow:
                    '0 1px 2px rgba(28,24,21,0.05), 0 18px 50px rgba(184,90,58,0.20)',
            }}
            onFocusCapture={(e) => {
                e.currentTarget.style.borderColor = '#b85a3a';
                e.currentTarget.style.boxShadow =
                    '0 0 0 4px rgba(184,90,58,0.22), 0 18px 50px rgba(184,90,58,0.25)';
            }}
            onBlurCapture={(e) => {
                e.currentTarget.style.borderColor = 'rgba(28,24,21,0.14)';
                e.currentTarget.style.boxShadow =
                    '0 1px 2px rgba(28,24,21,0.05), 0 18px 50px rgba(184,90,58,0.20)';
            }}
        >
            <input
                value={displayValue}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && canSend) {
                        e.preventDefault();
                        onSend();
                    }
                }}
                placeholder={
                    listening
                        ? 'Listening…'
                        : hasUserMsg ? 'Ask a follow-up…' : 'Type your question…'
                }
                disabled={disabled || listening}
                autoComplete="off"
                enterKeyHint="send"
                className="flex-1 bg-transparent border-0 outline-none text-ink font-sans font-medium text-[15px]"
                style={{ caretColor: '#b85a3a', padding: '11px 0' }}
            />
            {micSupported && (
                <MicButton
                    listening={listening}
                    disabled={disabled && !listening}
                    onClick={onMicToggle}
                />
            )}
            {hasUserMsg && (
                <button
                    type="button"
                    onClick={onReset}
                    aria-label="New chat"
                    title="New chat"
                    className="flex items-center justify-center rounded-full bg-transparent text-ink-soft cursor-pointer transition-colors duration-150 hover:bg-[rgba(28,24,21,0.07)] hover:!text-ink"
                    style={{ width: 36, height: 36, border: 'none', flexShrink: 0 }}
                >
                    <svg
                        width="13"
                        height="13"
                        viewBox="0 0 11 11"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    >
                        <path d="M1.5 5.5a4 4 0 117 2.5M8.5 5.5V2M8.5 5.5h-3" />
                    </svg>
                </button>
            )}
            <button
                type="button"
                onClick={canSend ? () => onSend() : undefined}
                disabled={!canSend}
                aria-label="Send"
                className="flex items-center justify-center rounded-full transition-all duration-150"
                style={{
                    width: 40,
                    height: 40,
                    border: 'none',
                    flexShrink: 0,
                    color: '#fff',
                    cursor: canSend ? 'pointer' : 'default',
                    opacity: canSend ? 1 : 0.4,
                    background: canSend
                        ? 'linear-gradient(135deg, #ec8f3e 0%, #b85a3a 100%)'
                        : 'rgba(28,24,21,0.08)',
                    boxShadow: canSend ? '0 4px 18px rgba(184,90,58,0.66)' : 'none',
                }}
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M7 12V2M2 7l5-5 5 5" />
                </svg>
            </button>
        </div>
    );
}

export default function LeftPanel({
    messages,
    draft,
    setDraft,
    onSend,
    onReset,
    waiting,
    audioPlaying,
    onStopAudio,
}) {
    const scrollerRef = useRef(null);
    const hasUserMsg = messages.some((m) => m.role === 'user');
    const micSupported = isSpeechRecognitionSupported();

    const { listening, interim, start, stop } = useSpeechRecognition({
        onFinal: (text) => onSend(text, { voice: true }),
    });

    useEffect(() => {
        const el = scrollerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, waiting]);

    const submit = (text) => {
        const v = (text ?? draft).trim();
        if (!v || waiting) return;
        onSend(text);
    };

    const toggleMic = () => {
        if (listening) stop();
        else start();
    };

    return (
        <section
            className="sp-side relative overflow-hidden rounded-pane text-ink"
            style={{ background: LEFT_GRADIENT, isolation: 'isolate' }}
        >
            <FlyingLogos className="z-0" />

            <header
                className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between gap-3 px-9 py-7 max-[980px]:px-5 max-[980px]:py-5"
            >
                <Wordmark onReset={onReset} />
                <StatusPill />
            </header>

            <div
                className="relative z-10 w-full h-full flex flex-col box-border pt-[100px] px-9 pb-9 max-[980px]:pt-[84px] max-[980px]:px-5 max-[980px]:pb-5"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {!hasUserMsg ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="flex-1 flex flex-col justify-end items-start gap-6 pb-2"
                        >
                            <HeroEmptyState />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="transcript"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.25 }}
                            ref={scrollerRef}
                            className="flex-1 overflow-auto w-full flex flex-col gap-[18px] pb-4"
                            style={{ scrollBehavior: 'smooth' }}
                        >
                            {messages.map((m, i) => {
                                if (m.role === 'user') {
                                    return <UserBubble key={i} text={m.content} />;
                                }
                                if (m.role === 'tool') {
                                    return <ToolPill key={i} name={m.name} />;
                                }
                                return (
                                    <AssistantBubble
                                        key={i}
                                        text={m.content}
                                        finished={m.finished}
                                        loading={m.loading}
                                    />
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>

                {!hasUserMsg && (
                    <div className="flex flex-wrap gap-2 mt-[18px]">
                        {SUGGESTED.map((s) => (
                            <SuggestedChip
                                key={s}
                                label={s}
                                onClick={() => submit(s)}
                            />
                        ))}
                    </div>
                )}

                {audioPlaying && (
                    <button
                        type="button"
                        onClick={onStopAudio}
                        className="self-start inline-flex items-center gap-2 text-[12px] text-ink rounded-full cursor-pointer mt-3"
                        style={{
                            letterSpacing: '0.3px',
                            padding: '6px 12px',
                            background: 'rgba(253,246,232,0.7)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(184,90,58,0.55)',
                        }}
                    >
                        <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                            className="block w-1.5 h-1.5 rounded-full bg-accent"
                        />
                        Speaking — tap to stop
                    </button>
                )}

                <Composer
                    value={draft}
                    setValue={setDraft}
                    onSend={submit}
                    onReset={onReset}
                    disabled={waiting}
                    hasUserMsg={hasUserMsg}
                    listening={listening}
                    interim={interim}
                    onMicToggle={toggleMic}
                    micSupported={micSupported}
                />
            </div>
        </section>
    );
}
