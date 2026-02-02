'use client';

import DashboardNavbar from '../../../../components/DashboardNavbar';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';

interface PatientSummary {
    id: number;
    name: string;
    email: string;
    age: number;
    blood_group: string;
    city: string;
}

export default function AdminPatientManagementPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<PatientSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const adminName = 'Admin User';

    const adminNavLinks = [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: '/dashboard/admin' },
        { name: 'User Management', href: '/dashboard/admin/doctors' },
        { name: 'Settings', href: '/dashboard/admin/settings' },
    ];

    useEffect(() => {
        const fetchPatients = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const response = await axios.get('http://localhost:5000/api/admin/patients', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPatients(response.data);
            } catch (error) {
                console.error('Failed to fetch patient data:', error);
                router.push('/dashboard/admin');
            } finally {
                setIsLoading(false);
            }
        };
        fetchPatients();
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
                    <h1 className="text-slate-300 text-sm">Loading Patient Directory...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
            {/* ✅ Plexus Background */}
            {/* <ParticlesBackground /> */}

            <div className="relative z-10">
                <DashboardNavbar
                    title="Admin Portal"
                    navLinks={adminNavLinks}
                    userName={adminName}
                />

                <main className="container mx-auto py-12 px-6">
                    {/* Header with Stats */}
                    <div className="mb-10">
                        <h1 className="text-5xl font-extrabold text-cyan-200 mb-3 drop-shadow-lg">
                            Patient Management
                        </h1>
                        <div className="flex items-center gap-3 text-slate-400">
                            <UserGroupIcon className="w-6 h-6" />
                            <p className="text-lg">
                                Total Registered Patients: <span className="font-bold text-cyan-300">{patients.length}</span>
                            </p>
                        </div>
                    </div>

                    {patients.length === 0 ? (
                        <div className="bg-slate-800/80 backdrop-blur-md border border-cyan-700/30 p-10 rounded-2xl shadow-lg text-center">
                            <UserIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                            <p className="text-xl text-slate-300">No patient records found in the system.</p>
                        </div>
                    ) : (
                        <div className="bg-slate-800/80 backdrop-blur-md border border-cyan-700/30 rounded-2xl shadow-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b-2 border-cyan-500/40 bg-slate-700/50">
                                            <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">
                                                Patient Name
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">
                                                Email
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">
                                                Age / Blood Group
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">
                                                City
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-cyan-300 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patients.map((patient, index) => {
                                            // Alternating row colors for better readability
                                            const colorSchemes = [
                                                'hover:bg-blue-500/10',
                                                'hover:bg-purple-500/10',
                                                'hover:bg-teal-500/10',
                                                'hover:bg-emerald-500/10',
                                            ];
                                            const hoverColor = colorSchemes[index % colorSchemes.length];

                                            return (
                                                <tr
                                                    key={patient.id}
                                                    className={`border-b border-slate-700/50 transition-colors duration-200 ${hoverColor}`}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                                                {patient.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-white font-semibold">
                                                                {patient.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                        {patient.email}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-3 py-1 bg-purple-500/20 border border-purple-400/40 rounded-full text-purple-300 font-semibold">
                                                                {patient.age} yrs
                                                            </span>
                                                            <span className="px-3 py-1 bg-rose-500/20 border border-rose-400/40 rounded-full text-rose-300 font-bold">
                                                                {patient.blood_group}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                        📍 {patient.city}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <Link
                                                            href={`/dashboard/admin/patients/${patient.id}`}
                                                            className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
                                                        >
                                                            View/Edit →
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
