import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Save, Check, LogOut, Plus, X, Smile } from "lucide-react";
import { toast } from "sonner";
import RemindersSection from "@/components/settings/RemindersSection";

const CUSTOM_SYMPTOMS_KEY = "auracycle_custom_symptoms";

function loadCustomSymptoms() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_SYMPTOMS_KEY) || "[]");
  } catch { return []; }
}

function saveCustomSymptoms(list) {
  localStorage.setItem(CUSTOM_SYMPTOMS_KEY, JSON.stringify(list));
}

const EMOJI_OPTIONS = ["😣","💊","🤒","🥴","😰","😤","💆","🦴","🌡️","😩","😫","🤧","💤","🥱","😶","🫀","🫁","🧠","👁️","👂","🦷","💪","🤸","🏃","🧘","💅","🛁","🍃","🌿","🌸","⚡","🔥","❄️","💧","🌊","🎯","⭐","✨"];

export default function Settings() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [customSymptoms, setCustomSymptoms] = useState(loadCustomSymptoms);
  const [newSymptomLabel, setNewSymptomLabel] = useState("");
  const [newSymptomEmoji, setNewSymptomEmoji] = useState("😣");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAddSymptom, setShowAddSymptom] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["cycleSettings"],
    queryFn: async () => {
      const list = await base44.entities.CycleSettings.list();
      return list[0] || null;
    },
  });

  const [form, setForm] = useState({
    average_cycle_length: 28,
    average_period_length: 5,
    last_period_start: "",
    notifications_enabled: true,
    birth_year: "",
    reminder_period_enabled: false,
    reminder_period_time: "08:00",
    reminder_symptoms_enabled: false,
    reminder_symptoms_time: "20:00",
    reminder_mood_enabled: false,
    reminder_mood_time: "21:00",
    reminder_daily_tip_enabled: false,
    reminder_daily_tip_time: "09:00",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        average_cycle_length:       settings.average_cycle_length || 28,
        average_period_length:      settings.average_period_length || 5,
        last_period_start:          settings.last_period_start || "",
        notifications_enabled:      settings.notifications_enabled !== false,
        birth_year:                 settings.birth_year || "",
        reminder_period_enabled:    settings.reminder_period_enabled || false,
        reminder_period_time:       settings.reminder_period_time || "08:00",
        reminder_symptoms_enabled:  settings.reminder_symptoms_enabled || false,
        reminder_symptoms_time:     settings.reminder_symptoms_time || "20:00",
        reminder_mood_enabled:      settings.reminder_mood_enabled || false,
        reminder_mood_time:         settings.reminder_mood_time || "21:00",
        reminder_daily_tip_enabled: settings.reminder_daily_tip_enabled || false,
        reminder_daily_tip_time:    settings.reminder_daily_tip_time || "09:00",
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...form,
        average_cycle_length: parseInt(form.average_cycle_length),
        average_period_length: parseInt(form.average_period_length),
        birth_year: form.birth_year ? parseInt(form.birth_year) : undefined,
      };
      if (settings) {
        await base44.entities.CycleSettings.update(settings.id, data);
      } else {
        await base44.entities.CycleSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycleSettings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const addCustomSymptom = () => {
    const label = newSymptomLabel.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const updated = [...customSymptoms, { id: `custom_${id}`, emoji: newSymptomEmoji, label }];
    setCustomSymptoms(updated);
    saveCustomSymptoms(updated);
    setNewSymptomLabel("");
    setNewSymptomEmoji("😣");
    setShowAddSymptom(false);
    toast.success(`"${label}" added to your symptoms list!`);
  };

  const removeCustomSymptom = (id) => {
    const updated = customSymptoms.filter(s => s.id !== id);
    setCustomSymptoms(updated);
    saveCustomSymptoms(updated);
  };

  return (
    <div className="pb-24 px-4 pt-4 max-w-lg mx-auto">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xl font-bold text-slate-800 mb-6"
      >
        Settings
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        {/* Cycle Settings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <SettingsIcon className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-700">Cycle Settings</h3>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-600">Average Cycle Length (days)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={form.average_cycle_length}
                onChange={(e) => setForm({ ...form, average_cycle_length: e.target.value })}
                className="rounded-xl flex-1"
                min={20} max={45}
              />
              <span className="text-xs text-slate-400">20–45 days</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-600">Average Period Length (days)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={form.average_period_length}
                onChange={(e) => setForm({ ...form, average_period_length: e.target.value })}
                className="rounded-xl flex-1"
                min={1} max={10}
              />
              <span className="text-xs text-slate-400">1–10 days</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-600">Last Period Start Date</Label>
            <Input
              type="date"
              value={form.last_period_start}
              onChange={(e) => setForm({ ...form, last_period_start: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-600">Birth Year</Label>
            <Input
              type="number"
              value={form.birth_year}
              onChange={(e) => setForm({ ...form, birth_year: e.target.value })}
              className="rounded-xl"
              placeholder="e.g. 1995"
            />
          </div>
        </div>

        {/* Custom Symptoms */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700">Custom Symptoms</h3>
            </div>
            <button
              onClick={() => setShowAddSymptom(!showAddSymptom)}
              className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {customSymptoms.length === 0 && !showAddSymptom && (
            <p className="text-xs text-slate-400 text-center py-3">
              No custom symptoms yet. Add ones that aren't in the default list.
            </p>
          )}

          {/* Existing custom symptoms */}
          {customSymptoms.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {customSymptoms.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-medium px-2.5 py-1.5 rounded-xl"
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                  <button
                    onClick={() => removeCustomSymptom(s.id)}
                    className="ml-0.5 text-amber-400 hover:text-amber-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new custom symptom */}
          {showAddSymptom && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 pt-2 border-t border-slate-100"
            >
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-12 h-10 bg-slate-50 border border-slate-200 rounded-xl text-lg flex items-center justify-center hover:bg-slate-100 transition-colors flex-shrink-0"
                >
                  {newSymptomEmoji}
                </button>
                <Input
                  placeholder="Symptom name..."
                  value={newSymptomLabel}
                  onChange={(e) => setNewSymptomLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomSymptom()}
                  className="rounded-xl border-slate-200 flex-1"
                  autoFocus
                />
              </div>

              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-100"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {EMOJI_OPTIONS.map((em) => (
                      <button
                        key={em}
                        onClick={() => { setNewSymptomEmoji(em); setShowEmojiPicker(false); }}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                          newSymptomEmoji === em ? "bg-amber-100 ring-2 ring-amber-400" : "hover:bg-slate-100"
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={addCustomSymptom}
                  disabled={!newSymptomLabel.trim()}
                  className="flex-1 rounded-xl h-9 bg-amber-500 hover:bg-amber-600 text-white text-sm"
                >
                  Add Symptom
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowAddSymptom(false); setNewSymptomLabel(""); }}
                  className="flex-1 rounded-xl h-9 text-sm"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        <RemindersSection form={form} setForm={setForm} />

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full rounded-xl h-12 bg-gradient-to-r from-violet-500 to-rose-500 hover:from-violet-600 hover:to-rose-600 text-white"
        >
          {saved ? (
            <><Check className="w-4 h-4 mr-2" /> Saved!</>
          ) : saveMutation.isPending ? (
            "Saving..."
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Settings</>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => base44.auth.logout()}
          className="w-full rounded-xl h-12 text-slate-500 border-slate-200"
        >
          <LogOut className="w-4 h-4 mr-2" /> Log Out
        </Button>
      </motion.div>
    </div>
  );
}
