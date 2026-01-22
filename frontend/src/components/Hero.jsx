import React, { useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import ChatInput from './ChatInput';
import SocialNetworkBadge from './SocialNetworkBadge';
import RollingPrompts from './RollingPrompts';
import { motion } from 'framer-motion';

const PROMPTS = [
    { label: "Pets", question: "Do you have any pets?" },
    { label: "Side Projects", question: "What’s a side project you’re proud of?" },
    { label: "Tech Stack", question: "What technologies have you worked with?" },
    { label: "Fun Fact", question: "Tell me something fun about yourself!" },
    { label: "Disaster Recovery", question: "How did you design your disaster recovery strategy?" },
    { label: "Modular Monolith", question: "How did you migrate a monolith into a modular monolith?" },
    { label: "EventBridge", question: "How have you used AWS EventBridge in production?" },
    { label: "AWS Runner Fleet", question: "How does your AWS Runner Fleet provision GitHub runners?" },
    { label: "Containish", question: "Why did you experiment with building 'containish'?" },
    { label: "Career", question: "Tell me about your career." },
    { label: "Travels", question: "Tell me about your trips." },
    { label: "LLMs", question: "Do you have experience with LLMs?" },
];

export default function Hero({ onSend, value, setValue, disabled, rightExtras, onResume }) {
    return (
        <div className="w-full h-[100svh] flex flex-col pt-4 pb-4 px-6 md:px-12 bg-transparent relative overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 -mt-10">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} // Heavy ease-out
                    className="text-center w-full max-w-[90vw]"
                >
                    <h1 className="font-sans font-medium text-[12vw] sm:text-[10vw] md:text-[9vw] lg:text-[8vw] leading-[0.9] tracking-tight text-ink mb-6 text-balance">
                        Gonçalo Fonseca
                    </h1>
                    <p className="max-w-xl mx-auto text-2xl sm:text-3xl text-ink-light leading-relaxed font-light mb-12">
                        Software Engineer
                    </p>
                </motion.div>

                <div className="w-full max-w-2xl relative z-20">
                    <ChatInput
                        landing
                        value={value}
                        setValue={setValue}
                        onSend={onSend}
                        disabled={!!disabled}
                        rightExtras={rightExtras}
                    />
                </div>
                <div className="mt-8 text-ink-lighter text-sm w-full">
                    <RollingPrompts
                        prompts={PROMPTS}
                        durationSec={120}
                        rows={1}
                        onSelect={(p) => onSend(p)}
                        className="w-full max-w-md mx-auto"
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, y: [0, 10, 0] }}
                    transition={{ opacity: { delay: 1, duration: 1 }, y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
                    className="absolute bottom-2 sm:bottom-8 text-ink"
                >
                    <ChevronDownIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                </motion.div>
            </div>

            {/* Ambient Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-brand-light/2 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-brand-light/2 rounded-full blur-[100px] pointer-events-none" />
        </div>
    );
}
