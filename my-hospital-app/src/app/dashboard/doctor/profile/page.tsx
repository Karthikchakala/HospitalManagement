'use client';

import DashboardNavbar from '../../../../components/DashboardNavbar';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Department {
  department_id: number;
  name: string;
}

interface DoctorDetails {
  specialization: string;
  license_number: string;
  phone_number: string;
  bio: string;
  profile_picture_url: string;
  education: string;
  languages_spoken: string;
  experience_years: number | string | null;
  department_id: number | null;
}

interface DoctorProfile {
  name: string;
  email: string;
  role: string;
  Doctor: DoctorDetails;
}

export default function DoctorProfilePage() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<DoctorProfile | null>(null);
  const [formData, setFormData] = useState<DoctorDetails | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  const doctorNavLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard/doctor' },
    { name: "Profile", href: "/dashboard/doctor/profile" },
    { name: "Appointments", href: "/dashboard/doctor/appointments" },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [profileResponse, deptResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/doctor/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/api/doctor/departments`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
        ]);

        const data = profileResponse.data;
        setProfileData(data);
        setDepartments(deptResponse.data);

        setFormData({
          ...data.Doctor,
          experience_years: data.Doctor.experience_years || '',
          department_id: data.Doctor.department_id || '',
        });

      } catch (error: unknown) {
        console.error("❌ Failed to fetch doctor profile:", error);
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!formData) return;

    const { name, value, type } = e.target;

    if (type === "number" || name === "experience_years" || name === "department_id") {
      setFormData({ ...formData, [name]: value === "" ? null : value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    if (profileData) setFormData(profileData.Doctor);
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !formData) return;

    const updatePayload: Record<string, unknown> = {};

    const updateableFields = [
      'specialization', 'license_number', 'phone_number', 'experience_years',
      'education', 'bio', 'languages_spoken', 'department_id'
    ];

    updateableFields.forEach(key => {
      let value = formData[key as keyof DoctorDetails];

      if (key === 'experience_years' || key === 'department_id') {
        const num = Number(value);
        value = isNaN(num) || num === 0 ? null : num;
      } else if (value === '' || value === '0') {
        value = null;
      }

      if (value !== null && value !== undefined) {
        updatePayload[key] = value;
      }
    });

    if (Object.keys(updatePayload).length === 0) {
      alert("No changes detected.");
      setIsEditing(false);
      return;
    }

    try {
      console.log("🔹 Sending update payload:", updatePayload);

      const response = await axios.put(
        `${API_BASE_URL}/api/doctor/profile`,
        updatePayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Update response:", response.data);
      alert("✅ Profile updated successfully!");

      setProfileData({ ...profileData!, Doctor: updatePayload as unknown as DoctorDetails });
      setIsEditing(false);
    } catch (err: unknown) {
      console.error("❌ PUT profile error full object:", err);
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : "Unknown error";
      alert(`Failed to update profile: ${msg}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-100">Loading Doctor Profile...</h1>
      </div>
    );
  }

  if (!profileData || !formData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <h1 className="text-2xl font-bold text-red-400">
          Error: Profile data not found.
        </h1>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* ✅ Plexus Background */}
      {/* <ParticlesBackground /> */}

      <div className="relative z-10">
        <DashboardNavbar
          title="Doctor Portal"
          navLinks={doctorNavLinks}
          userName={profileData.name}
        />

        <main className="container mx-auto py-12 px-6">
          <h1 className="text-5xl font-extrabold mb-10 text-cyan-200 drop-shadow-lg">
            Dr. {profileData.name}&apos;s Profile
          </h1>

          <div className="bg-slate-800/80 backdrop-blur-md border border-cyan-700/30 p-8 rounded-2xl shadow-2xl max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* BASIC INFO */}
              <h2 className="text-2xl font-bold text-cyan-300 border-b-2 border-cyan-500/40 pb-3">
                Credentials & Basics
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">Full Name</label>
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

              {/* PROFESSIONAL INFO */}
              <h2 className="text-2xl font-bold text-cyan-300 border-b-2 border-cyan-500/40 pb-3 pt-6">
                Professional Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Department Dropdown */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">Assigned Department</label>
                  <select
                    name="department_id"
                    value={formData.department_id || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full p-3 border rounded-md ${isEditing
                      ? 'border-cyan-500 bg-slate-700 text-slate-100'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300'
                      }`}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(dept => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">Specialization (Field)</label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full p-3 border rounded-md ${isEditing
                      ? 'border-cyan-500 bg-slate-700 text-slate-100'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300'
                      }`}
                  />
                </div>

                {/* License Number */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">License Number</label>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full p-3 border rounded-md ${isEditing
                      ? 'border-cyan-500 bg-slate-700 text-slate-100'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300'
                      }`}
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full p-3 border rounded-md ${isEditing
                      ? 'border-cyan-500 bg-slate-700 text-slate-100'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300'
                      }`}
                  />
                </div>

                {/* Experience Years */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">Years of Experience</label>
                  <input
                    type="number"
                    name="experience_years"
                    value={formData.experience_years || 0}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full p-3 border rounded-md ${isEditing
                      ? 'border-cyan-500 bg-slate-700 text-slate-100'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300'
                      }`}
                  />
                </div>

                {/* Education */}
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-2">Education</label>
                  <input
                    type="text"
                    name="education"
                    value={formData.education || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full p-3 border rounded-md ${isEditing
                      ? 'border-cyan-500 bg-slate-700 text-slate-100'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300'
                      }`}
                  />
                </div>

                {/* Bio */}
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={4}
                    className={`w-full p-3 border rounded-md ${isEditing
                      ? 'border-cyan-500 bg-slate-700 text-slate-100'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300'
                      }`}
                  />
                </div>

                {/* Languages */}
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-2">Languages Spoken (comma-separated)</label>
                  <input
                    type="text"
                    name="languages_spoken"
                    value={formData.languages_spoken || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full p-3 border rounded-md ${isEditing
                      ? 'border-cyan-500 bg-slate-700 text-slate-100'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300'
                      }`}
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-4">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-md font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="w-1/2 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-md font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/50"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-1/2 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-md font-semibold hover:from-red-600 hover:to-rose-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/50"
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
