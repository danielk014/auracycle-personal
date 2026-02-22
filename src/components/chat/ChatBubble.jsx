import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function ChatBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-rose-400 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-gradient-to-br from-rose-400 to-rose-500 text-white rounded-br-md"
            : "bg-white border border-slate-100 text-slate-700 rounded-bl-md shadow-sm"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{message.content}</p>
        ) : (
          <ReactMarkdown
            className="text-sm leading-relaxed prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              p: ({ children }) => <p className="my-1">{children}</p>,
              ul: ({ children }) => <ul className="my-1 ml-3 list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="my-1 ml-3 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="my-0.5">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
}