import { memo } from "react";
import { motion } from "framer-motion";
import MarkdownTypewriter from "./MarkdownTypewriter";

const AssistantBubbleBase = ({ text, loading, finished }) => (
    <motion.div
        layout="position"
        initial={{ opacity: 0, scale: 0.95, x: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="self-start max-w-[90%] sm:max-w-[85%] flex flex-col gap-1"
    >
        <div className="text-[10px] uppercase tracking-widest text-ink-lighter ml-4 font-bold">Minime</div>
        <div
            className="bg-surfaceAlt px-6 py-4 rounded-4xl text-lg text-ink leading-relaxed shadow-sm border border-border-light"
        >
            {loading && !text ? (
                <div className="flex gap-2 py-2">
                    <span className="w-2 h-2 bg-ink-lighter rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-ink-lighter rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-ink-lighter rounded-full animate-bounce" />
                </div>
            ) : (
                <MarkdownTypewriter text={text} finished={finished} />
            )}
        </div>
    </motion.div>
);

export const AssistantBubble = memo(AssistantBubbleBase);

const UserBubbleBase = ({ text }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="self-end max-w-[90%] sm:max-w-[85%] flex flex-col items-end gap-1"
    >
        <div className="text-[10px] uppercase tracking-widest text-ink-lighter mr-4 font-bold">You</div>
        <div className="bg-ink text-surface px-6 py-4 rounded-4xl text-lg leading-relaxed shadow-md">
            {text}
        </div>
    </motion.div>
);

export const UserBubble = memo(UserBubbleBase);
