'use client';

import DashboardNavbar from '../../../../../components/DashboardNavbar';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { PlusIcon, XMarkIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface MedicineCatalog {
    pharmacy_id: number;
    medicine_details: string;
    price: number;
}

interface SelectedMedicine {
    id: number;
    medicineId: string;
    quantity: number;
    price: number;
}

interface AppointmentForDispense {
    appointment_id: number;
    patient_id: number;
    patient_name: string;
    prescription_text: string;
    appointment_date: string;
}

export default function DispensaryManagementPage() {
    const router = useRouter();
    const [pendingAppointments, setPendingAppointments] = useState<AppointmentForDispense[]>([]);
    const [medicineCatalog, setMedicineCatalog] = useState<MedicineCatalog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('Pharmacist');
    const [selectedAppt, setSelectedAppt] = useState<AppointmentForDispense | null>(null);
    const [selectedMedicines, setSelectedMedicines] = useState<SelectedMedicine[]>([{
        id: Date.now(), medicineId: '', quantity: 1, price: 0
    }]);

    const pharmacistNavLinks = [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: '/dashboard/staff/pharmacist' },
        { name: 'Dispense & Bill', href: '/dashboard/staff/pharmacist/dispensary-management' },
    ];

    useEffect(() => {
        const fetchInitialData = async () => {
            const token = localStorage.getItem('token');
            if (!token) { router.push('/login'); return; }

            try {
                const userResponse = await axios.get('http://localhost:5000/api/staff/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserName(userResponse.data.name);

                const apptResponse = await axios.get('http://localhost:5000/api/staff/pharmacy/pending', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPendingAppointments(apptResponse.data);

                const medResponse = await axios.get('http://localhost:5000/api/staff/pharmacy/medicines', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMedicineCatalog(medResponse.data);

            } catch (error) {
                console.error('Failed to fetch initial data:', error);
                localStorage.removeItem('token');
                router.push('/login');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [router]);

    const handleAddMedicine = () => {
        setSelectedMedicines([...selectedMedicines, { id: Date.now(), medicineId: '', quantity: 1, price: 0 }]);
    };

    const handleRemoveMedicine = (id: number) => {
        setSelectedMedicines(selectedMedicines.filter(med => med.id !== id));
    };

    const handleMedicineChange = (id: number, field: keyof SelectedMedicine, value: string | number) => {
        setSelectedMedicines(selectedMedicines.map(med => {
            if (med.id === id) {
                if (field === 'medicineId') {
                    const selectedItem = medicineCatalog.find(cat => String(cat.pharmacy_id) === String(value));
                    return { ...med, medicineId: String(value), price: selectedItem ? selectedItem.price : 0 };
                }
                if (field === 'quantity') {
                    return { ...med, quantity: Math.max(1, Number(value)) };
                }
            }
            return med;
        }));
    };

    const totalMedicineCost = useMemo(() => {
        return selectedMedicines.reduce((total, med) => total + (med.price * med.quantity), 0);
    }, [selectedMedicines]);

    const handleDispense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAppt || totalMedicineCost <= 0) {
            alert('Please select an appointment and add medicines with a total cost greater than zero.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await axios.put(`http://localhost:5000/api/staff/pharmacy/dispense/${selectedAppt.appointment_id}`, {
                patientId: selectedAppt.patient_id,
                medicineCost: totalMedicineCost,
                totalBillAmount: totalMedicineCost,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert(`✅ Dispensed for ${selectedAppt.patient_name}. Bill of ₹${totalMedicineCost.toFixed(2)} generated.`);

            setPendingAppointments(prev => prev.filter(p => p.appointment_id !== selectedAppt.appointment_id));
            setSelectedAppt(null);
            setSelectedMedicines([{ id: Date.now(), medicineId: '', quantity: 1, price: 0 }]);

        } catch (error) {
            console.error('Dispensing failed:', error);
            alert('❌ Failed to dispense and generate bill.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-emerald-400 animate-spin" />
                    <h1 className="text-slate-300 text-sm">Loading Pharmacy Portal...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
            {/* <ParticlesBackground /> */}

            <div className="relative z-10">
                <DashboardNavbar
                    title="Pharmacist Portal"
                    navLinks={pharmacistNavLinks}
                    userName={userName}
                />

                <main className="container mx-auto py-12 px-6">
                    <div className="flex items-center gap-3 mb-10">
                        <ClipboardDocumentListIcon className="w-10 h-10 text-emerald-400" />
                        <h1 className="text-5xl font-extrabold text-emerald-200 drop-shadow-lg">
                            Prescription Dispensing & Billing
                        </h1>
                    </div>

                    {/* Billing Form */}
                    <div className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-md border-l-4 border-emerald-400 p-8 rounded-2xl shadow-2xl mb-10">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {selectedAppt ? `💊 Billing Patient: ${selectedAppt.patient_name}` : '📋 Select a Prescription Below'}
                        </h2>

                        {selectedAppt && (
                            <form onSubmit={handleDispense} className="space-y-6">

                                {/* Prescription Display */}
                                <div className="p-4 bg-emerald-600/20 border-2 border-emerald-400/50 rounded-lg">
                                    <p className="font-bold text-emerald-200 mb-2">📝 Prescription (from Doctor):</p>
                                    <pre className="text-sm whitespace-pre-wrap text-slate-200">{selectedAppt.prescription_text}</pre>
                                </div>

                                {/* Medicine List */}
                                <h3 className="text-lg font-bold text-emerald-300 border-b-2 border-emerald-500/40 pb-2">
                                    Dispensed Items
                                </h3>
                                <div className="space-y-3">
                                    {selectedMedicines.map((med) => (
                                        <div key={med.id} className="grid grid-cols-12 gap-3 items-center bg-slate-700/30 p-3 rounded-lg">

                                            {/* Medicine Dropdown */}
                                            <div className="col-span-6">
                                                <select
                                                    value={med.medicineId}
                                                    onChange={(e) => handleMedicineChange(med.id, 'medicineId', e.target.value)}
                                                    required
                                                    className="w-full p-2 bg-slate-700/50 border border-emerald-500/50 rounded-md text-white"
                                                >
                                                    <option value="">-- Select Medicine --</option>
                                                    {medicineCatalog.map(item => (
                                                        <option key={item.pharmacy_id} value={item.pharmacy_id}>
                                                            {item.medicine_details} (₹{item.price.toFixed(2)})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Quantity */}
                                            <div className="col-span-3">
                                                <input
                                                    type="number"
                                                    value={med.quantity}
                                                    onChange={(e) => handleMedicineChange(med.id, 'quantity', e.target.value)}
                                                    min="1"
                                                    required
                                                    className="w-full p-2 bg-slate-700/50 border border-emerald-500/50 rounded-md text-center text-white"
                                                />
                                            </div>

                                            {/* Subtotal */}
                                            <div className="col-span-2 text-right font-bold text-emerald-300">
                                                ₹{(med.price * med.quantity).toFixed(2)}
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMedicine(med.id)}
                                                className="col-span-1 p-2 text-rose-400 hover:bg-rose-500/20 rounded-full transition-colors"
                                            >
                                                <XMarkIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Button and Total */}
                                <div className="flex justify-between items-center pt-2">
                                    <button
                                        type="button"
                                        onClick={handleAddMedicine}
                                        className="flex items-center gap-1 px-4 py-2 bg-emerald-600/30 text-emerald-200 border border-emerald-400/50 rounded-full hover:bg-emerald-600/50 font-semibold transition-all"
                                    >
                                        <PlusIcon className="w-5 h-5" /> Add Medicine
                                    </button>

                                    <div className="text-2xl font-extrabold text-white">
                                        Total: <span className="text-emerald-300">₹{totalMedicineCost.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={totalMedicineCost <= 0}
                                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    DISPENSE & GENERATE BILL
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Pending Prescriptions */}
                    <h2 className="text-3xl font-bold text-emerald-300 mb-6 flex items-center gap-2">
                        Pending Prescriptions <span className="px-3 py-1 bg-emerald-500/30 rounded-full text-2xl">({pendingAppointments.length})</span>
                    </h2>

                    {pendingAppointments.length === 0 ? (
                        <div className="bg-slate-800/80 backdrop-blur-md border border-emerald-700/30 p-10 rounded-2xl shadow-lg text-center">
                            <ClipboardDocumentListIcon className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
                            <p className="text-xl text-emerald-300">✅ No prescriptions are currently pending dispense.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingAppointments.map(appt => (
                                <div
                                    key={appt.appointment_id}
                                    className="backdrop-blur-md p-6 rounded-xl border-l-4 border-emerald-400 transition-all duration-300 hover:scale-[1.01] bg-gradient-to-br from-emerald-500/25 to-teal-500/25 shadow-xl hover:shadow-emerald-500/30"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-2">{appt.patient_name}</h3>
                                            <p className="text-slate-200">
                                                👤 Patient ID: <span className="font-semibold">#{appt.patient_id}</span>
                                                <span className="ml-4 text-slate-400">📅 Prescribed: {new Date(appt.appointment_date).toLocaleDateString('en-IN')}</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedAppt(appt)}
                                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-full hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-emerald-500/50"
                                        >
                                            Process & Bill →
                                        </button>
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
