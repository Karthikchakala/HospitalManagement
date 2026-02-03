"use client";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
const BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || process.env.NEXT_PUBLIC_API_URL;

type Visit = {
  visit_id: number;
  patient_id: number;
  assigned_id: number | null;
  service_type: string;
  visit_date: string;
  visit_time: string;
  address: string;
  notes?: string | null;
  status: "Pending" | "Accepted" | "Completed" | "Cancelled";
  patient_name?: string;
};

const badge = (s: string) => {
  const map: Record<string, string> = {
    Pending: "bg-yellow-500/20 text-yellow-300",
    Accepted: "bg-green-500/20 text-green-300",
    Completed: "bg-cyan-500/20 text-cyan-300",
    Cancelled: "bg-red-500/20 text-red-300",
  };
  return `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[s] || "bg-slate-700 text-slate-300"}`;
};

export default function DoctorHomeVisitPage() {
  const [doctorId, setDoctorId] = useState<string>("");
  const [manualId, setManualId] = useState<string>("");
  const [list, setList] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVisits = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${BASE}/api/home-visit`, {
        params: { assigned_id: doctorId },
      });
      if (data?.success) setList(data.data || []);
      else setError(data?.message || "Failed to fetch");
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setError(e.response?.data?.message || e.message || "Failed to fetch");
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to fetch");
      }
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const patchStatus = async (
    id: number,
    status: "Accepted" | "Completed" | "Cancelled"
  ) => {
    try {
      const { data } = await axios.patch(`${BASE}/api/home-visit/${id}`, {
        status,
      });
      if (data?.success) fetchVisits();
      else alert(data?.message || "Update failed");
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        alert(e.response?.data?.message || e.message || "Update failed");
      } else if (e instanceof Error) {
        alert(e.message);
      } else {
        alert("Update failed");
      }
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const { data } = await axios.get(`${BASE}/api/doctor/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const rel = data?.Doctor;
        const did = Array.isArray(rel) ? rel[0]?.doctor_id : rel?.doctor_id;
        if (did) setDoctorId(String(did));
      } catch { }
    })();
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-cyan-300">🏠 My Home Visits</h1>

        <div className="text-sm text-slate-300">
          {doctorId ? (
            <span>
              Showing visits assigned to your profile (Doctor ID{" "}
              <span className="text-cyan-400 font-semibold">#{doctorId}</span>).
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span>Could not auto-load your profile. Enter Doctor ID:</span>
              <input
                className="w-40 rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Doctor ID"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
              />
              <button
                className="rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-white text-sm font-medium hover:from-teal-400 hover:to-cyan-400 transition-all"
                onClick={() => {
                  if (manualId) {
                    setDoctorId(manualId);
                  }
                }}
              >
                Load Assigned Visits
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-cyan-700 bg-slate-800 shadow-[0_0_10px_rgba(34,211,238,0.1)] overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-700/50 text-cyan-300">
              <tr>
                <th className="px-3 py-3">Patient</th>
                <th className="px-3 py-3">Service</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Time</th>
                <th className="px-3 py-3">Address</th>
                <th className="px-3 py-3">Notes</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading && (
                <tr>
                  <td className="px-3 py-4 text-cyan-300" colSpan={8}>
                    Loading...
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td className="px-3 py-4 text-red-400" colSpan={8}>
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && list.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-slate-400" colSpan={8}>
                    No assigned visits.
                  </td>
                </tr>
              )}
              {list.map((v) => (
                <tr key={v.visit_id} className="hover:bg-slate-700/30 transition">
                  <td className="px-3 py-3 text-white">
                    {v.patient_name
                      ? `${v.patient_name} (#${v.patient_id})`
                      : `#${v.patient_id}`}
                  </td>
                  <td className="px-3 py-3 text-cyan-300">{v.service_type}</td>
                  <td className="px-3 py-3">{v.visit_date}</td>
                  <td className="px-3 py-3">{v.visit_time}</td>
                  <td
                    className="px-3 py-3 max-w-[240px] truncate text-slate-300"
                    title={v.address}
                  >
                    {v.address}
                  </td>
                  <td
                    className="px-3 py-3 max-w-[200px] truncate text-slate-400"
                    title={v.notes || ""}
                  >
                    {v.notes || "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span className={badge(v.status)}>{v.status}</span>
                  </td>
                  <td className="px-3 py-3 flex flex-wrap gap-2">
                    {v.status === "Pending" && (
                      <button
                        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium hover:bg-green-500 transition-all"
                        onClick={() => patchStatus(v.visit_id, "Accepted")}
                      >
                        Accept
                      </button>
                    )}
                    {v.status !== "Completed" && v.status !== "Cancelled" && (
                      <button
                        className="rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-1.5 text-xs font-medium hover:from-teal-400 hover:to-cyan-400 transition-all"
                        onClick={() => patchStatus(v.visit_id, "Completed")}
                      >
                        Mark Completed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
