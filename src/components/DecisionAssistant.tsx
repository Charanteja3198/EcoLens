import React, { useMemo } from 'react';
import { Lightbulb, ArrowRight, Share2, Compass } from 'lucide-react';
import { Activity } from '../types';

interface DecisionAssistantProps {
  lastActivity: Activity | null;
  onExploreCategory: (category: 'Transport' | 'Food' | 'Energy' | 'Purchases') => void;
}

interface Alternative {
  suggestion: string;
  savingCalc: string;
  equivalentTask: string;
}

export default function DecisionAssistant({ lastActivity, onExploreCategory }: DecisionAssistantProps) {
  // Compute best alternative based on what was logged
  const advice = useMemo<Alternative | null>(() => {
    if (!lastActivity) return null;

    const desc = lastActivity.description.toLowerCase();
    const emission = lastActivity.emission_value;

    switch (lastActivity.category) {
      case 'Transport':
        if (desc.includes('car') || desc.includes('petrol') || desc.includes('suv')) {
          // If they rode high emission car, suggest bus or walking
          const busSaving = (emission * 0.8).toFixed(1);
          const walkSaving = emission.toFixed(1);
          return {
            suggestion: 'Opt for bus/metro and save up to ' + busSaving + 'kg, or walk/cycle to save the full ' + walkSaving + 'kg CO2!',
            savingCalc: `Saved: ${walkSaving}kg`,
            equivalentTask: 'Equivalent to planting 1 tree sapling!',
          };
        }
        return {
          suggestion: 'Excellent! You selected a lower-impact transit mode. Continue choosing public transit or walking to keep transportation lean.',
          savingCalc: 'Eco Champ',
          equivalentTask: 'Keep it up!',
        };

      case 'Food':
        if (desc.includes('beef') || desc.includes('lamb') || desc.includes('meat')) {
          const veggieSaving = (emission * 0.85).toFixed(1);
          return {
            suggestion: 'Swap your beef for a savory Vegetarian or plant-based Vegan meal next time to save ' + veggieSaving + 'kg CO2!',
            savingCalc: `Saved: ${veggieSaving}kg`,
            equivalentTask: 'Saves 350 liters of water too!',
          };
        }
        return {
          suggestion: 'Sustenance is clean! Selecting plant-based plates avoids high greenhouse emissions common in intensive cattle farming.',
          savingCalc: 'Green Diet',
          equivalentTask: 'Protects critical biodiversity!',
        };

      case 'Energy':
        if (desc.includes('ac ') || desc.includes('conditioning') || desc.includes('heater') || desc.includes('dryer')) {
          const powerSaving = (emission * 0.5).toFixed(1);
          return {
            suggestion: 'Set a 1-hour timer or lower climate controls by 1°C next time to slice home power emissions by ' + powerSaving + 'kg CO2!',
            savingCalc: `Saved: ${powerSaving}kg`,
            equivalentTask: 'Reduces peak load demand on local grids.',
          };
        }
        return {
          suggestion: 'Smart electricity choice! Consider checking if local clean energy plans are available from your electricity utility.',
          savingCalc: 'Co2 Saver',
          equivalentTask: 'Fosters utility investment in solar farms.',
        };

      case 'Purchases':
        if (desc.includes('clothing') || desc.includes('electronic') || desc.includes('phone') || desc.includes('delivery')) {
          const prelovedSaving = (emission * 0.75).toFixed(1);
          return {
            suggestion: 'Repairing current gear or opting for pre-loved/second-hand platforms can save up to ' + prelovedSaving + 'kg CO2!',
            savingCalc: `Saved: ${prelovedSaving}kg`,
            equivalentTask: 'Curbs industrial manufacturing pollution.',
          };
        }
        return {
          suggestion: 'Mindful physical consumption is key. Reducing single-use containers or excessive wrapping limits systemic lifecycle emissions.',
          savingCalc: 'Circular Choice',
          equivalentTask: 'Reduces landfill waste.',
        };

      default:
        return null;
    }
  }, [lastActivity]);

  if (!lastActivity || !advice) {
    // Elegant fallback prompt if no log exists yet
    return (
      <div 
        className="mx-4 md:mx-8 mb-6 p-5 bg-sage text-white rounded-[24px] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
        id="decision-assistant-placeholder"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 text-xl">💡</div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-white/80 block">Decision Assistant</span>
            <span className="text-sm font-medium leading-snug">
              No recent logged trips. Log your first activity using the central '+' key below to see tailored alternatives!
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="mx-4 md:mx-8 mb-6 p-5 bg-[#8DA399] text-white rounded-[24px] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md transition-all duration-300 hover:shadow-lg"
      id="decision-assistant-active"
    >
      <div className="flex items-start md:items-center gap-3.5">
        <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0 text-2xl animate-pulse">
          💡
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#F0F2F1]/90 block">
            Decision Assistant &bull; Last Logged: {lastActivity.category}
          </span>
          <span className="text-sm font-medium mt-0.5 block leading-relaxed">
            {advice.suggestion}
          </span>
          <span className="text-[10px] font-mono text-[#D2E3DB] mt-1 block">
             Tip: {advice.equivalentTask}
          </span>
        </div>
      </div>
      <button 
        type="button"
        onClick={() => onExploreCategory(lastActivity.category)}
        className="text-xs font-bold uppercase tracking-wider underline decoration-2 underline-offset-4 shrink-0 hover:text-[#D2E3DB] transition-all self-end md:self-auto flex items-center gap-1 cursor-pointer"
      >
        Explore Alternatives <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
