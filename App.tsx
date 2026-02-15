import React, { useState, useEffect } from 'react';
import InfoPanel from './components/InfoPanel';
import MapVisualizer from './components/MapVisualizer';
import ChatInterface from './components/ChatInterface';
import LoadingPanel from './components/LoadingPanel';
import { EtymologyData, SearchState, ChatMessage } from './types';
import { fetchEtymology, fetchChatResponse } from './services/geminiService';
import { Compass, Search, Loader2 } from 'lucide-react';

// Intent detection: determines if input is a name search or a discovery query
const detectIntent = (input: string): 'name' | 'discovery' => {
  const trimmed = input.trim();
  const words = trimmed.split(/\s+/);
  const hasQuestionMark = trimmed.includes('?');
  const discoveryKeywords = /^(show|find|tell|give|what|which|how|list|suggest|can|are|is|do|name|names|any|recommend)/i;
  const firstWord = words[0] || '';

  // If it's 1-2 words, no question mark, and doesn't start with a discovery keyword → name
  if (words.length <= 2 && !hasQuestionMark && !discoveryKeywords.test(firstWord)) {
    return 'name';
  }
  // 3 words could still be a name like "Mary Jane Watson"
  if (words.length === 3 && !hasQuestionMark && !discoveryKeywords.test(firstWord)) {
    return 'name';
  }
  return 'discovery';
};

const App: React.FC = () => {
  const [state, setState] = useState<SearchState>({
    query: '',
    isLoading: false,
    error: null,
    data: null,
  });

  const [selectedLocationIndex, setSelectedLocationIndex] = useState<number | null>(null);
  const [isTouring, setIsTouring] = useState(false);
  const [omniInput, setOmniInput] = useState('');

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Combined Tour Timer & Voice Logic
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const synth = window.speechSynthesis;

    if (isTouring && state.data) {
      let textToSpeak = '';
      let minDuration = 0;

      if (selectedLocationIndex === -1) {
        textToSpeak = `${state.data.name}. ${state.data.meaning}. Here is its journey.`;
        minDuration = 0;
      } else if (selectedLocationIndex !== null && state.data.locations[selectedLocationIndex]) {
        const loc = state.data.locations[selectedLocationIndex];
        textToSpeak = `${loc.name}. ${loc.significance}`;
        minDuration = 8000;
      }

      if (textToSpeak) {
        let isTimeUp = false;
        let isSpeechDone = false;

        const attemptNextStep = () => {
          if (isTimeUp && isSpeechDone) {
            if (selectedLocationIndex === -1) {
              setSelectedLocationIndex(0);
            } else if (selectedLocationIndex !== null) {
              const nextIndex = selectedLocationIndex + 1;
              if (nextIndex < state.data!.locations.length) {
                setSelectedLocationIndex(nextIndex);
              } else {
                setIsTouring(false);
                setSelectedLocationIndex(null);
              }
            }
          }
        };

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        const voices = synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English')) ||
          voices.find(v => v.name.includes('Samantha')) ||
          voices.find(v => v.lang.startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => {
          isSpeechDone = true;
          attemptNextStep();
        };

        utterance.onerror = () => {
          isSpeechDone = true;
          attemptNextStep();
        };

        if (minDuration > 0) {
          timeoutId = setTimeout(() => {
            isTimeUp = true;
            attemptNextStep();
          }, minDuration);
        } else {
          isTimeUp = true;
        }

        synth.cancel();
        synth.speak(utterance);
      }

    } else if (!isTouring) {
      if (synth.speaking || synth.pending) {
        synth.cancel();
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      synth.cancel();
    };
  }, [isTouring, selectedLocationIndex, state.data]);


  const handleSearch = async (name: string) => {
    setIsTouring(false);
    window.speechSynthesis.cancel();
    setShowChat(false);

    const searchName = name.trim();
    if (searchName) {
      setChatMessages(prev => [
        ...prev,
        { role: 'user', text: `Explore [${searchName}]` },
        { role: 'model', text: `I have analyzed the origins and history of [${searchName}].` }
      ]);
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, query: name }));
    setSelectedLocationIndex(null);

    try {
      const data = await fetchEtymology(name);
      setState({
        query: name,
        isLoading: false,
        error: null,
        data: data,
      });
    } catch (error) {
      console.error(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "Could not trace the history of this name. Please try another.",
        data: null
      }));
    }
  };

  const handleChatMessage = async (text: string) => {
    setIsChatLoading(true);
    setShowChat(true);
    const newMessages = [...chatMessages, { role: 'user', text } as ChatMessage];
    setChatMessages(newMessages);

    try {
      const historyForApi = chatMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await fetchChatResponse(historyForApi, text);

      setChatMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Unified omnibar submit handler
  const handleOmniSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = omniInput.trim();
    if (!trimmed) return;

    const intent = detectIntent(trimmed);
    setOmniInput('');

    if (intent === 'name') {
      handleSearch(trimmed);
    } else {
      handleChatMessage(trimmed);
    }
  };

  const handleLocationSelect = (index: number | null) => {
    setIsTouring(false);
    setSelectedLocationIndex(index);
  };

  const handleToggleTour = () => {
    if (isTouring) {
      setIsTouring(false);
      setSelectedLocationIndex(null);
    } else {
      if (state.data?.locations.length) {
        setIsTouring(true);
        setSelectedLocationIndex(-1);
      }
    }
  };

  const handleBackToHome = () => {
    setIsTouring(false);
    window.speechSynthesis.cancel();
    setState(prev => ({ ...prev, data: null, error: null }));
    setShowChat(false);
  };

  const handleBackToChat = () => {
    setIsTouring(false);
    window.speechSynthesis.cancel();
    setState(prev => ({ ...prev, data: null, error: null }));
    setShowChat(true);
  };

  // Whether we're in the "default" home state (no sidebar content)
  const isHome = !state.isLoading && !state.data && !state.error && !showChat;
  const isLoading = state.isLoading;
  const isProcessing = isLoading || isChatLoading;

  // Render logic for the sidebar content
  const renderSidebarContent = () => {
    if (state.isLoading) {
      return <LoadingPanel />;
    }

    if (state.data || state.error) {
      return (
        <InfoPanel
          data={state.data}
          error={state.error}
          selectedLocationIndex={selectedLocationIndex}
          onSelectLocation={handleLocationSelect}
          isTouring={isTouring}
          onToggleTour={handleToggleTour}
          onRelatedNameClick={handleSearch}
          onBack={chatMessages.length > 0 ? handleBackToChat : handleBackToHome}
        />
      );
    }

    if (showChat) {
      return (
        <ChatInterface
          messages={chatMessages}
          onSendMessage={handleChatMessage}
          onNameClick={handleSearch}
          isLoading={isChatLoading}
        />
      );
    }

    return null;
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">

      {/* Sidebar / Overlay Container */}
      <div className={`absolute top-0 left-0 w-full h-full pointer-events-none z-[500] flex flex-col ${isHome ? 'items-center justify-center' : 'md:w-[480px]'}`}>

        {/* Header Area — always visible */}
        <div className={`pointer-events-auto ${isHome ? 'w-full max-w-lg mx-auto p-6 md:p-10 pt-8 md:pt-16' : 'p-4 md:p-6 bg-gradient-to-b from-slate-50/90 to-transparent md:bg-none'}`}>
          <div className={`flex items-center gap-3 ${isHome ? 'justify-center mb-8' : 'mb-6'}`}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Compass className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-slate-900 leading-none">Nomen Origins</h1>
              <span className="text-xs text-slate-500 font-medium tracking-wide">STORY BEHIND THE NAME</span>
            </div>
          </div>

          {/* Omnibar */}
          <form onSubmit={handleOmniSubmit} className="relative group w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              {isProcessing ? (
                <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
              ) : (
                <Search className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
              )}
            </div>
            <input
              type="text"
              value={omniInput}
              onChange={(e) => setOmniInput(e.target.value)}
              disabled={isProcessing}
              className="block w-full pl-12 pr-24 py-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg 
                         text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 
                         transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
              placeholder={isHome ? "Search a name or ask a question..." : "Search another name or ask..."}
            />
            <button
              type="submit"
              disabled={isProcessing || !omniInput.trim()}
              className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl 
                         text-sm font-medium transition-colors disabled:opacity-0 disabled:pointer-events-none"
            >
              Explore
            </button>
          </form>

          {/* Hint text on default page */}
          {isHome && (
            <p className="text-center text-xs text-slate-400 mt-3">
              Try <button onClick={() => { setOmniInput('Sophia'); }} className="text-indigo-500 hover:text-indigo-700 font-medium">Sophia</button>
              {' · '}
              <button onClick={() => { setOmniInput('Ancient Greek warrior names'); }} className="text-indigo-500 hover:text-indigo-700 font-medium">Ancient Greek warrior names</button>
            </p>
          )}
        </div>

        {/* Content Area — hidden when on default home page */}
        {!isHome && (
          <div className="flex-1 p-4 md:p-6 md:pt-0 overflow-hidden pointer-events-auto pb-6 md:pb-6">
            {renderSidebarContent()}
          </div>
        )}
      </div>

      {/* Map Background */}
      <div className="w-full h-full absolute inset-0 md:relative md:inset-auto flex-1">
        <MapVisualizer
          locations={state.data?.locations || []}
          selectedLocationIndex={selectedLocationIndex}
          onSelectLocation={handleLocationSelect}
        />
        {/* Fade overlay on default page to improve omnibar readability */}
        {isHome && (
          <div className="absolute inset-0 bg-white/60 pointer-events-none z-[1]" />
        )}
      </div>

    </div>
  );
};

export default App;