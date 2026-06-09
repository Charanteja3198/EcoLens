import React, { useMemo, useEffect, useState } from 'react';
import { motion, animate } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Activity } from '../types';

interface ImpactGaugeProps {
  activities: Activity[];
  dailyLimit: number;
}

export default function ImpactGauge({ activities, dailyLimit }: ImpactGaugeProps) {
  // Get today's starting date (local time)
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [activities]);

  // Sum today's emissions
  const todayEmissions = useMemo(() => {
    return activities
      .filter((act) => new Date(act.created_at).getTime() >= todayStart)
      .reduce((sum, act) => sum + act.emission_value, 0);
  }, [activities, todayStart]);

  const percentUsed = Math.min(Math.round((todayEmissions / dailyLimit) * 100), 200);

  // Smooth numeric counter using standard React state safe from object-child errors
  const [displayNum, setDisplayNum] = useState('0.0');

  useEffect(() => {
    const fromVal = parseFloat(displayNum) || 0;
    const controls = animate(fromVal, todayEmissions, {
      duration: 1.0,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayNum(latest.toFixed(1));
      }
    });
    return () => controls.stop();
  }, [todayEmissions]);

  // Group emissions by category for our Recharts chart
  const chartData = useMemo(() => {
    const categories: Record<string, number> = {
      Transport: 0,
      Food: 0,
      Energy: 0,
      Purchases: 0,
    };

    activities.forEach((act) => {
      if (categories[act.category] !== undefined) {
        categories[act.category] += act.emission_value;
      }
    });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(1)),
    }));
  }, [activities]);

  // Color mapping matching a professional, high-contrast palette
  const COLORS: Record<string, string> = {
    Transport: '#568F75',   // Rich Sage
    Food: '#D99A1C',        // Organic Gold
    Energy: '#3B82F6',      // Electric Blue
    Purchases: '#A855F7',   // Premium Amethyst
  };

  // Circular progress math
  // Radius is 96, circumference is 2 * PI * 96 = ~603.18
  const strokeDasharray = 603.18;
  const progressRatio = Math.min(todayEmissions / dailyLimit, 1.0);
  const strokeDashoffset = strokeDasharray * (1 - progressRatio);

  // Determine status color based on budget intensity
  const getBudgetStatusColor = () => {
    if (percentUsed >= 100) return 'text-red-500 bg-red-50 border-red-100';
    if (percentUsed >= 80) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-sage bg-mint border-sage/10';
  };

  const getCircleStrokeColor = () => {
    if (percentUsed >= 100) return '#EF4444'; // Red
    if (percentUsed >= 80) return '#F59E0B'; // Amber
    return '#568F75'; // Sage green
  };

  return (
    <div className="flex flex-col gap-6 h-full" id="impact-gauge-section">
      {/* Prime Animated Gauge Circle */}
      <div className="bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-[32px] border border-border-toned premium-shadow premium-shadow-hover flex flex-col items-center justify-center relative">
        <div className="w-full flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Impact Gauge</h2>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getBudgetStatusColor()}`}>
            {percentUsed >= 100 ? 'Limit Exceeded ⚠️' : percentUsed >= 80 ? 'Approaching Limit 🔔' : 'Within Budget General ✓'}
          </span>
        </div>
        
        <div className="relative flex items-center justify-center w-60 h-60 my-2">
          <svg className="w-56 h-56 transform -rotate-90">
            {/* Background track */}
            <circle
              cx="112"
              cy="112"
              r="96"
              stroke="#F0F4F2"
              strokeWidth="14"
              fill="transparent"
            />
            {/* Real progression circle */}
            <motion.circle
              cx="112"
              cy="112"
              r="96"
              stroke={getCircleStrokeColor()}
              strokeWidth="14"
              fill="transparent"
              strokeLinecap="round"
              initial={{ strokeDashoffset: strokeDasharray }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{
                strokeDasharray,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className="text-5xl font-extrabold font-display text-charcoal leading-none tracking-tight flex items-baseline"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              {displayNum}
              <span className="text-lg font-bold text-sage/80 ml-0.5">kg</span>
            </motion.span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sage mt-1">CO2e today</span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-charcoal font-bold text-xl font-display">
            {percentUsed}% limit used
          </p>
          <p className="text-[11px] font-medium text-sage/90 mt-1">
            Target Budget Capacity: <strong className="font-semibold text-charcoal font-mono">{dailyLimit.toFixed(1)} kg CO2e</strong>
          </p>
        </div>
      </div>

      {/* Recharts Analytics Breakdown */}
      <div className="bg-white/95 backdrop-blur-md p-6 rounded-[32px] border border-border-toned premium-shadow premium-shadow-hover flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-sage">Emissions Breakdown</h3>
            <p className="text-[10px] text-sage mt-0.5">Accumulated footprint by category</p>
          </div>
          <span className="text-[11px] font-bold font-mono bg-mint border border-sage/15 px-3 py-1 rounded-full text-sage">
            TOTAL: {activities.reduce((sum, a) => sum + a.emission_value, 0).toFixed(1)} kg
          </span>
        </div>
        <div className="h-44 w-full flex-1 min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#4E5352', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#86948D', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(86, 143, 117, 0.05)' }}
                contentStyle={{ background: '#FFFFFF', border: '1px solid #DFE5E1', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                labelClassName="font-extrabold text-xs text-charcoal font-display"
                itemStyle={{ color: '#568F75', fontSize: '12px', fontWeight: '500' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={28}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#568F75'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
