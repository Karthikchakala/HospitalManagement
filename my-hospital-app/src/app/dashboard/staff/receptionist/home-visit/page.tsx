"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
const BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

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

export default function ReceptionistHomeVisitPage() {
  const [list, setList] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "Pending", service: "all" });

  const fetchVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${BASE}/api/home-visit`);
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
  };

  useEffect(() => {
    fetchVisits();
  }, [filters.service]);

  const patch = async (id: number, payload: Record<string, unknown>) => {
    try {
      const { data } = await axios.patch(`${BASE}/api/home-visit/${id}`, payload);
      if (data?.success) fetchVisits();
      else alert(data?.message || "Update failed");
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message || e.message : (e instanceof Error ? e.message : "Update failed");
      alert(msg);
    }
  };

  const filtered = list
    .filter((v) => {
      if (filters.service === "all") {
        return v.service_type !== "Doctor" || (v.service_type === "Doctor" && !v.assigned_id);
      }
      return v.service_type === filters.service;
    })
    .filter((v) => (filters.status === "All" ? true : v.status === filters.status));

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-cyan-300">
          🏠 Home Visit Requests (Non-Doctor)
        </h1>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            className="rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            value={filters.service}
            onChange={(e) => setFilters((f) => ({ ...f, service: e.target.value }))}
          >
            <option value="all">All Services</option>
            <option value="Nurse">Nurse</option>
            <option value="Physiotherapist">Physiotherapist</option>
            <option value="Caregiver">Caregiver</option>
          </select>

          <select
            className="rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option>Pending</option>
            <option>Accepted</option>
            <option>Completed</option>
            <option>Cancelled</option>
            <option>All</option>
          </select>

          <button
            className="rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-white text-sm font-medium hover:from-teal-400 hover:to-cyan-400 transition-all"
            onClick={fetchVisits}
          >
            Refresh
          </button>
        </div>

        <div className="rounded-xl border border-cyan-700 bg-slate-800 shadow-[0_0_10px_rgba(34,211,238,0.1)] overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-700/50 text-cyan-300">
              <tr>
                <th className="px-3 py-3">Visit ID</th>
                <th className="px-3 py-3">Patient</th>
                <th className="px-3 py-3">Service</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Time</th>
                <th className="px-3 py-3">Address</th>
                <th className="px-3 py-3">Notes</th>
                <th className="px-3 py-3">Assigned</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700">
              {loading && (
                <tr>
                  <td className="px-3 py-4 text-cyan-300" colSpan={10}>
                    Loading...
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td className="px-3 py-4 text-red-400" colSpan={10}>
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-slate-400" colSpan={10}>
                    No requests found.
                  </td>
                </tr>
              )}
              {filtered.map((v) => (
                <tr key={v.visit_id} className="hover:bg-slate-700/30 transition">
                  <td className="px-3 py-3 text-white">#{v.visit_id}</td>
                  <td className="px-3 py-3 text-white">#{v.patient_id}</td>
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
                  <td className="px-3 py-3 text-slate-200">
                    {v.assigned_id ?? "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span className={badge(v.status)}>{v.status}</span>
                  </td>
                  <td className="px-3 py-3 flex flex-wrap gap-2">
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const id = formData.get("assign_id");
                        await patch(v.visit_id, {
                          assigned_id: id ? Number(id) : null,
                          status: "Accepted",
                        });
                        e.currentTarget.reset();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        name="assign_id"
                        placeholder="Staff ID"
                        className="w-28 rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-green-600 px-2.5 py-1.5 text-white text-xs hover:bg-green-500"
                      >
                        Assign
                      </button>
                    </form>
                    {v.status !== "Completed" && v.status !== "Cancelled" && (
                      <button
                        className="rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 px-2.5 py-1.5 text-white text-xs font-medium hover:from-teal-400 hover:to-cyan-400 transition-all"
                        onClick={() => patch(v.visit_id, { status: "Completed" })}
                      >
                        Mark Completed
                      </button>
                    )}
                    {v.status !== "Cancelled" && (
                      <button
                        className="rounded-md bg-red-600 px-2.5 py-1.5 text-white text-xs hover:bg-red-500"
                        onClick={() => patch(v.visit_id, { status: "Cancelled" })}
                      >
                        Cancel
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
