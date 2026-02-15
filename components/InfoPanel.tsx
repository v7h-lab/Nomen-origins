import React, { useEffect, useRef } from 'react';
import { EtymologyData } from '../types';
import { BookOpen, MapPin, Sparkles, History, Users, Quote, Play, Square, ArrowLeft } from 'lucide-react';

interface InfoPanelProps {
  data: EtymologyData | null;
  error: string | null;
  selectedLocationIndex: number | null;
  onSelectLocation: (index: number) => void;
  isTouring: boolean;
  onToggleTour: () => void;
  onRelatedNameClick: (name: string) => void;
  onBack: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ 
    data, 
    error, 
    selectedLocationIndex, 
    onSelectLocation,
    isTouring,
    onToggleTour,
    onRelatedNameClick,
    onBack
}) => {
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to selected item when index changes
  useEffect(() => {
    if (selectedLocationIndex !== null && itemRefs.current[selectedLocationIndex]) {
      itemRefs.current[selectedLocationIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedLocationIndex]);

  // Scroll to top when new data loads
  useEffect(() => {
    if (data && containerRef.current) {
        containerRef.current.scrollTop = 0;
    }
  }, [data]);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-white/90 backdrop-blur-xl rounded-3xl border border-red-100 shadow-xl">
        <div className="text-red-500 mb-4 bg-red-50 p-4 rounded-full">
            <History className="w-8 h-8" />
        </div>
        <p className="text-red-600 font-medium">{error}</p>
        <button 
            onClick={onBack}
            className="mt-6 text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition-colors"
        >
            <ArrowLeft className="w-4 h-4" /> Back to History
        </button>
      </div>
    );
  }

  if (!data) {
    return null; // Handled by App.tsx now to show ChatInterface
  }

  // Helper to determine if gender tag should be shown
  const shouldShowGenderTag = (gender: string) => {
    return gender && gender.length < 20 && !gender.includes(';') && !gender.includes(',');
  };

  return (
    <div 
        ref={containerRef}
        className="h-full overflow-y-auto bg-white/90 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl p-6 md:p-8 animate-in slide-in-from-left-4 fade-in duration-500 custom-scrollbar relative"
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-indigo-100 pb-6">
          <button 
             onClick={onBack}
             className="mb-4 flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-wider transition-colors"
          >
             <ArrowLeft className="w-4 h-4" /> Back to History
          </button>

          <h1 className="text-4xl font-serif font-bold text-slate-900 tracking-tight">
              {data.name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            {data.locations.length > 0 && (
                <button 
                  onClick={onToggleTour}
                  className={`rounded-full p-2 transition-all duration-300 border-2 
                      ${isTouring 
                          ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                          : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`}
                  title={isTouring ? "Stop Tour" : "Start Tour"}
                >
                  {isTouring ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current pl-0.5" />}
                </button>
            )}
            {shouldShowGenderTag(data.gender) && (
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
                  {data.gender}
                </span>
            )}
          </div>
          <p className="text-lg text-slate-600 font-serif italic leading-relaxed">
            "{data.meaning}"
          </p>
        </div>

        {/* Origin Roots */}
        <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4" /> Linguistic Roots
            </h3>
            <div className="flex flex-wrap gap-2">
                {data.originRoots.map((root, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200">
                        {root}
                    </span>
                ))}
            </div>
        </div>

        {/* History Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <History className="w-4 h-4" /> Historical Journey
          </h3>
          <p className="text-slate-700 leading-relaxed text-sm">
            {data.history}
          </p>
        </div>

        {/* Cultural Significance */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <h3 className="text-amber-800 font-serif font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Cultural Impact
          </h3>
          <p className="text-amber-900/80 text-sm leading-relaxed">
            {data.culturalSignificance}
          </p>
        </div>

        {/* Locations List (Visual Only) */}
        <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4" /> Key Regions
            </h3>
            <ul className="space-y-2">
                {data.locations.map((loc, idx) => {
                    const isSelected = selectedLocationIndex === idx;
                    return (
                        <li 
                            key={idx} 
                            ref={(el) => { itemRefs.current[idx] = el; }}
                            onClick={() => onSelectLocation(idx)}
                            className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-500 cursor-pointer border relative overflow-hidden
                                ${isSelected 
                                    ? 'bg-indigo-50 border-indigo-200 shadow-sm scale-[1.02]' 
                                    : 'hover:bg-slate-50 border-transparent hover:border-slate-100'}`}
                        >
                            {/* Progress bar for tour */}
                            {isTouring && isSelected && (
                                <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/30 animate-recede z-0 pointer-events-none" />
                            )}

                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 transition-all z-10
                                ${loc.type === 'origin' ? 'bg-indigo-500' : 
                                  loc.type === 'usage' ? 'bg-emerald-500' : 'bg-rose-500'}
                                ${isSelected ? 'ring-2 ring-offset-2 ring-indigo-300' : ''}`} 
                            />
                            <div className="z-10">
                                <div className={`font-medium text-sm transition-colors ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                    {loc.name}
                                </div>
                                <div className={`text-xs leading-snug transition-colors ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                                    {loc.significance}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>

        {/* Fun Fact */}
        <div className="relative p-6 bg-slate-800 rounded-2xl text-slate-300 overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Quote size={64} />
            </div>
            <h4 className="font-bold text-white mb-2 relative z-10">Did you know?</h4>
            <p className="text-sm leading-relaxed relative z-10 font-medium">
                {data.funFact}
            </p>
        </div>

        {/* Related Names */}
        {data.relatedNames.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 block mb-2">RELATED NAMES</span>
                <div className="flex flex-wrap gap-2">
                    {data.relatedNames.map((name, idx) => (
                        <button
                            key={idx}
                            onClick={() => onRelatedNameClick(name)}
                            className="text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1 rounded-full transition-colors font-medium"
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default InfoPanel;