import React from "react";
import { motion } from "framer-motion";

const SYMPTOMS = [
  { id: "cramps", emoji: "🤕", label: "Cramps" },
  { id: "headache", emoji: "🤯", label: "Headache" },
  { id: "bloating", emoji: "🎈", label: "Bloating" },
  { id: "fatigue", emoji: "😴", label: "Fatigue" },
  { id: "backache", emoji: "💆", label: "Backache" },
  { id: "nausea", emoji: "🤢", label: "Nausea" },
  { id: "breast_tenderness", emoji: "💗", label: "Breast Tenderness" },
  { id: "acne", emoji: "😣", label: "Acne" },
  { id: "cravings", emoji: "🍫", label: "Cravings" },
  { id: "insomnia", emoji: "🌙", label: "Insomnia" },
  { id: "hot_flashes", emoji: "🔥", label: "Hot Flashes" },
  { id: "dizziness", emoji: "💫", label: "Dizziness" },
];

export default function SymptomPicker({ selected = [], onChange }) {
  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {SYMPTOMS.map((s, i) => (
        <motion.button
          key={s.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03 }}
          onClick={() => toggle(s.id)}
          className={`flex flex-col items-center py-3 px-2 rounded-2xl border-2 transition-all ${
            selected.includes(s.id)
              ? "border-rose-300 bg-rose-50 shadow-sm"
              : "border-slate-100 bg-white hover:border-slate-200"
          }`}
        >
          <span className="text-xl mb-1">{s.emoji}</span>
          <span className="text-xs font-medium text-slate-600">{s.label}</span>
        </motion.button>
      ))}
    </div>
  );
}