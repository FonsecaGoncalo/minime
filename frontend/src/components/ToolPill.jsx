import { memo } from 'react';
import { motion } from 'framer-motion';

const TOOL_LABELS = {
    search_docs: 'Searched knowledge base',
    schedule_meeting: 'Scheduled meeting',
    update_user_info: 'Updated profile',
    get_current_time: 'Checked current time',
    convert_time: 'Converted timezone',
};

const Icon = ({ name }) => {
    const common = {
        width: 13,
        height: 13,
        viewBox: '0 0 16 16',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
    };

    if (name === 'search_docs') {
        return (
            <svg {...common}>
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5L14 14" />
            </svg>
        );
    }
    if (name === 'schedule_meeting') {
        return (
            <svg {...common}>
                <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
                <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
            </svg>
        );
    }
    if (name === 'update_user_info') {
        return (
            <svg {...common}>
                <circle cx="8" cy="6" r="2.5" />
                <path d="M3 13.5c.8-2.5 2.8-4 5-4s4.2 1.5 5 4" />
            </svg>
        );
    }
    if (name === 'get_current_time' || name === 'convert_time') {
        return (
            <svg {...common}>
                <circle cx="8" cy="8" r="5.5" />
                <path d="M8 5v3l2 1.5" />
            </svg>
        );
    }
    return (
        <svg {...common}>
            <circle cx="8" cy="8" r="1.2" fill="currentColor" />
            <circle cx="3.5" cy="8" r="1.2" fill="currentColor" />
            <circle cx="12.5" cy="8" r="1.2" fill="currentColor" />
        </svg>
    );
};

const ToolPillBase = ({ name }) => {
    const label = TOOL_LABELS[name] || name;
    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex gap-3.5 items-center max-w-full"
        >
            <span
                aria-hidden="true"
                className="flex-shrink-0 inline-block w-8"
            />
            <span
                className="inline-flex items-center gap-2 text-[12px] text-ink-soft rounded-full whitespace-nowrap leading-none"
                style={{
                    letterSpacing: '0.3px',
                    padding: '6px 11px',
                    background: 'rgba(253,246,232,0.55)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(28,24,21,0.14)',
                }}
            >
                <Icon name={name} />
                {label}
            </span>
        </motion.div>
    );
};

export const ToolPill = memo(ToolPillBase);
