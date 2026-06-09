import React from 'react';
import { Trash2, Calendar, ClipboardList } from 'lucide-react';
import { Activity } from '../types';

interface HistoryPanelProps {
  activities: Activity[];
  onDeleteActivity: (id: string) => void;
}

export default function HistoryPanel({ activities, onDeleteActivity }: HistoryPanelProps) {
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  // Icon selector per category
  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'Transport': return '🚗';
      case 'Food': return '🍲';
      case 'Energy': return '⚡';
      case 'Purchases': return '🛍️';
      default: return '🌿';
    }
  };

  // Border color selector per category
  const getCategoryBorderClass = (cat: string) => {
    switch (cat) {
      case 'Transport': return 'border-l-4 border-l-[#568F75] bg-[#568F75]/[0.02] hover:bg-[#568F75]/[0.05]';
      case 'Food': return 'border-l-4 border-l-[#D99A1C] bg-[#D99A1C]/[0.02] hover:bg-[#D99A1C]/[0.05]';
      case 'Energy': return 'border-l-4 border-l-blue-500 bg-blue-500/[0.02] hover:bg-blue-500/[0.05]';
      case 'Purchases': return 'border-l-4 border-l-purple-500 bg-purple-500/[0.02] hover:bg-purple-500/[0.05]';
      default: return 'border-l-4 border-l-sage bg-bg-toned/20 hover:bg-white';
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-[32px] border border-border-toned premium-shadow premium-shadow-hover h-full flex flex-col" id="history-section">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-mint border border-sage/10 rounded-xl text-sage">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Emissions History</h2>
            <p className="text-[10px] text-sage mt-0.5">Your action history journal</p>
          </div>
        </div>
        <span className="text-xs font-bold font-mono text-sage bg-mint border border-sage/10 px-3 py-1 rounded-full select-none">
          {activities.length} logs
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[500px] pr-1 space-y-3.5">
        {activities.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border-toned rounded-2xl bg-bg-toned/10">
            <span className="text-4xl mb-3 animate-pulse">🍃</span>
            <p className="text-sm font-bold text-charcoal">All Clear!</p>
            <p className="text-xs text-sage mt-1 max-w-xs leading-relaxed">
              You haven't logged any carbon emissions yet. Keep it pristine or log actions as they happen!
            </p>
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className={`p-4 rounded-xl border-y border-r border-border-toned/50 hover:shadow-md transition-all flex items-center justify-between group ${getCategoryBorderClass(act.category)}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl w-10 h-10 rounded-full bg-white border border-border-toned flex items-center justify-center shrink-0 shadow-sm">
                  {getCategoryEmoji(act.category)}
                </span>
                <div>
                  <div className="text-xs font-bold text-charcoal leading-relaxed">{act.description}</div>
                  <div className="text-[10px] text-sage flex items-center gap-1 mt-0.5 font-medium">
                    <Calendar className="w-3 h-3 text-sage/80" /> {formatDate(act.created_at)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-sm font-extrabold font-mono text-charcoal">+{act.emission_value.toFixed(1)}</span>
                  <span className="text-[9px] text-sage uppercase font-bold block leading-none select-none">kg CO2e</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => onDeleteActivity(act.id)}
                  title="Remove this log entry"
                  className="w-8 h-8 rounded-full bg-white border border-border-toned text-rose-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-border-toned/60 text-center">
        <p className="text-[10px] text-sage leading-relaxed font-medium">
          * Calculated values utilize international standards from the World Resources Institute (WRI) & regional EPA guidelines. Keep log balances green!
        </p>
      </div>
    </div>
  );
}
