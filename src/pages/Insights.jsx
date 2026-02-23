import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from "recharts";
import {
  TrendingUp, Droplets, Brain, Heart, AlertTriangle,
  CheckCircle, Moon, GlassWater, Zap
} from "lucide-react";
import CycleHistoryChart from "@/components/insights/CycleHistoryChart";
import { differenceInDays, format } from "date-fns";

function detectIrregularCycles(logs) {
  const periodLogs = logs
    .filter(l => l.log_type === "period")
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (periodLogs.length < 3) return { cycleLengths: [], avg: null, isIrregular: false, min: null, max: null };

  // Find period start dates (days where previous day was NOT a period day)
  const startDates = [];
  for (let i = 0; i < periodLogs.length; i++) {
    if (i === 0) { startDates.push(new Date(periodLogs[i].date)); continue; }
    const prev = new Date(periodLogs[i - 1].date);
    const curr = new Date(periodLogs[i].date);
    const gap  = differenceInDays(curr, prev);
    if (gap > 1) startDates.push(curr); // gap > 1 means new period started
  }

  if (startDates.length < 2) return { cycleLengths: [], avg: null, isIrregular: false, min: null, max: null };

  const cycleLengths = [];
  for (let i = 1; i < startDates.length; i++) {
    const diff = differenceInDays(startDates[i], startDates[i - 1]);
    if (diff >= 18 && diff <= 50) cycleLengths.push(diff);
  }

  if (cycleLengths.length < 2) return { cycleLengths, avg: null, isIrregular: false, min: null, max: null };

  const avg = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
  const min = Math.min(...cycleLengths);
  const max = Math.max(...cycleLengths);
  const isIrregular = (max - min) > 7;

  return { cycleLengths, avg, isIrregular, min, max, startDates };
}

export default function Insights() {
  const { data: logs } = useQuery({
    queryKey: ["cycleLogs"],
    queryFn: () => base44.entities.CycleLog.list("-date", 300),
    initialData: [],
  });

  // Symptom frequency (exclude med: prefixed)
  const symptomFreq = {};
  logs.forEach((l) => {
    (l.symptoms || []).filter(s => !s.startsWith("med:")).forEach((s) => {
      const id = s.split(":")[0];
      symptomFreq[id] = (symptomFreq[id] || 0) + 1;
    });
  });
  const symptomData = Object.entries(symptomFreq)
    .map(([name, count]) => ({ name: name.replace(/_/g, " "), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Medication frequency
  const medFreq = {};
  logs.forEach((l) => {
    (l.symptoms || []).filter(s => s.startsWith("med:")).forEach((s) => {
      const id = s.replace("med:", "").replace(/_/g, " ");
      medFreq[id] = (medFreq[id] || 0) + 1;
    });
  });
  const medData = Object.entries(medFreq)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Mood frequency
  const moodFreq = {};
  logs.forEach((l) => {
    (l.moods || []).forEach((m) => {
      moodFreq[m] = (moodFreq[m] || 0) + 1;
    });
  });
  const moodData = Object.entries(moodFreq)
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const COLORS = ["#8B5CF6","#EC4899","#F59E0B","#34D399","#3B82F6","#EF4444"];

  // Flow distribution
  const flowDist = { spotting: 0, light: 0, medium: 0, heavy: 0 };
  logs.filter(l => l.flow_intensity).forEach(l => {
    flowDist[l.flow_intensity] = (flowDist[l.flow_intensity] || 0) + 1;
  });
  const flowData = Object.entries(flowDist)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  // Cycle analysis
  const { cycleLengths, avg, isIrregular, min, max } = detectIrregularCycles(logs);
  const cycleChartData = cycleLengths.map((len, i) => ({ cycle: `#${i + 1}`, days: len }));

  // Lifestyle averages during period
  const periodLogs = logs.filter(l => l.log_type === "period");
  const sleepLogs  = logs.filter(l => l.sleep_hours != null);
  const waterLogs  = logs.filter(l => l.water_intake != null);
  const avgSleep = sleepLogs.length
    ? (sleepLogs.reduce((a, l) => a + l.sleep_hours, 0) / sleepLogs.length).toFixed(1)
    : null;
  const avgWater = waterLogs.length
    ? Math.round(waterLogs.reduce((a, l) => a + l.water_intake, 0) / waterLogs.length)
    : null;
  const avgStress = logs.filter(l => l.stress_level).length
    ? (logs.filter(l => l.stress_level).reduce((a, l) => a + l.stress_level, 0) / logs.filter(l => l.stress_level).length).toFixed(1)
    : null;

  const totalLogs   = logs.length;
  const periodDays  = periodLogs.length;

  return (
    <div className="pb-24 px-4 pt-4 max-w-lg mx-auto">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xl font-bold text-slate-800 mb-5"
      >
        Insights
      </motion.h1>

      <CycleHistoryChart logs={logs} />

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: TrendingUp, label: "Total Logs",   value: totalLogs,   bg: "bg-violet-50",  color: "text-violet-500" },
          { icon: Droplets,   label: "Period Days",  value: periodDays,  bg: "bg-rose-50",    color: "text-rose-500" },
          { icon: Brain,      label: "Symptoms",     value: Object.keys(symptomFreq).length, bg: "bg-amber-50", color: "text-amber-500" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-4 border border-slate-100 text-center"
          >
            <div className={`${card.bg} w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-xl font-bold text-slate-800">{card.value}</p>
            <p className="text-xs text-slate-400">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Irregular Cycle Detection */}
      {cycleLengths.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`rounded-2xl p-5 border mb-5 ${
            isIrregular
              ? "bg-amber-50 border-amber-200"
              : "bg-emerald-50 border-emerald-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isIrregular ? "bg-amber-100" : "bg-emerald-100"
            }`}>
              {isIrregular
                ? <AlertTriangle className="w-5 h-5 text-amber-600" />
                : <CheckCircle    className="w-5 h-5 text-emerald-600" />}
            </div>
            <div>
              <p className={`text-sm font-semibold mb-0.5 ${isIrregular ? "text-amber-800" : "text-emerald-800"}`}>
                {isIrregular ? "Irregular Cycles Detected" : "Cycles Are Regular"}
              </p>
              <p className={`text-xs leading-relaxed ${isIrregular ? "text-amber-700" : "text-emerald-700"}`}>
                {isIrregular
                  ? `Your cycle length varies by ${max - min} days (${min}–${max} days). Consider speaking with a healthcare provider.`
                  : `Your cycle is consistent at about ${avg} days. Keep up the great tracking!`
                }
              </p>
              <div className="flex gap-3 mt-2">
                <span className={`text-xs font-semibold ${isIrregular ? "text-amber-700" : "text-emerald-700"}`}>
                  Avg: {avg} days
                </span>
                <span className={`text-xs ${isIrregular ? "text-amber-600" : "text-emerald-600"}`}>
                  Range: {min}–{max} days
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cycle Length Trend */}
      {cycleChartData.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 mb-5"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Cycle Length History</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={cycleChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="cycle" tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                width={28}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                formatter={(v) => [`${v} days`, "Cycle Length"]}
              />
              <Line
                type="monotone" dataKey="days"
                stroke="#8B5CF6" strokeWidth={2}
                dot={{ fill: "#8B5CF6", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Lifestyle Averages */}
      {(avgSleep || avgWater || avgStress) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 mb-5"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Lifestyle Averages</h3>
          <div className="grid grid-cols-3 gap-3">
            {avgSleep && (
              <div className="text-center bg-indigo-50 rounded-xl p-3">
                <Moon className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-800">{avgSleep}h</p>
                <p className="text-[10px] text-slate-400">Avg Sleep</p>
              </div>
            )}
            {avgWater && (
              <div className="text-center bg-blue-50 rounded-xl p-3">
                <GlassWater className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-800">{avgWater}</p>
                <p className="text-[10px] text-slate-400">Avg Water</p>
              </div>
            )}
            {avgStress && (
              <div className="text-center bg-rose-50 rounded-xl p-3">
                <Zap className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-800">{avgStress}/5</p>
                <p className="text-[10px] text-slate-400">Avg Stress</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Symptom Chart */}
      {symptomData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 mb-5"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Symptoms</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={symptomData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: "#64748B" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Bar dataKey="count" fill="#EC4899" radius={[0, 8, 8, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Medication Chart */}
      {medData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 mb-5"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Medication Usage</h3>
          <div className="space-y-3">
            {medData.map((m) => {
              const maxVal = Math.max(...medData.map(d => d.count));
              const pct    = (m.count / maxVal) * 100;
              return (
                <div key={m.name} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-24 capitalize">💊 {m.name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-300 to-blue-500 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 w-5 text-right">{m.count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Mood Chart */}
      {moodData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 mb-5"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Mood Distribution</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={moodData} cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value"
                >
                  {moodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {moodData.map((m, i) => (
              <div key={m.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-slate-500 capitalize">{m.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Flow Distribution */}
      {flowData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl p-5 border border-slate-100"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Flow Distribution</h3>
          <div className="space-y-3">
            {flowData.map((f) => {
              const maxVal = Math.max(...flowData.map(d => d.value));
              const pct    = (f.value / maxVal) * 100;
              return (
                <div key={f.name} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-16 capitalize">{f.name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-rose-300 to-rose-500 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 w-6 text-right">{f.value}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {totalLogs === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-600 mb-1">No data yet</h3>
          <p className="text-sm text-slate-400">Start logging to see your insights here.</p>
        </motion.div>
      )}
    </div>
  );
}
