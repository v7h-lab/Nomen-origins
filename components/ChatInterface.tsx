import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onNameClick: (name: string) => void;
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, onNameClick, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  // Function to parse text and make [Name] clickable
  const renderMessageText = (text: string) => {
    const parts = text.split(/(\[.*?\])/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const name = part.slice(1, -1);
        return (
          <button
            key={index}
            onClick={() => onNameClick(name)}
            className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:text-indigo-900 font-medium transition-colors text-sm -mb-0.5"
          >
            {name}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="h-full flex flex-col bg-white/90 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden animate-in slide-in-from-left-4 fade-in duration-500">
      
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-slate-800 text-sm">Discovery Assistant</h3>
          <p className="text-xs text-slate-500">Ask for names by meaning, origin, or culture</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4">
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm transform -rotate-6">
                <Bot className="h-6 w-6 text-indigo-400" />
             </div>
             <p className="font-medium text-slate-700 mb-2">How can I help you?</p>
             <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
               Try "Show me 5 French names that mean light" or "Ancient Greek warrior names"
             </p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
              ${msg.role === 'user' ? 'bg-slate-200 text-slate-500' : 'bg-indigo-100 text-indigo-600'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`rounded-2xl p-3.5 max-w-[85%] text-sm leading-relaxed shadow-sm whitespace-pre-wrap
              ${msg.role === 'user' 
                ? 'bg-slate-800 text-slate-100 rounded-tr-none' 
                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
              {renderMessageText(msg.text)}
            </div>
          </div>
        ))}
        
        {isLoading && (
           <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
               <Bot className="w-4 h-4" />
             </div>
             <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-xs text-slate-400 font-medium">Thinking...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask about names..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;