import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Zap, Flame, Trophy, Share2, Twitter, Facebook, Copy, Check, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { Profile, Badge, Activity } from '../types';

interface GamificationPanelProps {
  profile: Profile;
  activities: Activity[];
}

const ALL_BADGES: { [id: string]: Badge } = {
  first_step: { id: "first_step", name: "First Footprint", description: "Logged your first carbon awareness activity.", icon: "🌱", category: 'general', xpReward: 25 },
  streak_3: { id: "streak_3", name: "Consistent Saver", description: "Maintained a 3-Day active logging streak.", icon: "⚡", category: 'streak', xpReward: 50 },
  streak_7: { id: "streak_7", name: "Climate Sentinel", description: "Reached an active 7-Day logging streak.", icon: "🔥", category: 'streak', xpReward: 100 },
  transport_master: { id: "transport_master", name: "Low-Emission Voyager", description: "Logged 5 or more transportation choices.", icon: "🚲", category: 'activity', xpReward: 40 },
  green_chef: { id: "green_chef", name: "Earthy Culinary Chef", description: "Logged 5 or more mindful food choices.", icon: "🍲", category: 'activity', xpReward: 40 },
  energy_shaver: { id: "energy_shaver", name: "Grid Efficiency Expert", description: "Logged 5 or more home utilities power entries.", icon: "💡", category: 'activity', xpReward: 40 },
  challenge_conqueror: { id: "challenge_conqueror", name: "Climate Action Hero", description: "Successfully finished 3 active challenges.", icon: "🏆", category: 'challenge', xpReward: 75 }
};

export default function GamificationPanel({ profile, activities }: GamificationPanelProps) {
  const [copiedShare, setCopiedShare] = useState(false);
  const [activeShareChannel, setActiveShareChannel] = useState<'text' | 'card'>('text');

  // XP Progress Math
  const nextLevelXP = 100;
  // Current progress in the current level (XP model: level increment per 100 XP)
  const currentLevelXP = profile.xp % 100;
  const progressPercent = Math.min(Math.round((currentLevelXP / nextLevelXP) * 100), 100);

  // Stats computed
  const totalEmissionsSavedEstimate = parseFloat(
    activities.reduce((sum, act) => {
      // assume normal averages vs choices savings
      if (act.category === 'Transport') return sum + 1.2;
      if (act.category === 'Food') return sum + 2.0;
      if (act.category === 'Energy') return sum + 1.5;
      return sum + 0.5;
    }, 0).toFixed(1)
  );

  // Generate beautiful customized share snippet
  const generateShareText = () => {
    return `🌍 I am a Level ${profile.level} Climate Sentinel on EcoLens! 
🔥 Active logging streak: ${profile.streak_days} days.
🌱 Estimated CO2 offset: ${totalEmissionsSavedEstimate} kg! 
🏆 Badges: [${profile.badges.map(b => ALL_BADGES[b]?.name || b).join(', ')}].
Track your footprint with me towards carbon neutrality! #EcoLens #ClimateAction`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateShareText());
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleShareFacebook = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://ai.studio/build')}&quote=${text}`, '_blank');
  };

  return (
    <div className="bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-[32px] border border-border-toned premium-shadow premium-shadow-hover flex flex-col gap-6" id="gamification-achievement-hub">
      
      {/* 1. Level progress indicator */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl bg-mint border border-sage/20 flex items-center justify-center text-xl font-extrabold text-sage font-display shadow-sm select-none">
              {profile.level}
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></div>
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-sage">Current Rank Index</div>
              <h3 className="text-sm font-extrabold text-charcoal font-display">Level {profile.level} Champion</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-full border border-amber-100 text-[11px] font-bold shadow-inner">
              <Flame className="w-4 h-4 text-amber-500 animate-pulse fill-amber-500" />
              <span>{profile.streak_days}-Day Streak</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-sage bg-mint border border-sage/10 px-3 py-1.5 rounded-full select-none">{profile.xp} XP total</span>
          </div>
        </div>
 
        {/* Level XP Bar */}
        <div>
          <div className="flex justify-between text-[10px] text-sage font-extrabold uppercase mt-1 mb-2 tracking-wider">
            <span>Progress to Next Rank</span>
            <span>{currentLevelXP} / {nextLevelXP} XP</span>
          </div>
          <div className="w-full bg-[#F0F4F2] h-4 rounded-full overflow-hidden p-0.5 border border-border-toned/80">
            <motion.div 
              className="bg-gradient-to-r from-sage to-sage-hover h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.0, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
 
      {/* 2. Badges Case Container */}
      <div className="border-t border-border-toned/60 pt-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-xs font-bold text-sage uppercase tracking-[0.15em] flex items-center gap-1.5 font-display">
              <Award className="w-4.5 h-4.5 text-sage" /> Badges Display Case
            </h4>
            <p className="text-[10px] text-sage mt-0.5">Collect milestones for daily climate-saving log counts</p>
          </div>
          <span className="text-[10px] font-bold text-sage bg-mint px-2.5 py-1 rounded-full border border-sage/10 select-none">
            {profile.badges.length} / {Object.keys(ALL_BADGES).length} Unlocked
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.values(ALL_BADGES).map((badge) => {
            const isUnlocked = profile.badges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`relative p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-2 ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-white to-sage/5 border-sage shadow-sm ring-1 ring-sage/10 scale-[1.01] hover:shadow-md'
                    : 'bg-bg-toned/30 border-border-toned/50 opacity-45 grayscale select-none'
                }`}
              >
                {/* Visual Rank Star Badge */}
                <span className={`text-4xl filter drop-shadow-sm ${isUnlocked ? 'animate-bounce' : ''}`}>
                  {badge.icon}
                </span>
                
                <div>
                  <div className="text-xs font-extrabold text-charcoal leading-tight font-display">{badge.name}</div>
                  <div className="text-[9px] text-sage leading-relaxed mt-1 font-medium">{badge.description}</div>
                </div>
 
                {isUnlocked ? (
                  <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full scale-90 shadow-sm border border-white">✓</span>
                ) : (
                  <span className="text-[8px] font-mono font-bold text-sage/80 block mt-1 bg-white px-2 py-0.5 rounded-full border border-border-toned shadow-inner">+{badge.xpReward} XP</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Integrated Social Share Hub */}
      <div className="border-t border-border-toned/60 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-sage uppercase tracking-wider flex items-center gap-1">
            <Share2 className="w-4 h-4 text-sage" /> Carbon Action Social Sharing
          </h4>
          <div className="flex items-center gap-1 bg-bg-toned/50 p-0.5 rounded-lg border border-border-toned">
            <button
              onClick={() => setActiveShareChannel('text')}
              className={`text-[9px] font-bold px-2 py-1 rounded-md cursor-pointer transition-colors ${activeShareChannel === 'text' ? 'bg-white shadow text-charcoal' : 'text-sage hover:text-charcoal'}`}
            >
              Text Snippet
            </button>
            <button
              onClick={() => setActiveShareChannel('card')}
              className={`text-[9px] font-bold px-2 py-1 rounded-md cursor-pointer transition-colors ${activeShareChannel === 'card' ? 'bg-white shadow text-charcoal' : 'text-sage hover:text-charcoal'}`}
            >
              Share Card
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeShareChannel === 'text' ? (
            <motion.div
              key="snippet-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-bg-toned/40 border border-border-toned/80 rounded-2xl p-4 flex flex-col gap-3"
            >
              <p className="text-xs font-mono select-all text-charcoal/80 bg-white p-3 rounded-xl border border-border-toned font-medium whitespace-pre-wrap leading-relaxed">
                {generateShareText()}
              </p>

              <div className="flex items-center justify-between gap-2.5">
                <span className="text-[10px] text-sage font-semibold">Copy snippet or select social redirector:</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-bg-toned border border-border-toned rounded-full text-[10px] font-bold uppercase tracking-wider text-charcoal shadow-sm transition-colors cursor-pointer"
                  >
                    {copiedShare ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-charcoal/80" /> Copy Text
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleShareTwitter}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Twitter className="w-3 h-3 text-white fill-white" /> Twitter
                  </button>

                  <button
                    onClick={handleShareFacebook}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#4267B2] hover:bg-[#365899] text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Facebook className="w-3 h-3 text-white fill-white" /> Facebook
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="card-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col gap-3"
            >
              {/* Captured UI Mockup Card ready for saving */}
              <div 
                className="bg-gradient-to-tr from-[#8DA399] to-[#7D9389] p-6 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col gap-3.5 border border-sage/40"
                id="eco-lens-shareable-badge-card"
              >
                {/* Decorative background overlay */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-white/20 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">🌱</span>
                    <span className="text-xs font-bold font-display uppercase tracking-widest text-[#D2E3DB]">EcoLens Carbon Badge</span>
                  </div>
                  <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full tracking-wider uppercase font-semibold">Active Citizen</span>
                </div>

                <div className="flex items-center gap-4 py-1">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20 text-4xl shadow-md">
                    👑
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">Climate Impact Level {profile.level}</span>
                    <h3 className="text-xl font-bold tracking-tight text-white leading-tight">
                      {profile.username || "Eco Champion"}
                    </h3>
                    <p className="text-xs text-[#D2E3DB] leading-relaxed mt-1">
                      Reduced daily footprint and logged {activities.length} metrics to offset carbon intensity on Earth.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-white/20 pt-3 text-center">
                  <div className="bg-white/10 rounded-xl p-2">
                    <span className="text-[9px] font-bold uppercase text-white/70 block">Saved CO2</span>
                    <span className="text-sm font-bold font-mono">{totalEmissionsSavedEstimate}kg</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <span className="text-[9px] font-bold uppercase text-white/70 block">Streak Days</span>
                    <span className="text-sm font-bold font-mono">{profile.streak_days} 🔥</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <span className="text-[9px] font-bold uppercase text-white/70 block">Badges</span>
                    <span className="text-sm font-bold font-mono">{profile.badges.length} 🏆</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[8px] font-semibold text-white/60">
                  <span>* Powered by EcoLens AI Analyzer</span>
                  <span>ai.studio/build</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-sage font-medium italic">
                  💡 This beautiful capture card summarizes your overall accomplishments visually.
                </p>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-sage hover:bg-sage-hover text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                >
                  {copiedShare ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.2 h-3.2" />}
                  {copiedShare ? 'Copied' : 'Copy Digital Card'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
