import {PaperAirplaneIcon} from '@heroicons/react/24/outline';

export default function ChatInput({landing, value, setValue, onSend, disabled, rightExtras}) {
    const shell = `
    ${landing ? 'h-16 rounded-2xl shadow-md' : 'h-14 rounded-xl shadow-sm'}
    bg-surface/90 backdrop-blur flex items-center
    border border-borderWarm
    px-4 transition-all duration-500
    touch-manipulation
  `;

    const center = 'w-80 sm:w-96 md:w-[520px]';

    if (landing) {
        return (
            <div className={`${shell} ${center}`}>
                <input
                    className={`flex-1 bg-transparent text-base text-ink caret-gray-700 placeholder:text-muted outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Ask me anything"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => !disabled && e.key === 'Enter' && onSend()}
                    autoComplete="off"
                    enterKeyHint="send"
                    disabled={disabled}
                />
                <button
                    aria-label="Send"
                    className={`p-2 -m-2 text-brand hover:opacity-90 active:scale-95 transition-transform ${disabled ? 'opacity-50 cursor-not-allowed hover:opacity-50 active:scale-100' : ''}`}
                    onClick={!disabled ? () => onSend() : undefined}
                    disabled={disabled}
                >
                    <PaperAirplaneIcon className="h-5 w-5 stroke-2"/>
                </button>
                {rightExtras && (
                  <div className="flex items-center gap-2 pl-2">
                    {rightExtras}
                  </div>
                )}
            </div>
        );
    }

    return (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] w-full z-10 mb-2">
            <div className="max-w-screen-md mx-auto px-3 sm:px-0">
                <div className={shell}>
                    <input
                        className={`flex-1 bg-transparent text-base text-ink caret-gray-700 placeholder:text-muted outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder="Ask me anything"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => !disabled && e.key === 'Enter' && onSend()}
                        autoComplete="off"
                        enterKeyHint="send"
                        disabled={disabled}
                    />
                    <button
                        aria-label="Send"
                        className={`p-2 -m-2 text-brand hover:opacity-90 active:scale-95 transition-transform ${disabled ? 'opacity-50 cursor-not-allowed hover:opacity-50 active:scale-100' : ''}`}
                        onClick={!disabled ? () => onSend() : undefined}
                        disabled={disabled}
                    >
                        <PaperAirplaneIcon className="h-5 w-5 stroke-2"/>
                    </button>
                    {rightExtras && (
                      <div className="flex items-center gap-2 pl-2">
                        {rightExtras}
                      </div>
                    )}
                </div>
            </div>
        </div>
    );
}
