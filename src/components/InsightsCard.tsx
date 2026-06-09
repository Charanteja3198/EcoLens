import React from 'react';
import { Sparkles, CheckCircle2, ChevronRight, RefreshCw, XCircle } from 'lucide-react';
import { Challenge } from '../types';

interface InsightsCardProps {
  challenges: Challenge[];
  onStatusUpdate: (id: string, status: 'completed' | 'declined') => void;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
}

export default function InsightsCard({
  challenges,
  onStatusUpdate,
  onGenerate,
  isGenerating,
}: InsightsCardProps) {
  // Find current active (pending) challenge
  const activeChallenge = challenges.find((ch) => ch.status === 'pending');

  return (
    <div
      className="relative bg-white/90 backdrop-blur-md rounded-[32px] p-6 md:p-8 border border-border-toned premium-shadow premium-shadow-hover flex flex-col gap-5 overflow-hidden transition-all duration-300"
      id="insights-card"
    >
      {/* Absolute background decoration for Natural Tones flavor */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-mint rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none opacity-60" />

      {/* Title block */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-mint flex items-center justify-center border border-sage/15 shadow-sm">
            <Sparkles className="w-4.5 h-4.5 text-sage" />
          </div>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.15em] text-sage block">AI Intelligence</span>
            <span className="text-[10px] text-sage/80 block -mt-0.5 font-medium">Personalized daily action plan</span>
          </div>
        </div>

        {/* Generate / Refresh Button */}
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          title="Ask EcoLens AI for a personalized challenge"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border border-sage/25 hover:border-sage text-sage hover:bg-mint bg-white transition-all cursor-pointer disabled:opacity-50 shadow-sm active:scale-95 select-none"
        >
          <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generating...' : 'New AI Tip'}
        </button>
      </div>

      {isGenerating ? (
        <div className="py-8 flex flex-col items-center justify-center text-center gap-3 relative z-10">
          <div className="animate-pulse space-y-2.5 w-full">
            <div className="h-4 bg-sage/10 rounded-full w-4/5 mx-auto"></div>
            <div className="h-4 bg-sage/10 rounded-full w-3/5 mx-auto"></div>
          </div>
          <p className="text-[11px] font-mono text-sage italic mt-1 animate-bounce font-semibold">
            🧠 Real-time EcoLens footprint trend analysis...
          </p>
        </div>
      ) : activeChallenge ? (
        <div className="flex flex-col gap-4 mt-1 relative z-10">
          <div className="bg-[#F3FDF8] border border-sage/10 p-5 rounded-2xl">
            <div className="text-[10px] font-extrabold text-sage uppercase tracking-wider mb-1 px-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-sage animate-pulse"></span>
              Challenge of the Day
            </div>
            <p className="text-base md:text-lg font-bold text-charcoal leading-snug font-display mt-1">
              "{activeChallenge.tip_content}"
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => onStatusUpdate(activeChallenge.id, 'completed')}
              className="px-5 py-2.5 bg-sage hover:bg-sage-hover text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Accept & Complete
            </button>
            <button
              onClick={() => onStatusUpdate(activeChallenge.id, 'declined')}
              className="px-4 py-2.5 border border-border-toned bg-white rounded-full text-xs font-bold text-sage hover:text-charcoal hover:bg-bg-toned transition-all flex items-center gap-1 cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-sage/80" /> Skip
            </button>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center relative z-10 bg-mint/20 border border-sage/10 rounded-2xl p-4">
          <p className="text-sm font-bold text-charcoal flex items-center justify-center gap-1.5">
            🎉 Completed daily challenges
          </p>
          <p className="text-xs text-sage mt-1 font-medium">Click "New AI Tip" above to run an instant footprint analysis.</p>

          {/* History of challenges done */}
          {challenges.filter((ch) => ch.status !== 'pending').length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-toned/60 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sage block mb-2 font-display">Recent accomplishments:</span>
              <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto pr-1">
                {challenges
                  .filter((ch) => ch.status !== 'pending')
                  .slice(-3)
                  .reverse()
                  .map((ch) => (
                    <div key={ch.id} className="text-[11px] text-charcoal flex items-start gap-2 bg-white p-2.5 rounded-xl border border-border-toned/60 shadow-sm">
                      <span className="shrink-0 text-xs">{ch.status === 'completed' ? '✅' : '⏭️'}</span>
                      <span className="italic leading-snug text-charcoal/80 font-medium">"{ch.tip_content}"</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
