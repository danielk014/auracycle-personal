import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const MEDICATION_CATEGORIES = [
  {
    label: "Contraceptive",
    items: [
      { id: "birth_control_pill",  emoji: "💊", label: "Birth Control Pill" },
      { id: "birth_control_patch", emoji: "🩹", label: "Patch" },
      { id: "birth_control_iud",   emoji: "🔵", label: "IUD" },
      { id: "birth_control_ring",  emoji: "⭕", label: "Ring" },
    ],
  },
  {
    label: "Pain Relief",
    items: [
      { id: "ibuprofen",     emoji: "🔴", label: "Ibuprofen" },
      { id: "acetaminophen", emoji: "⚪", label: "Acetaminophen" },
      { id: "naproxen",      emoji: "🟡", label: "Naproxen" },
      { id: "aspirin",       emoji: "🟠", label: "Aspirin" },
    ],
  },
  {
    label: "Vitamins & Supplements",
    items: [
      { id: "iron",            emoji: "🩸", label: "Iron" },
      { id: "vitamin_d",       emoji: "☀️", label: "Vitamin D" },
      { id: "magnesium",       emoji: "✨", label: "Magnesium" },
      { id: "calcium",         emoji: "🥛", label: "Calcium" },
      { id: "folate",          emoji: "🌿", label: "Folate" },
      { id: "omega3",          emoji: "🐟", label: "Omega-3" },
      { id: "probiotic",       emoji: "🧫", label: "Probiotic" },
      { id: "evening_primrose",emoji: "🌸", label: "Evening Primrose" },
      { id: "zinc",            emoji: "💛", label: "Zinc" },
      { id: "b_complex",       emoji: "🟤", label: "B-Complex" },
    ],
  },
];

// selected = ["med:ibuprofen", "med:iron", ...]
export default function MedicationPicker({ selected = [], onChange }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const selectedIds = new Set(selected.map(s => s.replace("med:", "")));

  const toggle = (id) => {
    const medKey = `med:${id}`;
    if (selectedIds.has(id)) {
      onChange(selected.filter(s => s !== medKey));
    } else {
      onChange([...selected, medKey]);
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim().toLowerCase().replace(/\s+/g, "_");
    if (!trimmed) return;
    const medKey = `med:${trimmed}`;
    if (!selected.includes(medKey)) {
      onChange([...selected, medKey]);
    }
    setCustomInput("");
    setShowCustom(false);
  };

  return (
    <div className="space-y-4">
      {MEDICATION_CATEGORIES.map((cat) => (
        <div key={cat.label} className="bg-white rounded-2xl p-4 border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {cat.label}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {cat.items.map((med, i) => {
              const isSelected = selectedIds.has(med.id);
              return (
                <motion.button
                  key={med.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => toggle(med.id)}
                  className={`flex flex-col items-center py-2.5 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
                    isSelected
                      ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                  }`}
                >
                  <span className="text-lg mb-0.5">{med.emoji}</span>
                  <span className="text-center leading-tight text-[10px]">{med.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Custom medication */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Other
        </p>

        {/* Show selected custom meds */}
        {selected
          .filter(s => s.startsWith("med:") && !MEDICATION_CATEGORIES.flatMap(c => c.items).some(m => `med:${m.id}` === s))
          .map(s => {
            const label = s.replace("med:", "").replace(/_/g, " ");
            return (
              <div key={s} className="flex items-center gap-2 mb-2">
                <span className="flex-1 text-sm text-slate-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 capitalize">
                  💊 {label}
                </span>
                <button
                  onClick={() => onChange(selected.filter(x => x !== s))}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}

        <AnimatePresence>
          {showCustom ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2"
            >
              <Input
                placeholder="Medication name..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustom()}
                className="rounded-xl border-slate-200 flex-1"
                autoFocus
              />
              <button
                onClick={addCustom}
                className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => { setShowCustom(false); setCustomInput(""); }}
                className="px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowCustom(true)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add custom medication
            </button>
          )}
        </AnimatePresence>
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          {selected.length} medication{selected.length > 1 ? "s" : ""} logged
        </p>
      )}
    </div>
  );
}
