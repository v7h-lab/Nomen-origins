import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Sparkles, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onNameClick: (name: string) => void;
  isLoading: boolean;
}

// Renders inline markdown: **bold**, *italic*, [ClickableName]
const renderInline = (
  text: string,
  onNameClick: (name: string) => void,
  keyPrefix: string
): React.ReactNode[] => {
  // Step 1: Strip bold/italic wrapping around [Name] — e.g. **[Name]** → [Name]
  const cleaned = text.replace(/\*{1,2}\[([^\]]+)\]\*{1,2}/g, '[$1]');

  // Step 2: Split by [Name] FIRST (highest priority)
  const parts = cleaned.split(/(\[[^\]]+\])/g);

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;

    // [ClickableName]
    if (part.startsWith('[') && part.endsWith(']')) {
      const name = part.slice(1, -1);
      return (
        <button
          key={key}
          onClick={() => onNameClick(name)}
          className="inline-flex items-center px-2.5 py-1 mx-0.5 my-0.5 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:text-indigo-900 font-semibold transition-colors text-[12px] border border-indigo-200 cursor-pointer"
        >
          {name}
        </button>
      );
    }

    // Step 3: For non-name parts, handle **bold** and *italic*
    const inlineParts = part.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return (
      <span key={key}>
        {inlineParts.map((inline, j) => {
          const iKey = `${key}-${j}`;
          if (inline.startsWith('**') && inline.endsWith('**')) {
            return <strong key={iKey} className="font-semibold text-slate-800">{inline.slice(2, -2)}</strong>;
          }
          if (inline.startsWith('*') && inline.endsWith('*') && !inline.startsWith('**')) {
            return <em key={iKey} className="italic text-slate-600">{inline.slice(1, -1)}</em>;
          }
          return <span key={iKey}>{inline}</span>;
        })}
      </span>
    );
  });
};

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

  // Renders full markdown: headings, lists, paragraphs with inline formatting
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let lineIndex = 0;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${lineIndex}`} className="space-y-1.5 my-2 pl-1">
            {listItems}
          </ul>
        );
        listItems = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      lineIndex = i;
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines (but flush lists)
      if (!trimmed) {
        flushList();
        continue;
      }

      // ### Heading 3
      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h4 key={`h3-${i}`} className="font-bold text-slate-800 text-[13px] mt-3 mb-1 uppercase tracking-wide border-b border-slate-100 pb-1">
            {trimmed.slice(4)}
          </h4>
        );
        continue;
      }

      // ## Heading 2
      if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h3 key={`h2-${i}`} className="font-bold text-slate-800 text-sm mt-3 mb-1">
            {trimmed.slice(3)}
          </h3>
        );
        continue;
      }

      // # Heading 1
      if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(
          <h2 key={`h1-${i}`} className="font-bold text-slate-900 text-base mt-2 mb-1">
            {trimmed.slice(2)}
          </h2>
        );
        continue;
      }

      // Bullet list items: *, -, or numbered (1.)
      const bulletMatch = trimmed.match(/^[\*\-]\s+(.*)/) || trimmed.match(/^\d+\.\s+(.*)/);
      if (bulletMatch) {
        const content = bulletMatch[1];
        listItems.push(
          <li key={`li-${i}`} className="flex gap-2 text-[13px] leading-relaxed">
            <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
            <span>{renderInline(content, onNameClick, `li-${i}`)}</span>
          </li>
        );
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={`p-${i}`} className="text-[13px] leading-relaxed my-1">
          {renderInline(trimmed, onNameClick, `p-${i}`)}
        </p>
      );
    }

    flushList();
    return elements;
  };

  // Simple inline render for user messages (just [Name] links)
  const renderUserText = (text: string) => {
    const parts = text.split(/(\[.*?\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const name = part.slice(1, -1);
        return (
          <button
            key={i}
            onClick={() => onNameClick(name)}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md bg-white/20 text-white font-medium transition-colors text-sm"
          >
            {name}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4">
             <Sparkles className="h-8 w-8 text-indigo-300 mb-4" />
             <p className="font-medium text-slate-700 mb-2">How can I help you?</p>
             <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
               Try "Show me 5 French names that mean light" or "Ancient Greek warrior names"
             </p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-2xl max-w-[90%] shadow-sm
              ${msg.role === 'user' 
                ? 'bg-slate-800 text-slate-100 rounded-tr-none p-3.5 text-sm' 
                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none p-4'}`}>
              {msg.role === 'user' ? renderUserText(msg.text) : renderMarkdown(msg.text)}
            </div>
          </div>
        ))}
        
        {isLoading && (
           <div className="flex justify-start">
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