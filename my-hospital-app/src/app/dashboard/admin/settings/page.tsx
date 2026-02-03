'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import DashboardNavbar from '../../../../components/DashboardNavbar';

import { CogIcon } from '@heroicons/react/24/outline';

interface HospitalSettings {
  consultationFee: number;
  hospitalName: string;
  defaultCurrency: string;
  maxAppointmentsPerDay: number;
  id: number;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<HospitalSettings>({
    consultationFee: 0,
    hospitalName: '',
    defaultCurrency: 'INR',
    maxAppointmentsPerDay: 0,
    id: 1
  });
  const [initialSettings, setInitialSettings] = useState<HospitalSettings>(settings);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminName, setAdminName] = useState('Admin User');

  const adminNavLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard/admin' },
    { name: 'User Management', href: '/dashboard/admin/doctors' },
    { name: 'Settings', href: '/dashboard/admin/settings' },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }

      try {
        const [profileResponse, settingsResponse] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/profile`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setAdminName(profileResponse.data.name);

        setSettings({
          consultationFee: settingsResponse.data.consultationFee ?? 0,
          hospitalName: settingsResponse.data.hospital_name ?? '',
          defaultCurrency: settingsResponse.data.default_currency ?? 'INR',
          maxAppointmentsPerDay: settingsResponse.data.max_appointments_per_day ?? 0,
          id: settingsResponse.data.id
        });

        setInitialSettings({
          consultationFee: settingsResponse.data.consultationFee ?? 0,
          hospitalName: settingsResponse.data.hospital_name ?? '',
          defaultCurrency: settingsResponse.data.default_currency ?? 'INR',
          maxAppointmentsPerDay: settingsResponse.data.max_appointments_per_day ?? 0,
          id: settingsResponse.data.id
        });

      } catch (error) {
        console.error('Failed to fetch settings:', error);
        router.push('/dashboard/admin');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = (name === 'consultationFee' || name === 'maxAppointmentsPerDay') ? parseInt(value) || 0 : value;
    setSettings({ ...settings, [name]: newValue });
  };

  const handleCancel = () => {
    setSettings(initialSettings);
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !settings) return;

    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`, {
        consultationFee: settings.consultationFee,
        hospitalName: settings.hospitalName,
        defaultCurrency: settings.defaultCurrency,
        maxAppointmentsPerDay: settings.maxAppointmentsPerDay
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert('✅ Settings saved successfully!');
      setInitialSettings({ ...settings });
      setIsEditing(false);
    } catch (error) {
      alert('❌ Failed to save settings.');
      console.error('Submission error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
          <h1 className="text-slate-300 text-sm">Loading Settings...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">


      <div className="relative z-10">
        <DashboardNavbar
          title="Admin Portal"
          navLinks={adminNavLinks}
          userName={adminName}
        />

        <main className="container mx-auto py-12 px-6">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <CogIcon className="w-10 h-10 text-cyan-400" />
              <h1 className="text-5xl font-extrabold text-cyan-200 drop-shadow-lg">
                System Settings
              </h1>
            </div>
            <p className="text-slate-400 text-lg">
              Configure hospital-wide operational parameters
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-md border border-cyan-700/30 p-8 rounded-2xl shadow-2xl max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              <h2 className="text-2xl font-bold text-cyan-300 border-b-2 border-cyan-500/40 pb-3">
                Financial & Operational Parameters
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Consultation Fee */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">
                    Default Consultation Fee ({settings.defaultCurrency})
                  </label>
                  <input
                    type="number"
                    name="consultationFee"
                    value={settings.consultationFee ?? 0}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full p-3 rounded-md ${isEditing
                        ? 'bg-slate-700/50 border-2 border-cyan-500/50 text-slate-100 focus:border-cyan-400'
                        : 'bg-slate-700/30 border border-slate-600 text-slate-300'
                      }`}
                    required
                  />
                </div>

                {/* Hospital Name */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    name="hospitalName"
                    value={settings.hospitalName ?? ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full p-3 rounded-md ${isEditing
                        ? 'bg-slate-700/50 border-2 border-cyan-500/50 text-slate-100 focus:border-cyan-400'
                        : 'bg-slate-700/30 border border-slate-600 text-slate-300'
                      }`}
                  />
                </div>

                {/* Max Appointments */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">
                    Max Appointments Per Day
                  </label>
                  <input
                    type="number"
                    name="maxAppointmentsPerDay"
                    value={settings.maxAppointmentsPerDay ?? 0}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full p-3 rounded-md ${isEditing
                        ? 'bg-slate-700/50 border-2 border-cyan-500/50 text-slate-100 focus:border-cyan-400'
                        : 'bg-slate-700/30 border border-slate-600 text-slate-300'
                      }`}
                    required
                  />
                </div>

                {/* Default Currency */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">
                    Default Currency
                  </label>
                  <select
                    name="defaultCurrency"
                    value={settings.defaultCurrency ?? 'INR'}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full p-3 rounded-md ${isEditing
                        ? 'bg-slate-700/50 border-2 border-cyan-500/50 text-slate-100 focus:border-cyan-400'
                        : 'bg-slate-700/30 border border-slate-600 text-slate-300'
                      }`}
                  >
                    <option value="INR">INR (Indian Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-md hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
                  >
                    Edit System Settings
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-md hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/50"
                    >
                      Save Configuration
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-md hover:from-red-600 hover:to-rose-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
