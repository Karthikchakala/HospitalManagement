'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function PatientSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [revealPwd, setRevealPwd] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/auth/register`, {
        ...formData,
        role: 'patient',
      });
      alert('Patient registration successful!');
      router.push('/login');
    } catch (error) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-gray-900">
      {/* Left: Image panel for desktop */}
      <aside className="relative hidden lg:flex items-center justify-center bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/Patient-singup.png"
          alt="Healthcare illustration"
          className="max-w-full max-h-screen object-contain"
        />
      </aside>

      {/* Right: Signup card on white background */}
      <main className="flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-xl">
          <div className="mx-auto w-full max-w-lg rounded-2xl bg-gray-800 border border-gray-700 shadow-xl">
            <div className="px-6 sm:px-8 pt-7 pb-6">
              <h1 className="text-2xl font-bold mb-6 text-center text-white tracking-tight">
                Patient Sign Up
              </h1>

              {error && (
                <p className="text-red-400 bg-red-900/20 border border-red-700 rounded-md px-3 py-2 text-sm text-center mb-4">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-200 mb-1"
                  >
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
                    className="w-full rounded-md bg-gray-900 border border-gray-600 px-3 py-3 text-gray-100 placeholder-gray-400 shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-200 mb-1"
                  >
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
                    className="w-full rounded-md bg-gray-900 border border-gray-600 px-3 py-3 text-gray-100 placeholder-gray-400 shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-200 mb-1"
                  >
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
                      className="w-full rounded-md bg-gray-900 border border-gray-600 px-3 py-3 pr-12 text-gray-100 placeholder-gray-400 shadow-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setRevealPwd((v) => !v)}
                      className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-r-md"
                      aria-label={revealPwd ? 'Hide password' : 'Show password'}
                    >
                      {revealPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md bg-blue-600 text-white font-semibold py-3 shadow-sm hover:bg-blue-700 transition-colors
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-white
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating account…' : 'Sign Up as Patient'}
                </button>
              </form>
            </div>
          </div>

          {/* Mobile image stacked on top */}
          <div className="lg:hidden mt-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/medical-hero.jpg"
              alt="Healthcare"
              className="w-full h-44 object-cover rounded-xl border border-gray-200"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
