'use client';

import DashboardNavbar from '../../../../components/DashboardNavbar';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { CheckIcon, XMarkIcon, UsersIcon } from '@heroicons/react/24/outline';

interface StaffSummary {
    id: number;
    name: string;
    email: string;
    designation: string;
    user_id: number;
}

const ALL_DESIGNATIONS = ['Receptionist', 'Lab Technician', 'Pharmacist', 'Unassigned'];

export default function AdminStaffManagementPage() {
    const router = useRouter();
    const [staff, setStaff] = useState<StaffSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [adminName] = useState('Admin User');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        designation: '',
        user_id: 0,
        staff_id: 0
    });

    const adminNavLinks = [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: '/dashboard/admin' },
        { name: 'Doctors', href: '/dashboard/admin/doctors' },
        { name: 'Staff', href: '/dashboard/admin/staff' },
    ];

    const fetchStaff = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/staff`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaff(response.data);
        } catch (error) {
            console.error('Failed to fetch staff data:', error);
            alert('Access denied or failed to load data.');
            router.push('/dashboard/admin');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    const handleEditClick = (member: StaffSummary) => {
        setEditingId(member.id);
        setEditForm({
            name: member.name,
            email: member.email,
            designation: member.designation,
            user_id: member.user_id,
            staff_id: member.id,
        });
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!token || !editingId) return;

        if (!editForm.name || !editForm.email || !editForm.designation) {
            alert("All fields must be filled.");
            return;
        }

        try {
            const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/staff/${editingId}`, {
                name: editForm.name,
                email: editForm.email,
                designation: editForm.designation,
                user_id: editForm.user_id,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const updatedData = response.data;
            setStaff(staff.map(member =>
                member.id === editingId ? {
                    ...member,
                    name: updatedData.name,
                    email: updatedData.email,
                    designation: updatedData.designation
                } : member
            ));

            setEditingId(null);
            alert('✅ Staff profile updated successfully!');

        } catch (error) {
            console.error('Update failed:', error);
            alert('❌ Failed to save changes.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
                    <h1 className="text-slate-300 text-sm">Loading Staff Directory...</h1>
                </div>
            </div>
        );
    }

    // Get designation color
    const getDesignationColor = (designation: string) => {
        switch (designation) {
            case 'Receptionist':
                return { bg: 'bg-blue-500/20', border: 'border-blue-400/40', text: 'text-blue-300' };
            case 'Lab Technician':
                return { bg: 'bg-emerald-500/20', border: 'border-emerald-400/40', text: 'text-emerald-300' };
            case 'Pharmacist':
                return { bg: 'bg-purple-500/20', border: 'border-purple-400/40', text: 'text-purple-300' };
            default:
                return { bg: 'bg-slate-500/20', border: 'border-slate-400/40', text: 'text-slate-300' };
        }
    };

    return (
        <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">


            <div className="relative z-10">
                <DashboardNavbar
                    title="Admin Portal"
                    navLinks={adminNavLinks}
                    userName={adminName}
                />

                <main className="container mx-auto py-12 px-6">
                    {/* Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-3">
                            <UsersIcon className="w-10 h-10 text-cyan-400" />
                            <h1 className="text-5xl font-extrabold text-cyan-200 drop-shadow-lg">
                                Staff Management
                            </h1>
                        </div>
                        <p className="text-slate-400 text-lg">
                            Total Staff Members: <span className="font-bold text-cyan-300">{staff.length}</span>
                        </p>
                    </div>

                    {staff.length === 0 ? (
                        <div className="bg-slate-800/80 backdrop-blur-md border border-cyan-700/30 p-10 rounded-2xl shadow-lg text-center">
                            <UsersIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                            <p className="text-xl text-slate-300">No staff members found in the system.</p>
                        </div>
                    ) : (
                        <div className="bg-slate-800/80 backdrop-blur-md border border-cyan-700/30 rounded-2xl shadow-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b-2 border-cyan-500/40 bg-slate-700/50">
                                            <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">
                                                Name
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">
                                                Email
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">
                                                Designation
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-cyan-300 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staff.map((member) => {
                                            const colors = getDesignationColor(member.designation);
                                            return (
                                                <tr
                                                    key={member.id}
                                                    className={`border-b border-slate-700/50 transition-all duration-200 ${editingId === member.id
                                                            ? 'bg-cyan-500/20'
                                                            : 'hover:bg-slate-700/30'
                                                        }`}
                                                >
                                                    {/* Name */}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {editingId === member.id ? (
                                                            <input
                                                                type="text"
                                                                value={editForm.name}
                                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                                className="p-2 bg-slate-700/50 border border-cyan-500/50 rounded-md text-slate-100 focus:border-cyan-400 w-full"
                                                            />
                                                        ) : (
                                                            <span className="text-white font-semibold">{member.name}</span>
                                                        )}
                                                    </td>

                                                    {/* Email */}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {editingId === member.id ? (
                                                            <input
                                                                type="email"
                                                                value={editForm.email}
                                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                                className="p-2 bg-slate-700/50 border border-cyan-500/50 rounded-md text-slate-100 focus:border-cyan-400 w-full"
                                                            />
                                                        ) : (
                                                            <span className="text-slate-300">{member.email}</span>
                                                        )}
                                                    </td>

                                                    {/* Designation */}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {editingId === member.id ? (
                                                            <select
                                                                value={editForm.designation}
                                                                onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                                                                className="p-2 bg-slate-700/50 border border-cyan-500/50 rounded-md text-slate-100 focus:border-cyan-400 w-full"
                                                            >
                                                                {ALL_DESIGNATIONS.map(d => (
                                                                    <option key={d} value={d}>{d}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <span className={`px-3 py-1.5 ${colors.bg} border ${colors.border} rounded-full ${colors.text} font-semibold`}>
                                                                {member.designation}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                        {editingId === member.id ? (
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
                                                                onClick={() => handleEditClick(member)}
                                                                className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
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
