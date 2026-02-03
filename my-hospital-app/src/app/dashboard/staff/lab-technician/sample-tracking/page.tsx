'use client';

import DashboardNavbar from '../../../../../components/DashboardNavbar';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ClipboardDocumentListIcon, ClockIcon } from '@heroicons/react/24/outline';

interface SampleTest {
    test_id: number;
    test_name: string;
    patient_name: string;
    patient_id: number;
}

export default function SampleTrackingPage() {
    const router = useRouter();
    const [pendingSamples, setPendingSamples] = useState<SampleTest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('Lab Technician');

    const technicianNavLinks = [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: '/dashboard/staff/lab-technician' },
        { name: 'Results', href: '/dashboard/staff/lab-technician/results-management' },
    ];

    useEffect(() => {
        const fetchSamples = async () => {
            const token = localStorage.getItem('token');
            if (!token) { router.push('/login'); return; }

            try {
                const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserName(userResponse.data.name);

                const samplesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/lab/samples`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPendingSamples(samplesResponse.data);
            } catch (error) {
                console.error('Failed to fetch samples:', error);
                localStorage.removeItem('token');
                router.push('/login');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSamples();
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-indigo-400 animate-spin" />
                    <h1 className="text-slate-300 text-sm">Loading Sample Tracker...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
            {/* <ParticlesBackground /> */}

            <div className="relative z-10">
                <DashboardNavbar
                    title="Lab Technician Portal"
                    navLinks={technicianNavLinks}
                    userName={userName}
                />

                <main className="container mx-auto py-12 px-6">
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-3">
                            <ClipboardDocumentListIcon className="w-10 h-10 text-indigo-400" />
                            <h1 className="text-5xl font-extrabold text-indigo-200 drop-shadow-lg">
                                Sample Tracking Portal
                            </h1>
                        </div>
                        <p className="text-slate-400 text-xl">
                            Showing all tests awaiting collection or processing
                        </p>
                    </div>

                    {/* Pending Samples Count Badge */}
                    <h2 className="text-3xl font-bold text-indigo-300 mb-6 flex items-center gap-2">
                        Pending Samples <span className="px-3 py-1 bg-indigo-500/30 rounded-full text-2xl">({pendingSamples.length})</span>
                    </h2>

                    {pendingSamples.length === 0 ? (
                        <div className="bg-slate-800/80 backdrop-blur-md border border-emerald-700/30 p-10 rounded-2xl shadow-lg text-center">
                            <ClipboardDocumentListIcon className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
                            <p className="text-xl text-emerald-300">✅ No samples are currently awaiting processing.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingSamples.map((test) => (
                                <div
                                    key={test.test_id}
                                    className="backdrop-blur-md p-6 rounded-xl border-l-4 border-indigo-400 transition-all duration-300 hover:scale-[1.01] bg-gradient-to-br from-indigo-500/25 to-blue-500/25 shadow-xl hover:shadow-indigo-500/30"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-2">{test.test_name}</h3>
                                            <p className="text-slate-200">
                                                👤 Patient: <span className="font-semibold">{test.patient_name}</span>
                                                <span className="ml-3 text-slate-400">(ID: #{test.patient_id})</span>
                                            </p>
                                        </div>
                                        <div>
                                            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/30 text-amber-200 border-2 border-amber-400/60 rounded-full font-bold text-sm shadow-lg">
                                                <ClockIcon className="w-5 h-5" />
                                                PENDING
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
