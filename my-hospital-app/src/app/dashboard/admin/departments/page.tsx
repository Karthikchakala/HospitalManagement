'use client';

import DashboardNavbar from '../../../../components/DashboardNavbar';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Department {
    department_id: number;
    name: string;
    description: string;
}

export default function AdminDepartmentsPage() {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formState, setFormState] = useState({
        id: null as number | null,
        name: '',
        description: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [adminName] = useState('Admin User');

    const adminNavLinks = [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: '/dashboard/admin' },
        { name: 'User Management', href: '/dashboard/admin/doctors' },
        { name: 'Settings', href: '/dashboard/admin/settings' },
    ];

    const fetchDepartments = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/admin/departments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDepartments(response.data);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
            router.push('/dashboard/admin');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    const handleEdit = (dept: Department) => {
        setFormState({
            id: dept.department_id,
            name: dept.name,
            description: dept.description,
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setFormState({ id: null, name: '', description: '' });
        setIsEditing(false);
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete the department: ${name}?`)) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/admin/departments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('✅ Department deleted successfully!');
            fetchDepartments();
        } catch (error) {
            console.error('Deletion error:', error);
            alert('❌ Failed to delete. Check if doctors/staff are still assigned.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!formState.name || !token) return;

        const url = isEditing
            ? `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/admin/departments/${formState.id}`
            : `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/admin/departments`;
        const method = isEditing ? axios.put : axios.post;

        try {
            await method(url, { name: formState.name, description: formState.description }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(`✅ Department ${isEditing ? 'updated' : 'created'} successfully!`);
            handleCancel();
            fetchDepartments();
        } catch (error) {
            alert(`❌ Failed to ${isEditing ? 'update' : 'create'} department.`);
            console.error('Submission error:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
                    <h1 className="text-slate-300 text-sm">Loading Departments...</h1>
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
                        {isEditing ? 'Edit Department' : 'Department Management'}
                    </h1>

                    {/* Add/Edit Form */}
                    <div className="bg-gradient-to-br from-indigo-500/25 to-purple-500/25 backdrop-blur-md border-l-4 border-indigo-400 p-8 rounded-2xl shadow-2xl mb-10">
                        <h2 className="text-2xl font-bold text-indigo-200 mb-6">
                            {isEditing ? `Editing: ${formState.name}` : 'Add New Department'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-slate-300 font-semibold mb-2">Department Name</label>
                                <input
                                    type="text"
                                    value={formState.name}
                                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                    required
                                    className="w-full p-3 bg-slate-700/50 border border-indigo-500/50 rounded-md text-slate-100 focus:border-indigo-400 focus:ring focus:ring-indigo-400/30"
                                    placeholder="e.g., Cardiology, Radiology"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-300 font-semibold mb-2">Description (Optional)</label>
                                <textarea
                                    value={formState.description}
                                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                                    rows={3}
                                    className="w-full p-3 bg-slate-700/50 border border-indigo-500/50 rounded-md text-slate-100 focus:border-indigo-400"
                                    placeholder="Brief description..."
                                />
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-md hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/50"
                                >
                                    {isEditing ? 'Save Changes' : 'Create Department'}
                                </button>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="py-3 px-6 bg-slate-600 text-slate-100 font-semibold rounded-md hover:bg-slate-700 transition-all duration-300"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Departments List */}
                    <h2 className="text-3xl font-bold text-cyan-300 mb-6 border-b-2 border-cyan-500/40 pb-3">
                        Existing Departments ({departments.length})
                    </h2>

                    <div className="bg-slate-800/80 backdrop-blur-md border border-cyan-700/30 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b-2 border-cyan-500/40 bg-slate-700/50">
                                        <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">ID</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase">Description</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-cyan-300 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departments.map((dept) => (
                                        <tr
                                            key={dept.department_id}
                                            className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors duration-200"
                                        >
                                            <td className="px-6 py-4 text-sm font-bold text-cyan-400">
                                                #{dept.department_id}
                                            </td>
                                            <td className="px-6 py-4 text-base font-bold text-white">
                                                {dept.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-300">
                                                {dept.description || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-3">
                                                <button
                                                    onClick={() => handleEdit(dept)}
                                                    className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(dept.department_id, dept.name)}
                                                    className="text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
