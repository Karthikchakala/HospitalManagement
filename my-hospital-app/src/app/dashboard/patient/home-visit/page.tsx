"use client";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:5000";
// Razorpay global object
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

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
  created_at: string;
};

const badge = (s: string) => {
  const map: Record<string, string> = {
    Pending: "bg-yellow-700 text-yellow-100",
    Accepted: "bg-green-700 text-green-100",
    Completed: "bg-blue-700 text-blue-100",
    Cancelled: "bg-red-700 text-red-100",
  };
  return `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[s] || "bg-slate-700 text-slate-100"}`;
};

export default function PatientHomeVisitPage() {
  const [patientId, setPatientId] = useState<string>("");
  const [list, setList] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [doctors, setDoctors] = useState<Array<{ id: number; name: string }>>([]);

  const [form, setForm] = useState({
    service_type: "Doctor",
    assigned_id: "",
    visit_date: "",
    visit_time: "",
    address: "",
    notes: "",
  });

  const fetchVisits = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${BASE}/api/home-visit`, {
        params: { patient_id: patientId },
      });
      if (data?.success) setList(data.data || []);
      else setError(data?.message || "Failed to fetch");
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? (e.response?.data?.message || e.message) : (e instanceof Error ? e.message : "Failed to fetch");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // Get patient_id from authenticated profile
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const { data } = await axios.get(`${BASE}/api/patient/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const patientRel = Array.isArray(data?.Patient)
          ? data.Patient[0]
          : data?.Patient;
        const pid = patientRel?.patient_id;
        if (pid) setPatientId(String(pid));
      } catch { }
    })();
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  // Load Razorpay script
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) return;
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${BASE}/api/home-visit/departments`);
        if (data?.success) {
          const arr = (data.data || []).map((d: { id?: number; department_id?: number; name: string }) => ({
            id: d.id ?? d.department_id,
            name: d.name,
          }));
          setDepartments(arr);
        }
      } catch { }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!form.service_type || form.service_type !== "Doctor") return;
        const { data } = await axios.get(`${BASE}/api/home-visit/doctors`, {
          params: { department_id: departmentId || undefined },
        });
        if (data?.success) setDoctors(data.data || []);
      } catch { }
    })();
  }, [departmentId, form.service_type]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return alert("Missing patient profile. Please login again.");
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Not authenticated");

      // Create a bill
      const billRes = await axios.post(
        `${BASE}/api/home-visit/create-bill`,
        { service_type: form.service_type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!billRes.data?.success)
        return alert(billRes.data?.message || "Failed to create bill");
      const bill = billRes.data.bill;

      // Generate Razorpay order
      const txnRes = await axios.post(
        `${BASE}/api/patient/payment/generate-txn`,
        { amount: bill.total_amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { orderId, keyId, amount, currency, userEmail } = txnRes.data;

      const RZP = window.Razorpay;
      if (!RZP)
        return alert("Payment gateway not loaded yet. Please try again.");

      const options = {
        key: keyId,
        amount,
        currency,
        name: "Home Visit Payment",
        description: `Home Visit - ${form.service_type}`,
        order_id: orderId,
        prefill: { email: userEmail },
        theme: { color: "#3B82F6" },
        handler: async (response: { razorpay_payment_id: string }) => {
          try {
            await axios.put(
              `${BASE}/api/patient/bills/${bill.bill_id}/pay`,
              {
                transactionId: response.razorpay_payment_id,
                paymentMethod: "Razorpay Online",
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const payload: Record<string, unknown> = {
              patient_id: Number(patientId),
              service_type: form.service_type,
              visit_date: form.visit_date,
              visit_time: form.visit_time,
              address: form.address,
              notes: form.notes,
            };
            if (form.service_type === "Doctor" && form.assigned_id)
              payload.assigned_id = Number(form.assigned_id);

            const { data } = await axios.post(`${BASE}/api/home-visit`, payload, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (data?.success) {
              setForm({
                service_type: "Doctor",
                assigned_id: "",
                visit_date: "",
                visit_time: "",
                address: "",
                notes: "",
              });
              await fetchVisits();
              alert(
                "✅ Payment successful and home visit booked. Check your bills."
              );
            } else {
              alert("Payment done but booking failed.");
            }
          } catch (err: unknown) {
            const msg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : "Failed to finalize booking";
            alert(msg);
          }
        },
      };
      const rzp = new RZP(options);
      rzp.open();
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? (e.response?.data?.message || e.message) : "Failed to book";
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 font-sans p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-cyan-300 mb-6 text-center sm:text-left">
        Home Visit Booking
      </h1>

      <div className="mb-6 text-gray-400 text-sm">
        {patientId ? (
          <span>Using your profile ID #{patientId} to list and book home visits.</span>
        ) : (
          <span>Loading your profile...</span>
        )}
      </div>

      {/* Form */}
      <form
        onSubmit={submit}
        className="space-y-4 rounded-xl border border-cyan-700 bg-slate-800 p-6 shadow-lg mb-10 max-w-2xl mx-auto"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-200 font-semibold mb-2">
              Service Type
            </label>
            <select
              className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:ring-2 focus:ring-cyan-400"
              value={form.service_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, service_type: e.target.value }))
              }
            >
              <option>Doctor</option>
              <option>Nurse</option>
              <option>Physiotherapist</option>
              <option>Caregiver</option>
            </select>
          </div>

          {form.service_type === "Doctor" && (
            <>
              <div>
                <label className="block text-gray-200 font-semibold mb-2">
                  Department
                </label>
                <select
                  className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:ring-2 focus:ring-cyan-400"
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setForm((f) => ({ ...f, assigned_id: "" }));
                  }}
                >
                  <option value="">Select Department</option>
                  {departments.map((d, idx) => (
                    <option key={`${d.id}-${idx}`} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-200 font-semibold mb-2">
                  Choose Doctor
                </label>
                <select
                  className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
                  value={form.assigned_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assigned_id: e.target.value }))
                  }
                  disabled={!departmentId}
                >
                  <option value="">Select a doctor (optional)</option>
                  {doctors.map((d, idx) => (
                    <option key={`${d.id}-${idx}`} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-200 font-semibold mb-2">
              Visit Date
            </label>
            <input
              type="date"
              className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:ring-2 focus:ring-cyan-400"
              value={form.visit_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, visit_date: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="block text-gray-200 font-semibold mb-2">
              Visit Time
            </label>
            <input
              type="time"
              className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:ring-2 focus:ring-cyan-400"
              value={form.visit_time}
              onChange={(e) =>
                setForm((f) => ({ ...f, visit_time: e.target.value }))
              }
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-200 font-semibold mb-2">
            Home Address
          </label>
          <textarea
            className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:ring-2 focus:ring-cyan-400"
            rows={3}
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
            required
          />
        </div>

        <div>
          <label className="block text-gray-200 font-semibold mb-2">Notes</label>
          <textarea
            className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:ring-2 focus:ring-cyan-400"
            rows={2}
            value={form.notes}
            onChange={(e) =>
              setForm((f) => ({ ...f, notes: e.target.value }))
            }
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-md hover:from-teal-400 hover:to-cyan-400 shadow-lg transition-all"
          >
            Book Home Visit
          </button>
        </div>
      </form>

      {/* Visits Table */}
      <div className="rounded-xl border border-cyan-700 bg-slate-800 shadow-lg overflow-x-auto max-w-5xl mx-auto">
        <table className="min-w-full text-sm text-gray-200">
          <thead className="bg-slate-700 text-gray-100">
            <tr className="text-left">
              <th className="px-3 py-3">Service</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Time</th>
              <th className="px-3 py-3">Assigned</th>
              <th className="px-3 py-3">Address</th>
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-3 py-3" colSpan={6}>
                  Loading...
                </td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td className="px-3 py-3 text-red-400" colSpan={6}>
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && list.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-gray-400" colSpan={6}>
                  No home visits found.
                </td>
              </tr>
            )}
            {list.map((v) => (
              <tr key={v.visit_id} className="border-t border-slate-700">
                <td className="px-3 py-2">{v.service_type}</td>
                <td className="px-3 py-2">{v.visit_date}</td>
                <td className="px-3 py-2">{v.visit_time}</td>
                <td className="px-3 py-2">{v.assigned_id ?? "—"}</td>
                <td
                  className="px-3 py-2 max-w-[280px] truncate"
                  title={v.address}
                >
                  {v.address}
                </td>
                <td className="px-3 py-2">
                  <span className={badge(v.status)}>{v.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
