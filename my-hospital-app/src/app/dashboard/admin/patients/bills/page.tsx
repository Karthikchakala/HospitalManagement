'use client';

import DashboardNavbar from '../../../../../components/DashboardNavbar';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { CreditCardIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Bill {
    bill_id: number;
    created_at: string;
    services: string;
    total_amount: number;
    status: string;
    Prescriptions: unknown | null;
}

export default function PatientBillsPage() {
    const router = useRouter();
    const [bills, setBills] = useState<Bill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('Patient');
    const [isProcessing, setIsProcessing] = useState(false);

    const patientNavLinks = [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: '/dashboard/patient' },
        { name: 'Appointments', href: '/dashboard/patient/appointments' },
        { name: 'Profile', href: '/dashboard/patient/profile' },
    ];

    const isUnpaid = (status: string) => status && status.toLowerCase().trim() === 'unpaid';

    const fetchBills = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        try {
            const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/patient/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserName(userResponse.data.name);

            const billsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/patient/bills`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBills(billsResponse.data);
        } catch (error) {
            console.error('Failed to fetch bills:', error);
            localStorage.removeItem('token');
            router.push('/login');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchBills();
    }, [fetchBills]);

    const handlePayment = async (bill: Bill) => {
        setIsProcessing(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        if (!confirm(`Confirm payment of ₹${bill.total_amount.toFixed(2)} for Bill ID ${bill.bill_id}?`)) {
            setIsProcessing(false);
            return;
        }

        try {
            const paymentInitResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/patient/payment/initiate`, {
                billId: bill.bill_id,
                amount: bill.total_amount
            }, { headers: { Authorization: `Bearer ${token}` } });

            const { transactionId } = paymentInitResponse.data;

            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/patient/bills/${bill.bill_id}/pay`, {
                transactionId,
                paymentMethod: 'Credit Card (Mock)'
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert(`✅ Payment successful! Bill ID ${bill.bill_id} marked as paid. Transaction ID: ${transactionId}`);
            fetchBills();

        } catch (error) {
            console.error('Payment Error:', error);
            alert('❌ Payment failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
                    <h1 className="text-slate-300 text-sm">Loading Bills...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">


            <div className="relative z-10">
                <DashboardNavbar
                    title="Patient Portal"
                    navLinks={patientNavLinks}
                    userName={userName}
                />

                <main className="container mx-auto py-12 px-6">
                    <h1 className="text-5xl font-extrabold text-cyan-200 mb-10 drop-shadow-lg">
                        My Bills & Payments
                    </h1>

                    {bills.length === 0 ? (
                        <div className="bg-slate-800/80 backdrop-blur-md border border-cyan-700/30 p-10 rounded-2xl shadow-lg text-center">
                            <CreditCardIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                            <p className="text-xl text-slate-300">No billing records found.</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {bills.map((bill, index) => {
                                const isPaid = bill.status.toLowerCase() === 'paid';
                                const unpaid = isUnpaid(bill.status);

                                // Color schemes rotation
                                const colorSchemes = [
                                    {
                                        gradient: 'from-blue-500/30 to-indigo-500/30',
                                        border: 'border-blue-400',
                                        shadow: 'shadow-blue-500/30',
                                        accent: 'text-blue-300',
                                    },
                                    {
                                        gradient: 'from-emerald-500/30 to-teal-500/30',
                                        border: 'border-emerald-400',
                                        shadow: 'shadow-emerald-500/30',
                                        accent: 'text-emerald-300',
                                    },
                                    {
                                        gradient: 'from-purple-500/30 to-violet-500/30',
                                        border: 'border-purple-400',
                                        shadow: 'shadow-purple-500/30',
                                        accent: 'text-purple-300',
                                    },
                                    {
                                        gradient: 'from-amber-500/30 to-orange-500/30',
                                        border: 'border-amber-400',
                                        shadow: 'shadow-amber-500/30',
                                        accent: 'text-amber-300',
                                    },
                                ];

                                // Use red scheme for unpaid bills
                                const colors = unpaid
                                    ? {
                                        gradient: 'from-rose-500/30 to-red-500/30',
                                        border: 'border-rose-400',
                                        shadow: 'shadow-rose-500/30',
                                        accent: 'text-rose-300',
                                    }
                                    : colorSchemes[index % colorSchemes.length];

                                return (
                                    <div
                                        key={bill.bill_id}
                                        className={`backdrop-blur-md p-6 rounded-2xl border-l-4 transition-all duration-300 hover:scale-[1.01] bg-gradient-to-br ${colors.gradient} ${colors.border} shadow-xl ${colors.shadow}`}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            {/* Bill Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.accent} bg-slate-700/50`}>
                                                        Bill #{bill.bill_id}
                                                    </span>
                                                    <span className="text-slate-300 text-sm">
                                                        📅 {new Date(bill.created_at).toLocaleDateString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>

                                                <h3 className="text-xl font-bold text-white mb-2">
                                                    {bill.services}
                                                </h3>

                                                <div className="flex items-center gap-4">
                                                    <span className="text-3xl font-extrabold text-white">
                                                        ₹{bill.total_amount.toFixed(2)}
                                                    </span>
                                                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold inline-flex items-center gap-2 ${isPaid
                                                        ? 'bg-emerald-500/30 text-emerald-200 border-2 border-emerald-400/60'
                                                        : unpaid
                                                            ? 'bg-rose-500/30 text-rose-200 border-2 border-rose-400/60'
                                                            : 'bg-amber-500/30 text-amber-200 border-2 border-amber-400/60'
                                                        }`}>
                                                        {isPaid ? (
                                                            <CheckCircleIcon className="w-4 h-4" />
                                                        ) : (
                                                            <ClockIcon className="w-4 h-4" />
                                                        )}
                                                        {bill.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div>
                                                {unpaid && (
                                                    <button
                                                        onClick={() => handlePayment(bill)}
                                                        disabled={isProcessing}
                                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-full hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <CreditCardIcon className="w-5 h-5" />
                                                        {isProcessing ? 'Processing...' : 'Pay Now'}
                                                    </button>
                                                )}
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
