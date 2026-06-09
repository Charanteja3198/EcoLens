export interface Profile {
  id: string;
  username: string;
  daily_limit: number; // e.g. 15.0 (kg CO2e)
  xp: number; // Experience points
  level: number; // Current Level
  streak_days: number; // Logging streak
  last_active_date?: string; // Last date logged (YYYY-MM-DD)
  badges: string[]; // Badge ID array
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'activity' | 'challenge' | 'general';
  xpReward: number;
}

export interface Activity {
  id: string;
  user_id: string;
  category: 'Transport' | 'Food' | 'Energy' | 'Purchases';
  emission_value: number; // in kg CO2e
  description: string; // e.g. "Car travel: 12 km" or "Plant-based meal"
  created_at: string; // ISO string
}

export interface Challenge {
  id: string;
  user_id: string;
  status: 'pending' | 'completed' | 'declined';
  tip_content: string;
  created_at: string;
}

export interface QuickLogOption {
  category: 'Transport' | 'Food' | 'Energy' | 'Purchases';
  multiplier: number; // kg CO2e per unit
  unit: string; // e.g., "km", "meal", "kWh", "USD"
  subcategories: {
    label: string;
    multiplier: number;
    description: string;
  }[];
}
