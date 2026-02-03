"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { supabase } from "../../../../lib/supabaseClient";

interface Doctor { doctor_id: number; name: string; department_id?: number | null }
interface Department { department_id: number; name: string }
interface OutpatientRow {
  outpatient_id: number;
  patient_id: number;
  doctor_id: number;
  department_id: number;
  visit_date: string;
  appointment_time: string;
  symptoms: string | null;
  diagnosis: string | null;
  prescription: string | null;
  consultation_fee: number | null;
  payment_status: string;
}

export default function StaffOutpatientsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [list, setList] = useState<OutpatientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState<{ doctor_id?: string; department_id?: string; payment_status?: string }>({});

  const [form, setForm] = useState({
    patient_id: "",
    doctor_id: "",
    department_id: "",
    visit_date: "",
    appointment_time: "",
    symptoms: "",
    consultation_fee: "",
    payment_status: "Pending",
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [{ data: depData }, { data: docData }] = await Promise.all([
          supabase.from("Departments").select("department_id, name").order("name"),
          supabase.from("Doctor").select("doctor_id, name, department_id").order("name"),
        ]);
        setDepartments((depData || []) as Department[]);
        setDoctors((docData || []) as Doctor[]);
      } catch { }
    };
    loadOptions();
  }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.doctor_id) params.set("doctor_id", filters.doctor_id);
      if (filters.department_id) params.set("department_id", filters.department_id);
      if (filters.payment_status) params.set("payment_status", filters.payment_status);
      const { data } = await axios.get<OutpatientRow[]>(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/outpatients?${params.toString()}`);
      setList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchListCallback = useCallback(fetchList, [filters]);

  useEffect(() => { fetchListCallback(); }, [fetchListCallback]);

  const onBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        patient_id: Number(form.patient_id),
        doctor_id: Number(form.doctor_id),
        department_id: Number(form.department_id),
        visit_date: form.visit_date,
        appointment_time: form.appointment_time,
        symptoms: form.symptoms || null,
        consultation_fee: form.consultation_fee ? Number(form.consultation_fee) : null,
        payment_status: form.payment_status || "Pending",
      };
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/outpatients/book`, payload);
      setForm({ patient_id: "", doctor_id: "", department_id: "", visit_date: "", appointment_time: "", symptoms: "", consultation_fee: "", payment_status: "Pending" });
      await fetchList();
      alert("Appointment Booked Successfully");
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.error : "Failed to book appointment";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const depName = (id?: number | null) => departments.find(d => d.department_id === id)?.name || "";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-start">
          <h1 className="text-3xl font-bold text-cyan-200">Staff • Outpatients</h1>
        </div>

        {/* Booking form */}
        <div className="rounded-xl border border-cyan-400/20 bg-slate-800/40 p-4 mb-8">
          <h2 className="text-xl font-semibold mb-3 text-cyan-200">Book Appointment</h2>
          <form onSubmit={onBook} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Patient ID" className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} required />
            <select className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))} required>
              <option value="">Select Doctor</option>
              {doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>{d.name}</option>)}
            </select>
            <select className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))} required>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
            </select>
            <input placeholder="Visit Date (YYYY-MM-DD)" className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={form.visit_date} onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))} required />
            <input placeholder="Appointment Time (HH:mm:ss)" className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={form.appointment_time} onChange={e => setForm(f => ({ ...f, appointment_time: e.target.value }))} required />
            <input placeholder="Symptoms (optional)" className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700 md:col-span-2" value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} />
            <input placeholder="Consultation Fee (optional)" className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={form.consultation_fee} onChange={e => setForm(f => ({ ...f, consultation_fee: e.target.value }))} />
            <select className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={form.payment_status} onChange={e => setForm(f => ({ ...f, payment_status: e.target.value }))}>
              <option>Pending</option>
              <option>Paid</option>
              <option>Waived</option>
            </select>
            <button disabled={submitting} className="md:col-span-3 mt-2 rounded bg-cyan-600 hover:bg-cyan-500 px-4 py-2 disabled:opacity-60">{submitting ? "Booking..." : "Book"}</button>
          </form>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-cyan-400/20 bg-slate-800/40 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={filters.doctor_id || ""} onChange={e => setFilters(f => ({ ...f, doctor_id: e.target.value || undefined }))}>
              <option value="">All Doctors</option>
              {doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>{d.name}</option>)}
            </select>
            <select className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={filters.department_id || ""} onChange={e => setFilters(f => ({ ...f, department_id: e.target.value || undefined }))}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
            </select>
            <select className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={filters.payment_status || ""} onChange={e => setFilters(f => ({ ...f, payment_status: e.target.value || undefined }))}>
              <option value="">Any Payment</option>
              <option>Pending</option>
              <option>Paid</option>
              <option>Waived</option>
            </select>
            <button onClick={fetchList} className="rounded bg-cyan-600 hover:bg-cyan-500 px-4 py-2">Apply</button>
          </div>
        </div>

        {/* List */}
        <div className="rounded-xl border border-cyan-400/20 bg-slate-800/40 p-4">
          {loading ? (
            <p>Loading...</p>
          ) : list.length === 0 ? (
            <p>No outpatients found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-cyan-200">
                  <tr>
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Patient</th>
                    <th className="text-left p-2">Doctor</th>
                    <th className="text-left p-2">Department</th>
                    <th className="text-left p-2">Visit</th>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(row => (
                    <tr key={row.outpatient_id} className="border-t border-slate-700/60">
                      <td className="p-2">{row.outpatient_id}</td>
                      <td className="p-2">{row.patient_id}</td>
                      <td className="p-2">{row.doctor_id}</td>
                      <td className="p-2">{depName(row.department_id)}</td>
                      <td className="p-2">{row.visit_date}</td>
                      <td className="p-2">{row.appointment_time}</td>
                      <td className="p-2"><span className={`px-2 py-1 rounded text-xs ${row.payment_status === 'Paid' ? 'bg-green-500/30 text-green-100' : row.payment_status === 'Pending' ? 'bg-amber-500/30 text-amber-100' : 'bg-slate-500/30 text-slate-100'}`}>{row.payment_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
