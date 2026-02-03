'use client';

import DashboardNavbar from '../../../../../components/DashboardNavbar';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { UserPlusIcon } from '@heroicons/react/24/outline';

interface Department {
    department_id: number;
    name: string;
}

interface Doctor {
    doctor_id: number;
    name: string;
    specialization: string;
}

export default function ReceptionistPatientRegistrationPage() {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [price, setPrice] = useState(0);
    const [formData, setFormData] = useState({
        name: '', email: '',
        age: '', gender: '', street: '', city: '', state: '', country: '',
        selectedDepartment: '', selectedDoctor: '', selectedDate: '', selectedTime: '', reason: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [staffName, setStaffName] = useState('Receptionist User');

    const staffNavLinks = [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: '/dashboard/staff/receptionist' },
        { name: 'Patient Reg', href: '/dashboard/staff/receptionist/patient-registration' },
    ];

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const fetchData = async () => {
            try {
                const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStaffName(userResponse.data.name);

                const deptResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/patient/appointments/departments`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDepartments(deptResponse.data);
            } catch (err) {
                console.error('Failed to fetch initial data:', err);
            }
        };
        fetchData();
    }, [router]);

    useEffect(() => {
        if (formData.selectedDepartment) {
            const fetchDoctors = async () => {
                const token = localStorage.getItem('token');
                try {
                    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/patient/appointments/doctors/${formData.selectedDepartment}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setDoctors(response.data.map((doc: { doctor_id: number; User: { name: string }; specialization: string }) => ({
                        doctor_id: doc.doctor_id,
                        name: doc.User.name,
                        specialization: doc.specialization
                    })));
                } catch (error) {
                    console.error('Failed to fetch doctors:', error);
                }
            };
            fetchDoctors();
        } else {
            setDoctors([]);
        }
    }, [formData.selectedDepartment]);

    useEffect(() => {
        if (formData.selectedDoctor && formData.selectedDate) {
            const fetchTimeSlots = async () => {
                const token = localStorage.getItem('token');
                try {
                    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/patient/appointments/times/${formData.selectedDoctor}/${formData.selectedDate}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setTimeSlots(response.data.timeSlots);
                    setPrice(response.data.price);
                } catch (error) {
                    console.error('Failed to fetch time slots:', error);
                }
            };
            fetchTimeSlots();
        } else {
            setTimeSlots([]);
            setPrice(0);
        }
    }, [formData.selectedDoctor, formData.selectedDate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const token = localStorage.getItem('token');
        if (!token) { setError('Session expired.'); setIsSubmitting(false); return; }

        if (!formData.name || !formData.email || !formData.selectedDoctor || !formData.selectedDate || !formData.selectedTime) {
            setError('Please fill out all required fields (Name, Email, Doctor, Date, Time).');
            setIsSubmitting(false);
            return;
        }

        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                role: 'patient',
                age: formData.age ? parseInt(formData.age) : null,
                gender: formData.gender,
                street: formData.street,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                doctorId: formData.selectedDoctor,
                appointmentDate: formData.selectedDate,
                appointmentTime: formData.selectedTime,
                reason: formData.reason || 'Initial consultation.',
            };

            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/register-patient`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const tempPassword = response.data.tempPassword;
            alert(`✅ Patient ${formData.name} registered and appointment booked!\n\nTemp Password: ${tempPassword}`);

            setFormData({
                name: '', email: '',
                age: '', gender: '', street: '', city: '', state: '', country: '',
                selectedDepartment: '', selectedDoctor: '', selectedDate: '', selectedTime: '', reason: '',
            });

        } catch (err) {
            setError('❌ Registration failed. Check console for details.');
            console.error('Staff Patient Reg Error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
            {/* <ParticlesBackground /> */}

            <div className="relative z-10">
                <DashboardNavbar
                    title="Receptionist Portal"
                    navLinks={staffNavLinks}
                    userName={staffName}
                />

                <main className="container mx-auto py-12 px-6">
                    <div className="flex items-center gap-3 mb-10">
                        <UserPlusIcon className="w-10 h-10 text-blue-400" />
                        <h1 className="text-5xl font-extrabold text-blue-200 drop-shadow-lg">
                            Patient Intake & Booking
                        </h1>
                    </div>

                    <div className="bg-slate-800/80 backdrop-blur-md border border-blue-700/30 p-8 rounded-2xl shadow-2xl max-w-5xl mx-auto">
                        {error && (
                            <p className="text-rose-300 bg-rose-500/20 border-2 border-rose-400/50 text-center mb-6 p-3 rounded-lg font-semibold">
                                {error}
                            </p>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Patient Details */}
                            <h2 className="text-2xl font-bold text-blue-300 border-b-2 border-blue-500/40 pb-3">
                                Patient Details
                            </h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-3 bg-slate-700/50 border-2 border-blue-500/50 rounded-lg text-white focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-2">Email (Login ID) *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-3 bg-slate-700/50 border-2 border-blue-500/50 rounded-lg text-white focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-2">Age</label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-700/50 border-2 border-blue-500/50 rounded-lg text-white focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-2">Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-700/50 border-2 border-blue-500/50 rounded-lg text-white focus:border-blue-400"
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-slate-300 font-semibold mb-2">Street Address</label>
                                    <input
                                        type="text"
                                        name="street"
                                        value={formData.street}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-700/50 border-2 border-blue-500/50 rounded-lg text-white focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-2">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-700/50 border-2 border-blue-500/50 rounded-lg text-white focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-2">State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-700/50 border-2 border-blue-500/50 rounded-lg text-white focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-2">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-700/50 border-2 border-blue-500/50 rounded-lg text-white focus:border-blue-400"
                                    />
                                </div>
                            </div>

                            {/* Appointment Booking */}
                            <h2 className="text-2xl font-bold text-cyan-300 border-b-2 border-cyan-500/40 pb-3 pt-4">
                                Appointment Booking
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-2">Select Department *</label>
                                    <select
                                        name="selectedDepartment"
                                        value={formData.selectedDepartment}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-700/50 border-2 border-cyan-500/50 rounded-lg text-white focus:border-cyan-400"
                                    >
                                        <option value="">-- Choose Department --</option>
                                        {departments.map(dept => (
                                            <option key={dept.department_id} value={dept.department_id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-2">Select Doctor *</label>
                                    <select
                                        name="selectedDoctor"
                                        value={formData.selectedDoctor}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-700/50 border-2 border-cyan-500/50 rounded-lg text-white focus:border-cyan-400"
                                        disabled={!formData.selectedDepartment}
                                    >
                                        <option value="">-- Choose Doctor --</option>
                                        {doctors.map(doctor => (
                                            <option key={doctor.doctor_id} value={doctor.doctor_id}>
                                                Dr. {doctor.name} - ({doctor.specialization})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-2">Appointment Date *</label>
                                    <input
                                        type="date"
                                        name="selectedDate"
                                        value={formData.selectedDate}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-700/50 border-2 border-cyan-500/50 rounded-lg text-white focus:border-cyan-400"
                                        disabled={!formData.selectedDoctor}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-2">Time Slot *</label>
                                    <select
                                        name="selectedTime"
                                        value={formData.selectedTime}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-700/50 border-2 border-cyan-500/50 rounded-lg text-white focus:border-cyan-400"
                                        disabled={!formData.selectedDate}
                                    >
                                        <option value="">-- Select Time --</option>
                                        {timeSlots.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-slate-300 font-semibold mb-2">Reason for Visit</label>
                                    <textarea
                                        name="reason"
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        rows={2}
                                        className="w-full p-3 bg-slate-700/50 border-2 border-cyan-500/50 rounded-lg text-white focus:border-cyan-400"
                                    />
                                </div>
                            </div>

                            {/* Price and Submit */}
                            {price > 0 && (
                                <div className="flex justify-end items-center text-2xl font-bold mt-4">
                                    Consultation Fee: <span className="text-cyan-300 ml-2">₹{price}</span>
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.selectedTime}
                                className={`w-full py-4 text-white font-bold rounded-lg transition-all duration-300 transform ${isSubmitting || !formData.selectedTime
                                    ? 'bg-slate-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 hover:scale-105 shadow-lg hover:shadow-blue-500/50'
                                    }`}
                            >
                                {isSubmitting ? 'Registering & Booking...' : 'Register Patient & Book Appointment'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
