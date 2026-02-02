'use client';

import { useState } from 'react'; // <-- needed for mobileOpen
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false); // <-- declare state

  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-6 left-1/2 z-50 w-[95%] md:w-[90%] -translate-x-1/2
                 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl
                 border border-white/20 dark:border-neutral-800
                 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)]
                 px-6 py-4 md:px-10 flex items-center justify-between"
    >
      {/* Left: Logo + Name */}
      <Link
        href="/"
        className="flex items-center gap-3 transition-transform duration-300 hover:scale-105"
      >
        <Image
          src="/images/HMS.ico"
          alt="Hospital Logo"
          width={60}
          height={60}
          className="rounded-lg object-contain"
        />
        <span className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Hospify
        </span>
      </Link>

      {/* Center: Nav Links */}
      <div className="hidden md:flex items-center gap-10 text-[17px] font-medium">
        <Link
          href="/"
          className="text-bold text-neutral-700 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Home
        </Link>
        <Link
          href="/about"
          className="text-neutral-700 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          About Us
        </Link>
        <Link
          href="/services"
          className="text-neutral-700 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Services
        </Link>
        <Link
          href="/doctors"
          className="text-neutral-700 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Doctors
        </Link>
        <Link
          href="/contact"
          className="text-neutral-700 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Contact
        </Link>
      </div>

      {/* Mobile hamburger */}
      <div className="md:hidden flex items-center gap-2">
        <button
          aria-label="Menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 rounded-lg border border-slate-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      {/* Right: Login Button */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="hidden sm:block">
        <Link
          href="/login"
          className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 
                     text-white font-semibold shadow-md hover:shadow-blue-300/50 transition-all"
        >
          Login
        </Link>
      </motion.div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="absolute top-full left-0 mt-3 w-full md:hidden bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xl p-4">
          <nav className="space-y-2">
            <Link href="/" className="block px-2 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-neutral-800">Home</Link>
            <Link href="/about" className="block px-2 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-neutral-800">About Us</Link>
            <Link href="/services" className="block px-2 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-neutral-800">Services</Link>
            <Link href="/doctors" className="block px-2 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-neutral-800">Doctors</Link>
            <Link href="/contact" className="block px-2 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-neutral-800">Contact</Link>
            <Link href="/login" className="inline-block mt-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold">Login</Link>
          </nav>
        </div>
      )}
    </motion.nav>
  );
}
