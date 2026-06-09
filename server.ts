import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Ensure data folder exists for filesystem persistence
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, "db.json");

interface UserRecord {
  id: string;
  email: string;
  username: string;
  passwordHash: string; // demo comparison
}

interface ProfileRecord {
  id: string;
  username: string;
  daily_limit: number;
  xp: number;
  level: number;
  streak_days: number;
  last_active_date?: string; // YYYY-MM-DD
  badges: string[];
}

interface DBState {
  users: { [email: string]: UserRecord };
  profiles: { [id: string]: ProfileRecord };
  activities: { id: string; user_id: string; category: 'Transport' | 'Food' | 'Energy' | 'Purchases'; emission_value: number; description: string; created_at: string }[];
  challenges: { id: string; user_id: string; status: 'pending' | 'completed' | 'declined'; tip_content: string; created_at: string }[];
  sessions: { [token: string]: string }; // token -> user_id
}

const presetBadges = {
  first_step: { id: "first_step", name: "First Footprint", description: "Logged your first carbon awareness activity.", xpReward: 25 },
  streak_3: { id: "streak_3", name: "Consistent Saver", description: "Maintained a 3-Day active logging streak.", xpReward: 50 },
  streak_7: { id: "streak_7", name: "Climate Sentinel", description: "Reached an active 7-Day logging streak.", xpReward: 100 },
  transport_master: { id: "transport_master", name: "Low-Emission Voyager", description: "Logged 5 or more transportation choices.", xpReward: 40 },
  green_chef: { id: "green_chef", name: "Earthy Culinary Chef", description: "Logged 5 or more mindful meal impacts.", xpReward: 40 },
  energy_shaver: { id: "energy_shaver", name: "Grid Efficiency Expert", description: "Logged 5 or more home utilities power entries.", xpReward: 40 },
  challenge_conqueror: { id: "challenge_conqueror", name: "Climate Action Hero", description: "Successfully finished 3 active challenges.", xpReward: 75 }
};

// Seed initial state
const defaultState: DBState = {
  users: {
    "jane@ecolens.ai": {
      id: "default-user",
      email: "jane@ecolens.ai",
      username: "Jane Doe",
      passwordHash: "password123"
    }
  },
  profiles: {
    "default-user": {
      id: "default-user",
      username: "Jane Doe",
      daily_limit: 15.0,
      xp: 140,
      level: 2,
      streak_days: 2,
      last_active_date: new Date().toISOString().split("T")[0],
      badges: ["first_step"]
    }
  },
  activities: [
    {
      id: "seed-1",
      user_id: "default-user",
      category: "Transport",
      emission_value: 4.8,
      description: "Gasoline Car: 12 km",
      created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    },
    {
      id: "seed-2",
      user_id: "default-user",
      category: "Food",
      emission_value: 2.1,
      description: "Beef burger meal",
      created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString() // yesterday
    },
    {
      id: "seed-3",
      user_id: "default-user",
      category: "Energy",
      emission_value: 1.8,
      description: "AC running for 3 hours",
      created_at: new Date(Date.now() - 52 * 3600 * 1000).toISOString() // 2 days ago
    }
  ],
  challenges: [
    {
      id: "seed-c1",
      user_id: "default-user",
      status: "pending",
      tip_content: "Your transport impact was 12% higher this week; try walking for your next short trip to save 0.5kg CO2.",
      created_at: new Date().toISOString()
    }
  ],
  sessions: {}
};

function readDB(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      // Migrate or seed old schemas safely
      if (!parsed.users) parsed.users = defaultState.users;
      if (!parsed.sessions) parsed.sessions = defaultState.sessions;
      if (!parsed.profiles) parsed.profiles = defaultState.profiles;
      return parsed;
    }
  } catch (error) {
    console.error("Error reading database container state, using fallback:", error);
  }
  writeDB(defaultState);
  return defaultState;
}

function writeDB(state: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database container state:", error);
  }
}

// Lazy load Gemini AI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured or is using the template default.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json());

  // ----------------- AUTHENTICATION MIDDLEWARE -----------------
  const getUserIdFromHeader = (req: express.Request): string => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const db = readDB();
      const userId = db.sessions[token];
      if (userId) return userId;
    }
    // Elegant fallback to default-user so the preview never crashes or locks out users upfront
    return "default-user";
  };

  // ----------------- AUTHENTICATION ENDPOINTS -----------------

  // Sign up
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ error: "Email, password, and username are required." });
    }

    const lowercaseEmail = email.toLowerCase().trim();
    const db = readDB();

    if (db.users[lowercaseEmail]) {
      return res.status(400).json({ error: "Email address already registered." });
    }

    const userId = "usr_" + Math.random().toString(36).substring(2, 9);
    
    // Save user
    db.users[lowercaseEmail] = {
      id: userId,
      email: lowercaseEmail,
      username,
      passwordHash: password // stored securely in simulated filesystem db
    };

    // Save profile with gamified seed state
    db.profiles[userId] = {
      id: userId,
      username,
      daily_limit: 15.0,
      xp: 0,
      level: 1,
      streak_days: 0,
      last_active_date: undefined,
      badges: []
    };

    // Add immediate tutorial seed challenge
    db.challenges.push({
      id: "ch_" + Math.random().toString(36).substring(2, 9),
      user_id: userId,
      status: "pending",
      tip_content: "Welcome to EcoLens! Walk or cycle for your next short trip to kickstart your journey.",
      created_at: new Date().toISOString()
    });

    writeDB(db);

    // Create session
    const token = "tok_" + Math.random().toString(36).substring(2, 12);
    db.sessions[token] = userId;
    writeDB(db);

    res.status(201).json({
      token,
      profile: db.profiles[userId]
    });
  });

  // Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const lowercaseEmail = email.toLowerCase().trim();
    const db = readDB();

    const user = db.users[lowercaseEmail];
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: "Invalid email or matching password." });
    }

    // Ensure session
    const token = "tok_" + Math.random().toString(36).substring(2, 12);
    db.sessions[token] = user.id;
    writeDB(db);

    // Quick migration safeguard
    if (!db.profiles[user.id]) {
      db.profiles[user.id] = {
        id: user.id,
        username: user.username,
        daily_limit: 15.0,
        xp: 0,
        level: 1,
        streak_days: 0,
        badges: []
      };
      writeDB(db);
    }

    res.json({
      token,
      profile: db.profiles[user.id]
    });
  });

  // Me / Session recovery
  app.get("/api/auth/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No authorizations provided." });
    }

    const token = authHeader.substring(7);
    const db = readDB();
    const userId = db.sessions[token];

    if (!userId || !db.profiles[userId]) {
      return res.status(401).json({ error: "Invalid or outdated session." });
    }

    res.json(db.profiles[userId]);
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const db = readDB();
      delete db.sessions[token];
      writeDB(db);
    }
    res.json({ success: true });
  });

  // ----------------- PROFILE ENDPOINTS -----------------

  app.get("/api/profile", (req, res) => {
    const userId = getUserIdFromHeader(req);
    const db = readDB();
    let profile = db.profiles[userId];
    if (!profile) {
      profile = {
        id: userId,
        username: userId === "default-user" ? "Jane Doe" : "Eco Champion",
        daily_limit: 15.0,
        xp: 40,
        level: 1,
        streak_days: 1,
        badges: []
      };
      db.profiles[userId] = profile;
      writeDB(db);
    }
    res.json(profile);
  });

  app.patch("/api/profile", (req, res) => {
    const userId = getUserIdFromHeader(req);
    const { username, daily_limit } = req.body;
    const db = readDB();
    
    let profile = db.profiles[userId];
    if (!profile) {
      profile = {
        id: userId,
        username: username || "User",
        daily_limit: 15.0,
        xp: 0,
        level: 1,
        streak_days: 0,
        badges: []
      };
    }

    if (username !== undefined) profile.username = username;
    if (daily_limit !== undefined) profile.daily_limit = parseFloat(daily_limit) || 15.0;

    db.profiles[userId] = profile;
    writeDB(db);
    res.json(profile);
  });


  // ----------------- ACTIVITIES LOGS -----------------

  app.get("/api/activities", (req, res) => {
    const userId = getUserIdFromHeader(req);
    const db = readDB();
    const list = db.activities.filter(a => a.user_id === userId);
    const sorted = [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    res.json(sorted);
  });

  app.post("/api/activities", (req, res) => {
    const userId = getUserIdFromHeader(req);
    const { category, emission_value, description } = req.body;
    if (!category || emission_value === undefined) {
      return res.status(400).json({ error: "Category and emission_value are required" });
    }

    const db = readDB();
    const nowStr = new Date().toISOString();
    const todayYMD = nowStr.split("T")[0];

    const newActivity = {
      id: "act_" + Math.random().toString(36).substring(2, 9),
      user_id: userId,
      category,
      emission_value: parseFloat(emission_value) || 0,
      description: description || `${category} activity logged`,
      created_at: nowStr
    };

    db.activities.push(newActivity);

    // Dynamic Streak & Gamification updates
    let profile = db.profiles[userId];
    if (!profile) {
      profile = { id: userId, username: "Jane Doe", daily_limit: 15.0, xp: 0, level: 1, streak_days: 0, badges: [] };
    }

    // Track active logging streak
    const lastActive = profile.last_active_date;
    if (!lastActive) {
      profile.streak_days = 1;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayYMD = yesterday.toISOString().split("T")[0];

      if (lastActive === yesterdayYMD) {
        // Logged on yesterday, streak continues
        profile.streak_days += 1;
      } else if (lastActive === todayYMD) {
        // Logged today already, streak remains unchanged
      } else {
        // Streak broke, reset to 1
        profile.streak_days = 1;
      }
    }
    profile.last_active_date = todayYMD;

    // Award standard XP for logging: +15 XP
    let gainedXP = 15;
    const newlyunlocked: string[] = [];

    const userActivities = db.activities.filter(a => a.user_id === userId);
    const totalLogs = userActivities.length;

    // Badge logic check
    // 1. First Schritt
    if (totalLogs >= 1 && !profile.badges.includes("first_step")) {
      profile.badges.push("first_step");
      gainedXP += presetBadges.first_step.xpReward;
      newlyunlocked.push(presetBadges.first_step.name);
    }
    // 2. Streak badges
    if (profile.streak_days >= 3 && !profile.badges.includes("streak_3")) {
      profile.badges.push("streak_3");
      gainedXP += presetBadges.streak_3.xpReward;
      newlyunlocked.push(presetBadges.streak_3.name);
    }
    if (profile.streak_days >= 7 && !profile.badges.includes("streak_7")) {
      profile.badges.push("streak_7");
      gainedXP += presetBadges.streak_7.xpReward;
      newlyunlocked.push(presetBadges.streak_7.name);
    }
    // 3. Category logs counts
    const transCount = userActivities.filter(a => a.category === "Transport").length;
    if (transCount >= 5 && !profile.badges.includes("transport_master")) {
      profile.badges.push("transport_master");
      gainedXP += presetBadges.transport_master.xpReward;
      newlyunlocked.push(presetBadges.transport_master.name);
    }
    const foodCount = userActivities.filter(a => a.category === "Food").length;
    if (foodCount >= 5 && !profile.badges.includes("green_chef")) {
      profile.badges.push("green_chef");
      gainedXP += presetBadges.green_chef.xpReward;
      newlyunlocked.push(presetBadges.green_chef.name);
    }
    const energyCount = userActivities.filter(a => a.category === "Energy").length;
    if (energyCount >= 5 && !profile.badges.includes("energy_shaver")) {
      profile.badges.push("energy_shaver");
      gainedXP += presetBadges.energy_shaver.xpReward;
      newlyunlocked.push(presetBadges.energy_shaver.name);
    }

    profile.xp += gainedXP;
    profile.level = Math.floor(profile.xp / 100) + 1;

    db.profiles[userId] = profile;
    writeDB(db);

    res.status(201).json({
      activity: newActivity,
      profile,
      newlyUnlockedBadges: newlyunlocked
    });
  });

  app.delete("/api/activities/:id", (req, res) => {
    const userId = getUserIdFromHeader(req);
    const { id } = req.params;
    const db = readDB();
    
    // Find item
    const activityIndex = db.activities.findIndex(a => a.id === id && a.user_id === userId);
    if (activityIndex === -1) {
      return res.status(404).json({ error: "Activity not found" });
    }

    db.activities.splice(activityIndex, 1);
    writeDB(db);
    res.json({ success: true, message: "Activity deleted" });
  });

  // ----------------- CHALLENGES tracking -----------------

  app.get("/api/challenges", (req, res) => {
    const userId = getUserIdFromHeader(req);
    const db = readDB();
    const list = db.challenges.filter(c => c.user_id === userId);
    res.json(list);
  });

  app.patch("/api/challenges/:id", (req, res) => {
    const userId = getUserIdFromHeader(req);
    const { id } = req.params;
    const { status } = req.body; // e.g. 'completed', 'declined'
    
    const db = readDB();
    const challenge = db.challenges.find(c => c.id === id && c.user_id === userId);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    const previousStatus = challenge.status;
    challenge.status = status;

    // Gamification bonus for completing a challenge
    let gainedXP = 0;
    const newlyunlocked: string[] = [];

    if (status === "completed" && previousStatus !== "completed") {
      gainedXP += 50; // Challenge completion: +50 XP

      // Check for challenge conqueror badge
      const completedCount = db.challenges.filter(c => c.user_id === userId && c.status === "completed").length;
      const profile = db.profiles[userId];
      
      if (profile) {
        if (completedCount >= 3 && !profile.badges.includes("challenge_conqueror")) {
          profile.badges.push("challenge_conqueror");
          gainedXP += presetBadges.challenge_conqueror.xpReward;
          newlyunlocked.push(presetBadges.challenge_conqueror.name);
        }
        profile.xp += gainedXP;
        profile.level = Math.floor(profile.xp / 100) + 1;
        db.profiles[userId] = profile;
      }
    }

    writeDB(db);
    res.json({
      challenge,
      profile: db.profiles[userId],
      newlyUnlockedBadges: newlyunlocked
    });
  });

  // Generate new Challenge via Gemini
  app.post("/api/challenges/generate", async (req, res) => {
    const userId = getUserIdFromHeader(req);
    const db = readDB();
    
    const userActivities = db.activities.filter(a => a.user_id === userId);
    const statsSummary = userActivities.slice(0, 5).map(a => `${a.category}: ${a.emission_value}`).join(", ");

    try {
      const ai = getGeminiClient();
      const prompt = `Generate ONE highly specific, encouraging, actionable eco-challenge or tip (less than 180 characters) designed for an eco-aware user based on these recent stats:
Recent logs: ${statsSummary}. 
Make sure it sounds natural, professional, and includes a realistic savings calculation in kg of CO2. Use a tone of constructive encouragement.
Output format MUST be simple text, nothing else. Do not wrap in markdown or json keys. Keep it concise.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.75,
        }
      });

      const text = response.text?.trim() || "Try skipping dairy or meat for dinner today to save 1.8kg CO2.";
      
      const newChallenge = {
        id: "ch_" + Math.random().toString(36).substring(2, 9),
        user_id: userId,
        status: "pending" as const,
        tip_content: text,
        created_at: new Date().toISOString()
      };

      db.challenges.push(newChallenge);
      writeDB(db);

      res.json(newChallenge);
    } catch (error: any) {
      console.warn("Gemini generation failed, using structured fallback challenge generator:", error.message);
      
      const fallbackTips = [
        "Your transport impact was 12% higher this week; try walking for your next short trip to save 0.5kg CO2.",
        "Skip red meat for your evening meal and replace with healthy roasted veggies to save up to 2.4kg of CO2.",
        "Turn down your air conditioning or heating by 1.5°C today to decrease home energy emissions by 0.8kg CO2.",
        "Conserve power! Unplug standby electronics today to easily decrease daily vampire load emissions by 0.4kg CO2.",
        "Choose local, seasonal products on your next purchase run to save up to 1.5kg CO2 in freight emissions!"
      ];
      const randomTip = fallbackTips[Math.floor(Math.random() * fallbackTips.length)];

      const newChallenge = {
        id: "ch_" + Math.random().toString(36).substring(2, 9),
        user_id: userId,
        status: "pending" as const,
        tip_content: randomTip,
        created_at: new Date().toISOString()
      };

      db.challenges.push(newChallenge);
      writeDB(db);
      res.json(newChallenge);
    }
  });


  // ----------------- VITE ENDPOINT OR STATIC MIDDLEWARE -----------------

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EcoLens Server is spinning on http://localhost:${PORT}`);
  });
}

startServer();
