'use client';

import DashboardNavbar from '../../../components/DashboardNavbar';
import ParticlesBackground from '../../../components/ParticlesBackground'; // ✅ Added
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DoctorProfile {
  name: string;
  email: string;
  role: string;
  Doctor: {
    specialization: string;
  };
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const doctorNavLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard/doctor' },
    { name: 'Profile', href: '/dashboard/doctor/profile' },
    { name: 'Appointments', href: '/dashboard/doctor/appointments' },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/doctor/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProfileData(response.data);
      } catch (error) {
        console.error('Failed to fetch doctor profile data:', error);
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-100">Loading Doctor Portal...</h1>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center p-8 bg-slate-800 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4 text-slate-100">Profile data not found.</h1>
          <p className="text-slate-300">Please log in again or contact support.</p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: 'My Profile',
      desc: 'View and update your professional information and credentials.',
      gradient: 'from-sky-400/30 via-cyan-400/20 to-blue-500/30',
      border: 'border-sky-400/30',
      glow: 'hover:shadow-sky-400/40',
      text: 'text-sky-200',
      link: '/dashboard/doctor/profile',
    },
    {
      title: 'Create New EMR',
      desc: 'Digitally record patient diagnosis, prescriptions, and upload documents.',
      gradient: 'from-rose-400/30 via-pink-400/20 to-red-400/30',
      border: 'border-rose-300/30',
      glow: 'hover:shadow-rose-400/40',
      text: 'text-rose-200',
      link: '/dashboard/doctor/emr-form',
    },
    {
      title: 'Appointments',
      desc: 'View and manage your upcoming appointments and patient schedules.',
      gradient: 'from-teal-400/30 via-emerald-400/20 to-green-500/30',
      border: 'border-teal-300/30',
      glow: 'hover:shadow-teal-400/40',
      text: 'text-teal-200',
      link: '/dashboard/doctor/appointments',
    },
    {
      title: 'Virtual Appointments',
      desc: 'View and join your scheduled virtual consultations.',
      gradient: 'from-violet-400/30 via-purple-400/20 to-fuchsia-500/30',
      border: 'border-violet-300/30',
      glow: 'hover:shadow-violet-400/40',
      text: 'text-violet-200',
      link: '/dashboard/doctor/appointments',
    },
    {
      title: 'Home Visits',
      desc: 'See and manage home visit appointments assigned to you.',
      gradient: 'from-indigo-400/30 via-blue-400/20 to-indigo-500/30',
      border: 'border-indigo-300/30',
      glow: 'hover:shadow-indigo-400/40',
      text: 'text-indigo-200',
      link: '/dashboard/doctor/home-visit',
    },
    {
      title: 'My Patients',
      desc: 'Access a list of your patients and their medical records.',
      gradient: 'from-purple-400/30 via-violet-400/20 to-indigo-500/30',
      border: 'border-purple-300/30',
      glow: 'hover:shadow-purple-400/40',
      text: 'text-purple-200',
      link: '/dashboard/doctor/patients',
    },
    {
      title: 'Feeback and Help',
      desc: 'View and update your professional information and credentials.',
      gradient: 'from-sky-400/30 via-cyan-400/20 to-blue-500/30',
      border: 'border-sky-400/30',
      glow: 'hover:shadow-sky-400/40',
      text: 'text-sky-200',
      link: '/dashboard/feedback',
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* ✅ Plexus Background Animation */}
      <ParticlesBackground />

      <DashboardNavbar 
        title="Doctor Portal" 
        navLinks={doctorNavLinks} 
        userName={profileData.name} 
      />

      <main className="relative z-10 container mx-auto py-16 px-6">
        <h1 className="text-5xl font-extrabold mb-10 text-cyan-200 drop-shadow-lg">
          Welcome, Dr. {profileData.name}
        </h1>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`p-6 rounded-xl bg-gradient-to-br ${card.gradient} 
              backdrop-blur-md border ${card.border} shadow-xl transition-all duration-300 
              hover:scale-105 ${card.glow} border-l-6 border-white-900`}
            >
              <h2 className={`text-2xl font-semibold mb-3 ${card.text}`}>
                {card.title}
              </h2>
              <p className="text-slate-200 mb-5">{card.desc}</p>
              <Link
                href={card.link}
                className={`font-semibold underline-offset-2 hover:underline ${card.text}`}
              >
                Open →
              </Link>
            </div>
          ))}
        </div>
      </main>
      <Link
        href="/chat/doctor"
        aria-label="Open Chat"
        className="fixed bottom-24 right-6 z-[110] rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 p-4 text-white shadow-lg hover:shadow-cyan-400/40 hover:scale-105 transition focus:outline-none focus:ring-2 focus:ring-cyan-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M12 3C6.477 3 2 6.94 2 11.8c0 2.25 1.06 4.28 2.8 5.77-.12.83-.49 2.04-1.38 3.01-.2.21-.05.56.24.53 1.68-.18 3.06-.86 3.87-1.39.69.17 1.41.27 2.15.27 5.523 0 10-3.94 10-8.8S17.523 3 12 3z" />
        </svg>
      </Link>
    </div>
  );
}
