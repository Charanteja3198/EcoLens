import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Plus, ShieldCheck, User, Settings2, Trash2, Zap, Utensils, Car, ShoppingBag, Info, CheckSquare, ClipboardList, BookOpen, Award, LogIn, LogOut, Share2 } from 'lucide-react';

import { Activity, Profile, Challenge } from './types';
import ImpactGauge from './components/ImpactGauge';
import LogModal from './components/LogModal';
import InsightsCard from './components/InsightsCard';
import DecisionAssistant from './components/DecisionAssistant';
import HistoryPanel from './components/HistoryPanel';
import AlternativesCard from './components/AlternativesCard';
import GamificationPanel from './components/GamificationPanel';
import AuthModal from './components/AuthModal';

export default function App() {
  // Full-stack API State
  const [profile, setProfile] = useState<Profile>({
    id: 'default-user',
    username: 'Jane Doe',
    daily_limit: 15.0,
    xp: 0,
    level: 1,
    streak_days: 0,
    badges: []
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  // Auth & Session state
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('ecolens_auth_token'));
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'gamification'>('dashboard');
  const [selectedAltCategory, setSelectedAltCategory] = useState<'Transport' | 'Food' | 'Energy' | 'Purchases' | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempLimit, setTempLimit] = useState('15.0');
  const [tempUsername, setTempUsername] = useState('Jane Doe');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Fetch full state on mount and when token switches
  useEffect(() => {
    async function loadInitialData() {
      try {
        setErrorBanner(null);
        
        let activeHeaders: Record<string, string> = {};
        if (authToken) {
          // Verify session legitimacy first
          const authMe = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          
          if (authMe.ok) {
            activeHeaders = { 'Authorization': `Bearer ${authToken}` };
          } else {
            console.warn("Session out of date. Reverting sandbox default guest.");
            localStorage.removeItem('ecolens_auth_token');
            setAuthToken(null);
          }
        }

        const [profRes, actRes, chalRes] = await Promise.all([
          fetch('/api/profile', { headers: activeHeaders }),
          fetch('/api/activities', { headers: activeHeaders }),
          fetch('/api/challenges', { headers: activeHeaders }),
        ]);

        if (profRes.ok) {
          const profData = await profRes.json();
          setProfile(profData);
          setTempLimit(profData.daily_limit.toString());
          setTempUsername(profData.username);
        }
        if (actRes.ok) {
          const actData = await actRes.json();
          setActivities(actData);
        }
        if (chalRes.ok) {
          const chalData = await chalRes.json();
          setChallenges(chalData);
        }
      } catch (err) {
        console.error('Failed to load initial EcoLens records:', err);
        setErrorBanner('Unable to synchronize data with server. Using local memory models.');
      }
    }
    loadInitialData();
  }, [authToken]);

  // Helper trigger alerts
  const showAlert = (msg: string, isError = false) => {
    if (isError) {
      setErrorBanner(msg);
      setTimeout(() => setErrorBanner(null), 5000);
    } else {
      setSuccessBanner(msg);
      setTimeout(() => setSuccessBanner(null), 4000);
    }
  };

  const handleAuthSuccess = (token: string, newProfile: Profile) => {
    localStorage.setItem('ecolens_auth_token', token);
    setAuthToken(token);
    setProfile(newProfile);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (e) {
        console.warn("Direct logout notify failed:", e);
      }
    }
    localStorage.removeItem('ecolens_auth_token');
    setAuthToken(null);
    setProfile({
      id: 'default-user',
      username: 'Jane Doe',
      daily_limit: 15.0,
      xp: 40,
      level: 1,
      streak_days: 1,
      badges: []
    });
    // Triggers default fetch re-synchronizations
    showAlert('Successfully signed out of custom account.');
  };

  // Add a carbon log entry with game rewards checks
  const handleAddActivity = async (
    category: 'Transport' | 'Food' | 'Energy' | 'Purchases',
    value: number,
    description: string
  ) => {
    try {
      const activeHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (authToken) {
        activeHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: activeHeaders,
        body: JSON.stringify({ category, emission_value: value, description }),
      });

      if (!response.ok) throw new Error('API logging failed');
      const data = await response.json();
      
      setActivities((prev) => [data.activity, ...prev]);
      if (data.profile) {
        setProfile(data.profile);
      }

      if (data.newlyUnlockedBadges && data.newlyUnlockedBadges.length > 0) {
        const badgeNames = data.newlyUnlockedBadges.join(', ');
        showAlert(`🏆 UNLOCKED NEW BADGES: [${badgeNames}]! Gained bonus experience points!`);
      } else {
        showAlert(`Logged ${value.toFixed(1)}kg CO2. +15 XP Gained!`);
      }
    } catch (err) {
      // Offline fallback
      const fallbackAct: Activity = {
        id: 'fallback_' + Math.random().toString(36).substring(2, 7),
        user_id: profile.id || 'default-user',
        category,
        emission_value: value,
        description,
        created_at: new Date().toISOString(),
      };
      setActivities((prev) => [fallbackAct, ...prev]);
      showAlert('API offline. Logged locally in browser session.', true);
    }
  };

  // Delete logged activity
  const handleDeleteActivity = async (id: string) => {
    try {
      const activeHeaders: Record<string, string> = {};
      if (authToken) {
        activeHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
        headers: activeHeaders
      });
      if (!response.ok) throw new Error('Delete API failed');
      
      setActivities((prev) => prev.filter((a) => a.id !== id));
      showAlert('Logged entry removed successfully');
    } catch (err) {
      setActivities((prev) => prev.filter((a) => a.id !== id));
      showAlert('Item deleted from current workspace memory.', true);
    }
  };

  // Update profile settings
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(tempLimit) || 15.0;
    try {
      const activeHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (authToken) {
        activeHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: activeHeaders,
        body: JSON.stringify({ username: tempUsername, daily_limit: parsedLimit }),
      });

      if (!response.ok) throw new Error('API profiles PATCH failed');
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsSettingsOpen(false);
      showAlert('Carbon budget saved!');
    } catch (err) {
      const fbProfile = { 
        ...profile, 
        username: tempUsername, 
        daily_limit: parsedLimit 
      };
      setProfile(fbProfile);
      setIsSettingsOpen(false);
      showAlert('Configured target budget locally.', true);
    }
  };

  // Update specific challenges
  const handleStatusUpdate = async (id: string, status: 'completed' | 'declined') => {
    try {
      const activeHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (authToken) {
        activeHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`/api/challenges/${id}`, {
        method: 'PATCH',
        headers: activeHeaders,
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Challenge update API failed');
      const data = await response.json();
      
      setChallenges((prev) => prev.map((c) => (c.id === id ? data.challenge : c)));
      
      if (data.profile) {
        setProfile(data.profile);
      }

      if (status === 'completed') {
        if (data.newlyUnlockedBadges && data.newlyUnlockedBadges.length > 0) {
          showAlert(`🏆 UNLOCKED BADGE: [${data.newlyUnlockedBadges.join(', ')}]! Challenge finished!`);
        } else {
          showAlert('Congratulations! Challenge finished. +50 XP Gained!');
        }
      } else {
        showAlert('Challenge skipped');
      }
    } catch (err) {
      setChallenges((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
      showAlert(`Record updated in current workspace.`, true);
    }
  };

  // Generate new AI recommendation using server-side Gemini call
  const handleGenerateChallenge = async () => {
    setIsGeneratingChallenge(true);
    try {
      const activeHeaders: Record<string, string> = {};
      if (authToken) {
        activeHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/challenges/generate', {
        method: 'POST',
        headers: activeHeaders
      });
      if (!response.ok) throw new Error('Failed to run AI generator');
      const newChal = await response.json();
      setChallenges((prev) => [...prev, newChal]);
      showAlert('EcoLens AI processed new challenge!');
    } catch (err) {
      showAlert('Triggered high-quality local template card.', true);
    } finally {
      setIsGeneratingChallenge(false);
    }
  };

  // Explore Alternative category mapper
  const handleExploreCategoryAlternatives = (cat: 'Transport' | 'Food' | 'Energy' | 'Purchases') => {
    setSelectedAltCategory(cat);
    setActiveTab('dashboard'); // Redirect to dashboard grid
  };

  // Get most recently logged activity to feed into DecisionAssistant advice
  const mostRecentActivity = activities.length > 0 ? activities[0] : null;

  return (
    <div className="min-h-screen bg-bg-toned text-charcoal font-sans flex flex-col overflow-x-hidden pb-24 md:pb-6 relative">
      
      {/* Dynamic Status / Error Toasts */}
      <AnimatePresence>
        {errorBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl shadow-lg text-[11px] font-medium max-w-sm text-center flex items-center gap-2"
          >
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorBanner}</span>
          </motion.div>
        )}
        {successBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-sage text-charcoal/90 px-4 py-2.5 rounded-2xl shadow-md text-xs font-semibold max-w-sm text-center flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-sage" />
            <span>{successBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest Mode Prompt banner */}
      {!authToken && (
        <div className="bg-gradient-to-r from-sage/10 via-sage/5 to-sage/10 border-b border-border-toned text-charcoal py-2 px-4 text-center text-[10px] md:text-xs font-semibold flex items-center justify-center gap-1.5 shadow-inner">
          <span>💡 You are using a <strong>Guest Sandbox Session</strong> (Jane Doe).</span>
          <button 
            onClick={() => setIsAuthOpen(true)}
            className="text-sage font-bold underline hover:text-charcoal cursor-pointer flex items-center gap-0.5 ml-1 select-none"
          >
            Connect Identity 🔑
          </button>
        </div>
      )}

      {/* Top Header Panel - matches Natural Tones precisely */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4.5 bg-white border-b border-border-toned shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#8DA399] rounded-xl flex items-center justify-center shadow-sm">
            <Leaf className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-charcoal">EcoLens</h1>
              {authToken && (
                <span className="bg-sage/10 text-sage text-[9px] font-bold px-2 py-0.5 rounded-full select-none">
                  Sync Active
                </span>
              )}
            </div>
            <span className="hidden md:inline text-[9px] font-bold text-sage uppercase tracking-[0.2em]">Your Carbon Awareness Partner</span>
          </div>
        </div>

        {/* Right side Profile controls */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-bold text-sage uppercase tracking-wider">Session Profile</span>
            <span className="text-xs font-semibold text-charcoal flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${authToken ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              {authToken ? 'Custom Cloud Account' : 'Guest Mode'}
            </span>
          </div>

          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            title="Configure Daily CO2 Goal Limit"
            className="w-10 h-10 rounded-full bg-bg-toned border border-border-toned hover:bg-white flex items-center justify-center text-charcoal transition-all shadow-sm cursor-pointer"
          >
            <Settings2 className="w-4.5 h-4.5 text-charcoal/80" />
          </button>

          {/* Connected state avatar */}
          <div
            onClick={() => setIsSettingsOpen(true)}
            title="Edit Setup"
            className="w-10 h-10 rounded-full bg-bg-toned border-2 border-sage flex items-center justify-center text-xs font-bold text-sage hover:bg-white transition-all cursor-pointer shadow-sm select-none"
          >
            {profile.username ? profile.username.substring(0, 2).toUpperCase() : 'JD'}
          </div>

          {/* Secure signup/login trigger buttons */}
          {authToken ? (
            <button
              onClick={handleLogout}
              title="Sign Out of Session"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 hover:bg-red-100/80 border border-red-200 transition-colors text-red-600 shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-1 px-4 py-2 bg-sage hover:bg-sage-hover text-white rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
          )}
        </div>
      </header>

      {/* Modal - Config settings */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
            />
            <motion.div
              className="relative w-full max-w-sm bg-white border border-border-toned rounded-[30px] p-6 shadow-2xl flex flex-col gap-4"
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
            >
              <div className="flex items-center justify-between border-b border-border-toned pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-sage">EcoLens Profile Setup</h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-xs font-bold uppercase text-sage hover:text-charcoal cursor-pointer"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-sage uppercase tracking-wider block mb-1">Username</label>
                  <input
                    type="text"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-toned text-xs focus:ring-2 focus:ring-sage/20 text-charcoal bg-white font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-sage uppercase tracking-wider block mb-1">
                    Daily CO2 Limit Target (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    value={tempLimit}
                    onChange={(e) => setTempLimit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-toned font-mono text-xs focus:ring-2 focus:ring-sage/20 text-charcoal bg-white font-bold"
                    required
                  />
                  <p className="text-[10px] text-sage italic mt-1 font-medium">Standard WHO/EPA healthy budget is 15.0kg.</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-sage hover:bg-sage-hover text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-colors"
                >
                  Save Profile Settings
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Structural Layout Grid - conforms to Design guidelines */}
      <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl mx-auto w-full flex flex-col gap-6">

        {/* Dynamic Navigation Tabs Body Switcher */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
            >
              {/* Left Column Gauge - col-span-5 */}
              <div className="col-span-1 md:col-span-12 lg:col-span-5 h-full">
                <ImpactGauge activities={activities} dailyLimit={profile.daily_limit} />
              </div>

              {/* Right Column Intelligence Card Stack - col-span-7 */}
              <div className="col-span-1 md:col-span-12 lg:col-span-7 h-full flex flex-col gap-6">
                
                {/* AI Insights Card */}
                <InsightsCard
                  challenges={challenges}
                  onStatusUpdate={handleStatusUpdate}
                  onGenerate={handleGenerateChallenge}
                  isGenerating={isGeneratingChallenge}
                />

                {/* Explorer Section vs Default Static Category Previews */}
                {selectedAltCategory ? (
                  <div className="flex flex-col gap-4">
                    <AlternativesCard
                      category={selectedAltCategory}
                      onClose={() => setSelectedAltCategory(null)}
                    />
                  </div>
                ) : (
                  <div className="bg-white/95 backdrop-blur-md rounded-[32px] p-6 border border-border-toned premium-shadow premium-shadow-hover flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="text-xs font-bold text-sage uppercase tracking-wider block">💡 Eco-Directory of Standards</span>
                        <p className="text-[10px] text-sage mt-0.5">Click any category below to view and implement daily sustainable alternatives</p>
                      </div>
                      <span className="text-[10px] text-sage/80 font-mono bg-bg-toned px-2.5 py-1 rounded-md border border-border-toned select-none">Factor averages</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Transport Card */}
                      <button
                        onClick={() => setSelectedAltCategory('Transport')}
                        className="group bg-mint/40 hover:bg-mint/80 p-4 rounded-2xl border border-sage/10 hover:border-sage/40 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer shadow-sm active:scale-95 text-left"
                      >
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Car className="w-5 h-5 text-sage" />
                        </div>
                        <span className="text-xs font-bold text-charcoal">Transport</span>
                        <span className="text-[9px] font-bold text-sage uppercase tracking-wider bg-white/70 px-2 py-0.5 rounded border border-sage/10">0.2 kg/km</span>
                      </button>

                      {/* Food Card */}
                      <button
                        onClick={() => setSelectedAltCategory('Food')}
                        className="group bg-amber-50/40 hover:bg-amber-50/80 p-4 rounded-2xl border border-amber-100 hover:border-amber-300 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer shadow-sm active:scale-95 text-left"
                      >
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Utensils className="w-5 h-5 text-gold" />
                        </div>
                        <span className="text-xs font-bold text-charcoal">Food</span>
                        <span className="text-[9px] font-bold text-gold uppercase tracking-wider bg-white/70 px-2 py-0.5 rounded border border-amber-100">2.5 kg/meal</span>
                      </button>

                      {/* Energy Card */}
                      <button
                        onClick={() => setSelectedAltCategory('Energy')}
                        className="group bg-blue-50/40 hover:bg-blue-50/80 p-4 rounded-2xl border border-blue-100 hover:border-blue-300 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer shadow-sm active:scale-95 text-left"
                      >
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Zap className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="text-xs font-bold text-charcoal">Energy</span>
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider bg-white/70 px-2 py-0.5 rounded border border-blue-100">0.5 kg/kWh</span>
                      </button>

                      {/* Purchases Card */}
                      <button
                        onClick={() => setSelectedAltCategory('Purchases')}
                        className="group bg-purple-50/40 hover:bg-purple-50/80 p-4 rounded-2xl border border-purple-100 hover:border-purple-300 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer shadow-sm active:scale-95 text-left"
                      >
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <ShoppingBag className="w-5 h-5 text-purple-500" />
                        </div>
                        <span className="text-xs font-bold text-charcoal">Purchases</span>
                        <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider bg-white/70 px-2 py-0.5 rounded border border-purple-100">Varies ea</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-sage text-center italic leading-relaxed font-medium">
                      Press one of the icons above or tap the large floating <strong className="text-charcoal font-semibold">+</strong> button to log immediate actions!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'gamification' ? (
            <motion.div
              key="gamification-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="max-w-4xl mx-auto w-full"
            >
              <GamificationPanel profile={profile} activities={activities} />
            </motion.div>
          ) : (
            <motion.div
              key="history-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="max-w-3xl mx-auto w-full"
            >
              <HistoryPanel activities={activities} onDeleteActivity={handleDeleteActivity} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Decision Assistant recommendation banner */}
        <div className="mt-2">
          <DecisionAssistant
            lastActivity={mostRecentActivity}
            onExploreCategory={handleExploreCategoryAlternatives}
          />
        </div>

      </main>

      {/* Sustainable Bottom Navigation Bar - matches Tones style */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-border-toned flex items-center justify-between px-6 md:px-16 z-40 shadow-xl">
        
        {/* Dashboard Tab selection button */}
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setSelectedAltCategory(null);
          }}
          className={`flex flex-col items-center gap-1 transition-all focus:outline-none cursor-pointer ${
            activeTab === 'dashboard' ? 'opacity-100 text-sage scale-102 font-bold' : 'opacity-40 text-charcoal'
          }`}
        >
          <svg className="w-5.5 h-5.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
          <span className="text-[9px] uppercase font-bold tracking-widest leading-none">Dashboard</span>
        </button>

        {/* Gamification / Badges Tab selection button */}
        <button
          onClick={() => setActiveTab('gamification')}
          className={`flex flex-col items-center gap-1 transition-all focus:outline-none cursor-pointer ${
            activeTab === 'gamification' ? 'opacity-100 text-sage scale-102 font-bold' : 'opacity-40 text-charcoal'
          }`}
        >
          <Award className="w-5.5 h-5.5" />
          <span className="text-[9px] uppercase font-bold tracking-widest leading-none">Badges & Social</span>
        </button>

        {/* Floating Quick Action "+" Button - visually centers floating above navbar */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-8 z-50">
          <button
            onClick={() => setIsLogModalOpen(true)}
            title="Log Carbon Activity"
            className="w-16 h-16 bg-sage hover:bg-sage-hover text-white rounded-full flex items-center justify-center shadow-2xl border-[5px] border-bg-toned hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          >
            <Plus className="w-6.5 h-6.5 text-white font-bold group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Spacer for floating layout balance */}
        <div className="w-12 pointer-events-none" />

        {/* History Tab selection button */}
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-all focus:outline-none cursor-pointer ${
            activeTab === 'history' ? 'opacity-100 text-sage scale-102 font-bold' : 'opacity-40 text-charcoal'
          }`}
        >
          <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-[9px] uppercase font-bold tracking-widest leading-none">Logs History</span>
        </button>
      </nav>

      {/* Quick-Log modal Overlay */}
      <LogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onLog={handleAddActivity}
      />

      {/* Secure Auth Credentials Popup */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        showAlert={showAlert}
      />
    </div>
  );
}
