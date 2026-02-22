import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const tips = {
  period: [
    "Stay hydrated and try warm herbal teas to ease cramps.",
    "Gentle stretching or yoga can help with period discomfort.",
    "Iron-rich foods like spinach and lentils help replenish nutrients.",
  ],
  follicular: [
    "Your energy is rising — great time for new projects and workouts!",
    "Estrogen is increasing, making this a great time for social activities.",
    "Try high-intensity workouts during this phase for best results.",
  ],
  ovulation: [
    "You're at peak energy — take advantage of it!",
    "This is your most fertile window if tracking fertility.",
    "Hydrate well and fuel with balanced meals.",
  ],
  luteal: [
    "Progesterone is rising — you may crave comfort foods.",
    "Prioritize sleep and wind-down routines this week.",
    "Magnesium-rich foods can help ease PMS symptoms.",
  ],
};

export default function DailyTip({ phase }) {
  const phaseTips = tips[phase] || tips.follicular;
  const todayTip = phaseTips[new Date().getDate() % phaseTips.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-gradient-to-br from-violet-50 to-rose-50 rounded-2xl p-5 border border-violet-100/50"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-white w-7 h-7 rounded-lg flex items-center justify-center shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
        </div>
        <p className="text-sm font-semibold text-violet-700">Daily Tip</p>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{todayTip}</p>
    </motion.div>
  );
}