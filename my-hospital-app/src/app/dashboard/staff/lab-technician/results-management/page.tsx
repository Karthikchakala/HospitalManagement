'use client';

import DashboardNavbar from '../../../../../components/DashboardNavbar';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { BeakerIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

interface PendingTest {
    test_id: number;
    test_name: string;
    patient_name: string;
    patient_id: number;
    normal_range: string;
}

export default function ResultsManagementPage() {
    const router = useRouter();
    const [pendingTests, setPendingTests] = useState<PendingTest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('Lab Technician');
    const [resultForm, setResultForm] = useState({
        testId: null as number | null,
        resultValue: '',
        unit: '',
    });
    const [selectedTestName, setSelectedTestName] = useState('');
    const [selectedTestNormalRange, setSelectedTestNormalRange] = useState('');

    const technicianNavLinks = [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: '/dashboard/staff/lab-technician' },
        { name: 'Results', href: '/dashboard/staff/lab-technician/results-management' },
    ];

    useEffect(() => {
        const fetchTests = async () => {
            const token = localStorage.getItem('token');
            if (!token) { router.push('/login'); return; }

            try {
                const userResponse = await axios.get('http://localhost:5000/api/staff/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserName(userResponse.data.name);

                const testResponse = await axios.get('http://localhost:5000/api/staff/lab/pending', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPendingTests(testResponse.data);
            } catch (error) {
                console.error('Failed to fetch tests:', error);
                localStorage.removeItem('token');
                router.push('/login');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTests();
    }, [router]);

    const handleSelectTest = (test: PendingTest) => {
        setResultForm({ testId: test.test_id, resultValue: '', unit: '' });
        setSelectedTestName(test.test_name);
        setSelectedTestNormalRange(test.normal_range);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setResultForm({ ...resultForm, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resultForm.testId || !resultForm.resultValue || !resultForm.unit) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await axios.put(`http://localhost:5000/api/staff/lab/result/${resultForm.testId}`, {
                resultValue: resultForm.resultValue,
                unit: resultForm.unit,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert(`✅ Result for ${selectedTestName} submitted successfully!`);

            setPendingTests(pendingTests.filter(t => t.test_id !== resultForm.testId));
            setResultForm({ testId: null, resultValue: '', unit: '' });
            setSelectedTestName('');
            setSelectedTestNormalRange('');

        } catch (error) {
            console.error('Submission failed:', error);
            alert('❌ Failed to submit result.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-purple-400 animate-spin" />
                    <h1 className="text-slate-300 text-sm">Loading Lab Portal...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
            {/* <ParticlesBackground /> */}

            <div className="relative z-10">
                <DashboardNavbar
                    title="Lab Technician Portal"
                    navLinks={technicianNavLinks}
                    userName={userName}
                />

                <main className="container mx-auto py-12 px-6">
                    <div className="flex items-center gap-3 mb-10">
                        <BeakerIcon className="w-10 h-10 text-purple-400" />
                        <h1 className="text-5xl font-extrabold text-purple-200 drop-shadow-lg">
                            Test Results Management
                        </h1>
                    </div>

                    {/* Result Submission Form */}
                    <div className="bg-gradient-to-br from-purple-500/30 to-violet-500/30 backdrop-blur-md border-l-4 border-purple-400 p-8 rounded-2xl shadow-2xl mb-10">
                        <div className="flex items-center gap-3 mb-6">
                            <ClipboardDocumentCheckIcon className="w-8 h-8 text-purple-300" />
                            <h2 className="text-2xl font-bold text-white">
                                {selectedTestName ? `Submit Result for: ${selectedTestName}` : 'Select a Pending Test Below'}
                            </h2>
                        </div>

                        {selectedTestNormalRange && (
                            <div className="mb-6 p-4 bg-purple-600/20 border-2 border-purple-400/50 rounded-lg">
                                <p className="text-lg font-semibold text-purple-200">
                                    📊 Reference Range: <span className="text-purple-100 font-bold">{selectedTestNormalRange}</span>
                                </p>
                            </div>
                        )}

                        {resultForm.testId && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-purple-200 font-semibold mb-2">Result Value</label>
                                        <input
                                            type="text"
                                            name="resultValue"
                                            value={resultForm.resultValue}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-3 bg-slate-700/50 border-2 border-purple-500/50 rounded-lg text-white focus:border-purple-400"
                                            placeholder="Enter test result value"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-purple-200 font-semibold mb-2">Unit</label>
                                        <input
                                            type="text"
                                            name="unit"
                                            value={resultForm.unit}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-3 bg-slate-700/50 border-2 border-purple-500/50 rounded-lg text-white focus:border-purple-400"
                                            placeholder="e.g., mg/dL"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold rounded-lg hover:from-purple-600 hover:to-violet-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/50"
                                >
                                    Submit Result
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Pending Tests List */}
                    <h2 className="text-3xl font-bold text-purple-300 mb-6 flex items-center gap-2">
                        Pending Tests <span className="px-3 py-1 bg-purple-500/30 rounded-full text-2xl">({pendingTests.length})</span>
                    </h2>

                    {pendingTests.length === 0 ? (
                        <div className="bg-slate-800/80 backdrop-blur-md border border-emerald-700/30 p-10 rounded-2xl shadow-lg text-center">
                            <ClipboardDocumentCheckIcon className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
                            <p className="text-xl text-emerald-300">✅ No lab tests are currently pending.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingTests.map((test) => (
                                <div
                                    key={test.test_id}
                                    className="backdrop-blur-md p-6 rounded-xl border-l-4 border-purple-400 transition-all duration-300 hover:scale-[1.01] bg-gradient-to-br from-purple-500/25 to-violet-500/25 shadow-xl hover:shadow-purple-500/30"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-2">{test.test_name}</h3>
                                            <p className="text-slate-200">
                                                👤 Patient: <span className="font-semibold">{test.patient_name}</span>
                                                <span className="ml-3 text-slate-400">(ID: #{test.patient_id})</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleSelectTest(test)}
                                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-full hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-emerald-500/50"
                                        >
                                            Record Result →
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
