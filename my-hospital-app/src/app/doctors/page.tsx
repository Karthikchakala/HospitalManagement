"use client";
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';


interface Doctor {
  doctor_id: number;
  doctor_name: string;
  department_name?: string;
  specialization?: string;
  profile_image?: string;
  experience_years?: number;
  education?: string;
  languages_spoken?: string;
  bio?: string;
}

export default function DoctorsDirectoryPage() {
  const [docs, setDocs] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const cache = sessionStorage.getItem('doctors_directory');
        if (cache) {
          const parsed = JSON.parse(cache);
          if (mounted) setDocs(parsed);
        } else {
          const BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL;
          const { data } = await axios.get(`${BASE}/api/doctors`);
          const items = data?.data || [];
          if (mounted) {
            setDocs(items);
            sessionStorage.setItem('doctors_directory', JSON.stringify(items));
          }
        }
      } catch {
      } finally { setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, Doctor[]> = {};
    for (const d of docs) {
      const key = d.department_name || 'General';
      if (!map[key]) map[key] = [];
      map[key].push(d);
    }
    return map;
  }, [docs]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return grouped;
    const out: Record<string, Doctor[]> = {};
    Object.entries(grouped).forEach(([dept, arr]) => {
      const keep = arr.filter(d => `${d.doctor_name}`.toLowerCase().includes(s));
      if (keep.length) out[dept] = keep;
    });
    return out;
  }, [q, grouped]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white text-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">Doctors Directory</h1>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search doctors by name" className="w-full sm:w-80 rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <span className="text-slate-500 text-sm">{loading ? 'Loading…' : `${docs.length} doctors`}</span>
        </div>
        <div className="space-y-8">
          {Object.entries(filtered).map(([dept, arr]) => (
            <div key={dept}>
              <div className="text-blue-600 font-semibold text-lg mb-3">{dept}</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {arr.map((d) => (
                  <div key={d.doctor_id} className="p-5 bg-white rounded-2xl shadow hover:shadow-lg transition border border-slate-200">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="h-14 w-14 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={d.profile_image || 'https://via.placeholder.com/80x80.png?text=Dr'} alt={d.doctor_name} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{d.doctor_name || `Doctor #${d.doctor_id}`}</div>
                        <div className="text-sm text-slate-500">{dept}</div>
                        {d.specialization && (
                          <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{d.specialization}</span>
                        )}
                      </div>
                    </div>
                    <ul className="text-sm text-slate-700 space-y-1">
                      <li><span className="font-semibold">Experience:</span> {d.experience_years != null ? `${d.experience_years} years` : '—'}</li>
                      <li><span className="font-semibold">Education:</span> {d.education ? d.education : '—'}</li>
                      <li><span className="font-semibold">Languages Known:</span> {d.languages_spoken ? d.languages_spoken : '—'}</li>
                    </ul>
                    <p className="mt-3 text-sm text-slate-600 line-clamp-3">{d.bio ? d.bio : '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
