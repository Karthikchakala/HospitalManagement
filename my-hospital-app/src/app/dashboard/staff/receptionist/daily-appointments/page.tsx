'use client';

import DashboardNavbar from '../../../../../components/DashboardNavbar';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { createClient } from '@supabase/supabase-js';

interface AppointmentSummary {
    id: number;
    time: string;
    patientName: string;
    doctorName: string;
    reason: string;
    status: string;
}

export default function ReceptionistDailyAppointmentsPage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<AppointmentSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('Receptionist');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Filters & pagination
    const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalPages, setTotalPages] = useState<number>(1);

    const receptionistNavLinks = [
        { name: 'Dashboard', href: '/dashboard/staff/receptionist' },
        { name: 'Patient Registration', href: '/dashboard/staff/receptionist/patient-registration' },
        { name: 'Appointments', href: '/dashboard/staff/receptionist/daily-appointments' },
    ];

    // Optional Supabase realtime client (only if envs exist)
    const supabase = useMemo(() => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (url && key) {
            return createClient(url, key);
        }
        return null;
    }, []);

    const fetchSchedule = async (opts?: { keepLoading?: boolean }) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) { router.push('/login'); return; }
        if (!opts?.keepLoading) setIsLoading(true);
        setErrorMsg(null);
        try {
            // Fetch user name
            const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserName(userResponse.data.name);

            // Fetch appointments with filters/pagination
            const params: Record<string, unknown> = { date, status: statusFilter, page, pageSize };
            const resp = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/appointments/today`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });

            // Preserve compatibility: backend returns array (no params) or {data, meta} (with params)
            const payload = resp.data;
            if (Array.isArray(payload)) {
                setAppointments(payload);
                setTotalPages(1);
            } else {
                setAppointments(payload.data || []);
                setTotalPages(payload.meta?.totalPages || 1);
            }
        } catch (error) {
            console.error('Failed to fetch daily schedule:', error);
            setErrorMsg('Failed to fetch appointments.');
            localStorage.removeItem('token');
            router.push('/login');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, date, statusFilter, page, pageSize]);

    // Realtime or polling fallback
    useEffect(() => {
        if (!supabase) {
            const id = setInterval(() => fetchSchedule({ keepLoading: true }), 30000);
            return () => clearInterval(id);
        }
        const channel = supabase
            .channel('appointments_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Appointments' }, () => {
                fetchSchedule({ keepLoading: true });
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase, date, statusFilter]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
                    <h1 className="text-slate-300 text-sm">Loading Daily Schedule...</h1>
                </div>
            </div>
        );
    }

    const todayDate = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const onChangeStatus = async (id: number, nextStatus: string) => {
        const prev = appointments;
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }
        // optimistic update
        setAppointments((curr) => curr.map(a => a.id === id ? { ...a, status: nextStatus } : a));
        try {
            await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/appointments/${id}/status`, { status: nextStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccessMsg('Status updated');
            setTimeout(() => setSuccessMsg(null), 2000);
        } catch (e) {
            console.error('Failed to update status', e);
            setErrorMsg('Failed to update status');
            setTimeout(() => setErrorMsg(null), 3000);
            // rollback
            setAppointments(prev);
        }
    };

    const downloadCsv = async () => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }
        try {
            const params: Record<string, unknown> = { date, status: statusFilter, page, pageSize, format: 'csv' };
            const resp = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/appointments/today`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
                responseType: 'blob',
            });
            const blob = new Blob([resp.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `appointments_${date}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error('CSV download failed', e);
            setErrorMsg('CSV download failed');
            setTimeout(() => setErrorMsg(null), 3000);
        }
    };

    return (
        <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
            {/* ✅ Plexus Background */}
            {/* <ParticlesBackground /> */}

            <div className="relative z-10">
                <DashboardNavbar
                    title="Receptionist Portal"
                    navLinks={receptionistNavLinks}
                    userName={userName}
                />

                <main className="container mx-auto py-12 px-6">
                    <div className="flex items-center gap-3 mb-10">
                        <CalendarDaysIcon className="w-10 h-10 text-cyan-400" />
                        <h1 className="text-5xl font-extrabold text-cyan-200 drop-shadow-lg">
                            Today&apos;s Appointments
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg mb-8">{todayDate}</p>

                    {/* Filters and actions */}
                    <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between mb-6">
                        <div className="flex gap-3 items-end">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Date</label>
                                <input type="date" value={date} onChange={e => { setPage(1); setDate(e.target.value); }}
                                    className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Status</label>
                                <select value={statusFilter} onChange={e => { setPage(1); setStatusFilter(e.target.value); }}
                                    className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100">
                                    <option>All</option>
                                    <option>Scheduled</option>
                                    <option>Checked-In</option>
                                    <option>Completed</option>
                                    <option>No-Show</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Page size</label>
                                <select value={pageSize} onChange={e => { setPage(1); setPageSize(parseInt(e.target.value)); }}
                                    className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100">
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => fetchSchedule()} className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white">Refresh</button>
                            <button onClick={downloadCsv} className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white">Export CSV</button>
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="mb-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 rounded">{errorMsg}</div>
                    )}
                    {successMsg && (
                        <div className="mb-4 bg-emerald-900/50 border border-emerald-700 text-emerald-200 px-4 py-2 rounded">{successMsg}</div>
                    )}

                    {appointments.length === 0 ? (
                        <div className="bg-slate-800/80 backdrop-blur-md border border-emerald-700/30 p-10 rounded-2xl shadow-lg text-center">
                            <CalendarDaysIcon className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
                            <p className="text-xl text-emerald-300">✅ No appointments scheduled for today.</p>
                        </div>
                    ) : (
                        <div className="bg-slate-800/80 backdrop-blur-md border border-cyan-700/30 p-6 rounded-2xl shadow-2xl overflow-hidden">
                            <table className="min-w-full text-slate-100">
                                <thead>
                                    <tr className="border-b-2 border-cyan-500/40 bg-slate-700/50">
                                        <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">Time</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">Patient</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">Doctor</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">Reason</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-cyan-300 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.map((appt) => (
                                        <tr
                                            key={appt.id}
                                            className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors duration-200"
                                        >
                                            <td className="px-6 py-4 font-bold text-cyan-300">{appt.time}</td>
                                            <td className="px-6 py-4 font-semibold text-white">{appt.patientName}</td>
                                            <td className="px-6 py-4 text-slate-300">{appt.doctorName}</td>
                                            <td className="px-6 py-4 text-slate-400">{appt.reason}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <span
                                                        className={`px-3 py-1.5 text-xs font-bold rounded-full ${appt.status === 'Scheduled'
                                                                ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/50'
                                                                : appt.status === 'Checked-In'
                                                                    ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                                                                    : appt.status === 'Completed'
                                                                        ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50'
                                                                        : appt.status === 'No-Show'
                                                                            ? 'bg-red-500/30 text-red-200 border border-red-400/50'
                                                                            : 'bg-slate-600/30 text-slate-200 border border-slate-500/50'
                                                            }`}
                                                    >
                                                        {appt.status}
                                                    </span>
                                                    <select
                                                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                                                        value={appt.status}
                                                        onChange={(e) => onChangeStatus(appt.id, e.target.value)}
                                                    >
                                                        <option>Scheduled</option>
                                                        <option>Checked-In</option>
                                                        <option>Completed</option>
                                                        <option>No-Show</option>
                                                        <option>Canceled</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-slate-400">Page {page} of {totalPages}</div>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className={`px-3 py-2 rounded border ${page <= 1 ? 'border-slate-700 text-slate-600' : 'border-slate-600 text-slate-200 hover:bg-slate-700'}`}
                            >Prev</button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className={`px-3 py-2 rounded border ${page >= totalPages ? 'border-slate-700 text-slate-600' : 'border-slate-600 text-slate-200 hover:bg-slate-700'}`}
                            >Next</button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

