'use client';

import DashboardNavbar from '../../../../components/DashboardNavbar';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

declare global {
    interface Window {
        Razorpay: new (options: any) => { open: () => void };
    }
}

interface Bill {
    bill_id: number;
    created_at: string;
    services: string;
    total_amount: number;
    status: string;
    Prescriptions: Record<string, unknown> | null;
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

    const isUnpaid = (status: string) => status?.toLowerCase().trim() === 'unpaid';

    const fetchBills = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        try {
            const userResponse = await axios.get('http://localhost:5000/api/patient/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserName(userResponse.data.name);

            const billsResponse = await axios.get('http://localhost:5000/api/patient/bills', {
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

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    }, []);

    const handlePayment = async (bill: Bill) => {
        if (!window.Razorpay) {
            alert("Payment gateway not loaded. Please wait and try again.");
            return;
        }

        setIsProcessing(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        if (!confirm(`Confirm payment of ₹${bill.total_amount.toFixed(2)} for Bill ID ${bill.bill_id}?`)) {
            setIsProcessing(false);
            return;
        }

        try {
            const amountInPaise = Math.round(bill.total_amount * 100);

            const txnResponse = await axios.post('http://localhost:5000/api/patient/payment/generate-txn', {
                billId: bill.bill_id,
                amount: amountInPaise,
            }, { headers: { Authorization: `Bearer ${token}` } });

            const { orderId, keyId, amount, currency, userEmail } = txnResponse.data;

            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: 'Global Health Center',
                description: `Hospital Bill #${bill.bill_id}`,
                order_id: orderId,
                handler: async (response: { razorpay_payment_id: string }) => {
                    await axios.put(`http://localhost:5000/api/patient/bills/${bill.bill_id}/pay`, {
                        transactionId: response.razorpay_payment_id,
                        paymentMethod: 'Razorpay Online'
                    }, { headers: { Authorization: `Bearer ${token}` } });

                    alert(`✅ Payment successful! Bill ID ${bill.bill_id} marked as paid.`);
                    fetchBills();
                },
                prefill: {
                    name: userName,
                    email: userEmail,
                    contact: '8328134131'
                },
                theme: { color: '#0891b2' }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error: unknown) {
            console.error('Payment Error:', error);
            const msg = axios.isAxiosError(error) ? error.response?.data?.message : 'Check network and backend logs.';
            alert(`Payment failed: ${msg}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <h1 className="text-2xl font-bold text-slate-100">Loading Bills...</h1>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-slate-100">
            {/* Removed Particles Background */}

            {/* Navigation */}
            <DashboardNavbar
                title="Patient Portal"
                navLinks={patientNavLinks}
                userName={userName}
            />

            {/* Main Content */}
            <main className="relative z-10 container mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-cyan-300 text-center md:text-left">
                    My Bills
                </h1>

                <div className="bg-slate-800/90 border border-cyan-600/40 p-6 md:p-8 rounded-2xl shadow-xl hover:shadow-cyan-500/20 transition-all duration-300">
                    {bills.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-xl md:text-2xl text-slate-300">
                                No billing records found.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm md:text-base">
                                <thead>
                                    <tr className="border-b-2 border-cyan-500/40">
                                        <th className="px-4 md:px-6 py-3 text-left font-bold text-cyan-300 uppercase tracking-wider">
                                            Bill ID
                                        </th>
                                        <th className="px-4 md:px-6 py-3 text-left font-bold text-cyan-300 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-4 md:px-6 py-3 text-left font-bold text-cyan-300 uppercase tracking-wider">
                                            Services
                                        </th>
                                        <th className="px-4 md:px-6 py-3 text-right font-bold text-cyan-300 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-4 md:px-6 py-3 text-center font-bold text-cyan-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 md:px-6 py-3 text-center font-bold text-cyan-300 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {bills.map((bill) => (
                                        <tr
                                            key={bill.bill_id}
                                            className={`border-b border-slate-700 hover:bg-slate-700/60 transition-all ${isUnpaid(bill.status) ? 'bg-red-500/5 hover:bg-red-500/15' : ''
                                                }`}
                                        >
                                            <td className="px-4 md:px-6 py-4 font-semibold text-cyan-400">
                                                #{bill.bill_id}
                                            </td>
                                            <td className="px-4 md:px-6 py-4">
                                                {new Date(bill.created_at).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-4 md:px-6 py-4">
                                                {bill.services}
                                            </td>
                                            <td className="px-4 md:px-6 py-4 text-right font-bold text-cyan-300">
                                                ₹{bill.total_amount.toFixed(2)}
                                            </td>
                                            <td className="px-4 md:px-6 py-4 text-center">
                                                <span className={`px-3 py-1 inline-flex text-xs md:text-sm font-bold rounded-full ${bill.status === 'Paid'
                                                        ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50'
                                                        : isUnpaid(bill.status)
                                                            ? 'bg-red-500/30 text-red-200 border border-red-400/50'
                                                            : 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                                                    }`}>
                                                    {bill.status}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 text-center">
                                                {isUnpaid(bill.status) ? (
                                                    <button
                                                        onClick={() => handlePayment(bill)}
                                                        disabled={isProcessing}
                                                        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2 px-4 md:px-6 rounded-full font-semibold hover:scale-105 hover:from-emerald-600 hover:to-teal-600 transition-transform shadow-md hover:shadow-emerald-400/50 disabled:opacity-50"
                                                    >
                                                        {isProcessing ? 'Processing...' : 'Pay Now'}
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-400 text-sm">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
