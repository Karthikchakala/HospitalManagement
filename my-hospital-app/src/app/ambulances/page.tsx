"use client";
import React from "react";

const AMBULANCES = [
  { number: "AMB-01", driver: "Rajesh Kumar", phone: "9876543210", type: "Advanced" },
  { number: "AMB-02", driver: "Meena Reddy", phone: "9876501234", type: "Basic" },
  { number: "AMB-03", driver: "Aman Singh", phone: "9822001122", type: "ICU" },
  { number: "AMB-04", driver: "Karthik", phone: "9811112222", type: "Advanced" },
];

// Badge colors
const badgeClass = (t: string) => {
  const map: Record<string, string> = {
    Basic: "bg-slate-200 text-slate-800",
    Advanced: "bg-blue-200 text-blue-800",
    ICU: "bg-red-200 text-red-800",
  };
  return `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${map[t] || "bg-slate-200 text-slate-800"}`;
};

// Card background gradient based on type
const cardBg = (t: string) => {
  const map: Record<string, string> = {
    Basic: "bg-gradient-to-r from-slate-50 to-slate-100",
    Advanced: "bg-gradient-to-r from-blue-50 to-blue-100",
    ICU: "bg-gradient-to-r from-red-50 to-red-100",
  };
  return `${map[t] || "bg-white"}`;
};

export default function AmbulancesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2 text-center drop-shadow-sm">
          Our Ambulance Services
        </h1>
        <p className="text-blue-800 mb-3 text-center">
          Rapid response ambulances staffed by trained drivers—ready to reach you when every second matters.
          For emergencies, please dial your local emergency number immediately.
        </p>
        <blockquote className="mb-5 rounded-lg border-l-4 border-blue-600 bg-blue-100 p-3 text-blue-900 text-sm text-center">
          “In an emergency, preparation is the best medicine.”
        </blockquote>

        <div className="grid gap-4 sm:gap-5">
          {AMBULANCES.map((a) => (
            <div
              key={a.number}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-blue-200 ${cardBg(a.type)} p-4 shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300`}
            >
              <div className="space-y-1">
                <div className="text-blue-900 font-semibold text-lg">🚑 {a.number}</div>
                <div className="text-blue-800 text-sm">Driver: {a.driver}</div>
                <div className="text-blue-800 text-sm">
                  📞 <a href={`tel:${a.phone}`} className="hover:underline">{a.phone}</a>
                </div>
              </div>
              <span className={badgeClass(a.type)}>{a.type} Life Support</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
