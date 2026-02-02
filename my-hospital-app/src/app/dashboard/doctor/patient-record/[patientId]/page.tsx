'use client';

import DashboardNavbar from '../../../../../components/DashboardNavbar';
import ParticlesBackground from '../../../../../components/ParticlesBackground'; // ✅ Added
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface FileLink {
    type: string;
    url: string;
    public_id: string;
}

interface EMR {
    record_id: number;
    visit_date: string;
    diagnosis: string;
    prescriptions: string;
    notes: string;
    file_links: FileLink[];
    doctor_name: string;
    patient_name: string;
}

export default function DoctorPatientRecordPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.patientId as string;
    
    const [records, setRecords] = useState<EMR[]>([]);
    const [patientName, setPatientName] = useState('Loading Patient...');
    const [isLoading, setIsLoading] = useState(true);
    const doctorName = 'Dr. User';

    const doctorNavLinks = [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: '/dashboard/doctor' },
        { name: 'Profile', href: '/dashboard/doctor/profile' },
        { name: 'Patients', href: '/dashboard/doctor/patients' },
    ];

    useEffect(() => {
        const fetchRecords = async () => {
            const token = localStorage.getItem('token');
            if (!token || !patientId) { router.push('/login'); return; }

            try {
                const response = await axios.get(`http://localhost:5000/api/doctor/patient-emrs/${patientId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                setRecords(response.data);
                
                if (response.data.length > 0) {
                    setPatientName(response.data[0].patient_name);
                }

            } catch (error) {
                console.error('Failed to fetch patient records:', error);
                alert('Failed to load records.');
                router.push('/dashboard/doctor/patients');
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecords();
    }, [router, patientId]);

    const getFileIcon = (type: string) => {
        if (type.includes('LabResult')) 
            return <DocumentTextIcon className="w-5 h-5 mr-1 text-teal-300" />;
        return <DocumentTextIcon className="w-5 h-5 mr-1 text-purple-300" />;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
                    <h1 className="text-slate-300 text-sm">Loading Patient History...</h1>
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
                    userName={doctorName} 
                />
                
                <main className="container mx-auto py-12 px-6">
                    <h1 className="text-5xl font-extrabold text-cyan-200 mb-2 drop-shadow-lg">
                        Medical History for {patientName}
                    </h1>
                    <p className="mb-10 text-lg text-cyan-300">Patient ID: {patientId}</p>
                    
                    {records.length === 0 ? (
                        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-md border border-cyan-700/30 p-8 rounded-2xl shadow-lg">
                            <p className="text-xl text-slate-300 text-center">
                                No medical records found that you have authored for this patient.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {records.map((record, index) => {
                                // Color rotation for variety
                                const colorSchemes = [
                                    {
                                        gradient: 'from-purple-500/25 to-violet-500/25',
                                        border: 'border-purple-400',
                                        shadow: 'shadow-purple-500/30',
                                        accent: 'text-purple-300',
                                    },
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
                                        gradient: 'from-emerald-500/25 to-green-500/25',
                                        border: 'border-emerald-400',
                                        shadow: 'shadow-emerald-500/30',
                                        accent: 'text-emerald-300',
                                    },
                                ];

                                const colors = colorSchemes[index % colorSchemes.length];

                                return (
                                    <div 
                                        key={record.record_id} 
                                        className={`backdrop-blur-md p-6 rounded-2xl border-l-4 transition-all duration-300 hover:scale-[1.01] bg-gradient-to-br ${colors.gradient} ${colors.border} shadow-xl ${colors.shadow}`}
                                    >
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 pb-3 border-b border-slate-700/50">
                                            <h2 className="text-2xl font-bold text-white">
                                                Diagnosis: {record.diagnosis}
                                            </h2>
                                            <span className={`text-sm font-medium ${colors.accent} bg-slate-700/50 px-3 py-1 rounded-full mt-2 md:mt-0`}>
                                                {new Date(record.visit_date).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <p className="text-slate-200">
                                                <span className={`font-semibold ${colors.accent}`}>Prescriptions:</span>{' '}
                                                {record.prescriptions || 'None recorded.'}
                                            </p>
                                            <p className="text-slate-300">
                                                <span className={`font-semibold ${colors.accent}`}>Doctor Notes:</span>{' '}
                                                {record.notes || 'No internal notes.'}
                                            </p>
                                        </div>

                                        {/* File Links */}
                                        {record.file_links && record.file_links.length > 0 && (
                                            <div className="pt-4 mt-4 border-t border-slate-700/50">
                                                <p className={`font-semibold ${colors.accent} mb-3`}>
                                                    Attached Documents:
                                                </p>
                                                <div className="flex flex-wrap gap-3">
                                                    {record.file_links.map((file, idx) => (
                                                        <a 
                                                            key={idx}
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`inline-flex items-center px-4 py-2 bg-slate-700/50 border-2 ${colors.border} rounded-full text-sm font-medium text-slate-100 hover:bg-slate-600/50 transition-all duration-300 transform hover:scale-105 shadow-lg`}
                                                        >
                                                            {getFileIcon(file.type)}
                                                            {file.type === 'DoctorNote' ? 'Prescription' : 'Lab Result'}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
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
