import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import CycleCalendar from "@/components/calendar/CycleCalendar";
import { format, isSameDay } from "date-fns";
import { Droplets, Brain, Heart, Pencil, Plus, X, Check, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const FLOW_OPTIONS = [
  { id: "spotting", label: "Spotting", emoji: "🩸", desc: "Very light" },
  { id: "light",    label: "Light",    emoji: "🩸🩸", desc: "Light flow" },
  { id: "medium",   label: "Medium",   emoji: "🩸🩸🩸", desc: "Normal flow" },
  { id: "heavy",    label: "Heavy",    emoji: "🩸🩸🩸🩸", desc: "Heavy flow" },
];

function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

export default function Calendar() {
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  const now = new Date();
  const [startMonth, setStartMonth] = useState(now.getMonth() + 1);
  const [startDay,   setStartDay]   = useState(now.getDate());
  const [startYear,  setStartYear]  = useState(now.getFullYear());
  const [hasEnd,     setHasEnd]     = useState(false);
  const [endMonth,   setEndMonth]   = useState(now.getMonth() + 1);
  const [endDay,     setEndDay]     = useState(Math.min(now.getDate() + 4, getDaysInMonth(now.getMonth() + 1, now.getFullYear())));
  const [endYear,    setEndYear]    = useState(now.getFullYear());
  const [flowIntensity, setFlowIntensity] = useState("medium");

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const { data: logs } = useQuery({
    queryKey: ["cycleLogs"],
    queryFn: () => base44.entities.CycleLog.list("-date", 200),
    initialData: [],
  });

  const { data: settings } = useQuery({
    queryKey: ["cycleSettings"],
    queryFn: async () => {
      const list = await base44.entities.CycleSettings.list();
      return list[0] || null;
    },
  });

  const logPreviousPeriod = useMutation({
    mutationFn: async () => {
      const startDate = `${startYear}-${String(startMonth).padStart(2,"0")}-${String(startDay).padStart(2,"0")}`;

      // Create a log for start day (and update settings)
      await base44.entities.CycleLog.create({
        date: startDate,
        log_type: "period",
        flow_intensity: flowIntensity,
      });

      // If end date is set, create logs for each day of the period
      if (hasEnd) {
        const endDate = new Date(endYear, endMonth - 1, endDay);
        const start   = new Date(startYear, startMonth - 1, startDay);
        let current   = new Date(start);
        current.setDate(current.getDate() + 1); // skip start (already logged)

        while (current <= endDate) {
          await base44.entities.CycleLog.create({
            date: format(current, "yyyy-MM-dd"),
            log_type: "period",
            flow_intensity: flowIntensity,
          });
          current.setDate(current.getDate() + 1);
        }
      }

      // Update cycle settings if this is a more recent period than stored
      if (settings) {
        const stored = settings.last_period_start ? new Date(settings.last_period_start) : null;
        const newStart = new Date(startYear, startMonth - 1, startDay);
        if (!stored || newStart > stored) {
          await base44.entities.CycleSettings.update(settings.id, {
            last_period_start: format(newStart, "yyyy-MM-dd"),
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycleLogs"] });
      queryClient.invalidateQueries({ queryKey: ["cycleSettings"] });
      queryClient.invalidateQueries({ queryKey: ["recentLogs"] });
      setShowPeriodModal(false);
      toast.success("Previous period logged!");
    },
    onError: () => toast.error("Failed to save. Try again."),
  });

  const selectedLogs = selectedDay
    ? logs.filter((l) => isSameDay(new Date(l.date), selectedDay))
    : [];

  const typeIcons = {
    period:   { icon: Droplets, color: "text-rose-500",   bg: "bg-rose-50" },
    symptom:  { icon: Brain,    color: "text-amber-500",  bg: "bg-amber-50" },
    mood:     { icon: Heart,    color: "text-violet-500", bg: "bg-violet-50" },
    note:     { icon: Pencil,   color: "text-slate-500",  bg: "bg-slate-50" },
    medication:{ icon: Pill,    color: "text-blue-500",   bg: "bg-blue-50" },
  };

  const startDaysInMonth = getDaysInMonth(startMonth, startYear);
  const endDaysInMonth   = getDaysInMonth(endMonth,   endYear);

  return (
    <div className="pb-24 px-4 pt-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl font-bold text-slate-800"
        >
          Calendar
        </motion.h1>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setShowPeriodModal(true)}
          className="flex items-center gap-1.5 bg-rose-50 text-rose-500 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-rose-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Log Previous Period
        </motion.button>
      </div>

      <CycleCalendar logs={logs} settings={settings} onDayClick={setSelectedDay} />

      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5"
        >
          <h3 className="text-sm font-semibold text-slate-600 mb-3">
            {format(selectedDay, "EEEE, MMMM d")}
          </h3>
          {selectedLogs.length === 0 ? (
            <p className="text-sm text-slate-400 bg-white rounded-2xl p-4 border border-slate-100">
              No logs for this day.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedLogs.map((log) => {
                const t = typeIcons[log.log_type] || typeIcons.note;
                const symptoms = (log.symptoms || []).filter(s => !s.startsWith("med:"));
                const meds = (log.symptoms || []).filter(s => s.startsWith("med:")).map(s => s.replace("med:", "").replace(/_/g, " "));
                return (
                  <div key={log.id} className="bg-white rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`${t.bg} w-7 h-7 rounded-lg flex items-center justify-center`}>
                        <t.icon className={`w-3.5 h-3.5 ${t.color}`} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 capitalize">{log.log_type}</span>
                      {log.flow_intensity && (
                        <span className="text-xs bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full font-medium capitalize">
                          {log.flow_intensity}
                        </span>
                      )}
                    </div>
                    {symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {symptoms.map((s) => (
                          <span key={s} className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full capitalize">
                            {s.split(":")[0].replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                    {meds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {meds.map((m) => (
                          <span key={m} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">
                            💊 {m}
                          </span>
                        ))}
                      </div>
                    )}
                    {log.moods?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {log.moods.map((m) => (
                          <span key={m} className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full capitalize">
                            {m.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                    {log.notes && <p className="text-sm text-slate-500 mt-1">{log.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Previous Period Modal */}
      <AnimatePresence>
        {showPeriodModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowPeriodModal(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl px-5 pt-5 pb-10 max-w-lg mx-auto shadow-2xl"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-800">Log Previous Period</h3>
                <button onClick={() => setShowPeriodModal(false)} className="p-1.5 rounded-xl hover:bg-slate-100">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Start Date */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Period Start Date</p>
                <div className="flex gap-2">
                  <select
                    value={startMonth}
                    onChange={(e) => setStartMonth(Number(e.target.value))}
                    className="flex-[2] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={startDay}
                    onChange={(e) => setStartDay(Number(e.target.value))}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    {Array.from({ length: startDaysInMonth }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={startYear}
                    onChange={(e) => setStartYear(Number(e.target.value))}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* End Date toggle */}
              <div className="mb-4">
                <button
                  onClick={() => setHasEnd(!hasEnd)}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl transition-colors ${
                    hasEnd ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${hasEnd ? "bg-rose-500 border-rose-500" : "border-slate-300"}`}>
                    {hasEnd && <Check className="w-3 h-3 text-white" />}
                  </div>
                  Add end date (optional)
                </button>
              </div>

              {hasEnd && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Period End Date</p>
                  <div className="flex gap-2">
                    <select
                      value={endMonth}
                      onChange={(e) => setEndMonth(Number(e.target.value))}
                      className="flex-[2] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    >
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={endDay}
                      onChange={(e) => setEndDay(Number(e.target.value))}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    >
                      {Array.from({ length: endDaysInMonth }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <select
                      value={endYear}
                      onChange={(e) => setEndYear(Number(e.target.value))}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Flow Intensity */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Flow Intensity</p>
                <div className="grid grid-cols-4 gap-2">
                  {FLOW_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFlowIntensity(f.id)}
                      className={`flex flex-col items-center py-2.5 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
                        flowIntensity === f.id
                          ? "border-rose-400 bg-rose-50 text-rose-700"
                          : "border-slate-100 text-slate-500 hover:border-slate-200"
                      }`}
                    >
                      <span className="text-base mb-0.5">🩸</span>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => logPreviousPeriod.mutate()}
                disabled={logPreviousPeriod.isPending}
                className="w-full rounded-xl h-12 bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-semibold"
              >
                {logPreviousPeriod.isPending ? "Saving..." : "Save Period"}
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
