"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { supabase } from "../../../../lib/supabaseClient";

interface Doctor { doctor_id: number; name: string; department_id?: number | null }
interface Department { department_id: number; name: string }
interface InpatientRow {
  inpatient_id: number;
  patient_id: number;
  doctor_id: number;
  department_id: number;
  room_number: string;
  ward_type: string;
  admission_date: string;
  discharge_date: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  status: string;
}

export default function StaffInpatientsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [list, setList] = useState<InpatientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState<{ doctor_id?: string; department_id?: string; status?: string }>({});

  const [form, setForm] = useState({
    patient_id: "",
    doctor_id: "",
    department_id: "",
    room_number: "",
    ward_type: "General",
    diagnosis: "",
    treatment_plan: "",
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [{ data: depData }, docRes] = await Promise.all([
          supabase.from("Departments").select("department_id, name").order("name"),
          supabase.from("Doctor").select("doctor_id, name, department_id").order("name"),
        ]);

        let docData: Record<string, unknown>[] | null = (docRes.data as Record<string, unknown>[] | null);
        // Fallback to plural table name if needed
        if (!docData || docData.length === 0) {
          const alt = await supabase.from("Doctors").select("doctor_id, name, department_id, full_name, doctor_name").order("name");
          docData = (alt.data as Record<string, unknown>[] | null) || [];
        }

        // Normalize doctors to expected shape
        const normalizedDoctors: Doctor[] = (docData || []).map((d: Record<string, unknown>) => ({
          doctor_id: Number(d.doctor_id ?? d.id),
          name: (d.name as string) ?? (d.full_name as string) ?? (d.doctor_name as string) ?? `Doctor ${d.doctor_id ?? d.id ?? ''}`,
          department_id: (d.department_id as number) ?? (d.departmentId as number) ?? null,
        }));


        setDepartments((depData || []) as Department[]);
        setDoctors(normalizedDoctors);
        console.debug('[Inpatients] Loaded departments:', depData?.length || 0);
        console.debug('[Inpatients] Loaded doctors (normalized):', normalizedDoctors.length, normalizedDoctors.slice(0, 3));
      } catch (e) {
        console.error('[Inpatients] Failed to load options', e);
      }
    };
    loadOptions();
  }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.doctor_id) params.set("doctor_id", filters.doctor_id);
      if (filters.department_id) params.set("department_id", filters.department_id);
      if (filters.status) params.set("status", filters.status);
      const { data } = await axios.get<InpatientRow[]>(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/inpatients?${params.toString()}`);
      setList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchListCallback = useCallback(fetchList, [filters]);

  useEffect(() => { fetchListCallback(); }, [fetchListCallback]);

  // Doctors filtered by selected department in the admit form
  const filteredFormDoctors = React.useMemo(() => {
    const depId = Number(form.department_id || 0);
    if (!depId) return doctors;
    return doctors.filter(d => Number(d.department_id) === depId);
  }, [doctors, form.department_id]);

  const onAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        patient_id: Number(form.patient_id),
        doctor_id: Number(form.doctor_id),
        department_id: Number(form.department_id),
        room_number: form.room_number,
        ward_type: form.ward_type,
        diagnosis: form.diagnosis || null,
        treatment_plan: form.treatment_plan || null,
      };
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/inpatients/admit`, payload);
      setForm({ patient_id: "", doctor_id: "", department_id: "", room_number: "", ward_type: "General", diagnosis: "", treatment_plan: "" });
      await fetchList();
      alert("Patient Admitted Successfully");
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.error : "Failed to admit";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const discharge = async (id: number) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/inpatients/discharge/${id}`);
      await fetchList();
      alert("Patient Discharged");
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.error : "Failed to discharge";
      alert(msg);
    }
  };

  const depName = (id?: number | null) => departments.find(d => d.department_id === id)?.name || "";
  const docLabel = (d: Doctor) => d.name || `Doctor ${d.doctor_id}`;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-start">
          <h1 className="text-3xl font-bold text-cyan-200">Staff • Inpatients</h1>
        </div>

        {/* Admit form */}
        <div className="rounded-xl border border-cyan-400/20 bg-slate-800/40 p-4 mb-8">
          <h2 className="text-xl font-semibold mb-3 text-cyan-200">Admit Patient</h2>
          <form onSubmit={onAdmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Patient ID" className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} required />
            <select
              className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700"
              value={form.department_id}
              onChange={e => setForm(f => ({ ...f, department_id: e.target.value, doctor_id: "" }))}
              required
            >
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
            </select>
            <select
              className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700"
              value={form.doctor_id}
              onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}
              required
              disabled={!form.department_id}
            >
              <option value="">{form.department_id ? 'Select Doctor' : 'Select Department first'}</option>
              {filteredFormDoctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>{docLabel(d)}</option>)}
            </select>
            <input placeholder="Room Number" className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} required />
            <select className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={form.ward_type} onChange={e => setForm(f => ({ ...f, ward_type: e.target.value }))}>
              <option>General</option>
              <option>Semi-Private</option>
              <option>Private</option>
              <option>ICU</option>
            </select>
            <input placeholder="Diagnosis (optional)" className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700 md:col-span-2" value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
            <input placeholder="Treatment Plan (optional)" className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700 md:col-span-1" value={form.treatment_plan} onChange={e => setForm(f => ({ ...f, treatment_plan: e.target.value }))} />
            <button disabled={submitting} className="md:col-span-3 mt-2 rounded bg-cyan-600 hover:bg-cyan-500 px-4 py-2 disabled:opacity-60">{submitting ? "Admitting..." : "Admit"}</button>
          </form>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-cyan-400/20 bg-slate-800/40 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={filters.department_id || ""} onChange={e => setFilters(f => ({ ...f, department_id: e.target.value || undefined, doctor_id: undefined }))}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
            </select>
            <select className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={filters.doctor_id || ""} onChange={e => setFilters(f => ({ ...f, doctor_id: e.target.value || undefined }))}>
              <option value="">{filters.department_id ? 'Doctors in Department' : 'All Doctors'}</option>
              {(filters.department_id ? doctors.filter(d => Number(d.department_id) === Number(filters.department_id)) : doctors)
                .map(d => <option key={d.doctor_id} value={d.doctor_id}>{docLabel(d)}</option>)}
            </select>
            <select className="bg-slate-900/60 rounded px-3 py-2 border border-slate-700" value={filters.status || ""} onChange={e => setFilters(f => ({ ...f, status: e.target.value || undefined }))}>
              <option value="">Any Status</option>
              <option>Admitted</option>
              <option>Discharged</option>
            </select>
            <button onClick={fetchList} className="rounded bg-cyan-600 hover:bg-cyan-500 px-4 py-2">Apply</button>
          </div>
        </div>

        {/* List */}
        <div className="rounded-xl border border-cyan-400/20 bg-slate-800/40 p-4">
          {loading ? (
            <p>Loading...</p>
          ) : list.length === 0 ? (
            <p>No inpatients found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-cyan-200">
                  <tr>
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Patient</th>
                    <th className="text-left p-2">Doctor</th>
                    <th className="text-left p-2">Department</th>
                    <th className="text-left p-2">Room</th>
                    <th className="text-left p-2">Ward</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Admission</th>
                    <th className="text-left p-2">Discharge</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(row => (
                    <tr key={row.inpatient_id} className="border-t border-slate-700/60">
                      <td className="p-2">{row.inpatient_id}</td>
                      <td className="p-2">{row.patient_id}</td>
                      <td className="p-2">{row.doctor_id}</td>
                      <td className="p-2">{depName(row.department_id)}</td>
                      <td className="p-2">{row.room_number}</td>
                      <td className="p-2">{row.ward_type}</td>
                      <td className="p-2"><span className={`px-2 py-1 rounded text-xs ${row.status === 'Admitted' ? 'bg-blue-500/30 text-blue-100' : 'bg-green-500/30 text-green-100'}`}>{row.status}</span></td>
                      <td className="p-2">{row.admission_date}</td>
                      <td className="p-2">{row.discharge_date || '-'}</td>
                      <td className="p-2">
                        {row.status === 'Admitted' && (
                          <button onClick={() => discharge(row.inpatient_id)} className="rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-xs">Discharge</button>
                        )}
                      </td>
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
