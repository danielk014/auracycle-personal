import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Droplets } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday } from "date-fns";

export default function CycleCalendar({ logs = [], onDayClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const getLogForDay = (day) => {
    return logs.find((l) => isSameDay(new Date(l.date), day));
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl hover:bg-slate-50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>
        <h3 className="text-base font-semibold text-slate-800">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl hover:bg-slate-50 transition-colors">
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const log = getLogForDay(day);
          const isPeriod = log?.log_type === "period";
          const hasSymptom = log?.symptoms?.length > 0;
          const hasMood = log?.moods?.length > 0;
          const today = isToday(day);

          return (
            <motion.button
              key={day.toISOString()}
              whileTap={{ scale: 0.92 }}
              onClick={() => onDayClick?.(day)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all ${
                isPeriod
                  ? "bg-rose-100 text-rose-700 font-semibold"
                  : today
                  ? "bg-violet-50 text-violet-700 font-semibold ring-2 ring-violet-200"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {format(day, "d")}
              <div className="flex gap-0.5 mt-0.5">
                {isPeriod && <Droplets className="w-2.5 h-2.5 text-rose-400" />}
                {hasSymptom && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                {hasMood && <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}