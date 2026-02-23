import React from "react";
import { motion } from "framer-motion";

function PhaseArc({ startDay, endDay, cycleLength, radius, strokeWidth, color, opacity = 1 }) {
  const circumference = 2 * Math.PI * radius;
  const arcLength = Math.max(0, ((endDay - startDay + 1) / cycleLength) * circumference - 3);
  const gap = circumference - arcLength;
  const startOffset = ((startDay - 1) / cycleLength) * circumference;

  return (
    <circle
      cx={130} cy={130} r={radius}
      fill="none" stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={`${arcLength} ${gap}`}
      strokeDashoffset={-startOffset}
      strokeLinecap="butt"
      opacity={opacity}
      style={{ transform: "rotate(-90deg)", transformOrigin: "130px 130px" }}
    />
  );
}

export default function CycleWheel({
  cycleDay,
  cycleLength = 28,
  periodLength = 5,
  phase,
  prediction = null,
}) {
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cycleDay / cycleLength) * circumference;

  const phaseColors = {
    period:     { stroke: "#E8456B", text: "Period",     sub: "Time to rest & recharge" },
    follicular: { stroke: "#8B5CF6", text: "Follicular", sub: "Energy is building" },
    ovulation:  { stroke: "#10B981", text: "Ovulation",  sub: "Peak fertility window" },
    luteal:     { stroke: "#F59E0B", text: "Luteal",     sub: "Winding down" },
  };
  const currentPhase = phaseColors[phase] || phaseColors.follicular;

  // Phase day ranges
  const follicularStart = periodLength + 1;
  const ovulationStart = Math.min(Math.max(periodLength + 7, 11), cycleLength - 7);
  const ovulationEnd   = Math.min(ovulationStart + 3, cycleLength - 4);
  const lutealStart    = ovulationEnd + 1;

  const phases = [
    { label: "Period",     start: 1,              end: periodLength,      color: "#E8456B" },
    { label: "Follicular", start: follicularStart, end: ovulationStart - 1, color: "#8B5CF6" },
    { label: "Ovulation",  start: ovulationStart,  end: ovulationEnd,      color: "#10B981" },
    { label: "Luteal",     start: lutealStart,     end: cycleLength,       color: "#F59E0B" },
  ];

  // Current day dot position
  const currentAngle = (cycleDay / cycleLength) * 2 * Math.PI - Math.PI / 2;
  const dotX = 130 + radius * Math.cos(currentAngle);
  const dotY = 130 + radius * Math.sin(currentAngle);

  // Ovulation peak marker
  const ovulationMidDay = Math.round((ovulationStart + ovulationEnd) / 2);
  const ovAngle = (ovulationMidDay / cycleLength) * 2 * Math.PI - Math.PI / 2;
  const ovX = 130 + radius * Math.cos(ovAngle);
  const ovY = 130 + radius * Math.sin(ovAngle);

  // AI prediction outer ring
  let predictedStart = null, predictedEnd = null;
  if (prediction?.range_start && prediction?.range_end) {
    try {
      const today = new Date();
      const daysToRangeStart = Math.round((new Date(prediction.range_start).getTime() - today.getTime()) / 86400000);
      const daysToRangeEnd   = Math.round((new Date(prediction.range_end).getTime()   - today.getTime()) / 86400000);
      if (daysToRangeStart <= cycleLength - cycleDay + 3) {
        predictedStart = Math.max(1, cycleDay + daysToRangeStart);
        predictedEnd   = Math.min(cycleLength, cycleDay + daysToRangeEnd);
        if (predictedStart > cycleLength) { predictedStart = null; predictedEnd = null; }
      }
    } catch (_) {}
  }

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <div className="relative">
        <svg width="260" height="260" viewBox="0 0 260 260">
          {/* Gray background track */}
          <circle cx="130" cy="130" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="16" />

          {/* Phase segment arcs (subtle background) */}
          {phases.map((p, i) => (
            <PhaseArc
              key={i}
              startDay={p.start} endDay={p.end}
              cycleLength={cycleLength}
              radius={radius} strokeWidth={16}
              color={p.color} opacity={0.15}
            />
          ))}

          {/* Fertile window extra highlight */}
          <PhaseArc
            startDay={ovulationStart} endDay={ovulationEnd}
            cycleLength={cycleLength}
            radius={radius} strokeWidth={16}
            color="#10B981" opacity={0.28}
          />

          {/* AI predicted period – outer thin ring */}
          {predictedStart && predictedEnd && (
            <PhaseArc
              startDay={predictedStart} endDay={predictedEnd}
              cycleLength={cycleLength}
              radius={114} strokeWidth={5}
              color="#E8456B" opacity={0.75}
            />
          )}

          {/* Main progress arc */}
          <motion.circle
            cx="130" cy="130" r={radius}
            fill="none" stroke={currentPhase.stroke}
            strokeWidth="16" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ transform: "rotate(-90deg)", transformOrigin: "130px 130px" }}
          />

          {/* Ovulation peak marker (green diamond-like dot) */}
          <motion.circle
            cx={ovX} cy={ovY} r="5"
            fill="#10B981" stroke="white" strokeWidth="2"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "period" || phase === "follicular" ? 0.9 : 0.6 }}
            transition={{ delay: 1.3 }}
          />

          {/* Current day dot */}
          <motion.circle
            cx={dotX} cy={dotY} r="10"
            fill={currentPhase.stroke} stroke="white" strokeWidth="3"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, type: "spring", stiffness: 200 }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center px-6"
          >
            <p className="text-4xl font-light text-slate-800 leading-none">Day {cycleDay}</p>
            <p className="text-sm font-semibold mt-2" style={{ color: currentPhase.stroke }}>
              {currentPhase.text} Phase
            </p>
            <p className="text-[11px] text-slate-400 mt-1 leading-tight">{currentPhase.sub}</p>
          </motion.div>
        </div>
      </div>

      {/* Phase row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex gap-1.5 mt-3 w-full max-w-[260px]"
      >
        {phases.map((p) => {
          const active = cycleDay >= p.start && cycleDay <= p.end;
          return (
            <div
              key={p.label}
              className="flex-1 rounded-xl text-center py-1.5 transition-all"
              style={{
                backgroundColor: active ? p.color + "20" : "#F9FAFB",
                borderBottom: `3px solid ${active ? p.color : p.color + "50"}`,
              }}
            >
              <p className="text-[9px] font-bold" style={{ color: p.color }}>
                {p.label}
              </p>
              <p className="text-[9px] text-slate-400">{p.start}–{p.end}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex items-center gap-3 mt-2 flex-wrap justify-center"
      >
        <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 opacity-80" />
          Fertile window
        </span>
        {predictedStart && (
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 opacity-80" />
            AI predicted period
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
