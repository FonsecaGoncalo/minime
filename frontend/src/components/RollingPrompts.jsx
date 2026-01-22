import React, { useState, useEffect } from 'react';
import { ArrowLongRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export default function RollingPrompts({ prompts, onSelect, className = '' }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!prompts || prompts.length === 0) return;

        const intervalId = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % prompts.length);
        }, 3500);

        return () => clearInterval(intervalId);
    }, [prompts]);

    if (!prompts || prompts.length === 0) return null;

    const currentPrompt = prompts[currentIndex];

    return (
        <div className={`flex justify-center w-full ${className}`}>
            <motion.button
                layout
                onClick={() => onSelect && onSelect(currentPrompt.question)}
                className="group flex items-center gap-2.5 px-5 py-2.5 bg-brand-light/5 border border-ink-lighter/10 rounded-full hover:bg-brand-light/10 transition-colors cursor-pointer select-none"
            >
                <SparklesIcon className="w-4 h-4 text-brand-DEFAULT/70 group-hover:text-brand-DEFAULT transition-colors flex-shrink-0" />

                <div className="relative overflow-hidden h-6 min-w-[10px]">
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                            key={currentPrompt.label}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="block text-sm sm:text-base font-medium text-ink/80 group-hover:text-ink whitespace-nowrap"
                        >
                            {currentPrompt.label}
                        </motion.span>
                    </AnimatePresence>
                </div>

                <ArrowLongRightIcon className="w-4 h-4 text-ink-lighter/40 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex-shrink-0" />
            </motion.button>
        </div>
    );
}
