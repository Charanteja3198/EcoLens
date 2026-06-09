import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Car, Utensils, Zap, ShoppingBag, ArrowRight, HelpCircle } from 'lucide-react';
import { QuickLogOption } from '../types';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLog: (category: 'Transport' | 'Food' | 'Energy' | 'Purchases', value: number, desc: string) => void;
}

const LOG_OPTIONS: Record<string, QuickLogOption> = {
  Transport: {
    category: 'Transport',
    multiplier: 0.2, // default (kg/km)
    unit: 'km',
    subcategories: [
      { label: 'Petrol/Gas Car', multiplier: 0.22, description: 'Standard internal combustion car' },
      { label: 'SUV/Pick-up', multiplier: 0.32, description: 'Large, higher-consumption vehicle' },
      { label: 'Electric Vehicle', multiplier: 0.06, description: 'Low carbon grid-mix average' },
      { label: 'Bus/Transit Ride', multiplier: 0.04, description: 'Public transport per passenger' },
      { label: 'Train/Metro', multiplier: 0.03, description: 'Electric train average footprint' },
    ],
  },
  Food: {
    category: 'Food',
    multiplier: 2.5, // default
    unit: 'meals',
    subcategories: [
      { label: 'Beef/Lamb Meal', multiplier: 5.8, description: 'High-impact animal agriculture' },
      { label: 'Chicken/Pork Meal', multiplier: 1.5, description: 'Medium-impact poultry/pork' },
      { label: 'Vegetarian Meal', multiplier: 0.7, description: 'Egg/Diary inclusive meal' },
      { label: 'Vegan Meal', multiplier: 0.45, description: 'Fully plant-based meal' },
      { label: 'Coffee & Snacks', multiplier: 0.3, description: 'Standard beverage or baked good' },
    ],
  },
  Energy: {
    category: 'Energy',
    multiplier: 0.5, // default (kg/kWh)
    unit: 'hours / units',
    subcategories: [
      { label: 'Home Electricity Grid', multiplier: 0.48, description: 'Per kWh average power consumption' },
      { label: 'Air Conditioning (1hr)', multiplier: 0.65, description: 'AC running in normal temperature' },
      { label: 'Space Heater (1hr)', multiplier: 0.8, description: 'Electric radiating heater' },
      { label: 'Laundry Dryer Cycle', multiplier: 1.2, description: 'High-heat tumble drying run' },
      { label: 'Refuse/Waste Bag', multiplier: 0.9, description: 'Per generic trash bag thrown' },
    ],
  },
  Purchases: {
    category: 'Purchases',
    multiplier: 5.0, // default
    unit: 'items',
    subcategories: [
      { label: 'New Clothing/Shoes', multiplier: 14.5, description: 'Fast fashion average carbon index' },
      { label: 'Electronics/Laptop', multiplier: 95.0, description: 'Production footprint (averaged)' },
      { label: 'Smart Phone/Gadget', multiplier: 45.0, description: 'Average micro-electronic creation' },
      { label: 'Online Package Delivery', multiplier: 2.5, description: 'Wrapping, packaging & local courier' },
      { label: 'Generic Consumer Item', multiplier: 4.0, description: 'Standard plastics, toys, small homewares' },
    ],
  },
};

export default function LogModal({ isOpen, onClose, onLog }: LogModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'Transport' | 'Food' | 'Energy' | 'Purchases'>('Transport');
  const [subIdx, setSubIdx] = useState<number>(0);
  const [amount, setAmount] = useState<number>(5);
  const [customDesc, setCustomDesc] = useState<string>('');

  const activeCategoryConfig = LOG_OPTIONS[selectedCategory];
  const activeSubcategory = activeCategoryConfig.subcategories[subIdx];

  const calculatedEmission = parseFloat((amount * activeSubcategory.multiplier).toFixed(2));

  const handleCategorySelect = (cat: 'Transport' | 'Food' | 'Energy' | 'Purchases') => {
    setSelectedCategory(cat);
    setSubIdx(0);
    // Sensible initial quantities
    if (cat === 'Transport') setAmount(10);
    else if (cat === 'Food') setAmount(1);
    else if (cat === 'Energy') setAmount(4);
    else if (cat === 'Purchases') setAmount(1);
    setCustomDesc('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDesc = customDesc.trim() || `${activeSubcategory.label} (${amount} ${activeCategoryConfig.unit === 'meals' || activeCategoryConfig.unit === 'items' ? (amount === 1 ? 'item' : 'items') : activeCategoryConfig.unit})`;
    onLog(selectedCategory, calculatedEmission, finalDesc);
    onClose();
    // reset
    setCustomDesc('');
  };

  // Icon mapping
  const categoryIcons = {
    Transport: <Car className="w-5 h-5 text-[#8DA399]" />,
    Food: <Utensils className="w-5 h-5 text-[#8DA399]" />,
    Energy: <Zap className="w-5 h-5 text-[#8DA399]" />,
    Purchases: <ShoppingBag className="w-5 h-5 text-[#8DA399]" />,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop screen lock */}
          <motion.div
            className="absolute inset-0 bg-[#2D3132]/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal box */}
          <motion.div
            className="w-full max-w-lg bg-white rounded-[32px] border border-border-toned shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            {/* Header section */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-border-toned bg-bg-toned/50">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-sage/20 rounded-lg">🌱</span>
                <h3 className="text-lg font-bold text-charcoal">Quick Impact Log</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-border-toned text-charcoal hover:bg-bg-toned transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content box */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
              {/* Four Logging Categories Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-sage block mb-2">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Transport', 'Food', 'Energy', 'Purchases'] as const).map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategorySelect(cat)}
                        className={`py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-subtle-green bg-sage/10 border-sage shadow-sm scale-[1.03]'
                            : 'bg-white border-border-toned hover:bg-bg-toned'
                        }`}
                      >
                        {categoryIcons[cat]}
                        <span className="text-[10px] font-bold text-charcoal tracking-wide">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-categories picker under selected category */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-sage block mb-2">
                  Specific {selectedCategory} Action
                </label>
                <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                  {activeCategoryConfig.subcategories.map((sub, idx) => {
                    const isSelected = subIdx === idx;
                    return (
                      <button
                        key={sub.label}
                        type="button"
                        onClick={() => setSubIdx(idx)}
                        className={`text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-white border-sage ring-2 ring-sage/10'
                            : 'bg-bg-toned/40 border-border-toned/50 hover:bg-bg-toned'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold text-charcoal">{sub.label}</div>
                          <div className="text-[10px] text-sage">{sub.description}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold font-mono text-charcoal">
                            {sub.multiplier}
                          </span>
                          <span className="text-[9px] text-sage block leading-none">kg/{activeCategoryConfig.unit === 'meals' || activeCategoryConfig.unit === 'items' ? 'ea' : activeCategoryConfig.unit}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity dynamic slider / input */}
              <div className="bg-bg-toned/50 p-4 rounded-2xl border border-border-toned/80 grid grid-cols-12 gap-3 items-center">
                <div className="col-span-8">
                  <label className="text-xs font-bold uppercase tracking-wider text-sage block mb-1">
                    Amount ({activeCategoryConfig.unit})
                  </label>
                  <input
                    type="range"
                    min={selectedCategory === 'Purchases' || selectedCategory === 'Food' ? 1 : 1}
                    max={selectedCategory === 'Transport' ? 150 : selectedCategory === 'Energy' ? 24 : 10}
                    step={selectedCategory === 'Transport' ? 1 : 0.5}
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    className="w-full accent-sage cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-sage mt-1 font-semibold pr-1">
                    <span>Min</span>
                    <span>Max</span>
                  </div>
                </div>
                <div className="col-span-4 text-center bg-white border border-border-toned rounded-xl p-2.5">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full text-center font-bold text-charcoal text-lg font-mono focus:outline-none"
                  />
                  <span className="text-[10px] font-semibold text-sage uppercase block">{activeCategoryConfig.unit}</span>
                </div>
              </div>

              {/* Custom descriptive label */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-sage block mb-1">
                  Optional Description (Override)
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${activeSubcategory.label}`}
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-toned focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage text-xs text-charcoal bg-white"
                />
              </div>

              {/* Calculated footprint banner and Submit Button */}
              <div className="mt-2 bg-sage/10 p-4 rounded-2xl border border-sage/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-sage uppercase tracking-wider block">Estimated Emission</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-charcoal">{calculatedEmission}</span>
                    <span className="text-xs font-semibold text-sage">kg CO2e</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-[#8DA399] hover:bg-[#7D9389] text-white rounded-full text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  Log Impact <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
