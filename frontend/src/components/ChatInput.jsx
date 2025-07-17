import {PaperAirplaneIcon} from '@heroicons/react/24/outline';

export default function ChatInput({landing, value, setValue, onSend, disabled}) {
    const shell = `
      h-14 bg-neutral-900/30 backdrop-blur rounded-xl flex items-center
      border border-neutral-800
      px-4 transition-all duration-500
      touch-manipulation
    `;


    const center = 'w-80 sm:w-96 md:w-[520px]';
    /* Sticky keeps the bar just above the keyboard; no position:fixed needed. */
    const dock = `
      w-full max-w-screen-md sticky bottom-[calc(env(safe-area-inset-bottom)+0.5rem)]
      left-0 self-center px-4 mb-2
    `;

    return (
        <div className={`${shell} ${landing ? center : dock}`}>
            <input
                className={`flex-1 bg-transparent text-base text-white caret-gray-200 placeholder:text-gray-400 outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                className={`p-2 -m-2 text-gray-300 hover:text-white active:scale-95 transition-transform ${disabled ? 'opacity-50 cursor-not-allowed hover:text-gray-300 active:scale-100' : ''}`}
                onClick={!disabled ? () => onSend() : undefined}
                disabled={disabled}
            >
                <PaperAirplaneIcon className="h-5 w-5 stroke-2"/>
            </button>
        </div>
    );
}
