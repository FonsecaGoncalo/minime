import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function ChatInput({ landing, value, setValue, onSend, disabled, rightExtras, variant }) {
    const isCli = variant === 'cli';

    // Antigravity Landing Shell: Massive Pill
    const landingShell = `
        h-14 sm:h-16 rounded-pill shadow-lg shadow-black/5
        bg-white border border-transparent
        flex items-center px-6 transition-all duration-300
        focus-within:ring-2 focus-within:ring-brand-DEFAULT focus-within:border-transparent
        hover:shadow-xl hover:shadow-black/10 hover:-translate-y-0.5
    `;

    // Standard Chat Shell: Clean Pill
    const chatShell = isCli
        ? `h-14 bg-transparent flex items-center border-t border-border-DEFAULT px-3 font-mono`
        : `
        h-14 rounded-pill shadow-sm
        bg-surface border border-border-light
        flex items-center
        px-6 transition-all duration-300
        focus-within:border-brand-DEFAULT focus-within:ring-1 focus-within:ring-brand-DEFAULT
    `;

    const center = 'w-full max-w-2xl';

    if (landing && !isCli) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={`${landingShell} ${center}`}
            >
                <input
                    className={`flex-1 bg-transparent text-lg sm:text-xl text-ink font-normal placeholder:text-ink-lighter outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Ask me anything..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => !disabled && e.key === 'Enter' && onSend()}
                    autoComplete="off"
                    enterKeyHint="send"
                    disabled={disabled}
                    autoFocus
                />
                <button
                    aria-label="Send"
                    className={`
                        p-2 ml-2 rounded-full text-white bg-brand-DEFAULT 
                        hover:bg-brand-light hover:shadow-md
                        active:scale-95 transition-all duration-200
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={!disabled ? () => onSend() : undefined}
                    disabled={disabled}
                >
                    <PaperAirplaneIcon className="h-5 w-5 stroke-[2]" />
                </button>
                {rightExtras && (
                    <div className="flex items-center gap-2 pl-4 border-l border-border-DEFAULT ml-4">
                        {rightExtras}
                    </div>
                )}
            </motion.div>
        );
    }

    return (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] w-full z-20 mb-6 px-4">
            <div className="max-w-3xl mx-auto">
                <div className={chatShell}>
                    {isCli && (
                        <span className="text-brand-DEFAULT font-bold mr-3 select-none text-sm">visitor@gfonseca:~$</span>
                    )}
                    <input
                        className={`flex-1 bg-transparent ${isCli ? 'text-sm font-mono' : 'text-lg'} text-ink caret-brand-DEFAULT placeholder:text-ink-lighter outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder={isCli ? "type a command…" : "Ask a follow-up..."}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => !disabled && e.key === 'Enter' && onSend()}
                        autoComplete="off"
                        enterKeyHint="send"
                        disabled={disabled}
                    />
                    {!isCli && (
                        <button
                            aria-label="Send"
                            className={`p-2 text-ink-light hover:bg-accent rounded-full transition-colors ${disabled ? 'opacity-50' : ''}`}
                            onClick={!disabled ? () => onSend() : undefined}
                            disabled={disabled}
                        >
                            <PaperAirplaneIcon className="h-5 w-5 stroke-2" />
                        </button>
                    )}
                    {rightExtras && (
                        <div className="flex items-center gap-2 pl-2 border-l border-border-DEFAULT ml-2">
                            {rightExtras}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
