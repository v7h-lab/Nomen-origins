import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import InfoPanel from './components/InfoPanel';
import MapVisualizer from './components/MapVisualizer';
import ChatInterface from './components/ChatInterface';
import LoadingPanel from './components/LoadingPanel';
import { EtymologyData, SearchState, ChatMessage } from './types';
import { fetchEtymology, fetchChatResponse } from './services/geminiService';
import { Compass } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<SearchState>({
    query: '',
    isLoading: false,
    error: null,
    data: null,
  });

  const [selectedLocationIndex, setSelectedLocationIndex] = useState<number | null>(null);
  const [isTouring, setIsTouring] = useState(false);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Combined Tour Timer & Voice Logic
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const synth = window.speechSynthesis;

    // Only run if touring and we have data
    if (isTouring && state.data) {
      
      let textToSpeak = '';
      let minDuration = 0;

      // Logic for Intro vs Locations
      if (selectedLocationIndex === -1) {
          // Intro Phase: Read Name and Meaning
          textToSpeak = `${state.data.name}. ${state.data.meaning}. Here is its journey.`;
          minDuration = 0; // Advance as soon as speech is done
      } else if (selectedLocationIndex !== null && state.data.locations[selectedLocationIndex]) {
          // Location Phase
          const loc = state.data.locations[selectedLocationIndex];
          textToSpeak = `${loc.name}. ${loc.significance}`;
          minDuration = 8000; // Minimum 8s dwell time for locations
      }

      if (textToSpeak) {
        // Flags to synchronize speech and timer
        let isTimeUp = false;
        let isSpeechDone = false;

        const attemptNextStep = () => {
            if (isTimeUp && isSpeechDone) {
                if (selectedLocationIndex === -1) {
                    // Intro done -> Go to first location
                    setSelectedLocationIndex(0);
                } else if (selectedLocationIndex !== null) {
                    const nextIndex = selectedLocationIndex + 1;
                    if (nextIndex < state.data!.locations.length) {
                        setSelectedLocationIndex(nextIndex);
                    } else {
                        // Tour finished
                        setIsTouring(false);
                        setSelectedLocationIndex(null);
                    }
                }
            }
        };

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.9; // Slightly slower for more natural pacing
        utterance.pitch = 1.0;
        
        // Try to get a pleasant English voice
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
            // If speech fails, mark as done so we don't get stuck
            isSpeechDone = true;
            attemptNextStep();
        };

        // Timer Logic
        if (minDuration > 0) {
            timeoutId = setTimeout(() => {
                isTimeUp = true;
                attemptNextStep();
            }, minDuration);
        } else {
            isTimeUp = true;
        }

        // Start Speaking
        synth.cancel(); // Stop any previous speech
        synth.speak(utterance);
      }

    } else if (!isTouring) {
        // If not touring, ensure we stop talking
        if (synth.speaking || synth.pending) {
            synth.cancel();
        }
    }

    // Cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      synth.cancel();
    };
  }, [isTouring, selectedLocationIndex, state.data]);


  const handleSearch = async (name: string) => {
    setIsTouring(false);
    window.speechSynthesis.cancel();
    
    // Unified History: Add the search to the chat history so there is a record of it
    // when the user navigates back.
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
    const newMessages = [...chatMessages, { role: 'user', text } as ChatMessage];
    setChatMessages(newMessages);

    try {
      // Format history for Gemini API (Needs strict role/parts structure)
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

  const handleLocationSelect = (index: number | null) => {
    setIsTouring(false); // Stop tour on manual interaction
    setSelectedLocationIndex(index);
  };

  const handleToggleTour = () => {
    if (isTouring) {
        setIsTouring(false);
        setSelectedLocationIndex(null);
    } else {
        if (state.data?.locations.length) {
            setIsTouring(true);
            setSelectedLocationIndex(-1); // Start with intro (-1)
        }
    }
  };

  const handleBackToChat = () => {
    setIsTouring(false);
    window.speechSynthesis.cancel();
    setState(prev => ({ ...prev, data: null, error: null }));
  };

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
                onBack={handleBackToChat}
            />
        );
    }

    return (
        <ChatInterface 
            messages={chatMessages}
            onSendMessage={handleChatMessage}
            onNameClick={handleSearch}
            isLoading={isChatLoading}
        />
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      
      {/* Sidebar / Overlay Container */}
      <div className="absolute top-0 left-0 w-full h-full md:w-[480px] pointer-events-none z-[500] flex flex-col">
        
        {/* Header Area */}
        <div className="p-4 md:p-6 pointer-events-auto bg-gradient-to-b from-slate-50/90 to-transparent md:bg-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Compass className="text-white w-6 h-6" />
            </div>
            <div>
                <h1 className="text-xl font-serif font-bold text-slate-900 leading-none">Nomen Origins</h1>
                <span className="text-xs text-slate-500 font-medium tracking-wide">ETYMOLOGY EXPLORER</span>
            </div>
          </div>
          <SearchBar onSearch={handleSearch} isLoading={state.isLoading} />
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-6 md:pt-0 overflow-hidden pointer-events-auto pb-6 md:pb-6">
             {renderSidebarContent()}
        </div>
      </div>

      {/* Map Background */}
      <div className="w-full h-full absolute inset-0 md:relative md:inset-auto flex-1">
        <MapVisualizer 
            locations={state.data?.locations || []} 
            selectedLocationIndex={selectedLocationIndex}
            onSelectLocation={handleLocationSelect}
        />
      </div>

    </div>
  );
};

export default App;