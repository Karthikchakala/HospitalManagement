"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";


export default function HospitalPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gradient-to-b from-[#e8f4fc]/70 to-white/60 backdrop-blur-sm animate-fadeInScale" style={{ fontFamily: 'Inter, Poppins, Open Sans, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}>
      <div className="relative w-[92%] max-w-xl rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <button
          aria-label="Close"
          onClick={close}
          className="absolute right-3 top-3 inline-flex items-center justify-center h-7 w-7 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-transform duration-200 hover:scale-105"
        >
          ✖️
        </button>
        <div className="p-8">
          <h3 className="text-[20px] sm:text-[22px] font-semibold text-[#0077b6] mb-5">How can we help you today?</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-5 bg-white/90 shadow-sm">
              <div className="text-[#1e90ff] text-sm font-semibold mb-1">🚑 Ambulance Services</div>
              <p className="text-slate-600 text-base sm:text-sm mb-4">
                Need an ambulance? View available ambulances and driver contacts.
              </p>
              <Link
                href="/ambulances"
                onClick={close}
                className="inline-block rounded-md px-4 py-2 text-white text-sm transition-all duration-200 hover:scale-105 hover:opacity-90"
                style={{ backgroundColor: '#e63946' }}
              >
                View Ambulances
              </Link>
            </div>
            <div className="rounded-xl border border-slate-200 p-5 bg-white/90 shadow-sm">
              <div className="text-[#c1121f] text-sm font-semibold mb-1">🩸 Donate Blood</div>
              <p className="text-slate-600 text-base sm:text-sm mb-4">
                Be a Hero — Donate Blood and Save Lives.
              </p>
              <Link
                href="/donate-blood"
                onClick={close}
                className="inline-block rounded-md px-4 py-2 text-white text-sm transition-all duration-200 hover:scale-105 hover:opacity-90"
                style={{ backgroundColor: '#c1121f' }}
              >
                Donate Now
              </Link>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeInScale { from { opacity: 0; transform: scale(0.98) } to { opacity: 1; transform: scale(1) } }
        .animate-fadeInScale { animation: fadeInScale 260ms ease-out }
      `}</style>
    </div>
  );
}
