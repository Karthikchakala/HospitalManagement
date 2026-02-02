'use client';

import DashboardNavbar from '../../../../components/DashboardNavbar';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface PatientDetails {
  aadhaar_number: string;
  father_name: string;
  mother_name: string;
  additional_phone_number: string;
  blood_group: string;
  age: number;
  gender: string;
  street: string;
  city: string;
  district: string;
  state: string;
  country: string;
}

interface UserProfile {
  name: string;
  email: string;
  role: string;
  Patient: PatientDetails;
}

export default function PatientProfilePage() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<PatientDetails>({
    aadhaar_number: '',
    father_name: '',
    mother_name: '',
    additional_phone_number: '',
    blood_group: '',
    age: 0,
    gender: '',
    street: '',
    city: '',
    district: '',
    state: '',
    country: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const patientNavLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard/patient' },
    { name: 'Appointments', href: '/dashboard/patient/appointments' },
    { name: 'Profile', href: '/dashboard/patient/profile' },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/patient/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfileData(response.data);
        setFormData(response.data.Patient);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    if (profileData) setFormData(profileData.Patient);
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.put('http://localhost:5000/api/patient/profile', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-100">Loading Profile...</h1>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-100">Profile not found.</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* ✅ Navbar */}
      <DashboardNavbar
        title="Patient Portal"
        navLinks={patientNavLinks}
        userName={profileData.name}
      />

      {/* ✅ Profile Content */}
      <main className="container mx-auto py-12 px-4 sm:px-6 md:px-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-cyan-200 text-center md:text-left">
          My Profile
        </h1>

        <div className="bg-slate-800/80 border border-cyan-700/30 p-6 sm:p-8 rounded-xl shadow-xl max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-300 border-b border-cyan-700/50 pb-3">
              Personal Information
            </h2>

            {/* ✅ Name & Email (2-column on larger screens) */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-300 font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  disabled
                  className="w-full p-3 border border-slate-600 rounded-md bg-slate-700/50 text-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full p-3 border border-slate-600 rounded-md bg-slate-700/50 text-slate-300"
                />
              </div>
            </div>

            {/* ✅ Aadhaar, Parent Names */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-300 font-semibold mb-2">Aadhaar Number</label>
                <input
                  type="text"
                  name="aadhaar_number"
                  value={formData.aadhaar_number || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full p-3 border rounded-md ${isEditing
                      ? 'border-cyan-500 bg-slate-700 text-slate-100'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300'
                    }`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">Father&apos;s Name</label>
                <input
                  type="text"
                  name="father_name"
                  value={formData.father_name || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full p-3 border rounded-md ${isEditing
                      ? 'border-cyan-500 bg-slate-700 text-slate-100'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300'
                    }`}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-300 font-semibold mb-2">Mother&apos;s Name</label>
                <input
                  type="text"
                  name="mother_name"
                  value={formData.mother_name || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full p-3 border rounded-md ${isEditing
                      ? 'border-cyan-500 bg-slate-700 text-slate-100'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300'
                    }`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Additional Phone Number
                </label>
                <input
                  type="tel"
                  name="additional_phone_number"
                  value={formData.additional_phone_number || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full p-3 border rounded-md ${isEditing
                      ? 'border-cyan-500 bg-slate-700 text-slate-100'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300'
                    }`}
                />
              </div>
            </div>

            {/* ✅ Blood, Age, Gender */}
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-slate-300 font-semibold mb-2">Blood Group</label>
                <input
                  type="text"
                  name="blood_group"
                  value={formData.blood_group || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full p-3 border rounded-md ${isEditing
                      ? 'border-cyan-500 bg-slate-700 text-slate-100'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300'
                    }`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full p-3 border rounded-md ${isEditing
                      ? 'border-cyan-500 bg-slate-700 text-slate-100'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300'
                    }`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full p-3 border rounded-md ${isEditing
                      ? 'border-cyan-500 bg-slate-700 text-slate-100'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300'
                    }`}
                >
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-cyan-300 border-b border-cyan-700/50 pb-3 mt-8">
              Address
            </h2>

            {/* ✅ Address fields */}
            <div className="grid sm:grid-cols-2 gap-6">
              {['street', 'city', 'district', 'state', 'country'].map((field) => (
                <div key={field}>
                  <label className="block text-slate-300 font-semibold mb-2 capitalize">
                    {field}
                  </label>
                  <input
                    type="text"
                    name={field}
                    value={(formData as unknown as Record<string, string>)[field] || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full p-3 border rounded-md ${isEditing
                        ? 'border-cyan-500 bg-slate-700 text-slate-100'
                        : 'border-slate-600 bg-slate-700/50 text-slate-300'
                      }`}
                  />
                </div>
              ))}
            </div>

            {/* ✅ Buttons */}
            {!isEditing ? (
              <button
                type="button"
                onClick={handleEdit}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-md font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-md font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/50"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-md font-semibold hover:from-red-600 hover:to-rose-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/50"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
