"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CallbackWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const prev = JSON.parse(localStorage.getItem("callback_prefill") || "null");
      if (prev) {
        setName(prev.name || "");
        setPhone(prev.phone || "");
      }
    } catch {}
  }, []);

  const validate = () => {
    if (!name.trim()) {
      setError("Please enter your full name.");
      return false;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return false;
    }
    setError(null);
    return true;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      localStorage.setItem("callback_prefill", JSON.stringify({ name, phone }));
    } catch {}
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setOpen(false);
      setTime("");
      setMessage("");
    }, 3000);
  };

  return (
    <div className="fixed bottom-24 right-5 z-[1000]">
      {/* Floating Button */}
      <div className="relative group">
        <button
          onClick={() => setOpen(true)}
          className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-all flex items-center justify-center"
          aria-label="Request Callback"
          title="Request Callback"
        >
          <span aria-hidden>📞</span>
        </button>
        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="rounded-md bg-slate-800 text-cyan-300 text-xs px-2 py-1 shadow-lg whitespace-nowrap">
            Request Callback
          </div>
        </div>
      </div>

      {/* Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-36 right-5 w-[92vw] max-w-xs rounded-2xl bg-slate-900 border border-cyan-700 shadow-[0_0_20px_rgba(34,211,238,0.15)] overflow-hidden"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 to-teal-500" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-cyan-300">Request a Callback</h3>
                <button
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-cyan-300"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {success ? (
                <div className="text-green-400 text-sm">
                  ✅ Thank you! Our team will call you soon.
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-3">
                  {error && <div className="text-red-400 text-xs">{error}</div>}

                  <div>
                    <label className="text-xs text-slate-400">Full Name *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Phone Number *</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      placeholder="10-digit number"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Preferred Time</label>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      <option value="">Select...</option>
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Message (optional)</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      placeholder="Short note"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-2 text-sm font-semibold hover:from-teal-400 hover:to-cyan-400 transition-all"
                  >
                    Submit
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
