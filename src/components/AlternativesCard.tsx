import React from 'react';
import { ArrowLeft, Star, ShieldCheck } from 'lucide-react';

interface AlternativesCardProps {
  category: 'Transport' | 'Food' | 'Energy' | 'Purchases';
  onClose: () => void;
}

export default function AlternativesCard({ category, onClose }: AlternativesCardProps) {
  const data = {
    Transport: [
      { alternative: 'Bicycle / Walk', saving: 'Save 100%', cost: 'Free', action: 'Great for trips under 5km. Burns calorie fuel, not fossil fuel!' },
      { alternative: 'Public Transit (Bus/Train)', saving: 'Save 80% to 90%', cost: 'Very Low Cost', action: 'Riding public transit consolidates major commuter footprint indexes instantly.' },
      { alternative: 'Electric Vehicle (EV)', saving: 'Save 70%', cost: 'Investment', action: 'Swapping internal combustion engines with electric battery power avoids tailpipe emissions.' },
      { alternative: 'Carpooling with peers', saving: 'Save 50% split', cost: 'Fuel Saver', action: 'Doubling passenger ratios divides individual atmospheric load by half.' },
    ],
    Food: [
      { alternative: 'Vegan Plant-based Meal', saving: 'Save 90%', cost: 'Saver', action: 'Replacing global supply beef/pork with grains/legumes avoids enormous raw methane indexes.' },
      { alternative: 'Vegetarian Bowl', saving: 'Save 80%', cost: 'Saver', action: 'Retaining cheese/eggs while skipping large animals lowers land usage footprint significantly.' },
      { alternative: 'Poultry (Chicken) meal', saving: 'Save 70% vs beef', cost: 'Budget Match', action: 'Avian conversion ratios are vastly more energy-efficient than cattle bio-systems.' },
      { alternative: 'Local Crop Sourcing', saving: 'Save 15%', cost: 'Local Price', action: 'Sourcing items grown close to home eliminates massive cargo ship transport logs.' },
    ],
    Energy: [
      { alternative: 'Residential Solar Panels', saving: 'Save 95%', cost: 'Upfront Investment', action: 'Swapping electrical mains for solar generation provides carbon-free homestead power.' },
      { alternative: 'Smart Thermostat schedules', saving: 'Save 30%', cost: 'Very Low', action: 'Automating peak thermal loops shuts down active climate grids when nobody is home.' },
      { alternative: 'Line Drying Laundry', saving: 'Save 100% of cycle', cost: 'Free', action: 'Air-drying clean clothes limits heavy electricity spikes from tumble heating.' },
      { alternative: 'LED Lamp swap', saving: 'Save 80% per bulb', cost: 'Minimal', action: 'Replacing vintage incandescent filaments cuts grid consumption exponentially.' },
    ],
    Purchases: [
      { alternative: 'Pre-owned / Vintage Goods', saving: 'Save 85%', cost: '50% Off Cash', action: 'Extending materials lifetime completely avoids factory creation and smelting cycles.' },
      { alternative: 'Local Second-hand Swap', saving: 'Save 90%', cost: 'Free to minimal', action: 'Trading goods within communities cuts heavy warehouse logistic cargo lines.' },
      { alternative: 'Repair & Maintain current', saving: 'Save 100%', cost: 'Cheap Fix', action: 'Replacing batteries, fixing seams, or patching keeps functional items out of incinerators.' },
      { alternative: 'Refusal of packaging', saving: 'Save 5%', cost: 'Free', action: 'Choosing loose crops without plastic bags shrinks global refinery production runs.' },
    ],
  };

  const getCategorizedBorderClass = () => {
    switch (category) {
      case 'Transport': return 'border-l-4 border-l-[#568F75] bg-[#568F75]/[0.01]';
      case 'Food': return 'border-l-4 border-l-[#D99A1C] bg-[#D99A1C]/[0.01]';
      case 'Energy': return 'border-l-4 border-l-blue-500 bg-blue-500/[0.01]';
      case 'Purchases': return 'border-l-4 border-l-purple-500 bg-purple-500/[0.01]';
      default: return 'border-l-4 border-l-sage bg-bg-toned/10';
    }
  };

  const list = data[category] || data['Transport'];

  return (
    <div className="bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-[32px] border border-border-toned premium-shadow premium-shadow-hover h-full flex flex-col" id="alternatives-explorer">
      <div className="flex items-center gap-3.5 mb-5 select-none">
        <button
          onClick={onClose}
          aria-label="Back to dashboard overview"
          className="w-10 h-10 rounded-full border border-sage/15 bg-mint/40 hover:bg-mint text-sage hover:text-sage-hover flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-sage block">Eco-Directory Search</span>
          <h2 className="text-sm font-extrabold uppercase tracking-[0.1em] text-charcoal font-display">{category} Recommendations</h2>
        </div>
      </div>

      <p className="text-xs text-sage mb-5 leading-relaxed font-medium">
        Systemic footprint reduction is powered by strategic daily changes. Choose these proven recommendations to lower your carbon intensity index:
      </p>

      <div className="flex-1 overflow-y-auto space-y-4 max-h-[460px] pr-1">
        {list.map((item, idx) => (
          <div 
            key={idx} 
            className={`p-4 rounded-xl border-y border-r border-border-toned/50 hover:shadow-md transition-all flex flex-col gap-2.5 ${getCategorizedBorderClass()}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-charcoal flex items-center gap-1.5 font-display">
                <Star className="w-4 h-4 text-sage fill-sage/15" /> {item.alternative}
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-mint text-sage border border-sage/15">
                {item.saving}
              </span>
            </div>
            
            <p className="text-xs text-charcoal/80 leading-relaxed font-normal">
              {item.action}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-border-toned/30 text-[10px] text-sage font-semibold">
              <span>Financial Footprint: <strong className="text-charcoal/80 font-mono">{item.cost}</strong></span>
              <span className="flex items-center gap-1 text-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5" /> High Recommendation
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
