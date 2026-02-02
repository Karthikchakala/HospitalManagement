'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function StaffRouter() {
  const router = useRouter();
  // const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStaffData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // If no token, redirect to login
        router.push('/login');
        return;
      }

      try {
        // Fetch staff profile data from the backend to get the 'designation'
        const response = await axios.get('http://localhost:5000/api/staff/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const designation = response.data.designation; // Get the user's specific job title

        // --- Critical: Redirect based on exact designation ---
        switch (designation) {
          case 'Receptionist':
            router.push('/dashboard/staff/receptionist');
            break;
          case 'Lab Technician':
            router.push('/dashboard/staff/lab-technician');
            break;
          case 'Pharmacist':
            router.push('/dashboard/staff/pharmacist');
            break;
          default:
            // Fallback for an unrecognized or missing designation
            alert('Staff role not fully configured. Access denied.');
            localStorage.removeItem('token');
            router.push('/login');
        }

      } catch (error) {
        // If API fails (e.g., 401 or 500), clear token and redirect to login
        console.error('Failed to fetch staff data:', error);
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        // This is primarily for the initial load state, but we ensure it's turned off
        // setIsLoading(false);
      }
    };
    fetchStaffData();
  }, [router]);

  // Show a loading screen while the role check and redirection is happening
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold">Loading Staff Portal...</h1>
    </div>
  );
}