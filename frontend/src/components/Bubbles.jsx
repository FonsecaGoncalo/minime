import { memo } from "react";
import { motion } from "framer-motion";
import MarkdownTypewriter from "./MarkdownTypewriter";

const Avatar = () => (
    <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-ink text-cream font-serif italic text-[19px] leading-none mt-0.5">
        <span style={{ display: 'block', transform: 'translateY(-2px)' }}>g</span>
    </span>
);

const TypingDots = () => (
    <span className="inline-flex items-center gap-[5px] pt-3">
        <span className="block w-1.5 h-1.5 rounded-full bg-accent typing-dot" />
        <span className="block w-1.5 h-1.5 rounded-full bg-accent typing-dot" style={{ animationDelay: '0.15s' }} />
        <span className="block w-1.5 h-1.5 rounded-full bg-accent typing-dot" style={{ animationDelay: '0.3s' }} />
    </span>
);

const AssistantBubbleBase = ({ text, loading, finished }) => (
    <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex gap-3.5 items-start max-w-full"
    >
        <Avatar />
        <div
            className="text-ink font-sans text-base leading-[1.6] pt-1 break-words"
            style={{ maxWidth: 'calc(100% - 60px)' }}
        >
            {loading && !text ? (
                <TypingDots />
            ) : (
                <MarkdownTypewriter text={text} finished={finished} />
            )}
        </div>
    </motion.div>
);

export const AssistantBubble = memo(AssistantBubbleBase);

const UserBubbleBase = ({ text }) => (
    <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex justify-end"
    >
        <div
            className="bg-ink text-cream px-[18px] py-[11px] text-[15px] leading-[1.5] font-medium"
            style={{ borderRadius: 20, borderBottomRightRadius: 6, maxWidth: '78%' }}
        >
            {text}
        </div>
    </motion.div>
);

export const UserBubble = memo(UserBubbleBase);
