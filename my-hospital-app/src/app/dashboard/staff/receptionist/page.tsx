'use client';

import DashboardNavbar from '../../../../components/DashboardNavbar';
import ParticlesBackground from '../../../../components/ParticlesBackground'; // ✅ Added
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlusIcon, CalendarDaysIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface StaffProfile {
  name: string;
  designation: string;
}

export default function ReceptionistDashboard() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const receptionistNavLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard/staff/receptionist' },
    { name: 'Register Patient', href: '/dashboard/staff/receptionist/patient-registration' },
    { name: 'Appointments', href: '/dashboard/staff/receptionist/daily-appointments' },
    { name: 'Home Visits', href: '/dashboard/staff/receptionist/home-visit' },
    { name: 'Inpatients', href: '/dashboard/staff/inpatients' },
    { name: 'Outpatients', href: '/dashboard/staff/outpatients' },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const response = await axios.get('http://localhost:5000/api/staff/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfileData(response.data);
      } catch (error) {
        console.error('Failed to fetch staff profile data:', error);
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
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
          <h1 className="text-slate-300 text-sm">Loading Receptionist Portal...</h1>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <h1 className="text-2xl font-bold text-cyan-400">Error loading profile data.</h1>
      </div>
    );
  }

  const TaskCard = ({
    title,
    description,
    link,
    gradient,
    borderColor,
    icon: Icon
  }: {
    title: string;
    description: string;
    link: string;
    gradient: string;
    borderColor: string;
    icon: React.ElementType;
  }) => (
    <div className={`bg-gradient-to-br ${gradient} backdrop-blur-md border-l-4 ${borderColor} p-8 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20`}>
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`w-10 h-10 ${borderColor.replace('border-', 'text-')}`} />
        <h2 className="text-3xl font-bold text-white">{title}</h2>
      </div>
      <p className="text-slate-200 mb-6 text-lg leading-relaxed">{description}</p>
      <Link
        href={link}
        className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-bold rounded-full hover:bg-white/30 transition-all duration-300 border border-white/30"
      >
        Go to Module →
      </Link>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
      <ParticlesBackground />

      <div className="relative z-10">
        <DashboardNavbar
          title="Receptionist Portal"
          navLinks={receptionistNavLinks}
          userName={profileData.name}
        />

        <main className="container mx-auto py-12 px-6">
          <div className="mb-10">
            <h1 className="text-5xl font-extrabold text-cyan-200 mb-3 drop-shadow-lg">
              Welcome, {profileData.name}
            </h1>
            <p className="text-slate-400 text-xl">Receptionist Portal - Patient Registration & Appointments</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <TaskCard
              title="Patient Intake"
              description="Start the full registration process for new hospital patients with complete details."
              link="/dashboard/staff/receptionist/patient-registration"
              gradient="from-blue-500/30 to-indigo-500/30"
              borderColor="border-blue-400"
              icon={UserPlusIcon}
            />
            <TaskCard
              title="Inpatients (Admit/Discharge)"
              description="Admit patients, manage rooms and discharge when complete."
              link="/dashboard/staff/inpatients"
              gradient="from-cyan-500/30 to-sky-500/30"
              borderColor="border-cyan-400"
              icon={ClipboardDocumentListIcon}
            />
            <TaskCard
              title="Outpatients (Book/Manage)"
              description="Book outpatient visits and manage payment status."
              link="/dashboard/staff/outpatients"
              gradient="from-teal-500/30 to-emerald-500/30"
              borderColor="border-emerald-400"
              icon={CalendarDaysIcon}
            />
            <TaskCard
              title="Daily Appointments"
              description="View the current day's appointment schedule for all doctors and departments."
              link="/dashboard/staff/receptionist/daily-appointments"
              gradient="from-teal-500/30 to-cyan-500/30"
              borderColor="border-teal-400"
              icon={CalendarDaysIcon}
            />
            <TaskCard
              title="Home Visits (Non-Doctor)"
              description="Assign and manage nurse, physiotherapist, and caregiver home visits."
              link="/dashboard/staff/receptionist/home-visit"
              gradient="from-indigo-500/30 to-blue-500/30"
              borderColor="border-indigo-400"
              icon={ClipboardDocumentListIcon}
            />
            <TaskCard
              title="Feedback & Help"
              description="Share your thoughts to help us serve you better."
              link="/dashboard/feedback"
              gradient="from-pink-500/30 to-pink-500/30"
              borderColor="border-pink-400"
              icon={ClipboardDocumentListIcon}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
