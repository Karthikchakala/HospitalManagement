// 'use client';

// import DashboardNavbar from '../../../components/DashboardNavbar';
// import ParticlesBackground from '../../../components/ParticlesBackground';
// import Link from 'next/link';
// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useRouter } from 'next/navigation';

// const adminNavLinks = [
//     { name: 'Home', href: '/' },
//     { name: 'Dashboard', href: '/dashboard/admin' },
//     { name: 'User Management', href: '/dashboard/admin/doctors' },
//     { name: 'Settings', href: '/dashboard/admin/settings' },
//     { name: 'Tickets/Feedback', href: '/dashboard/admin/support-tickets' }, 
// ];

// interface AdminProfile {
//     name: string;
//     email: string;
//     role: string;
// }

// export default function AdminDashboard() {
//     const router = useRouter();
//     const [adminName, setAdminName] = useState('Admin');
//     const [isLoading, setIsLoading] = useState(true);

//     useEffect(() => {
//         const fetchAdminProfile = async () => {
//             const token = localStorage.getItem('token');
//             if (!token) {
//                 router.push('/login');
//                 return;
//             }
//             try {
//                 const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/admin/profile`, {
//                     headers: { Authorization: `Bearer ${token}` }
//                 });
//                 setAdminName(response.data.name);
//             } catch (error) {
//                 console.error('Failed to fetch admin profile:', error);
//                 localStorage.removeItem('token');
//                 router.push('/login');
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         fetchAdminProfile();
//     }, [router]);

//     if (isLoading) {
//         return (
//             <div className="flex justify-center items-center min-h-screen bg-slate-900">
//                 <div className="flex flex-col items-center gap-4">
//                     <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
//                     <h1 className="text-slate-300 text-sm">Loading Admin Portal...</h1>
//                 </div>
//             </div>
//         );
//     }


//     const StatCard = ({ title, value, gradient, icon }: { 
//         title: string, 
//         value: number, 
//         gradient: string,
//         icon: string 
//     }) => (
//         <div className={`bg-gradient-to-br ${gradient} backdrop-blur-md border border-slate-600/50 p-6 rounded-xl shadow-xl transition-all duration-300 hover:scale-105`}>
//             <div className="flex items-center justify-between mb-2">
//                 <p className="text-sm font-semibold text-slate-200">{title}</p>
//                 <span className="text-3xl">{icon}</span>
//             </div>
//             <p className="text-4xl font-extrabold text-white">{value}</p>
//         </div>
//     );

//     // Management Card Component
//     const ManagementCard = ({ title, link, description, gradient, borderColor }: { 
//         title: string, 
//         link: string, 
//         description: string, 
//         gradient: string,
//         borderColor: string
//     }) => (
//         <div className={`bg-gradient-to-br ${gradient} backdrop-blur-md border-l-4 ${borderColor} p-6 rounded-xl shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}>
//             <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
//             <p className="text-slate-200 mb-4 text-sm">{description}</p>
//             <Link 
//                 href={link} 
//                 className="inline-block w-full text-center py-3 bg-white/20 backdrop-blur-sm text-white font-bold rounded-lg transition-all duration-300 hover:bg-white/30 border border-white/30"
//             >
//                 Access Portal →
//             </Link>
//         </div>
//     );

//     const mockStats = { 
//         totalDoctors: 45, 
//         totalPatients: 1250, 
//         pendingAppointments: 18, 
//         staffCount: 30, 
//     };

//     return (
//         <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
//             {/* ✅ Plexus Background */}
//             <ParticlesBackground />

//             <div className="relative z-10">
//                 <DashboardNavbar 
//                     title="Admin Portal" 
//                     navLinks={adminNavLinks} 
//                     userName={adminName} 
//                 />

//                 <main className="container mx-auto py-12 px-6">
//                     <h1 className="text-5xl font-extrabold text-cyan-200 mb-10 drop-shadow-lg">
//                         Welcome, {adminName} - Management Dashboard
//                     </h1>

//                     {/* Statistics Cards */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
//                         <StatCard 
//                             title="Total Doctors" 
//                             value={mockStats.totalDoctors} 
//                             gradient="from-emerald-500/30 to-teal-500/30" 
//                             icon="👨‍⚕️"
//                         />
//                         <StatCard 
//                             title="Total Patients" 
//                             value={mockStats.totalPatients} 
//                             gradient="from-blue-500/30 to-indigo-500/30" 
//                             icon="🏥"
//                         />
//                         <StatCard 
//                             title="Pending Appointments" 
//                             value={mockStats.pendingAppointments} 
//                             gradient="from-amber-500/30 to-orange-500/30" 
//                             icon="📅"
//                         />
//                         <StatCard 
//                             title="Total Staff" 
//                             value={mockStats.staffCount} 
//                             gradient="from-purple-500/30 to-violet-500/30" 
//                             icon="👥"
//                         />
//                     </div>

//                     {/* User Management Section */}
//                     <h2 className="text-3xl font-bold text-cyan-300 mb-6 border-b-2 border-cyan-500/40 pb-3">
//                         Management & Oversight
//                     </h2>
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
//                         <ManagementCard 
//                             title="Manage Doctors" 
//                             link="/dashboard/admin/doctors" 
//                             description="Add, edit, and view doctor profiles and specializations." 
//                             gradient="from-emerald-600/30 to-teal-600/30"
//                             borderColor="border-emerald-400"
//                         />
//                         <ManagementCard 
//                             title="Manage Patients" 
//                             link="/dashboard/admin/patients" 
//                             description="Access all patient records, history, and billing data." 
//                             gradient="from-blue-600/30 to-indigo-600/30"
//                             borderColor="border-blue-400"
//                         />
//                         <ManagementCard 
//                             title="Manage Staff" 
//                             link="/dashboard/admin/staff" 
//                             description="Oversee administrative, lab, and pharmacy staff accounts." 
//                             gradient="from-purple-600/30 to-violet-600/30"
//                             borderColor="border-purple-400"
//                         />
//                     </div>

//                     {/* System Configuration Section */}
//                     <h2 className="text-3xl font-bold text-cyan-300 mb-6 border-b-2 border-cyan-500/40 pb-3">
//                         System Configuration
//                     </h2>
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                         <ManagementCard 
//                             title="Department Configuration" 
//                             link="/dashboard/admin/departments" 
//                             description="Create, edit, and manage hospital departments." 
//                             gradient="from-cyan-600/30 to-sky-600/30"
//                             borderColor="border-cyan-400"
//                         />
//                         <ManagementCard 
//                             title="System Settings" 
//                             link="/dashboard/admin/settings" 
//                             description="Configure consultation fees, site parameters, and defaults." 
//                             gradient="from-teal-600/30 to-emerald-600/30"
//                             borderColor="border-teal-400"
//                         />
//                         <ManagementCard 
//                             title="Audit & Login Logs" 
//                             link="/dashboard/admin/login-logs" 
//                             description="Review all user login attempts and system activity for security." 
//                             gradient="from-rose-600/30 to-pink-600/30"
//                             borderColor="border-rose-400"
//                         />
//                         <ManagementCard 
//                             title="Tickets & Feedback" 
//                             link="/dashboard/admin/support-tickets" 
//                             description="View and manage the user tickets and feedback submissions." 
//                             gradient="from-yellow-600/30 to-amber-600/30"
//                             borderColor="border-yellow-400"
//                         />
//                     </div>
//                 </main>
//             </div>
//         </div>
//     );
// }
'use client';

import DashboardNavbar from '../../../components/DashboardNavbar';
import ParticlesBackground from '../../../components/ParticlesBackground';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const adminNavLinks = [
  { name: 'Home', href: '/' },
  { name: 'Dashboard', href: '/dashboard/admin' },
  { name: 'Analytics', href: '/dashboard/admin/analytics' },
  { name: 'User Management', href: '/dashboard/admin/doctors' },
  { name: 'Settings', href: '/dashboard/admin/settings' },
  { name: 'Tickets/Feedback', href: '/dashboard/admin/support-tickets' },
];



interface AdminStats {
  totalDoctors: number;
  totalPatients: number;
  totalStaff: number;
  incomeGenerated: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [adminName, setAdminName] = useState('Admin');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  // ✅ Fetch admin profile
  useEffect(() => {
    const fetchAdminProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/admin/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdminName(response.data.name);
      } catch (error) {
        console.error('Failed to fetch admin profile:', error);
        localStorage.removeItem('token');
        router.push('/login');
      }
    };
    fetchAdminProfile();
  }, [router]);

  // ✅ Fetch stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
          <h1 className="text-slate-300 text-sm">Loading Admin Portal...</h1>
        </div>
      </div>
    );
  }

  const StatCard = ({
    title,
    value,
    gradient,
    icon,
  }: {
    title: string;
    value: number | string;
    gradient: string;
    icon: string;
  }) => (
    <div
      className={`bg-gradient-to-br ${gradient} backdrop-blur-md border border-slate-600/50 p-6 rounded-xl shadow-xl transition-all duration-300 hover:scale-105`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-4xl font-extrabold text-white">{value}</p>
    </div>
  );

  const ManagementCard = ({
    title,
    link,
    description,
    gradient,
    borderColor,
  }: {
    title: string;
    link: string;
    description: string;
    gradient: string;
    borderColor: string;
  }) => (
    <div
      className={`bg-gradient-to-br ${gradient} backdrop-blur-md border-l-4 ${borderColor} p-6 rounded-xl shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
    >
      <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-slate-200 mb-4 text-sm">{description}</p>
      <Link
        href={link}
        className="inline-block w-full text-center py-3 bg-white/20 backdrop-blur-sm text-white font-bold rounded-lg transition-all duration-300 hover:bg-white/30 border border-white/30"
      >
        Access Portal →
      </Link>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
      <ParticlesBackground />

      <div className="relative z-10">
        <DashboardNavbar title="Admin Portal" navLinks={adminNavLinks} userName={adminName} />

        <main className="container mx-auto py-12 px-6">
          <h1 className="text-5xl font-extrabold text-cyan-200 mb-10 drop-shadow-lg">
            Welcome, {adminName} - Management Dashboard
          </h1>

          {/* ✅ Stats Section (Dynamic) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              title="Total Doctors"
              value={stats?.totalDoctors ?? '—'}
              gradient="from-emerald-500/30 to-teal-500/30"
              icon="👨‍⚕️"
            />
            <StatCard
              title="Total Patients"
              value={stats?.totalPatients ?? '—'}
              gradient="from-blue-500/30 to-indigo-500/30"
              icon="🏥"
            />
            <StatCard
              title="Total Staff"
              value={stats?.totalStaff ?? '—'}
              gradient="from-purple-500/30 to-violet-500/30"
              icon="👥"
            />
            <StatCard
              title="Income Generated"
              value={`₹${stats?.incomeGenerated?.toLocaleString() ?? 0}`}
              gradient="from-amber-500/30 to-orange-500/30"
              icon="💰"
            />
          </div>

          {/* ✅ Management & System Sections (unchanged) */}
          <h2 className="text-3xl font-bold text-cyan-300 mb-6 border-b-2 border-cyan-500/40 pb-3">
            Management & Oversight
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <ManagementCard
              title="Manage Doctors"
              link="/dashboard/admin/doctors"
              description="Add, edit, and view doctor profiles and specializations."
              gradient="from-emerald-600/30 to-teal-600/30"
              borderColor="border-emerald-400"
            />
            <ManagementCard
              title="Manage Patients"
              link="/dashboard/admin/patients"
              description="Access all patient records, history, and billing data."
              gradient="from-blue-600/30 to-indigo-600/30"
              borderColor="border-blue-400"
            />
            <ManagementCard
              title="Manage Staff"
              link="/dashboard/admin/staff"
              description="Oversee administrative, lab, and pharmacy staff accounts."
              gradient="from-purple-600/30 to-violet-600/30"
              borderColor="border-purple-400"
            />
            <ManagementCard
              title="Analytics"
              link="/dashboard/admin/analytics"
              description="Visualize revenue, patient visits, and staff performance."
              gradient="from-cyan-600/30 to-blue-600/30"
              borderColor="border-cyan-400"
            />
          </div>

          <h2 className="text-3xl font-bold text-cyan-300 mb-6 border-b-2 border-cyan-500/40 pb-3">
            System Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ManagementCard
              title="Department Configuration"
              link="/dashboard/admin/departments"
              description="Create, edit, and manage hospital departments."
              gradient="from-cyan-600/30 to-sky-600/30"
              borderColor="border-cyan-400"
            />
            <ManagementCard
              title="System Settings"
              link="/dashboard/admin/settings"
              description="Configure consultation fees, site parameters, and defaults."
              gradient="from-teal-600/30 to-emerald-600/30"
              borderColor="border-teal-400"
            />
            <ManagementCard
              title="Audit & Login Logs"
              link="/dashboard/admin/login-logs"
              description="Review all user login attempts and system activity for security."
              gradient="from-rose-600/30 to-pink-600/30"
              borderColor="border-rose-400"
            />
            <ManagementCard
              title="Tickets & Feedback"
              link="/dashboard/admin/support-tickets"
              description="View and manage user tickets and feedback submissions."
              gradient="from-yellow-600/30 to-amber-600/30"
              borderColor="border-yellow-400"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
