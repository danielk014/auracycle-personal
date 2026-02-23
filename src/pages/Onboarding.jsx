import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, Sparkles, Droplets, Calendar, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { getCurrentUser, setOnboardingComplete } from "@/lib/userAuth";
import { useQueryClient } from "@tanstack/react-query";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

export default function Onboarding({ onComplete }) {
  const queryClient = useQueryClient();
  const [step,       setStep]       = useState(0);
  const [saving,     setSaving]     = useState(false);
  const [cycleLen,   setCycleLen]   = useState(28);
  const [periodLen,  setPeriodLen]  = useState(5);
  const now = new Date();
  const [lpMonth, setLpMonth] = useState(now.getMonth() + 1);
  const [lpDay,   setLpDay]   = useState(now.getDate());
  const [lpYear,  setLpYear]  = useState(now.getFullYear());
  const [skipLp,  setSkipLp]  = useState(false);

  const years         = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);
  const daysInMonth   = getDaysInMonth(lpMonth, lpYear);

  const steps = [
    {
      icon: Sparkles,
      color: "from-rose-400 to-violet-500",
      title: "Welcome to AuraCycle 🌸",
      subtitle: "Let's set up your personal cycle tracking in just a few steps.",
      content: null,
    },
    {
      icon: Calendar,
      color: "from-violet-400 to-indigo-500",
      title: "Your Cycle",
      subtitle: "These help us predict your next period accurately.",
      content: (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-3">
              Average cycle length: <span className="text-violet-600 font-bold">{cycleLen} days</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {[21,24,26,28,30,32,35].map(v => (
                <button
                  key={v}
                  onClick={() => setCycleLen(v)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                    cycleLen === v
                      ? "border-violet-400 bg-violet-50 text-violet-700"
                      : "border-slate-100 text-slate-500 hover:border-slate-200"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <input
              type="range" min={18} max={45} value={cycleLen}
              onChange={e => setCycleLen(Number(e.target.value))}
              className="w-full mt-3 accent-violet-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>18 days</span><span>45 days</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-600 mb-3">
              Average period length: <span className="text-rose-500 font-bold">{periodLen} days</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {[2,3,4,5,6,7,8].map(v => (
                <button
                  key={v}
                  onClick={() => setPeriodLen(v)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                    periodLen === v
                      ? "border-rose-400 bg-rose-50 text-rose-700"
                      : "border-slate-100 text-slate-500 hover:border-slate-200"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Droplets,
      color: "from-rose-400 to-pink-500",
      title: "Last Period",
      subtitle: "When did your most recent period start? (We'll use this for predictions.)",
      content: (
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value={lpMonth}
              onChange={e => setLpMonth(Number(e.target.value))}
              className="flex-[2] bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
            <select
              value={lpDay}
              onChange={e => setLpDay(Number(e.target.value))}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d =>
                <option key={d} value={d}>{d}</option>
              )}
            </select>
            <select
              value={lpYear}
              onChange={e => setLpYear(Number(e.target.value))}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <button
            onClick={() => setSkipLp(!skipLp)}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              skipLp ? "text-slate-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
              skipLp ? "bg-slate-400 border-slate-400" : "border-slate-300"
            }`}>
              {skipLp && <Check className="w-3 h-3 text-white" />}
            </div>
            I'll add this later
          </button>
        </div>
      ),
    },
    {
      icon: Heart,
      color: "from-emerald-400 to-teal-500",
      title: "You're all set! 🎉",
      subtitle: "Start tracking your cycle, symptoms, moods, and more. Your data stays private on this device.",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: "📅", label: "Cycle Tracking" },
            { emoji: "💊", label: "Medication Logs" },
            { emoji: "😊", label: "Mood & Symptoms" },
            { emoji: "🤖", label: "AI Health Chat" },
          ].map(({ emoji, label }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
              <span className="text-2xl mb-2 block">{emoji}</span>
              <span className="text-xs font-medium text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const current  = steps[step];
  const isFirst  = step === 0;
  const isLast   = step === steps.length - 1;
  const Icon     = current.icon;

  const handleNext = async () => {
    if (!isLast) {
      setStep(step + 1);
      return;
    }

    // Save and finish
    setSaving(true);
    try {
      const user = getCurrentUser();
      const settings = {
        average_cycle_length:  cycleLen,
        average_period_length: periodLen,
        notifications_enabled: true,
      };
      if (!skipLp) {
        const pad = (n) => String(n).padStart(2, '0');
        settings.last_period_start = `${lpYear}-${pad(lpMonth)}-${pad(lpDay)}`;
      }
      await base44.entities.CycleSettings.create(settings);
      setOnboardingComplete(user.id);
      queryClient.invalidateQueries({ queryKey: ["cycleSettings"] });
      onComplete?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-violet-50 to-slate-50 flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-rose-400" : i < step ? "w-3 bg-rose-300" : "w-3 bg-slate-200"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-100 p-6 border border-slate-100"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center mb-4 shadow-md`}>
              <Icon className="w-7 h-7 text-white" />
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-2">{current.title}</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">{current.subtitle}</p>

            {current.content && (
              <div className="mb-6">{current.content}</div>
            )}

            <Button
              onClick={handleNext}
              disabled={saving}
              className={`w-full h-12 rounded-xl bg-gradient-to-r ${current.color} text-white font-semibold text-sm shadow-md`}
            >
              {saving ? (
                <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                  Setting up...
                </motion.span>
              ) : isLast ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Start Tracking
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isFirst ? "Get Started" : "Continue"}
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            {step > 0 && !isLast && (
              <button
                onClick={() => setStep(step - 1)}
                className="w-full text-center text-sm text-slate-400 mt-3 hover:text-slate-600 transition-colors"
              >
                Back
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
