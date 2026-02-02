'use client';

import DashboardNavbar from '../../../../components/DashboardNavbar';
import ParticlesBackground from '../../../../components/ParticlesBackground'; // ✅ Added

import Link from 'next/link';
import { BeakerIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export default function LabTechnicianDashboard() {
  const userName = 'Alice Clark';
  const technicianNavLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard/staff/lab-technician' },
    { name: 'Results', href: '/dashboard/staff/lab-technician/results-management' },
  ];

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
          title="Lab Technician Portal"
          navLinks={technicianNavLinks}
          userName={userName}
        />

        <main className="container mx-auto py-12 px-6">
          <div className="mb-10">
            <h1 className="text-5xl font-extrabold text-cyan-200 mb-3 drop-shadow-lg">
              Welcome, {userName}
            </h1>
            <p className="text-slate-400 text-xl">Lab Technician Portal - Manage Tests & Results</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <TaskCard
              title="Results Management"
              description="Input, validate, and manage all patient test results with precision and accuracy."
              link="/dashboard/staff/lab-technician/results-management"
              gradient="from-purple-500/30 to-violet-500/30"
              borderColor="border-purple-400"
              icon={BeakerIcon}
            />
            <TaskCard
              title="Sample Tracking"
              description="View and track the status of pending lab samples in real-time."
              link="/dashboard/staff/lab-technician/sample-tracking"
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
