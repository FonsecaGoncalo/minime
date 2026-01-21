import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLongRightIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const getRandomPrompts = (allPrompts, count = 3) => {
    if (!allPrompts || allPrompts.length === 0) return [];
    const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

export default function RollingPrompts({ prompts, onSelect, className = '' }) {
    const [displayPrompts, setDisplayPrompts] = useState(() => getRandomPrompts(prompts, 3));
    const [key, setKey] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setDisplayPrompts(getRandomPrompts(prompts, 3));
            setKey(k => k + 1);
        }, 6000);

        return () => clearInterval(intervalId);
    }, [prompts]);

    return (
        <div className={`w-full flex flex-col items-center justify-center gap-3 h-[60px] ${className}`}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: "easeInOut", staggerChildren: 0.1 }}
                    className="flex flex-nowrap items-center justify-center gap-2 sm:gap-3 px-4 w-full overflow-x-auto no-scrollbar scroll-smooth"
                >
                    {displayPrompts.map((p, i) => (
                        <motion.button
                            key={`${key}-${i}`}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.1 }}
                            onClick={() => onSelect && onSelect(p.question)}
                            className="
                                group relative flex items-center gap-2
                                px-4 py-2
                                rounded-full border border-border-light bg-surface/50 backdrop-blur-sm
                                text-xs sm:text-sm font-medium text-ink-light
                                transition-all duration-300 ease-out
                                hover:bg-white hover:border-brand-light hover:shadow-lg hover:shadow-brand-light/10
                                hover:-translate-y-0.5 hover:text-ink
                                active:scale-95
                                whitespace-nowrap flex-shrink-0
                            "
                        >
                            <span>{p.label}</span>
                            <ArrowLongRightIcon
                                className="w-3.5 h-3.5 text-ink-lighter opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex-shrink-0"
                            />
                        </motion.button>
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
