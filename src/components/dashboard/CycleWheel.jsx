import React from "react";
import { motion } from "framer-motion";

export default function CycleWheel({ cycleDay, cycleLength = 28, periodLength = 5, phase }) {
  const percentage = (cycleDay / cycleLength) * 100;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const phaseColors = {
    period: { stroke: "#E8456B", bg: "from-rose-50 to-pink-50", text: "Period" },
    follicular: { stroke: "#A78BFA", bg: "from-violet-50 to-purple-50", text: "Follicular" },
    ovulation: { stroke: "#34D399", bg: "from-emerald-50 to-teal-50", text: "Ovulation" },
    luteal: { stroke: "#F59E0B", bg: "from-amber-50 to-yellow-50", text: "Luteal" },
  };

  const currentPhase = phaseColors[phase] || phaseColors.follicular;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <div className="relative">
        <svg width="260" height="260" viewBox="0 0 260 260" className="transform -rotate-90">
          <circle
            cx="130"
            cy="130"
            r={radius}
            fill="none"
            stroke="#F3E8FF"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <motion.circle
            cx="130"
            cy="130"
            r={radius}
            fill="none"
            stroke={currentPhase.stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <p className="text-5xl font-light text-slate-800">Day {cycleDay}</p>
            <p className="text-sm font-medium mt-1" style={{ color: currentPhase.stroke }}>
              {currentPhase.text} Phase
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}