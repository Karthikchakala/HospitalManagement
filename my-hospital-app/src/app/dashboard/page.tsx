'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import PatientDashboard from './patient/page';
import DoctorDashboard from './doctor/page';
import AdminDashboard from './admin/page';


interface User {
  id: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data.user);
      } catch {
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <h1 className="text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

  if (user?.role === 'patient') {
    return <PatientDashboard />;
  }

  if (user?.role === 'doctor') {
    return <DoctorDashboard />;
  }

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  // Fallback for unhandled roles
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-lg text-gray-700">Your account role is not supported for this view.</p>
      </div>
    </div>
  );
}