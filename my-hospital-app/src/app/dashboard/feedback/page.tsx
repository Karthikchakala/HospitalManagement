'use client';

import DashboardNavbar from '../../../components/DashboardNavbar';
import { useState } from 'react';
import axios from 'axios';

export default function FeedbackHelpdeskPage() {
    const [view, setView] = useState('feedback');
    const [feedbackData, setFeedbackData] = useState({ subject: '', comments: '' });
    const [supportData, setSupportData] = useState({ type: 'Bug Report', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const userName = 'User';

    const mockNavLinks = [{ name: 'Help/Feedback', href: '/dashboard/feedback' }];

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackData.subject || !feedbackData.comments) return;
        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://localhost:5000/api/utils/feedback', feedbackData, { headers: { Authorization: `Bearer ${token}` } });
            alert('Thank you! Your feedback has been recorded.');
            setFeedbackData({ subject: '', comments: '' });
        } catch {
            alert('Failed to send feedback. Check console.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSupportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supportData.type || !supportData.description) return;
        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://localhost:5000/api/utils/support', supportData, { headers: { Authorization: `Bearer ${token}` } });
            alert('Support ticket created successfully. An admin will review it shortly.');
            setSupportData({ type: 'Bug Report', description: '' });
        } catch {
            alert('Failed to create support ticket.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFeedbackChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFeedbackData({ ...feedbackData, [e.target.name]: e.target.value });
    };

    const handleSupportChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setSupportData({ ...supportData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <DashboardNavbar title="Feedback & Bug Reports" navLinks={mockNavLinks} userName={userName} />

            <main className="container mx-auto py-12 px-6">
                <h1 className="text-4xl font-bold text-cyan-300 mb-8 text-center drop-shadow-lg">
                    System Support & Feedback
                </h1>

                {/* Tab Navigation */}
                <div className="flex border-b border-cyan-500/40 mb-8 justify-center space-x-6">
                    <button
                        onClick={() => setView('feedback')}
                        className={`py-2 px-6 text-lg font-medium transition-all duration-300 rounded-t-lg ${
                            view === 'feedback'
                                ? 'border-b-2 border-cyan-400 text-cyan-300 shadow-cyan-500/50'
                                : 'text-gray-400 hover:text-cyan-200 hover:scale-105'
                        }`}
                    >
                        Feedback & Suggestions
                    </button>
                    <button
                        onClick={() => setView('support')}
                        className={`py-2 px-6 text-lg font-medium transition-all duration-300 rounded-t-lg ${
                            view === 'support'
                                ? 'border-b-2 border-red-400 text-red-400 shadow-red-500/50'
                                : 'text-gray-400 hover:text-red-300 hover:scale-105'
                        }`}
                    >
                        Urgent Helpdesk Ticket
                    </button>
                </div>

                {/* Main Form Card */}
                <div className="bg-slate-800/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl max-w-2xl mx-auto transition-all duration-300 hover:shadow-cyan-500/20 hover:scale-[1.01]">
                    {/* --- Feedback Form --- */}
                    {view === 'feedback' && (
                        <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                            <h2 className="text-2xl font-semibold text-cyan-300 mb-2">Feedback & Improvements 💬</h2>
                            <div>
                                <label className="block text-gray-300 font-semibold mb-1">Subject</label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={feedbackData.subject}
                                    onChange={handleFeedbackChange}
                                    required
                                    className="w-full p-3 rounded-md bg-slate-700/50 border border-cyan-500/30 text-white focus:ring-2 focus:ring-cyan-400 outline-none transition-all duration-300"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 font-semibold mb-1">Detailed Comments</label>
                                <textarea
                                    name="comments"
                                    value={feedbackData.comments}
                                    onChange={handleFeedbackChange}
                                    rows={5}
                                    required
                                    className="w-full p-3 rounded-md bg-slate-700/50 border border-cyan-500/30 text-white focus:ring-2 focus:ring-cyan-400 outline-none transition-all duration-300"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-md hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/40 shadow-md transition-all duration-300 transform hover:scale-105"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Feedback'}
                            </button>
                        </form>
                    )}

                    {/* --- Support Ticket Form --- */}
                    {view === 'support' && (
                        <form onSubmit={handleSupportSubmit} className="space-y-5">
                            <h2 className="text-2xl font-semibold text-red-400 mb-2">Report an Issue 🚨</h2>
                            <div>
                                <label className="block text-gray-300 font-semibold mb-1">Issue Type</label>
                                <select
                                    name="type"
                                    value={supportData.type}
                                    onChange={handleSupportChange}
                                    required
                                    className="w-full p-3 rounded-md bg-slate-700/50 border border-red-400/40 text-white focus:ring-2 focus:ring-red-400 outline-none transition-all duration-300"
                                >
                                    <option value="Bug Report">Bug Report</option>
                                    <option value="Access Problem">Access Problem</option>
                                    <option value="Data Error">Data Error / Inaccuracy</option>
                                    <option value="General Query">General Technical Query</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-300 font-semibold mb-1">Describe the Problem (Urgent)</label>
                                <textarea
                                    name="description"
                                    value={supportData.description}
                                    onChange={handleSupportChange}
                                    rows={5}
                                    required
                                    className="w-full p-3 rounded-md bg-slate-700/50 border border-red-400/40 text-white focus:ring-2 focus:ring-red-400 outline-none transition-all duration-300"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-md hover:from-red-400 hover:to-pink-500 hover:shadow-red-400/40 shadow-md transition-all duration-300 transform hover:scale-105"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
