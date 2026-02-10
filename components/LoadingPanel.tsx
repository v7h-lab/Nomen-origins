import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const LOADING_PHRASES = [
  "Tracing linguistic roots...",
  "Mapping historical journeys...",
  "Uncovering ancient myths...",
  "Locating geographical origins...",
  "Analyzing cultural significance...",
  "Consulting the archives..."
];

const LoadingPanel: React.FC = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full bg-white/90 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl p-6 md:p-8 animate-in fade-in duration-300 relative overflow-hidden">
      
      {/* Loading Indicator */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-50 flex flex-col items-center max-w-xs w-full">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
            <p className="text-slate-600 font-medium text-center animate-pulse">
                {LOADING_PHRASES[phraseIndex]}
            </p>
        </div>
      </div>

      {/* Skeleton Content - Background */}
      <div className="space-y-8 opacity-30 pointer-events-none">
        {/* Header Skeleton */}
        <div className="border-b border-indigo-100 pb-6 space-y-4">
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          <div className="flex justify-between items-center">
             <div className="h-10 w-48 bg-slate-300 rounded-lg animate-pulse" />
             <div className="h-6 w-16 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="h-6 w-full max-w-md bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Roots Skeleton */}
        <div className="space-y-3">
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="flex gap-2">
                <div className="h-8 w-20 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-8 w-16 bg-slate-200 rounded-lg animate-pulse" />
            </div>
        </div>

        {/* Text Paragraph Skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="space-y-2">
             <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
             <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
             <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>

        {/* List Skeleton */}
        <div className="space-y-4">
           <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
           {[1, 2, 3].map(i => (
               <div key={i} className="flex gap-3 items-center">
                   <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0 animate-pulse" />
                   <div className="space-y-2 flex-1">
                       <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                       <div className="h-3 w-48 bg-slate-200 rounded animate-pulse" />
                   </div>
               </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingPanel;