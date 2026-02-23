import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Droplets
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isSameDay, isToday,
  addDays, differenceInDays, isBefore, isAfter
} from "date-fns";

function getPredictedDays(settings) {
  if (!settings?.last_period_start || !settings?.average_cycle_length) return { period: [], fertile: [], ovulation: null };
  const lastStart     = new Date(settings.last_period_start);
  const cycleLength   = settings.average_cycle_length || 28;
  const periodLength  = settings.average_period_length || 5;
  const today         = new Date();

  // Calculate next 3 cycles
  const predictedPeriod   = [];
  const predictedFertile  = [];
  let ovulationDay        = null;

  for (let cycle = 0; cycle <= 3; cycle++) {
    const cycleStart = addDays(lastStart, cycle * cycleLength);
    const cycleEnd   = addDays(cycleStart, periodLength - 1);

    // Only show future predicted days (not logged ones)
    if (isAfter(cycleStart, today) || isSameDay(cycleStart, today)) {
      for (let d = 0; d < periodLength; d++) {
        predictedPeriod.push(addDays(cycleStart, d));
      }
    }

    // Fertile window: ~days 10-16 of cycle
    const fertileStart = addDays(cycleStart, 9);
    const fertileEnd   = addDays(cycleStart, 15);
    for (let d = 0; d <= 6; d++) {
      const fertileDay = addDays(fertileStart, d);
      if (isAfter(fertileDay, today) || isSameDay(fertileDay, today)) {
        predictedFertile.push(fertileDay);
      }
    }

    // Ovulation peak (~day 14)
    const ov = addDays(cycleStart, 13);
    if ((isAfter(ov, today) || isSameDay(ov, today)) && !ovulationDay) {
      ovulationDay = ov;
    }
  }

  return { period: predictedPeriod, fertile: predictedFertile, ovulation: ovulationDay };
}

export default function CycleCalendar({ logs = [], settings = null, onDayClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart   = startOfMonth(currentMonth);
  const monthEnd     = endOfMonth(currentMonth);
  const days         = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const { period: predictedPeriod, fertile: predictedFertile, ovulation: ovulationDay } = getPredictedDays(settings);

  const getLogsForDay = (day) => logs.filter((l) => isSameDay(new Date(l.date), day));

  const isPredictedPeriod  = (day) => predictedPeriod.some((d) => isSameDay(d, day));
  const isPredictedFertile = (day) => predictedFertile.some((d) => isSameDay(d, day));
  const isOvulation        = (day) => ovulationDay && isSameDay(ovulationDay, day);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>
        <h3 className="text-base font-semibold text-slate-800">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {days.map((day) => {
          const dayLogs   = getLogsForDay(day);
          const periodLog = dayLogs.find((l) => l.log_type === "period");
          const isPeriod  = !!periodLog;
          const hasSymptom = dayLogs.some((l) => (l.symptoms || []).filter(s => !s.startsWith("med:")).length > 0);
          const hasMood    = dayLogs.some((l) => (l.moods || []).length > 0);
          const hasMed     = dayLogs.some((l) => (l.symptoms || []).some(s => s.startsWith("med:")));
          const today      = isToday(day);
          const predPeriod = !isPeriod && isPredictedPeriod(day);
          const fertile    = !isPeriod && isPredictedFertile(day);
          const ov         = !isPeriod && isOvulation(day);

          let cellClass = "text-slate-600 hover:bg-slate-50";
          let textColor = "";

          if (isPeriod) {
            cellClass = "bg-rose-500 text-white font-semibold";
          } else if (predPeriod) {
            cellClass = "bg-rose-100 text-rose-400 font-medium";
          } else if (ov) {
            cellClass = "bg-emerald-100 text-emerald-700 font-semibold ring-2 ring-emerald-300";
          } else if (fertile) {
            cellClass = "bg-emerald-50 text-emerald-600";
          } else if (today) {
            cellClass = "bg-violet-50 text-violet-700 font-semibold ring-2 ring-violet-200";
          }

          return (
            <motion.button
              key={day.toISOString()}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDayClick?.(day)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all ${cellClass}`}
            >
              {format(day, "d")}
              <div className="flex gap-0.5 mt-0.5 absolute bottom-1">
                {isPeriod && <Droplets className="w-2 h-2 text-white opacity-80" />}
                {predPeriod && <div className="w-1.5 h-1.5 rounded-full bg-rose-300" />}
                {hasSymptom && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                {hasMood    && <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
                {hasMed     && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-50">
        {[
          { color: "bg-rose-500",    label: "Period" },
          { color: "bg-rose-200",    label: "Predicted" },
          { color: "bg-emerald-100 ring-1 ring-emerald-300", label: "Ovulation" },
          { color: "bg-emerald-50 border border-emerald-200",  label: "Fertile" },
          { color: "bg-amber-400",   label: "Symptoms" },
          { color: "bg-blue-400",    label: "Meds" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
