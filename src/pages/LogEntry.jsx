import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format, getDaysInMonth, isSameDay } from "date-fns";
import {
  ArrowLeft, Check, ChevronRight, Droplets, Heart, Brain,
  Pencil, Dumbbell, Moon, GlassWater, Zap, Pill, ChevronDown
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FlowPicker from "@/components/log/FlowPicker";
import SymptomPicker from "@/components/log/SymptomPicker";
import MoodPicker from "@/components/log/MoodPicker";
import MedicationPicker from "@/components/log/MedicationPicker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const STEPS = ["date", "flow", "symptoms", "mood", "lifestyle", "medications", "notes"];

function buildDateFromParts(year, month, day) {
  return new Date(year, month - 1, day);
}

export default function LogEntry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const now = new Date();
  const [logMonth, setLogMonth] = useState(now.getMonth() + 1);
  const [logDay,   setLogDay]   = useState(now.getDate());
  const [logYear,  setLogYear]  = useState(now.getFullYear());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Period end date
  const [hasPeriodEnd, setHasPeriodEnd] = useState(false);
  const [endMonth, setEndMonth] = useState(now.getMonth() + 1);
  const [endDay,   setEndDay]   = useState(Math.min(now.getDate() + 4, getDaysInMonth(new Date(now.getFullYear(), now.getMonth() + 1, 0))));
  const [endYear,  setEndYear]  = useState(now.getFullYear());

  const [data, setData] = useState({
    flow_intensity: null,
    symptoms: [],   // includes "med:id" entries for medications
    moods: [],
    notes: "",
    sleep_hours: "",
    sleep_quality: null,
    water_intake: "",
    exercise: false,
    exercise_type: "none",
    stress_level: null,
  });

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const daysInLogMonth = getDaysInMonth(new Date(logYear, logMonth - 1));
  const daysInEndMonth = getDaysInMonth(new Date(endYear, endMonth - 1));

  const logDate = buildDateFromParts(logYear, logMonth, logDay);

  const { data: settings } = useQuery({
    queryKey: ["cycleSettings"],
    queryFn: async () => {
      const list = await base44.entities.CycleSettings.list();
      return list[0] || null;
    },
  });

  const medications = data.symptoms.filter(s => s.startsWith("med:"));
  const symptoms    = data.symptoms.filter(s => !s.startsWith("med:"));

  const setMedications = (meds) => {
    setData({ ...data, symptoms: [...symptoms, ...meds] });
  };
  const setSymptoms = (syms) => {
    setData({ ...data, symptoms: [...syms, ...medications] });
  };

  const createLog = useMutation({
    mutationFn: async () => {
      const dateStr = format(logDate, "yyyy-MM-dd");
      const shared  = {
        date: dateStr,
        symptoms: data.symptoms,
        moods: data.moods,
        notes: data.notes,
        sleep_hours:    data.sleep_hours   ? parseFloat(data.sleep_hours)  : undefined,
        sleep_quality:  data.sleep_quality || undefined,
        water_intake:   data.water_intake  ? parseInt(data.water_intake)   : undefined,
        exercise:       data.exercise,
        exercise_type:  data.exercise_type !== "none" ? data.exercise_type : undefined,
        stress_level:   data.stress_level  || undefined,
      };

      const logs = [];

      if (data.flow_intensity) {
        logs.push({ ...shared, log_type: "period", flow_intensity: data.flow_intensity });

        // Log period end days if provided
        if (hasPeriodEnd) {
          const endDate = buildDateFromParts(endYear, endMonth, endDay);
          let current   = new Date(logDate);
          current.setDate(current.getDate() + 1);
          while (current <= endDate) {
            await base44.entities.CycleLog.create({
              date: format(current, "yyyy-MM-dd"),
              log_type: "period",
              flow_intensity: data.flow_intensity,
            });
            current.setDate(current.getDate() + 1);
          }
        }

        // Update cycle settings
        if (settings) {
          const stored = settings.last_period_start ? new Date(settings.last_period_start) : null;
          if (!stored || logDate > stored) {
            await base44.entities.CycleSettings.update(settings.id, {
              last_period_start: dateStr,
            });
          }
        } else {
          await base44.entities.CycleSettings.create({
            last_period_start: dateStr,
            average_cycle_length: 28,
            average_period_length: 5,
          });
        }
      } else {
        logs.push({
          ...shared,
          log_type: symptoms.length > 0 ? "symptom" : data.moods.length > 0 ? "mood" : "note",
        });
      }

      for (const log of logs) {
        await base44.entities.CycleLog.create(log);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentLogs"] });
      queryClient.invalidateQueries({ queryKey: ["cycleSettings"] });
      queryClient.invalidateQueries({ queryKey: ["cycleLogs"] });
      navigate(createPageUrl("Home"));
    },
  });

  // ── Date step ─────────────────────────────────────────────────────────────
  const dateStep = {
    title: "Log Date",
    icon: Pencil,
    color: "text-slate-500",
    content: (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Select Date
          </p>
          <div className="flex gap-2">
            <select
              value={logMonth}
              onChange={(e) => setLogMonth(Number(e.target.value))}
              className="flex-[2] bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={logDay}
              onChange={(e) => setLogDay(Number(e.target.value))}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              {Array.from({ length: daysInLogMonth }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={logYear}
              onChange={(e) => setLogYear(Number(e.target.value))}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">
            Selected: <span className="font-semibold text-slate-600">{format(logDate, "MMMM d, yyyy")}</span>
          </p>
        </div>
      </div>
    ),
  };

  // ── Flow step ──────────────────────────────────────────────────────────────
  const flowStep = {
    title: "Period Flow",
    icon: Droplets,
    color: "text-rose-500",
    content: (
      <div className="space-y-4">
        <FlowPicker
          selected={data.flow_intensity}
          onChange={(v) => setData({ ...data, flow_intensity: v })}
        />

        {/* Period end date */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <button
            onClick={() => setHasPeriodEnd(!hasPeriodEnd)}
            className={`flex items-center gap-2 text-sm font-medium w-full transition-colors ${
              hasPeriodEnd ? "text-rose-600" : "text-slate-500"
            }`}
          >
            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
              hasPeriodEnd ? "bg-rose-500 border-rose-500" : "border-slate-300"
            }`}>
              {hasPeriodEnd && <Check className="w-3 h-3 text-white" />}
            </div>
            Log period end date
          </button>

          <AnimatePresence>
            {hasPeriodEnd && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <p className="text-xs text-slate-400 mb-2">Period ends on:</p>
                <div className="flex gap-2">
                  <select
                    value={endMonth}
                    onChange={(e) => setEndMonth(Number(e.target.value))}
                    className="flex-[2] bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={endDay}
                    onChange={(e) => setEndDay(Number(e.target.value))}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    {Array.from({ length: daysInEndMonth }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={endYear}
                    onChange={(e) => setEndYear(Number(e.target.value))}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    ),
  };

  const stepContent = {
    date: dateStep,
    flow: flowStep,
    symptoms: {
      title: "Symptoms",
      icon: Brain,
      color: "text-amber-500",
      content: (
        <SymptomPicker
          selected={symptoms}
          onChange={setSymptoms}
        />
      ),
    },
    mood: {
      title: "Mood",
      icon: Heart,
      color: "text-violet-500",
      content: (
        <MoodPicker
          selected={data.moods}
          onChange={(v) => setData({ ...data, moods: v })}
        />
      ),
    },
    lifestyle: {
      title: "Lifestyle",
      icon: Dumbbell,
      color: "text-emerald-500",
      content: (
        <div className="space-y-4">
          {/* Sleep */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-indigo-50 w-9 h-9 rounded-xl flex items-center justify-center">
                <Moon className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="text-sm font-medium text-slate-700">Sleep</span>
            </div>
            <Input
              type="number"
              placeholder="Hours (e.g. 7.5)"
              value={data.sleep_hours}
              onChange={(e) => setData({ ...data, sleep_hours: e.target.value })}
              className="rounded-xl border-slate-200 mb-3"
            />
            <p className="text-xs text-slate-400 mb-2">Sleep quality</p>
            <div className="flex gap-2">
              {[1,2,3,4,5].map((v) => (
                <button
                  key={v}
                  onClick={() => setData({ ...data, sleep_quality: v })}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    data.sleep_quality === v
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-slate-100 text-slate-400 hover:border-slate-200"
                  }`}
                >
                  {["😴","😕","😐","🙂","😄"][v-1]}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-emerald-50 w-9 h-9 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm font-medium text-slate-700">Exercise</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "none",     label: "None",     emoji: "🛋️" },
                { id: "light",    label: "Light",    emoji: "🚶" },
                { id: "moderate", label: "Moderate", emoji: "🏃" },
                { id: "intense",  label: "Intense",  emoji: "🏋️" },
              ].map((e) => (
                <button
                  key={e.id}
                  onClick={() => setData({ ...data, exercise_type: e.id, exercise: e.id !== "none" })}
                  className={`flex flex-col items-center py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                    data.exercise_type === e.id
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-slate-100 text-slate-500 hover:border-slate-200"
                  }`}
                >
                  <span className="text-lg mb-0.5">{e.emoji}</span>
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stress */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-rose-50 w-9 h-9 rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 text-rose-500" />
              </div>
              <span className="text-sm font-medium text-slate-700">Stress level</span>
            </div>
            <div className="flex gap-2">
              {[1,2,3,4,5].map((v) => (
                <button
                  key={v}
                  onClick={() => setData({ ...data, stress_level: v })}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    data.stress_level === v
                      ? v <= 2 ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : v === 3 ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-rose-400 bg-rose-50 text-rose-700"
                      : "border-slate-100 text-slate-400 hover:border-slate-200"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-300 mt-1 px-1">
              <span>Low</span><span>High</span>
            </div>
          </div>

          {/* Water */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-50 w-9 h-9 rounded-xl flex items-center justify-center">
                <GlassWater className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-sm font-medium text-slate-700">Water (glasses)</span>
            </div>
            <div className="flex gap-2 mb-2">
              {[4,6,8,10,12].map((v) => (
                <button
                  key={v}
                  onClick={() => setData({ ...data, water_intake: String(v) })}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                    data.water_intake === String(v)
                      ? "border-blue-400 bg-blue-50 text-blue-700"
                      : "border-slate-100 text-slate-400 hover:border-slate-200"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Or type custom amount..."
              value={data.water_intake}
              onChange={(e) => setData({ ...data, water_intake: e.target.value })}
              className="rounded-xl border-slate-200"
            />
          </div>
        </div>
      ),
    },
    medications: {
      title: "Medications",
      icon: Pill,
      color: "text-blue-500",
      content: (
        <MedicationPicker
          selected={medications}
          onChange={setMedications}
        />
      ),
    },
    notes: {
      title: "Notes & Diary",
      icon: Pencil,
      color: "text-slate-500",
      content: (
        <div className="space-y-3">
          <Textarea
            placeholder="How are you feeling today? Any other observations..."
            value={data.notes}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            className="min-h-[160px] rounded-2xl border-slate-200 resize-none"
          />
          <p className="text-xs text-slate-400 text-center">Your personal diary entry for this day</p>
        </div>
      ),
    },
  };

  const current = stepContent[STEPS[step]];
  const isLast  = step === STEPS.length - 1;

  const stepIcons = {
    date:        { color: "bg-slate-400" },
    flow:        { color: "bg-rose-400" },
    symptoms:    { color: "bg-amber-400" },
    mood:        { color: "bg-violet-400" },
    lifestyle:   { color: "bg-emerald-400" },
    medications: { color: "bg-blue-400" },
    notes:       { color: "bg-slate-400" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 pt-4 pb-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to={createPageUrl("Home")} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">
            {format(logDate, "MMMM d, yyyy")}
          </p>
          {!isSameDay(logDate, new Date()) && (
            <p className="text-[10px] text-violet-500 font-medium">Logging past date</p>
          )}
        </div>
        <div className="w-9" />
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < step
                ? "bg-rose-300"
                : i === step
                ? "bg-rose-500"
                : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.22 }}
        >
          <div className="flex items-center gap-2 mb-5">
            <current.icon className={`w-5 h-5 ${current.color}`} />
            <h2 className="text-lg font-semibold text-slate-800">{current.title}</h2>
            <span className="text-xs text-slate-400 ml-auto">
              {step + 1} / {STEPS.length}
            </span>
          </div>
          {current.content}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="flex-1 rounded-xl h-12"
          >
            Back
          </Button>
        )}
        {isLast ? (
          <Button
            onClick={() => createLog.mutate()}
            disabled={createLog.isPending}
            className="flex-1 rounded-xl h-12 bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white"
          >
            {createLog.isPending ? (
              <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                Saving...
              </motion.span>
            ) : (
              <><Check className="w-4 h-4 mr-2" /> Save Log</>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => setStep(step + 1)}
            className="flex-1 rounded-xl h-12 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
