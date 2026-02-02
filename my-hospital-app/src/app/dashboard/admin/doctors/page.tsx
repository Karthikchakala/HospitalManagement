'use client';

import DashboardNavbar from '../../../../components/DashboardNavbar';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DoctorSummary {
    id: number;
    user_id: number;
    name: string;
    email: string;
    specialization: string;
    license: string;
}

const ALL_SPECIALIZATIONS = ['Pending', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine'];

export default function AdminDoctorManagementPage() {
    const router = useRouter();
    const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [adminName] = useState('Admin User');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Omit<DoctorSummary, 'id' | 'user_id'> & { user_id: number, staff_id: number }>({
        name: '',
        email: '',
        specialization: '',
        license: '',
        user_id: 0,
        staff_id: 0,
    });

    const adminNavLinks = [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: '/dashboard/admin' },
        { name: 'User Management', href: '/dashboard/admin/doctors' },
        { name: 'Settings', href: '/dashboard/admin/settings' },
    ];

    const fetchDoctors = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        try {
            const response = await axios.get('http://localhost:5000/api/admin/doctors', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDoctors(response.data);
        } catch (error) {
            console.error('Failed to fetch doctor data:', error);
            alert('Access denied or failed to load data.');
            router.push('/dashboard/admin');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    const handleEditClick = (doctor: DoctorSummary) => {
        setEditingId(doctor.id);
        setEditForm({
            name: doctor.name,
            email: doctor.email,
            specialization: doctor.specialization,
            license: doctor.license,
            user_id: doctor.user_id,
            staff_id: doctor.id,
        });
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!token || !editingId) return;

        if (!editForm.name || !editForm.email || !editForm.specialization) {
            alert("Name, Email, and Specialization are required.");
            return;
        }

        try {
            const response = await axios.put(`http://localhost:5000/api/admin/doctors/${editingId}`, {
                name: editForm.name,
                email: editForm.email,
                specialization: editForm.specialization,
                license: editForm.license,
                user_id: editForm.user_id,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const updatedData = response.data;
            setDoctors(doctors.map(member =>
                member.id === editingId ? {
                    ...member,
                    name: updatedData.name,
                    email: updatedData.email,
                    specialization: updatedData.specialization,
                    license: updatedData.license,
                } : member
            ));

            setEditingId(null);
            alert('✅ Doctor profile updated successfully!');
        } catch (error) {
            console.error('Update failed:', error);
            alert('❌ Failed to save changes.');
        }
    };

    const getFieldValue = (obj: unknown, field: string) => {
        const value = (obj as Record<string, unknown>)[field];
        return value === null || value === undefined ? '' : String(value);
    };

    const DataCell = ({ member, field, isEditing, type = 'text' }: {
        member: DoctorSummary,
        field: keyof DoctorSummary,
        isEditing: boolean,
        type?: string
    }) => {
        const fieldString = field as string;
        const currentValue = getFieldValue(editForm, fieldString);

        return (
            <td className="px-6 py-4 whitespace-nowrap text-sm">
                {isEditing ? (
                    fieldString === 'specialization' ? (
                        <select
                            value={currentValue}
                            onChange={(e) => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                            className="p-2 bg-slate-700/50 border border-cyan-500/50 rounded-md text-slate-100 focus:border-cyan-400 w-full"
                        >
                            {ALL_SPECIALIZATIONS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={type}
                            value={currentValue}
                            onChange={(e) => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                            key={fieldString + member.id}
                            className="p-2 bg-slate-700/50 border border-cyan-500/50 rounded-md text-slate-100 focus:border-cyan-400 w-full"
                        />
                    )
                ) : (
                    <span className="text-slate-200 font-medium">{getFieldValue(member, fieldString)}</span>
                )}
            </td>
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
                    <h1 className="text-slate-300 text-sm">Loading Doctor Directory...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
            {/* ✅ Plexus Background */}
            {/* ✅ Plexus Background */}

            <div className="relative z-10">
                <DashboardNavbar
                    title="Admin Portal"
                    navLinks={adminNavLinks}
                    userName={adminName}
                />

                <main className="container mx-auto py-12 px-6">
                    <h1 className="text-5xl font-extrabold text-cyan-200 mb-10 drop-shadow-lg">
                        Doctor Management
                    </h1>

                    {doctors.length === 0 ? (
                        <div className="bg-slate-800/80 backdrop-blur-md border border-cyan-700/30 p-10 rounded-2xl shadow-lg text-center">
                            <p className="text-xl text-slate-300">No doctor profiles found in the system.</p>
                        </div>
                    ) : (
                        <div className="bg-slate-800/80 backdrop-blur-md border border-cyan-700/30 rounded-2xl shadow-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b-2 border-cyan-500/40 bg-slate-700/50">
                                            <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">Name</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">Email</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">Specialization</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">License No.</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-cyan-300 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {doctors.map((doctor) => (
                                            <tr
                                                key={doctor.id}
                                                className={`border-b border-slate-700/50 transition-colors duration-200 ${editingId === doctor.id
                                                    ? 'bg-cyan-500/20'
                                                    : 'hover:bg-slate-700/30'
                                                    }`}
                                            >
                                                <DataCell member={doctor} field="name" isEditing={editingId === doctor.id} />
                                                <DataCell member={doctor} field="email" isEditing={editingId === doctor.id} type="email" />
                                                <DataCell member={doctor} field="specialization" isEditing={editingId === doctor.id} />
                                                <DataCell member={doctor} field="license" isEditing={editingId === doctor.id} />

                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                    {editingId === doctor.id ? (
                                                        <>
                                                            <button
                                                                onClick={handleSave}
                                                                className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors inline-flex items-center gap-1"
                                                            >
                                                                <CheckIcon className="w-5 h-5" /> Save
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="text-rose-400 hover:text-rose-300 font-bold transition-colors inline-flex items-center gap-1"
                                                            >
                                                                <XMarkIcon className="w-5 h-5" /> Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEditClick(doctor)}
                                                            className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
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
