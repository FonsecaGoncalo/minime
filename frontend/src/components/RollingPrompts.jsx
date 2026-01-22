import React, { useState, useEffect } from 'react';
import { ArrowLongRightIcon } from '@heroicons/react/24/outline';
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
        <div className={`flex items-center justify-center gap-3 ${className}`}>
            <div
                onClick={() => onSelect && onSelect(currentPrompt.question)}
                className="group flex items-center gap-3 cursor-pointer select-none"
            >
                <span className="text-ink-lighter/60 text-base sm:text-lg font-light transition-colors group-hover:text-ink-light">
                    Ask me about
                </span>

                <div className="relative h-7 sm:h-8 overflow-hidden min-w-[120px]">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={currentPrompt.label}
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -30, opacity: 0 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 flex items-center text-base sm:text-lg font-medium text-ink group-hover:text-brand-DEFAULT transition-colors"
                        >
                            {currentPrompt.label}
                        </motion.span>
                    </AnimatePresence>
                </div>

                <ArrowLongRightIcon className="w-5 h-5 text-ink-lighter/40 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
        </div>
    );
}
