'use client';

import DashboardNavbar from '../../../../components/DashboardNavbar';
import ParticlesBackground from '../../../../components/ParticlesBackground';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircleIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface StaffProfile {
  name: string;
  designation: string;
}

export default function PharmacistDashboard() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const pharmacistNavLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard/staff/pharmacist' },
    { name: 'Dispense & Bill', href: '/dashboard/staff/pharmacist/dispensary-management' },
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
          <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-emerald-400 animate-spin" />
          <h1 className="text-slate-300 text-sm">Loading Pharmacy Portal...</h1>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <h1 className="text-2xl font-bold text-emerald-400">Error loading profile data.</h1>
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
    <div className={`bg-gradient-to-br ${gradient} backdrop-blur-md border-l-4 ${borderColor} p-8 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-emerald-500/20`}>
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
          title="Pharmacist Portal"
          navLinks={pharmacistNavLinks}
          userName={profileData.name}
        />

        <main className="container mx-auto py-12 px-6">
          <div className="mb-10">
            <h1 className="text-5xl font-extrabold text-emerald-200 mb-3 drop-shadow-lg">
              Welcome, {profileData.name}
            </h1>
            <p className="text-slate-400 text-xl">Pharmacist Portal - Dispense & Manage Medications</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <TaskCard
              title="Dispense & Billing"
              description="Process prescriptions, dispense medicine to patients, and finalize patient billing statements."
              link="/dashboard/staff/pharmacist/dispensary-management"
              gradient="from-emerald-500/30 to-teal-500/30"
              borderColor="border-emerald-400"
              icon={PlusCircleIcon}
            />
            <TaskCard
              title="Medicine Inventory"
              description="Add, update, and track medicine stock levels, with search, sorting, and low-stock highlights."
              link="/dashboard/staff/pharmacist/inventory"
              gradient="from-sky-500/30 to-blue-500/30"
              borderColor="border-sky-400"
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
