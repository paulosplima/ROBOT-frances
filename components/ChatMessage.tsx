
import React from 'react';
import { Message } from '../types.ts';
import { Play } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  onPlayAudio: (text: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onPlayAudio }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex w-full mb-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
        <div 
          className={`px-4 py-3 rounded-2xl shadow-sm relative group ${
            isAssistant 
              ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100' 
              : 'bg-indigo-600 text-white rounded-tr-none'
          }`}
        >
          <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          
          {isAssistant && (
            <button 
              onClick={() => onPlayAudio(message.content)}
              className="mt-2 flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 transition-colors font-medium"
            >
              <Play size={12} fill="currentColor" />
              Écouter (Ouvir)
            </button>
          )}
        </div>
        
        <span className="text-[10px] text-slate-400 mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
