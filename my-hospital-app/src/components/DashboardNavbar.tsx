'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { BellIcon } from '@heroicons/react/24/outline';
import { FiMenu, FiX, FiSun, FiMoon } from 'react-icons/fi';
import { useState, useEffect } from 'react';

interface NavLink {
  name: string;
  href: string;
}

interface DashboardNavbarProps {
  title: string;
  navLinks: NavLink[];
  userName: string;
}

export default function DashboardNavbar({ title, navLinks, userName }: DashboardNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Load user's theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Handle theme toggle
  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <nav className="bg-slate-900/30 dark:bg-white/10 backdrop-blur-md border-b border-white/10 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left section: Logo + title */}
        <Link 
          href="/dashboard/patient" 
          className="flex items-center space-x-2 transition duration-300 transform hover:scale-105"
        >
          <Image 
            src="/images/HMS.ico" 
            alt="Hospital Logo" 
            width={40} 
            height={40} 
            className="rounded-full object-cover"
          />
          <span className="text-2xl font-extrabold text-cyan-300 dark:text-cyan-400 tracking-wide">
            {title}
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-6 text-lg">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`transition duration-300 transform hover:scale-105 ${
                  isActive 
                    ? 'text-cyan-400 font-semibold' 
                    : 'text-gray-200 hover:text-cyan-300 dark:text-gray-100'
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {/* Notification */}
          <div className="relative text-gray-200 hover:text-cyan-300 dark:text-gray-100 cursor-pointer transition duration-300">
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-cyan-500 rounded-full">
              0
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="text-cyan-400 hover:text-cyan-300 transition"
          >
            {darkMode ? <FiSun size={22} /> : <FiMoon size={22} />}
          </button>

          {/* User Name */}
          <span className="text-gray-100 dark:text-gray-200 font-semibold">{userName}</span>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-full hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
          >
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center space-x-3">
          {/* Theme toggle (mobile) */}
          <button
            onClick={toggleTheme}
            className="text-cyan-400 hover:text-cyan-300 transition"
          >
            {darkMode ? <FiSun size={22} /> : <FiMoon size={22} />}
          </button>

          {/* Hamburger Menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-cyan-400 hover:text-cyan-300 transition"
          >
            {menuOpen ? <FiX size={26} /> : <FiMenu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden bg-slate-900/90 dark:bg-white/20 backdrop-blur-md border-t border-slate-700 text-gray-100 dark:text-gray-200 py-4 px-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`block text-lg ${
                pathname === link.href ? 'text-cyan-400 font-semibold' : 'hover:text-cyan-300'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}

          <div className="flex justify-between items-center pt-3 border-t border-slate-700 mt-2">
            <span className="font-semibold">{userName}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full text-sm font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
