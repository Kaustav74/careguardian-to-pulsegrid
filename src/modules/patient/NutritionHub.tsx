// ============================================================
// PULSEGRID — DIET PLAN & NUTRITION ANALYSIS HUB
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

interface Meal {
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  logged: boolean;
  time: string;
  details: string;
}

interface DailyNutrition {
  loggedCalories: number;
  targetCalories: number;
  loggedProtein: number;
  targetProtein: number;
  loggedCarbs: number;
  targetCarbs: number;
  loggedFats: number;
  targetFats: number;
  loggedWater: number;
  targetWater: number;
}

const DEFAULT_NUTRITION: DailyNutrition = {
  loggedCalories: 1450,
  targetCalories: 2200,
  loggedProtein: 85,
  targetProtein: 120,
  loggedCarbs: 160,
  targetCarbs: 250,
  loggedFats: 45,
  targetFats: 70,
  loggedWater: 1750,
  targetWater: 3000
};

const WEEKLY_PLAN: Record<string, Meal[]> = {
  Monday: [
    { type: 'Breakfast', name: 'Avocado Toast with Poached Eggs', calories: 420, protein: 18, carbs: 32, fats: 22, logged: true, time: '08:00 AM', details: '2 slices whole grain bread, 1 avocado, 2 eggs, pinch of chili flakes.' },
    { type: 'Lunch', name: 'Grilled Chicken & Quinoa Salad', calories: 550, protein: 42, carbs: 45, fats: 14, logged: true, time: '01:30 PM', details: '150g chicken breast, 1 cup cooked quinoa, baby spinach, cherry tomatoes, olive oil dressing.' },
    { type: 'Dinner', name: 'Pan-Seared Salmon with Asparagus', calories: 480, protein: 36, carbs: 12, fats: 28, logged: false, time: '07:30 PM', details: '180g salmon fillet, 8 asparagus spears, 1 tbsp butter, lemon squeeze.' },
    { type: 'Snack', name: 'Greek Yogurt with Blueberries', calories: 150, protein: 15, carbs: 12, fats: 3, logged: false, time: '04:30 PM', details: '150g non-fat plain Greek yogurt, 50g fresh blueberries.' }
  ],
  Tuesday: [
    { type: 'Breakfast', name: 'Almond Milk Oatmeal with Honey', calories: 380, protein: 12, carbs: 58, fats: 8, logged: false, time: '08:00 AM', details: '1 cup rolled oats, 1 cup almond milk, 1 tbsp honey, sliced almonds.' },
    { type: 'Lunch', name: 'Turkey Breast Wrap with Hummus', calories: 460, protein: 28, carbs: 42, fats: 12, logged: false, time: '01:00 PM', details: 'Whole wheat tortilla, 120g sliced turkey breast, 2 tbsp hummus, cucumbers, lettuce.' },
    { type: 'Dinner', name: 'Baked Tofu with Stir-fry Veggies', calories: 410, protein: 22, carbs: 35, fats: 18, logged: false, time: '07:00 PM', details: '150g firm tofu, broccoli, bell peppers, soy-ginger glaze, sesame seeds.' },
    { type: 'Snack', name: 'Mixed Raw Nuts (Almonds, Walnuts)', calories: 180, protein: 6, carbs: 8, fats: 16, logged: false, time: '04:00 PM', details: '30g organic raw nuts mix.' }
  ],
  Wednesday: [
    { type: 'Breakfast', name: 'Spinach & Feta Egg White Omelet', calories: 290, protein: 24, carbs: 8, fats: 14, logged: false, time: '08:15 AM', details: '4 egg whites, 1 cup fresh spinach, 30g low-fat feta cheese.' },
    { type: 'Lunch', name: 'Tuna Salad on Romaine Hearts', calories: 380, protein: 32, carbs: 10, fats: 20, logged: false, time: '01:15 PM', details: '1 can tuna in olive oil, celery, red onions, dijon mustard, romaine lettuce leaves.' },
    { type: 'Dinner', name: 'Lean Beef Sirloin & Roasted Sweet Potato', calories: 590, protein: 44, carbs: 48, fats: 18, logged: false, time: '07:45 PM', details: '150g beef sirloin steak, 150g sweet potato cubes, roasted broccoli.' },
    { type: 'Snack', name: 'Whey Isolate Protein Shake', calories: 140, protein: 26, carbs: 3, fats: 1, logged: false, time: '05:00 PM', details: '1 scoop grass-fed whey isolate, water or ice cubes.' }
  ],
  Thursday: [
    { type: 'Breakfast', name: 'Protein Pancakes with Maple Drizzle', calories: 410, protein: 25, carbs: 48, fats: 6, logged: false, time: '08:30 AM', details: 'Oat-egg pancake batter, scoop protein powder, 1 tbsp maple syrup.' },
    { type: 'Lunch', name: 'Mediterranean Lentil Soup', calories: 350, protein: 18, carbs: 54, fats: 4, logged: false, time: '01:00 PM', details: '1.5 cups brown lentil soup, carrots, onions, whole grain dinner roll.' },
    { type: 'Dinner', name: 'Baked Lemon Cod with Zucchini Noodles', calories: 320, protein: 28, carbs: 15, fats: 12, logged: false, time: '07:30 PM', details: '200g cod fillet, zucchini spirals, olive oil, garlic paste.' },
    { type: 'Snack', name: 'Apple Slices with Peanut Butter', calories: 210, protein: 7, carbs: 25, fats: 12, logged: false, time: '04:15 PM', details: '1 medium Gala apple, 1 tbsp creamy natural peanut butter.' }
  ],
  Friday: [
    { type: 'Breakfast', name: 'Chia Seed Pudding with Raspberry', calories: 310, protein: 9, carbs: 28, fats: 16, logged: false, time: '08:00 AM', details: '3 tbsp chia seeds, 1 cup light coconut milk, fresh raspberries.' },
    { type: 'Lunch', name: 'Shrimp Taco Salad with Lime Cream', calories: 490, protein: 34, carbs: 32, fats: 18, logged: false, time: '01:30 PM', details: '120g sautéed tiger prawns, black beans, sweet corn, cilantro, light yogurt dressing.' },
    { type: 'Dinner', name: 'Mushroom & Spinach Brown Rice Risotto', calories: 440, protein: 12, carbs: 68, fats: 10, logged: false, time: '07:15 PM', details: '1 cup cooked brown rice, shiitake mushrooms, baby spinach, parmesan shavings.' },
    { type: 'Snack', name: 'Cottage Cheese with Pineapple Cups', calories: 160, protein: 14, carbs: 18, fats: 2, logged: false, time: '04:30 PM', details: '150g low-fat cottage cheese, fresh pineapple cubes.' }
  ],
  Saturday: [
    { type: 'Breakfast', name: 'Smoked Salmon & Cream Cheese Bagel', calories: 490, protein: 28, carbs: 45, fats: 16, logged: false, time: '09:00 AM', details: '1 whole wheat bagel, 60g smoked salmon, 1 tbsp light cream cheese, capers.' },
    { type: 'Lunch', name: 'Chicken Pesto Panini', calories: 580, protein: 38, carbs: 48, fats: 22, logged: false, time: '01:45 PM', details: 'Sourdough bread, 100g grilled chicken, 1 tbsp basil pesto, light mozzarella.' },
    { type: 'Dinner', name: 'Grilled Lamb Chop with Roast Cauli', calories: 610, protein: 42, carbs: 10, fats: 42, logged: false, time: '08:00 PM', details: '2 lamb chops, roasted garlic cauliflower mash, rosemary gravy.' },
    { type: 'Snack', name: 'Dark Chocolate & Almonds', calories: 200, protein: 4, carbs: 18, fats: 14, logged: false, time: '05:00 PM', details: '2 squares 85% dark chocolate, 10 raw almonds.' }
  ],
  Sunday: [
    { type: 'Breakfast', name: 'Superfood Green Smoothie Bowl', calories: 340, protein: 10, carbs: 48, fats: 12, logged: false, time: '09:30 AM', details: 'Frozen bananas, spinach, kale, hemp seeds, almond milk, topped with sliced strawberry.' },
    { type: 'Lunch', name: 'Turkey Burger on Whole Wheat Bun', calories: 510, protein: 35, carbs: 38, fats: 16, logged: false, time: '02:00 PM', details: '150g lean turkey patty, grilled onions, tomato, whole wheat bun, side of green salad.' },
    { type: 'Dinner', name: 'Seafood Marinara Spaghetti', calories: 540, protein: 38, carbs: 64, fats: 12, logged: false, time: '07:30 PM', details: 'Whole wheat spaghetti, mixed seafood (calamari, shrimp, mussels), marinara sauce.' },
    { type: 'Snack', name: 'Celery Sticks with Almond Butter', calories: 150, protein: 4, carbs: 12, fats: 11, logged: false, time: '04:00 PM', details: '4 long celery sticks, 1 tbsp raw almond butter.' }
  ]
};

const NutritionHub: React.FC = () => {
  const { token } = useAuthStore();
  const [activeDay, setActiveDay] = useState<string>('Monday');
  const [nutrition, setNutrition] = useState<DailyNutrition>(() => {
    const local = localStorage.getItem('cg_nutrition');
    if (local) return JSON.parse(local);
    localStorage.setItem('cg_nutrition', JSON.stringify(DEFAULT_NUTRITION));
    return DEFAULT_NUTRITION;
  });

  // Custom Weekly Plan Logs Stateful Tracking
  const [mealsPlan, setMealsPlan] = useState<Record<string, Meal[]>>(() => {
    const local = localStorage.getItem('cg_weekly_meals');
    if (local) return JSON.parse(local);
    localStorage.setItem('cg_weekly_meals', JSON.stringify(WEEKLY_PLAN));
    return WEEKLY_PLAN;
  });

  // Log Form Modal Drawer States
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast');
  const [mealName, setMealName] = useState('');
  const [mealCal, setMealCal] = useState(350);
  const [mealProt, setMealProt] = useState(25);
  const [mealCarbs, setMealCarbs] = useState(40);
  const [mealFats, setMealFats] = useState(10);

  // AI Assistant Chat Logs
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLogs, setAiLogs] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: "Hello! I am your PulseGrid AI Nutritionist. \n\nI can analyze your caloric progress, recommend meal swaps, audit sugar intake, or suggest customized recipes (e.g. Keto, Mediterranean, Vegan) to match your macros. Click a quick audit button below or ask me anything!"
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to chat bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiLogs, aiLoading]);

  // Synchronize state mutations to local storage and broadcast
  useEffect(() => {
    localStorage.setItem('cg_nutrition', JSON.stringify(nutrition));
    window.dispatchEvent(new CustomEvent('pulsegrid-nutrition-update'));
  }, [nutrition]);

  useEffect(() => {
    localStorage.setItem('cg_weekly_meals', JSON.stringify(mealsPlan));
  }, [mealsPlan]);

  // Catch mutations broadcasted by global companion
  useEffect(() => {
    const handleUpdate = () => {
      const local = localStorage.getItem('cg_nutrition');
      if (local) {
        const nextNut = JSON.parse(local);
        if (JSON.stringify(nextNut) !== JSON.stringify(nutrition)) {
          setNutrition(nextNut);
        }
      }
    };
    window.addEventListener('pulsegrid-nutrition-update', handleUpdate);
    return () => window.removeEventListener('pulsegrid-nutrition-update', handleUpdate);
  }, [nutrition]);

  // Increment Macro Counters
  const adjustWater = (amount: number) => {
    setNutrition(prev => ({
      ...prev,
      loggedWater: Math.max(0, Math.min(6000, prev.loggedWater + amount))
    }));
  };

  // Add Custom Manual Macro Log
  const handleAddMacroLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim()) return;

    setNutrition(prev => ({
      ...prev,
      loggedCalories: prev.loggedCalories + mealCal,
      loggedProtein: prev.loggedProtein + mealProt,
      loggedCarbs: prev.loggedCarbs + mealCarbs,
      loggedFats: prev.loggedFats + mealFats
    }));

    // Add to today's custom snack roster dynamically
    setMealsPlan(prev => {
      const currentDayMeals = prev[activeDay] || [];
      const newMeal: Meal = {
        type: mealType,
        name: mealName.trim(),
        calories: mealCal,
        protein: mealProt,
        carbs: mealCarbs,
        fats: mealFats,
        logged: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        details: 'Manually logged snack record'
      };
      return {
        ...prev,
        [activeDay]: [...currentDayMeals, newMeal]
      };
    });

    setMealName('');
    setMealCal(350);
    setMealProt(25);
    setMealCarbs(40);
    setMealFats(10);
    setShowLogDrawer(false);
  };

  // Log a pre-planned weekly meal
  const handleLogPlannedMeal = (day: string, mealIndex: number) => {
    const meals = mealsPlan[day];
    if (!meals || !meals[mealIndex]) return;

    const targetMeal = meals[mealIndex];
    if (targetMeal.logged) return; // already logged

    setNutrition(prev => ({
      ...prev,
      loggedCalories: prev.loggedCalories + targetMeal.calories,
      loggedProtein: prev.loggedProtein + targetMeal.protein,
      loggedCarbs: prev.loggedCarbs + targetMeal.carbs,
      loggedFats: prev.loggedFats + targetMeal.fats
    }));

    setMealsPlan(prev => {
      const dayMeals = [...prev[day]];
      dayMeals[mealIndex] = { ...dayMeals[mealIndex], logged: true };
      return {
        ...prev,
        [day]: dayMeals
      };
    });
  };

  // Call AI Nutritionist API
  const handleQueryAI = async (queryText: string) => {
    if (!queryText.trim() || aiLoading) return;

    const userMsg = { role: 'user' as const, content: queryText };
    setAiLogs(prev => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    // Context preparation representing current logged diet
    const auditContext = `
      [DIET PROGRESS FOR PATIENT]
      - Active Calories Logged: ${nutrition.loggedCalories}/${nutrition.targetCalories} kcal
      - Protein Intake: ${nutrition.loggedProtein}/${nutrition.targetProtein}g
      - Carbohydrates: ${nutrition.loggedCarbs}/${nutrition.targetCarbs}g
      - Fats Logged: ${nutrition.loggedFats}/${nutrition.targetFats}g
      - Water Consumed: ${nutrition.loggedWater}/${nutrition.targetWater}ml
      
      Suggest adjustments, keto dinner alternatives, sugar checks, or direct metabolic auditing report.
    `;

    try {
      const response = await fetch('http://localhost:4000/api/emergency/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          type: 'analytics',
          messages: [
            { role: 'system', content: `You are an expert AI clinical nutritionist chatbot. Analyze diet logs, suggest premium macro strategies, recommend healthy recipes, and log calories. Current Patient Macro Logs: ${auditContext}` },
            ...aiLogs,
            userMsg
          ],
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const botMsg = data.choices?.[0]?.message || {
          role: 'assistant',
          content: 'I have compiled your audit. Let me know if you would like me to suggest a full meal prep plan!'
        };
        setAiLogs(prev => [...prev, botMsg]);
      }
    } catch (err) {
      console.error(err);
      setAiLogs(prev => [
        ...prev,
        { role: 'assistant', content: 'Metabolic networks are busy at this moment. I have logged your request; please try running the audit trigger again shortly.' }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // SVG Caloric Progress Calculator
  const calPercent = Math.min(100, Math.round((nutrition.loggedCalories / nutrition.targetCalories) * 100));
  const r = 85;
  const circ = 2 * Math.PI * r;
  const strokeOffset = circ - (calPercent / 100) * circ;

  return (
    <div className="p-6 animate-fade-in space-y-6 max-w-7xl mx-auto text-white">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
             Smart Diet & Nutrition Plan
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time metabolic logging, customized macro wheels, and automated AI nutrition diagnostics.
          </p>
        </div>
        <button
          onClick={() => setShowLogDrawer(true)}
          className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cyan-900/25 flex items-center gap-2 self-start md:self-auto"
        >
          <span></span> Quick Log Meal
        </button>
      </div>

      {/* Main Row: Calorie Radial & Macros Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Caloric Radial Gauge */}
        <div className="lg:col-span-4 bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Daily Calorie Target</h4>
          
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              {/* Back track */}
              <circle
                cx="100"
                cy="100"
                r={r}
                className="stroke-slate-800"
                strokeWidth="14"
                fill="transparent"
              />
              {/* Active bar */}
              <circle
                cx="100"
                cy="100"
                r={r}
                className="stroke-cyan-500 transition-all duration-1000 ease-out"
                strokeWidth="14"
                fill="transparent"
                strokeDasharray={circ}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black">{nutrition.loggedCalories}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">/ {nutrition.targetCalories} kcal</span>
              <span className="text-xs font-black text-cyan-400 mt-2 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded-full">{calPercent}% Met</span>
            </div>
          </div>

          <div className="mt-6 text-xs text-slate-400 font-semibold leading-relaxed">
            Remaining to consume today: <strong className="text-emerald-400 font-black">{Math.max(0, nutrition.targetCalories - nutrition.loggedCalories)} kcal</strong>
          </div>
        </div>

        {/* Macro Nutrient Grid */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Protein Card */}
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 flex flex-col justify-between hover:border-cyan-500/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm"></span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Protein</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Muscle mass synthesis</p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-400">{nutrition.loggedProtein} / {nutrition.targetProtein} g</span>
            </div>
            <div className="mt-6 space-y-2">
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-white/5">
                <div 
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (nutrition.loggedProtein / nutrition.targetProtein) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 tracking-wider">
                <span>0g</span>
                <span className="text-cyan-400">{Math.max(0, nutrition.targetProtein - nutrition.loggedProtein)}g remaining</span>
                <span>{nutrition.targetProtein}g</span>
              </div>
            </div>
          </div>

          {/* Carbs Card */}
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 flex flex-col justify-between hover:border-amber-500/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm"></span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Carbohydrates</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Energy & metabolic fuel</p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-400">{nutrition.loggedCarbs} / {nutrition.targetCarbs} g</span>
            </div>
            <div className="mt-6 space-y-2">
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-white/5">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (nutrition.loggedCarbs / nutrition.targetCarbs) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 tracking-wider">
                <span>0g</span>
                <span className="text-amber-400">{Math.max(0, nutrition.targetCarbs - nutrition.loggedCarbs)}g remaining</span>
                <span>{nutrition.targetCarbs}g</span>
              </div>
            </div>
          </div>

          {/* Fats Card */}
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 flex flex-col justify-between hover:border-emerald-500/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm"></span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Healthy Fats</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Hormonal & brain health</p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-400">{nutrition.loggedFats} / {nutrition.targetFats} g</span>
            </div>
            <div className="mt-6 space-y-2">
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-white/5">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (nutrition.loggedFats / nutrition.targetFats) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 tracking-wider">
                <span>0g</span>
                <span className="text-emerald-400">{Math.max(0, nutrition.targetFats - nutrition.loggedFats)}g remaining</span>
                <span>{nutrition.targetFats}g</span>
              </div>
            </div>
          </div>

          {/* Water Intake Card */}
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 flex flex-col justify-between hover:border-sky-500/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-sm"></span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Water Intake</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Cellular cellular hydration</p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-400">{nutrition.loggedWater} / {nutrition.targetWater} ml</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex-1 bg-slate-950 rounded-full h-2.5 overflow-hidden border border-white/5">
                <div 
                  className="bg-sky-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (nutrition.loggedWater / nutrition.targetWater) * 100)}%` }}
                />
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => adjustWater(-250)}
                  className="w-7 h-7 rounded-lg bg-slate-950 hover:bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-black active:scale-90 transition-all"
                  title="Remove 250ml"
                >
                  -
                </button>
                <button
                  onClick={() => adjustWater(250)}
                  className="w-7 h-7 rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center text-xs font-black active:scale-90 transition-all animate-pulse"
                  title="Log 250ml cup"
                >
                  +
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Roster & Ratios Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Diet Schedule Plan Desk */}
        <div className="lg:col-span-7 bg-slate-900/50 border border-white/5 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
               Roster Diet Plan
            </h3>
            
            {/* Days Horizontal Scroller */}
            <div className="flex gap-1 overflow-x-auto max-w-full pb-1 scrollbar-thin">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    activeDay === day 
                      ? 'bg-cyan-600 text-white font-black scale-105 border border-cyan-400/20' 
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Meals Table List */}
          <div className="space-y-4">
            {(mealsPlan[activeDay] || []).map((meal, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row justify-between md:items-center gap-4 ${
                  meal.logged 
                    ? 'bg-emerald-950/10 border-emerald-500/20' 
                    : 'bg-slate-950/60 border-white/5 hover:border-slate-800'
                }`}
              >
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      meal.type === 'Breakfast' ? 'bg-cyan-500/10 text-cyan-400' :
                      meal.type === 'Lunch' ? 'bg-amber-500/10 text-amber-400' :
                      meal.type === 'Dinner' ? 'bg-indigo-500/10 text-indigo-400' :
                      'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {meal.type}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">{meal.time}</span>
                    {meal.logged && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                         Logged
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-white">{meal.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{meal.details}</p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5">
                  <div className="text-right">
                    <p className="text-sm font-black text-white">{meal.calories} kcal</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g
                    </p>
                  </div>
                  {!meal.logged && (
                    <button
                      onClick={() => handleLogPlannedMeal(activeDay, index)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-emerald-600 hover:text-white border border-white/5 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 flex-shrink-0"
                    >
                      Eat & Log
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Diet Coaching Terminal */}
        <div className="lg:col-span-5 bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex flex-col h-[520px] overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-lg"></span>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">AI Nutritionist</h3>
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Clinical Audit Desk</p>
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Chat log body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin">
            {aiLogs.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-none ml-auto'
                    : 'bg-slate-950 border border-white/5 text-slate-200 rounded-tl-none mr-auto whitespace-pre-line'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-950 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2 text-cyan-400">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                  Analyzing metabolic balance...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick-action diagnostics */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => handleQueryAI('Run a detailed metabolic analysis on my logged macros for today.')}
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-white/5 text-[9px] font-black uppercase text-slate-400 hover:text-white rounded-lg transition-all text-center truncate"
            >
               Audit My Diet
            </button>
            <button
              onClick={() => handleQueryAI('Suggest a ketogenic dinner alternative that keeps my fats below 25g.')}
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-white/5 text-[9px] font-black uppercase text-slate-400 hover:text-white rounded-lg transition-all text-center truncate"
            >
               Suggest Keto Dinner
            </button>
          </div>

          {/* Input Panel */}
          <form onSubmit={(e) => { e.preventDefault(); handleQueryAI(aiInput); }} className="pt-3 border-t border-white/5 flex gap-2">
            <input
              type="text"
              placeholder="Ask nutritionist 'Keto dinner ideas' or 'fever diet'..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all font-semibold"
            />
            <button
              type="submit"
              disabled={aiLoading || !aiInput.trim()}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 active:scale-95"
            >
              Send
            </button>
          </form>
        </div>

      </div>

      {/* QUICK LOG DRAWER FORM */}
      {showLogDrawer && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogDrawer(false)} />
          
          <div className="bg-slate-950 border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden relative shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
              <h3 className="text-md font-black text-white uppercase tracking-wider flex items-center gap-2">
                 Log Food Intake
              </h3>
              <button 
                onClick={() => setShowLogDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center text-xs font-bold transition-all"
              >
                
              </button>
            </div>

            <form onSubmit={handleAddMacroLog} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Meal Type</label>
                <select
                  value={mealType}
                  onChange={(e: any) => setMealType(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white mt-1 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Food / Meal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Scrambled eggs, protein shake..."
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white mt-1 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Calories (kcal)</label>
                  <input
                    type="number"
                    value={mealCal}
                    onChange={(e) => setMealCal(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white mt-1 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Protein (g)</label>
                  <input
                    type="number"
                    value={mealProt}
                    onChange={(e) => setMealProt(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white mt-1 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Carbs (g)</label>
                  <input
                    type="number"
                    value={mealCarbs}
                    onChange={(e) => setMealCarbs(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white mt-1 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fats (g)</label>
                  <input
                    type="number"
                    value={mealFats}
                    onChange={(e) => setMealFats(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white mt-1 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg mt-4 active:scale-95"
              >
                Log Meal to Roster
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default NutritionHub;
