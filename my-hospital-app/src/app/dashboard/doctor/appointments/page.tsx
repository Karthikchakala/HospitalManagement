'use client';

import DashboardNavbar from '../../../../components/DashboardNavbar';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';



interface Appointment {
    appointment_id: number;
    appointment_date: string;
    appointment_time: string;
    reason: string;
    status: string;
    // CRITICAL: The patient data is now flattened in the backend mapping
    patient_name: string;
    patient_id: number;
}

export default function DoctorAppointmentsPage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loggedInDoctorId, setLoggedInDoctorId] = useState<number | null>(null);
    const [userName, setUserName] = useState('Doctor');

    const doctorNavLinks = [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: '/dashboard/doctor' },
        { name: 'Profile', href: '/dashboard/doctor/profile' },
        { name: 'Appointments', href: '/dashboard/doctor/appointments' },
    ];

    useEffect(() => {
        const fetchAppointments = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                // Fetch profile data
                const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/doctor/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const { name, Doctor } = userResponse.data;
                const doctorId = Array.isArray(Doctor) && Doctor.length > 0 ? Doctor[0].doctor_id : null;

                if (!doctorId) {
                    alert('Doctor profile incomplete. Please complete your profile.');
                    return;
                }

                setUserName(name);
                setLoggedInDoctorId(doctorId);

                const apptsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/doctor/appointments`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                // Assuming apptsResponse.data is the array provided in the prompt
                setAppointments(apptsResponse.data);
                console.log(apptsResponse.data);
            } catch (error) {
                console.error('Failed to fetch data:', error);
                localStorage.removeItem('token');
                router.push('/login');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAppointments();
    }, [router]);

    const handleComplete = async (appointmentId: number, patientName: string) => {
        const token = localStorage.getItem('token');
        if (!token || !loggedInDoctorId) return;

        if (!confirm(`Mark ${patientName}'s appointment as completed?`)) return;

        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/api/doctor/appointments/${appointmentId}/complete`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert(`Appointment for ${patientName} marked as completed.`);

            setAppointments((prev) =>
                prev.map((appt) =>
                    appt.appointment_id === appointmentId ? { ...appt, status: 'Completed' } : appt
                )
            );
        } catch (error) {
            console.error('Completion failure:', error);
            alert('Failed to complete appointment.');
        }
    };

    const formatDate = (dateString: string) => {
        // FIX: If date is DD/MM/YYYY (non-standard), we must parse it correctly.
        // For standard ISO strings (YYYY-MM-DD), this works fine.
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
                    <h1 className="text-slate-300 text-sm">Loading your schedule...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
            {/* <ParticlesBackground /> */}

            <div className="relative z-10">
                <DashboardNavbar
                    title="Doctor Portal"
                    navLinks={doctorNavLinks}
                    userName={userName}
                />

                <main className="container mx-auto py-12 px-6">
                    <h1 className="text-5xl font-extrabold mb-10 text-cyan-200 drop-shadow-lg">
                        Today&apos;s Appointment Schedule
                    </h1>

                    <div className="space-y-6">
                        {appointments.length === 0 ? (
                            <div className="bg-gradient-to-br from-purple-900/50 to-violet-900/50 backdrop-blur-lg border-l-4 border-purple-400 p-8 rounded-xl shadow-lg text-center">
                                <p className="text-slate-200 text-lg">
                                    You have no upcoming appointments at the moment.
                                </p>
                            </div>
                        ) : (
                            appointments.map((appt) => (
                                <div
                                    key={appt.appointment_id}
                                    className={`backdrop-blur-sm p-6 rounded-xl border-l-4 transition-all duration-300 hover:scale-[1.01] ${appt.status === 'Completed'
                                            ? 'bg-gradient-to-br from-emerald-600/50 to-teal-600/50 border-emerald-400 shadow-lg shadow-emerald-500/20'
                                            : 'bg-gradient-to-br from-purple-600/50 via-violet-600/50 to-fuchsia-900/50 border-purple-400 shadow-lg shadow-purple-500/20'
                                        }`}
                                >
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                        {/* Left Side: Patient Info & Details */}
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold text-white mb-1">
                                                {/* CRITICAL: Display Patient Name and Time */}
                                                {appt.patient_name} - {appt.appointment_time.slice(0, 5)}
                                            </h2>

                                            <div className="space-y-1">
                                                {/* FIX: Displaying the actual reason for the visit */}
                                                <p className="text-slate-300">
                                                    <span className={`font-semibold ${appt.status === 'Completed' ? 'text-emerald-300' : 'text-purple-300'
                                                        }`}>
                                                        Reason:
                                                    </span>{' '}
                                                    {appt.reason}
                                                </p>
                                                {/* NOTE: We removed the duplicate and incorrect references to notes/prescriptions */}

                                                <p className="text-slate-400 text-sm">
                                                    <span className="font-semibold">Date:</span> {formatDate(appt.appointment_date)}
                                                </p>
                                                <p className="text-slate-400 text-sm">
                                                    <span className="font-semibold">Doctor:</span> Dr. {userName}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right Side - Status & Action */}
                                        <div className="flex flex-col items-end gap-3">
                                            {/* Status Badge */}
                                            <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${appt.status === 'Completed'
                                                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50'
                                                    : 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
                                                }`}>
                                                {appt.status.toUpperCase()}
                                            </div>

                                            {/* Complete Button */}
                                            {appt.status === 'Scheduled' && (
                                                <button
                                                    onClick={() => handleComplete(appt.appointment_id, appt.patient_name)}
                                                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold px-5 py-2 rounded-full shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 hover:shadow-emerald-500/50"
                                                >
                                                    Complete Appointment
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}