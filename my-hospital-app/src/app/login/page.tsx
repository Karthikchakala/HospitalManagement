'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LoginResponse {
  message: string;
  token: string;
  role: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const response = await axios.post<LoginResponse>(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/auth/login`, { email, password });
      const { token, role } = response.data;
      localStorage.setItem('token', token);

      switch (role) {
        case 'patient':
          router.push('/dashboard/patient');
          break;
        case 'doctor':
          router.push('/dashboard/doctor');
          break;
        case 'admin':
          router.push('/dashboard/admin');
          break;
        case 'staff':
          router.push('/dashboard/staff');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-gray-900">
      {/* Left: Image panel for desktop with white background */}
      <aside className="relative hidden lg:flex items-center justify-center bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/HMS-login1.png"
          alt="Healthcare illustration"
          className="max-w-full max-h-screen object-contain"
        />
      </aside>

      {/* Right: Login card on white background */}
      <main className="flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-xl">
          <div className="mx-auto w-full max-w-lg rounded-2xl bg-gray-800 border border-gray-700 shadow-xl">
            <div className="px-6 sm:px-8 pt-7 pb-6">
              <h1 className="text-center text-2xl font-semibold text-white">Login</h1>
              <p className="text-center text-sm text-gray-300 mt-1">
                Sign in to your account
              </p>

              <div className="mt-6 border-t border-gray-700" />

              {error && (
                <p className="mt-4 text-sm text-red-400 bg-red-900/20 border border-red-700 rounded-md px-3 py-2 text-center">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-11 rounded-lg border border-gray-600 bg-gray-900 px-3 text-gray-100 placeholder-gray-400
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={reveal ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full h-11 rounded-lg border border-gray-600 bg-gray-900 px-3 pr-14 text-gray-100 placeholder-gray-400
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setReveal((v) => !v)}
                      className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-r-md"
                      aria-label={reveal ? 'Hide password' : 'Show password'}
                    >
                      {reveal ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 rounded-lg bg-blue-600 text-white font-semibold shadow-sm
                             hover:bg-blue-700 transition-colors
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Signing in…' : 'Log In'}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-gray-300">
                Don&apos;t have an account?{' '}
                <Link href="/signup/patient" className="text-blue-400 hover:text-blue-500 underline underline-offset-4">
                  Sign up now
                </Link>
              </p>
            </div>
          </div>

          {/* Mobile image stacked on top */}
          <div className="lg:hidden mt-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/medical-hero.jpg"
              alt="Healthcare"
              className="w-full h-44 object-cover rounded-xl border border-gray-700"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
