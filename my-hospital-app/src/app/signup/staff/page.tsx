'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StaffSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    designation: 'Receptionist',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [revealPwd, setRevealPwd] = useState(false);
  const [revealPwd2, setRevealPwd2] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'staff',
        designation: formData.designation,
      });
      alert('Staff registration successful! Please log in.');
      router.push('/login');
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-gray-900">
      {/* Left: Reference-style image panel (desktop) */}
      <aside className="relative hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/staff.png"
          alt="Healthcare illustration"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Subtle overlay to blend with white background */}
        <div className="absolute inset-0 bg-white/10" />
      </aside>

      {/* Right: Dark signup card */}
      <main className="flex items-center justify-center px-4 py-10 bg-white">
        <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl p-8 text-gray-100">
          <h1 className="text-2xl font-bold mb-6 text-center text-white tracking-tight">
            Staff Sign Up
          </h1>

          {error && (
            <p className="text-red-400 bg-red-900/30 border border-red-700 rounded-md px-3 py-2 text-sm text-center mb-4">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-3 text-gray-100 placeholder-gray-400 shadow-sm
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-3 text-gray-100 placeholder-gray-400 shadow-sm
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900"
              />
            </div>

            <div>
              <label htmlFor="designation" className="block text-sm font-medium text-gray-200 mb-1">
                Designation
              </label>
              <select
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
                className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-3 text-gray-100 shadow-sm
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900"
              >
                <option value="Receptionist">Receptionist</option>
                <option value="Lab Technician">Lab Technician</option>
                <option value="Pharmacist">Pharmacist</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={revealPwd ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-3 pr-12 text-gray-100 placeholder-gray-400 shadow-sm
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setRevealPwd((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-r-md"
                >
                  {revealPwd ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={revealPwd2 ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-3 pr-12 text-gray-100 placeholder-gray-400 shadow-sm
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setRevealPwd2((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-r-md"
                >
                  {revealPwd2 ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-blue-600 text-white font-semibold py-3 shadow-sm hover:bg-blue-700 transition-colors
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating account…' : 'Sign Up as Staff'}
            </button>
          </form>

          <p className="mt-4 text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-500 underline underline-offset-4">
              Log in
            </Link>
          </p>
        </div>
      </main>

      {/* Mobile image stacked on top */}
      <div className="lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/medical-hero.jpg"
          alt="Healthcare illustration"
          className="w-full h-44 object-cover"
        />
      </div>
    </div>
  );
}
