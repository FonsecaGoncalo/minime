import {memo} from "react";
import {motion} from "framer-motion";
import MarkdownTypewriter from "./MarkdownTypewriter";

const AssistantBubbleBase = ({text, loading, finished}) => (
    <motion.div
        layout="position"
        initial={{opacity: 0, scale: 0.98}}
        animate={{opacity: 1, scale: 1}}
        transition={{duration: 0.18}}
        className="self-start max-w-[75%] flex flex-col gap-1"
    >
        <div
            className="bg-white/90 backdrop-blur border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm text-sm text-gray-800 shadow-sm">
            {loading && !text ? (
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0s]"/>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"/>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"/>
                </div>
            ) : (
                <MarkdownTypewriter text={text} finished={finished}/>
            )}
        </div>
    </motion.div>
);

export const AssistantBubble = memo(AssistantBubbleBase);

const UserBubbleBase = ({text}) => (
    <motion.div
        layout
        initial={{opacity: 0, scale: 0.98}}
        animate={{opacity: 1, scale: 1}}
        transition={{duration: 0.2}}
        className="self-end max-w-[75%] flex flex-col gap-1"
    >
        <div className="inline-block bg-brand text-white px-4 py-3 rounded-2xl rounded-br-sm text-sm shadow-sm">
            {text}
        </div>
    </motion.div>
);

export const UserBubble = memo(UserBubbleBase);
