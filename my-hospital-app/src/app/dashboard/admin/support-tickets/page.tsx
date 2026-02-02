'use client';

import DashboardNavbar from '../../../../components/DashboardNavbar';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface TicketSummary {
    id: number;
    type: string;
    subject: string;
    content: string;
    submitter: string;
    email: string;
    timestamp: string;
    status: string;
    isUrgent: boolean;
}

export default function AdminSupportTicketsPage() {
    const router = useRouter();
    const [tickets, setTickets] = useState<TicketSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const adminName = 'deepak'; 

    const adminNavLinks = [
        { name: 'Dashboard', href: '/dashboard/admin' },
        { name: 'Tickets/Feedback', href: '/dashboard/feedback' },
    ];

    useEffect(() => {
        const fetchTickets = async () => {
            const token = localStorage.getItem('token');
            if (!token) { router.push('/login'); return; }

            try {
                const response = await axios.get('http://localhost:5000/api/admin/tickets', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTickets(response.data);
            } catch (error) {
                console.error('Failed to fetch tickets:', error);
                alert('Access denied or failed to load tickets.');
                router.push('/dashboard/admin');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTickets();
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <h1 className="text-2xl font-bold text-cyan-300">Loading Support Tickets...</h1>
            </div>
        );
    }

    const formatTimestamp = (ts: string) => new Date(ts).toLocaleString();

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            <DashboardNavbar title="Admin Portal" navLinks={adminNavLinks} userName={adminName} />
            <main className="container mx-auto py-12 px-6">
                <h1 className="text-4xl font-bold text-cyan-300 mb-8">Helpdesk & Feedback Portal</h1>
                
                {tickets.length === 0 ? (
                    <div className="bg-slate-800/80 p-10 rounded-lg shadow-lg border border-cyan-700/30 text-center">
                        <p className="text-xl text-emerald-400">No new tickets or feedback have been submitted.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tickets.map((ticket) => (
                            <div 
                                key={ticket.id} 
                                className={`p-6 rounded-xl shadow-lg border-l-4 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-cyan-500/40 ${
                                    ticket.isUrgent 
                                        ? 'bg-slate-800/80 border-red-500 hover:border-red-400' 
                                        : 'bg-slate-800/80 border-cyan-600 hover:border-cyan-400'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className={`text-xl font-bold ${
                                        ticket.isUrgent ? 'text-red-400' : 'text-cyan-300'
                                    }`}>
                                        {ticket.subject} 
                                    </h2>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                        ticket.status === 'Open' 
                                            ? 'bg-yellow-500/20 text-yellow-300' 
                                            : 'bg-emerald-500/20 text-emerald-300'
                                    }`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-300 mb-2">{ticket.content}</p>
                                <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-700 mt-3">
                                    <p>Submitted by: <span className="font-semibold text-cyan-300">{ticket.submitter}</span> ({ticket.email})</p>
                                    <p>Date: {formatTimestamp(ticket.timestamp)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
