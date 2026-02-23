import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { differenceInDays, parseISO, format, addDays } from "date-fns";

/**
 * Computes next period prediction purely from logged data (no API call).
 */
function computePrediction(logs, settings) {
  const periodLogs = logs
    .filter(l => l.log_type === "period" && l.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (periodLogs.length < 2) return null;

  // Find actual period start dates (gaps > 1 day between consecutive period logs)
  const startDates = [];
  for (let i = 0; i < periodLogs.length; i++) {
    if (i === 0) { startDates.push(new Date(periodLogs[i].date)); continue; }
    const gap = differenceInDays(new Date(periodLogs[i].date), new Date(periodLogs[i - 1].date));
    if (gap > 1) startDates.push(new Date(periodLogs[i].date));
  }

  if (startDates.length < 2) return null;

  // Calculate inter-cycle lengths
  const cycleLengths = [];
  for (let i = 1; i < startDates.length; i++) {
    const diff = differenceInDays(startDates[i], startDates[i - 1]);
    if (diff >= 18 && diff <= 50) cycleLengths.push(diff);
  }

  if (cycleLengths.length === 0) {
    cycleLengths.push(settings?.average_cycle_length || 28);
  }

  // Weighted average (recent cycles weighted more)
  let totalWeight = 0, weightedSum = 0;
  cycleLengths.forEach((len, i) => {
    const w = i + 1;
    weightedSum += len * w;
    totalWeight += w;
  });
  const avgLen = Math.round(weightedSum / totalWeight);

  // Standard deviation for confidence bands
  const mean    = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
  const stdDev  = Math.sqrt(
    cycleLengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / cycleLengths.length
  );

  const confidence = stdDev <= 2 ? "high" : stdDev <= 5 ? "medium" : "low";
  const lastStart  = startDates[startDates.length - 1];

  const predictedDate = addDays(lastStart, avgLen);
  const rangeStart    = addDays(predictedDate, -Math.ceil(stdDev));
  const rangeEnd      = addDays(predictedDate, Math.ceil(stdDev));

  const insight = cycleLengths.length >= 3
    ? `${avgLen}-day average across ${cycleLengths.length} tracked cycles`
    : `Based on ${cycleLengths.length} recorded cycle${cycleLengths.length > 1 ? "s" : ""}`;

  return {
    predicted_date: format(predictedDate, "yyyy-MM-dd"),
    range_start:    format(rangeStart,    "yyyy-MM-dd"),
    range_end:      format(rangeEnd,      "yyyy-MM-dd"),
    confidence,
    insight,
  };
}

export default function AIPrediction({ logs, settings, onPrediction }) {
  const prediction = useMemo(() => {
    const p = computePrediction(logs, settings);
    onPrediction?.(p);
    return p;
  }, [logs?.length, settings?.last_period_start]);

  if (!settings?.last_period_start || !prediction) return null;

  const confidenceColors = {
    high:   "text-emerald-600 bg-emerald-50 border-emerald-100",
    medium: "text-amber-600  bg-amber-50  border-amber-100",
    low:    "text-slate-500  bg-slate-100 border-slate-200",
  };

  const predictedLabel = (() => {
    try { return format(parseISO(prediction.predicted_date), "MMM d"); }
    catch { return prediction.predicted_date; }
  })();

  const rangeLabel = (() => {
    try {
      return `${format(parseISO(prediction.range_start), "MMM d")} – ${format(parseISO(prediction.range_end), "MMM d")}`;
    } catch { return null; }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-violet-50 to-rose-50 rounded-2xl p-4 border border-violet-100 mb-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Prediction</span>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ml-auto capitalize border ${
          confidenceColors[prediction.confidence] || confidenceColors.low
        }`}>
          {prediction.confidence} confidence
        </span>
      </div>
      <div className="flex items-end gap-3">
        <div>
          <p className="text-2xl font-bold text-slate-800">{predictedLabel}</p>
          {rangeLabel && <p className="text-xs text-slate-400 mt-0.5">Range: {rangeLabel}</p>}
        </div>
      </div>
      {prediction.insight && (
        <p className="text-xs text-slate-500 mt-2 italic">"{prediction.insight}"</p>
      )}
    </motion.div>
  );
}
