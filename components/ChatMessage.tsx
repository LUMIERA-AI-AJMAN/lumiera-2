
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Role } from '../types';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex gap-3 px-6 py-4 animate-soft-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-rose-600 opacity-[0.6]`}>
          <Bot size={18} className="text-[#e3e3e3]" />
        </div>
      )}
      <div className={`flex-1 max-w-[90%] md:max-w-[70%] lg:max-w-[60%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Removed explicit message background to make it "float" on main background */}
        <div className={`relative px-4 py-2 rounded-xl text-sm sm:text-base text-[#e3e3e3]`}>
          {isUser ? (
            <p className="text-[#e3e3e3]">{message.content}</p>
          ) : (
            <>
              {message.content && message.content.trim() !== '' && (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
              {message.imageParts && message.imageParts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {message.imageParts.map((imagePart, index) => (
                    <img
                      key={index}
                      src={`data:${imagePart.mimeType};base64,${imagePart.data}`}
                      alt={`Generated image ${index + 1}`}
                      className="max-w-full h-auto rounded-xl shadow-md border border-[#282829] my-2"
                    />
                  ))}
                </div>
              )}
              {isStreaming && (
                <span className="animate-pulse text-[#9ca3af] text-xs ml-2">_</span>
              )}
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-[#9ca3af] mono">
          {new Date(message.timestamp).toLocaleTimeString()}
          {isStreaming && ' (streaming...)'}
        </p>
      </div>
      {isUser && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-indigo-600 opacity-[0.6]`}>
          <User size={18} className="text-[#e3e3e3]" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;