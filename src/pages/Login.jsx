import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Sparkles, ArrowRight, User, Lock } from "lucide-react";
import { register, login } from "@/lib/userAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login({ onLogin }) {
  const [mode,     setMode]     = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setUsername("");
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await register(username, password);
      } else {
        await login(username, password);
      }
      onLogin?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-violet-50 to-slate-50 flex flex-col items-center justify-center px-5">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-400 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200">
          <Sparkles className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">AuraCycle</h1>
        <p className="text-slate-400 text-sm mt-1">Your personal cycle companion</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-slate-100 p-6 border border-slate-100"
      >
        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
          {[
            { key: "login",    label: "Sign In" },
            { key: "register", label: "Create Account" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                mode === key
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === "register" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === "register" ? -20 : 20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg font-bold text-slate-800 mb-5">
              {mode === "login" ? "Welcome back 👋" : "Get started 🌸"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 rounded-xl border-slate-200 h-12 text-sm"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder={mode === "register" ? "Create a password (min 4 chars)" : "Password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 rounded-xl border-slate-200 h-12 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={loading || !username.trim() || !password}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-400 to-violet-500 hover:from-rose-500 hover:to-violet-600 text-white font-semibold text-sm shadow-md shadow-rose-100"
              >
                {loading ? (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </motion.span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {mode === "login" ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </motion.div>
        </AnimatePresence>

        <p className="text-xs text-slate-400 text-center mt-5 leading-relaxed">
          Your data is stored privately on this device.
          {mode === "login" && (
            <> Don't have an account?{" "}
              <button onClick={() => switchMode("register")} className="text-violet-500 font-medium hover:underline">
                Create one
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
