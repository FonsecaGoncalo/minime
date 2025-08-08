import {motion} from "framer-motion";
import MarkdownTypewriter from "./MarkdownTypewriter";

export const AssistantBubble = ({ id, text, loading }) => (
  <motion.div
    key={id}
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.25 }}
    className="self-start max-w-[75%] flex flex-col gap-1"
  >
    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl rounded-bl-sm text-sm text-white shadow-lg">
      {loading && !text ? (
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:0s]" />
          <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:0.2s]" />
          <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
      ) : (
        <MarkdownTypewriter text={text} />
      )}
    </div>
  </motion.div>
);

export const UserBubble = ({ id, text }) => (
  <motion.div
    key={id}
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.25 }}
    className="self-end max-w-[75%] flex flex-col gap-1"
  >
    <div className="inline-block bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 px-4 py-3 rounded-2xl rounded-br-sm text-sm text-white shadow-lg">
      {text}
    </div>
  </motion.div>
);