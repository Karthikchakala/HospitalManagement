'use client';

import DashboardNavbar from '../../../../components/DashboardNavbar';
import ParticlesBackground from '../../../../components/ParticlesBackground'; // ✅ Added
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Patient {
    patient_id: number;
    name: string;
    blood_group: string;
    age: number;
}

export default function DoctorPatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('Doctor');

    const doctorNavLinks = [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: '/dashboard/doctor' },
        { name: 'Profile', href: '/dashboard/doctor/profile' },
        { name: 'Appointments', href: '/dashboard/doctor/appointments' },
    ];

    useEffect(() => {
        const fetchPatients = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const userResponse = await axios.get('http://localhost:5000/api/doctor/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserName(userResponse.data.name);

                const patientsResponse = await axios.get('http://localhost:5000/api/doctor/patients', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPatients(patientsResponse.data);
            } catch (error) {
                console.error('Failed to fetch patient data:', error);
                localStorage.removeItem('token');
                router.push('/login');
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
                    <h1 className="text-slate-300 text-sm">Loading Patient List...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
            {/* ✅ Plexus Background */}
            <ParticlesBackground />

            <div className="relative z-10">
                <DashboardNavbar 
                    title="Doctor Portal" 
                    navLinks={doctorNavLinks} 
                    userName={userName} 
                />
                
                <main className="container mx-auto py-12 px-6">
                    <h1 className="text-5xl font-extrabold mb-10 text-cyan-200 drop-shadow-lg">
                        My Patients
                    </h1>
                    
                    {patients.length === 0 ? (
                        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-md border border-cyan-700/30 p-10 rounded-2xl shadow-lg text-center">
                            <p className="text-xl text-slate-300">
                                You currently have no patients assigned via appointments.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {patients.map((patient, index) => {
                                // Color rotation for variety
                                const colorSchemes = [
                                    {
                                        gradient: 'from-blue-500/25 to-indigo-500/25',
                                        border: 'border-blue-400',
                                        shadow: 'shadow-blue-500/30',
                                        accent: 'text-blue-300',
                                    },
                                    {
                                        gradient: 'from-teal-500/25 to-cyan-500/25',
                                        border: 'border-teal-400',
                                        shadow: 'shadow-teal-500/30',
                                        accent: 'text-teal-300',
                                    },
                                    {
                                        gradient: 'from-purple-500/25 to-violet-500/25',
                                        border: 'border-purple-400',
                                        shadow: 'shadow-purple-500/30',
                                        accent: 'text-purple-300',
                                    },
                                    {
                                        gradient: 'from-emerald-500/25 to-green-500/25',
                                        border: 'border-emerald-400',
                                        shadow: 'shadow-emerald-500/30',
                                        accent: 'text-emerald-300',
                                    },
                                ];

                                const colors = colorSchemes[index % colorSchemes.length];

                                return (
                                    <div 
                                        key={patient.patient_id} 
                                        className={`backdrop-blur-md p-6 rounded-2xl border-l-4 transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br ${colors.gradient} ${colors.border} shadow-xl ${colors.shadow}`}
                                    >
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                            <div className="flex-1">
                                                <h2 className="text-2xl font-bold text-white mb-2">
                                                    {patient.name} : {patient.patient_id}
                                                </h2>
                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    <span className="text-slate-200">
                                                        <span className={`font-semibold ${colors.accent}`}>Age:</span> {patient.age}
                                                    </span>
                                                    <span className="text-slate-200">
                                                        <span className={`font-semibold ${colors.accent}`}>Blood Group:</span> {patient.blood_group || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <Link 
                                                    href={`/dashboard/doctor/patient-record/${patient.patient_id}`}
                                                    className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold px-6 py-2.5 rounded-full shadow-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-110 hover:shadow-cyan-500/50 inline-block"
                                                >
                                                    View Record →
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
